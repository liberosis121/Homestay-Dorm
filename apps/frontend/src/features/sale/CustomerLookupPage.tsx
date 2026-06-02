import { useState, useEffect } from 'react';
import { 
  Search, Users, RefreshCw, HelpCircle, AlertTriangle, Info, Edit, Check 
} from 'lucide-react';
import CustomerProfileCard, { Customer } from './components/CustomerProfileCard';
import CustomerTabs from './components/CustomerTabs';
import CustomerTimeline from './components/CustomerTimeline';

// ─── 15 MOCK CUSTOMERS DATA ──────────────────────────────────────────────────
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    code: 'TE-99201',
    fullName: 'Nguyễn Hoàng Nam',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'Loyal',
    joinDate: '15/05/2022',
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
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'New',
    joinDate: '10/05/2026',
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
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150',
    status: 'inactive',
    tier: 'Old',
    joinDate: '12/02/2023',
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
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'VIP',
    joinDate: '01/09/2021',
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
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'New',
    joinDate: '25/05/2026',
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
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'Loyal',
    joinDate: '20/10/2022',
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
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150',
    status: 'inactive',
    tier: 'Old',
    joinDate: '01/01/2024',
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
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'New',
    joinDate: '28/05/2026',
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
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'VIP',
    joinDate: '15/06/2022',
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
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150',
    status: 'inactive',
    tier: 'Old',
    joinDate: '10/05/2024',
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
    avatar: 'https://images.unsplash.com/photo-1558203728-00f45181dd84?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'New',
    joinDate: '27/05/2026',
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
    avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'Loyal',
    joinDate: '15/01/2023',
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
    avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'New',
    joinDate: '29/05/2026',
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
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&h=150',
    status: 'inactive',
    tier: 'Old',
    joinDate: '10/03/2024',
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
    avatar: 'https://images.unsplash.com/photo-1534751516642-a131ffd103fd?auto=format&fit=crop&w=150&h=150',
    status: 'active',
    tier: 'VIP',
    joinDate: '10/10/2021',
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
  }
];

export default function CustomerLookupPage() {
  // Trạng thái Form Tìm kiếm
  const [searchName, setSearchName] = useState('');
  const [searchID, setSearchID] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  // Quản lý Trạng thái UI
  const [uiState, setUiState] = useState<'initial' | 'loading' | 'empty' | 'error' | 'success'>('initial');
  
  // Dữ liệu kết quả
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Quản lý ghi chú quan trọng
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Đồng bộ nội dung ghi chú khi chuyển đổi khách hàng hoạt động
  useEffect(() => {
    if (activeCustomer) {
      setNoteContent(activeCustomer.importantNote);
      setIsEditingNote(false);
    }
  }, [activeCustomer]);

  // Giả lập thực hiện tìm kiếm
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Dọn dẹp kết quả cũ
    setActiveCustomer(null);
    setSearchResults([]);

    // Kiểm tra xem có trường thông tin nào được điền không
    const hasName = searchName.trim().length > 0;
    const hasID = searchID.trim().length > 0;
    const hasPhone = searchPhone.trim().length > 0;
    const hasEmail = searchEmail.trim().length > 0;

    if (!hasName && !hasID && !hasPhone && !hasEmail) {
      // Nếu không nhập gì, hiển thị toàn bộ khách hàng
      setUiState('loading');
      setTimeout(() => {
        setSearchResults(MOCK_CUSTOMERS);
        setActiveCustomer(MOCK_CUSTOMERS[0]);
        setUiState('success');
      }, 800);
      return;
    }

    // Kiểm tra giả lập Trạng thái LỖI (gõ chữ "lỗi" hoặc "error" ở bất cứ trường nào)
    const isErrorTriggered = 
      searchName.toLowerCase().includes('lỗi') || 
      searchID.toLowerCase().includes('lỗi') || 
      searchPhone.toLowerCase().includes('lỗi') || 
      searchEmail.toLowerCase().includes('lỗi') ||
      searchName.toLowerCase().includes('error');

    setUiState('loading');

    setTimeout(() => {
      if (isErrorTriggered) {
        setUiState('error');
        return;
      }

      // Lọc dữ liệu tìm kiếm
      const filtered = MOCK_CUSTOMERS.filter(customer => {
        let match = true;

        if (hasName) {
          match = match && customer.fullName.toLowerCase().includes(searchName.trim().toLowerCase());
        }
        if (hasID) {
          match = match && customer.personalInfo.cccd.includes(searchID.trim());
        }
        if (hasPhone) {
          match = match && customer.personalInfo.phone.replace(/\s+/g, '').includes(searchPhone.trim().replace(/\s+/g, ''));
        }
        if (hasEmail) {
          match = match && customer.personalInfo.email.toLowerCase().includes(searchEmail.trim().toLowerCase());
        }

        return match;
      });

      if (filtered.length === 0) {
        setUiState('empty');
      } else {
        setSearchResults(filtered);
        setActiveCustomer(filtered[0]); // Mặc định hiển thị khách hàng đầu tiên
        setUiState('success');
      }
    }, 800);
  };

  // Nút Thử lại khi gặp Error State
  const handleRetry = () => {
    // Xóa từ khóa lỗi để tránh lặp vô tận
    setSearchName('');
    setSearchID('');
    setSearchPhone('');
    setSearchEmail('');
    setUiState('initial');
  };

  // Cập nhật ghi chú quan trọng
  const handleSaveNote = () => {
    if (activeCustomer) {
      activeCustomer.importantNote = noteContent;
      setIsEditingNote(false);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Lexend', sans-serif" }}>
      
      {/* ── Tiêu đề & Giới thiệu ───────────────────────────────────────────── */}
      <section className="animate-fade-in-up">
        <h2 className="text-2xl font-bold text-[#6f583c] flex items-center gap-2.5">
          <Users className="w-6 h-6 text-[#6f583c]" />
          Tra cứu hồ sơ khách hàng
        </h2>
        <p className="text-sm text-[#4e453c] mt-1 font-body-md">
          Nhập thông tin cá nhân của khách hàng để truy xuất thông tin lịch sử thuê, cọc, lịch xem phòng và hợp đồng.
        </p>
      </section>

      {/* ── Form Tìm kiếm Nâng cao ───────────────────────────────────────────── */}
      <section className="bg-white p-6 rounded-24 border border-[#d1c4b9] shadow-sm animate-fade-in-up">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-5 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#7f756b] uppercase tracking-wider">Họ và tên khách hàng</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Hoàng Nam"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] placeholder-[#7f756b]/50 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#7f756b] uppercase tracking-wider">Số CCCD / Hộ chiếu</label>
              <input
                type="text"
                value={searchID}
                onChange={(e) => setSearchID(e.target.value)}
                placeholder="001xxxxxxxxx"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] placeholder-[#7f756b]/50 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#7f756b] uppercase tracking-wider">Số điện thoại</label>
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="0902xxxxxx"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] placeholder-[#7f756b]/50 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#7f756b] uppercase tracking-wider">Địa chỉ Email</label>
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#d1c4b9] bg-[#fff8f3]/25 focus:border-[#6f583c] focus:ring-1 focus:ring-[#6f583c] transition-all outline-none text-[#1e1b17] placeholder-[#7f756b]/50 font-semibold"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full lg:w-auto h-[44px] px-8 bg-[#6f583c] hover:bg-[#6f583c]/90 text-white font-semibold text-sm rounded-xl hover:shadow-lg hover:shadow-[#6f583c]/10 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            Tìm kiếm khách hàng
          </button>
        </form>
      </section>

      {/* ── Khu vực Nội dung động (Dynamic Canvas Area) ────────────────────────── */}
      <div className="min-h-[400px] relative">
        
        {/* 1. INITIAL STATE */}
        {uiState === 'initial' && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-24 border border-[#d1c4b9] shadow-sm animate-fade-in-up">
            <div className="w-24 h-24 bg-[#faf2ec] border border-[#6f583c]/10 rounded-full flex items-center justify-center mb-5 shrink-0 text-[#6f583c]">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-[#6f583c] mb-2">Hệ thống tra cứu sẵn sàng</h3>
            <p className="text-sm text-[#7f756b] max-w-md font-body-md leading-relaxed px-4">
              Nhập tên, số điện thoại, CCCD hoặc email ở thanh tìm kiếm phía trên để truy xuất dữ liệu hồ sơ khách hàng.
            </p>
          </div>
        )}

        {/* 2. LOADING STATE (Skeleton Screens) */}
        {uiState === 'loading' && (
          <div className="space-y-6">
            {/* Header profile skeleton */}
            <div className="bg-white p-6 rounded-24 border border-[#d1c4b9] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-16 h-16 rounded-full bg-[#eee7e1] animate-pulse shrink-0" />
                <div className="space-y-2 flex-1 sm:flex-none">
                  <div className="h-5 w-44 bg-[#eee7e1] animate-pulse rounded" />
                  <div className="h-3 w-64 bg-[#eee7e1] animate-pulse rounded" />
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="h-9 w-28 bg-[#eee7e1] animate-pulse rounded-xl" />
                <div className="h-9 w-28 bg-[#eee7e1] animate-pulse rounded-xl" />
              </div>
            </div>

            {/* Bottom grids skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <div className="h-8 w-80 bg-[#eee7e1] animate-pulse rounded" />
                <div className="h-72 bg-white rounded-24 border border-[#d1c4b9] p-6 space-y-4">
                  <div className="h-4 w-1/3 bg-[#eee7e1] animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-[#eee7e1] animate-pulse rounded" />
                  <div className="h-4 w-full bg-[#eee7e1] animate-pulse rounded" />
                  <div className="h-4 w-5/6 bg-[#eee7e1] animate-pulse rounded" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-white rounded-24 border border-[#d1c4b9] p-6 space-y-4">
                  <div className="h-5 w-1/2 bg-[#eee7e1] animate-pulse rounded" />
                  <div className="space-y-3 pt-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#eee7e1] animate-pulse shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-16 bg-[#eee7e1] animate-pulse rounded" />
                          <div className="h-3 w-32 bg-[#eee7e1] animate-pulse rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. EMPTY / NOT FOUND STATE */}
        {uiState === 'empty' && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-24 border border-[#d1c4b9] shadow-sm animate-fade-in-up">
            <div className="w-20 h-20 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mb-5 shrink-0">
              <HelpCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-[#1e1b17] mb-2">Không tìm thấy khách hàng</h3>
            <p className="text-sm text-[#7f756b] max-w-md font-body-md leading-relaxed px-4">
              Chúng tôi không tìm thấy bất kỳ khách hàng nào trùng khớp với từ khóa tìm kiếm. Vui lòng kiểm tra lại độ chính xác hoặc dùng bộ lọc khác.
            </p>
          </div>
        )}

        {/* 4. ERROR STATE */}
        {uiState === 'error' && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-24 border border-[#ba1a1a]/30 shadow-sm border-2 animate-fade-in-up">
            <div className="w-16 h-16 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mb-4 shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#ba1a1a] mb-2">Đã xảy ra lỗi kết nối</h3>
            <p className="text-sm text-[#7f756b] max-w-md font-body-md leading-relaxed mb-6 px-4">
              Lỗi giả lập máy chủ dữ liệu trung tâm không phản hồi hoặc hết thời gian yêu cầu. Vui lòng thử lại.
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 bg-[#ba1a1a] hover:bg-[#ba1a1a]/95 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 duration-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 animate-spin-once" />
              Thử lại kết nối
            </button>
          </div>
        )}

        {/* 5. RESULT SUCCESS STATE */}
        {uiState === 'success' && activeCustomer && (
          <div className="space-y-6">
            
            {/* Nếu tìm thấy nhiều kết quả trùng khớp (Premium Addition) */}
            {searchResults.length > 1 && (
              <div className="bg-[#faf2ec] p-4 rounded-xl border border-[#d1c4b9] flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in-up">
                <div className="flex items-center gap-2.5">
                  <Info className="w-5 h-5 text-[#6f583c] shrink-0" />
                  <p className="text-xs font-semibold text-[#4e453c]">
                    Tìm thấy <span className="font-bold text-[#6f583c]">{searchResults.length}</span> kết quả phù hợp. Đang xem hồ sơ của <span className="font-bold text-[#6f583c]">{activeCustomer.fullName}</span>:
                  </p>
                </div>
                <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide shrink-0">
                  {searchResults.map(cust => (
                    <button
                      key={cust.id}
                      onClick={() => setActiveCustomer(cust)}
                      className={`px-3 py-1 text-xs rounded-lg font-bold border transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-150 ${
                        activeCustomer.id === cust.id
                          ? 'bg-[#6f583c] text-white border-[#6f583c]'
                          : 'bg-white text-[#4e453c] border-[#d1c4b9] hover:bg-[#fff8f3]'
                      }`}
                    >
                      {cust.fullName} ({cust.code})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Summary Header Card */}
            <CustomerProfileCard 
              customer={activeCustomer} 
              onActionEmail={() => alert(`Đã gửi email liên hệ thành công tới: ${activeCustomer.personalInfo.email}`)}
              onActionAppointment={() => alert(`Chuyển hướng đến màn hình tạo lịch hẹn xem phòng cho khách hàng: ${activeCustomer.fullName}`)}
            />

            {/* Bottom Contents Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              
              {/* Left & Middle Column: Detailed Tabs */}
              <div className="xl:col-span-2 space-y-6">
                <CustomerTabs customer={activeCustomer} />
              </div>

              {/* Right Column: Activities Timeline & Important Sticky Notes */}
              <div className="space-y-6">
                
                {/* Hoạt động gần đây */}
                <div className="bg-white p-6 rounded-24 border border-[#d1c4b9] shadow-sm">
                  <h4 className="font-bold text-[#6f583c] text-sm tracking-wider uppercase mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>history</span>
                    Hoạt động gần đây
                  </h4>
                  <CustomerTimeline activities={activeCustomer.recentActivities} />
                </div>

                {/* Ghi chú quan trọng (Interactive Note) */}
                <div className="bg-[#faf2ec] p-6 rounded-24 border border-[#d1c4b9] shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-[#6f583c] text-sm tracking-wider uppercase flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>lightbulb</span>
                      Ghi chú quan trọng
                    </h4>
                    {!isEditingNote ? (
                      <button
                        onClick={() => setIsEditingNote(true)}
                        className="text-[#6f583c] hover:text-[#4d614b] p-1 rounded-full hover:bg-white/50 transition-colors cursor-pointer"
                        title="Sửa ghi chú"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveNote}
                        className="text-[#4d614b] hover:text-[#384c37] p-1 rounded-full bg-white shadow-sm border border-[#d1c4b9]/50 transition-colors cursor-pointer"
                        title="Lưu ghi chú"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {isEditingNote ? (
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={4}
                      className="w-full p-3 text-sm border border-[#d1c4b9] bg-white rounded-xl focus:ring-1 focus:ring-[#6f583c] focus:border-[#6f583c] outline-none text-[#1e1b17] font-medium leading-relaxed resize-none"
                    />
                  ) : (
                    <p className="text-sm text-[#4e453c] leading-relaxed font-semibold italic">
                      "{activeCustomer.importantNote || 'Không có ghi chú nào đặc biệt.'}"
                    </p>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
