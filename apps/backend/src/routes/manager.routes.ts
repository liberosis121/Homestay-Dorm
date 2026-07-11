import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response.util';
import { managerDepositService } from '../services/manager-deposit.service';
import { managerContractService } from '../services/manager-contract.service';
import { handoverService } from '../services/handover.service';
import { residencyService } from '../services/residency.service';
import { roomStatusService } from '../services/room-status.service';
import { incidentalCostService } from '../services/incidental-cost.service';
import { assetService } from '../services/asset.service';

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
    const data = await managerContractService.createContract(req.body);
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
    const location = req.query.location as string;
    const data = await assetService.getAssets({ category, status, location });
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

export default router;
