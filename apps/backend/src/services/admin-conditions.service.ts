import { adminConditionsRepo, DbCondition } from '../repositories/admin-conditions.repo';

export const adminConditionsService = {
  getAllConditions: async (): Promise<DbCondition[]> => {
    return await adminConditionsRepo.findAll();
  },

  createCondition: async (cond: {
    title: string;
    description: string;
    is_active: boolean;
  }): Promise<DbCondition> => {
    if (!cond.title || !cond.description) {
      throw new Error('Tiêu đề và nội dung là bắt buộc');
    }
    return await adminConditionsRepo.create(cond);
  },

  updateCondition: async (id: string, cond: {
    title?: string;
    description?: string;
    is_active?: boolean;
  }): Promise<DbCondition> => {
    if (!id) {
      throw new Error('ID điều kiện là bắt buộc');
    }
    return await adminConditionsRepo.update(id, cond);
  }
};
