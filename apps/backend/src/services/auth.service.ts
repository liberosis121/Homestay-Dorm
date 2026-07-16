import { createClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import * as profileRepo from '../repositories/profile.repo';
import { USER_ROLE } from '../types/constants';
import { sendOtpEmail } from '../utils/email.helper';

// Helper de tao client auth rieng cho tung request, tranh o nhiem session len client singleton dung chung
const getAuthClient = () => createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

export const authService = {
  /**
   * Đăng ký tài khoản khách hàng mới.
   *
   * @param email - Địa chỉ email đăng ký
   * @param password - Mật khẩu đăng ký
   * @param fullName - Họ và tên khách hàng
   * @param phone - Số điện thoại liên hệ
   */
  register: async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    dob?: string,
    gender?: string,
    nationality?: string,
    cccd?: string,
    cccdIssueDate?: string,
    cccdIssuePlace?: string,
    address?: string
  ) => {
    // 1. Gọi Supabase Auth đăng ký tài khoản mới qua client tam thoi
    const authClient = getAuthClient();
    const { data, error: signUpError } = await authClient.auth.signUp({
      email,
      password,
    });

    if (signUpError || !data.user) {
      throw new Error(signUpError?.message || 'Đăng ký tài khoản trên hệ thống thất bại.');
    }

    const userId = data.user.id;

    try {
      // 2. Supabase trigger tu dong tao profiles khi signUp voi role='customer' va full_name='Người dùng mới'.
      // Dung upsert de cap nhat lai full_name, phone cho dung voi thong tin khach hang nhap vao.
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: fullName,
          phone: phone,
          role: USER_ROLE.CUSTOMER,
        }, { onConflict: 'id' });

      if (profileError) throw profileError;

      // 3. Tao ban ghi khach hang lien ket voi profile
      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: userId,
          full_name: fullName,
          phone: phone,
          email: email,
          cccd: cccd || null,
          dob: dob || null,
          gender: gender || null,
          nationality: nationality || null,
          cccd_issue_date: cccdIssueDate || null,
          cccd_issue_place: cccdIssuePlace || null,
          address: address || null,
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
      // Rollback: Neu luu DB loi, xoa user Auth vua tao de khach hang co the dang ky lai
      await authClient.auth.admin.deleteUser(userId);
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
    // 1. Xác thực thông tin đăng nhập với Supabase Auth qua client tam thoi
    const authClient = getAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
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

    let rentingRoomName: string | undefined = undefined;
    let hasContractHistory = false;
    let stayStatus: profileRepo.CustomerStayStatus | undefined = undefined;
    let canRequestCheckout = false;
    let branchName: string | undefined = undefined;

    if (profile.role === USER_ROLE.CUSTOMER) {
      rentingRoomName = await profileRepo.getRentingRoomName(data.user.id);
      hasContractHistory = await profileRepo.hasContractHistory(data.user.id);
      stayStatus = await profileRepo.getCustomerStayStatus(data.user.id);
      canRequestCheckout = await profileRepo.canRequestCheckout(data.user.id);
    } else {
      // Load branch name for employees
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('id', data.user.id)
        .maybeSingle();
      if (employee?.branch_id) {
        const { data: branch } = await supabase
          .from('branches')
          .select('name')
          .eq('id', employee.branch_id)
          .maybeSingle();
        branchName = branch?.name || employee.branch_id;
      }
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
        created_at: profile.created_at,
        renting_room_name: rentingRoomName,
        has_contract_history: hasContractHistory,
        stay_status: stayStatus,
        can_request_checkout: canRequestCheckout,
        member_since: profile.created_at,
        branch_name: branchName,
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
    // Thu hồi session hiện tại trên Supabase qua client tam thoi
    const authClient = getAuthClient();
    const { error } = await authClient.auth.signOut();
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
      let customerDetails = await profileRepo.getCustomerByUserId(userId);
      if (!customerDetails) {
        // Tự động tạo bản ghi khách hàng tương ứng (khi đăng ký bằng Google OAuth không qua form thông thường)
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            full_name: profile.full_name || 'Khách hàng mới',
            phone: profile.phone || '',
            email: profile.email,
            cccd: null, // Không cần tạo CCCD ảo nữa vì CCCD đã nullable
            nationality: null,
          })
          .select()
          .maybeSingle();

        if (!insertError && newCustomer) {
          customerDetails = newCustomer;
        }
      }
      const rentingRoomName = await profileRepo.getRentingRoomName(userId);
      const hasContractHistory = await profileRepo.hasContractHistory(userId);
      const stayStatus = await profileRepo.getCustomerStayStatus(userId);
      const canRequestCheckout = await profileRepo.canRequestCheckout(userId);
      return {
        ...profile,
        renting_room_name: rentingRoomName,
        has_contract_history: hasContractHistory,
        stay_status: stayStatus,
        can_request_checkout: canRequestCheckout,
        member_since: profile.created_at,
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

    // 3. Cập nhật bảng chi tiết (customers hoặc employees)
    if (profile.role === USER_ROLE.CUSTOMER) {
      // Chi cap nhat cac truong khach hang co trong request body
      const customerUpdates: Record<string, any> = {};
      if (full_name !== undefined) customerUpdates.full_name = full_name;
      if (phone !== undefined) customerUpdates.phone = phone;
      if (restDetails.cccd !== undefined) customerUpdates.cccd = restDetails.cccd;
      if (restDetails.dob !== undefined) customerUpdates.dob = restDetails.dob || null;
      // Chi map gender khi KH co gui truong gender, tranh ghi de 'Khac' khi KH khong gui
      if (restDetails.gender !== undefined) {
        customerUpdates.gender = restDetails.gender === 'male' ? 'Nam' : (restDetails.gender === 'female' ? 'Nữ' : 'Khác');
      }
      if (restDetails.nationality !== undefined) customerUpdates.nationality = restDetails.nationality;
      if (restDetails.issue_date !== undefined) customerUpdates.cccd_issue_date = restDetails.issue_date || null;
      if (restDetails.issue_place !== undefined) customerUpdates.cccd_issue_place = restDetails.issue_place || null;
      if (restDetails.permanent_address !== undefined || restDetails.address !== undefined) {
        customerUpdates.address = restDetails.permanent_address || restDetails.address;
      }

      if (Object.keys(customerUpdates).length > 0) {
        const { error: customerError } = await supabase
          .from('customers')
          .update(customerUpdates)
          .eq('user_id', userId);

        if (customerError) {
          throw new Error(`Cập nhật thông tin khách hàng thất bại: ${customerError.message}`);
        }
      }
    } else if ([USER_ROLE.SALE, USER_ROLE.MANAGER, USER_ROLE.ACCOUNTANT].includes(profile.role as any)) {
      // Chi cap nhat cac truong nhan vien co trong request body
      const staffUpdates: Record<string, any> = {};
      if (full_name !== undefined) staffUpdates.full_name = full_name;
      if (phone !== undefined) staffUpdates.phone = phone;

      if (Object.keys(staffUpdates).length > 0) {
        const { error: staffError } = await supabase
          .from('employees')
          .update(staffUpdates)
          .eq('id', userId);

        if (staffError) {
          throw new Error(`Cập nhật thông tin nhân viên thất bại: ${staffError.message}`);
        }
      }
    }

    return updatedProfile;
  },

  /**
   * Yêu cầu khôi phục mật khẩu qua OTP email.
   *
   * Quy trình:
   *  1. Kiểm tra email tồn tại trong profiles.
   *  2. Tạo OTP ngẫu nhiên 6 chữ số.
   *  3. Lưu vào bảng `otps` (ghi đè nếu đã có), hết hạn sau 5 phút.
   *  4. Gửi email chứa OTP tới người dùng.
   *
   * @param email - Email cần khôi phục mật khẩu
   */
  forgotPassword: async (email: string) => {
    // 1. Kiểm tra email có trong hệ thống
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!profile) {
      // Không tiết lộ thông tin email có tồn tại hay không (security best practice)
      // Nhưng vẫn throw lỗi để FE có thể hiển thị thông báo cho phù hợp mô hình demo
      throw new Error('Email này chưa được đăng ký trong hệ thống.');
    }

    // 2. Tạo mã OTP ngẫu nhiên 6 chữ số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hết hạn sau 5 phút
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 4. Upsert vào bảng otps (ghi đè nếu email đã tồn tại)
    const { error: otpError } = await supabase
      .from('otps')
      .upsert({ email, otp_code: otpCode, expired_at: expiredAt }, { onConflict: 'email' });

    if (otpError) {
      throw new Error(`Lưu OTP thất bại: ${otpError.message}`);
    }

    // 5. Gửi email
    await sendOtpEmail(email, otpCode);

    return { success: true };
  },

  /**
   * Xác thực OTP và đặt lại mật khẩu mới.
   *
   * @param email - Email cần đặt lại mật khẩu
   * @param otp - Mã OTP người dùng nhập
   * @param newPassword - Mật khẩu mới
   */
  resetPasswordWithOtp: async (email: string, otp: string, newPassword: string) => {
    if (!email || !otp || !newPassword) {
      throw new Error('Thiếu thông tin: email, mã OTP hoặc mật khẩu mới.');
    }
    if (newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
    }

    // 1. Lấy OTP từ DB
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otps')
      .select('otp_code, expired_at')
      .eq('email', email)
      .maybeSingle();

    if (fetchError || !otpRecord) {
      throw new Error('Không tìm thấy mã OTP cho email này. Vui lòng yêu cầu gửi lại.');
    }

    // 2. Kiểm tra mã OTP khớp
    if (otpRecord.otp_code !== otp) {
      throw new Error('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
    }

    // 3. Kiểm tra thời gian hết hạn
    if (new Date() > new Date(otpRecord.expired_at)) {
      // Xóa OTP đã hết hạn
      await supabase.from('otps').delete().eq('email', email);
      throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi mã mới.');
    }

    // 4. Lấy user ID theo email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!profile) {
      throw new Error('Không tìm thấy tài khoản với email này.');
    }

    // 5. Cập nhật mật khẩu mới qua Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    });

    if (updateError) {
      throw new Error(`Cập nhật mật khẩu thất bại: ${updateError.message}`);
    }

    // 6. Xóa OTP đã dùng (tránh tái sử dụng)
    await supabase.from('otps').delete().eq('email', email);

    return { success: true };
  },

  /**
   * Đổi mật khẩu của người dùng qua admin API.
   */
  changePassword: async (userId: string, newPassword: string) => {
    if (!userId) {
      throw new Error('User ID là bắt buộc');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });
    if (error) {
      throw new Error(`Lỗi khi cập nhật mật khẩu: ${error.message}`);
    }
    return { success: true };
  },
};
