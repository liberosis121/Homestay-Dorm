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
  gender_type?: string;
  // Suy ra tu bang beds. Cot rooms.status KHONG duoc cap nhat theo giuong nen khong
  // dung de tinh KPI lap day / phong con cho duoc.
  total_beds?: number;
  available_beds_count?: number;
  occupied_beds_count?: number;
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

    const rooms = (data as Room[]) || [];
    if (rooms.length === 0) return rooms;

    // Dinh kem so lieu giuong de FE tinh dung "phong dang co nguoi o" / "phong con cho".
    const roomIds = rooms.map((r) => r.id).filter(Boolean);
    const { data: beds, error: bedErr } = await supabase
      .from('beds')
      .select('room_id, status')
      .in('room_id', roomIds);
    if (bedErr) throw bedErr;

    const statsByRoom = new Map<string, { total: number; available: number; occupied: number }>();
    for (const bed of beds || []) {
      const stat = statsByRoom.get(bed.room_id) || { total: 0, available: 0, occupied: 0 };
      stat.total += 1;
      if (bed.status === 'available') stat.available += 1;
      if (bed.status === 'occupied') stat.occupied += 1;
      statsByRoom.set(bed.room_id, stat);
    }

    return rooms.map((room) => {
      const stat = statsByRoom.get(room.id) || { total: 0, available: 0, occupied: 0 };
      return {
        ...room,
        total_beds: stat.total,
        available_beds_count: stat.available,
        occupied_beds_count: stat.occupied,
      };
    });
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
