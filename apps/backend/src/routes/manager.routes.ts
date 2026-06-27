import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response.util';
import { managerDepositService } from '../services/manager-deposit.service';
import { managerContractService } from '../services/manager-contract.service';
import { handoverService } from '../services/handover.service';
import { inspectionService } from '../services/inspection.service';
import { roomStatusService } from '../services/room-status.service';
import { residencyService } from '../services/residency.service';
import { assetRepo } from '../repositories/asset.repo';
