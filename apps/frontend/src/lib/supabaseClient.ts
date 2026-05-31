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
  floor: number;
  type: 'standard' | 'premium';
  gender_type: 'male' | 'female' | 'unisex';
  has_ac: boolean;
  has_private_wc: boolean;
  price: number;
  status: 'available' | 'deposited' | 'occupied' | 'maintenance';
}

export interface Bed {
  id: string;
  room_id: string;
  name: string;
  price: number;
  status: 'available' | 'deposited' | 'occupied' | 'maintenance';
}

// Initial dummy database
const INITIAL_DB = {
  profiles: [
    { id: 'u-1', email: 'admin@homestay.com', role: 'admin', full_name: 'Hoàng Quốc Việt (Admin)', phone: '0901234567' },
    { id: 'u-2', email: 'manager@homestay.com', role: 'manager', full_name: 'Trần Kim Yến (Quản lý)', phone: '0907654321' },
    { id: 'u-3', email: 'sale@homestay.com', role: 'sale', full_name: 'Nguyễn Thị Trúc Hằng (NV Sale)', phone: '0912345678' },
    { id: 'u-4', email: 'accountant@homestay.com', role: 'accountant', full_name: 'Lê Hoàng Nhật Anh (Kế toán)', phone: '0987654321' },
    { id: 'u-5', email: 'customer@gmail.com', role: 'customer', full_name: 'Lê Lâm Trí Đức (Khách hàng)', phone: '0933344556' }
  ] as Profile[],
  branches: [
    { id: 'b-1', name: 'Chi nhánh Quận 1', address: '120 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM', manager_id: 'u-2' },
    { id: 'b-2', name: 'Chi nhánh Thủ Đức (Khu ĐHQG)', address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức, TP.HCM', manager_id: 'u-2' }
  ] as Branch[],
  rooms: [
    { id: 'r-1', branch_id: 'b-1', name: 'Phòng 101 (Nam)', capacity: 4, floor: 1, type: 'standard', gender_type: 'male', has_ac: true, has_private_wc: true, price: 1500000, status: 'available' },
    { id: 'r-2', branch_id: 'b-1', name: 'Phòng 102 (Nữ)', capacity: 4, floor: 1, type: 'premium', gender_type: 'female', has_ac: true, has_private_wc: true, price: 2000000, status: 'available' },
    { id: 'r-3', branch_id: 'b-2', name: 'Phòng 201 (Nam)', capacity: 8, floor: 2, type: 'standard', gender_type: 'male', has_ac: false, has_private_wc: false, price: 900000, status: 'available' },
    { id: 'r-4', branch_id: 'b-2', name: 'Phòng 202 (Nữ)', capacity: 6, floor: 2, type: 'standard', gender_type: 'female', has_ac: true, has_private_wc: true, price: 1200000, status: 'available' }
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
  ] as Bed[]
};

// Initialize Mock Database in LocalStorage
export const initializeMockDB = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
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
      return userStr ? JSON.parse(userStr) as Profile : null;
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
