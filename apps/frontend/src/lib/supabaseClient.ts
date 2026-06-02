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

// Initial dummy database
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
  ] as ViewingSchedule[]
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
        // Force update viewing_schedules to seed the new diverse mock data
        db.viewing_schedules = INITIAL_DB.viewing_schedules;
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
