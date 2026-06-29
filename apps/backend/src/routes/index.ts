import { Router } from 'express';
import authRoutes from './auth.routes';
import managerRoutes from './manager.routes';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use('/auth', authRoutes);
router.use('/manager', managerRoutes);

export default router;