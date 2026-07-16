import { assetRepo, AssetDto } from '../repositories/asset.repo';

export const assetService = {
  getAssets: async (filters?: { category?: string; status?: string; branch_id?: string }) => {
    return await assetRepo.findAll(filters);
  },

  getAssetBySerialNumber: async (serialNumber: string) => {
    return await assetRepo.findBySerialNumber(serialNumber);
  },

  createAsset: async (asset: AssetDto) => {
    return await assetRepo.create(asset);
  },

  updateAsset: async (serialNumber: string, updates: Partial<AssetDto>) => {
    return await assetRepo.update(serialNumber, updates);
  }
};
