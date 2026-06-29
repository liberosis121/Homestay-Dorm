import { residencyInfoRepo, ResidencyInfoDto } from '../repositories/residency-info.repo';

export const residencyService = {
  getResidencyChecks: async (filters?: { contract_id?: string; check_result?: string }) => {
    return await residencyInfoRepo.findAll(filters);
  },

  getResidencyCheckById: async (id: number) => {
    return await residencyInfoRepo.findById(id);
  },

  createResidencyCheck: async (info: ResidencyInfoDto) => {
    info.check_result = info.check_result || 'pending';
    return await residencyInfoRepo.create(info);
  },

  updateResidencyCheck: async (id: number, updates: Partial<ResidencyInfoDto>) => {
    return await residencyInfoRepo.update(id, updates);
  }
};
