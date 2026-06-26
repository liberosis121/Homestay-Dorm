import { Router } from 'express';
import authRoutes from './auth.routes';
import contractRoutes from './contract.routes';
import invoiceRoutes from './invoice.routes';
import serviceRegistrationRoutes from './service-registration.routes';
import checkoutRoutes from './checkout.routes';
import adminCustomersRoutes from './admin-customers.routes';
import adminEmployeesRoutes from './admin-employees.routes';
import adminConditionsRoutes from './admin-conditions.routes';
import adminAssetsRoutes from './admin-assets.routes';
import roomRoutes from './room.routes';
import leaseRegistrationRoutes from './lease-registration.routes';
import viewingScheduleRoutes from './viewing-schedule.routes';
import customerDepositRoutes from './customer-deposit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/contracts', contractRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/service-registrations', serviceRegistrationRoutes);
router.use('/checkouts', checkoutRoutes);
router.use('/admin', adminCustomersRoutes);
router.use('/admin', adminEmployeesRoutes);
router.use('/admin', adminConditionsRoutes);
router.use('/admin', adminAssetsRoutes);
router.use('/lease-registrations', leaseRegistrationRoutes);
router.use('/viewing-schedules', viewingScheduleRoutes);
router.use('/deposit-requests', customerDepositRoutes);
router.use('/', roomRoutes);

export default router;