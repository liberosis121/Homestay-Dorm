import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { customerDepositService } from './services/customer-deposit.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Minh chứng thanh toán được gửi dưới dạng data URI base64 nên body có thể lớn.
// Mặc định express.json() chỉ cho 100KB -> nâng lên 10MB để không bị PayloadTooLargeError.
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Homestay Dorm API Server!' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Error]:', err);
  // Tôn trọng mã lỗi mà body-parser (và các middleware khác) gắn sẵn, thay vì luôn trả 500.
  const status = err?.status || err?.statusCode || 500;
  const message = err?.type === 'entity.too.large'
    ? 'Tệp minh chứng quá lớn. Vui lòng chọn ảnh nhỏ hơn (tối đa 10MB).'
    : status !== 500 && err?.message
      ? err.message
      : 'Unhandled Server Error';
  res.status(status).json({ success: false, message });
});

app.listen(PORT, () => {
  console.log(`[Server]: Run successfully on port ${PORT}`);

  // Chạy quét các phiếu cọc quá hạn tự động
  setInterval(() => {
    customerDepositService.autoCancelExpiredDeposits()
      .catch(err => console.error('[DepositAutoCancel Error]:', err));
  }, 5 * 60 * 1000); // 5 phút một lần

  // Chạy quét ngay lập tức khi khởi động server
  customerDepositService.autoCancelExpiredDeposits()
    .catch(err => console.error('[Startup DepositAutoCancel Error]:', err));
});