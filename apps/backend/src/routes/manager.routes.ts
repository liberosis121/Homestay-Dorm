import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response.util';
import { managerDepositService } from '../services/manager-deposit.service';
import { managerContractService } from '../services/manager-contract.service';
import { handoverService } from '../services/handover.service';
import { inspectionService } from '../services/inspection.service';
import { roomStatusService } from '../services/room-status.service';
import { residencyService } from '../services/residency.service';
import { assetRepo } from '../repositories/asset.repo';

const router = Router();

// ==========================================
// 1. DEPOSITS
// ==========================================
router.get('/deposits', async (req, res) => {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;
    const data = await managerDepositService.getDeposits({ status, search });
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
    const data = await managerContractService.getContracts({ customer_id, status });
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

// ==========================================
// 3. HANDOVERS
// ==========================================
router.get('/handovers', async (req, res) => {
  try {
    const customer_id = req.query.customer_id as string;
    const status = req.query.status as string;
    const data = await handoverService.getHandovers({ customer_id, status });
    sendSuccess(res, data, 'Fetched handovers successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/handovers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await handoverService.getHandoverById(id);
    sendSuccess(res, data, 'Fetched handover details successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/handovers', async (req, res) => {
  try {
    const { assetsList, ...handoverData } = req.body;
    const data = await handoverService.createHandover(handoverData, assetsList);
    sendSuccess(res, data, 'Created handover successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/handovers/:id/sign', async (req, res) => {
  try {
    const { id } = req.params;
    const signatureIp = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
    const data = await handoverService.signHandover(id, signatureIp);
    sendSuccess(res, data, 'Signed handover successfully');
  } catch (err) {
    sendError(res, err);
  }
});

// ==========================================
// 4. ASSETS & INSPECTIONS
// ==========================================
router.get('/assets', async (req, res) => {
  try {
    const category = req.query.category as string;
    const status = req.query.status as string;
    const location = req.query.location as string;
    const data = await assetRepo.findAll({ category, status, location });
    sendSuccess(res, data, 'Fetched assets successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/assets', async (req, res) => {
  try {
    const data = await assetRepo.create(req.body);
    sendSuccess(res, data, 'Added new asset successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await assetRepo.update(id, req.body);
    sendSuccess(res, data, 'Updated asset successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/inspections', async (req, res) => {
  try {
    const room_id = req.query.room_id as string;
    const data = await inspectionService.getInspections({ room_id });
    sendSuccess(res, data, 'Fetched inspections successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/inspections', async (req, res) => {
  try {
    const data = await inspectionService.createInspection(req.body);
    sendSuccess(res, data, 'Saved room inspection successfully');
  } catch (err) {
    sendError(res, err);
  }
});

// ==========================================
// 5. RESIDENCY
// ==========================================
router.get('/residency', async (req, res) => {
  try {
    const status = req.query.status as string;
    const data = await residencyService.getResidencyChecks({ status });
    sendSuccess(res, data, 'Fetched residency records successfully');
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/residency/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await residencyService.updateResidencyCheck(id, req.body);
    sendSuccess(res, data, 'Updated residency status successfully');
  } catch (err) {
    sendError(res, err);
  }
});

// ==========================================
// 6. ROOM & BED STATUS
// ==========================================
router.get('/rooms', async (req, res) => {
  try {
    const branch_id = req.query.branch_id as string;
    const data = await roomStatusService.getRooms(branch_id);