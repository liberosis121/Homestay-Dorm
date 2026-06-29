import { Router, Request, Response } from 'express';
import { requireAuth, supabaseAdmin } from '../middleware/auth.middleware';
import { adminRoomsService } from '../services/admin-rooms.service';

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

// ─── ROOMS ───────────────────────────────────────────────────────────────
router.get('/rooms', async (req: Request, res: Response) => {
  try {
    const data = await adminRoomsService.getAllRooms();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/rooms', async (req: Request, res: Response) => {
  try {
    const data = await adminRoomsService.createRoom(req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/rooms/:id', async (req: Request, res: Response) => {
  try {
    const data = await adminRoomsService.updateRoom(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── BEDS ────────────────────────────────────────────────────────────────
router.get('/rooms/:roomId/beds', async (req: Request, res: Response) => {
  try {
    const data = await adminRoomsService.getBedsByRoom(req.params.roomId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/beds', async (req: Request, res: Response) => {
  try {
    const data = await adminRoomsService.createBed(req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/beds/:id', async (req: Request, res: Response) => {
  try {
    const data = await adminRoomsService.updateBed(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
