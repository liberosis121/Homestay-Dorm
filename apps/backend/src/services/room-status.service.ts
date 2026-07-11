import { supabase } from '../utils/supabase';

export interface Room {
  id: string;
  branch_id: string;
  name: string;
  max_occupants: number;
  floor: number;
  room_type: string;
  area?: string;
  amenities: string[];
  price: number;
  status: string;
}

export const roomStatusService = {
  getRooms: async (branchId?: string, managerId?: string): Promise<Room[]> => {
    let query = supabase.from('rooms').select('*');
    
    if (branchId && branchId !== 'undefined' && branchId !== 'null' && branchId !== 'all' && branchId !== '') {
      query = query.eq('branch_id', branchId);
    } else if (managerId) {
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('id', managerId)
        .maybeSingle();

      if (employee && employee.branch_id) {
        query = query.eq('branch_id', employee.branch_id);
      } else {
        const { data: branch } = await supabase
          .from('branches')
          .select('id')
          .eq('manager_id', managerId)
          .maybeSingle();

        if (branch) {
          query = query.eq('branch_id', branch.id);
        }
      }
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data as Room[]) || [];
  },

  updateRoomStatus: async (roomId: string, status: string): Promise<Room> => {
    const { data, error } = await supabase
      .from('rooms')
      .update({ status })
      .eq('id', roomId)
      .select()
      .single();
    if (error) throw error;
    return data as Room;
  },

  getBedsByRoom: async (roomId: string) => {
    const { data, error } = await supabase
      .from('beds')
      .select('*')
      .eq('room_id', roomId);
    if (error) throw error;
    return data || [];
  },

  updateBedStatus: async (bedId: string, status: string) => {
    const { data, error } = await supabase
      .from('beds')
      .update({ status })
      .eq('id', bedId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
