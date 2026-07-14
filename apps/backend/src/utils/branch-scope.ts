/**
 * branch-scope.ts — Rang buoc PHAM VI CHI NHANH cho nhan vien.
 *
 * Nghiep vu: Nhan vien Sale va Ke toan chi duoc thay thong tin thuoc CO SO CUA MINH
 * (lich xem phong, cac loai hoa don, hop dong). Quan ly cung chi quan ly chi nhanh minh.
 * Rieng ADMIN thay toan he thong.
 *
 * Luu y kien truc: bang `profiles` KHONG co cot branch_id — chi bang `employees` moi co.
 * Vi vay middleware requireRole (chi doc profiles) khong du, phai tra cuu them `employees`.
 *
 * Duong lien ket toi chi nhanh:
 *   hoa don -> hop dong / phieu coc -> phong (rooms.branch_id) -> chi nhanh
 */

import { supabase } from './supabase';
import { USER_ROLE } from '../types/constants';

/**
 * Lay branch_id cua nhan vien dang dang nhap.
 *
 * @returns branch_id de LOC, hoac null nghia la KHONG loc (admin, hoac nhan vien chua
 *          duoc gan chi nhanh, hoac khong phai nhan vien).
 */
export async function getStaffBranchId(userId?: string): Promise<string | null> {
  if (!userId) return null;

  const { data: employee, error } = await supabase
    .from('employees')
    .select('branch_id, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[branch-scope] Khong doc duoc chi nhanh cua nhan vien:', error.message);
    return null;
  }
  if (!employee) return null;

  // Admin quan tri toan he thong -> khong gioi han chi nhanh.
  if (employee.role === USER_ROLE.ADMIN) return null;

  return employee.branch_id || null;
}

/**
 * Loc danh sach ban ghi theo chi nhanh. Neu branchId la null (admin / chua gan chi nhanh)
 * thi tra nguyen danh sach.
 *
 * @param getBranchId Ham rut branch_id ra khoi 1 ban ghi (moi loai ban ghi long nhau mot kieu).
 */
export function scopeToBranch<T>(
  items: T[],
  branchId: string | null,
  getBranchId: (item: T) => string | null | undefined
): T[] {
  if (!branchId) return items;
  return items.filter((item) => getBranchId(item) === branchId);
}
