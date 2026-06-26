/**
 * Service layer de xu ly nghiep vu lien quan den xac thuc tai khoan (Authentication).
 * Phu thuoc: utils/supabase.ts, repositories/profile.repo.ts
 */

import { supabase } from '../utils/supabase';
import * as profileRepo from '../repositories/profile.repo';
import { USER_ROLE } from '../types/constants';

export const authService = {
  /**
   * Đăng ký tài khoản khách hàng mới.
   *
   * @param email - Địa chỉ email đăng ký
   * @param password - Mật khẩu đăng ký
   * @param fullName - Họ và tên khách hàng
   * @param phone - Số điện thoại liên hệ
   */
  register: async (email: string, password: string, fullName: string, phone: string) => {
    // 1. Gọi Supabase Auth đăng ký tài khoản mới
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !data.user) {
      throw new Error(signUpError?.message || 'Đăng ký tài khoản trên hệ thống thất bại.');
    }

    const userId = data.user.id;

    try {
      // 2. Tạo bản ghi profile cơ bản (role mặc định: customer)
      // profile.repo.ts không có hàm insertProfile nên chúng ta insert trực tiếp thông qua supabase ở đây
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
          phone: phone,
          role: USER_ROLE.CUSTOMER,
          created_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // 3. Tạo bản ghi khách hàng (khach_hang) liên kết với profile
      const { error: customerError } = await supabase
        .from('khach_hang')
        .insert({
          user_id: userId,
          full_name: fullName,
          phone: phone,
          email: email,
          cccd: `CCCD-${Date.now()}`, // Tạo tạm mã định danh cccd duy nhất để không bị lỗi CONSTRAINT UNIQUE
          nationality: 'Việt Nam',
        });

      if (customerError) throw customerError;

      return {
        userId,
        email,
        full_name: fullName,
        phone,
        role: USER_ROLE.CUSTOMER,
      };
    } catch (dbError: any) {
      // Rollback: Nếu lưu database lỗi, ta nên xóa user đã được tạo ở Auth (để khách hàng có thể đăng ký lại)
      // Dùng admin API để xóa user vừa tạo (chỉ làm được khi có service role key)
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Lỗi khởi tạo hồ sơ dữ liệu: ${dbError.message}`);
    }
  },

  /**
   * Đăng nhập người dùng bằng email và mật khẩu.
   *
   * @param email - Địa chỉ email
   * @param password - Mật khẩu người dùng
   */
  login: async (email: string, password: string) => {
    // 1. Xác thực thông tin đăng nhập với Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      throw new Error(error?.message || 'Sai tên đăng nhập hoặc mật khẩu.');
    }

    // 2. Lấy vai trò (role) từ bảng profiles
    const profile = await profileRepo.getProfileByUserId(data.user.id);
    if (!profile) {
      throw new Error('Hồ sơ người dùng không tồn tại trong hệ thống.');
    }

    // Kiểm tra trạng thái tài khoản
    if (profile.role === 'locked') {
      throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản lý.');
    }

    return {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile.full_name,
        phone: profile.phone,
        role: profile.role,
        avatar_url: profile.avatar_url,
      },
    };
  },

  /**
   * Đăng xuất người dùng.
   * Do JWT là stateless, phía server chỉ cần gọi signOut của Supabase để xóa session phía cloud.
   * Client có trách nhiệm xóa token khỏi bộ nhớ.
   *
   * @param token - Token hiện tại của user để verify đăng xuất
   */
  logout: async (token: string) => {
    // Thu hồi session hiện tại trên Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Đăng xuất thất bại: ${error.message}`);
    }
    return { success: true };
  },

  /**
   * Lấy hồ sơ cá nhân đầy đủ (kết hợp profile + thông tin chi tiết của khách hàng/nhân viên).
   *
   * @param userId - UUID của người dùng hiện tại
   */
  getProfile: async (userId: string) => {
    // 1. Lấy thông tin profile gốc
    const profile = await profileRepo.getProfileByUserId(userId);
    if (!profile) {
      throw new Error('Không tìm thấy thông tin hồ sơ.');
    }

    // 2. Lấy thêm thông tin chi tiết tùy thuộc vào vai trò
    if (profile.role === USER_ROLE.CUSTOMER) {
      const customerDetails = await profileRepo.getCustomerByUserId(userId);
      return {
        ...profile,
        details: customerDetails,
      };
    } else if ([USER_ROLE.SALE, USER_ROLE.MANAGER, USER_ROLE.ACCOUNTANT].includes(profile.role as any)) {
      const staffDetails = await profileRepo.getStaffByUserId(userId);
      return {
        ...profile,
        details: staffDetails,
      };
    }

    return {
      ...profile,
      details: null,
    };
  },

  /**
   * Cập nhật thông tin hồ sơ người dùng.
   *
   * @param userId - UUID của người dùng cần cập nhật
   * @param data - Dữ liệu cần cập nhật
   */
  updateProfile: async (userId: string, data: any) => {
    // 1. Lấy profile hiện tại để xác định vai trò
    const profile = await profileRepo.getProfileByUserId(userId);
    if (!profile) {
      throw new Error('Không tìm thấy thông tin hồ sơ.');
    }

    const { full_name, phone, avatar_url, ...restDetails } = data;

    // 2. Cập nhật bảng profiles chính
    const updatedProfile = await profileRepo.updateProfile(userId, {
      full_name,
      phone,
      avatar_url,
    });

    // 3. Cập nhật bảng chi tiết (khach_hang hoặc nhan_vien)
    if (profile.role === USER_ROLE.CUSTOMER) {
      // Cập nhật bảng khach_hang
      const dbGender = restDetails.gender === 'male' ? 'Nam' : (restDetails.gender === 'female' ? 'Nữ' : 'Khác');
      
      const { error: customerError } = await supabase
        .from('khach_hang')
        .update({
          full_name,
          phone,
          cccd: restDetails.cccd,
          dob: restDetails.dob || null,
          gender: dbGender,
          nationality: restDetails.nationality || 'Việt Nam',
          address: restDetails.permanent_address || restDetails.address,
        })
        .eq('user_id', userId);

      if (customerError) {
        throw new Error(`Cập nhật thông tin khách hàng thất bại: ${customerError.message}`);
      }
    } else if ([USER_ROLE.SALE, USER_ROLE.MANAGER, USER_ROLE.ACCOUNTANT].includes(profile.role as any)) {
      // Cập nhật bảng nhan_vien
      const { error: staffError } = await supabase
        .from('nhan_vien')
        .update({
          full_name,
          phone,
        })
        .eq('id', userId);

      if (staffError) {
        throw new Error(`Cập nhật thông tin nhân viên thất bại: ${staffError.message}`);
      }
    }

    return updatedProfile;
  },

  /**
   * Yêu cầu khôi phục mật khẩu qua email.
   *
   * @param email - Email cần khôi phục mật khẩu
   */
  forgotPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      throw new Error(`Yêu cầu khôi phục mật khẩu thất bại: ${error.message}`);
    }

    return { success: true };
  },
};
