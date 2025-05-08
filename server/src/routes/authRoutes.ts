import { Router } from 'express';
import AuthController from '../controllers/authController';
import { AuthService } from '../services/authService';
import { AuthRepository } from '../repository/authRepository';
import { authenticate } from '../middlewares/authMiddlewar';

const router = Router();
const authRepository = new AuthRepository()
const authService = new AuthService(authRepository)
const authController = new AuthController(authService);

router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.get('/fetchUser', authenticate, authController.fetchUser.bind(authController));

export default router;