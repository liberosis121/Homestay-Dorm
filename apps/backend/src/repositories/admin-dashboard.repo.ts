import { supabase } from '../utils/supabase';

export interface RoomStatRow {
  id: string;
  status: string | null;
  max_occupants: number | null;
}

const PAGE_SIZE = 1000;

const countTable = async (table: string): Promise<number> => {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
};

const countByStatus = async (table: string, status: string): Promise<number> => {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('status', status);
  if (error) throw error;
  return count ?? 0;
};

export const adminDashboardRepo = {
  // Rooms need full rows to sum max_occupants and group by status,
  // so paginate to fetch all rows (Supabase caps a request at 1000 rows).
  findRooms: async (): Promise<RoomStatRow[]> => {
    const rows: RoomStatRow[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, status, max_occupants')
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      rows.push(...(data as RoomStatRow[]));
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return rows;
  },

  // Beds & services only need counts -> COUNT query (accurate at any scale, no row fetch)
  countBranches: () => countTable('branches'),
  countStaff: () => countTable('employees'),
  countCustomers: () => countTable('customers'),
  countBeds: () => countTable('beds'),
  countBedsByStatus: (status: string) => countByStatus('beds', status),
  countServices: () => countTable('services'),
  countServicesByStatus: (status: string) => countByStatus('services', status)
};
