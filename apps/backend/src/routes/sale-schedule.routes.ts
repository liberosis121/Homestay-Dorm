import { Router, Request, Response } from 'express';
import { requireAuth, supabaseAdmin } from '../middleware/auth.middleware';
import { saleScheduleService } from '../services/sale-schedule.service';

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

router.get('/schedules', async (req: Request, res: Response) => {
  try {
    const data = await saleScheduleService.getAllSchedules();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const data = await saleScheduleService.getScheduleById(req.params.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/schedules', async (req: Request, res: Response) => {
  try {
    const data = await saleScheduleService.createSchedule({
      ...req.body,
      staff_id: req.body.staff_id || req.user!.id
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const data = await saleScheduleService.updateSchedule(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
