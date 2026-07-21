import type { RequestHandler } from 'express';
import * as service from './auth.service.ts';
import * as sessions from './session.service.ts';
import { ApiError } from '../../lib/http-error.ts';
import {
  loginBody,
  refreshBody,
  registerRecruiterBody,
  registerStudentRefined,
} from './auth.schema.ts';

function context(req: Parameters<RequestHandler>[0]) {
  return { userAgent: req.get('user-agent'), ipAddress: req.ip };
}

export const login: RequestHandler = async (req, res) => {
  const body = loginBody.parse(req.body);
  const { user, session } = await service.login(body, context(req));
  res.json({ data: { user, ...session } });
};

export const registerStudent: RequestHandler = async (req, res) => {
  const body = registerStudentRefined.parse(req.body);
  const user = await service.registerStudent(body);
  // 201, but no session: the account is PENDING until the department approves
  // it, and handing out tokens here would make that gate decorative.
  res.status(201).json({
    data: { user },
    message: 'Registration received. Your account is pending approval.',
  });
};

export const registerRecruiter: RequestHandler = async (req, res) => {
  const body = registerRecruiterBody.parse(req.body);
  const user = await service.registerRecruiter(body);
  res.status(201).json({
    data: { user },
    message:
      'Registration received. The Placement Cell will verify your company before your account is activated.',
  });
};

export const refresh: RequestHandler = async (req, res) => {
  const { refreshToken } = refreshBody.parse(req.body);
  const session = await sessions.rotateSession(refreshToken, context(req));
  res.json({ data: session });
};

export const logout: RequestHandler = async (req, res) => {
  const { refreshToken } = refreshBody.parse(req.body);
  await sessions.revokeSession(refreshToken);
  res.status(204).end();
};

import { requestOtp as reqOtpService, verifyOtp as verifyOtpService } from './otp.service.ts';

export const requestOtp: RequestHandler = async (req, res) => {
  const email = req.body.email;
  if (!email || typeof email !== 'string') {
    throw ApiError.badRequest('Email is required');
  }
  const result = await reqOtpService(email);
  res.json({ data: result });
};

export const verifyOtp: RequestHandler = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw ApiError.badRequest('Email and OTP are required');
  }
  const result = await verifyOtpService(email, otp);
  res.json({ data: result });
};

export const logoutEverywhere: RequestHandler = async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const count = await sessions.revokeAllSessions(req.user.sub);
  res.json({ data: { revokedSessions: count } });
};

export const me: RequestHandler = async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json({ data: await service.getCurrentUser(req.user.sub) });
};
