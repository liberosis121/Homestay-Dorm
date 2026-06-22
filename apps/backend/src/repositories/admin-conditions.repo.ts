import { supabase } from '../utils/supabase';

export interface DbCondition {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export const adminConditionsRepo = {
  findAll: async (): Promise<DbCondition[]> => {
    const { data, error } = await supabase
      .from('conditions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  create: async (cond: {
    title: string;
    description: string;
    is_active: boolean;
  }): Promise<DbCondition> => {
    const { data: countData, error: countErr } = await supabase
      .from('conditions')
      .select('id');
      
    if (countErr) throw countErr;
    
    // Generate robust next ID CD-XXX
    const nextId = (() => {
      const ids = (countData || []).map(r => r.id);
      const nums = ids
        .map(id => {
          const match = id.match(/CD-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return `CD-${String(max + 1).padStart(3, '0')}`;
    })();

    const { data, error } = await supabase
      .from('conditions')
      .insert({
        id: nextId,
        title: cond.title,
        description: cond.description,
        is_active: cond.is_active,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, cond: {
    title?: string;
    description?: string;
    is_active?: boolean;
  }): Promise<DbCondition> => {
    const { data, error } = await supabase
      .from('conditions')
      .update({
        title: cond.title,
        description: cond.description,
        is_active: cond.is_active
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
