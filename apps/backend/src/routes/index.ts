import { Router } from 'express';
import authRoutes from './auth.routes';
import contractRoutes from './contract.routes';
import invoiceRoutes from './invoice.routes';
import serviceRegistrationRoutes from './service-registration.routes';
import checkoutRoutes from './checkout.routes';
import adminCustomersRoutes from './admin-customers.routes';
import adminEmployeesRoutes from './admin-employees.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/contracts', contractRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/service-registrations', serviceRegistrationRoutes);
router.use('/checkouts', checkoutRoutes);
router.use('/admin', adminCustomersRoutes);
router.use('/admin', adminEmployeesRoutes);

export default router;