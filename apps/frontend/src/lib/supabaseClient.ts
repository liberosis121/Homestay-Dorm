import roomDorm from '../assets/room-dorm.jpg';
import roomSingle from '../assets/room-single.jpg';
import roomStudio from '../assets/room-studio.jpg';
import roomTwin from '../assets/room-twin.jpg';
import avatarAdmin from '../assets/avatar-admin.png';
import avatarManager from '../assets/avatar-manager.png';
import avatarSale from '../assets/avatar-sale.png';
import avatarAccountant from '../assets/avatar-accountant.png';
import avatarCustomer from '../assets/avatar-customer.png';
import avatarNewCustomer from '../assets/avatar-newcustomer.png';
import { MOCK_CUSTOMERS } from './mockCustomers';


// Mock database key in Local Storage
const STORAGE_KEY = 'homestay_dorm_mock_db';

// Interfaces for our Mock DB Entities
export interface Profile {
  id: string;
  email: string;
  role: 'customer' | 'sale' | 'accountant' | 'manager' | 'admin';
  full_name: string;
  phone?: string;
  avatar_url?: string;
  renting_room_name?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  manager_id?: string;
}

export interface Room {
  id: string;
  branch_id: string;
  name: string;
  capacity: number;
  current_occupants: number;
  floor: number;
  room_type: string;
  gender_type: 'male' | 'female' | 'unisex';
  has_ac: boolean;
  has_private_wc: boolean;
  price: number;
  amenities: string[];
  area?: number;
  image_url: string;
  status: 'available' | 'deposited' | 'occupied' | 'maintenance' | 'partial';
}

export interface Bed {
  id: string;
  room_id: string;
  name: string;
  price: number;
  status: 'available' | 'deposited' | 'occupied' | 'maintenance';
}

export interface ViewingSchedule {
  id: string;
  customer_id: string;
  room_id: string;
  room_name: string;
  room_image_url: string;
  branch_name: string;
  branch_address: string;
  scheduled_date: string;
  scheduled_time: string;
  staff_name: string;
  staff_phone: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  timeline_step: 1 | 2 | 3;
  note?: string;
  created_at: string;
}

export interface CustomerDepositRequest {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  room_id: string;
  room_name: string;
  room_image_url: string;
  branch_name: string;
  viewing_schedule_id: string;
  deposit_amount: number;
  expected_move_in_date: string;
  // 'pending' là giá trị thật từ DB Supabase; 'pending_sale_confirmation' là giá trị mock DB cũ.
  status: 'pending' | 'pending_sale_confirmation' | 'pending_payment' | 'confirmed' | 'invoice_created' | 'paid' | 'cancelled';
  note?: string;
  created_at: string;
}

export interface RentalRegistration {
  id: string;
  customer_id?: string;
  customer_name: string;
  phone?: string;
  customer_phone?: string;
  email?: string;
  customer_email?: string;
  gender?: string;
  preferred_room_type?: string;
  rental_type?: string;
  occupants_count?: number;
  preferred_branch_id?: string;
  preferred_branch_name?: string;
  budget_range?: string;
  move_in_date?: string;
  preferred_viewing_date?: string;
  preferred_viewing_time?: string;
  viewing_time_note?: string;
  preferred_amenities?: string[];
  note?: string;
  status?: 'pending_schedule' | 'scheduled' | 'cancelled';
  created_at: string;
  interested_room_id?: string;
  interested_room_name?: string;
}

// ─── Sale Dashboard Interfaces ────────────────────────────────────────────────
export interface TodayAppointment {
  id: string;
  time: string;             // "09:30"
  customer_name: string;
  room_type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  branch: string;
}

export interface RecentRegistration {
  id: string;
  customer_name: string;
  time_ago: string;         // "2 phút trước"
  room_name: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  detail: string;
  type: 'contract' | 'schedule' | 'system' | 'registration';
}

// ─── Customer Services Interfaces ─────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  category: 'essential' | 'utility' | 'convenience' | 'premium';
  description: string;
  unit_price: number;
  billing_cycle: 'monthly' | 'per_use' | 'per_kwh' | 'per_m3';
  status: 'available' | 'unavailable' | 'coming_soon';
  icon: string;
  is_default: boolean;
}

export interface ServiceSubscription {
  id: string;
  customer_id: string;
  service_id: string;
  service_name: string;
  registered_date: string;
  monthly_cost: number;
  status: 'active' | 'suspended' | 'cancelled';
}

export interface ConsumptionRecord {
  id: string;
  customer_id: string;
  room_id: string;
  period: string;
  electricity_kwh: number;
  electricity_cost: number;
  water_m3: number;
  water_cost: number;
  recorded_at: string;
}

// ─── Accountant Phase Interfaces ────────────────────────────────────────────────
export interface DepositInvoice {
  id: string;             // "DEP-XXXX"
  customer_id: string;
  customer_name: string;
  room_id: string;
  room_name: string;
  amount: number;
  deadline: string;       // ISO date or string
  payment_method: 'transfer' | 'cash';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  created_at: string;
  note?: string;
  deposit_request_id?: string;
}

export interface CheckinInvoice {
  id: string;             // "CHK-XXXX"
  customer_id: string;
  customer_name: string;
  room_id: string;
  room_name: string;
  room_type?: string;
  checkin_date: string;
  rent_amount: number;
  deposit_amount?: number;
  deposit_ref: string;    // ref to DepositInvoice
  contract_id?: string;   // ref to contract (nguồn hợp đồng active)
  services: { name: string; amount: number }[];
  total: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'draft' | 'unpaid';
  created_at: string;
}

export interface MonthlyInvoice {
  id: string;             // "MON-XXXX"
  customer_id: string;
  customer_name: string;
  room_id: string;
  room_name: string;
  branch_id?: string;
  branch_name?: string;
  period: string;         // "06/2026"
  rent_amount: number;
  electricity_kwh: number;
  electricity_cost: number;
  water_m3: number;
  water_cost: number;
  services_cost: number;
  total: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  created_at: string;
  incidentals?: {
    id: string;
    name: string;
    amount: number;
    recorded_date?: string;
  }[];
}

export interface RefundRecord {
  id: string;             // "REF-XXXX"
  customer_id: string;
  customer_name: string;
  room_id: string;
  room_name: string;
  checkout_date: string;
  deposit_original: number;
  damage_deductions: { item: string; amount: number; condition?: string; note?: string }[];
  debt_deductions: number;
  total_deductions: number;
  refund_amount: number;
  status: 'pending' | 'calculated' | 'confirmed' | 'paid';
  created_at: string;
  deductions?: {
    id: string;
    reason: string;
    amount: number;
    note?: string;
  }[];
  type?: 'checkout' | 'cancellation';
  cancellation_reason?: 'failed_residency' | 'user_cancelled' | 'other';
}

export interface PayoutRecord {
  id: string;             // "PAY-XXXX"
  refund_id: string;
  customer_id: string;
  customer_name: string;
  bank_account: string;
  bank_name: string;
  account_holder: string;
  amount: number;
  payment_method: 'transfer' | 'cash';
  status: 'pending' | 'processing' | 'completed';
  paid_at?: string;
  created_at: string;
  is_liquidated?: boolean;
}

// ─── Manager Phase Interfaces ────────────────────────────────────────────────
export interface ManagerDeposit {
  id: string;             // "MGR-DEP-XXXX"
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  room_id: string;
  room_name: string;
  deposit_type: 'room' | 'bed' | 'group';  // Đặt cọc cả phòng, giường lẻ hoặc nhóm giường
  bed_name?: string;
  bed_names?: string[];
  occupants_count?: number;
  monthly_rent?: number;
  amount: number;
  deposit_date: string;
  bill_image_url: string;
  bank_name: string;
  account_number: string;
  status: 'pending' | 'approved' | 'rejected' | 'need_more' | 'expired';
  note?: string;
  reviewer_note?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ResidencyCheck {
  id: string;             // "RC-XXXX"
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  room_id: string;
  room_name: string;
  id_type: 'cccd' | 'passport' | 'other';
  id_number: string;
  dob: string;
  nationality: 'vietnamese' | 'foreign';
  front_image_url: string;
  back_image_url?: string;
  checklist: {
    valid_documents: boolean;
    info_matches: boolean;
    age_verified: boolean;
    no_violation: boolean;
  };
  violation_note?: string;
  status: 'pending' | 'approved' | 'rejected';
  confirmed?: boolean;
  created_at?: string;
  permanent_address?: string;
  purpose?: string;
  deposit_ref?: string;   // Mã phiếu cọc THẬT (dùng để gom nhóm + thao tác lên cọc)
}

export interface AssetHandover {
  id: string;             // "AHO-XXXX"
  contract_id: string;
  customer_id: string;
  customer_name: string;
  room_id: string;
  room_name: string;
  bed_id?: string;
  bed_name?: string;
  handover_date: string;
  checklist: { item: string; serial_number: string; condition: string; note?: string; checked: boolean; compensation?: number }[];
  customer_signed: boolean;
  manager_signed: boolean;
  signature_ip?: string;
  signature_timestamp?: string;
  status: 'pending' | 'signed' | 'partial';
  created_at: string;
  note?: string;
  type?: 'checkin' | 'checkout';
}

export interface ManagedAsset {
  id: string;             // "AST-XXXX"
  name: string;
  category: 'furniture' | 'electronics' | 'appliance' | 'fixture';
  serial_number?: string;
  branch_id?: string;
  room_id?: string;
  bed_id?: string;
  current_location: string;  // "Phòng 101" | "Kho"
  location_type: 'room' | 'warehouse' | 'maintenance';
  status: 'in_use' | 'in_stock' | 'maintenance' | 'retired';
  purchase_date: string;
  purchase_price: number;
  depreciation_rate: number; // 0-100
  transfer_history: { from: string; to: string; date: string; reason: string; by: string }[];
}

export interface TenantMember {
  name: string;
  cccd: string;
  phone: string;
  email?: string;
  role: 'representative' | 'member';
}

export interface ManagerContract {
  id: string;             // "CON-XXXX"
  contract_code: string;  // "HD-2026-XXXX"
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_cccd: string;
  customer_address: string;
  room_id: string;
  room_name: string;
  deposit_type: 'room' | 'bed' | 'group';
  bed_name?: string;
  branch_name: string;
  rent_amount: number;
  deposit_amount: number;
  service_fee: number;
  start_date: string;
  end_date: string;
  duration: string;
  status: 'active' | 'expired' | 'terminated';
  terms: string;
  payment_policy: string;
  termination_policy: string;
  manager_name: string;
  manager_phone: string;
  created_at: string;
  // Thuộc tính bổ sung theo ERD
  deposit_code: string;    // Khóa ngoại Ma dat coc
  sale_staff_name: string; // Khóa ngoại Ma nv lap (Sale phụ trách)
  payment_cycle: '1_month' | '3_months' | '6_months'; // Kỳ thanh toán
  contract_type: 'long_term' | 'short_term';          // Loại hợp đồng
  room_type: string;       // Loại phòng (từ bảng Phong)
  floor_number: number;    // Tầng (từ bảng Phong)
  tenants?: TenantMember[]; // Chi tiết khách thuê (bảng CT Hop Dong Khach Hang)
}

// Helper to generate dynamic mock data for Accountant Phase
const generateDepositInvoices = (): DepositInvoice[] => {
  const list: DepositInvoice[] = [];
  const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Anh Tuấn', 'Đỗ Mỹ Linh', 'Nguyễn Thị Sâm', 'Bùi Văn Hải', 'Phan Thanh Tùng', 'Ngô Quốc Bảo', 'Vũ Thị Hạnh', 'Đặng Văn Khánh'];
  const rooms = [
    { id: 'r-1', name: 'Phòng 101 (Nam)' },
    { id: 'r-2', name: 'Phòng 102 (Nữ)' },
    { id: 'r-3', name: 'Phòng 201 (Nam)' },
    { id: 'r-4', name: 'Phòng 202 (Nữ)' },
    { id: 'r-5', name: 'Phòng 103 (Nam)' },
    { id: 'r-6', name: 'Phòng 203 (Nữ)' }
  ];
  const statuses: ('pending' | 'paid' | 'overdue' | 'cancelled')[] = ['paid', 'paid', 'pending', 'overdue', 'cancelled'];

  for (let i = 1; i <= 32; i++) {
    const name = names[i % names.length];
    const room = rooms[i % rooms.length];
    const status = i <= 3 ? statuses[i] : statuses[Math.floor(Math.random() * statuses.length)];
    const date = new Date(2026, 4, 1 + i); // May 2026
    const deadline = new Date(date);
    deadline.setDate(deadline.getDate() + 2);

    list.push({
      id: `DEP-${1000 + i}`,
      customer_id: `u-mock-${100 + i}`,
      customer_name: name,
      room_id: room.id,
      room_name: room.name,
      amount: i % 2 === 0 ? 1000000 : 1500000,
      deadline: deadline.toISOString().split('T')[0] + ' 12:00',
      payment_method: i % 3 === 0 ? 'cash' : 'transfer',
      status,
      created_at: date.toISOString().split('T')[0] + ' 10:00',
      note: i % 4 === 0 ? 'Khách hàng đặt cọc online giữ chỗ' : undefined
    });
  }

  // Append test cases for u-6
  list.push(
    {
      id: 'DEP-TEST-01',
      customer_id: 'u-6',
      customer_name: 'Nguyễn Văn Nam (Khách mới)',
      room_id: 'r-3',
      room_name: 'Phòng 201 (Nam)',
      amount: 1500000,
      deadline: '2026-06-12 12:00',
      payment_method: 'transfer',
      status: 'pending',
      created_at: '2026-06-05 10:00',
      deposit_request_id: 'cdr-test-invoice'
    },
    {
      id: 'DEP-TEST-02',
      customer_id: 'u-6',
      customer_name: 'Nguyễn Văn Nam (Khách mới)',
      room_id: 'r-4',
      room_name: 'Phòng 202 (Nữ)',
      amount: 1200000,
      deadline: '2026-06-11 12:00',
      payment_method: 'transfer',
      status: 'pending',
      created_at: '2026-06-04 09:00',
      deposit_request_id: 'cdr-test-pending-mgr'
    },
    {
      id: 'DEP-TEST-03',
      customer_id: 'u-6',
      customer_name: 'Nguyễn Văn Nam (Khách mới)',
      room_id: 'r-5',
      room_name: 'Phòng 103 (Nam)',
      amount: 1000000,
      deadline: '2026-05-17 12:00',
      payment_method: 'transfer',
      status: 'paid',
      created_at: '2026-05-15 09:00',
      deposit_request_id: 'cdr-test-paid'
    }
  );

  return list;
};

const generateCheckinInvoices = (): CheckinInvoice[] => {
  const list: CheckinInvoice[] = [];
  const names = ['Trần Văn Hùng', 'Lê Thị Mai', 'Nguyễn Tiến Dũng', 'Phạm Ngọc Hải', 'Vũ Hoàng Anh', 'Đỗ Phương Thảo', 'Bùi Minh Tuấn', 'Ngô Quốc Việt'];
  const rooms = [
    { id: 'r-1', name: 'Phòng 101 (Nam)', price: 1500000 },
    { id: 'r-2', name: 'Phòng 102 (Nữ)', price: 2000000 },
    { id: 'r-4', name: 'Phòng 202 (Nữ)', price: 1200000 },
    { id: 'r-5', name: 'Phòng 103 (Nam)', price: 1600000 }
  ];
  const statuses: ('pending' | 'paid' | 'overdue' | 'cancelled' | 'draft')[] = ['paid', 'paid', 'pending', 'overdue', 'draft'];

  for (let i = 1; i <= 26; i++) {
    const name = names[i % names.length];
    const room = rooms[i % rooms.length];
    const status = i <= 2 ? statuses[i] : statuses[Math.floor(Math.random() * statuses.length)];
    const checkinDate = new Date(2026, 4, 5 + i);
    const rentAmount = room.price;
    const services = [
      { name: 'Phí vệ sinh ban đầu', amount: 200000 },
      { name: 'Phí làm thẻ từ (2x)', amount: 100000 }
    ];
    const total = rentAmount * 2 + 300000; // rent + deposit + services

    list.push({
      id: `CHK-${1000 + i}`,
      customer_id: `u-mock-chk-${100 + i}`,
      customer_name: name,
      room_id: room.id,
      room_name: room.name,
      checkin_date: checkinDate.toISOString().split('T')[0],
      rent_amount: rentAmount,
      deposit_ref: `DEP-${1000 + i}`,
      services,
      total,
      status,
      created_at: checkinDate.toISOString().split('T')[0] + ' 09:00'
    });
  }
  return list;
};

const generateMonthlyInvoices = (): MonthlyInvoice[] => {
  const list: MonthlyInvoice[] = [];
  const names = ['Nguyễn Văn Hải', 'Trần Thị Thu', 'Phạm Minh Khoa', 'Lê Lâm Trí Đức', 'Đinh Thị Hoa', 'Vũ Tú Anh', 'Nguyễn Thị Trinh', 'Trịnh Hoài Nam'];
  const rooms = [
    { id: 'r-1', name: 'Phòng 101 (Nam)', price: 1500000 },
    { id: 'r-2', name: 'Phòng 102 (Nữ)', price: 2000000 },
    { id: 'r-3', name: 'Phòng 201 (Nam)', price: 900000 },
    { id: 'r-4', name: 'Phòng 202 (Nữ)', price: 1200000 },
    { id: 'r-5', name: 'Phòng 103 (Nam)', price: 1600000 },
    { id: 'r-6', name: 'Phòng 203 (Nữ)', price: 2500000 }
  ];
  const statuses: ('pending' | 'paid' | 'overdue')[] = ['paid', 'paid', 'pending', 'overdue'];

  for (let i = 1; i <= 52; i++) {
    const name = names[i % names.length];
    const room = rooms[i % rooms.length];
    const status = i <= 3 ? statuses[i] : statuses[Math.floor(Math.random() * statuses.length)];
    const period = i % 2 === 0 ? '05/2026' : '06/2026';
    const rentAmount = room.price;
    const electricity_kwh = 50 + (i * 7) % 150;
    const electricity_cost = electricity_kwh * 3500;
    const water_m3 = 4 + (i * 3) % 12;
    const water_cost = water_m3 * 15000;
    const services_cost = 150000; // wifi, rac
    const total = rentAmount + electricity_cost + water_cost + services_cost;
    const dueDate = period === '05/2026' ? '2026-05-10' : '2026-06-10';

    list.push({
      id: `MON-${1000 + i}`,
      customer_id: `u-mock-mon-${100 + i}`,
      customer_name: name,
      room_id: room.id,
      room_name: room.name,
      period,
      rent_amount: rentAmount,
      electricity_kwh,
      electricity_cost,
      water_m3,
      water_cost,
      services_cost,
      total,
      due_date: dueDate,
      status,
      created_at: (period === '05/2026' ? '2026-05-01' : '2026-06-01') + ' 08:00'
    });
  }
  return list;
};

const generateRefundRecords = (): RefundRecord[] => {
  const list: RefundRecord[] = [];
  const names = ['Hoàng Thị Mai', 'Nguyễn Tiến Đạt', 'Lưu Quốc Khánh', 'Phạm Phương Thảo', 'Bùi Văn Tiến', 'Võ Thị Hoa', 'Nguyễn Văn Đô'];
  const rooms = [
    { id: 'r-1', name: 'Phòng 101 (Nam)' },
    { id: 'r-2', name: 'Phòng 102 (Nữ)' },
    { id: 'r-4', name: 'Phòng 202 (Nữ)' },
    { id: 'r-6', name: 'Phòng 203 (Nữ)' }
  ];
  const statuses: ('pending' | 'calculated' | 'confirmed' | 'paid')[] = ['pending', 'calculated', 'confirmed', 'paid'];

  for (let i = 1; i <= 22; i++) {
    const name = names[i % names.length];
    const room = rooms[i % rooms.length];
    const status = i <= 3 ? statuses[i] : statuses[Math.floor(Math.random() * statuses.length)];
    const checkoutDate = new Date(2026, 5, 1 + i);

    const isCancellation = i % 4 === 0;
    const type = isCancellation ? 'cancellation' : 'checkout';
    const cancellation_reason = isCancellation ? (i % 2 === 0 ? 'failed_residency' : 'user_cancelled') : undefined;
    const deposit_original = 2000000;

    let damage_deductions: { item: string; amount: number }[] = [];
    let debt_deductions = 0;
    let total_deductions = 0;
    let refund_amount = deposit_original;

    if (isCancellation) {
      total_deductions = deposit_original * 0.2;
      refund_amount = deposit_original * 0.8;
    } else {
      damage_deductions = i % 3 === 0 ? [
        { item: 'Vỡ gương nhà tắm', amount: 500000 },
        { item: 'Hỏng tay nắm cửa tủ quần áo', amount: 350000 }
      ] : [];
      debt_deductions = i % 4 === 0 ? 350000 : 0;
      total_deductions = damage_deductions.reduce((sum, item) => sum + item.amount, 0) + debt_deductions;
      refund_amount = deposit_original - total_deductions;
    }

    list.push({
      id: `REF-${1000 + i}`,
      customer_id: `u-mock-ref-${100 + i}`,
      customer_name: name,
      room_id: room.id,
      room_name: room.name,
      checkout_date: checkoutDate.toISOString().split('T')[0],
      deposit_original,
      damage_deductions,
      debt_deductions,
      total_deductions,
      refund_amount,
      status,
      created_at: checkoutDate.toISOString().split('T')[0] + ' 10:00',
      type,
      cancellation_reason
    });
  }
  return list;
};

const generatePayoutRecords = (): PayoutRecord[] => {
  const list: PayoutRecord[] = [];
  const names = ['Hoàng Thị Mai', 'Nguyễn Tiến Đạt', 'Lưu Quốc Khánh', 'Phạm Phương Thảo', 'Bùi Văn Tiến', 'Võ Thị Hoa', 'Nguyễn Văn Đô'];
  const banks = ['Vietcombank', 'Techcombank', 'MB Bank', 'ACB', 'BIDV'];
  const statuses: ('pending' | 'processing' | 'completed')[] = ['pending', 'processing', 'completed'];

  for (let i = 1; i <= 22; i++) {
    const name = names[i % names.length];
    const status = i <= 2 ? statuses[i] : statuses[Math.floor(Math.random() * statuses.length)];
    const amount = 2000000 - (i % 3 === 0 ? 850000 : 0) - (i % 4 === 0 ? 350000 : 0);
    const bankName = banks[i % banks.length];
    const bankAccount = `001100${12345 + i}`;

    list.push({
      id: `PAY-${1000 + i}`,
      refund_id: `REF-${1000 + i}`,
      customer_id: `u-mock-pay-${100 + i}`,
      customer_name: name,
      bank_account: bankAccount,
      bank_name: bankName,
      account_holder: name.toUpperCase(),
      amount,
      payment_method: i % 5 === 0 ? 'cash' : 'transfer',
      status,
      paid_at: status === 'completed' ? new Date(2026, 5, 2 + i).toISOString().split('T')[0] : undefined,
      created_at: new Date(2026, 5, 1 + i).toISOString().split('T')[0]
    });
  }
  return list;
};

const INITIAL_DB = {
  customers: MOCK_CUSTOMERS,
  profiles: [
    { id: 'u-1', email: 'admin@homestay.com', role: 'admin', full_name: 'Hoàng Quốc Việt (Admin)', phone: '0901234567', avatar_url: avatarAdmin },
    { id: 'u-2', email: 'manager@homestay.com', role: 'manager', full_name: 'Trần Kim Yến (Quản lý)', phone: '0907654321', avatar_url: avatarManager },
    { id: 'u-3', email: 'sale@homestay.com', role: 'sale', full_name: 'Nguyễn Thị Trúc Hằng (NV Sale)', phone: '0912345678', avatar_url: avatarSale },
    { id: 'u-4', email: 'accountant@homestay.com', role: 'accountant', full_name: 'Lê Hoàng Nhật Anh (Kế toán)', phone: '0987654321', avatar_url: avatarAccountant },
    { id: 'u-5', email: 'customer@gmail.com', role: 'customer', full_name: 'Lê Lâm Trí Đức (Khách hàng)', phone: '0933344556', renting_room_name: 'Phòng 101 (Nam)', avatar_url: avatarCustomer },
    { id: 'u-6', email: 'newcustomer@gmail.com', role: 'customer', full_name: 'Nguyễn Văn Nam (Khách mới)', phone: '0977889900', avatar_url: avatarNewCustomer },
    // Sync with real DB profiles
    { id: 'c001c001-c001-c001-c001-c001c001c001', email: 'customer1@gmail.com', role: 'customer', full_name: 'Phạm Thị Khách Hàng 1', phone: '0944445566', renting_room_name: 'P-101', avatar_url: avatarCustomer },
    { id: 'c002c002-c002-c002-c002-c002c002c002', email: 'customer2@gmail.com', role: 'customer', full_name: 'Nguyễn Văn Khách Hàng 2', phone: '0955556677', avatar_url: avatarCustomer },
    { id: 'c003c003-c003-c003-c003-c003c003c003', email: 'customer3@gmail.com', role: 'customer', full_name: 'Lê Thị Khách Hàng 3', phone: '0966667788', avatar_url: avatarCustomer },
    { id: 'e001e001-e001-e001-e001-e001e001e001', email: 'sale@homestay.vn', role: 'sale', full_name: 'Nguyễn Văn Sale', phone: '0901234567', avatar_url: avatarSale },
    { id: 'e002e002-e002-e002-e002-e002e002e002', email: 'manager@homestay.vn', role: 'manager', full_name: 'Trần Thị Quản Lý', phone: '0907654321', avatar_url: avatarManager },
    { id: 'e003e003-e003-e003-e003-e003e003e003', email: 'accountant@homestay.vn', role: 'accountant', full_name: 'Lê Văn Kế Toán', phone: '0987654321', avatar_url: avatarAccountant },
    { id: 'e004e004-e004-e004-e004-e004e004e004', email: 'admin@homestay.vn', role: 'admin', full_name: 'Hoàng Admin', phone: '0901234567', avatar_url: avatarAdmin }
  ] as Profile[],
  branches: [
    { id: 'b-1', name: 'Chi nhánh Quận 1', address: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM', manager_id: 'u-2' },
    { id: 'b-2', name: 'Chi nhánh Thủ Đức (Khu ĐHQG)', address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM', manager_id: 'u-2' }
  ] as Branch[],
  rooms: [
    { id: 'r-1', branch_id: 'b-1', name: 'Phòng 101 (Nam)', capacity: 4, current_occupants: 1, floor: 1, room_type: 'Dorm', gender_type: 'male', has_ac: true, has_private_wc: true, price: 1500000, amenities: ['AC', 'Wifi', 'Private WC'], image_url: roomDorm, status: 'available' },
    { id: 'r-2', branch_id: 'b-1', name: 'Phòng 102 (Nữ)', capacity: 4, current_occupants: 0, floor: 1, room_type: 'Studio', gender_type: 'female', has_ac: true, has_private_wc: true, price: 2000000, amenities: ['AC', 'Wifi', 'Private WC', 'Kitchen'], image_url: roomStudio, status: 'available' },
    { id: 'r-3', branch_id: 'b-2', name: 'Phòng 201 (Nam)', capacity: 8, current_occupants: 8, floor: 2, room_type: 'Dorm', gender_type: 'male', has_ac: false, has_private_wc: false, price: 900000, amenities: ['Wifi', 'Washing Machine'], image_url: roomDorm, status: 'occupied' },
    { id: 'r-4', branch_id: 'b-2', name: 'Phòng 202 (Nữ)', capacity: 6, current_occupants: 2, floor: 2, room_type: 'Twin', gender_type: 'female', has_ac: true, has_private_wc: true, price: 1200000, amenities: ['AC', 'Wifi', 'Washing Machine'], image_url: roomTwin, status: 'available' },
    { id: 'r-5', branch_id: 'b-1', name: 'Phòng 103 (Nam)', capacity: 6, current_occupants: 2, floor: 1, room_type: 'Dorm', gender_type: 'male', has_ac: true, has_private_wc: true, price: 1600000, amenities: ['AC', 'Wifi', 'Private WC', 'Washing Machine'], image_url: roomDorm, status: 'available' },
    { id: 'r-6', branch_id: 'b-2', name: 'Phòng 203 (Nữ)', capacity: 2, current_occupants: 1, floor: 2, room_type: 'Studio', gender_type: 'female', has_ac: true, has_private_wc: true, price: 2500000, amenities: ['AC', 'Wifi', 'Private WC', 'Kitchen', 'TV'], image_url: roomSingle, status: 'partial' },
    { id: 'r-7', branch_id: 'b-1', name: 'Phòng 104 (Nữ)', capacity: 4, current_occupants: 0, floor: 1, room_type: 'Studio', gender_type: 'female', has_ac: true, has_private_wc: true, price: 2200000, amenities: ['AC', 'Wifi', 'Private WC', 'Kitchen'], image_url: roomStudio, status: 'available' }
  ] as Room[],
  beds: [
    { id: 'bed-1-1', room_id: 'r-1', name: 'Giường A1', price: 1500000, status: 'available' },
    { id: 'bed-1-2', room_id: 'r-1', name: 'Giường A2', price: 1500000, status: 'available' },
    { id: 'bed-1-3', room_id: 'r-1', name: 'Giường A3', price: 1500000, status: 'available' },
    { id: 'bed-1-4', room_id: 'r-1', name: 'Giường A4', price: 1500000, status: 'available' },
    { id: 'bed-2-1', room_id: 'r-2', name: 'Giường B1', price: 2000000, status: 'available' },
    { id: 'bed-2-2', room_id: 'r-2', name: 'Giường B2', price: 2000000, status: 'available' },
    { id: 'bed-2-3', room_id: 'r-2', name: 'Giường B3', price: 2000000, status: 'available' },
    { id: 'bed-2-4', room_id: 'r-2', name: 'Giường B4', price: 2000000, status: 'available' },
    { id: 'bed-3-1', room_id: 'r-3', name: 'Giường G1', price: 900000, status: 'available' },
    { id: 'bed-3-2', room_id: 'r-3', name: 'Giường G2', price: 900000, status: 'available' }
  ] as Bed[],
  viewing_schedules: [
    {
      id: 'vs-1', customer_id: 'u-6', room_id: 'r-2',
      room_name: 'Phòng 102 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Quận 1', branch_address: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      scheduled_date: '2026-06-15', scheduled_time: '09:30',
      staff_name: 'NV. Nguyễn Thị Trúc Hằng', staff_phone: '0912345678',
      status: 'confirmed', timeline_step: 2,
      created_at: '2026-06-01T08:00:00Z'
    },
    {
      id: 'vs-2', customer_id: 'u-6', room_id: 'r-4',
      room_name: 'Phòng 202 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)', branch_address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM',
      scheduled_date: '2026-06-20', scheduled_time: '14:00',
      staff_name: 'NV. Quốc Bảo', staff_phone: '0987654321',
      status: 'pending', timeline_step: 1,
      created_at: '2026-06-02T10:00:00Z'
    },
    {
      id: 'vs-3', customer_id: 'u-6', room_id: 'r-1',
      room_name: 'Phòng 101 (Nam)',
      room_image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Quận 1', branch_address: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      scheduled_date: '2026-04-20', scheduled_time: '10:00',
      staff_name: 'NV. Minh Anh', staff_phone: '0912300001',
      status: 'completed', timeline_step: 3,
      note: 'Khách hàng đã xem phòng, đánh giá cao sự sạch sẽ và thoáng mát của phòng Dorm. Đã tư vấn quy trình đăng ký thuê.',
      created_at: '2026-04-15T09:00:00Z'
    },
    {
      id: 'vs-4', customer_id: 'u-6', room_id: 'r-6',
      room_name: 'Phòng 203 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)', branch_address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM',
      scheduled_date: '2026-03-01', scheduled_time: '11:00',
      staff_name: 'NV. Lê Thị Hương', staff_phone: '0998765432',
      status: 'cancelled', timeline_step: 1,
      note: 'Khách hàng yêu cầu hủy lịch hẹn do thay đổi kế hoạch chuyển chỗ ở.',
      created_at: '2026-02-25T14:00:00Z'
    },
    {
      id: 'vs-5', customer_id: 'u-6', room_id: 'r-5',
      room_name: 'Phòng 103 (Nam)',
      room_image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Quận 1', branch_address: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      scheduled_date: '2026-06-03', scheduled_time: '10:00',
      staff_name: 'NV. Nguyễn Thị Trúc Hằng', staff_phone: '0912345678',
      status: 'completed', timeline_step: 3,
      note: 'Lịch hẹn xem phòng thành công. Khách rất ưng ý và muốn làm thủ tục đặt cọc.',
      created_at: '2026-05-30T10:00:00Z'
    },
    {
      id: 'vs-6', customer_id: 'u-6', room_id: 'r-3',
      room_name: 'Phòng 201 (Nam)',
      room_image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)', branch_address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM',
      scheduled_date: '2026-06-04', scheduled_time: '15:30',
      staff_name: 'NV. Quốc Bảo', staff_phone: '0987654321',
      status: 'completed', timeline_step: 3,
      note: 'Khách muốn xem thử chất lượng wifi và khu vực giặt giũ công cộng. Xem xong đã gửi yêu cầu cọc.',
      created_at: '2026-06-01T11:00:00Z'
    },
    {
      id: 'vs-7', customer_id: 'u-6', room_id: 'r-6',
      room_name: 'Phòng 203 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)', branch_address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM',
      scheduled_date: '2026-06-08', scheduled_time: '08:30',
      staff_name: 'NV. Lê Thị Hương', staff_phone: '0998765432',
      status: 'confirmed', timeline_step: 2,
      note: 'Lịch hẹn đầu buổi sáng. Đã xác nhận khách đi xe máy và cần chỗ đỗ xe.',
      created_at: '2026-06-01T15:00:00Z'
    },
    {
      id: 'vs-8', customer_id: 'u-6', room_id: 'r-7',
      room_name: 'Phòng 104 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Quận 1', branch_address: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      scheduled_date: '2026-05-28', scheduled_time: '14:30',
      staff_name: 'NV. Nguyễn Thị Trúc Hằng', staff_phone: '0912345678',
      status: 'completed', timeline_step: 3,
      note: 'Khách rất ưng ý với thiết kế và muốn làm thủ tục đặt cọc.',
      created_at: '2026-05-25T09:30:00Z'
    },
    {
      id: 'vs-9', customer_id: 'u-6', room_id: 'r-4',
      room_name: 'Phòng 202 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)', branch_address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM',
      scheduled_date: '2026-05-31', scheduled_time: '16:00',
      staff_name: 'NV. Quốc Bảo', staff_phone: '0987654321',
      status: 'completed', timeline_step: 3,
      note: 'Xem phòng hoàn tất và tiến hành cọc.',
      created_at: '2026-05-30T14:00:00Z'
    },
    {
      id: 'vs-test-unavailable', customer_id: 'u-6', room_id: 'r-3',
      room_name: 'Phòng 201 (Nam)',
      room_image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)', branch_address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM',
      scheduled_date: '2026-05-18', scheduled_time: '15:00',
      staff_name: 'NV. Quốc Bảo', staff_phone: '0987654321',
      status: 'completed', timeline_step: 3,
      note: 'Tình huống test: phòng này hiện đã có người thuê nên khách không thể gửi yêu cầu đặt cọc.',
      created_at: '2026-05-16T09:00:00Z'
    }
  ] as ViewingSchedule[],
  customer_deposit_requests: [
    {
      id: 'cdr-1',
      customer_id: 'u-6',
      customer_name: 'Nguyễn Văn Nam (Khách mới)',
      customer_phone: '0977889900',
      room_id: 'r-1',
      room_name: 'Phòng 101 (Nam)',
      room_image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Quận 1',
      viewing_schedule_id: 'vs-3',
      deposit_amount: 1000000,
      expected_move_in_date: '2026-05-01',
      status: 'confirmed',
      note: 'Khách đã xem phòng và muốn được xác nhận đặt cọc.',
      created_at: '2026-04-20T11:00:00Z'
    },
    {
      id: 'cdr-2',
      customer_id: 'u-mock-cdr2',
      customer_name: 'Đỗ Phương Thảo',
      customer_phone: '0981122334',
      room_id: 'r-2',
      room_name: 'Phòng 102 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Quận 1',
      viewing_schedule_id: 'vs-1',
      deposit_amount: 2000000,
      expected_move_in_date: '2026-06-10',
      status: 'confirmed',
      note: 'Khách hàng muốn giữ phòng Studio ban công rộng.',
      created_at: '2026-06-04T10:00:00Z'
    },
    {
      id: 'cdr-3',
      customer_id: 'u-mock-cdr3',
      customer_name: 'Bùi Minh Tuấn',
      customer_phone: '0938889999',
      room_id: 'r-4',
      room_name: 'Phòng 202 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)',
      viewing_schedule_id: 'vs-9',
      deposit_amount: 1200000,
      expected_move_in_date: '2026-06-15',
      status: 'pending_sale_confirmation',
      note: 'Yêu cầu giữ chỗ giường Dorm tầng dưới.',
      created_at: '2026-06-05T09:00:00Z'
    },
    {
      id: 'cdr-test-invoice',
      customer_id: 'u-6',
      customer_name: 'Nguyễn Văn Nam (Khách mới)',
      customer_phone: '0977889900',
      room_id: 'r-3',
      room_name: 'Phòng 201 (Nam)',
      room_image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)',
      viewing_schedule_id: 'vs-6',
      deposit_amount: 1500000,
      expected_move_in_date: '2026-06-15',
      status: 'invoice_created',
      note: 'Hóa đơn cọc đã được lập và đang chờ khách thanh toán.',
      created_at: '2026-06-05T10:00:00Z'
    },
    {
      id: 'cdr-test-pending-mgr',
      customer_id: 'u-6',
      customer_name: 'Nguyễn Văn Nam (Khách mới)',
      customer_phone: '0977889900',
      room_id: 'r-4',
      room_name: 'Phòng 202 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)',
      viewing_schedule_id: 'vs-9',
      deposit_amount: 1200000,
      expected_move_in_date: '2026-06-20',
      status: 'invoice_created',
      note: 'Khách đã thanh toán cọc và chờ duyệt minh chứng.',
      created_at: '2026-06-04T09:00:00Z'
    },
    {
      id: 'cdr-test-paid',
      customer_id: 'u-6',
      customer_name: 'Nguyễn Văn Nam (Khách mới)',
      customer_phone: '0977889900',
      room_id: 'r-5',
      room_name: 'Phòng 103 (Nam)',
      room_image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Quận 1',
      viewing_schedule_id: 'vs-5',
      deposit_amount: 1000000,
      expected_move_in_date: '2026-06-01',
      status: 'paid',
      note: 'Đã hoàn tất thanh toán cọc và được Quản lý duyệt.',
      created_at: '2026-05-15T09:00:00Z'
    }
  ] as CustomerDepositRequest[],
  rental_registrations: [
    {
      id: 'rr-101',
      customer_id: 'u-6',
      customer_name: 'Lê Minh Tuấn',
      phone: '0901234567',
      customer_phone: '0901234567',
      email: 'leminhtuan@gmail.com',
      customer_email: 'leminhtuan@gmail.com',
      gender: 'male',
      preferred_room_type: 'Dorm',
      rental_type: 'shared',
      occupants_count: 1,
      preferred_branch_id: 'b-1',
      preferred_branch_name: 'Chi nhánh Quận 1',
      budget_range: 'under_2m',
      move_in_date: '2026-06-15',
      preferred_viewing_date: '2026-06-12',
      preferred_viewing_time: '10:00-12:00',
      viewing_time_note: 'Rảnh sáng thứ 6',
      preferred_amenities: ['AC', 'Wifi'],
      note: 'Mong muốn phòng yên tĩnh, sạch sẽ.',
      status: 'pending_schedule',
      created_at: '2026-06-02T08:00:00Z'
    },
    {
      id: 'rr-102',
      customer_id: 'u-mock-rr102',
      customer_name: 'Hoàng Thu Thủy',
      phone: '0987654321',
      customer_phone: '0987654321',
      email: 'thuthuy@gmail.com',
      customer_email: 'thuthuy@gmail.com',
      gender: 'female',
      preferred_room_type: 'Studio',
      rental_type: 'full_room',
      occupants_count: 1,
      preferred_branch_id: 'b-2',
      preferred_branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)',
      budget_range: '2m_5m',
      move_in_date: '2026-06-20',
      preferred_viewing_date: '2026-06-15',
      preferred_viewing_time: '13:30-15:30',
      viewing_time_note: 'Có xe máy riêng cần bãi xe',
      preferred_amenities: ['AC', 'Wifi', 'Kitchen'],
      note: 'Ưu tiên tầng cao thoáng mát.',
      status: 'pending_schedule',
      created_at: '2026-06-02T09:15:00Z'
    },
    {
      id: 'rr-103',
      customer_id: 'u-mock-rr103',
      customer_name: 'Nguyễn Bảo Long',
      phone: '0912345678',
      customer_phone: '0912345678',
      email: 'baolong@gmail.com',
      customer_email: 'baolong@gmail.com',
      gender: 'male',
      preferred_room_type: 'Twin',
      rental_type: 'flexible',
      occupants_count: 1,
      preferred_branch_id: 'b-1',
      preferred_branch_name: 'Chi nhánh Quận 1',
      budget_range: 'flexible',
      move_in_date: '2026-06-18',
      preferred_viewing_date: '2026-06-18',
      preferred_viewing_time: 'flexible',
      viewing_time_note: 'Linh hoạt theo Sale',
      preferred_amenities: ['AC', 'Wifi', 'Washing Machine'],
      note: 'Cần xem phòng thực tế để chốt nhanh.',
      status: 'pending_schedule',
      created_at: '2026-06-02T10:00:00Z'
    }
  ] as RentalRegistration[],
  today_appointments: [
    { id: 'ta-1', time: '09:30', customer_name: 'Nguyễn Văn A', room_type: 'Phòng Đơn Premium', status: 'confirmed', branch: 'Quận 1' },
    { id: 'ta-2', time: '11:00', customer_name: 'Lê Thị Minh Châu', room_type: 'Phòng Dorm Nam 4 người', status: 'confirmed', branch: 'Thủ Đức' },
    { id: 'ta-3', time: '14:00', customer_name: 'Trần Thị B', room_type: 'Phòng Đôi Eco', status: 'pending', branch: 'Quận 1' },
    { id: 'ta-4', time: '15:30', customer_name: 'Phạm Hoàng Tuấn', room_type: 'Studio Cao cấp', status: 'pending', branch: 'Quận 1' },
    { id: 'ta-5', time: '16:00', customer_name: 'Đinh Thị Hoa', room_type: 'Phòng Nữ 2 người', status: 'cancelled', branch: 'Thủ Đức' }
  ] as TodayAppointment[],
  recent_registrations: [
    { id: 'rr-1', customer_name: 'Lê Minh Tuấn', time_ago: '2 phút trước', room_name: 'Studio A', created_at: '2026-06-02T07:00:00Z' },
    { id: 'rr-2', customer_name: 'Hoàng Thu Thủy', time_ago: '45 phút trước', room_name: 'Suite B', created_at: '2026-06-02T06:15:00Z' },
    { id: 'rr-3', customer_name: 'Nguyễn Bảo Long', time_ago: '1 giờ trước', room_name: 'Dorm Nam 101', created_at: '2026-06-02T06:00:00Z' },
    { id: 'rr-4', customer_name: 'Trịnh Hoài An', time_ago: '2 giờ trước', room_name: 'Phòng Đôi 203', created_at: '2026-06-02T05:00:00Z' }
  ] as RecentRegistration[],
  activity_logs: [
    { id: 'al-1', title: 'Hợp đồng #HD2026-08 hoàn tất', detail: '10:45 AM', type: 'contract' },
    { id: 'al-2', title: 'Lịch xem phòng đã xác nhận', detail: '09:15 AM', type: 'schedule' },
    { id: 'al-3', title: 'Email nhắc hẹn đã gửi', detail: '08:00 AM', type: 'system' },
    { id: 'al-4', title: 'Phiếu đăng ký mới từ khách hàng', detail: '07:30 AM', type: 'registration' },
    { id: 'al-5', title: 'Hủy lịch hẹn bởi khách hàng', detail: '06:15 AM', type: 'schedule' }
  ] as ActivityLog[],
  services: [
    { id: 'svc-1', name: 'Điện sinh hoạt', category: 'essential', description: 'Điện theo chỉ số công tơ riêng từng phòng, quyết toán hàng tháng.', unit_price: 3500, billing_cycle: 'per_kwh', status: 'available', icon: 'Zap', is_default: true },
    { id: 'svc-2', name: 'Nước sinh hoạt', category: 'essential', description: 'Nước theo đồng hồ riêng từng phòng, quyết toán hàng tháng.', unit_price: 15000, billing_cycle: 'per_m3', status: 'available', icon: 'Droplets', is_default: true },
    { id: 'svc-3', name: 'Internet cáp quang 100 Mbps', category: 'utility', description: 'Đường truyền cáp quang tốc độ cao, ổn định, không giới hạn dữ liệu.', unit_price: 150000, billing_cycle: 'monthly', status: 'available', icon: 'Wifi', is_default: false },
    { id: 'svc-4', name: 'Internet cáp quang 300 Mbps', category: 'utility', description: 'Gói internet tốc độ siêu cao, lý tưởng cho làm việc và giải trí 4K.', unit_price: 220000, billing_cycle: 'monthly', status: 'available', icon: 'Wifi', is_default: false },
    { id: 'svc-5', name: 'Gửi xe máy', category: 'utility', description: 'Bãi gửi xe máy có mái che, camera an ninh 24/7, thẻ từ cá nhân.', unit_price: 150000, billing_cycle: 'monthly', status: 'available', icon: 'Bike', is_default: false },
    { id: 'svc-6', name: 'Gửi xe đạp', category: 'utility', description: 'Khu vực để xe đạp riêng, có khóa an toàn, miễn phí điện sạc xe đạp điện.', unit_price: 50000, billing_cycle: 'monthly', status: 'available', icon: 'Bike', is_default: false },
    { id: 'svc-7', name: 'Gửi ô tô', category: 'utility', description: 'Bãi đỗ ô tô ngoài trời có bảo vệ, camera 24/7. Đặt chỗ theo tháng.', unit_price: 800000, billing_cycle: 'monthly', status: 'available', icon: 'Car', is_default: false },
    { id: 'svc-8', name: 'Giặt là máy giặt công cộng', category: 'convenience', description: 'Máy giặt và máy sấy công cộng theo lần sử dụng, mã QR thanh toán tiện lợi.', unit_price: 30000, billing_cycle: 'per_use', status: 'available', icon: 'Wind', is_default: false },
    { id: 'svc-9', name: 'Giặt là trọn gói (pick-up)', category: 'convenience', description: 'Thu gom – giặt – giao tận phòng mỗi tuần, không giới hạn số lần trong tháng.', unit_price: 150000, billing_cycle: 'monthly', status: 'available', icon: 'Wind', is_default: false },
    { id: 'svc-10', name: 'Vệ sinh phòng 1 lần/tuần', category: 'convenience', description: 'Nhân viên vệ sinh phòng chuyên nghiệp, sử dụng sản phẩm tẩy rửa thân thiện môi trường.', unit_price: 200000, billing_cycle: 'monthly', status: 'available', icon: 'Sparkles', is_default: false },
    { id: 'svc-11', name: 'Vệ sinh phòng 2 lần/tuần', category: 'convenience', description: 'Gói vệ sinh cao cấp 2 lần/tuần, bao gồm thay ga gối và bổ sung vật dụng tiêu hao.', unit_price: 350000, billing_cycle: 'monthly', status: 'available', icon: 'Sparkles', is_default: false },
    { id: 'svc-12', name: 'Tủ lạnh mini (90L)', category: 'premium', description: 'Tủ lạnh mini Panasonic 90L, đặt trong phòng riêng của bạn. Sử dụng điện riêng.', unit_price: 300000, billing_cycle: 'monthly', status: 'available', icon: 'Refrigerator', is_default: false },
    { id: 'svc-13', name: 'Tủ lạnh side-by-side (300L)', category: 'premium', description: 'Tủ lạnh Samsung 300L cao cấp, có ngăn đá riêng. Phù hợp cho phòng Studio.', unit_price: 500000, billing_cycle: 'monthly', status: 'available', icon: 'Refrigerator', is_default: false },
    { id: 'svc-14', name: 'Máy giặt riêng trong phòng', category: 'premium', description: 'Máy giặt lồng ngang Electrolux 7kg, lắp đặt trong phòng tắm riêng.', unit_price: 450000, billing_cycle: 'monthly', status: 'available', icon: 'Wind', is_default: false },
    { id: 'svc-15', name: 'Điều hoà bổ sung', category: 'premium', description: 'Điều hoà Daikin 1.5HP bổ sung, lý tưởng khi phòng đã có sẵn 1 máy nhưng cần mát hơn.', unit_price: 400000, billing_cycle: 'monthly', status: 'available', icon: 'Wind', is_default: false },
    { id: 'svc-16', name: 'Bình nước nóng riêng', category: 'premium', description: 'Bình nước nóng Ariston 15L, dùng riêng cho phòng tắm cá nhân hoặc phòng đôi.', unit_price: 180000, billing_cycle: 'monthly', status: 'available', icon: 'Flame', is_default: false },
    { id: 'svc-17', name: 'Két an toàn trong phòng', category: 'premium', description: 'Két sắt điện tử nhỏ, khoá mã số 6 chữ số, gắn tường trong tủ quần áo.', unit_price: 100000, billing_cycle: 'monthly', status: 'available', icon: 'Shield', is_default: false },
    { id: 'svc-18', name: 'Dịch vụ giặt khô', category: 'convenience', description: 'Nhận giặt khô quần áo cao cấp, vest, áo dài. Giao nhận tại phòng trong 48 giờ.', unit_price: 80000, billing_cycle: 'per_use', status: 'available', icon: 'Shirt', is_default: false },
    { id: 'svc-19', name: 'Gói bảo hiểm tài sản cá nhân', category: 'premium', description: 'Bảo hiểm tài sản cá nhân trong phòng, bồi thường tối đa 20 triệu đồng/sự cố.', unit_price: 250000, billing_cycle: 'monthly', status: 'coming_soon', icon: 'Shield', is_default: false },
    { id: 'svc-20', name: 'Vệ sinh tổng thể toàn phòng', category: 'convenience', description: 'Tổng vệ sinh phòng chuyên sâu: lau kính, khử trùng, vệ sinh điều hoà, máy lọc nước.', unit_price: 500000, billing_cycle: 'per_use', status: 'available', icon: 'Sparkles', is_default: false }
  ] as Service[],
  service_subscriptions: [
    { id: 'ss-1', customer_id: 'u-5', service_id: 'svc-1', service_name: 'Điện sinh hoạt', registered_date: '2025-10-01', monthly_cost: 350000, status: 'active' },
    { id: 'ss-2', customer_id: 'u-5', service_id: 'svc-2', service_name: 'Nước sinh hoạt', registered_date: '2025-10-01', monthly_cost: 90000, status: 'active' },
    { id: 'ss-3', customer_id: 'u-5', service_id: 'svc-3', service_name: 'Internet cáp quang 100 Mbps', registered_date: '2025-10-01', monthly_cost: 150000, status: 'active' },
    { id: 'ss-4', customer_id: 'u-5', service_id: 'svc-5', service_name: 'Gửi xe máy', registered_date: '2025-10-15', monthly_cost: 150000, status: 'active' },
    { id: 'ss-5', customer_id: 'u-5', service_id: 'svc-9', service_name: 'Giặt là trọn gói (pick-up)', registered_date: '2025-11-01', monthly_cost: 150000, status: 'active' },
    { id: 'ss-6', customer_id: 'u-5', service_id: 'svc-10', service_name: 'Vệ sinh phòng 1 lần/tuần', registered_date: '2025-12-01', monthly_cost: 200000, status: 'active' },
    { id: 'ss-7', customer_id: 'u-5', service_id: 'svc-12', service_name: 'Tủ lạnh mini (90L)', registered_date: '2026-01-01', monthly_cost: 300000, status: 'active' },
    { id: 'ss-8', customer_id: 'u-5', service_id: 'svc-16', service_name: 'Bình nước nóng riêng', registered_date: '2026-02-01', monthly_cost: 180000, status: 'active' },
    { id: 'ss-9', customer_id: 'u-5', service_id: 'svc-6', service_name: 'Gửi xe đạp', registered_date: '2025-10-15', monthly_cost: 50000, status: 'suspended' },
    { id: 'ss-10', customer_id: 'u-5', service_id: 'svc-15', service_name: 'Điều hoà bổ sung', registered_date: '2026-03-01', monthly_cost: 400000, status: 'cancelled' }
  ] as ServiceSubscription[],
  consumption_records: [
    { id: 'cr-1', customer_id: 'u-5', room_id: 'r-1', period: '2025-07', electricity_kwh: 95, electricity_cost: 332500, water_m3: 6.5, water_cost: 97500, recorded_at: '2025-08-01T08:00:00Z' },
    { id: 'cr-2', customer_id: 'u-5', room_id: 'r-1', period: '2025-08', electricity_kwh: 118, electricity_cost: 413000, water_m3: 7.0, water_cost: 105000, recorded_at: '2025-09-01T08:00:00Z' },
    { id: 'cr-3', customer_id: 'u-5', room_id: 'r-1', period: '2025-09', electricity_kwh: 110, electricity_cost: 385000, water_m3: 6.8, water_cost: 102000, recorded_at: '2025-10-01T08:00:00Z' },
    { id: 'cr-4', customer_id: 'u-5', room_id: 'r-1', period: '2025-10', electricity_kwh: 98, electricity_cost: 343000, water_m3: 7.2, water_cost: 108000, recorded_at: '2025-11-01T08:00:00Z' },
    { id: 'cr-5', customer_id: 'u-5', room_id: 'r-1', period: '2025-11', electricity_kwh: 88, electricity_cost: 308000, water_m3: 6.0, water_cost: 90000, recorded_at: '2025-12-01T08:00:00Z' },
    { id: 'cr-6', customer_id: 'u-5', room_id: 'r-1', period: '2025-12', electricity_kwh: 92, electricity_cost: 322000, water_m3: 6.5, water_cost: 97500, recorded_at: '2026-01-01T08:00:00Z' },
    { id: 'cr-7', customer_id: 'u-5', room_id: 'r-1', period: '2026-01', electricity_kwh: 85, electricity_cost: 297500, water_m3: 5.8, water_cost: 87000, recorded_at: '2026-02-01T08:00:00Z' },
    { id: 'cr-8', customer_id: 'u-5', room_id: 'r-1', period: '2026-02', electricity_kwh: 90, electricity_cost: 315000, water_m3: 6.2, water_cost: 93000, recorded_at: '2026-03-01T08:00:00Z' },
    { id: 'cr-9', customer_id: 'u-5', room_id: 'r-1', period: '2026-03', electricity_kwh: 102, electricity_cost: 357000, water_m3: 7.0, water_cost: 105000, recorded_at: '2026-04-01T08:00:00Z' },
    { id: 'cr-10', customer_id: 'u-5', room_id: 'r-1', period: '2026-04', electricity_kwh: 108, electricity_cost: 378000, water_m3: 7.5, water_cost: 112500, recorded_at: '2026-05-01T08:00:00Z' },
    { id: 'cr-11', customer_id: 'u-5', room_id: 'r-1', period: '2026-05', electricity_kwh: 115, electricity_cost: 402500, water_m3: 7.8, water_cost: 117000, recorded_at: '2026-06-01T08:00:00Z' },
    { id: 'cr-12', customer_id: 'u-5', room_id: 'r-1', period: '2026-06', electricity_kwh: 52, electricity_cost: 182000, water_m3: 3.5, water_cost: 52500, recorded_at: '2026-06-02T08:00:00Z' }
  ] as ConsumptionRecord[],
  deposit_invoices: generateDepositInvoices(),
  checkin_invoices: generateCheckinInvoices(),
  monthly_invoices: generateMonthlyInvoices(),
  refund_records: generateRefundRecords(),
  payout_records: generatePayoutRecords(),
  manager_deposits: generateManagerDeposits(),
  residency_checks: generateResidencyChecks(),
  asset_handovers: generateAssetHandovers(),
  managed_assets: generateManagedAssets(),
  contracts: generateContracts()
};

// ─── Manager Phase Mock Data Generators ──────────────────────────────────────
function generateManagerDeposits(): ManagerDeposit[] {
  const names = ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Anh Tuấn', 'Đỗ Mỹ Linh', 'Nguyễn Thị Sâm', 'Bùi Văn Hải', 'Phan Thanh Tùng', 'Ngô Quốc Bảo', 'Vũ Thị Hạnh', 'Đặng Văn Khánh', 'Lý Minh Khoa', 'Đinh Thị Hoa', 'Trịnh Hoài An'];
  const rooms = ['Phòng 101 (Nam)', 'Phòng 102 (Nữ)', 'Phòng 201 (Nam)', 'Phòng 202 (Nữ)', 'Phòng 301 (Nam)', 'Phòng 302 (Nữ)'];
  const statuses: ManagerDeposit['status'][] = ['pending', 'pending', 'approved', 'approved', 'approved', 'rejected', 'need_more', 'expired'];
  const banks = ['Vietcombank', 'BIDV', 'Techcombank', 'MB Bank', 'ACB', 'TPBank'];
  const bedSuffixes = ['A1', 'A2', 'A3', 'B1', 'B2', 'C1'];
  const list: ManagerDeposit[] = [];
  for (let i = 1; i <= 32; i++) {
    const name = names[i % names.length];
    const isBed = i % 3 === 0; // 1/3 deposits are bed-level
    const roomName = rooms[i % rooms.length];
    list.push({
      id: `MGR-DEP-${2000 + i}`,
      customer_id: `u-mock-${200 + i}`,
      customer_name: name,
      customer_phone: `090${(i * 1234567) % 9000000 + 1000000}`,
      room_id: `r-${(i % 6) + 1}`,
      room_name: roomName,
      deposit_type: isBed ? 'bed' : 'room',
      bed_name: isBed ? `Giường ${bedSuffixes[i % bedSuffixes.length]}` : undefined,
      amount: [1000000, 1500000, 2000000][i % 3],
      deposit_date: new Date(2026, 4, 1 + (i % 28)).toISOString().split('T')[0],
      bill_image_url: `https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80`,
      bank_name: banks[i % banks.length],
      account_number: `${100000000 + i * 123456}`,
      status: i <= 8 ? statuses[i - 1] : statuses[i % statuses.length],
      note: i % 3 === 0 ? 'Đặt cọc online qua ứng dụng' : undefined,
      reviewer_note: i % 2 === 0 ? 'Xác minh thông tin chuyển khoản hợp lệ' : undefined,
      created_at: new Date(2026, 4, 1 + (i % 28)).toISOString()
    });
  }

  // Append test cases for u-6
  list.push(
    {
      id: 'MGR-DEP-TEST-01',
      customer_id: 'u-6',
      customer_name: 'Nguyễn Văn Nam (Khách mới)',
      customer_phone: '0977889900',
      room_id: 'r-4',
      room_name: 'Phòng 202 (Nữ)',
      deposit_type: 'room',
      amount: 1200000,
      deposit_date: '2026-06-05',
      bill_image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80',
      bank_name: 'MB Bank',
      account_number: '999988887777',
      status: 'pending',
      created_at: '2026-06-05T11:00:00Z'
    },
    {
      id: 'MGR-DEP-TEST-02',
      customer_id: 'u-6',
      customer_name: 'Nguyễn Văn Nam (Khách mới)',
      customer_phone: '0977889900',
      room_id: 'r-5',
      room_name: 'Phòng 103 (Nam)',
      deposit_type: 'room',
      amount: 1000000,
      deposit_date: '2026-05-16',
      bill_image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80',
      bank_name: 'Vietcombank',
      account_number: '1012345678',
      status: 'approved',
      created_at: '2026-05-16T10:00:00Z'
    }
  );

  return list;
}

function generateResidencyChecks(): ResidencyCheck[] {
  const names = ['Nguyễn Văn Bình', 'Trần Minh Châu', 'Lê Thị Duyên', 'Phạm Quốc Hùng', 'Hoàng Thị Lan', 'Đỗ Văn Mạnh', 'Nguyễn Thu Ngân', 'Bùi Đình Phúc', 'Lý Ngọc Quỳnh', 'Phan Văn Sơn', 'Vũ Thị Tâm', 'Đặng Minh Uyên', 'Trịnh Văn Vinh', 'Đinh Thị Xuân', 'Cao Thị Yến'];
  const rooms = ['Phòng 101', 'Phòng 102', 'Phòng 201', 'Phòng 202', 'Phòng 301', 'Phòng 302'];
  const statuses: ResidencyCheck['status'][] = ['pending', 'pending', 'approved', 'approved', 'rejected'];
  const list: ResidencyCheck[] = [];
  for (let i = 1; i <= 26; i++) {
    const name = names[i % names.length];
    const status = statuses[i % statuses.length];
    const isApproved = status === 'approved';

    const checklist = isApproved
      ? {
        valid_documents: true,
        info_matches: true,
        age_verified: true,
        no_violation: true
      }
      : {
        valid_documents: i % 7 !== 0,
        info_matches: i % 5 !== 0,
        age_verified: true,
        no_violation: i % 8 !== 0
      };

    const violation_note = (!isApproved && !checklist.no_violation)
      ? 'Khách hàng có tiền sử vi phạm quy định nội quy phòng trọ tại địa chỉ cũ'
      : undefined;

    list.push({
      id: `RC-${3000 + i}`,
      customer_id: `u-mock-${300 + i}`,
      customer_name: name,
      customer_phone: `098${(i * 7654321) % 9000000 + 1000000}`,
      room_id: `r-${(i % 6) + 1}`,
      room_name: rooms[i % rooms.length],
      id_type: i % 5 === 0 ? 'passport' : 'cccd',
      id_number: i % 5 === 0 ? `P${100000 + i}VN` : `0${7 + (i % 3)}${String(10000000 + i * 12345).padStart(8, '0')}`,
      dob: `${1998 + (i % 6)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      nationality: i % 5 === 0 ? 'foreign' : 'vietnamese',
      front_image_url: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&w=400&q=80',
      back_image_url: i % 5 !== 0 ? 'https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&w=400&q=80' : undefined,
      checklist,
      violation_note,
      status,
      created_at: new Date(2026, 4, 1 + (i % 28)).toISOString()
    });
  }
  return list;
}

function generateAssetHandovers(): AssetHandover[] {
  const names = ['Nguyễn Văn Bình', 'Trần Minh Châu', 'Lê Thị Duyên', 'Phạm Quốc Hùng', 'Hoàng Thị Lan', 'Đỗ Văn Mạnh', 'Nguyễn Thu Ngân', 'Bùi Đình Phúc', 'Lý Ngọc Quỳnh', 'Phan Văn Sơn', 'Vũ Thị Tâm'];
  const rooms = ['Phòng 101 (Nam)', 'Phòng 102 (Nữ)', 'Phòng 201 (Nam)', 'Phòng 202 (Nữ)', 'Phòng 301 (Nam)'];
  const defaultChecklist = [
    { item: 'Giường đơn + nệm', serial_number: 'TS-001', condition: 'Tốt', checked: true },
    { item: 'Tủ quần áo', serial_number: 'TS-002', condition: 'Tốt', checked: true },
    { item: 'Bàn học + ghế', serial_number: 'TS-003', condition: 'Tốt', checked: true },
    { item: 'Máy lạnh (1.5HP)', serial_number: 'TS-004', condition: 'Tốt, vừa bảo dưỡng', checked: true },
    { item: 'Quạt trần', serial_number: 'TS-005', condition: 'Hoạt động bình thường', checked: true },
    { item: 'Đèn LED phòng', serial_number: 'TS-006', condition: 'Tốt', checked: true },
    { item: 'Thiết bị nhà vệ sinh', serial_number: 'TS-007', condition: 'Đầy đủ, sạch sẽ', checked: true },
    { item: 'Khóa cửa điện tử', serial_number: 'TS-008', condition: 'Hoạt động tốt', checked: true },
    { item: 'Kệ sách / Kệ đa năng', serial_number: 'TS-009', condition: 'Tốt', checked: true },
    { item: 'Ổ cắm điện + USB', serial_number: 'TS-010', condition: '4 ổ, hoạt động tốt', checked: true }
  ];
  const statuses: AssetHandover['status'][] = ['signed', 'signed', 'signed', 'partial', 'partial'];
  const list: AssetHandover[] = [];
  for (let i = 1; i <= 22; i++) {
    const isSigned = statuses[i % statuses.length] === 'signed';
    list.push({
      id: `AHO-${4000 + i}`,
      contract_id: `CT-${1000 + i}`,
      customer_id: `u-mock-${400 + i}`,
      customer_name: names[i % names.length],
      room_id: `r-${(i % 5) + 1}`,
      room_name: rooms[i % rooms.length],
      handover_date: new Date(2026, 4, 1 + (i % 28)).toISOString().split('T')[0],
      checklist: defaultChecklist.map(item => ({ ...item })),
      customer_signed: isSigned,
      manager_signed: true,
      signature_ip: '192.168.1.1',
      signature_timestamp: new Date(2026, 4, 1 + (i % 28), 10, 30).toISOString(),
      status: statuses[i % statuses.length],
      created_at: new Date(2026, 4, 1 + (i % 28)).toISOString(),
      note: 'Bàn giao đầy đủ trang thiết bị phòng, khách hàng đã kiểm tra và đồng ý nhận phòng.'
    });
  }
  return list;
}

function generateManagedAssets(): ManagedAsset[] {
  const assetNames = [
    { name: 'Máy lạnh Daikin 1.5HP', cat: 'electronics' as ManagedAsset['category'] },
    { name: 'Giường đơn gỗ sồi', cat: 'furniture' as ManagedAsset['category'] },
    { name: 'Nệm Dunlopillo', cat: 'furniture' as ManagedAsset['category'] },
    { name: 'Tủ quần áo 3 cánh', cat: 'furniture' as ManagedAsset['category'] },
    { name: 'Bàn học + ghế', cat: 'furniture' as ManagedAsset['category'] },
    { name: 'Tủ lạnh Panasonic 90L', cat: 'appliance' as ManagedAsset['category'] },
    { name: 'Bình nước nóng Ariston', cat: 'appliance' as ManagedAsset['category'] },
    { name: 'Quạt trần 3 cánh', cat: 'electronics' as ManagedAsset['category'] },
    { name: 'Đèn LED âm trần', cat: 'fixture' as ManagedAsset['category'] },
    { name: 'Khóa cửa điện tử', cat: 'fixture' as ManagedAsset['category'] },
    { name: 'Két an toàn mini', cat: 'fixture' as ManagedAsset['category'] }
  ];
  const locations = ['Phòng 101', 'Phòng 102', 'Phòng 201', 'Phòng 202', 'Phòng 301', 'Kho tầng 1', 'Kho tầng 2'];
  const statusOptions: ManagedAsset['status'][] = ['in_use', 'in_use', 'in_use', 'in_stock', 'maintenance', 'retired'];
  const locationTypes: ManagedAsset['location_type'][] = ['room', 'room', 'room', 'warehouse', 'maintenance'];
  const list: ManagedAsset[] = [];
  for (let i = 1; i <= 55; i++) {
    const asset = assetNames[i % assetNames.length];
    const locType = locationTypes[i % locationTypes.length];
    list.push({
      id: `AST-${6000 + i}`,
      name: asset.name,
      category: asset.cat,
      serial_number: `SN-${2020000 + i * 7}`,
      current_location: locType === 'room' ? locations[i % 6] : (locType === 'warehouse' ? 'Kho tầng 1' : 'Xưởng bảo trì'),
      location_type: locType,
      status: statusOptions[i % statusOptions.length],
      purchase_date: new Date(2022 + (i % 3), (i % 12), (i % 28) + 1).toISOString().split('T')[0],
      purchase_price: [2500000, 1800000, 3500000, 4200000, 6500000, 1200000, 800000][i % 7],
      depreciation_rate: Math.min(10 + (i % 5) * 15, 90),
      transfer_history: i % 3 === 0 ? [
        { from: 'Kho tầng 1', to: locations[i % 6], date: new Date(2023, 5, (i % 28) + 1).toISOString().split('T')[0], reason: 'Bàn giao phòng mới', by: 'QL. Minh Đức' }
      ] : []
    });
  }
  return list;
}

function generateContracts(): ManagerContract[] {
  const names = [
    'Nguyễn Hoàng Nam', 'Trần Thị Mai Anh', 'Lê Văn Phúc', 'Phạm Thị Hương',
    'Hoàng Minh Tuấn', 'Đinh Thị Lan', 'Vũ Quang Huy', 'Bùi Thị Thanh Hoa',
    'Ngô Văn Tâm', 'Lý Thu Ngân', 'Đặng Quốc Hưng', 'Trương Minh Khoa'
  ];
  const rooms = [
    { id: 'r-1', name: 'Phòng 101 (Nam)', price: 1500000 },
    { id: 'r-2', name: 'Phòng 102 (Nữ)', price: 2000000 },
    { id: 'r-3', name: 'Phòng 201 (Nam)', price: 900000 },
    { id: 'r-4', name: 'Phòng 202 (Nữ)', price: 1200000 },
    { id: 'r-5', name: 'Phòng 103 (Nam)', price: 1600000 },
    { id: 'r-6', name: 'Phòng 203 (Nữ)', price: 2500005 }
  ];
  const statuses: ManagerContract['status'][] = ['active', 'active', 'expired', 'terminated', 'active', 'expired', 'active', 'terminated', 'active', 'active', 'expired', 'active'];
  const bedNames = ['Giường A1', 'Giường A2', 'Giường G1', 'Giường G2', 'Giường B1', 'Giường B2'];

  const roomDetailsMap: Record<string, { floor: number; type: string }> = {
    'r-1': { floor: 1, type: 'Dorm' },
    'r-2': { floor: 1, type: 'Studio' },
    'r-3': { floor: 2, type: 'Dorm' },
    'r-4': { floor: 2, type: 'Twin' },
    'r-5': { floor: 1, type: 'Dorm' },
    'r-6': { floor: 2, type: 'Studio' }
  };

  const list: ManagerContract[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const room = rooms[i % rooms.length];
    const isBed = i % 2 === 0;
    const status = statuses[i];

    // Dates
    const startYear = status === 'expired' || status === 'terminated' ? 2024 : 2025;
    const endYear = startYear + 1;
    const startDate = `${startYear}-${String((i % 12) + 1).padStart(2, '0')}-05`;
    const endDate = `${endYear}-${String((i % 12) + 1).padStart(2, '0')}-05`;

    let tenantsList: TenantMember[] | undefined = undefined;
    const selfPhone = `090${(i * 1357924) % 9000000 + 1000000}`;
    const selfCccd = `079203${String(100000 + i * 1234).padStart(6, '0')}`;

    if (name === 'Ngô Văn Tâm') {
      tenantsList = [
        {
          name: 'Ngô Văn Tâm',
          cccd: selfCccd,
          phone: selfPhone,
          role: 'representative'
        },
        {
          name: 'Lê Hoàng Long',
          cccd: '079203112233',
          phone: '0912445566',
          role: 'member'
        },
        {
          name: 'Trần Minh Quân',
          cccd: '079203445566',
          phone: '0987334455',
          role: 'member'
        }
      ];
    } else if (name === 'Nguyễn Hoàng Nam') {
      tenantsList = [
        {
          name: 'Nguyễn Hoàng Nam',
          cccd: selfCccd,
          phone: selfPhone,
          role: 'representative'
        },
        {
          name: 'Phan Văn Đức',
          cccd: '079203778899',
          phone: '0909112233',
          role: 'member'
        }
      ];
    }

    // Generate deterministic UUID-like IDs for each contract
    const uuidBase = ['a3f9c1d2', 'b7e4a812', 'c2d6f034', 'd8b1e795', 'e5a3c920', 'f1d7b468', 'a9c5e237', 'b3f8d104', 'c7e2a956', 'd4b9f312', 'e8a1c674', 'f5d3b089'];
    const uid = uuidBase[i % uuidBase.length] + String(i).padStart(8, '0').slice(0, 8);
    const depUid = uuidBase[(i + 3) % uuidBase.length] + String(i + 100).padStart(8, '0').slice(0, 8);
    list.push({
      id: uid,
      contract_code: uid,
      customer_id: `u-mock-cust-${200 + i}`,
      customer_name: name,
      customer_phone: selfPhone,
      customer_cccd: selfCccd,
      customer_address: `Số ${i * 12 + 1} Đường Lê Lợi, Quận ${i % 3 + 1}, TP.HCM`,
      room_id: room.id,
      room_name: room.name,
      deposit_type: isBed ? 'bed' : 'room',
      bed_name: isBed ? bedNames[i % bedNames.length] : undefined,
      branch_name: i % 2 === 0 ? 'Chi nhánh Quận 1' : 'Chi nhánh Thủ Đức (Khu ĐHQG)',
      rent_amount: room.price,
      deposit_amount: room.price * 2,
      service_fee: 150000 + (i % 3) * 50000,
      start_date: startDate,
      end_date: endDate,
      duration: '12 tháng',
      status: status,
      terms: `Bên A đồng ý cho bên B thuê 01 vị trí ${isBed ? `giường (${bedNames[i % bedNames.length]})` : 'phòng'} tại ${room.name}. Tài sản bàn giao bao gồm các trang thiết bị cơ bản phục vụ sinh hoạt cá nhân.`,
      payment_policy: `Tiền thuê đóng định kỳ vào từ ngày 01 đến ngày 05 hàng tháng. Chậm thanh toán quá 3 ngày sẽ chịu phạt theo quy định.`,
      termination_policy: `Bên B cần báo trước 30 ngày nếu có ý định trả phòng trước hạn. Hoàn trả phòng sạch sẽ, bàn giao đầy đủ trang thiết bị như ban đầu để nhận lại tiền đặt cọc.`,
      manager_name: 'Trần Kim Yến',
      manager_phone: '0907654321',
      created_at: new Date(startYear, i % 12, 5).toISOString(),
      // Thuộc tính bổ sung theo ERD
      deposit_code: depUid,
      sale_staff_name: ['Nguyễn Thị Trúc Hằng', 'Phan Thanh Tùng', 'Vũ Thị Hạnh'][i % 3],
      payment_cycle: ['1_month', '3_months', '6_months'][i % 3] as '1_month' | '3_months' | '6_months',
      contract_type: i % 2 === 0 ? 'long_term' : 'short_term',
      room_type: roomDetailsMap[room.id]?.type || 'Dorm',
      floor_number: roomDetailsMap[room.id]?.floor || 1,
      tenants: tenantsList
    });
  }
  return list;
}

const hasEncodingIssue = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return /Ã|Ä|Æ|Â|áº|á»|�/.test(value);
  }
  if (Array.isArray(value)) {
    return value.some(hasEncodingIssue);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some(hasEncodingIssue);
  }
  return false;
};

let isInitializedThisSession = false;

// Initialize Mock Database in LocalStorage
export const initializeMockDB = (force = false) => {
  if (isInitializedThisSession && !force && localStorage.getItem(STORAGE_KEY)) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
  isInitializedThisSession = true;
};

// Fetch current database state
export const getMockDB = () => {
  initializeMockDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
};

// Save updated database state
export const saveMockDB = (data: any) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Mock Supabase Client API
export const mockSupabase = {
  auth: {
    getUser: () => {
      const userStr = localStorage.getItem('homestay_session_user');
      if (userStr) {
        const parsedUser = JSON.parse(userStr) as Profile;
        const db = getMockDB();
        const freshUser = db.profiles?.find((p: Profile) => p.email === parsedUser.email);
        if (freshUser) {
          localStorage.setItem('homestay_session_user', JSON.stringify(freshUser));
          return freshUser;
        }
        return parsedUser;
      }
      return null;
    },
    login: (email: string): { user: Profile | null; error: string | null } => {
      const db = getMockDB();
      const user = db.profiles.find((p: Profile) => p.email.toLowerCase() === email.toLowerCase());
      if (user) {
        localStorage.setItem('homestay_session_user', JSON.stringify(user));
        return { user, error: null };
      }
      return { user: null, error: 'Email không tồn tại trong hệ thống demo!' };
    },
    register: (email: string, fullName: string, phone: string): { user: Profile | null; error: string | null } => {
      const db = getMockDB();
      const emailLower = email.toLowerCase();
      const userExists = db.profiles.some((p: Profile) => p.email.toLowerCase() === emailLower);
      if (userExists) {
        return { user: null, error: 'Email đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' };
      }
      const newProfile: Profile = {
        id: `u-mock-${Date.now()}`,
        email: emailLower,
        role: 'customer',
        full_name: fullName,
        phone: phone
      };
      db.profiles.push(newProfile);
      saveMockDB(db);
      localStorage.setItem('homestay_session_user', JSON.stringify(newProfile));
      return { user: newProfile, error: null };
    },
    logout: () => {
      localStorage.removeItem('homestay_session_user');
    }
  },

  from: (table: keyof typeof INITIAL_DB) => {
    return {
      select: () => {
        const db = getMockDB();
        const data = db[table] || [];
        return {
          data,
          error: null,
          eq: (field: string, value: any) => {
            const filtered = data.filter((item: any) => item[field] === value);
            return { data: filtered, error: null };
          }
        };
      },
      insert: (newRecord: any) => {
        const db = getMockDB();
        const id = `${table.slice(0, 3)}-${Date.now()}`;
        const recordWithId = { id, ...newRecord };
        db[table].push(recordWithId);
        saveMockDB(db);
        return { data: recordWithId, error: null };
      },
      update: (id: string, updatedFields: any) => {
        const db = getMockDB();
        const index = db[table].findIndex((item: any) => item.id === id);
        if (index !== -1) {
          db[table][index] = { ...db[table][index], ...updatedFields };
          saveMockDB(db);
          return { data: db[table][index], error: null };
        }
        return { data: null, error: 'Không tìm thấy bản ghi để cập nhật' };
      },
      delete: (id: string) => {
        const db = getMockDB();
        const initialLen = db[table].length;
        db[table] = db[table].filter((item: any) => item.id !== id);
        saveMockDB(db);
        return { success: db[table].length < initialLen, error: null };
      }
    };
  }
};
