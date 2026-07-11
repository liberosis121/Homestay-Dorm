/**
 * email.helper.ts — Gửi email qua NodeMailer.
 *
 * Chiến lược 2 transporter:
 *  - realTransporter: Gmail SMTP (gửi thật tới địa chỉ @gmail.com thực)
 *  - mockTransporter: Mailtrap (bắt email từ seed/test accounts, không gửi ra ngoài)
 *
 * Logic fallback:
 *  - Email @gmail.com → ưu tiên realTransporter.
 *    Nếu gửi thật thất bại (mail ảo, lỗi SMTP...) → tự động fallback sang Mailtrap.
 *  - Email khác (@homestay.com, @yahoo.com...) → gửi thẳng Mailtrap.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─── Real Transporter (Gmail SMTP) ────────────────────────────────────────────
const realTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Google App Password (không phải mật khẩu Gmail thường)
  },
});

// ─── Mock Transporter (Mailtrap) ──────────────────────────────────────────────
const mockTransporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

// ─── Nội dung HTML email OTP ──────────────────────────────────────────────────
function buildOtpEmailHtml(otp: string): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #3d4e3a; font-size: 22px; margin: 0;">🏠 Homestay & Dorm</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Hệ thống quản lý lưu trú sinh viên</p>
      </div>

      <div style="background: white; border-radius: 12px; padding: 28px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
        <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 12px;">Mã xác thực khôi phục mật khẩu</h2>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Bạn vừa yêu cầu khôi phục mật khẩu. Sử dụng mã OTP bên dưới để tiếp tục.
          Mã này <strong>có hiệu lực trong 5 phút</strong>.
        </p>

        <div style="background: #f0f4ef; border: 2px dashed #4a6549; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #3d4e3a; font-family: monospace;">${otp}</span>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
          Nếu bạn không yêu cầu khôi phục mật khẩu, hãy bỏ qua email này.
          Tài khoản của bạn vẫn an toàn.
        </p>
      </div>

      <p style="color: #d1d5db; font-size: 11px; text-align: center; margin: 0;">
        © 2026 Homestay & Dorm Management System. Mã OTP chỉ dùng 1 lần và hết hạn sau 5 phút.
      </p>
    </div>
  `;
}

// Helpers to check if credentials are placeholders or empty
const isRealConfigured = (): boolean => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  return !!(user && user !== 'your_gmail@gmail.com' && pass && pass !== 'your_google_app_password_here');
};

const isMockConfigured = (): boolean => {
  const user = process.env.MAILTRAP_USER;
  const pass = process.env.MAILTRAP_PASS;
  return !!(user && user !== 'your_mailtrap_user' && pass && pass !== 'your_mailtrap_password');
};

// ─── Hàm gửi OTP email ────────────────────────────────────────────────────────
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  // Always log OTP to backend console so developers can see it instantly
  console.log(`\n==================================================`);
  console.log(`🔑 [OTP SYSTEM] MÃ OTP CỦA BẠN LÀ: ${otp}`);
  console.log(`📧 Gửi tới email: ${email}`);
  console.log(`==================================================\n`);

  const mailOptions = {
    from: `"Homestay & Dorm" <${process.env.GMAIL_USER || 'noreply@homestay.com'}>`,
    to: email,
    subject: `[Homestay & Dorm] Mã OTP khôi phục mật khẩu: ${otp}`,
    html: buildOtpEmailHtml(otp),
  };

  const isGmail = email.toLowerCase().endsWith('@gmail.com');

  if (isGmail && isRealConfigured()) {
    try {
      // Thử gửi thật trước
      await realTransporter.sendMail(mailOptions);
      console.log(`[EmailHelper] OTP sent via REAL SMTP to: ${email}`);
      return;
    } catch (realError: any) {
      console.warn(
        `[EmailHelper] REAL SMTP failed for ${email}: ${realError.message}. Falling back to Mailtrap...`
      );
    }
  }

  // Fallback to Mailtrap or default if mock is configured
  if (isMockConfigured()) {
    try {
      await mockTransporter.sendMail(mailOptions);
      console.log(`[EmailHelper] OTP sent via MAILTRAP for: ${email}`);
      return;
    } catch (mockError: any) {
      console.error(`[EmailHelper] Mailtrap SMTP failed: ${mockError.message}`);
    }
  }

  // If both failed or are not configured, print warnings and succeed anyway to allow testing via console log
  console.warn(
    `⚠️ [EmailHelper] Chưa cấu hình SMTP/Mailtrap hoặc gửi email lỗi. Mã OTP đã được in ra console của Backend ở trên để kiểm thử.`
  );
}

