import { supabase } from '../utils/supabase';

export interface CustomerSearchFilters {
  name?: string;
  cccd?: string;
  phone?: string;
  email?: string;
}

const HISTORY_SELECT = `
  *,
  rental_registrations (
    *,
    viewing_schedules ( id, scheduled_time, result, note, room_id, rooms ( id, name ) ),
    deposit_requests (
      id, room_id, bed_id, deposit_amount, deposit_time, payment_deadline, status,
      rooms ( id, name ),
      contracts ( id, contract_code, start_date, end_date, rent_price, status )
    )
  )
`;

export const customerLookupRepo = {
  search: async (filters: CustomerSearchFilters) => {
    let query = supabase.from('khach_hang').select('*');

    if (filters.name) query = query.ilike('full_name', `%${filters.name}%`);
    if (filters.cccd) query = query.ilike('cccd', `%${filters.cccd}%`);
    if (filters.phone) query = query.ilike('phone', `%${filters.phone}%`);
    if (filters.email) query = query.ilike('email', `%${filters.email}%`);

    const { data, error } = await query.order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  findByCccd: async (cccd: string) => {
    const { data, error } = await supabase
      .from('khach_hang')
      .select(HISTORY_SELECT)
      .eq('cccd', cccd)
      .single();

    if (error) throw error;
    return data;
  }
};
