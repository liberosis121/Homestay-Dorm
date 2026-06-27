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