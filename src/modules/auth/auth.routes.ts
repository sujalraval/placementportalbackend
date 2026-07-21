import { Router } from 'express';
import * as controller from './auth.controller.ts';
import * as oauth from './oauth.controller.ts';
import { requireAuth } from '../../middleware/authenticate.ts';

const authRouter = Router();

// --- Local email/password ---------------------------------------------------
authRouter.post('/login', controller.login);
authRouter.post('/register/student', controller.registerStudent);
authRouter.post('/register/recruiter', controller.registerRecruiter);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);

// OTP Routes
authRouter.post('/otp/request', controller.requestOtp);
authRouter.post('/otp/verify', controller.verifyOtp);

// --- Federated sign-in ------------------------------------------------------
// Available to every role: students and recruiters as asked for, and staff on
// Outlook too.
authRouter.get('/oauth/providers', oauth.listProviders);
authRouter.get('/oauth/:provider/start', oauth.start);
authRouter.get('/oauth/:provider/callback', oauth.callback);

// Finishing an OAuth-bootstrapped signup. Public — the ticket is the
// credential, and no session exists yet by definition.
authRouter.post('/oauth/complete/student', oauth.completeStudent);
authRouter.post('/oauth/complete/recruiter', oauth.completeRecruiter);

// --- Authenticated ----------------------------------------------------------
authRouter.get('/me', requireAuth, controller.me);
authRouter.post('/logout-everywhere', requireAuth, controller.logoutEverywhere);
// Linking a second provider requires an existing session — that's the whole
// point; see the note on AuthIdentity in schema.prisma.
authRouter.get('/oauth/:provider/link/start', requireAuth, oauth.start);
authRouter.get('/oauth/:provider/link/callback', requireAuth, oauth.linkCallback);

export { authRouter };
