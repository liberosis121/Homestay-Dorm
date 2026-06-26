import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.util';
import { supabase } from '../utils/supabase';

const router = Router();

router.get('/me', requireAuth, (req, res) => {
  sendSuccess(res, req.user, 'Xác thực tài khoản thành công!');
});

// GET /api/auth/profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    // Query khach_hang
    const { data: customer, error: cErr } = await supabase
      .from('khach_hang')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (cErr) throw cErr;

    // Query profile as fallback
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const result = {
      full_name: customer?.full_name || profile?.full_name || '',
      email: customer?.email || profile?.email || '',
      phone: customer?.phone || profile?.phone || '',
      cccd: customer?.cccd || '',
      dob: customer?.dob || '',
      gender: customer?.gender === 'Nam' ? 'male' : (customer?.gender === 'Nữ' ? 'female' : 'other'),
      nationality: customer?.nationality || 'Việt Nam',
      permanent_address: customer?.address || '',
    };

    sendSuccess(res, result, 'Lấy thông tin cá nhân thành công!');
  } catch (err) {
    sendError(res, err, 'Lỗi khi lấy thông tin cá nhân');
  }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    const { full_name, phone, cccd, dob, gender, nationality, permanent_address } = req.body;

    const dbGender = gender === 'male' ? 'Nam' : (gender === 'female' ? 'Nữ' : 'Khác');

    // Check if khach_hang record exists
    const { data: existing } = await supabase
      .from('khach_hang')
      .select('cccd')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update khach_hang
      const { error: uErr } = await supabase
        .from('khach_hang')
        .update({
          full_name,
          phone,
          cccd: cccd || existing.cccd, // preserve existing cccd if empty
          dob: dob || null,
          gender: dbGender,
          nationality,
          address: permanent_address,
        })
        .eq('user_id', userId);
      if (uErr) throw uErr;
    } else {
      // Insert new khach_hang
      const { error: iErr } = await supabase
        .from('khach_hang')
        .insert({
          user_id: userId,
          full_name,
          phone,
          cccd: cccd || `CCCD-${Date.now()}`,
          dob: dob || null,
          gender: dbGender,
          nationality,
          email: req.user?.email || '',
          address: permanent_address,
        });
      if (iErr) throw iErr;
    }

    // Update profiles table
    const { error: pErr } = await supabase
      .from('profiles')
      .update({
        full_name,
        phone,
      })
      .eq('id', userId);
    if (pErr) throw pErr;

    sendSuccess(res, { success: true }, 'Cập nhật thông tin cá nhân thành công!');
  } catch (err) {
    sendError(res, err, 'Lỗi khi cập nhật thông tin cá nhân');
  }
});

export default router;