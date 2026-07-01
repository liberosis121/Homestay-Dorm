import avatarCustomer from '../assets/avatar-customer.png';
import avatarNewCustomer from '../assets/avatar-newcustomer.png';
import avatarAdmin from '../assets/avatar-admin.png';
import avatarManager from '../assets/avatar-manager.png';
import avatarSale from '../assets/avatar-sale.png';
import avatarAccountant from '../assets/avatar-accountant.png';

export interface Customer {
  id: string;
  code: string;
  fullName: string;
  full_name: string; // for compatibility with admin views
  email: string; // for compatibility
  phone: string; // for compatibility
  renting_room_name?: string; // for compatibility
  avatar: string;
  status: 'active' | 'inactive';
  tier: 'VIP' | 'Loyal' | 'New' | 'Old';
  joinDate: string;
  created_at: string; // for compatibility
  personalInfo: {
    cccd: string;
    phone: string;
    email: string;
    birthDate: string;
    nationality: string;
    job: string;
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
  recentActivities: Array<{
    icon: string;
    iconBg: string;
    time: string;
    title: string;
  }>;
  importantNote: string;
}

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    code: 'TE-99201',
    fullName: 'Nguyễn Hoàng Nam',
    full_name: 'Nguyễn Hoàng Nam',
    email: 'nam.nh92@gmail.com',
    phone: '0902334556',
    renting_room_name: 'Phòng 101 (Nam)',
    avatar: avatarCustomer,
    status: 'active',
    tier: 'Loyal',
    joinDate: '15/05/2022',
    created_at: '2022-05-15T00:00:00Z',
    personalInfo: {
      cccd: '001092008712',
      phone: '0902334556',
      email: 'nam.nh92@gmail.com',
      birthDate: '12/08/1992',
      nationality: 'Việt Nam',
      job: 'Kỹ sư phần mềm',
      address: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2024-001', roomType: 'Studio Luxury (Lầu 12)', date: '10/01/2024', status: 'completed' },
      { id: 'REG-2023-452', roomType: '1BR Penthouse', date: '15/12/2023', status: 'cancelled' }
    ],
    viewings: [
      { roomName: 'Phòng 1204 - Timber Tower A', branch: 'Chi nhánh Quận 1', date: '05/01/2024', staffName: 'Trần Minh Đức', status: 'viewed' },
      { roomName: 'Phòng 302 - Timber Garden', branch: 'Chi nhánh Bình Thạnh', date: '28/12/2023', staffName: 'Trần Minh Đức', status: 'cancelled' }
    ],
    deposits: [
      { content: 'Cọc giữ chỗ 1204', date: '12/01/2024', amount: '10,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-24-0021-TE', period: '01/02/2024 - 01/02/2025', status: 'active' }
    ],
    recentActivities: [
      { icon: 'edit', iconBg: 'bg-primary', time: 'Hôm nay, 10:30', title: 'Cập nhật thông tin CCCD mới' },
      { icon: 'calendar', iconBg: 'bg-tertiary', time: 'Hôm qua, 15:45', title: 'Đã xem phòng 1204 - Kết quả: Ưa thích' },
      { icon: 'wallet', iconBg: 'bg-primary-container', time: '05/01/2024', title: 'Thanh toán cọc giữ chỗ thành công' }
    ],
    importantNote: 'Khách hàng quan tâm đến các căn hộ hướng Đông và có ban công rộng. Ưu tiên các dự án cao tầng gần trung tâm.'
  },
  {
    id: '2',
    code: 'TE-88402',
    fullName: 'Trần Thị Mai Anh',
    full_name: 'Trần Thị Mai Anh',
    email: 'maianh.tran@gmail.com',
    phone: '0912445667',
    renting_room_name: 'Phòng 102 (Nữ)',
    avatar: avatarNewCustomer,
    status: 'active',
    tier: 'New',
    joinDate: '10/05/2026',
    created_at: '2026-05-10T00:00:00Z',
    personalInfo: {
      cccd: '002195009876',
      phone: '0912445667',
      email: 'maianh.tran@gmail.com',
      birthDate: '24/11/1995',
      nationality: 'Việt Nam',
      job: 'Nhân viên Marketing',
      address: '45/12 Cao Thắng, Phường 3, Quận 3, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2026-092', roomType: 'Phòng đơn Cozy (Lầu 5)', date: '11/05/2026', status: 'pending' }
    ],
    viewings: [
      { roomName: 'Phòng 509 - Timber Tower B', branch: 'Chi nhánh Quận 1', date: '15/05/2026', staffName: 'Nguyễn Văn B', status: 'confirmed' }
    ],
    deposits: [
      { content: 'Cọc giữ phòng đơn 509', date: '12/05/2026', amount: '5,000,000 VNĐ', status: 'pending' }
    ],
    contracts: [],
    recentActivities: [
      { icon: 'calendar', iconBg: 'bg-tertiary', time: '2 ngày trước', title: 'Đặt lịch hẹn xem phòng đơn 509' },
      { icon: 'wallet', iconBg: 'bg-primary-container', time: '3 ngày trước', title: 'Gửi yêu cầu đặt cọc giữ chỗ' }
    ],
    importantNote: 'Khách yêu cầu phòng yên tĩnh để làm việc, không quá gần thang máy.'
  },
  {
    id: '3',
    code: 'TE-66103',
    fullName: 'Lê Văn Hải',
    full_name: 'Lê Văn Hải',
    email: 'haile88@yahoo.com',
    phone: '0987665443',
    avatar: avatarAdmin,
    status: 'inactive',
    tier: 'Old',
    joinDate: '12/02/2023',
    created_at: '2023-02-12T00:00:00Z',
    personalInfo: {
      cccd: '003088001234',
      phone: '0987665443',
      email: 'haile88@yahoo.com',
      birthDate: '05/03/1988',
      nationality: 'Việt Nam',
      job: 'Kinh doanh tự do',
      address: '789 Trần Hưng Đạo, Phường 2, Quận 5, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2023-112', roomType: 'Studio standard', date: '15/02/2023', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc hoàn trả hoàn tất', date: '28/02/2024', amount: '8,000,000 VNĐ', status: 'refunded' }
    ],
    contracts: [
      { id: 'HĐ-23-0104-TE', period: '01/03/2023 - 01/03/2024', status: 'expired' }
    ],
    recentActivities: [
      { icon: 'file', iconBg: 'bg-primary', time: '28/02/2024', title: 'Thanh lý hợp đồng và nhận lại cọc' }
    ],
    importantNote: 'Đã hoàn tất thanh lý hợp đồng đúng hạn, không có công nợ tồn đọng.'
  },
  {
    id: '4',
    code: 'TE-99004',
    fullName: 'Phạm Minh Tuấn',
    full_name: 'Phạm Minh Tuấn',
    email: 'tuan.pham@outlook.com',
    phone: '0933221144',
    renting_room_name: 'Phòng 202 (Nữ)',
    avatar: avatarManager,
    status: 'active',
    tier: 'VIP',
    joinDate: '01/09/2021',
    created_at: '2021-09-01T00:00:00Z',
    personalInfo: {
      cccd: '004189004567',
      phone: '0933221144',
      email: 'tuan.pham@outlook.com',
      birthDate: '15/07/1989',
      nationality: 'Việt Nam',
      job: 'Giám đốc Sáng tạo',
      address: 'Vinhomes Central Park, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2021-301', roomType: '2BR Suite Premium', date: '01/09/2021', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc thuê căn hộ 2 phòng ngủ', date: '01/09/2021', amount: '25,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-21-0089-TE', period: '01/09/2021 - 01/09/2026', status: 'active' }
    ],
    recentActivities: [
      { icon: 'wallet', iconBg: 'bg-primary-container', time: '15 ngày trước', title: 'Thanh toán hóa đơn dịch vụ tháng 05/2026' }
    ],
    importantNote: 'Khách VIP, hỗ trợ dọn phòng định kỳ 2 lần/tuần. Yêu cầu bảo mật thông tin tối đa.'
  },
  {
    id: '5',
    code: 'TE-11005',
    fullName: 'Vũ Thu Thảo',
    full_name: 'Vũ Thu Thảo',
    email: 'thaovu96@gmail.com',
    phone: '0909776655',
    avatar: avatarSale,
    status: 'active',
    tier: 'New',
    joinDate: '25/05/2026',
    created_at: '2026-05-25T00:00:00Z',
    personalInfo: {
      cccd: '005096007890',
      phone: '0909776655',
      email: 'thaovu96@gmail.com',
      birthDate: '18/06/1996',
      nationality: 'Việt Nam',
      job: 'Thiết kế đồ họa',
      address: '246 Đoàn Văn Bơ, Phường 10, Quận 4, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2026-105', roomType: 'Studio Balcony', date: '26/05/2026', status: 'pending' }
    ],
    viewings: [
      { roomName: 'Phòng 708 - Timber Tower B', branch: 'Chi nhánh Quận 1', date: '03/06/2026', staffName: 'Phạm Thu Trang', status: 'confirmed' }
    ],
    deposits: [],
    contracts: [],
    recentActivities: [
      { icon: 'calendar', iconBg: 'bg-tertiary', time: '1 ngày trước', title: 'Lên lịch hẹn xem phòng Studio Balcony' }
    ],
    importantNote: 'Yêu cầu phòng có ban công hướng thoáng mát, nhiều ánh sáng tự nhiên để trồng cây cảnh.'
  },
  {
    id: '6',
    code: 'TE-99306',
    fullName: 'Hoàng Đức Kiên',
    full_name: 'Hoàng Đức Kiên',
    email: 'kienhoang@gmail.com',
    phone: '0977334455',
    renting_room_name: 'Phòng 203 (Nữ)',
    avatar: avatarAccountant,
    status: 'active',
    tier: 'Loyal',
    joinDate: '20/10/2022',
    created_at: '2022-10-20T00:00:00Z',
    personalInfo: {
      cccd: '006093006543',
      phone: '0977334455',
      email: 'kienhoang@gmail.com',
      birthDate: '30/10/1993',
      nationality: 'Việt Nam',
      job: 'Quản lý dự án',
      address: '56 Nguyễn Đình Chiểu, Đa Kao, Quận 1, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2022-771', roomType: '1BR Studio', date: '21/10/2022', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc gia hạn hợp đồng', date: '15/10/2024', amount: '12,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-22-0456-TE', period: '01/11/2022 - 01/11/2026', status: 'active' }
    ],
    recentActivities: [
      { icon: 'edit', iconBg: 'bg-primary', time: '1 tháng trước', title: 'Yêu cầu kiểm tra bảo dưỡng máy lạnh định kỳ' }
    ],
    importantNote: 'Luôn đóng tiền phòng trước thời hạn 5 ngày. Khách thuê rất uy tín.'
  },
  {
    id: '7',
    code: 'TE-55307',
    fullName: 'Đỗ Kim Chi',
    full_name: 'Đỗ Kim Chi',
    email: 'chido.kim@gmail.com',
    phone: '0915223344',
    avatar: avatarCustomer,
    status: 'inactive',
    tier: 'Old',
    joinDate: '01/01/2024',
    created_at: '2024-01-01T00:00:00Z',
    personalInfo: {
      cccd: '007198005432',
      phone: '0915223344',
      email: 'chido.kim@gmail.com',
      birthDate: '10/01/1998',
      nationality: 'Việt Nam',
      job: 'Biên dịch viên',
      address: '12 Phú Mỹ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2024-002', roomType: 'Phòng đơn Standard', date: '02/01/2024', status: 'cancelled' }
    ],
    viewings: [
      { roomName: 'Phòng 201 - Timber Garden', branch: 'Chi nhánh Bình Thạnh', date: '04/01/2024', staffName: 'Trần Văn Đạt', status: 'cancelled' }
    ],
    deposits: [],
    contracts: [],
    recentActivities: [
      { icon: 'calendar', iconBg: 'bg-tertiary', time: '04/01/2024', title: 'Hủy lịch hẹn xem phòng do đi công tác đột xuất' }
    ],
    importantNote: 'Đã rút hồ sơ đăng ký do thay đổi kế hoạch làm việc tại Hà Nội.'
  },
  {
    id: '8',
    code: 'TE-22008',
    fullName: 'Bùi Anh Dũng',
    full_name: 'Bùi Anh Dũng',
    email: 'dungbui87@gmail.com',
    phone: '0966445566',
    avatar: avatarNewCustomer,
    status: 'active',
    tier: 'New',
    joinDate: '28/05/2026',
    created_at: '2026-05-28T00:00:00Z',
    personalInfo: {
      cccd: '008087009876',
      phone: '0966445566',
      email: 'dungbui87@gmail.com',
      birthDate: '14/09/1987',
      nationality: 'Việt Nam',
      job: 'Kỹ sư Xây dựng',
      address: '567 Lê Văn Việt, Tăng Nhơn Phú A, Quận 9, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2026-121', roomType: '2BR Family Suite', date: '29/05/2026', status: 'pending' }
    ],
    viewings: [
      { roomName: 'Phòng 1002 - Timber Garden', branch: 'Chi nhánh Bình Thạnh', date: '01/06/2026', staffName: 'Lâm Kiến Quốc', status: 'viewed' }
    ],
    deposits: [
      { content: 'Cọc giữ căn hộ 1002', date: '01/06/2026', amount: '15,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-26-0045-TE', period: '15/06/2026 - 15/06/2028', status: 'pending' }
    ],
    recentActivities: [
      { icon: 'wallet', iconBg: 'bg-primary-container', time: 'Hôm qua', title: 'Đặt cọc giữ căn hộ 2 phòng ngủ 1002 thành công' },
      { icon: 'file', iconBg: 'bg-primary', time: 'Hôm nay', title: 'Hệ thống tạo dự thảo hợp đồng HĐ-26-0045-TE' }
    ],
    importantNote: 'Gia đình có con nhỏ, yêu cầu ban công có lưới an toàn và khu vực yên tĩnh ít tiếng ồn.'
  },
  {
    id: '9',
    code: 'TE-99409',
    fullName: 'Ngô Phương Linh',
    full_name: 'Ngô Phương Linh',
    email: 'linhngo94@gmail.com',
    phone: '0938112233',
    avatar: avatarAdmin,
    status: 'active',
    tier: 'VIP',
    joinDate: '15/06/2022',
    created_at: '2022-06-15T00:00:00Z',
    personalInfo: {
      cccd: '009194002345',
      phone: '0938112233',
      email: 'linhngo94@gmail.com',
      birthDate: '08/04/1994',
      nationality: 'Việt Nam',
      job: 'Bác sĩ Nha khoa',
      address: '22 Bis Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2022-302', roomType: '1BR Garden View', date: '16/06/2022', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc thuê căn hộ Garden View', date: '16/06/2022', amount: '15,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-22-0051-TE', period: '01/07/2022 - 01/07/2026', status: 'active' }
    ],
    recentActivities: [
      { icon: 'edit', iconBg: 'bg-primary', time: '3 ngày trước', title: 'Yêu cầu thay bóng đèn chiếu sáng ở khu bếp' }
    ],
    importantNote: 'Ưu tiên vị trí có chỗ đỗ xe ô tô gần lối vào hầm.'
  },
  {
    id: '10',
    code: 'TE-44110',
    fullName: 'Dương Quốc Bảo',
    full_name: 'Dương Quốc Bảo',
    email: 'baoduong91@gmail.com',
    phone: '0903998877',
    avatar: avatarManager,
    status: 'inactive',
    tier: 'Old',
    joinDate: '10/05/2024',
    created_at: '2024-05-10T00:00:00Z',
    personalInfo: {
      cccd: '010091008765',
      phone: '0903998877',
      email: 'baoduong91@gmail.com',
      birthDate: '29/09/1991',
      nationality: 'Việt Nam',
      job: 'Giảng viên Đại học',
      address: '15 Lữ Gia, Phường 15, Quận 11, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2024-410', roomType: 'Studio Standard', date: '12/05/2024', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Khấu trừ đặt cọc dọn dẹp', date: '10/05/2025', amount: '5,000,000 VNĐ', status: 'refunded' }
    ],
    contracts: [
      { id: 'HĐ-24-0321-TE', period: '15/05/2024 - 15/05/2025', status: 'expired' }
    ],
    recentActivities: [
      { icon: 'file', iconBg: 'bg-primary', time: '15/05/2025', title: 'Hết hạn hợp đồng và bàn giao phòng sạch sẽ' }
    ],
    importantNote: 'Đã hoàn cọc đầy đủ. Hồ sơ khách thuê rất tốt, văn minh lịch sự.'
  },
  {
    id: '11',
    code: 'TE-12011',
    fullName: 'Phan Thanh Hà',
    full_name: 'Phan Thanh Hà',
    email: 'haphan97@gmail.com',
    phone: '0975667788',
    avatar: avatarSale,
    status: 'active',
    tier: 'New',
    joinDate: '27/05/2026',
    created_at: '2026-05-27T00:00:00Z',
    personalInfo: {
      cccd: '011197003456',
      phone: '0975667788',
      email: 'haphan97@gmail.com',
      birthDate: '02/02/1997',
      nationality: 'Việt Nam',
      job: 'Chuyên viên Nhân sự',
      address: '34 Cách Mạng Tháng 8, Quận 3, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2026-118', roomType: 'Phòng đơn Cozy', date: '28/05/2026', status: 'pending' }
    ],
    viewings: [
      { roomName: 'Phòng 403 - Timber Tower A', branch: 'Chi nhánh Quận 1', date: '04/06/2026', staffName: 'Nguyễn Thị C', status: 'confirmed' }
    ],
    deposits: [],
    contracts: [],
    recentActivities: [
      { icon: 'calendar', iconBg: 'bg-tertiary', time: '4 ngày trước', title: 'Đặt lịch xem phòng đơn 403 thành công' }
    ],
    importantNote: 'Khách cần phòng có bàn làm việc đủ rộng và đường truyền Internet tốc độ cao ổn định.'
  },
  {
    id: '12',
    code: 'TE-99612',
    fullName: 'Đặng Minh Triết',
    full_name: 'Đặng Minh Triết',
    email: 'trietdang99@gmail.com',
    phone: '0918776655',
    avatar: avatarAccountant,
    status: 'active',
    tier: 'Loyal',
    joinDate: '15/01/2023',
    created_at: '2023-01-15T00:00:00Z',
    personalInfo: {
      cccd: '012099009876',
      phone: '0918776655',
      email: 'trietdang99@gmail.com',
      birthDate: '17/02/1999',
      nationality: 'Việt Nam',
      job: 'Lập trình viên game',
      address: '124 Nguyễn Hữu Thọ, Phước Kiển, Nhà Bè, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2023-015', roomType: 'Studio Executive', date: '16/01/2023', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc bổ sung lắp máy lọc nước', date: '20/12/2023', amount: '3,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-23-0005-TE', period: '01/02/2023 - 01/02/2027', status: 'active' }
    ],
    recentActivities: [
      { icon: 'edit', iconBg: 'bg-primary', time: '1 tháng trước', title: 'Lắp đặt thêm kệ sách đứng tại phòng khách' }
    ],
    importantNote: 'Rất giữ gìn vệ sinh phòng. Thích tone phòng tối màu ấm áp.'
  },
  {
    id: '13',
    code: 'TE-12113',
    fullName: 'Lý Quỳnh Trang',
    full_name: 'Lý Quỳnh Trang',
    email: 'trangly96@gmail.com',
    phone: '0988554433',
    avatar: avatarCustomer,
    status: 'active',
    tier: 'New',
    joinDate: '29/05/2026',
    created_at: '2026-05-29T00:00:00Z',
    personalInfo: {
      cccd: '013196001234',
      phone: '0988554433',
      email: 'trangly96@gmail.com',
      birthDate: '11/12/1996',
      nationality: 'Việt Nam',
      job: 'Biên tập viên thời trang',
      address: '15/2A Nguyễn Bỉnh Khiêm, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2026-150', roomType: 'Premium Loft Room', date: '30/05/2026', status: 'pending' }
    ],
    viewings: [],
    deposits: [],
    contracts: [],
    recentActivities: [
      { icon: 'edit', iconBg: 'bg-primary', time: '2 ngày trước', title: 'Hồ sơ cá nhân được đưa lên hệ thống chờ duyệt' }
    ],
    importantNote: 'Yêu cầu phòng có không gian thiết kế độc đáo và ban công thoáng đãng.'
  },
  {
    id: '14',
    code: 'TE-66214',
    fullName: 'Trịnh Tiến Đạt',
    full_name: 'Trịnh Tiến Đạt',
    email: 'dattrinh85@gmail.com',
    phone: '0969223344',
    avatar: avatarNewCustomer,
    status: 'inactive',
    tier: 'Old',
    joinDate: '10/03/2024',
    created_at: '2024-03-10T00:00:00Z',
    personalInfo: {
      cccd: '014085005432',
      phone: '0969223344',
      email: 'dattrinh85@gmail.com',
      birthDate: '05/05/1985',
      nationality: 'Việt Nam',
      job: 'Kiến trúc sư',
      address: '89 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2024-142', roomType: 'Duplex Penthouse', date: '12/03/2024', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc thuê Duplex Penthouse', date: '12/03/2024', amount: '35,000,000 VNĐ', status: 'refunded' }
    ],
    contracts: [
      { id: 'HĐ-24-0098-TE', period: '15/03/2024 - 15/03/2026', status: 'expired' }
    ],
    recentActivities: [
      { icon: 'file', iconBg: 'bg-primary', time: '15/03/2026', title: 'Hoàn tất bàn giao căn hộ hết hạn hợp đồng' }
    ],
    importantNote: 'Đã hoàn trả đầy đủ tiền cọc 35 triệu. Không phát sinh hư hại tài sản trong thời gian thuê.'
  },
  {
    id: '15',
    code: 'TE-99815',
    fullName: 'Võ Thị Ngọc Bích',
    full_name: 'Võ Thị Ngọc Bích',
    email: 'bichvo99@gmail.com',
    phone: '0907443322',
    renting_room_name: 'Phòng 201 (Nam)',
    avatar: avatarAdmin,
    status: 'active',
    tier: 'VIP',
    joinDate: '10/10/2021',
    created_at: '2021-10-10T00:00:00Z',
    personalInfo: {
      cccd: '015199007890',
      phone: '0907443322',
      email: 'bichvo99@gmail.com',
      birthDate: '22/07/1999',
      nationality: 'Việt Nam',
      job: 'Chủ cửa hàng trực tuyến',
      address: 'Căn hộ Landmark 81, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2021-998', roomType: 'Executive Suite 2BR', date: '11/10/2021', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc thuê Executive Suite', date: '11/10/2021', amount: '30,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-21-0987-TE', period: '15/10/2021 - 15/10/2026', status: 'active' }
    ],
    recentActivities: [
      { icon: 'edit', iconBg: 'bg-primary', time: '2 tuần trước', title: 'Cập nhật lại thông tin giấy phép đăng ký kinh doanh' }
    ],
    importantNote: 'Khách thuê VIP dài hạn. Cần hỗ trợ xuất hóa đơn VAT điện tử hàng tháng đúng hạn.'
  },
  // ─── 10 NEW MOCK CUSTOMERS (CONNECTED DATA) ─────────────────────────────────
  {
    id: '16',
    code: 'TE-22016',
    fullName: 'Đặng Hoàng Long',
    full_name: 'Đặng Hoàng Long',
    email: 'long.dh@gmail.com',
    phone: '0982334455',
    renting_room_name: 'Phòng 103 (Nam)',
    avatar: avatarManager,
    status: 'active',
    tier: 'VIP',
    joinDate: '12/03/2025',
    created_at: '2025-03-12T00:00:00Z',
    personalInfo: {
      cccd: '030095001234',
      phone: '0982334455',
      email: 'long.dh@gmail.com',
      birthDate: '02/09/1995',
      nationality: 'Việt Nam',
      job: 'Giảng viên Anh văn',
      address: '320 Lý Thường Kiệt, Quận 10, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2025-104', roomType: 'Dorm Luxury 4 beds', date: '14/03/2025', status: 'completed' }
    ],
    viewings: [
      { roomName: 'Phòng 103 (Nam) - Chi nhánh Quận 1', branch: 'Chi nhánh Quận 1', date: '13/03/2025', staffName: 'Nguyễn Thị Trúc Hằng', status: 'viewed' }
    ],
    deposits: [
      { content: 'Cọc thuê phòng Dorm 103', date: '14/03/2025', amount: '3,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-25-0104-TE', period: '01/04/2025 - 01/04/2026', status: 'active' }
    ],
    recentActivities: [
      { icon: 'wallet', iconBg: 'bg-primary-container', time: '1 tuần trước', title: 'Thanh toán tiền điện nước tháng 05/2026' }
    ],
    importantNote: 'Khách hàng có tính kỷ luật cao, luôn giữ gìn vệ sinh chung tốt.'
  },
  {
    id: '17',
    code: 'TE-33017',
    fullName: 'Nguyễn Thùy Chi',
    full_name: 'Nguyễn Thùy Chi',
    email: 'thuychi.nguyen@yahoo.com',
    phone: '0901223344',
    avatar: avatarSale,
    status: 'inactive',
    tier: 'Old',
    joinDate: '15/04/2024',
    created_at: '2024-04-15T00:00:00Z',
    personalInfo: {
      cccd: '001198007788',
      phone: '0901223344',
      email: 'thuychi.nguyen@yahoo.com',
      birthDate: '12/10/1998',
      nationality: 'Việt Nam',
      job: 'Nhân viên Ngân hàng',
      address: '75 Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2024-051', roomType: 'Studio Premium', date: '16/04/2024', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc hoàn thanh lý hợp đồng', date: '15/04/2025', amount: '8,000,000 VNĐ', status: 'refunded' }
    ],
    contracts: [
      { id: 'HĐ-24-0056-TE', period: '01/05/2024 - 01/05/2025', status: 'expired' }
    ],
    recentActivities: [
      { icon: 'file', iconBg: 'bg-primary', time: '15/04/2025', title: 'Hoàn trả lại phòng 102 để chuyển công tác sang nước ngoài' }
    ],
    importantNote: 'Lịch sử thanh toán cực kỳ sạch sẽ, không có bất kỳ khiếu nại nào.'
  },
  {
    id: '18',
    code: 'TE-44018',
    fullName: 'Lâm Thế Vinh',
    full_name: 'Lâm Thế Vinh',
    email: 'vinhlt96@gmail.com',
    phone: '0937556677',
    renting_room_name: 'Phòng 203 (Nữ)',
    avatar: avatarAccountant,
    status: 'active',
    tier: 'Loyal',
    joinDate: '10/10/2023',
    created_at: '2023-10-10T00:00:00Z',
    personalInfo: {
      cccd: '079096001122',
      phone: '0937556677',
      email: 'vinhlt96@gmail.com',
      birthDate: '28/05/1996',
      nationality: 'Việt Nam',
      job: 'QA Engineer',
      address: '92/14 Nguyễn Thượng Hiền, Quận 3, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2023-882', roomType: 'Twin Room Standard', date: '12/10/2023', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc thuê phòng Twin', date: '12/10/2023', amount: '4,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-23-0882-TE', period: '15/10/2023 - 15/10/2025', status: 'active' }
    ],
    recentActivities: [
      { icon: 'edit', iconBg: 'bg-primary', time: '3 ngày trước', title: 'Yêu cầu kiểm tra ống nước bồn rửa mặt bị nghẹt' }
    ],
    importantNote: 'Khách hàng thân thiện, hay hỗ trợ các bạn cùng phòng.'
  },
  {
    id: '19',
    code: 'TE-55019',
    fullName: 'Phạm Bảo Trân',
    full_name: 'Phạm Bảo Trân',
    email: 'tranpb@outlook.com',
    phone: '0968990011',
    avatar: avatarCustomer,
    status: 'active',
    tier: 'New',
    joinDate: '01/06/2026',
    created_at: '2026-06-01T00:00:00Z',
    personalInfo: {
      cccd: '001099008899',
      phone: '0968990011',
      email: 'tranpb@outlook.com',
      birthDate: '08/08/1999',
      nationality: 'Việt Nam',
      job: 'Designer thời trang',
      address: 'Vạn Phúc City, Thủ Đức, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2026-204', roomType: 'Studio Executive', date: '01/06/2026', status: 'pending' }
    ],
    viewings: [
      { roomName: 'Phòng 203 (Nữ) - Chi nhánh Thủ Đức', branch: 'Chi nhánh Thủ Đức', date: '04/06/2026', staffName: 'NV. Lê Thị Hương', status: 'confirmed' }
    ],
    deposits: [],
    contracts: [],
    recentActivities: [
      { icon: 'calendar', iconBg: 'bg-tertiary', time: 'Hôm nay', title: 'Đã lên lịch hẹn xem phòng Studio vào lúc 08:30 ngày 08/06' }
    ],
    importantNote: 'Khách yêu cầu chỗ đậu ô tô rộng rãi và có thang máy thuận tiện.'
  },
  {
    id: '20',
    code: 'TE-66020',
    fullName: 'Trần Tuấn Kiệt',
    full_name: 'Trần Tuấn Kiệt',
    email: 'kiettran.arch@gmail.com',
    phone: '0917445566',
    avatar: avatarNewCustomer,
    status: 'inactive',
    tier: 'Old',
    joinDate: '20/12/2023',
    created_at: '2023-12-20T00:00:00Z',
    personalInfo: {
      cccd: '002084001234',
      phone: '0917445566',
      email: 'kiettran.arch@gmail.com',
      birthDate: '15/01/1984',
      nationality: 'Việt Nam',
      job: 'Kiến trúc sư tự do',
      address: '280 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2023-991', roomType: 'Studio Cozy Large', date: '21/12/2023', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc hoàn thanh lý hợp đồng', date: '20/12/2024', amount: '10,000,000 VNĐ', status: 'refunded' }
    ],
    contracts: [
      { id: 'HĐ-23-0991-TE', period: '01/01/2024 - 01/01/2025', status: 'expired' }
    ],
    recentActivities: [
      { icon: 'file', iconBg: 'bg-primary', time: '20/12/2024', title: 'Thanh lý hợp đồng do chuyển công tác về Hà Nội' }
    ],
    importantNote: 'Khách cũ, là người thiết kế mỹ thuật rất cẩn thận, đã để lại một số đồ trang trí tặng homestay.'
  },
  {
    id: 'u-5',
    code: 'TE-00101',
    fullName: 'Lê Lâm Trí Đức',
    full_name: 'Lê Lâm Trí Đức (Khách hàng)',
    email: 'customer@gmail.com',
    phone: '0933344556',
    renting_room_name: 'Phòng 101 (Nam)',
    avatar: avatarCustomer,
    status: 'active',
    tier: 'Loyal',
    joinDate: '01/01/2024',
    created_at: '2024-01-01T00:00:00Z',
    personalInfo: {
      cccd: '079198001212',
      phone: '0933344556',
      email: 'customer@gmail.com',
      birthDate: '14/05/1998',
      nationality: 'Việt Nam',
      job: 'Lập trình viên Java',
      address: '15/22 Cao Lỗ, Phường 4, Quận 8, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2024-101', roomType: 'Phòng Dorm Nam 101', date: '01/01/2024', status: 'completed' }
    ],
    viewings: [
      { roomName: 'Phòng 101 (Nam) - Quận 1', branch: 'Chi nhánh Quận 1', date: '28/12/2023', staffName: 'NV. Nguyễn Thị Trúc Hằng', status: 'viewed' }
    ],
    deposits: [
      { content: 'Cọc thuê phòng 101', date: '01/01/2024', amount: '1,500,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-24-0101-TE', period: '01/01/2024 - 01/01/2027', status: 'active' }
    ],
    recentActivities: [
      { icon: 'wallet', iconBg: 'bg-primary-container', time: '10 ngày trước', title: 'Thanh toán tiền thuê định kỳ tháng 05/2026' }
    ],
    importantNote: 'Tài khoản chính dùng để chạy demo các chức năng của khách hàng đang thuê phòng.'
  },
  {
    id: 'u-6',
    code: 'TE-00102',
    fullName: 'Nguyễn Văn Nam',
    full_name: 'Nguyễn Văn Nam (Khách mới)',
    email: 'newcustomer@gmail.com',
    phone: '0977889900',
    avatar: avatarNewCustomer,
    status: 'active',
    tier: 'New',
    joinDate: '01/06/2026',
    created_at: '2026-06-01T00:00:00Z',
    personalInfo: {
      cccd: '030099008765',
      phone: '0977889900',
      email: 'newcustomer@gmail.com',
      birthDate: '10/02/1999',
      nationality: 'Việt Nam',
      job: 'Học viên cao học',
      address: '234 Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2026-001', roomType: 'Phòng 102 (Nữ)', date: '01/06/2026', status: 'pending' },
      { id: 'REG-2026-002', roomType: 'Phòng 202 (Nữ)', date: '02/06/2026', status: 'pending' }
    ],
    viewings: [
      { roomName: 'Phòng 102 (Nữ)', branch: 'Chi nhánh Quận 1', date: '2026-06-15', staffName: 'NV. Nguyễn Thị Trúc Hằng', status: 'confirmed' },
      { roomName: 'Phòng 202 (Nữ)', branch: 'Chi nhánh Thủ Đức (Khu ĐHQG)', date: '2026-06-20', staffName: 'NV. Quốc Bảo', status: 'confirmed' }
    ],
    deposits: [],
    contracts: [],
    recentActivities: [
      { icon: 'calendar', iconBg: 'bg-tertiary', time: '2 ngày trước', title: 'Đặt lịch hẹn xem phòng 102 và 202' }
    ],
    importantNote: 'Tài khoản chính dùng để chạy demo các chức năng của khách mới chưa thuê.'
  },
  {
    id: '23',
    code: 'TE-77023',
    fullName: 'Vũ Minh Triết',
    full_name: 'Vũ Minh Triết',
    email: 'trietvu.design@gmail.com',
    phone: '0908112244',
    avatar: avatarAdmin,
    status: 'active',
    tier: 'Loyal',
    joinDate: '10/01/2025',
    created_at: '2025-01-10T00:00:00Z',
    personalInfo: {
      cccd: '001095009988',
      phone: '0908112244',
      email: 'trietvu.design@gmail.com',
      birthDate: '12/12/1995',
      nationality: 'Việt Nam',
      job: 'UI/UX Designer',
      address: '45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2025-009', roomType: 'Studio Standard', date: '11/01/2025', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc thuê phòng Studio', date: '11/01/2025', amount: '5,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-25-0009-TE', period: '15/01/2025 - 15/01/2026', status: 'active' }
    ],
    recentActivities: [
      { icon: 'edit', iconBg: 'bg-primary', time: '2 tuần trước', title: 'Yêu cầu hỗ trợ thay vòi nước bị rò rỉ' }
    ],
    importantNote: 'Thích tự bài trí nội thất phòng, yêu cầu giữ nguyên hiện trạng ban đầu.'
  },
  {
    id: '24',
    code: 'TE-88024',
    fullName: 'Hoàng Thị Thanh Vân',
    full_name: 'Hoàng Thị Thanh Vân',
    email: 'vanhoang.dentist@gmail.com',
    phone: '0938556677',
    avatar: avatarManager,
    status: 'active',
    tier: 'VIP',
    joinDate: '20/11/2023',
    created_at: '2023-11-20T00:00:00Z',
    personalInfo: {
      cccd: '003192004567',
      phone: '0938556677',
      email: 'vanhoang.dentist@gmail.com',
      birthDate: '05/05/1992',
      nationality: 'Việt Nam',
      job: 'Bác sĩ Nha khoa',
      address: '180 Phan Xích Long, Phú Nhuận, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2023-552', roomType: 'Studio Deluxe', date: '21/11/2023', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Cọc giữ chỗ Studio Deluxe', date: '21/11/2023', amount: '6,000,000 VNĐ', status: 'approved' }
    ],
    contracts: [
      { id: 'HĐ-23-0552-TE', period: '01/12/2023 - 01/12/2026', status: 'active' }
    ],
    recentActivities: [
      { icon: 'wallet', iconBg: 'bg-primary-container', time: '12 ngày trước', title: 'Thanh toán hóa đơn tháng 05/2026' }
    ],
    importantNote: 'Khách VIP ở chi nhánh Phú Nhuận. Yêu cầu dịch vụ giặt là 2 lần/tuần.'
  },
  {
    id: '25',
    code: 'TE-99025',
    fullName: 'Đỗ Hữu Phước',
    full_name: 'Đỗ Hữu Phước',
    email: 'phuocdo.dev@gmail.com',
    phone: '0909332211',
    avatar: avatarSale,
    status: 'inactive',
    tier: 'Old',
    joinDate: '15/02/2024',
    created_at: '2024-02-15T00:00:00Z',
    personalInfo: {
      cccd: '001091002345',
      phone: '0909332211',
      email: 'phuocdo.dev@gmail.com',
      birthDate: '18/07/1991',
      nationality: 'Việt Nam',
      job: 'Android Developer',
      address: '42 Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh'
    },
    registrations: [
      { id: 'REG-2024-082', roomType: 'Standard Room Single', date: '16/02/2024', status: 'completed' }
    ],
    viewings: [],
    deposits: [
      { content: 'Hoàn trả cọc dọn dẹp', date: '15/02/2025', amount: '4,000,000 VNĐ', status: 'refunded' }
    ],
    contracts: [
      { id: 'HĐ-24-0082-TE', period: '01/03/2024 - 01/03/2025', status: 'expired' }
    ],
    recentActivities: [
      { icon: 'file', iconBg: 'bg-primary', time: '15/02/2025', title: 'Hoàn trả cọc và thanh lý hợp đồng đúng kỳ hạn' }
    ],
    importantNote: 'Khách đã trả phòng sạch sẽ đúng cam kết. Rất hài lòng với dịch vụ homestay.'
  }
];
