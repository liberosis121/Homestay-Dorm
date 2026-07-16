import { adminAssetsRepo, DbAsset } from '../repositories/admin-assets.repo';

export const adminAssetsService = {
  getAllAssets: async (): Promise<DbAsset[]> => {
    return await adminAssetsRepo.findAll();
  },

  createAsset: async (asset: {
    serial_number?: string;
    name: string;
    category: string;
    brand: string;
    branch_id: string;
    room_id?: string;
    bed_id?: string;
    value: number;
    purchase_date?: string;
    status: string;
  }): Promise<DbAsset> => {
    if (!asset.name || !asset.branch_id) {
      throw new Error('Tên tài sản và Chi nhánh là bắt buộc');
    }
    return await adminAssetsRepo.create(asset);
  },

  updateAsset: async (serialNumber: string, asset: {
    status?: string;
    value?: number;
    branch_id?: string;
    room_id?: string;
    bed_id?: string;
  }): Promise<DbAsset> => {
    if (!serialNumber) {
      throw new Error('Số serial là bắt buộc');
    }
    return await adminAssetsRepo.update(serialNumber, asset);
  }
};
