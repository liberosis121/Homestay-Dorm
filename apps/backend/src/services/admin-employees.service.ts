import { adminEmployeesRepo, DbEmployeeAdmin } from '../repositories/admin-employees.repo';

export const adminEmployeesService = {
  getAllEmployees: async (): Promise<DbEmployeeAdmin[]> => {
    return await adminEmployeesRepo.findAll();
  },

  createEmployee: async (emp: {
    full_name: string;
    email: string;
    phone: string;
    role: string;
    branch: string;
  }): Promise<DbEmployeeAdmin> => {
    if (!emp.full_name || !emp.email) {
      throw new Error('Họ tên và email là bắt buộc');
    }
    return await adminEmployeesRepo.create(emp);
  },

  updateEmployee: async (id: string, emp: {
    full_name?: string;
    email?: string;
    phone?: string;
    role?: string;
    branch?: string;
  }): Promise<any> => {
    if (!id) {
      throw new Error('ID nhân viên là bắt buộc');
    }
    return await adminEmployeesRepo.update(id, emp);
  },

  toggleEmployeeLock: async (id: string): Promise<string> => {
    if (!id) {
      throw new Error('ID nhân viên là bắt buộc');
    }
    return await adminEmployeesRepo.toggleLock(id);
  }
};
