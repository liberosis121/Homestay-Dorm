import { supabase } from '../utils/supabase';

export interface ProfileDto {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export const profileRepo = {
  findById: async (id: string): Promise<ProfileDto | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      // If table profiles doesn't exist or record not found, return null instead of throwing to prevent crashing the server
      console.error('Error fetching profile from DB:', error);
      return null;
    }
    return data as ProfileDto;
  },

  update: async (id: string, updates: Partial<ProfileDto>): Promise<ProfileDto> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ProfileDto;
  }
};
