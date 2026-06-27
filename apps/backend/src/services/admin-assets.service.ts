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
    location: string;
    value: number;
    purchase_date?: string;
    status: string;
  }): Promise<DbAsset> => {
    if (!asset.name || !asset.location) {
      throw new Error('Tên tài sản và vị trí là bắt buộc');
    }
    return await adminAssetsRepo.create(asset);
  },

  updateAsset: async (serialNumber: string, asset: {
    status?: string;
    value?: number;
    location?: string;
  }): Promise<DbAsset> => {
    if (!serialNumber) {
      throw new Error('Số serial là bắt buộc');
    }
    return await adminAssetsRepo.update(serialNumber, asset);
  }
};
