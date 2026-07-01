import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { depositInvoiceService } from '../services/deposit-invoice.service';
import { checkinInvoiceService } from '../services/checkin-invoice.service';
import { monthlyInvoiceService } from '../services/monthly-invoice.service';
import { refundService } from '../services/refund.service';
import { payoutService } from '../services/payout.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { USER_ROLE } from '../types/constants';

const router = Router();

// Ap dung quyen ke toan cho toan bo cac route con
router.use(requireAuth, requireRole(USER_ROLE.ACCOUNTANT));

// ============================================================
// 1. HOA DON DAT COC (Deposit Invoices)
// ============================================================

/**
 * 🔗 GET /api/accountant/deposit-requests/pending
 * 📝 Lay danh sach phieu dat coc dang cho lap hoa don.
 */
router.get('/deposit-requests/pending', async (req, res) => {
  try {
    const data = await depositInvoiceService.getPendingRequests();
    return sendSuccess(res, data, 'Lay danh sach phieu dat coc cho thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay danh sach phieu dat coc.');
  }
});

/**
 * 🔗 GET /api/accountant/deposit-invoices
 * 📝 Lay toan bo danh sach hoa don dat coc da lap.
 */
router.get('/deposit-invoices', async (req, res) => {
  try {
    const data = await depositInvoiceService.getDepositInvoices();
    return sendSuccess(res, data, 'Lay danh sach hoa don dat coc thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay hoa don dat coc.');
  }
});

/**
 * 🔗 POST /api/accountant/deposit-invoices
 * 📝 Tao hoa don dat coc moi.
 */
router.post('/deposit-invoices', async (req, res) => {
  try {
    const { requestId, customerId, roomId, amount, deadlineType, paymentMethod, note } = req.body;
    const staffId = req.profile!.id;

    const invoice = await depositInvoiceService.createInvoice({
      requestId,
      customerId,
      roomId,
      amount,
      deadlineType,
      paymentMethod,
      note,
      staffId
    });

    return sendSuccess(res, invoice, 'Tao hoa don dat coc thanh cong!', 201);
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi tao hoa don dat coc.');
  }
});

// ============================================================
// 2. HOA DON NHAN PHONG (Check-in Invoices)
// ============================================================

/**
 * 🔗 GET /api/accountant/checkin-invoices
 * 📝 Lay danh sach hoa don nhan phong.
 */
router.get('/checkin-invoices', async (req, res) => {
  try {
    const data = await checkinInvoiceService.getInvoices();
    return sendSuccess(res, data, 'Lay danh sach hoa don nhan phong thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay danh sach hoa don nhan phong.');
  }
});

/**
 * 🔗 POST /api/accountant/checkin-invoices
 * 📝 Lap hoa don nhan phong moi.
 */
router.post('/checkin-invoices', async (req, res) => {
  try {
    const { contractId, amount, paymentMethod, note } = req.body;
    const staffId = req.profile!.id;

    const invoice = await checkinInvoiceService.createInvoice({
      contractId,
      amount,
      paymentMethod,
      staffId,
      note
    });

    return sendSuccess(res, invoice, 'Lap hoa don nhan phong thanh cong!', 201);
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lap hoa don nhan phong.');
  }
});

// ============================================================
// 3. HOA DON DINH KY (Monthly Invoices)
// ============================================================

/**
 * 🔗 GET /api/accountant/active-contracts
 * 📝 Lay danh sach cac hop dong active dang cho ghi so dien nuoc.
 */
router.get('/active-contracts', async (req, res) => {
  try {
    const data = await monthlyInvoiceService.getActiveContracts();
    return sendSuccess(res, data, 'Lay danh sach hop dong active thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay hop dong active.');
  }
});

/**
 * 🔗 GET /api/accountant/monthly-invoices
 * 📝 Lay toan bo danh sach hoa don dinh ky.
 */
router.get('/monthly-invoices', async (req, res) => {
  try {
    const data = await monthlyInvoiceService.getInvoices();
    return sendSuccess(res, data, 'Lay danh sach hoa don dinh ky thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay danh sach hoa don dinh ky.');
  }
});

/**
 * 🔗 GET /api/accountant/monthly-invoices/latest-reading/:roomId
 * 📝 Lay chi so dien nuoc gan nhat cua phong de tinh toan o client.
 */
router.get('/monthly-invoices/latest-reading/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const data = await monthlyInvoiceService.getLatestReading(roomId);
    return sendSuccess(res, data, 'Lay chi so dien nuoc gan nhat thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay chi so dien nuoc gan nhat.');
  }
});

/**
 * 🔗 POST /api/accountant/monthly-invoices
 * 📝 Lap hoa don dinh ky va ghi nhan so dien nuoc.
 */
router.post('/monthly-invoices', async (req, res) => {
  try {
    const {
      contractId,
      roomId,
      billingPeriod,
      prevElectricity,
      newElectricity,
      prevWater,
      newWater,
      rentPrice,
      servicePrice,
      note
    } = req.body;
    const staffId = req.profile!.id;

    const invoice = await monthlyInvoiceService.createInvoice({
      contractId,
      roomId,
      billingPeriod,
      prevElectricity,
      newElectricity,
      prevWater,
      newWater,
      rentPrice,
      servicePrice,
      staffId,
      note
    });

    return sendSuccess(res, invoice, 'Lap hoa don dinh ky thanh cong!', 201);
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lap hoa don dinh ky.');
  }
});

// ============================================================
// 4. DOI SOAT HOAN COC (Refund Reconciliations)
// ============================================================

/**
 * 🔗 GET /api/accountant/checkouts/pending
 * 📝 Lay don yeu cau tra phong cho doi soat hoan coc.
 */
router.get('/checkouts/pending', async (req, res) => {
  try {
    const data = await refundService.getPendingCheckouts();
    return sendSuccess(res, data, 'Lay danh sach yeu cau tra phong cho doi soat thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay yeu cau tra phong.');
  }
});

/**
 * 🔗 GET /api/accountant/refunds
 * 📝 Lay toan bo danh sach phieu doi soat hoan coc.
 */
router.get('/refunds', async (req, res) => {
  try {
    const data = await refundService.getReconciliations();
    return sendSuccess(res, data, 'Lay danh sach doi soat hoan coc thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay danh sach doi soat.');
  }
});

/**
 * 🔗 POST /api/accountant/refunds
 * 📝 Tao ban doi soat hoan coc moi.
 */
router.post('/refunds', async (req, res) => {
  try {
    const {
      checkoutId,
      contractId,
      originalDeposit,
      refundRate,
      baseRefund,
      totalDeductions,
      finalRefund,
      additionalCharge,
      note
    } = req.body;
    const staffId = req.profile!.id;

    const reconciliation = await refundService.createReconciliation({
      checkoutId,
      contractId,
      originalDeposit,
      refundRate,
      baseRefund,
      totalDeductions,
      finalRefund,
      additionalCharge,
      note,
      staffId
    });

    return sendSuccess(res, reconciliation, 'Lap ban doi soat hoan coc thanh cong!', 201);
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lap ban doi soat hoan coc.');
  }
});

// ============================================================
// 5. PHIEU CHI TIEN & QUYET TOAN (Payouts)
// ============================================================

/**
 * 🔗 GET /api/accountant/payouts
 * 📝 Lay danh sach phieu chi hoan coc.
 */
router.get('/payouts', async (req, res) => {
  try {
    const data = await payoutService.getPayouts();
    return sendSuccess(res, data, 'Lay danh sach phieu chi hoan coc thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay phieu chi.');
  }
});

/**
 * 🔗 POST /api/accountant/payouts/:id/confirm
 * 📝 Xac nhan chi tiền va hoan tat thanh ly.
 */
router.post('/payouts/:id/confirm', async (req, res) => {
  try {
    const payoutId = req.params.id;
    const { accountDetails, paymentMethod } = req.body;

    const data = await payoutService.confirmPayout(payoutId, accountDetails, paymentMethod);
    return sendSuccess(res, data, 'Xac nhan chi tien va thanh ly hop dong thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi xac nhan chi tien.');
  }
});

export default router;
