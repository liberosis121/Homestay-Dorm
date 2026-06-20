import { Router } from 'express';
import authRoutes from './auth.routes';
import contractRoutes from './contract.routes';
import invoiceRoutes from './invoice.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/contracts', contractRoutes);
router.use('/invoices', invoiceRoutes);

export default router;