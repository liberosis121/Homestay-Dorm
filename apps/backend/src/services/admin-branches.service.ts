import { adminBranchesRepo, DbBranch } from '../repositories/admin-branches.repo';

export const adminBranchesService = {
  getAllBranches: async (): Promise<DbBranch[]> => {
    return await adminBranchesRepo.findAll();
  },

  createBranch: async (branch: {
    name: string;
    address: string;
    phone: string;
    email: string;
    status?: string;
    manager_id?: string | null;
  }): Promise<DbBranch> => {
    if (!branch.name || !branch.address) {
      throw new Error('Tên và địa chỉ chi nhánh là bắt buộc');
    }
    return await adminBranchesRepo.create(branch);
  },

  updateBranch: async (id: string, branch: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    status?: string;
    manager_id?: string | null;
  }): Promise<DbBranch> => {
    if (!id) {
      throw new Error('ID chi nhánh là bắt buộc');
    }
    return await adminBranchesRepo.update(id, branch);
  }
};
