import { incidentalCostRepo, IncidentalCostDto } from '../repositories/incidental-cost.repo';
import { assetRepo } from '../repositories/asset.repo';

export const incidentalCostService = {
  getIncidentalCosts: async (filters?: { contract_id?: string; status?: string }) => {
    return await incidentalCostRepo.findAll(filters);
  },

  getIncidentalCostById: async (id: string) => {
    return await incidentalCostRepo.findById(id);
  },

  createIncidentalCost: async (cost: IncidentalCostDto, assetStatusUpdate?: string) => {
    // 1. Create the cost record
    const created = await incidentalCostRepo.create(cost);

    // 2. If asset serial is provided and a status update is requested
    if (cost.asset_serial && assetStatusUpdate) {
      try {
        await assetRepo.update(cost.asset_serial, {
          status: assetStatusUpdate
        });
      } catch (err) {
        console.error(`Failed to update asset ${cost.asset_serial} status after logging cost:`, err);
      }
    }

    return created;
  },

  updateIncidentalCostStatus: async (id: string, status: string) => {
    return await incidentalCostRepo.update(id, { status });
  }
};
