import { Router, Request, Response } from 'express';
import { requireAuth, supabaseAdmin } from '../middleware/auth.middleware';
import { adminCustomersService } from '../services/admin-customers.service';

const router = Router();

// Middleware to ensure the authenticated user is an Admin
const requireAdmin = async (req: Request, res: Response, next: any) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Admin validation error', error: err });
  }
};

router.use(requireAuth, requireAdmin);

router.get('/customers', async (req: Request, res: Response) => {
  try {
    const data = await adminCustomersService.getAllCustomers();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/customers/:id/toggle-lock', async (req: Request, res: Response) => {
  try {
    const data = await adminCustomersService.toggleCustomerLock(req.params.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
