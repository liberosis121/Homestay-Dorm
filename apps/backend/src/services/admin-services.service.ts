import { adminServicesRepo, DbService } from '../repositories/admin-services.repo';

export const adminServicesService = {
  getAllServices: async (): Promise<DbService[]> => {
    return await adminServicesRepo.findAll();
  },

  createService: async (svc: {
    name: string;
    service_type: string;
    description?: string;
    unit?: string;
    price: number;
    billing_cycle?: string;
    status?: string;
  }): Promise<DbService> => {
    if (!svc.name || !svc.service_type) {
      throw new Error('Tên và loại dịch vụ là bắt buộc');
    }
    if (svc.price === undefined || svc.price === null) {
      throw new Error('Đơn giá là bắt buộc');
    }
    return await adminServicesRepo.create(svc);
  },

  updateService: async (id: string, svc: {
    name?: string;
    service_type?: string;
    description?: string;
    unit?: string;
    price?: number;
    billing_cycle?: string;
    status?: string;
  }): Promise<DbService> => {
    if (!id) {
      throw new Error('ID dịch vụ là bắt buộc');
    }
    return await adminServicesRepo.update(id, svc);
  }
};
