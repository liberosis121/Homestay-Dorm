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

// ─── Hàm gửi OTP email ────────────────────────────────────────────────────────
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const mailOptions = {
    from: `"Homestay & Dorm" <${process.env.GMAIL_USER || 'noreply@homestay.com'}>`,
    to: email,
    subject: `[Homestay & Dorm] Mã OTP khôi phục mật khẩu: ${otp}`,
    html: buildOtpEmailHtml(otp),
  };

  const isGmail = email.toLowerCase().endsWith('@gmail.com');

  if (isGmail) {
    try {
      // Thử gửi thật trước
      await realTransporter.sendMail(mailOptions);
      console.log(`[EmailHelper] OTP sent via REAL SMTP to: ${email}`);
    } catch (realError: any) {
      // Fallback: nếu gửi thật thất bại (mail ảo, SMTP lỗi...) → chuyển qua Mailtrap
      console.warn(
        `[EmailHelper] REAL SMTP failed for ${email}: ${realError.message}. Falling back to Mailtrap...`
      );
      try {
        await mockTransporter.sendMail(mailOptions);
        console.log(`[EmailHelper] OTP sent via MAILTRAP (fallback) for: ${email}`);
      } catch (mockError: any) {
        console.error(`[EmailHelper] Mailtrap fallback also failed: ${mockError.message}`);
        throw new Error('Không thể gửi email OTP. Vui lòng kiểm tra cấu hình email của hệ thống.');
      }
    }
  } else {
    // Tài khoản không phải Gmail → gửi thẳng Mailtrap
    try {
      await mockTransporter.sendMail(mailOptions);
      console.log(`[EmailHelper] OTP sent via MAILTRAP for: ${email}`);
    } catch (mockError: any) {
      console.error(`[EmailHelper] Mailtrap failed: ${mockError.message}`);
      throw new Error('Không thể gửi email OTP. Vui lòng kiểm tra cấu hình Mailtrap.');
    }
  }
}
