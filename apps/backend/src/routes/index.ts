import { Router } from 'express';
import authRoutes from './auth.routes';
import contractRoutes from './contract.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/contracts', contractRoutes);

export default router;