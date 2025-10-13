import { Router } from 'express';
import { login, logout } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/logout', authenticateToken, logout);

export default router;