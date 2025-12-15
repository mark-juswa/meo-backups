import express from 'express';
import { login, logout, refreshToken, register, verifyEmail, resetPassword, forgotPassword, resendVerification } from '../controllers/authController.js';

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/refresh', refreshToken)
router.get("/verify-email/:token", verifyEmail);
router.post('/resend-verification', resendVerification);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


export default router;