import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateSurveyInput, AddQuestionInput, SubmitResponseInput } from './support.schema.ts';

export async function listSurveys(user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  if (user.role === 'ADMIN' || user.role === 'COORDINATOR') {
    return prisma.survey.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  // Determine audience based on role
  let audience = '';
  if (user.role === 'STUDENT') audience = 'STUDENTS';
  if (user.role === 'RECRUITER') audience = 'RECRUITERS';

  if (user.role === 'FACULTY') audience = 'FACULTY';

  const now = new Date();

  return prisma.survey.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [{ audience }, { audience: 'ALL' }],
      AND: [
        { OR: [{ opensAt: null }, { opensAt: { lte: now } }] },
        { OR: [{ closesAt: null }, { closesAt: { gte: now } }] }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getSurveyById(id: string, user: Express.Request['user']) {
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { sequence: 'asc' } }
    }
  });

  if (!survey) throw ApiError.notFound('Survey not found');

  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    if (survey.status !== 'PUBLISHED') throw ApiError.forbidden('Survey is not available');
    
    let audience = '';
    if (user?.role === 'STUDENT') audience = 'STUDENTS';
    if (user?.role === 'RECRUITER') audience = 'RECRUITERS';
    if (user?.role === 'FACULTY') audience = 'FACULTY';

    if (survey.audience !== 'ALL' && survey.audience !== audience) {
      throw ApiError.forbidden('Survey is not intended for your role');
    }

    const now = new Date();
    if (survey.opensAt && survey.opensAt > now) throw ApiError.forbidden('Survey is not open yet');
    if (survey.closesAt && survey.closesAt < now) throw ApiError.forbidden('Survey is closed');
  }

  return survey;
}

export async function createSurvey(input: CreateSurveyInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can create surveys');
  }

  return prisma.survey.create({
    data: {
      ...input,
      opensAt: input.opensAt ? new Date(input.opensAt) : null,
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      createdByUserId: user.sub,
      status: 'DRAFT',
    }
  });
}

export async function addQuestion(surveyId: string, input: AddQuestionInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can add survey questions');
  }

  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey) throw ApiError.notFound('Survey not found');

  return prisma.surveyQuestion.create({
    data: {
      surveyId,
      ...input,
    }
  });
}

export async function submitResponse(surveyId: string, input: SubmitResponseInput, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  // Validate survey is open for user
  const survey = await getSurveyById(surveyId, user); // will throw if not accessible

  const existing = await prisma.surveyResponse.findUnique({
    where: { surveyId_userId: { surveyId, userId: user.sub } }
  });
  if (existing) {
    throw ApiError.conflict('You have already responded to this survey');
  }

  // Ensure all required questions are answered
  const questionMap = new Map(survey.questions.map(q => [q.id, q]));
  for (const q of survey.questions) {
    if (q.required && !input.answers.find(a => a.questionId === q.id)) {
      throw ApiError.badRequest(`Missing required answer for question: ${q.text}`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const response = await tx.surveyResponse.create({
      data: {
        surveyId,
        userId: user.sub,
      }
    });

    const answerData = input.answers
      .filter(a => questionMap.has(a.questionId)) // only answer valid questions
      .map(a => ({
        responseId: response.id,
        questionId: a.questionId,
        value: a.value
      }));

    if (answerData.length > 0) {
       await tx.surveyAnswer.createMany({
         data: answerData
       });
    }

    return response;
  });
}
