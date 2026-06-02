import roomDorm from '../assets/room-dorm.jpg';
import roomSingle from '../assets/room-single.jpg';
import roomStudio from '../assets/room-studio.jpg';
import roomTwin from '../assets/room-twin.jpg';

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

const INITIAL_DB = {
  profiles: [
    { id: 'u-1', email: 'admin@homestay.com', role: 'admin', full_name: 'Hoàng Quốc Việt (Admin)', phone: '0901234567' },
    { id: 'u-2', email: 'manager@homestay.com', role: 'manager', full_name: 'Trần Kim Yến (Quản lý)', phone: '0907654321' },
    { id: 'u-3', email: 'sale@homestay.com', role: 'sale', full_name: 'Nguyễn Thị Trúc Hằng (NV Sale)', phone: '0912345678' },
    { id: 'u-4', email: 'accountant@homestay.com', role: 'accountant', full_name: 'Lê Hoàng Nhật Anh (Kế toán)', phone: '0987654321' },
    { id: 'u-5', email: 'customer@gmail.com', role: 'customer', full_name: 'Lê Lâm Trí Đức (Khách hàng)', phone: '0933344556', renting_room_name: 'Phòng 101 (Nam)' },
    { id: 'u-6', email: 'newcustomer@gmail.com', role: 'customer', full_name: 'Nguyễn Văn Nam (Khách mới)', phone: '0977889900' }
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
    { id: 'r-6', branch_id: 'b-2', name: 'Phòng 203 (Nữ)', capacity: 2, current_occupants: 1, floor: 2, room_type: 'Studio', gender_type: 'female', has_ac: true, has_private_wc: true, price: 2500000, amenities: ['AC', 'Wifi', 'Private WC', 'Kitchen', 'TV'], image_url: roomSingle, status: 'partial' }
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
      status: 'confirmed', timeline_step: 2,
      note: 'Lịch hẹn ngày mai. Nhắc khách mang theo CCCD khi đến xem phòng.',
      created_at: '2026-05-30T10:00:00Z'
    },
    {
      id: 'vs-6', customer_id: 'u-6', room_id: 'r-3',
      room_name: 'Phòng 201 (Nam)',
      room_image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)', branch_address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM',
      scheduled_date: '2026-06-04', scheduled_time: '15:30',
      staff_name: 'NV. Quốc Bảo', staff_phone: '0987654321',
      status: 'pending', timeline_step: 1,
      note: 'Khách muốn xem thử chất lượng wifi và khu vực giặt giũ công cộng.',
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
      id: 'vs-8', customer_id: 'u-6', room_id: 'r-2',
      room_name: 'Phòng 102 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Quận 1', branch_address: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
      scheduled_date: '2026-05-28', scheduled_time: '14:30',
      staff_name: 'NV. Nguyễn Thị Trúc Hằng', staff_phone: '0912345678',
      status: 'completed', timeline_step: 3,
      note: 'Khách rất ưng ý với thiết kế tủ đồ âm tường và bàn trang điểm có sẵn. Đang thảo luận thêm với gia đình về giá.',
      created_at: '2026-05-25T09:30:00Z'
    },
    {
      id: 'vs-9', customer_id: 'u-6', room_id: 'r-4',
      room_name: 'Phòng 202 (Nữ)',
      room_image_url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80',
      branch_name: 'Chi nhánh Thủ Đức (Khu ĐHQG)', branch_address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM',
      scheduled_date: '2026-05-31', scheduled_time: '16:00',
      staff_name: 'NV. Quốc Bảo', staff_phone: '0987654321',
      status: 'cancelled', timeline_step: 1,
      note: 'Không liên lạc được với khách hàng sau 3 cuộc gọi xác nhận trước giờ hẹn.',
      created_at: '2026-05-30T14:00:00Z'
    }
  ] as ViewingSchedule[],
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
    { id: 'al-1', title: 'Hợp đồng #HD2026-08 hoàn tất', detail: 'Khách: Phạm Gia Bảo • 10:45 AM', type: 'contract' },
    { id: 'al-2', title: 'Lịch xem phòng đã xác nhận', detail: 'Khách: Nguyễn Văn A • 09:15 AM', type: 'schedule' },
    { id: 'al-3', title: 'Email nhắc hẹn đã gửi', detail: 'Hệ thống tự động • 08:00 AM', type: 'system' },
    { id: 'al-4', title: 'Phiếu đăng ký mới từ khách hàng', detail: 'Khách: Lê Minh Tuấn • 07:30 AM', type: 'registration' },
    { id: 'al-5', title: 'Hủy lịch hẹn bởi khách hàng', detail: 'Khách: Đinh Thị Hoa • 06:15 AM', type: 'schedule' }
  ] as ActivityLog[],
  services: [
    { id: 'svc-1',  name: 'Điện sinh hoạt',                  category: 'essential',   description: 'Điện theo chỉ số công tơ riêng từng phòng, quyết toán hàng tháng.',                                     unit_price: 3500,   billing_cycle: 'per_kwh',  status: 'available',    icon: 'Zap',         is_default: true  },
    { id: 'svc-2',  name: 'Nước sinh hoạt',                  category: 'essential',   description: 'Nước theo đồng hồ riêng từng phòng, quyết toán hàng tháng.',                                          unit_price: 15000,  billing_cycle: 'per_m3',   status: 'available',    icon: 'Droplets',    is_default: true  },
    { id: 'svc-3',  name: 'Internet cáp quang 100 Mbps',     category: 'utility',     description: 'Đường truyền cáp quang tốc độ cao, ổn định, không giới hạn dữ liệu.',                               unit_price: 150000, billing_cycle: 'monthly',  status: 'available',    icon: 'Wifi',        is_default: false },
    { id: 'svc-4',  name: 'Internet cáp quang 300 Mbps',     category: 'utility',     description: 'Gói internet tốc độ siêu cao, lý tưởng cho làm việc và giải trí 4K.',                               unit_price: 220000, billing_cycle: 'monthly',  status: 'available',    icon: 'Wifi',        is_default: false },
    { id: 'svc-5',  name: 'Gửi xe máy',                      category: 'utility',     description: 'Bãi gửi xe máy có mái che, camera an ninh 24/7, thẻ từ cá nhân.',                                  unit_price: 150000, billing_cycle: 'monthly',  status: 'available',    icon: 'Bike',        is_default: false },
    { id: 'svc-6',  name: 'Gửi xe đạp',                      category: 'utility',     description: 'Khu vực để xe đạp riêng, có khóa an toàn, miễn phí điện sạc xe đạp điện.',                       unit_price: 50000,  billing_cycle: 'monthly',  status: 'available',    icon: 'Bike',        is_default: false },
    { id: 'svc-7',  name: 'Gửi ô tô',                        category: 'utility',     description: 'Bãi đỗ ô tô ngoài trời có bảo vệ, camera 24/7. Đặt chỗ theo tháng.',                              unit_price: 800000, billing_cycle: 'monthly',  status: 'available',    icon: 'Car',         is_default: false },
    { id: 'svc-8',  name: 'Giặt là máy giặt công cộng',      category: 'convenience', description: 'Máy giặt và máy sấy công cộng theo lần sử dụng, mã QR thanh toán tiện lợi.',                       unit_price: 30000,  billing_cycle: 'per_use',  status: 'available',    icon: 'Wind',        is_default: false },
    { id: 'svc-9',  name: 'Giặt là trọn gói (pick-up)',      category: 'convenience', description: 'Thu gom – giặt – giao tận phòng mỗi tuần, không giới hạn số lần trong tháng.',                     unit_price: 150000, billing_cycle: 'monthly',  status: 'available',    icon: 'Wind',        is_default: false },
    { id: 'svc-10', name: 'Vệ sinh phòng 1 lần/tuần',        category: 'convenience', description: 'Nhân viên vệ sinh phòng chuyên nghiệp, sử dụng sản phẩm tẩy rửa thân thiện môi trường.',            unit_price: 200000, billing_cycle: 'monthly',  status: 'available',    icon: 'Sparkles',    is_default: false },
    { id: 'svc-11', name: 'Vệ sinh phòng 2 lần/tuần',        category: 'convenience', description: 'Gói vệ sinh cao cấp 2 lần/tuần, bao gồm thay ga gối và bổ sung vật dụng tiêu hao.',               unit_price: 350000, billing_cycle: 'monthly',  status: 'available',    icon: 'Sparkles',    is_default: false },
    { id: 'svc-12', name: 'Tủ lạnh mini (90L)',               category: 'premium',     description: 'Tủ lạnh mini Panasonic 90L, đặt trong phòng riêng của bạn. Sử dụng điện riêng.',               unit_price: 300000, billing_cycle: 'monthly',  status: 'available',    icon: 'Refrigerator', is_default: false },
    { id: 'svc-13', name: 'Tủ lạnh side-by-side (300L)',      category: 'premium',     description: 'Tủ lạnh Samsung 300L cao cấp, có ngăn đá riêng. Phù hợp cho phòng Studio.',                     unit_price: 500000, billing_cycle: 'monthly',  status: 'available',    icon: 'Refrigerator', is_default: false },
    { id: 'svc-14', name: 'Máy giặt riêng trong phòng',       category: 'premium',     description: 'Máy giặt lồng ngang Electrolux 7kg, lắp đặt trong phòng tắm riêng.',                            unit_price: 450000, billing_cycle: 'monthly',  status: 'available',    icon: 'Wind',        is_default: false },
    { id: 'svc-15', name: 'Điều hoà bổ sung',                 category: 'premium',     description: 'Điều hoà Daikin 1.5HP bổ sung, lý tưởng khi phòng đã có sẵn 1 máy nhưng cần mát hơn.',       unit_price: 400000, billing_cycle: 'monthly',  status: 'available',    icon: 'Wind',        is_default: false },
    { id: 'svc-16', name: 'Bình nước nóng riêng',             category: 'premium',     description: 'Bình nước nóng Ariston 15L, dùng riêng cho phòng tắm cá nhân hoặc phòng đôi.',               unit_price: 180000, billing_cycle: 'monthly',  status: 'available',    icon: 'Flame',       is_default: false },
    { id: 'svc-17', name: 'Két an toàn trong phòng',          category: 'premium',     description: 'Két sắt điện tử nhỏ, khoá mã số 6 chữ số, gắn tường trong tủ quần áo.',                      unit_price: 100000, billing_cycle: 'monthly',  status: 'available',    icon: 'Shield',      is_default: false },
    { id: 'svc-18', name: 'Dịch vụ giặt khô',                 category: 'convenience', description: 'Nhận giặt khô quần áo cao cấp, vest, áo dài. Giao nhận tại phòng trong 48 giờ.',               unit_price: 80000,  billing_cycle: 'per_use',  status: 'available',    icon: 'Shirt',       is_default: false },
    { id: 'svc-19', name: 'Gói bảo hiểm tài sản cá nhân',    category: 'premium',     description: 'Bảo hiểm tài sản cá nhân trong phòng, bồi thường tối đa 20 triệu đồng/sự cố.',               unit_price: 250000, billing_cycle: 'monthly',  status: 'coming_soon', icon: 'Shield',      is_default: false },
    { id: 'svc-20', name: 'Vệ sinh tổng thể toàn phòng',      category: 'convenience', description: 'Tổng vệ sinh phòng chuyên sâu: lau kính, khử trùng, vệ sinh điều hoà, máy lọc nước.',          unit_price: 500000, billing_cycle: 'per_use',  status: 'available',    icon: 'Sparkles',    is_default: false }
  ] as Service[],
  service_subscriptions: [
    { id: 'ss-1',  customer_id: 'u-5', service_id: 'svc-1',  service_name: 'Điện sinh hoạt',                registered_date: '2025-10-01', monthly_cost: 350000, status: 'active'    },
    { id: 'ss-2',  customer_id: 'u-5', service_id: 'svc-2',  service_name: 'Nước sinh hoạt',                registered_date: '2025-10-01', monthly_cost: 90000,  status: 'active'    },
    { id: 'ss-3',  customer_id: 'u-5', service_id: 'svc-3',  service_name: 'Internet cáp quang 100 Mbps',   registered_date: '2025-10-01', monthly_cost: 150000, status: 'active'    },
    { id: 'ss-4',  customer_id: 'u-5', service_id: 'svc-5',  service_name: 'Gửi xe máy',                    registered_date: '2025-10-15', monthly_cost: 150000, status: 'active'    },
    { id: 'ss-5',  customer_id: 'u-5', service_id: 'svc-9',  service_name: 'Giặt là trọn gói (pick-up)',    registered_date: '2025-11-01', monthly_cost: 150000, status: 'active'    },
    { id: 'ss-6',  customer_id: 'u-5', service_id: 'svc-10', service_name: 'Vệ sinh phòng 1 lần/tuần',      registered_date: '2025-12-01', monthly_cost: 200000, status: 'active'    },
    { id: 'ss-7',  customer_id: 'u-5', service_id: 'svc-12', service_name: 'Tủ lạnh mini (90L)',             registered_date: '2026-01-01', monthly_cost: 300000, status: 'active'    },
    { id: 'ss-8',  customer_id: 'u-5', service_id: 'svc-16', service_name: 'Bình nước nóng riêng',           registered_date: '2026-02-01', monthly_cost: 180000, status: 'active'    },
    { id: 'ss-9',  customer_id: 'u-5', service_id: 'svc-6',  service_name: 'Gửi xe đạp',                    registered_date: '2025-10-15', monthly_cost: 50000,  status: 'suspended' },
    { id: 'ss-10', customer_id: 'u-5', service_id: 'svc-15', service_name: 'Điều hoà bổ sung',               registered_date: '2026-03-01', monthly_cost: 400000, status: 'cancelled' }
  ] as ServiceSubscription[],
  consumption_records: [
    { id: 'cr-1',  customer_id: 'u-5', room_id: 'r-1', period: '2025-07', electricity_kwh: 95,  electricity_cost: 332500,  water_m3: 6.5, water_cost: 97500,  recorded_at: '2025-08-01T08:00:00Z' },
    { id: 'cr-2',  customer_id: 'u-5', room_id: 'r-1', period: '2025-08', electricity_kwh: 118, electricity_cost: 413000,  water_m3: 7.0, water_cost: 105000, recorded_at: '2025-09-01T08:00:00Z' },
    { id: 'cr-3',  customer_id: 'u-5', room_id: 'r-1', period: '2025-09', electricity_kwh: 110, electricity_cost: 385000,  water_m3: 6.8, water_cost: 102000, recorded_at: '2025-10-01T08:00:00Z' },
    { id: 'cr-4',  customer_id: 'u-5', room_id: 'r-1', period: '2025-10', electricity_kwh: 98,  electricity_cost: 343000,  water_m3: 7.2, water_cost: 108000, recorded_at: '2025-11-01T08:00:00Z' },
    { id: 'cr-5',  customer_id: 'u-5', room_id: 'r-1', period: '2025-11', electricity_kwh: 88,  electricity_cost: 308000,  water_m3: 6.0, water_cost: 90000,  recorded_at: '2025-12-01T08:00:00Z' },
    { id: 'cr-6',  customer_id: 'u-5', room_id: 'r-1', period: '2025-12', electricity_kwh: 92,  electricity_cost: 322000,  water_m3: 6.5, water_cost: 97500,  recorded_at: '2026-01-01T08:00:00Z' },
    { id: 'cr-7',  customer_id: 'u-5', room_id: 'r-1', period: '2026-01', electricity_kwh: 85,  electricity_cost: 297500,  water_m3: 5.8, water_cost: 87000,  recorded_at: '2026-02-01T08:00:00Z' },
    { id: 'cr-8',  customer_id: 'u-5', room_id: 'r-1', period: '2026-02', electricity_kwh: 90,  electricity_cost: 315000,  water_m3: 6.2, water_cost: 93000,  recorded_at: '2026-03-01T08:00:00Z' },
    { id: 'cr-9',  customer_id: 'u-5', room_id: 'r-1', period: '2026-03', electricity_kwh: 102, electricity_cost: 357000,  water_m3: 7.0, water_cost: 105000, recorded_at: '2026-04-01T08:00:00Z' },
    { id: 'cr-10', customer_id: 'u-5', room_id: 'r-1', period: '2026-04', electricity_kwh: 108, electricity_cost: 378000,  water_m3: 7.5, water_cost: 112500, recorded_at: '2026-05-01T08:00:00Z' },
    { id: 'cr-11', customer_id: 'u-5', room_id: 'r-1', period: '2026-05', electricity_kwh: 115, electricity_cost: 402500,  water_m3: 7.8, water_cost: 117000, recorded_at: '2026-06-01T08:00:00Z' },
    { id: 'cr-12', customer_id: 'u-5', room_id: 'r-1', period: '2026-06', electricity_kwh: 52,  electricity_cost: 182000,  water_m3: 3.5, water_cost: 52500,  recorded_at: '2026-06-02T08:00:00Z' }
  ] as ConsumptionRecord[]
};

// Initialize Mock Database in LocalStorage
export const initializeMockDB = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
  } else {
    try {
      const db = JSON.parse(existing);
      let updated = false;
      if (db && db.profiles) {
        INITIAL_DB.profiles.forEach((p) => {
          if (!db.profiles.some((ep: any) => ep.email.toLowerCase() === p.email.toLowerCase())) {
            db.profiles.push(p);
            updated = true;
          }
        });
      }
      if (db && db.rooms) {
        // Force update rooms to ensure new properties exist
        db.rooms = INITIAL_DB.rooms;
        updated = true;
      }
      if (db && (!db.viewing_schedules || db.viewing_schedules.length < 8)) {
        db.viewing_schedules = INITIAL_DB.viewing_schedules;
        updated = true;
      }
      // Seed Sale Dashboard mock data
      if (db && !db.today_appointments) {
        db.today_appointments = INITIAL_DB.today_appointments;
        db.recent_registrations = INITIAL_DB.recent_registrations;
        db.activity_logs = INITIAL_DB.activity_logs;
        updated = true;
      }
      // Seed Services mock data
      if (db && !db.services) {
        db.services = INITIAL_DB.services;
        db.service_subscriptions = INITIAL_DB.service_subscriptions;
        db.consumption_records = INITIAL_DB.consumption_records;
        updated = true;
      }
      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      }
    } catch (e) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
    }
  }
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
