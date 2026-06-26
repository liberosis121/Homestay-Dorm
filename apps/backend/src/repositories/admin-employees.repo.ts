import { supabase } from '../utils/supabase';
import crypto from 'crypto';

export interface DbEmployeeAdmin {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'sale' | 'manager' | 'accountant' | 'admin';
  branch: string;
  status: 'active' | 'locked';
  joinDate: string;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const adminEmployeesRepo = {
  findAll: async (): Promise<DbEmployeeAdmin[]> => {
    // 1. Fetch all employees from nhan_vien table
    const { data: employees, error: eErr } = await supabase
      .from('nhan_vien')
      .select('*');

    if (eErr) throw eErr;

    // 2. Fetch corresponding profiles
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, role');

    if (pErr) throw pErr;

    // Map profiles by id
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // 3. Map to Employee structure
    return (employees || []).map((emp: any) => {
      const prof = profileMap.get(emp.id);
      const isLocked = prof?.role === 'locked';

      // Map branchId to name
      let branchName = 'Quận 1';
      if (emp.branch_id === 'CN-002') branchName = 'Quận 3';
      else if (emp.branch_id === 'CN-003') branchName = 'Bình Thạnh';

      return {
        id: emp.id,
        full_name: emp.full_name || 'Nhân viên',
        email: emp.email || '',
        phone: emp.phone || '',
        role: emp.role || 'sale',
        branch: branchName,
        status: isLocked ? 'locked' : 'active',
        joinDate: formatDate(emp.join_date)
      };
    });
  },

  create: async (emp: {
    full_name: string;
    email: string;
    phone: string;
    role: string;
    branch: string;
  }): Promise<DbEmployeeAdmin> => {
    const userId = crypto.randomUUID();

    // Map branch name to branch_id
    let branchId = 'CN-001';
    if (emp.branch.includes('Quận 3')) branchId = 'CN-002';
    else if (emp.branch.includes('Bình Thạnh')) branchId = 'CN-003';

    // Insert profile record
    const { error: pErr } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: emp.email,
        full_name: emp.full_name,
        phone: emp.phone,
        role: emp.role,
        created_at: new Date().toISOString()
      });

    if (pErr) throw pErr;

    // Insert employee record
    const joinDateStr = new Date().toISOString().split('T')[0];
    const { error: eErr } = await supabase
      .from('nhan_vien')
      .insert({
        id: userId,
        full_name: emp.full_name,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        branch_id: branchId,
        join_date: joinDateStr,
        dob: '1995-01-01',
        gender: 'Nam'
      });

    if (eErr) throw eErr;

    return {
      id: userId,
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role as any,
      branch: emp.branch,
      status: 'active',
      joinDate: formatDate(joinDateStr)
    };
  },

  update: async (id: string, emp: {
    full_name?: string;
    email?: string;
    phone?: string;
    role?: string;
    branch?: string;
  }): Promise<any> => {
    const profileUpdate: any = {};
    if (emp.full_name !== undefined) profileUpdate.full_name = emp.full_name;
    if (emp.email !== undefined) profileUpdate.email = emp.email;
    if (emp.phone !== undefined) profileUpdate.phone = emp.phone;
    if (emp.role !== undefined) profileUpdate.role = emp.role;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: pErr } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', id);

      if (pErr) throw pErr;
    }

    const nvUpdate: any = {};
    if (emp.full_name !== undefined) nvUpdate.full_name = emp.full_name;
    if (emp.email !== undefined) nvUpdate.email = emp.email;
    if (emp.phone !== undefined) nvUpdate.phone = emp.phone;
    if (emp.role !== undefined) nvUpdate.role = emp.role;

    if (emp.branch !== undefined) {
      let branchId = 'CN-001';
      if (emp.branch.includes('Quận 3')) branchId = 'CN-002';
      else if (emp.branch.includes('Bình Thạnh')) branchId = 'CN-003';
      nvUpdate.branch_id = branchId;
    }

    if (Object.keys(nvUpdate).length > 0) {
      const { error: eErr } = await supabase
        .from('nhan_vien')
        .update(nvUpdate)
        .eq('id', id);

      if (eErr) throw eErr;
    }

    return { id, ...emp };
  },

  toggleLock: async (id: string): Promise<string> => {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single();

    if (pErr) throw pErr;

    let nextRole: string;

    if (profile.role === 'locked') {
      const { data: nv, error: nvErr } = await supabase
        .from('nhan_vien')
        .select('role')
        .eq('id', id)
        .single();

      if (nvErr) throw nvErr;
      nextRole = nv.role || 'sale';
    } else {
      nextRole = 'locked';
    }

    const { error: uErr } = await supabase
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', id);

    if (uErr) throw uErr;

    return nextRole === 'locked' ? 'locked' : 'active';
  }
};
