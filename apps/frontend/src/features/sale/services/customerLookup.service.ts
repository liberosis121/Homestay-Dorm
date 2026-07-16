import apiClient from '../../../lib/api.client';

export interface Customer {
  id: string;
  code: string;
  fullName: string;
  full_name: string;
  email: string;
  phone: string;
  renting_room_name?: string;
  avatar: string;
  status: 'active' | 'inactive' | 'new';
  tier: 'VIP' | 'Loyal' | 'New' | 'Old';
  joinDate: string;
  created_at: string;
  personalInfo: {
    cccd: string;
    phone: string;
    email: string;
    birthDate: string;
    nationality: string;
    address: string;
  };
  registrations: Array<{
    id: string;
    roomType: string;
    date: string;
    status: 'completed' | 'pending' | 'cancelled';
  }>;
  viewings: Array<{
    roomName: string;
    branch: string;
    date: string;
    staffName: string;
    status: 'confirmed' | 'cancelled' | 'viewed';
  }>;
  deposits: Array<{
    content: string;
    date: string;
    amount: string;
    status: 'approved' | 'pending' | 'refunded';
  }>;
  contracts: Array<{
    id: string;
    contractCode?: string;
    period: string;
    status: 'active' | 'expired' | 'pending';
    rawStatus?: string;
    startDate?: string;
    endDate?: string;
    signDate?: string;
    roomName?: string;
    roomType?: string;
    branchName?: string;
    rentPrice?: number;
    depositAmount?: number;
    depositId?: string;
    contractType?: string;
    paymentCycle?: string;
  }>;
}

const EMPTY_FIELD = '—';

const textOrDash = (value: unknown) => {
  if (typeof value !== 'string') return EMPTY_FIELD;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : EMPTY_FIELD;
};

const normalizeCustomer = (raw: any): Customer => {
  const createdAt = typeof raw.created_at === 'string' ? raw.created_at : '';
  const personalInfo = raw.personalInfo || {};

  return {
    id: textOrDash(raw.id),
    code: textOrDash(raw.code || raw.id),
    fullName: textOrDash(raw.fullName || raw.full_name),
    full_name: textOrDash(raw.full_name || raw.fullName),
    email: textOrDash(raw.email),
    phone: textOrDash(raw.phone),
    renting_room_name: raw.renting_room_name ? textOrDash(raw.renting_room_name) : undefined,
    avatar: typeof raw.avatar === 'string' ? raw.avatar : '',
    status: raw.status === 'active' || raw.status === 'inactive' || raw.status === 'new' ? raw.status : 'new',
    tier: raw.tier === 'VIP' || raw.tier === 'Loyal' || raw.tier === 'Old' || raw.tier === 'New' ? raw.tier : 'New',
    joinDate: createdAt ? textOrDash(raw.joinDate) : EMPTY_FIELD,
    created_at: createdAt,
    personalInfo: {
      cccd: textOrDash(personalInfo.cccd),
      phone: textOrDash(personalInfo.phone || raw.phone),
      email: textOrDash(personalInfo.email || raw.email),
      birthDate: textOrDash(personalInfo.birthDate),
      nationality: textOrDash(personalInfo.nationality),
      address: textOrDash(personalInfo.address),
    },
    registrations: Array.isArray(raw.registrations) ? raw.registrations : [],
    viewings: Array.isArray(raw.viewings)
      ? raw.viewings.map((viewing: any) => ({
          ...viewing,
          roomName: textOrDash(viewing.roomName),
          branch: textOrDash(viewing.branch),
          date: textOrDash(viewing.date),
          staffName: textOrDash(viewing.staffName),
        }))
      : [],
    deposits: Array.isArray(raw.deposits) ? raw.deposits : [],
    contracts: Array.isArray(raw.contracts) ? raw.contracts : [],
  };
};

export const customerLookupService = {
  fetchCustomers: async () => {
    const res = await apiClient.get('/staff/customers');
    const rows = (res.data as any).data || [];
    return Array.isArray(rows) ? rows.map(normalizeCustomer) : [];
  },
};
