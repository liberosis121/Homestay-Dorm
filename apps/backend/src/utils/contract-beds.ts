/**
 * Tien ich cho ANH CHUP HOP DONG DA KY (bang noi contract_beds + contract_customers).
 *
 * Ho so dang ky GOC (deposit_requests + deposit_beds + rental_registration_members) la BAT BIEN.
 * Hop dong luu rieng giuong/khach THUC SU ky:
 *   - contract_beds     : giuong thuc su cua hop dong (le = 1, nhom = N, nguyen phong = 0)
 *   - contract_customers : khach thuc su ky (kem co is_representative)
 * Vi du TH3: coc 4 nguoi/4 giuong -> hop dong 2 nguoi/2 giuong.
 */

import { supabase } from './supabase';

export interface ContractBed {
  id: string;
  name: string;
  price: number;
}

export interface ContractCustomerLink {
  customer_user_id: string;
  is_representative: boolean;
}

/** Map contractId -> danh sach giuong {id, name, price} cua hop dong (tu contract_beds). */
export async function getBedsByContractIds(
  contractIds: Array<string | null | undefined>
): Promise<Record<string, ContractBed[]>> {
  const ids = Array.from(new Set((contractIds || []).filter(Boolean))) as string[];
  if (ids.length === 0) return {};

  const { data: rows } = await supabase
    .from('contract_beds')
    .select('contract_id, bed_id')
    .in('contract_id', ids);

  const bedIds = Array.from(new Set((rows || []).map((r: any) => r.bed_id)));
  const { data: beds } = bedIds.length > 0
    ? await supabase.from('beds').select('id, name, price').in('id', bedIds)
    : { data: [] as any[] };

  const bedById = new Map((beds || []).map((b: any) => [b.id, b as ContractBed]));
  const result: Record<string, ContractBed[]> = {};
  for (const row of rows || []) {
    const bed = bedById.get((row as any).bed_id);
    if (bed) (result[(row as any).contract_id] ||= []).push(bed);
  }
  return result;
}

/** Danh sach bed_id cua mot hop dong (rong neu nguyen phong). */
export async function getBedIdsByContractId(contractId: string): Promise<string[]> {
  if (!contractId) return [];
  const { data, error } = await supabase
    .from('contract_beds')
    .select('bed_id')
    .eq('contract_id', contractId);
  if (error) {
    throw new Error(`[contract-beds] Loi khi lay giuong cua hop dong id=${contractId}: ${error.message}`);
  }
  return (data || []).map((r: any) => r.bed_id);
}

/** Map contractId -> danh sach khach {customer_user_id, is_representative} cua hop dong. */
export async function getCustomersByContractIds(
  contractIds: Array<string | null | undefined>
): Promise<Record<string, ContractCustomerLink[]>> {
  const ids = Array.from(new Set((contractIds || []).filter(Boolean))) as string[];
  if (ids.length === 0) return {};

  const { data: rows } = await supabase
    .from('contract_customers')
    .select('contract_id, customer_user_id, is_representative')
    .in('contract_id', ids);

  const result: Record<string, ContractCustomerLink[]> = {};
  for (const row of rows || []) {
    (result[(row as any).contract_id] ||= []).push({
      customer_user_id: (row as any).customer_user_id,
      is_representative: !!(row as any).is_representative
    });
  }
  return result;
}

/**
 * COC THUC TE cua hop dong = tong gia giuong THUC SU cua HD × 2 thang.
 * Nguyen phong (0 giuong contract_beds) -> dung coc goc cua phieu (fallbackDeposit).
 *
 * QUAN TRONG (TH3 nhom co nguoi rot): phai dung giuong CUA HOP DONG (contract_beds),
 * KHONG dung deposit_requests.deposit_amount — vi cai sau la coc cua CA NHOM goc (gom
 * ca phan nguoi rot da duoc hoan coc), se lam buoc doi soat/thanh ly hoan thua tien.
 */
export function contractDepositFromBeds(
  beds: Array<{ price: number }> | undefined | null,
  fallbackDeposit: number
): number {
  const bedRentSum = (beds || []).reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  return bedRentSum > 0 ? bedRentSum * 2 : (Number(fallbackDeposit) || 0);
}

/** bed_id dai dien theo ngu nghia cu (coc/HD 1 giuong le -> id; nhom / nguyen phong -> null). */
export function singleBedId(beds: Array<{ id: string }> | undefined | null): string | null {
  return beds && beds.length === 1 ? beds[0].id : null;
}

/** Loai hop dong suy ra tu so giuong: 0 -> 'room', 1 -> 'bed', >=2 -> 'group'. */
export function contractTypeFromBedCount(bedCount: number): 'room' | 'bed' | 'group' {
  if (bedCount <= 0) return 'room';
  if (bedCount === 1) return 'bed';
  return 'group';
}
