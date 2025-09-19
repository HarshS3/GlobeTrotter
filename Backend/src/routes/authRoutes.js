import express from 'express';
import { validate } from '../middleware/validate.js';
import { register, registerSchema, login, loginSchema, logout, refresh, status, setup2fa, verify2fa, verify2faSchema, reset2fa, forgotPassword, forgotPasswordSchema, resetPassword, resetPasswordSchema } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/logout', authenticate(), logout);
router.post('/refresh', refresh);
router.get('/status', authenticate(true), status);
router.post('/2fa/setup', authenticate(), setup2fa);
router.post('/2fa/verify', authenticate(), validate({ body: verify2faSchema }), verify2fa);
router.post('/2fa/reset', authenticate(), reset2fa);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);

export default router;
