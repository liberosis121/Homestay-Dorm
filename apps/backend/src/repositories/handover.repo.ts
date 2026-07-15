import { supabase } from '../utils/supabase';
import { getBedsByContractIds } from '../utils/contract-beds';

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
  condition: string;
  compensation?: number;
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

    // 2. Fetch related tables.
    // HIEU NANG: chi lay DUNG cac ban ghi lien quan (loc theo khoa bang .in) thay vi
    // SELECT * toan bo 8 bang (truoc day keo ca 106 tai san + toan bo khach hang ve
    // roi loc trong bo nho o moi lan goi API).
    const handoverIds = handovers.map((h: any) => h.id).filter(Boolean);
    const handoverContractIds = Array.from(
      new Set(handovers.map((h: any) => h.contract_id).filter(Boolean))
    );

    const [{ data: details }, { data: contracts }] = await Promise.all([
      handoverIds.length > 0
        ? supabase.from('handover_details').select('*').in('handover_id', handoverIds)
        : Promise.resolve({ data: [] as any[] }),
      handoverContractIds.length > 0
        ? supabase.from('contracts').select('*').in('id', handoverContractIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    // Cac bang con phu thuoc ket qua o tren -> lay theo tung tang khoa.
    const serialNumbers = Array.from(
      new Set((details || []).map((d: any) => d.serial_number).filter(Boolean))
    );
    const depositIds = Array.from(
      new Set((contracts || []).map((c: any) => c.deposit_id).filter(Boolean))
    );

    const [{ data: assets }, { data: deposits }] = await Promise.all([
      serialNumbers.length > 0
        ? supabase.from('assets').select('serial_number, name').in('serial_number', serialNumbers)
        : Promise.resolve({ data: [] as any[] }),
      depositIds.length > 0
        ? supabase.from('deposit_requests').select('*').in('id', depositIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const registrationIds = Array.from(
      new Set((deposits || []).map((d: any) => d.registration_id).filter(Boolean))
    );
    const roomIds = Array.from(
      new Set((deposits || []).map((d: any) => d.room_id).filter(Boolean))
    );
    // Giuong ban giao lay tu ANH CHUP hop dong (contract_beds): HD le = 1, nhom = N, nguyen phong = 0.
    const bedsByContract = await getBedsByContractIds(handoverContractIds);

    const [{ data: registrations }, { data: rooms }] = await Promise.all([
      registrationIds.length > 0
        ? supabase.from('rental_registrations').select('id, cccd, occupants_count').in('id', registrationIds)
        : Promise.resolve({ data: [] as any[] }),
      roomIds.length > 0
        ? supabase.from('rooms').select('id, name, branch_id, max_occupants').in('id', roomIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const cccds = Array.from(
      new Set((registrations || []).map((r: any) => r.cccd).filter(Boolean))
    );
    const { data: customers } = cccds.length > 0
      ? await supabase.from('customers').select('cccd, user_id, full_name').in('cccd', cccds)
      : { data: [] as any[] };

    // 3. Construct frontend AssetHandover model with full relation info
    const mapped = handovers.map(h => {
      const contract = contracts?.find(c => c.id === h.contract_id) || {};
      const dep = deposits?.find(d => d.id === contract.deposit_id) || {};
      const reg = registrations?.find(r => r.id === dep.registration_id) || {};
      const customer = customers?.find(c => c.cccd === reg.cccd) || {};
      const room = rooms?.find(r => r.id === dep.room_id) || {};
      const depBeds = bedsByContract[h.contract_id] || [];

      // Filter details for this handover
      const hDetails = details?.filter(d => d.handover_id === h.id) || [];
      const checklist = hDetails.map(d => {
        const asset = assets?.find(a => a.serial_number === d.serial_number) || {};
        return {
          item: asset.name || d.serial_number,
          serial_number: d.serial_number,
          condition: d.condition || 'Tốt',
          compensation: d.compensation || null,
          note: d.note || '',
          checked: true,
          quantity: d.quantity || 1
        };
      });

      const isSigned = h.customer_confirmed && h.staff_confirmed;
      const status = isSigned ? 'signed' : (h.customer_confirmed || h.staff_confirmed ? 'partial' : 'pending');

      return {
        id: h.id,
        contract_id: h.contract_id,
        customer_id: customer.user_id || '',
        customer_name: customer.full_name || 'Khách thuê',
        room_id: dep.room_id || '',
        room_name: room.name || 'Phòng',
        bed_id: depBeds.map(b => b.id).join(','),
        bed_name: depBeds.map(b => b.name).join(', '),
        branch_id: room.branch_id || '',
        handover_date: h.handover_time ? h.handover_time.slice(0, 10) : new Date().toISOString().slice(0, 10),
        checklist,
        customer_signed: h.customer_confirmed,
        manager_signed: h.staff_confirmed,
        signature_ip: '192.168.1.1',
        signature_timestamp: h.handover_time,
        status,
        is_group_full_room: (reg.occupants_count || 1) > 1 && (reg.occupants_count || 1) >= (room.max_occupants || 1),
        created_at: h.handover_time || new Date().toISOString(),
        note: h.note || ''
      };
    });

    // Sort chronologically by created_at (handover_time) to determine checkin vs checkout
    mapped.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Assign virtual type based on chronological order per contract_id
    const contractHandoverCounts: Record<string, number> = {};
    return mapped.map(item => {
      const contractId = item.contract_id;
      if (!contractHandoverCounts[contractId]) {
        contractHandoverCounts[contractId] = 1;
        return { ...item, type: 'checkin' };
      } else {
        contractHandoverCounts[contractId]++;
        return { ...item, type: 'checkout' };
      }
    });
  },

  findById: async (id: string) => {
    // HIEU NANG: truoc day goi findAll() (keo toan bo bang) roi .find() trong bo nho.
    // Nay chi lay dung bien ban can qua contract_id cua chinh no.
    const { data: handover, error } = await supabase
      .from('asset_handovers')
      .select('contract_id')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!handover) return null;

    const handovers = await handoverRepo.findAll({ contract_id: handover.contract_id });
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
