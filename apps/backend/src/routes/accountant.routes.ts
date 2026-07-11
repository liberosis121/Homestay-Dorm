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
 * 🔗 GET /api/accountant/monthly-invoices/services/:contractId
 * 📝 Lay danh sach dich vu co dinh hop dong da dang ky (du lieu that, thay cho Mock DB).
 */
router.get('/monthly-invoices/services/:contractId', async (req, res) => {
  try {
    const data = await monthlyInvoiceService.getContractServices(req.params.contractId);
    return sendSuccess(res, data, 'Lay danh sach dich vu dang ky thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay danh sach dich vu dang ky.');
  }
});

/**
 * 🔗 GET /api/accountant/monthly-invoices/incidentals/:contractId
 * 📝 Lay danh sach khoan phi phat sinh (incidental_costs) that cua hop dong.
 */
router.get('/monthly-invoices/incidentals/:contractId', async (req, res) => {
  try {
    const data = await monthlyInvoiceService.getContractIncidentals(req.params.contractId);
    return sendSuccess(res, data, 'Lay danh sach phi phat sinh thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay danh sach phi phat sinh.');
  }
});

/**
 * 🔗 POST /api/accountant/monthly-invoices/incidentals
 * 📝 Ghi nhan mot khoan phi phat sinh moi cho hop dong.
 */
router.post('/monthly-invoices/incidentals', async (req, res) => {
  try {
    const { id, contractId, costName, amount, status, recordedDate } = req.body;
    const staffId = req.profile!.id;
    const data = await monthlyInvoiceService.createContractIncidental({
      id, contractId, costName, amount, status, recordedDate, staffId
    });
    return sendSuccess(res, data, 'Ghi nhan khoan phi phat sinh thanh cong!', 201);
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi ghi nhan khoan phi phat sinh.');
  }
});

/**
 * 🔗 PATCH /api/accountant/monthly-invoices/incidentals/:id/status
 * 📝 Cap nhat trang thai (xac nhan) mot khoan phi phat sinh.
 */
router.patch('/monthly-invoices/incidentals/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const data = await monthlyInvoiceService.updateContractIncidentalStatus(req.params.id, status);
    return sendSuccess(res, data, 'Cap nhat trang thai khoan phi phat sinh thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi cap nhat trang thai khoan phi phat sinh.');
  }
});

/**
 * 🔗 DELETE /api/accountant/monthly-invoices/incidentals/:id
 * 📝 Xoa mot khoan phi phat sinh chua dua vao hoa don.
 */
router.delete('/monthly-invoices/incidentals/:id', async (req, res) => {
  try {
    await monthlyInvoiceService.deleteContractIncidental(req.params.id);
    return sendSuccess(res, null, 'Xoa khoan phi phat sinh thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi xoa khoan phi phat sinh.');
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
 * 🔗 GET /api/accountant/cancellation-refunds
 * 📝 Lay ung vien hoan coc khi chua ky HD (hoan 80%): da coc paid nhung khong co contract.
 */
router.get('/cancellation-refunds', async (req, res) => {
  try {
    const data = await refundService.getCancellationRefunds();
    return sendSuccess(res, data, 'Lay danh sach hoan coc chua ky HD thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay danh sach hoan coc chua ky HD.');
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

/**
 * 🔗 GET /api/accountant/contracts/:contractId/services
 * 📝 Lay danh sach dang ky dich vu thuc te cua mot hop dong.
 */
router.get('/contracts/:contractId/services', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { serviceRegistrationRepo } = require('../repositories/service-registration.repo');
    const data = await serviceRegistrationRepo.findSubscriptionsByContractIds([contractId]);
    return sendSuccess(res, data, 'Lay danh sach dang ky dich vu thanh cong!');
  } catch (err: any) {
    return sendError(res, err, err.message || 'Loi khi lay danh sach dang ky dich vu.');
  }
});

export default router;
