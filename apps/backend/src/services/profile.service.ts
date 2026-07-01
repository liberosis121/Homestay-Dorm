import { profileRepo, ProfileDto } from '../repositories/profile.repo';

export const profileService = {
  getProfile: async (id: string) => {
    return await profileRepo.findById(id);
  },

  updateProfile: async (id: string, updates: Partial<ProfileDto>) => {
    return await profileRepo.update(id, updates);
  }
};
