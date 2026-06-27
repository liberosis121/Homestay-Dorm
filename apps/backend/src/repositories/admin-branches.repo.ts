import { supabase } from '../utils/supabase';

export interface DbBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: string;
  manager_id: string | null;
}

export const adminBranchesRepo = {
  findAll: async (): Promise<DbBranch[]> => {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  create: async (branch: {
    name: string;
    address: string;
    phone: string;
    email: string;
    status?: string;
    manager_id?: string | null;
  }): Promise<DbBranch> => {
    const { data: countData, error: countErr } = await supabase
      .from('branches')
      .select('id');

    if (countErr) throw countErr;

    // Generate robust next ID CN-XXX
    const nextId = (() => {
      const ids = (countData || []).map(r => r.id);
      const nums = ids
        .map(id => {
          const match = id.match(/CN-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return `CN-${String(max + 1).padStart(3, '0')}`;
    })();

    const { data, error } = await supabase
      .from('branches')
      .insert({
        id: nextId,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        status: branch.status ?? 'active',
        manager_id: branch.manager_id ?? null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, branch: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    status?: string;
    manager_id?: string | null;
  }): Promise<DbBranch> => {
    const { data, error } = await supabase
      .from('branches')
      .update({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        status: branch.status,
        manager_id: branch.manager_id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
