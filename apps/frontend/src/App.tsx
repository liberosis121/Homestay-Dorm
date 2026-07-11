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
  Building, 
  CheckCircle, 
  Calendar, 
  FileText,
  Compass,
  ClipboardList,
  Activity,
  Zap,
  Receipt,
  ArrowLeftRight,
  LogIn,
  Search
} from 'lucide-react';
import { useAuthStore } from './stores/authStore';
import LandingPage from './features/landing/LandingPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import OTPVerificationPage from './features/auth/OTPVerificationPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import AuthCallbackPage from './features/auth/AuthCallbackPage';
import ProfilePage from './features/customer/ProfilePage';
import StaffProfilePage from './features/staff/StaffProfilePage';
import RoomsPage from './features/rooms/RoomsPage';
import RoomDetailPage from './features/rooms/RoomDetailPage';
import { RegisterLeasePage } from './features/customer/RegisterLeasePage';
import { GroupRegistrationPage } from './features/customer/GroupRegistrationPage';
import DepositRegistrationPage from './features/customer/DepositRegistrationPage';
import ViewingSchedulePage from './features/customer/ViewingSchedulePage';
import DepositHistoryPage from './features/customer/DepositHistoryPage';
import CustomerContractsPage from './features/customer/CustomerContractsPage';
import CustomerServicesPage from './features/customer/CustomerServicesPage';
import InvoicesDashboardPage from './features/customer/InvoicesDashboardPage';
import InvoicePaymentPage from './features/customer/InvoicePaymentPage';
import CustomerCheckoutPage from './features/customer/CustomerCheckoutPage';

import SaleDashboardPage from './features/sale/SaleDashboardPage';
import SaleSchedulesPage from './features/sale/SaleSchedulesPage';
import CustomerLookupPage from './features/sale/CustomerLookupPage';
import SaleContractsPage from './features/sale/SaleContractsPage';
import AccountantDashboardPage from './features/accountant/AccountantDashboardPage';
import AccountantDepositPage from './features/accountant/AccountantDepositPage';
import AccountantCheckinPage from './features/accountant/AccountantCheckinPage';
import AccountantMonthlyPage from './features/accountant/AccountantMonthlyPage';
import AccountantRefundsPage from './features/accountant/AccountantRefundsPage';
import AccountantPayoutsPage from './features/accountant/AccountantPayoutsPage';
import AdminUsersPage from './features/admin/AdminUsersPage';
import AdminEmployeesPage from './features/admin/AdminEmployeesPage';
import AdminBranchesPage from './features/admin/AdminBranchesPage';
import AdminRoomsPage from './features/admin/AdminRoomsPage';
import AdminServicesPage from './features/admin/AdminServicesPage';
import AdminConditionsPage from './features/admin/AdminConditionsPage';
import AdminAssetsPage from './features/admin/AdminAssetsPage';
import AdminDashboardPage from './features/admin/AdminDashboardPage';
import ManagerDashboardPage from './features/manager/ManagerDashboardPage';
import ManagerRoomsPage from './features/manager/ManagerRoomsPage';
import ManagerDepositsPage from './features/manager/ManagerDepositsPage';
import ManagerResidencyPage from './features/manager/ManagerResidencyPage';
import ManagerHandoversPage from './features/manager/ManagerHandoversPage';
import ManagerAssetsPage from './features/manager/ManagerAssetsPage';
import ManagerContractsPage from './features/manager/ManagerContractsPage';
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import ConfirmLogoutModal from './components/ui/ConfirmLogoutModal';

// ScrollToTop: cuộn về đầu trang khi chuyển route
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// App Wrapper — khởi tạo phiên làm việc khi ứng dụng mở lần đầu
export default function App() {
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
      <ScrollToTop />
      <Routes>
        {/* Chỉ khớp ĐÚNG trang gốc "/". Trước đây dùng "/*" khiến route này nuốt hết
            mọi /customer/* (viewing-schedules, deposit-history, ...) và đá khách về
            trang chủ, vì React Router v6 ưu tiên route khai báo trước khi cùng điểm khớp. */}
        <Route path="/" element={!user || user.role === 'customer' ? <LandingPage /> : <DashboardLayout />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/" replace />} />
        <Route path="/verify-otp" element={!user ? <OTPVerificationPage /> : <Navigate to="/" replace />} />
        <Route path="/reset-password" element={!user ? <ResetPasswordPage /> : <Navigate to="/" replace />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/customer/rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="/customer/services" element={
          <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 bg-background pt-24 pb-16">
              <CustomerServicesPage />
            </main>
            <Footer />
          </div>
        } />
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
          <Route path="/customer/deposit-history" element={<DepositHistoryPage />} />
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
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Sidebar Menu Items based on User Role
  const getMenuItems = () => {
    if (!user) return [];
    switch (user.role) {
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Tổng quan hệ thống', icon: Home },
          { path: '/admin/users', label: 'Quản trị Khách hàng', icon: Users },
          { path: '/admin/employees', label: 'Quản trị Nhân viên', icon: User },
          { path: '/admin/branches', label: 'Quản trị Chi nhánh', icon: Building },
          { path: '/admin/rooms-catalog', label: 'Phòng & Giường', icon: Layers },
          { path: '/admin/services', label: 'Danh mục Dịch vụ', icon: Folder },
          { path: '/admin/conditions', label: 'Điều kiện lưu trú', icon: ClipboardList },
          { path: '/admin/assets', label: 'Tài sản dùng chung', icon: Settings }
        ];
      case 'manager':
        return [
          { path: '/manager/dashboard', label: 'Tổng quan', icon: Home },
          { path: '/manager/rooms', label: 'Sơ đồ phòng', icon: Layers },
          { path: '/manager/deposits', label: 'Kiểm duyệt đặt cọc', icon: ClipboardList },
          { path: '/manager/residency-checks', label: 'Kiểm tra lưu trú', icon: CheckCircle },
          { path: '/manager/contracts', label: 'Quản lý hợp đồng', icon: FileText },
          { path: '/manager/handovers', label: 'Bàn giao tài sản', icon: FileText },
          { path: '/manager/assets', label: 'Điều phối tài sản', icon: Settings },
          { path: '/sale/customers', label: 'Tra cứu khách hàng', icon: Search },
          { path: '/profile', label: 'Hồ sơ cá nhân', icon: User }
        ];
      case 'sale':
        return [
          { path: '/sale/dashboard', label: 'Tổng quan', icon: Home },
          { path: '/sale/schedules', label: 'Lịch hẹn xem phòng', icon: Calendar },
          { path: '/sale/contracts', label: 'Lập hợp đồng thuê', icon: FileText },
          { path: '/sale/customers', label: 'Tra cứu khách hàng', icon: Search },
          { path: '/profile', label: 'Hồ sơ cá nhân', icon: User }
        ];
      case 'accountant':
        return [
          { path: '/accountant/dashboard', label: 'Tổng quan', icon: Home },
          { path: '/accountant/invoices/deposit', label: 'Hóa đơn Đặt cọc', icon: Receipt },
          { path: '/accountant/invoices/checkin', label: 'Hóa đơn Nhận phòng', icon: LogIn },
          { path: '/accountant/invoices/monthly', label: 'Hóa đơn Định kỳ', icon: CreditCard },
          { path: '/accountant/refunds', label: 'Đối soát Hoàn cọc', icon: ArrowLeftRight },
          { path: '/accountant/payouts', label: 'Chi tiền Thanh lý', icon: CheckCircle },
          { path: '/sale/customers', label: 'Tra cứu khách hàng', icon: Search },
          { path: '/profile', label: 'Hồ sơ cá nhân', icon: User }
        ];
      case 'customer':
        const isRenting = !!user.renting_room_name;
        const isOldCustomer = !isRenting && !!user.has_contract_history;
        if (isRenting) {
          return [
            { path: '/profile', label: 'Hồ sơ cá nhân', icon: Users },
            { path: '/rooms', label: 'Tìm phòng khác', icon: Compass },
            { path: '/customer/services', label: 'Dịch vụ của tôi', icon: Zap },
            { path: '/customer/invoices', label: 'Hóa đơn & Thanh toán', icon: CreditCard },
            { path: '/customer/contracts', label: 'Hợp đồng của tôi', icon: FileText },
            { path: '/customer/checkout-request', label: 'Đăng ký trả phòng', icon: ClipboardList }
          ];
        } else if (isOldCustomer) {
          return [
            { path: '/profile', label: 'Hồ sơ cá nhân', icon: Users },
            { path: '/rooms', label: 'Tra cứu & Thuê phòng', icon: Compass },
            { path: '/customer/viewing-schedules', label: 'Lịch xem phòng của tôi', icon: Calendar },
            { path: '/customer/invoices', label: 'Hóa đơn & Thanh toán', icon: CreditCard },
            { path: '/customer/contracts', label: 'Hợp đồng của tôi', icon: FileText },
            { path: '/customer/deposit-history', label: 'Lịch sử đặt cọc', icon: Receipt }
          ];
        } else {
          return [
            { path: '/profile', label: 'Hồ sơ cá nhân', icon: Users },
            { path: '/rooms', label: 'Tra cứu & Thuê phòng', icon: Compass },
            { path: '/customer/services', label: 'Dịch vụ & Bảng giá', icon: Zap },
            { path: '/customer/viewing-schedules', label: 'Lịch xem phòng của tôi', icon: Calendar },
            { path: '/customer/deposit-history', label: 'Lịch sử đặt cọc', icon: Receipt }
          ];
        }
      default:
        return [];
    }
  };

  const getRoleLabel = () => {
    if (!user) return { text: 'Người dùng', bg: 'bg-surface-container text-on-surface border-outline/20' };
    switch (user.role) {
      case 'admin': return { text: 'Quản trị viên', bg: 'bg-primary-container text-on-primary-container border-primary/20' };
      case 'manager': return { text: 'Quản lý chi nhánh', bg: 'bg-primary-fixed-dim/20 text-primary border-primary/20' };
      case 'sale': return { text: 'Nhân viên Sale', bg: 'bg-secondary-container text-on-secondary-container border-secondary/20' };
      case 'accountant': return { text: 'Kế toán', bg: 'bg-tertiary-container text-on-tertiary-container border-tertiary/20' };
      case 'customer': return { text: 'Khách thuê', bg: 'bg-error-container text-on-error-container border-error/20' };
      default: return { text: 'Người dùng', bg: 'bg-surface-container text-on-surface border-outline/20' };
    }
  };

  const roleTheme = getRoleLabel();
  const menuItems = getMenuItems();

  const getSidebarSubtitle = () => {
    if (!user) return 'PHÂN HỆ';
    switch (user.role) {
      case 'sale': return 'PHÂN HỆ NHÂN VIÊN SALE';
      case 'manager': return 'PHÂN HỆ QUẢN LÝ';
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
      <aside className="w-64 bg-[#faf2ec] border-r border-[#d1c4b9] hidden md:flex flex-col shrink-0 relative z-30 shadow-lg shadow-[#6f583c]/5">
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
              <span>{user.role === 'customer' ? 'Khu vực thuê: TP.HCM' : `Chi nhánh làm việc: ${user.branch_name || 'Tất cả'}`}</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {/* Profile Dropdown for Header Avatar */}
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-[#6f583c]/15 hover:bg-[#6f583c] hover:text-white text-[#6f583c] border border-[#6f583c]/10 flex items-center justify-center text-sm font-headline-md transition-all shadow-sm hover:shadow cursor-pointer overflow-hidden"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name ?? 'User'} className="w-full h-full object-cover" />
                ) : (
                  user?.full_name?.charAt(0) ?? 'U'
                )}
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
            {user.role === 'manager' && <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />}
            {user.role === 'manager' && <Route path="/manager/rooms" element={<ManagerRoomsPage />} />}
            {user.role === 'manager' && <Route path="/manager/deposits" element={<ManagerDepositsPage />} />}
            {user.role === 'manager' && <Route path="/manager/residency-checks" element={<ManagerResidencyPage />} />}
            {user.role === 'manager' && <Route path="/manager/contracts" element={<ManagerContractsPage />} />}
            {user.role === 'manager' && <Route path="/manager/handovers" element={<ManagerHandoversPage />} />}
            {user.role === 'manager' && <Route path="/manager/assets" element={<ManagerAssetsPage />} />}
            {user.role === 'sale' && <Route path="/sale/dashboard" element={<SaleDashboardPage />} />}
            {user.role === 'sale' && <Route path="/sale/schedules" element={<SaleSchedulesPage />} />}
            {user.role === 'sale' && <Route path="/sale/contracts" element={<SaleContractsPage />} />}
            {user.role === 'accountant' && <Route path="/accountant/dashboard" element={<AccountantDashboardPage />} />}
            {user.role === 'accountant' && <Route path="/accountant/invoices/deposit" element={<AccountantDepositPage />} />}
            {user.role === 'accountant' && <Route path="/accountant/invoices/checkin" element={<AccountantCheckinPage />} />}
            {user.role === 'accountant' && <Route path="/accountant/invoices/monthly" element={<AccountantMonthlyPage />} />}
            {user.role === 'accountant' && <Route path="/accountant/refunds" element={<AccountantRefundsPage />} />}
            {user.role === 'accountant' && <Route path="/accountant/payouts" element={<AccountantPayoutsPage />} />}
            {/* Admin Routes (UC25-UC32) */}
            {user.role === 'admin' && <Route path="/admin/dashboard" element={<AdminDashboardPage />} />}
            {user.role === 'admin' && <Route path="/admin/users" element={<AdminUsersPage />} />}
            {user.role === 'admin' && <Route path="/admin/employees" element={<AdminEmployeesPage />} />}
            {user.role === 'admin' && <Route path="/admin/branches" element={<AdminBranchesPage />} />}
            {user.role === 'admin' && <Route path="/admin/rooms-catalog" element={<AdminRoomsPage />} />}
            {user.role === 'admin' && <Route path="/admin/services" element={<AdminServicesPage />} />}
            {user.role === 'admin' && <Route path="/admin/conditions" element={<AdminConditionsPage />} />}
            {user.role === 'admin' && <Route path="/admin/assets" element={<AdminAssetsPage />} />}
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
  if (user.role === 'accountant') return <Navigate to="/accountant/dashboard" replace />;
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;

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
// PLACEHOLDER PAGE FOR UNIMPLEMENTED MENU ITEMS
// ----------------------------------------------------
function PlaceholderPage() {
  const location = useLocation();
  return (
    <div className="min-h-112.5 flex flex-col items-center justify-center text-center p-8 bg-[#faf2ec] border border-[#d1c4b9] rounded-32 shadow-sm animate-fade-in-up">
      <div className="p-5 bg-[#6f583c]/10 rounded-2xl text-[#6f583c] border border-[#6f583c]/20 mb-6 flex items-center justify-center">
        <Compass className="w-12 h-12" />
      </div>
      <h2 className="text-xl font-extrabold text-[#1e1b17] mb-3 font-lexend">Trang đang xây dựng</h2>
      <p className="text-sm text-[#4e453c] max-w-md mb-6 leading-relaxed">
        Đường dẫn <code className="bg-[#6f583c]/5 px-2 py-1 rounded text-xs font-mono text-[#6f583c]">{location.pathname}</code> đang trong quá trình phát triển và hoàn thiện. Giao diện này sẽ sớm được cập nhật đầy đủ nghiệp vụ.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-[#6f583c] hover:bg-[#5a4630] text-white rounded-full text-xs font-bold transition-all shadow-md shadow-[#6f583c]/15 hover:scale-[1.02] active:scale-95"
      >
        Quay lại Trang chính
      </Link>
    </div>
  );
}
