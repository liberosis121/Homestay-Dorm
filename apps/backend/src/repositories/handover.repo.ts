import { supabase } from '../utils/supabase';

export interface AssetHandoverDto {
  id: string;
  contract_id: string;
  handover_time: string;
  customer_confirmed: boolean;
  staff_confirmed: boolean;
  note?: string;
  staff_id: string;
}

export interface HandoverDetailDto {
  handover_id: string;
  serial_number: string;
  quantity: number;
  condition: string;
  note?: string;
}

export const handoverRepo = {
  findAll: async (filters?: { contract_id?: string }) => {
    // 1. Fetch handovers from CSDL
    let query = supabase.from('asset_handovers').select('*');
    if (filters?.contract_id) {
      query = query.eq('contract_id', filters.contract_id);
    }
    const { data: handovers, error: handoverErr } = await query;
    if (handoverErr) throw handoverErr;
    if (!handovers || handovers.length === 0) return [];

    // 2. Fetch related tables in parallel to map full handover details
    const [
      { data: details },
      { data: assets },
      { data: contracts },
      { data: deposits },
      { data: registrations },
      { data: customers },
      { data: rooms }
    ] = await Promise.all([
      supabase.from('handover_details').select('*'),
      supabase.from('assets').select('*'),
      supabase.from('contracts').select('*'),
      supabase.from('deposit_requests').select('*'),
      supabase.from('rental_registrations').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('rooms').select('*')
    ]);

    // 3. Construct frontend AssetHandover model with full relation info
    return handovers.map(h => {
      const contract = contracts?.find(c => c.id === h.contract_id) || {};
      const dep = deposits?.find(d => d.id === contract.deposit_id) || {};
      const reg = registrations?.find(r => r.id === dep.registration_id) || {};
      const customer = customers?.find(c => c.cccd === reg.cccd) || {};
      const room = rooms?.find(r => r.id === dep.room_id) || {};

      // Filter details for this handover
      const hDetails = details?.filter(d => d.handover_id === h.id) || [];
      const checklist = hDetails.map(d => {
        const asset = assets?.find(a => a.serial_number === d.serial_number) || {};
        return {
          item: asset.name || d.serial_number,
          condition: d.condition || 'Tốt',
          note: d.note || '',
          checked: true,
          quantity: d.quantity || 1
        };
      });

      const isSigned = h.customer_confirmed && h.staff_confirmed;
      const status = isSigned ? 'signed' : (h.customer_confirmed || h.staff_confirmed ? 'partial' : 'pending');

      return {
        id: h.id,
        customer_id: customer.user_id || '',
        customer_name: customer.full_name || 'Khách thuê',
        room_id: dep.room_id || '',
        room_name: room.name || 'Phòng',
        handover_date: h.handover_time ? h.handover_time.slice(0, 10) : new Date().toISOString().slice(0, 10),
        checklist,
        customer_signed: h.customer_confirmed,
        manager_signed: h.staff_confirmed,
        signature_ip: '192.168.1.1',
        signature_timestamp: h.handover_time,
        status,
        created_at: h.handover_time || new Date().toISOString(),
        note: h.note || ''
      };
    });
  },

  findById: async (id: string) => {
    const handovers = await handoverRepo.findAll();
    return handovers.find(h => h.id === id) || null;
  },

  create: async (handover: AssetHandoverDto) => {
    const { data, error } = await supabase
      .from('asset_handovers')
      .insert(handover)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  createDetails: async (details: HandoverDetailDto[]) => {
    const { data, error } = await supabase
      .from('handover_details')
      .insert(details)
      .select();
    if (error) throw error;
    return data || [];
  },

  update: async (id: string, updates: Partial<AssetHandoverDto>) => {
    const { data, error } = await supabase
      .from('asset_handovers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
