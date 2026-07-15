import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response.util';
import { managerDepositService } from '../services/manager-deposit.service';
import { managerContractService } from '../services/manager-contract.service';
import { handoverService } from '../services/handover.service';
import { residencyService } from '../services/residency.service';
import { roomStatusService } from '../services/room-status.service';
import { incidentalCostService } from '../services/incidental-cost.service';
import { assetService } from '../services/asset.service';
import { getStaffByUserId } from '../repositories/profile.repo';
import { supabase } from '../utils/supabase';

const router = Router();

// ==========================================
// 1. DEPOSITS
// ==========================================
router.get('/deposits', async (req, res) => {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;
    const data = await managerDepositService.getDeposits({ status, search }, req.user?.id);
    sendSuccess(res, data, 'Fetched manager deposits successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/deposits/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewer_note } = req.body;
    const data = await managerDepositService.updateStatus(id, status, reviewer_note);
    sendSuccess(res, data, 'Updated deposit status successfully');
  } catch (err) {
    sendError(res, err);
  }
});

// ==========================================
// 2. CONTRACTS
// ==========================================
router.get('/contracts', async (req, res) => {
  try {
    const customer_id = req.query.customer_id as string;
    const status = req.query.status as string;
    const data = await managerContractService.getContracts({ customer_id, status }, req.user?.id);
    sendSuccess(res, data, 'Fetched contracts successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await managerContractService.getContractById(id);
    sendSuccess(res, data, 'Fetched contract details successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/contracts', async (req, res) => {
  try {
    // Lấy staff_id từ người đăng nhập (profiles.id === employees.id) nếu client không gửi,
    // thay cho id mock 'e001' cũ vốn không tồn tại trong bảng employees.
    const data = await managerContractService.createContract({
      ...req.body,
      staff_id: req.body.staff_id || req.user?.id,
    });
    sendSuccess(res, data, 'Created contract successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/contracts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const data = await managerContractService.updateContractStatus(id, status);
    sendSuccess(res, data, 'Updated contract status successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await managerContractService.updateContract(id, req.body);
    sendSuccess(res, data, 'Updated contract successfully');
  } catch (err) {
    sendError(res, err);
  }
});

// ==========================================
// 3. HANDOVERS
// ==========================================
router.get('/handovers', async (req, res) => {
  try {
    const contract_id = req.query.contract_id as string;
    const data = await handoverService.getHandovers({ contract_id }, req.user?.id);
    sendSuccess(res, data, 'Fetched handovers successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/handovers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await handoverService.getHandoverById(id);
    if (!data) {
      return sendError(res, null, `Không tìm thấy biên bản bàn giao với ID: ${id}`, 404);
    }
    sendSuccess(res, data, 'Fetched handover details successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/handovers', async (req, res) => {
  try {
    const { detailsList, ...handoverData } = req.body;

    // staff_id BẮT BUỘC là UUID nhân viên thật (FK employees.id). KHÔNG tin id do client gửi
    // (trang này gửi id mock kiểu 'u-1'/'u-2' từ localStorage → gây lỗi "invalid input syntax for type uuid").
    // Ưu tiên nhân viên của phiên đăng nhập; nếu người dùng không phải nhân viên (vd admin) thì
    // lấy nhân viên phụ trách hợp đồng của biên bản này.
    const staff = await getStaffByUserId(req.user!.id).catch(() => null);
    let staffId: string | undefined = staff?.id;
    if (!staffId && handoverData.contract_id) {
      const { data: contract } = await supabase
        .from('contracts').select('staff_id').eq('id', handoverData.contract_id).maybeSingle();
      staffId = contract?.staff_id || undefined;
    }
    if (!staffId) {
      return sendError(res, null, 'Không xác định được nhân viên phụ trách bàn giao.', 400);
    }
    handoverData.staff_id = staffId;

    const data = await handoverService.createHandover(handoverData, detailsList);
    sendSuccess(res, data, 'Created handover successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/handovers/:id/sign', async (req, res) => {
  try {
    const { id } = req.params;
    const { isStaff } = req.body;
    const data = await handoverService.signHandover(id, !!isStaff);
    sendSuccess(res, data, 'Signed handover status successfully');
  } catch (err) {
    sendError(res, err);
  }
});

// ==========================================
// 4. ASSETS
// ==========================================
router.get('/assets', async (req, res) => {
  try {
    const category = req.query.category as string;
    const status = req.query.status as string;
    
    let branch_id = req.query.branch_id as string;
    
    // Tự động tìm chi nhánh của quản lý dựa trên token đăng nhập
    if (req.user?.id) {
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('id', req.user.id)
        .maybeSingle();

      if (employee && employee.branch_id) {
        branch_id = employee.branch_id;
      } else {
        const { data: branch } = await supabase
          .from('branches')
          .select('id')
          .eq('manager_id', req.user.id)
          .maybeSingle();

        if (branch) {
          branch_id = branch.id;
        }
      }
    }

    const data = await assetService.getAssets({ category, status, branch_id });
    sendSuccess(res, data, 'Fetched assets successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/assets', async (req, res) => {
  try {
    const data = await assetService.createAsset(req.body);
    sendSuccess(res, data, 'Added new asset successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/assets/:serialNumber', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const data = await assetService.getAssetBySerialNumber(serialNumber);
    sendSuccess(res, data, 'Fetched asset by serial number successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/assets/:serialNumber', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const data = await assetService.updateAsset(serialNumber, req.body);
    sendSuccess(res, data, 'Updated asset successfully');
  } catch (err) {
    sendError(res, err);
  }
});

// ==========================================
// 5. INCIDENTAL COSTS
// ==========================================
router.get('/incidental-costs', async (req, res) => {
  try {
    const contract_id = req.query.contract_id as string;
    const status = req.query.status as string;
    const data = await incidentalCostService.getIncidentalCosts({ contract_id, status });
    sendSuccess(res, data, 'Fetched incidental costs successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/incidental-costs', async (req, res) => {
  try {
    const { assetStatusUpdate, ...costData } = req.body;
    const data = await incidentalCostService.createIncidentalCost(costData, assetStatusUpdate);
    sendSuccess(res, data, 'Created incidental cost successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/incidental-costs/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const data = await incidentalCostService.updateIncidentalCostStatus(id, status);
    sendSuccess(res, data, 'Updated incidental cost status successfully');
  } catch (err) {
    sendError(res, err);
  }
});

// ==========================================
// 6. RESIDENCY
// ==========================================
router.get('/residency', async (req, res) => {
  try {
    const contract_id = req.query.contract_id as string;
    const check_result = req.query.check_result as string;
    const data = await residencyService.getResidencyChecks({ contract_id, check_result });
    sendSuccess(res, data, 'Fetched residency records successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/residency/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await residencyService.getResidencyCheckById(id);
    sendSuccess(res, data, 'Fetched residency record details successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/residency', async (req, res) => {
  try {
    const data = await residencyService.createResidencyCheck(req.body);
    sendSuccess(res, data, 'Created residency record successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/residency/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await residencyService.updateResidencyCheck(id, req.body);
    sendSuccess(res, data, 'Updated residency status successfully');
  } catch (err) {
    sendError(res, err);
  }
});

// TH3: chốt nhóm sau kiểm tra lưu trú — hoàn cọc 1 phần cho đại diện, nhả giường người rớt,
// phần còn lại (người đạt) đi tiếp. Nếu đại diện gốc rớt → cần new_representative_user_id.
router.post('/residency/finalize', async (req, res) => {
  try {
    const { deposit_id, new_representative_user_id } = req.body;
    if (!deposit_id) return sendError(res, null, 'Thiếu deposit_id.', 400);
    const data = await residencyService.finalizeGroupResidency(deposit_id, new_representative_user_id);
    sendSuccess(res, data, 'Chốt nhóm lưu trú thành công');
  } catch (err: any) {
    // Đại diện rớt mà chưa chọn người thay → 409 kèm danh sách ứng viên để FE hiện ô chọn.
    if (err?.code === 'REPRESENTATIVE_REJECTED') {
      return res.status(409).json({
        success: false,
        message: err.message,
        code: err.code,
        candidates: err.candidates || []
      });
    }
    sendError(res, err);
  }
});

// ==========================================
// 7. ROOM & BED STATUS
// ==========================================
router.get('/rooms', async (req, res) => {
  try {
    const branch_id = req.query.branch_id as string;
    const data = await roomStatusService.getRooms(branch_id, req.user?.id);
    sendSuccess(res, data, 'Fetched rooms successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/rooms/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const data = await roomStatusService.updateRoomStatus(id, status);
    sendSuccess(res, data, 'Updated room status successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/rooms/:id/beds', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await roomStatusService.getBedsByRoom(id);
    sendSuccess(res, data, 'Fetched room beds successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/beds/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const data = await roomStatusService.updateBedStatus(id, status);
    sendSuccess(res, data, 'Updated bed status successfully');
  } catch (err) {
    sendError(res, err);
  }
});

// ==========================================
// 8. CHECKOUTS FOR MANAGER
// ==========================================
router.get('/checkouts/pending', async (req, res) => {
  try {
    const data = await managerContractService.getPendingCheckouts(req.user?.id);
    sendSuccess(res, data, 'Fetched pending checkouts successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/checkouts/:id/inspect', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await managerContractService.inspectCheckout(id, req.body, req.user?.id);
    sendSuccess(res, data, 'Inspected checkout successfully');
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
