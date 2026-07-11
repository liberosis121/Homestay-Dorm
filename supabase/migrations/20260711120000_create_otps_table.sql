-- Tạo bảng lưu trữ OTP tạm thời cho chức năng khôi phục mật khẩu
CREATE TABLE IF NOT EXISTS public.otps (
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expired_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (email)
);

-- Cho phép service role full access, không cần Row Level Security vì đây chỉ
-- được truy cập từ backend qua service role key
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;

-- Chỉ service role (backend) mới có thể đọc/ghi bảng này
CREATE POLICY "service_role_only" ON public.otps
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
