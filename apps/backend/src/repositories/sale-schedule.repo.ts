import { supabase } from '../utils/supabase';

export interface CreateViewingScheduleInput {
  registration_id: string;
  room_id: string;
  scheduled_time: string;
  staff_id: string;
  note?: string;
  result?: string;
}

export interface UpdateViewingScheduleInput {
  scheduled_time?: string;
  note?: string;
  result?: string;
}

const SCHEDULE_SELECT = `
  *,
  rooms ( id, name, room_type, branch_id, branches ( id, name, address ) ),
  nhan_vien ( id, full_name, phone ),
  rental_registrations (
    id, cccd, status, expected_move_in_date,
    khach_hang ( cccd, full_name, phone, email )
  )
`;

export const saleScheduleRepo = {
  findAll: async () => {
    const { data, error } = await supabase
      .from('viewing_schedules')
      .select(SCHEDULE_SELECT)
      .order('scheduled_time', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  findById: async (id: string) => {
    const { data, error } = await supabase
      .from('viewing_schedules')
      .select(SCHEDULE_SELECT)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (input: CreateViewingScheduleInput) => {
    const { data: existing, error: existErr } = await supabase
      .from('viewing_schedules')
      .select('id');

    if (existErr) throw existErr;

    const nextId = (() => {
      const nums = (existing || [])
        .map(r => {
          const match = r.id.match(/LXM-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      const max = nums.length > 0 ? Math.max(...nums) : 0;
      return `LXM-${String(max + 1).padStart(3, '0')}`;
    })();

    const { data, error } = await supabase
      .from('viewing_schedules')
      .insert({
        id: nextId,
        registration_id: input.registration_id,
        room_id: input.room_id,
        scheduled_time: input.scheduled_time,
        staff_id: input.staff_id,
        note: input.note ?? null,
        result: input.result ?? null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, input: UpdateViewingScheduleInput) => {
    const { data, error } = await supabase
      .from('viewing_schedules')
      .update({
        scheduled_time: input.scheduled_time,
        note: input.note,
        result: input.result
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
