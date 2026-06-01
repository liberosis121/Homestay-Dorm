import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Folder, 
  Users, 
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
  Activity
} from 'lucide-react';
import { initializeMockDB, getMockDB, saveMockDB, Room } from './lib/supabaseClient';
import { useAuthStore } from './stores/authStore';
import LandingPage from './features/landing/LandingPage';
import LoginPage from './features/auth/LoginPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import OTPVerificationPage from './features/auth/OTPVerificationPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import ProfilePage from './features/customer/ProfilePage';
import RoomsPage from './features/rooms/RoomsPage';
import RoomDetailPage from './features/rooms/RoomDetailPage';
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
          {/* We can add other customer routes here */}
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
  const { user, setLogoutConfirmOpen, login } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  // Dynamic Sidebar Menu Items based on User Role
  const getMenuItems = () => {
    switch (user.role) {
      case 'admin':
        return [
          { path: '/', label: 'Tổng quan hệ thống', icon: Home },
          { path: '/admin/branches', label: 'Quản lý Chi nhánh', icon: Building },
          { path: '/admin/employees', label: 'Quản lý Nhân viên', icon: Users },
          { path: '/admin/rooms', label: 'Danh mục Phòng/Giường', icon: Layers },
          { path: '/admin/services', label: 'Danh mục Dịch vụ', icon: Folder },
          { path: '/admin/backup', label: 'Sao lưu & Khôi phục', icon: Database }
        ];
      case 'manager':
        return [
          { path: '/', label: 'Bàn vận hành', icon: Home },
          { path: '/manager/rooms', label: 'Bản đồ phòng (Floor Map)', icon: Layers },
          { path: '/manager/deposits', label: 'Kiểm duyệt đặt cọc', icon: ClipboardList },
          { path: '/manager/handovers', label: 'Biên bản bàn giao', icon: FileText },
          { path: '/manager/assets', label: 'Quản lý Tài sản', icon: Settings }
        ];
      case 'sale':
        return [
          { path: '/', label: 'Bàn làm việc Sale', icon: Home },
          { path: '/sale/registrations', label: 'Danh sách đăng ký', icon: ClipboardList },
          { path: '/sale/schedules', label: 'Lịch hẹn xem phòng', icon: Calendar },
          { path: '/sale/contracts', label: 'Lập hợp đồng thuê', icon: FileText },
          { path: '/sale/customers', label: 'Tra cứu hồ sơ khách', icon: Search }
        ];
      case 'accountant':
        return [
          { path: '/', label: 'Bàn làm việc Kế toán', icon: Home },
          { path: '/accountant/invoices', label: 'Quản lý Hóa đơn', icon: CreditCard },
          { path: '/accountant/refunds', label: 'Đối soát hoàn cọc', icon: FileText },
          { path: '/accountant/payouts', label: 'Xử lý thanh lý', icon: CheckCircle }
        ];
      case 'customer':
        return [
          { path: '/profile', label: 'Hồ sơ cá nhân', icon: Users },
          { path: '/rooms', label: 'Tra cứu & Thuê phòng', icon: Compass },
          { path: '/customer/schedules', label: 'Lịch xem phòng của tôi', icon: Calendar },
          { path: '/customer/contracts', label: 'Hợp đồng của tôi', icon: FileText },
          { path: '/customer/invoices', label: 'Hóa đơn & Thanh toán', icon: CreditCard }
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

  const handleQuickRoleSwitch = async (newRoleEmail: string) => {
    await login(newRoleEmail);
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex relative font-body-md selection:bg-primary-container selection:text-on-primary-container">
      
      {/* ----------------------------------------------------
          SIDEBAR (Desktop)
         ---------------------------------------------------- */}
      <aside className="w-64 bg-surface-container-low border-r border-surface-variant/50 hidden md:flex flex-col flex-shrink-0 relative z-30 shadow-lg shadow-primary/5">
        <div className="p-6 border-b border-surface-variant/50 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display-lg text-base tracking-tight text-on-surface">HOMESTAY DORM</h2>
            <span className="text-[10px] text-primary font-bold tracking-wider uppercase">Phân hệ quản lý</span>
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
                    ? 'bg-primary text-on-primary shadow-md shadow-primary/20' 
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info footer in Sidebar */}
        <div className="p-4 border-t border-surface-variant/50 bg-surface-container-lowest">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-md shadow-inner">
              {user.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-label-md text-on-surface truncate">{user.full_name}</span>
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border mt-1 font-bold tracking-wide ${roleTheme.bg}`}>
                {roleTheme.text}
              </span>
            </div>
          </div>
          <button
            onClick={() => setLogoutConfirmOpen(true)}
            className="w-full py-3 px-3 bg-surface hover:bg-error/10 hover:text-error border border-surface-variant rounded-24 text-sm font-label-md text-on-surface-variant transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Đăng xuất phiên
          </button>
        </div>
      </aside>

      {/* ----------------------------------------------------
          MOBILE MENU
         ---------------------------------------------------- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden">
          <div className="w-64 bg-slate-900 h-full border-r border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white">HOMESTAY DORM</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
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
                        ? 'bg-violet-600/10 text-violet-400 border-l-2 border-violet-500' 
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={() => setLogoutConfirmOpen(true)}
                className="w-full py-2.5 px-3 bg-slate-800/50 hover:bg-slate-850 hover:text-rose-400 border border-slate-700/50 rounded-lg text-xs font-semibold text-slate-400 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MAIN CONTENT CONTAINER
         ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        
        {/* HEADER */}
        <header className="h-20 border-b border-surface-variant/50 flex items-center justify-between px-6 bg-surface/80 backdrop-blur-xl relative z-20 transition-all">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="text-on-surface-variant hover:text-primary md:hidden cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Branch display for Managers/Sales */}
            <div className="hidden sm:flex items-center gap-2 text-sm font-label-md text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-24 border border-surface-variant/50">
              <Building className="w-4 h-4 text-primary" />
              <span>{user.role === 'customer' ? 'Khu vực thuê: TP.HCM' : 'Chi nhánh làm việc: Quận 1'}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Quick switcher helper dropdown (visible in prototype demo) */}
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-24 px-3 py-1.5 transition-colors hover:bg-primary/10">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider hidden md:inline">Demo Mode:</span>
              <select 
                value={user.email} 
                onChange={(e) => handleQuickRoleSwitch(e.target.value)}
                className="bg-transparent text-on-surface font-label-md focus:outline-none cursor-pointer text-sm appearance-none outline-none"
              >
                <option value="admin@homestay.com">Admin</option>
                <option value="manager@homestay.com">Manager</option>
                <option value="sale@homestay.com">Sale</option>
                <option value="accountant@homestay.com">Accountant</option>
                <option value="customer@gmail.com">Customer (Rented)</option>
                <option value="newcustomer@gmail.com">Customer (New)</option>
              </select>
            </div>

            <button className="relative p-2 text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low rounded-full hover:bg-surface-container cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
            </button>

            <Link to="/profile" className="w-10 h-10 rounded-full bg-primary-container hover:bg-primary hover:text-on-primary text-on-primary-container border border-primary/10 flex items-center justify-center text-sm font-headline-md transition-all shadow-sm hover:shadow cursor-pointer">
              {user.full_name.charAt(0)}
            </Link>
          </div>
        </header>

        {/* PAGE BODY */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<DashboardDispatcher />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            {user.role === 'manager' && <Route path="/manager/rooms" element={<ManagerFloorMapScreen />} />}
            {user.role === 'sale' && <Route path="/sale/registrations" element={<SaleRegistrationsScreen />} />}
            {user.role === 'accountant' && <Route path="/accountant/invoices" element={<AccountantInvoicesScreen />} />}
            {user.role === 'admin' && <Route path="/admin/backup" element={<AdminBackupScreen />} />}
            
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
// SCREEN: SALE - LEASE REGISTRATIONS (UC12)
// ----------------------------------------------------
function SaleRegistrationsScreen() {
  const registrations = [
    { id: 'reg-101', name: 'Nguyễn Văn Hải', phone: '0901112223', room: 'Phòng 101', date: '01/06/2026', type: 'Cá nhân', status: 'Đang xử lý' },
    { id: 'reg-102', name: 'Đặng Thị Lan + 2 thành viên', phone: '0983334445', room: 'Phòng 102', date: '31/05/2026', type: 'Nhóm (3 người)', status: 'Chờ lịch hẹn' },
    { id: 'reg-103', name: 'Phạm Minh Khoa', phone: '0917778889', room: 'Phòng 201', date: '29/05/2026', type: 'Cá nhân', status: 'Đã lập lịch' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Yêu cầu đăng ký thuê phòng</h1>
        <p className="text-slate-400 text-sm mt-1">Quản lý và tiếp nhận hồ sơ đăng ký từ cổng thông tin khách hàng.</p>
      </div>

      <div className="glass-card rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm phiếu đăng ký..."
              className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 pl-9 pr-4 text-slate-300 placeholder-slate-500 focus:outline-none text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-4">Mã phiếu</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">SĐT</th>
                <th className="p-4">Nhu cầu phòng</th>
                <th className="p-4">Ngày đăng ký</th>
                <th className="p-4">Hình thức</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-900/20 transition-all">
                  <td className="p-4 font-mono font-bold text-violet-400">{reg.id}</td>
                  <td className="p-4 font-semibold text-slate-200">{reg.name}</td>
                  <td className="p-4">{reg.phone}</td>
                  <td className="p-4">{reg.room}</td>
                  <td className="p-4">{reg.date}</td>
                  <td className="p-4">{reg.type}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                      {reg.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold transition-colors">
                      Xử lý hồ sơ
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
// SCREEN: ADMIN - BACKUP & SYSTEM CONTROL (UC32)
// ----------------------------------------------------
function AdminBackupScreen() {
  const [backups, setBackups] = useState([
    { id: 'b-992', name: 'homestay_dorm_backup_2026-05-30.sql', size: '2.4 MB', date: '30/05/2026 18:30', status: 'Hoàn tất' },
    { id: 'b-991', name: 'homestay_dorm_backup_2026-05-15.sql', size: '2.3 MB', date: '15/05/2026 18:30', status: 'Hoàn tất' }
  ]);
  const [backingUp, setBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const triggerBackup = () => {
    if (backingUp) return;
    setBackingUp(true);
    setBackupProgress(10);
  };

  useEffect(() => {
    if (backingUp) {
      const interval = setInterval(() => {
        setBackupProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setBackingUp(false);
              setBackups((prevList) => [
                {
                  id: `b-${Date.now().toString().slice(-3)}`,
                  name: `homestay_dorm_backup_${new Date().toISOString().slice(0, 10)}.sql`,
                  size: '2.4 MB',
                  date: new Date().toLocaleString(),
                  status: 'Hoàn tất'
                },
                ...prevList
              ]);
            }, 500);
            return 100;
          }
          return prev + 15;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [backingUp]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Sao lưu & Khôi phục (Backup & Restore)</h1>
          <p className="text-slate-400 text-sm mt-1">Đảm bảo an toàn dữ liệu hệ thống Homestay Dorm thông qua các tệp tin SQL backup định kỳ.</p>
        </div>
        <button
          onClick={triggerBackup}
          disabled={backingUp}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <Database className="w-3.5 h-3.5" />
          Tạo bản sao lưu mới
        </button>
      </div>

      {backingUp && (
        <div className="glass-card rounded-xl p-5 border border-slate-800/80 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-violet-400 font-semibold">Đang tiến hành sao lưu cơ sở dữ liệu Postgres...</span>
            <span className="font-bold">{backupProgress}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-violet-500 h-full transition-all duration-300"
              style={{ width: `${backupProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/20">
          <span className="text-xs font-bold text-slate-400">Các bản sao lưu cơ sở dữ liệu đã có</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-4">Mã</th>
                <th className="p-4">Tên file</th>
                <th className="p-4">Kích thước</th>
                <th className="p-4">Thời điểm sao lưu</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Khôi phục</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900/20 transition-all">
                  <td className="p-4 font-mono font-bold text-violet-400">{b.id}</td>
                  <td className="p-4 font-mono">{b.name}</td>
                  <td className="p-4">{b.size}</td>
                  <td className="p-4">{b.date}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold transition-colors">
                      Restore
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
