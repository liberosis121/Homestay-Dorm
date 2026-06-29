import { supabase } from '../utils/supabase';

export interface ProfileDto {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
  [key: string]: any; // Allow arbitrary fields from child tables (nhan_vien, khach_hang)
}

export const profileRepo = {
  findById: async (id: string): Promise<ProfileDto | null> => {
    // 1. Fetch parent profile details
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // maybeSingle doesn't throw if not found
      
    if (profileErr || !profile) {
      console.error('Error fetching parent profile:', profileErr);
      return null;
    }
    
    // 2. Fetch specific child details based on the user role
    const role = profile.role;
    if (role === 'customer') {
      const { data: customer, error: customerErr } = await supabase
        .from('khach_hang')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

      if (customerErr) {
        console.error('Error fetching khach_hang record:', customerErr);
      }
      if (customer) {
        return {
          ...profile,
          ...customer,
          type: 'customer'
        };
      }
    } else {
      // Employee roles: manager, sale, accountant, admin
      const { data: employee, error: employeeErr } = await supabase
        .from('nhan_vien')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (employeeErr) {
        console.error('Error fetching nhan_vien record:', employeeErr);
      }
      if (employee) {
        return {
          ...profile,
          ...employee,
          type: 'employee'
        };
      }
    }
    
    // Fallback: return basic profile if child record doesn't exist
    return profile;
  },

  update: async (id: string, updates: Partial<ProfileDto>): Promise<ProfileDto> => {
    // 1. Fetch current profile details to determine the role
    const currentProfile = await profileRepo.findById(id);
    if (!currentProfile) {
      throw new Error('Profile not found');
    }

    // 2. Separate updates into parent (profiles) and child (nhan_vien / khach_hang) tables
    const parentFields = ['email', 'role', 'full_name', 'phone', 'avatar_url'];
    const parentUpdates: Record<string, any> = {};
    const childUpdates: Record<string, any> = {};

    Object.keys(updates).forEach(key => {
      if (parentFields.includes(key)) {
        parentUpdates[key] = updates[key];
      } else {
        childUpdates[key] = updates[key];
      }
    });

    // Synchronize full_name, phone, and email across parent and child tables if updated
    if (updates.full_name) {
      parentUpdates.full_name = updates.full_name;
      childUpdates.full_name = updates.full_name;
    }
    if (updates.phone) {
      parentUpdates.phone = updates.phone;
      childUpdates.phone = updates.phone;
    }
    if (updates.email) {
      parentUpdates.email = updates.email;
      childUpdates.email = updates.email;
    }

    // 3. Update profiles (parent table)
    if (Object.keys(parentUpdates).length > 0) {
      const { error: parentErr } = await supabase
        .from('profiles')
        .update(parentUpdates)
        .eq('id', id);
      if (parentErr) throw parentErr;
    }

    // 4. Update child table based on role
    if (Object.keys(childUpdates).length > 0) {
      if (currentProfile.role === 'customer') {
        const { error: customerErr } = await supabase
          .from('khach_hang')
          .update(childUpdates)
          .eq('user_id', id);
        if (customerErr) throw customerErr;
      } else {
        const { error: employeeErr } = await supabase
          .from('nhan_vien')
          .update(childUpdates)
          .eq('id', id);
        if (employeeErr) throw employeeErr;
      }
    }

    // 5. Fetch and return full updated profile
    const updated = await profileRepo.findById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated profile');
    }
    return updated;
  }
};
