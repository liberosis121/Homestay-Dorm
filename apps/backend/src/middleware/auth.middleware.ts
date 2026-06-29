import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Handle mock token for offline development
    if (token.startsWith('mock-token-')) {
      const parts = token.split('-');
      // Format: mock-token-[uuid (5 parts)]-[role]-[email]
      if (parts.length >= 9) {
        const userId = parts.slice(2, 7).join('-');
        const role = parts[7];
        const email = parts.slice(8).join('-');

        req.user = {
          id: userId,
          email: email,
          user_metadata: {
            role: role,
            full_name: role === 'manager' ? 'Trần Thị Quản Lý' : 
                       role === 'sale' ? 'Nguyễn Văn Sale' : 
                       role === 'accountant' ? 'Lê Văn Kế Toán' : 
                       role === 'admin' ? 'Hoàng Admin' : 'User'
          }
        } as any;
        return next();
      }
    }

    // Standard Supabase authentication
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired auth token' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Authentication error', error: err });
  }
};