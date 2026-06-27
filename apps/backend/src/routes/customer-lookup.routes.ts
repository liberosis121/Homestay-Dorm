import { Router, Request, Response } from 'express';
import { requireAuth, supabaseAdmin } from '../middleware/auth.middleware';
import { customerLookupService } from '../services/customer-lookup.service';

const router = Router();

const requireStaff = async (req: Request, res: Response, next: any) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || profile.role === 'customer') {
      return res.status(403).json({ success: false, message: 'Forbidden: Staff access required' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Staff validation error', error: err });
  }
};

router.use(requireAuth, requireStaff);

router.get('/customers', async (req: Request, res: Response) => {
  try {
    const data = await customerLookupService.searchCustomers({
      name: req.query.name as string | undefined,
      cccd: req.query.cccd as string | undefined,
      phone: req.query.phone as string | undefined,
      email: req.query.email as string | undefined
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/customers/:cccd', async (req: Request, res: Response) => {
  try {
    const data = await customerLookupService.getCustomerDetail(req.params.cccd);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
