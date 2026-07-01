import { adminServicesRepo, DbService } from '../repositories/admin-services.repo';

const httpError = (message: string, statusCode: number) => {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
};

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
      throw httpError('Tên và loại dịch vụ là bắt buộc', 400);
    }
    if (svc.price === undefined || svc.price === null) {
      throw httpError('Đơn giá là bắt buộc', 400);
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
      throw httpError('ID dịch vụ là bắt buộc', 400);
    }
    return await adminServicesRepo.update(id, svc);
  }
};
