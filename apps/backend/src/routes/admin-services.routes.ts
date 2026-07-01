import { Router, Request, Response } from 'express';
import { requireAuth, supabaseAdmin } from '../middleware/auth.middleware';
import { adminServicesService } from '../services/admin-services.service';

const router = Router();

const getErrorStatus = (err: unknown) => {
  const statusCode = (err as { statusCode?: unknown })?.statusCode;
  return typeof statusCode === 'number' ? statusCode : 500;
};

const getErrorMessage = (err: unknown) => {
  return err instanceof Error ? err.message : 'Unexpected error';
};

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

router.get('/services', async (req: Request, res: Response) => {
  try {
    const data = await adminServicesService.getAllServices();
    res.json({ success: true, data });
  } catch (err: unknown) {
    res.status(getErrorStatus(err)).json({ success: false, message: getErrorMessage(err) });
  }
});

router.post('/services', async (req: Request, res: Response) => {
  try {
    const data = await adminServicesService.createService(req.body);
    res.json({ success: true, data });
  } catch (err: unknown) {
    res.status(getErrorStatus(err)).json({ success: false, message: getErrorMessage(err) });
  }
});

router.put('/services/:id', async (req: Request, res: Response) => {
  try {
    const data = await adminServicesService.updateService(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: unknown) {
    res.status(getErrorStatus(err)).json({ success: false, message: getErrorMessage(err) });
  }
});

export default router;
