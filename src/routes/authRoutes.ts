import { Router } from 'express';
import { 
    login, 
    logout, 
    register, 
    refreshToken, 
    otpResetPassword, 
    verifyResetPassword, 
    resetPassword 
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', authenticateToken, register);
router.post('/logout', authenticateToken, logout);
router.post('/refresh-token', refreshToken);

router.post('/reset-password', otpResetPassword);
router.post('/reset-password/verify', verifyResetPassword);
router.put('/reset-password', authenticateToken, resetPassword);

export default router;