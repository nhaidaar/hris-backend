import { Router } from 'express';
import { login, logout, register, refreshToken } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', authenticateToken, register);
router.post('/logout', authenticateToken, logout);
router.post('/refresh-token', refreshToken);

export default router;