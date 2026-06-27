import { supabase } from '../utils/supabase';

export const roomStatusService = {
  getRooms: async (branchId?: string) => {
    let query = supabase.from('rooms').select('*');
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  updateRoomStatus: async (roomId: string, status: 'available' | 'deposited' | 'occupied' | 'maintenance' | 'partial') => {
    const { data, error } = await supabase
      .from('rooms')
      .update({ status })
      .eq('id', roomId)
      .select()
      .single();