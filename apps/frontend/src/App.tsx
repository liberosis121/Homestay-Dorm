import { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Folder, 
  Users, User,
  CreditCard, 
  Layers, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Database, 
  Building, 
  CheckCircle, 
  Calendar, 
  FileText,
  Plus, 
  Search, 
  Bell,
  Compass,
  ClipboardList,
  Activity,
  Zap
} from 'lucide-react';
import { initializeMockDB, getMockDB, saveMockDB, Room } from './lib/supabaseClient';
import { useAuthStore } from './stores/authStore';
import LandingPage from './features/landing/LandingPage';
import LoginPage from './features/auth/LoginPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import OTPVerificationPage from './features/auth/OTPVerificationPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import ProfilePage from './features/customer/ProfilePage';
import StaffProfilePage from './features/staff/StaffProfilePage';
import RoomsPage from './features/rooms/RoomsPage';
import RoomDetailPage from './features/rooms/RoomDetailPage';
import { RegisterLeasePage } from './features/customer/RegisterLeasePage';
import { GroupRegistrationPage } from './features/customer/GroupRegistrationPage';
import DepositRegistrationPage from './features/customer/DepositRegistrationPage';
import ViewingSchedulePage from './features/customer/ViewingSchedulePage';
import CustomerContractsPage from './features/customer/CustomerContractsPage';
import CustomerServicesPage from './features/customer/CustomerServicesPage';
import InvoicesDashboardPage from './features/customer/InvoicesDashboardPage';
import InvoicePaymentPage from './features/customer/InvoicePaymentPage';
import CustomerCheckoutPage from './features/customer/CustomerCheckoutPage';

import SaleDashboardPage from './features/sale/SaleDashboardPage';
import SaleSchedulesPage from './features/sale/SaleSchedulesPage';
import CustomerLookupPage from './features/sale/CustomerLookupPage';
import SaleContractsPage from './features/sale/SaleContractsPage';
import AdminUsersPage from './features/admin/AdminUsersPage';
import AdminEmployeesPage from './features/admin/AdminEmployeesPage';
import AdminBranchesPage from './features/admin/AdminBranchesPage';
import AdminRoomsPage from './features/admin/AdminRoomsPage';
import AdminServicesPage from './features/admin/AdminServicesPage';
import AdminConditionsPage from './features/admin/AdminConditionsPage';
import AdminAssetsPage from './features/admin/AdminAssetsPage';
import AdminBackupPage from './features/admin/AdminBackupPage';
import AdminDashboardPage from './features/admin/AdminDashboardPage';
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ConfirmLogoutModal from './components/ui/ConfirmLogoutModal';

// App Wrapper to handle initialization
export default function App() {
  useEffect(() => {
    initializeMockDB();
  }, []);

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

function AppRoutes() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <Routes>
        <Route path="/" element={!user || user.role === 'customer' ? <LandingPage /> : <DashboardLayout />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/" replace />} />
        <Route path="/verify-otp" element={!user ? <OTPVerificationPage /> : <Navigate to="/" replace />} />
        <Route path="/reset-password" element={!user ? <ResetPasswordPage /> : <Navigate to="/" replace />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/customer/rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="/customer/services" element={<CustomerServicesPage />} />
        <Route 
          path="/profile/*" 
          element={user ? (user.role === 'customer' ? <CustomerLayout /> : <DashboardLayout />) : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/*" 
          element={user ? (user.role === 'customer' ? <CustomerLayout /> : <DashboardLayout />) : <Navigate to="/login" replace />} 
        />
      </Routes>
      <ConfirmLogoutModal />
    </>
  );
}

// ----------------------------------------------------
// CUSTOMER LAYOUT (Public Header + Customer Content)
// ----------------------------------------------------
function CustomerLayout() {
  const { user } = useAuthStore();
  
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      {/* Unified Top NavBar */}
      <Navbar />

      <main className="flex-1 bg-background pt-24 pb-16">
        <Routes>
          <Route path="/" element={<ProfilePage />} />
          <Route path="/customer/register-lease" element={<RegisterLeasePage />} />
          <Route path="/customer/register-group" element={<GroupRegistrationPage />} />
          <Route path="/customer/deposit" element={<DepositRegistrationPage />} />
          <Route path="/customer/viewing-schedules" element={<ViewingSchedulePage />} />
          <Route path="/customer/contracts" element={<CustomerContractsPage />} />
          <Route path="/customer/invoices" element={<InvoicesDashboardPage />} />
          <Route path="/customer/payment/:invoiceId" element={<InvoicePaymentPage />} />
          <Route path="/customer/checkout-request" element={<CustomerCheckoutPage />} />
          <Route path="*" element={<ProfilePage />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

// ----------------------------------------------------
// SIDEBAR & HEADER MAIN DASHBOARD LAYOUT
// ----------------------------------------------------
function DashboardLayout() {
  const { user, setLogoutConfirmOpen } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Sidebar Menu Items based on User Role
  const getMenuItems = () => {
    switch (user.role) {
      case 'admin':
        return [
          { path: '/', label: 'Tổng quan hệ thống', icon: Home },
          { path: '/admin/users', label: 'Quản trị Khách hàng', icon: Users },
          { path: '/admin/employees', label: 'Quản trị Nhân viên', icon: User },
          { path: '/admin/branches', label: 'Quản trị Chi nhánh', icon: Building },
          { path: '/admin/rooms-catalog', label: 'Danh mục Phòng/Giường', icon: Layers },
          { path: '/admin/services', label: 'Danh mục Dịch vụ', icon: Folder },
          { path: '/admin/conditions', label: 'Điều kiện lưu trú', icon: ClipboardList },
          { path: '/admin/assets', label: 'Tài sản dùng chung', icon: Settings },
          { path: '/admin/backup', label: 'Sao lưu & Khôi phục', icon: Database }
        ];
      case 'manager':
        return [
          { path: '/', label: 'Bàn vận hành', icon: Home },
          { path: '/manager/rooms', label: 'Bản đồ phòng (Floor Map)', icon: Layers },
          { path: '/manager/deposits', label: 'Kiểm duyệt đặt cọc', icon: ClipboardList },
          { path: '/manager/handovers', label: 'Biên bản bàn giao', icon: FileText },
          { path: '/manager/assets', label: 'Quản lý Tài sản', icon: Settings },
          { path: '/sale/customers', label: 'Tra cứu hồ sơ khách', icon: Search },
          { path: '/profile', label: 'Hồ sơ cá nhân', icon: User }
        ];
      case 'sale':
        return [
          { path: '/sale/dashboard', label: 'Tổng quan', icon: Home },
          { path: '/sale/schedules', label: 'Lịch hẹn xem phòng', icon: Calendar },
          { path: '/sale/contracts', label: 'Lập hợp đồng thuê', icon: FileText },
          { path: '/sale/customers', label: 'Tra cứu hồ sơ khách', icon: Search },
          { path: '/profile', label: 'Hồ sơ cá nhân', icon: User }
        ];
      case 'accountant':
        return [
          { path: '/', label: 'Bàn làm việc Kế toán', icon: Home },
          { path: '/accountant/invoices', label: 'Quản lý Hóa đơn', icon: CreditCard },
          { path: '/accountant/refunds', label: 'Đối soát hoàn cọc', icon: FileText },
          { path: '/accountant/payouts', label: 'Xử lý thanh lý', icon: CheckCircle },
          { path: '/sale/customers', label: 'Tra cứu hồ sơ khách', icon: Search },
          { path: '/profile', label: 'Hồ sơ cá nhân', icon: User }
        ];
      case 'customer':
        return [
          { path: '/profile', label: 'Hồ sơ cá nhân', icon: Users },
          { path: '/rooms', label: 'Tra cứu & Thuê phòng', icon: Compass },
          { path: '/customer/services', label: user.renting_room_name ? 'Dịch vụ của tôi' : 'Dịch vụ & Bảng giá', icon: Zap },
          { path: '/customer/schedules', label: 'Lịch xem phòng của tôi', icon: Calendar },
          { path: '/customer/contracts', label: 'Hợp đồng của tôi', icon: FileText },
          { path: '/customer/invoices', label: 'Hóa đơn & Thanh toán', icon: CreditCard },
          { path: '/customer/checkout-request', label: 'Đăng ký trả phòng', icon: ClipboardList }
        ];
      default:
        return [];
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'admin': return { text: 'Quản trị viên', bg: 'bg-primary-container text-on-primary-container border-primary/20' };
      case 'manager': return { text: 'Quản lý chi nhánh', bg: 'bg-primary-fixed-dim/20 text-primary border-primary/20' };
      case 'sale': return { text: 'Nhân viên Sale', bg: 'bg-secondary-container text-on-secondary-container border-secondary/20' };
      case 'accountant': return { text: 'Kế toán', bg: 'bg-tertiary-container text-on-tertiary-container border-tertiary/20' };
      case 'customer': return { text: 'Khách thuê', bg: 'bg-error-container text-on-error-container border-error/20' };
    }
  };

  const roleTheme = getRoleLabel();
  const menuItems = getMenuItems();

  const getSidebarSubtitle = () => {
    switch (user.role) {
      case 'sale': return 'PHÂN HỆ NHÂN VIÊN SALE';
      case 'manager': return 'PHÂN HỆ QUẢN LÝ CHI NHÁNH';
      case 'accountant': return 'PHÂN HỆ KẾ TOÁN';
      case 'admin': return 'PHÂN HỆ QUẢN TRỊ VIÊN';
      default: return 'PHÂN HỆ QUẢN LÝ';
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f3] text-[#1e1b17] flex relative font-body-md selection:bg-[#6f583c]/20 selection:text-[#6f583c]">
      
      {/* ----------------------------------------------------
          SIDEBAR (Desktop)
         ---------------------------------------------------- */}
      <aside className="w-64 bg-[#faf2ec] border-r border-[#d1c4b9] hidden md:flex flex-col flex-shrink-0 relative z-30 shadow-lg shadow-[#6f583c]/5">
        <div className="p-6 border-b border-[#d1c4b9] flex items-center gap-3">
          <div className="p-2 bg-[#4a6549]/10 rounded-xl text-[#4a6549] border border-[#4a6549]/20 flex items-center justify-center shrink-0">
            <span 
              className="material-symbols-outlined text-xl" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              eco
            </span>
          </div>
          <div>
            <h2 className="font-display-lg text-base tracking-tight text-[#4a6549] font-bold">HOMESTAY DORM</h2>
            <span className="text-[10px] text-[#4a6549] font-bold tracking-wider uppercase">{getSidebarSubtitle()}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-24 text-sm font-label-md transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#6f583c] text-white shadow-md shadow-[#6f583c]/20' 
                    : 'text-[#4e453c] hover:bg-[#fff8f3] hover:text-[#1e1b17]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#7f756b]'}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="h-px bg-[#d1c4b9] my-4 mx-2"></div>

          <button
            onClick={() => setLogoutConfirmOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-24 text-sm font-label-md text-error hover:bg-error/10 transition-all cursor-pointer text-left"
          >
            <LogOut className="w-5 h-5 text-error" />
            Đăng xuất
          </button>
        </nav>
      </aside>

      {/* ----------------------------------------------------
          MOBILE MENU
         ---------------------------------------------------- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden">
          <div className="w-64 bg-[#faf2ec] h-full border-r border-[#d1c4b9] flex flex-col">
            <div className="p-6 border-b border-[#d1c4b9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className="material-symbols-outlined text-[#4a6549] text-xl" 
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  eco
                </span>
                <span className="font-extrabold text-sm text-[#4a6549]">HOMESTAY DORM</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-[#7f756b] hover:text-[#6f583c]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-[#6f583c]/10 text-[#6f583c] border-l-2 border-[#6f583c]' 
                        : 'text-[#4e453c] hover:bg-[#fff8f3] hover:text-[#1e1b17]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="h-px bg-[#d1c4b9] my-4 mx-2"></div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLogoutConfirmOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-all cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-error" />
                Đăng xuất
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MAIN CONTENT CONTAINER
         ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#fff8f3]">
        
        {/* HEADER */}
        <header className="h-20 border-b border-[#d1c4b9] flex items-center justify-between px-6 bg-white/80 backdrop-blur-xl relative z-20 transition-all">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="text-[#4e453c] hover:text-[#6f583c] md:hidden cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Branch display for Managers/Sales */}
            <div className="hidden sm:flex items-center gap-2 text-sm font-label-md text-[#4e453c] bg-[#faf2ec] px-4 py-2 rounded-24 border border-[#d1c4b9]">
              <Building className="w-4 h-4 text-[#6f583c]" />
              <span>{user.role === 'customer' ? 'Khu vực thuê: TP.HCM' : 'Chi nhánh làm việc: Quận 1'}</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-[#4e453c] hover:text-[#6f583c] transition-colors bg-[#faf2ec] rounded-full hover:bg-[#f4ede6] cursor-pointer flex items-center justify-center"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-[#d1c4b9] rounded-2xl shadow-xl overflow-hidden flex flex-col z-50 animate-fade-in-up">
                  <div className="p-4 border-b border-[#d1c4b9] bg-[#faf2ec] flex justify-between items-center">
                    <h4 className="text-xs font-bold text-[#1e1b17] uppercase tracking-wider">Thông báo hoạt động</h4>
                    <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3 mới</span>
                  </div>
                  
                  <div className="p-2 max-h-64 overflow-y-auto divide-y divide-[#eee7e1] bg-white">
                    <div className="p-3 hover:bg-[#faf2ec] rounded-xl cursor-pointer transition-colors text-left" onClick={() => setNotificationsOpen(false)}>
                      <p className="text-sm font-semibold text-[#1e1b17]">Lịch hẹn mới chờ duyệt</p>
                      <p className="text-xs text-[#4e453c] mt-0.5">Khách hàng Nguyễn Văn A vừa đặt lịch xem phòng vào 09:30 hôm nay.</p>
                      <p className="text-[10px] text-[#6f583c] mt-1">5 phút trước</p>
                    </div>
                    <div className="p-3 hover:bg-[#faf2ec] rounded-xl cursor-pointer transition-colors text-left" onClick={() => setNotificationsOpen(false)}>
                      <p className="text-sm font-semibold text-[#1e1b17]">Hợp đồng đã kích hoạt</p>
                      <p className="text-xs text-[#4e453c] mt-0.5">Hợp đồng thuê phòng Studio A của Trần Minh Tuấn đã ký số thành công.</p>
                      <p className="text-[10px] text-[#6f583c] mt-1">1 giờ trước</p>
                    </div>
                    <div className="p-3 hover:bg-[#faf2ec] rounded-xl cursor-pointer transition-colors text-left" onClick={() => setNotificationsOpen(false)}>
                      <p className="text-sm font-semibold text-[#1e1b17]">Hệ thống bảo trì</p>
                      <p className="text-xs text-[#4e453c] mt-0.5">Sao lưu dữ liệu định kỳ tuần 23 hoàn tất tự động vào hệ thống.</p>
                      <p className="text-[10px] text-[#6f583c] mt-1">08:00 AM</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown for Header Avatar */}
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-[#6f583c]/15 hover:bg-[#6f583c] hover:text-white text-[#6f583c] border border-[#6f583c]/10 flex items-center justify-center text-sm font-headline-md transition-all shadow-sm hover:shadow cursor-pointer"
              >
                {user.full_name.charAt(0)}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white border border-[#d1c4b9] rounded-2xl shadow-xl overflow-hidden flex flex-col z-50 animate-fade-in-up">
                  {/* User Info Header */}
                  <div className="p-4 border-b border-[#d1c4b9] bg-[#faf2ec]">
                    <p className="font-bold text-[#1e1b17] truncate">{user.full_name}</p>
                    <p className="text-xs text-[#4e453c] truncate">{user.email}</p>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border mt-2 font-bold tracking-wide ${roleTheme.bg}`}>
                      {roleTheme.text}
                    </span>
                  </div>

                  {/* Profile & Logout Links */}
                  <div className="p-2 bg-white">
                    {user.role !== 'admin' && (
                      <Link 
                        to="/profile" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-[#1e1b17] font-label-md hover:bg-[#faf2ec] rounded-xl transition-colors cursor-pointer"
                      >
                        <User className="w-5 h-5 text-[#6f583c]" />
                        Hồ sơ cá nhân
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        setLogoutConfirmOpen(true);
                        setProfileDropdownOpen(false);
                      }} 
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-error font-label-md hover:bg-error/10 rounded-xl transition-colors cursor-pointer mt-1 text-left"
                    >
                      <LogOut className="w-5 h-5 text-error" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE BODY */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={location.pathname === '/profile' ? (user.role === 'customer' ? <ProfilePage /> : <StaffProfilePage />) : <DashboardDispatcher />} />
            <Route path="/profile" element={user.role === 'customer' ? <ProfilePage /> : <StaffProfilePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            {user.role === 'manager' && <Route path="/manager/rooms" element={<ManagerFloorMapScreen />} />}
            {user.role === 'sale' && <Route path="/sale/dashboard" element={<SaleDashboardPage />} />}
            {user.role === 'sale' && <Route path="/sale/schedules" element={<SaleSchedulesPage />} />}
            {user.role === 'sale' && <Route path="/sale/contracts" element={<SaleContractsPage />} />}
            {user.role === 'accountant' && <Route path="/accountant/invoices" element={<AccountantInvoicesScreen />} />}
            {/* Admin Routes (UC25-UC32) */}
            {user.role === 'admin' && <Route path="/admin/users" element={<AdminUsersPage />} />}
            {user.role === 'admin' && <Route path="/admin/employees" element={<AdminEmployeesPage />} />}
            {user.role === 'admin' && <Route path="/admin/branches" element={<AdminBranchesPage />} />}
            {user.role === 'admin' && <Route path="/admin/rooms-catalog" element={<AdminRoomsPage />} />}
            {user.role === 'admin' && <Route path="/admin/services" element={<AdminServicesPage />} />}
            {user.role === 'admin' && <Route path="/admin/conditions" element={<AdminConditionsPage />} />}
            {user.role === 'admin' && <Route path="/admin/assets" element={<AdminAssetsPage />} />}
            {user.role === 'admin' && <Route path="/admin/backup" element={<AdminBackupPage />} />}
            {(user.role === 'sale' || user.role === 'manager' || user.role === 'accountant') && (
              <Route path="/sale/customers" element={<CustomerLookupPage />} />
            )}
            
            {/* Fallback route for unimplemented layout pages */}
            <Route path="*" element={<PlaceholderPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// DYNAMIC DASHBOARD INITIATORS
// ----------------------------------------------------
function DashboardDispatcher() {
  const { user } = useAuthStore();
  if (!user) return null;

  // Auto-redirect role-based dashboards
  if (user.role === 'sale') return <Navigate to="/sale/dashboard" replace />;
  if (user.role === 'admin') return <AdminDashboardPage />;

  const cards = [
    { title: 'Tỷ lệ phòng lấp đầy', val: '78%', desc: '+2.4% so với tháng trước', icon: Activity, color: 'text-primary bg-primary/10', border: 'border-primary/20' },
    { title: 'Hợp đồng hoạt động', val: '45', desc: '12 hợp đồng hết hạn tuần tới', icon: FileText, color: 'text-tertiary bg-tertiary/10', border: 'border-tertiary/20' },
    { title: 'Doanh thu cọc khả dụng', val: '45Mđ', desc: 'Có 3 cọc chưa được phê duyệt', icon: CreditCard, color: 'text-timber-accent bg-timber-accent/10', border: 'border-timber-accent/20' },
    { title: 'Phòng đang bảo trì', val: '3', desc: '2 phòng dự kiến sửa xong hôm nay', icon: Layers, color: 'text-error bg-error/10', border: 'border-error/20' }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Xin chào, {user.full_name}!</h1>
          <p className="font-body-lg text-on-surface-variant mt-2 max-w-2xl">
            Hệ thống ghi nhận phiên đăng nhập quyền <span className="font-bold text-primary">[{user.role.toUpperCase()}]</span>. Đây là bảng điều khiển và thống kê hoạt động của bạn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`bg-surface-container-lowest rounded-32 p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow border ${c.border}`}>
              <div className="flex justify-between items-start mb-6">
                <span className="font-label-md text-sm text-on-surface-variant uppercase tracking-wider">{c.title}</span>
                <div className={`p-3 rounded-24 ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="font-display-lg text-4xl text-on-surface mb-2">{c.val}</div>
              <span className="font-body-md text-sm text-on-surface-variant">{c.desc}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-surface-container-low rounded-32 p-8 md:p-10 border border-surface-variant shadow-sm relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tertiary-fixed-dim/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary text-on-primary rounded-full">
              <span className="material-symbols-outlined text-sm">science</span>
            </div>
            <h3 className="font-headline-md text-2xl text-on-surface">Trình quản lý Phase 0 & Thử nghiệm Prototype</h3>
          </div>
          <p className="font-body-lg text-on-surface-variant leading-relaxed mb-8 max-w-3xl">
            Hệ thống hiện đang hoạt động ở chế độ <strong>Frontend-First (Mock Mode)</strong>. Tất cả dữ liệu bạn thao tác (chọn phòng đăng ký thuê, cập nhật trạng thái giường, tạo hóa đơn, hay chạy backup hệ thống) đều được lưu trữ trực tiếp ở Local Storage của trình duyệt này.
          </p>
          <div className="p-6 bg-surface-container-highest rounded-24 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-glass-stroke shadow-inner">
            <div>
              <h4 className="font-label-md text-base text-on-surface">Trải nghiệm Flow Đăng ký & Vận hành phòng:</h4>
              <p className="font-body-md text-sm text-on-surface-variant mt-1">Chuyển sang "Customer Mode" ở góc trên bên phải để vào trang Tìm kiếm & Đăng ký phòng mẫu.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link 
                to="/rooms" 
                className="px-6 py-3 bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container rounded-24 font-label-md text-sm transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 flex items-center gap-2 group cursor-pointer"
              >
                Trải nghiệm Thuê phòng
                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SCREEN: MANAGER - OCCUPANCY FLOOR MAP (UC24)
// ----------------------------------------------------
function ManagerFloorMapScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    const db = getMockDB();
    setRooms(db.rooms || []);
  }, []);

  const changeRoomStatus = (roomId: string, newStatus: Room['status']) => {
    const db = getMockDB();
    const updatedRooms = db.rooms.map((r: Room) => {
      if (r.id === roomId) {
        const u = { ...r, status: newStatus };
        if (selectedRoom?.id === roomId) setSelectedRoom(u);
        return u;
      }
      return r;
    });
    db.rooms = updatedRooms;
    saveMockDB(db);
    setRooms(updatedRooms);
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'deposited': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'occupied': return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'maintenance': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    }
  };

  const getStatusText = (status: Room['status']) => {
    switch (status) {
      case 'available': return 'Phòng trống';
      case 'deposited': return 'Đã đặt cọc';
      case 'occupied': return 'Đang ở';
      case 'maintenance': return 'Đang bảo trì';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Sơ đồ phòng (Floor Map)</h1>
        <p className="text-slate-400 text-sm mt-1">Quản trị trạng thái lưu trú và cơ sở vật chất phòng theo thời gian thực.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Rooms Grid */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-slate-300">Chi nhánh Quận 1 - Tầng 1 & Tầng 2</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {rooms.map((room) => {
              const statusClass = getStatusColor(room.status);
              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`border rounded-xl p-4 text-left transition-all ${statusClass} ${
                    selectedRoom?.id === room.id ? 'ring-2 ring-violet-500' : 'hover:scale-[1.02]'
                  }`}
                >
                  <span className="block text-xs font-semibold opacity-60">Tầng {room.floor}</span>
                  <span className="block font-black text-lg text-white my-1">{room.name}</span>
                  <span className="text-[10px] font-bold uppercase">{getStatusText(room.status)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Room Detail sidebar */}
        <div className="glass-card rounded-xl p-5 border border-slate-800/80">
          {selectedRoom ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-black text-white">{selectedRoom.name}</h3>
                <span className="text-xs text-slate-500">Mã phòng: {selectedRoom.id}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-850">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="font-semibold">{getStatusText(selectedRoom.status)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-850">
                  <span className="text-slate-500">Sức chứa:</span>
                  <span className="font-semibold text-slate-200">{selectedRoom.capacity} giường</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-850">
                  <span className="text-slate-500">Giới tính:</span>
                  <span className="font-semibold text-slate-200 uppercase">{selectedRoom.gender_type === 'male' ? 'Nam' : 'Nữ'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Đơn giá:</span>
                  <span className="font-bold text-violet-400">{selectedRoom.price.toLocaleString('vi-VN')}đ/tháng</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-4">
                <span className="block text-xs font-bold text-slate-400">Cập nhật nhanh trạng thái:</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['available', 'deposited', 'occupied', 'maintenance'] as Room['status'][]).map((status) => (
                    <button
                      key={status}
                      onClick={() => changeRoomStatus(selectedRoom.id, status)}
                      className={`py-2 px-3 border rounded-lg text-xs font-bold transition-all text-center ${
                        selectedRoom.status === status 
                          ? 'bg-violet-600 border-violet-500 text-white' 
                          : 'border-slate-800 bg-slate-900/50 hover:bg-slate-850 text-slate-400'
                      }`}
                    >
                      {getStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Layers className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <p className="text-sm">Click chọn một phòng trên sơ đồ để xem chi tiết & cập nhật trạng thái.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



// ----------------------------------------------------
// SCREEN: ACCOUNTANT - INVOICES DASHBOARD (UC15, UC16)
// ----------------------------------------------------
function AccountantInvoicesScreen() {
  const invoices = [
    { id: 'inv-8912', type: 'Đặt cọc', amount: '1,500,000đ', customer: 'Lê Lâm Trí Đức', date: '01/06/2026', status: 'Chưa thanh toán' },
    { id: 'inv-8911', type: 'Nhận phòng', amount: '3,200,000đ', customer: 'Nguyễn Văn Hải', date: '30/05/2026', status: 'Đã thanh toán' },
    { id: 'inv-8910', type: 'Định kỳ tháng 5', amount: '1,750,000đ', customer: 'Phạm Minh Khoa', date: '25/05/2026', status: 'Quá hạn' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Quản lý Hóa đơn & Thu phí</h1>
          <p className="text-slate-400 text-sm mt-1">Lập hóa đơn cọc, hóa đơn định kỳ dịch vụ điện nước và đối soát hoàn cọc.</p>
        </div>
        <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Tạo hóa đơn định kỳ
        </button>
      </div>

      <div className="glass-card rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-400">Danh sách hóa đơn gần đây</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-4">Mã hóa đơn</th>
                <th className="p-4">Loại hóa đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Số tiền</th>
                <th className="p-4">Hạn lập</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-900/20 transition-all">
                  <td className="p-4 font-mono font-bold text-violet-400">{inv.id}</td>
                  <td className="p-4">{inv.type}</td>
                  <td className="p-4 font-semibold text-slate-200">{inv.customer}</td>
                  <td className="p-4 font-black text-slate-200">{inv.amount}</td>
                  <td className="p-4">{inv.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      inv.status === 'Đã thanh toán' ? 'bg-emerald-500/10 text-emerald-400' :
                      inv.status === 'Chưa thanh toán' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold transition-colors">
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PLACEHOLDER PAGE FOR UNIMPLEMENTED MENU ITEMS
// ----------------------------------------------------
function PlaceholderPage() {
  const location = useLocation();
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6">
      <div className="p-4 bg-slate-900 rounded-2xl text-slate-500 border border-slate-850 mb-4">
        <Compass className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-extrabold text-white mb-2">Trang đang xây dựng</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-4">
        Đường dẫn `{location.pathname}` thuộc phạm vi các Phase tiếp theo. Giao diện này sẽ được bổ sung đầy đủ logic ở các bước tiếp theo.
      </p>
      <Link to="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors">
        Quay lại Trang chính
      </Link>
    </div>
  );
}
