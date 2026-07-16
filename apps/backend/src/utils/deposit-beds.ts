/**
 * Tien ich dung chung cho quan he n-n giua phieu dat coc va giuong (bang noi deposit_beds).
 *
 * Sau khi bo cot deposit_requests.bed_id, MOI giuong duoc giu cho deu nam trong deposit_beds:
 *   - coc 1 giuong le  -> 1 dong
 *   - coc NHOM N giuong -> N dong
 *   - coc nguyen phong  -> 0 dong
 * Loai coc suy ra tu SO dong thay vi tu bed_id.
 */

import { supabase } from './supabase';

export interface DepositBed {
  id: string;
  name: string;
  price: number;
}

/**
 * Map depositId -> danh sach giuong {id, name, price} giu cho (tu bang noi deposit_beds).
 * Tra ve {} neu khong co phieu nao. Phieu nguyen phong khong xuat hien trong map (0 giuong).
 */
export async function getBedsByDepositIds(
  depositIds: Array<string | null | undefined>
): Promise<Record<string, DepositBed[]>> {
  const ids = Array.from(new Set((depositIds || []).filter(Boolean))) as string[];
  if (ids.length === 0) return {};

  const { data: depBeds } = await supabase
    .from('deposit_beds')
    .select('deposit_id, bed_id')
    .in('deposit_id', ids);

  const bedIds = Array.from(new Set((depBeds || []).map((r: any) => r.bed_id)));
  const { data: beds } = bedIds.length > 0
    ? await supabase.from('beds').select('id, name, price').in('id', bedIds)
    : { data: [] as any[] };

  const bedById = new Map((beds || []).map((b: any) => [b.id, b as DepositBed]));
  const result: Record<string, DepositBed[]> = {};
  for (const row of depBeds || []) {
    const bed = bedById.get((row as any).bed_id);
    if (bed) (result[(row as any).deposit_id] ||= []).push(bed);
  }
  return result;
}

/** Danh sach bed_id thuoc mot phieu coc (rong neu la coc nguyen phong). */
export async function getBedIdsByDepositId(depositId: string): Promise<string[]> {
  if (!depositId) return [];
  const { data, error } = await supabase
    .from('deposit_beds')
    .select('bed_id')
    .eq('deposit_id', depositId);
  if (error) {
    throw new Error(`[deposit-beds] Loi khi lay giuong cua phieu coc id=${depositId}: ${error.message}`);
  }
  return (data || []).map((r: any) => r.bed_id);
}

/** Loai coc suy ra tu so giuong: 0 -> 'room', 1 -> 'bed', >=2 -> 'group'. */
export function depositTypeFromBedCount(bedCount: number): 'room' | 'bed' | 'group' {
  if (bedCount <= 0) return 'room';
  if (bedCount === 1) return 'bed';
  return 'group';
}

/**
 * Suy ra "bed_id dai dien" theo ngu nghia cu de giu tuong thich:
 * chi coc 1 giuong le moi co bed_id; coc nhom / nguyen phong tra ve null.
 */
export function singleBedIdFromBeds(beds: Array<{ id: string }> | undefined | null): string | null {
  return beds && beds.length === 1 ? beds[0].id : null;
}
