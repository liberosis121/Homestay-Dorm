import { supabase } from '../utils/supabase';

export interface DbRoom {
  id: string;
  branch_id: string;
  name: string;
  max_occupants: number;
  floor: number;
  room_type: string;
  amenities: string[];
  price: number;
  status: string;
  gender_type: string;
}

export interface DbBed {
  id: string;
  room_id: string;
  name: string;
  price: number;
  status: string;
}

export const adminRoomsRepo = {
  // ─── ROOMS ─────────────────────────────────────────────────────────────
  findAllRooms: async (): Promise<DbRoom[]> => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  findAllBeds: async (): Promise<DbBed[]> => {
    const { data, error } = await supabase
      .from('beds')
      .select('*');
      
    if (error) throw error;
    return data || [];
  },

  createRoom: async (room: {
    branch_id: string;
    name: string;
    max_occupants: number;
    floor: number;
    room_type: string;
    amenities?: string[];
    price: number;
    status?: string;
    gender_type?: string;
  }): Promise<DbRoom> => {
    // Room ID format: P-{floor}{2-digit sequence}, e.g. floor 1 -> P-101, P-102
    const { data: existing, error: existErr } = await supabase
      .from('rooms')
      .select('id')
      .like('id', `P-${room.floor}%`);

    if (existErr) throw existErr;

    const nextId = (() => {
      const re = new RegExp(`^P-${room.floor}(\\d{2})$`);
      const seqs = (existing || [])
        .map(r => {
          const match = r.id.match(re);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      const max = seqs.length > 0 ? Math.max(...seqs) : 0;
      return `P-${room.floor}${String(max + 1).padStart(2, '0')}`;
    })();

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        id: nextId,
        branch_id: room.branch_id,
        name: room.name,
        max_occupants: room.max_occupants,
        floor: room.floor,
        room_type: room.room_type,
        amenities: room.amenities ?? [],
        price: room.price,
        status: room.status ?? 'available',
        gender_type: room.gender_type ?? 'unisex'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateRoom: async (id: string, room: {
    branch_id?: string;
    name?: string;
    max_occupants?: number;
    floor?: number;
    room_type?: string;
    amenities?: string[];
    price?: number;
    status?: string;
    gender_type?: string;
  }): Promise<DbRoom> => {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        branch_id: room.branch_id,
        name: room.name,
        max_occupants: room.max_occupants,
        floor: room.floor,
        room_type: room.room_type,
        amenities: room.amenities,
        price: room.price,
        status: room.status,
        gender_type: room.gender_type
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ─── BEDS ──────────────────────────────────────────────────────────────
  findBedsByRoom: async (roomId: string): Promise<DbBed[]> => {
    const { data, error } = await supabase
      .from('beds')
      .select('*')
      .eq('room_id', roomId)
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  createBed: async (bed: {
    room_id: string;
    name: string;
    price: number;
    status?: string;
  }): Promise<DbBed> => {
    // Bed ID format: {room_id}-G{n}, e.g. P-101-G1
    const { data: existing, error: existErr } = await supabase
      .from('beds')
      .select('id')
      .eq('room_id', bed.room_id);

    if (existErr) throw existErr;

    const nextId = (() => {
      const re = /-G(\d+)$/i;
      const nums = (existing || [])
        .map(b => {
          const match = b.id.match(re);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return `${bed.room_id}-G${max + 1}`;
    })();

    const { data, error } = await supabase
      .from('beds')
      .insert({
        id: nextId,
        room_id: bed.room_id,
        name: bed.name,
        price: bed.price,
        status: bed.status ?? 'available'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateBed: async (id: string, bed: {
    name?: string;
    price?: number;
    status?: string;
  }): Promise<DbBed> => {
    const { data, error } = await supabase
      .from('beds')
      .update({
        name: bed.name,
        price: bed.price,
        status: bed.status
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
