import React, { useEffect, useState } from 'react';
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
  User, 
  Bell, 
  Compass, 
  ShieldAlert, 
  ArrowRight,
  ClipboardList,
  Activity,
  UserCheck
} from 'lucide-react';
import { initializeMockDB, getMockDB, saveMockDB, Profile, Room, Branch } from './lib/supabaseClient';
import { useAuthStore } from './stores/authStore';

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
    <Routes>
      <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/" replace />} />
      <Route 
        path="/*" 
        element={user ? <DashboardLayout /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
}

// ----------------------------------------------------
// LOGIN SCREEN WITH DYNAMIC PRESETS
// ----------------------------------------------------
function LoginScreen() {
  const [email, setEmail] = useState('');
  const { login, error, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const success = await login(email);
    if (success) {
      navigate('/');
    }
  };

  const fillCredential = (presetEmail: string) => {
    setEmail(presetEmail);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 relative overflow-hidden px-4">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-violet-500/10 rounded-xl mb-3 text-violet-400 border border-violet-500/20">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            HOMESTAY DORM
          </h1>
          <p className="text-slate-400 text-sm mt-1">Hệ thống quản lý dịch vụ lưu trú KTX</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email đăng nhập
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhap-email@homestay.com"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 px-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-lg transition-all text-sm shadow-lg shadow-violet-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800/80 pt-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
            Tài khoản dùng thử (Click để chọn nhanh)
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {[
              { email: 'admin@homestay.com', name: 'Quản trị viên (Admin)', color: 'border-violet-500/20 hover:bg-violet-500/5 text-violet-400' },
              { email: 'manager@homestay.com', name: 'Quản lý chi nhánh (Manager)', color: 'border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-400' },
              { email: 'sale@homestay.com', name: 'Nhân viên Sale (Sale)', color: 'border-blue-500/20 hover:bg-blue-500/5 text-blue-400' },
              { email: 'accountant@homestay.com', name: 'Kế toán (Accountant)', color: 'border-amber-500/20 hover:bg-amber-500/5 text-amber-400' },
              { email: 'customer@gmail.com', name: 'Khách hàng (Customer)', color: 'border-rose-500/20 hover:bg-rose-500/5 text-rose-400' }
            ].map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => fillCredential(p.email)}
                className={`w-full text-left border rounded-lg p-2.5 flex items-center justify-between text-xs transition-all ${p.color}`}
              >
                <div>
                  <span className="font-semibold">{p.name}</span>
                  <span className="block text-slate-500 text-[10px] mt-0.5">{p.email}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SIDEBAR & HEADER MAIN DASHBOARD LAYOUT
// ----------------------------------------------------
function DashboardLayout() {
  const { user, logout, login } = useAuthStore();
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
          { path: '/', label: 'Bảng tin cá nhân', icon: Home },
          { path: '/customer/rooms', label: 'Tra cứu & Thuê phòng', icon: Compass },
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
      case 'admin': return { text: 'Quản trị viên', bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20' };
      case 'manager': return { text: 'Quản lý chi nhánh', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'sale': return { text: 'Nhân viên Sale', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'accountant': return { text: 'Kế toán', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'customer': return { text: 'Khách thuê', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative">
      
      {/* ----------------------------------------------------
          SIDEBAR (Desktop)
         ---------------------------------------------------- */}
      <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 hidden md:flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="p-2 bg-violet-600/10 rounded-lg text-violet-400 border border-violet-500/10">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-sm tracking-tight text-white">HOMESTAY DORM</h2>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Phân hệ quản lý</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-violet-600/10 text-violet-400 border-l-2 border-violet-500' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info footer in Sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-semibold border border-slate-700">
              {user.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-slate-200 truncate">{user.full_name}</span>
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded border mt-1 font-medium ${roleTheme.bg}`}>
                {roleTheme.text}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full py-2.5 px-3 bg-slate-800/50 hover:bg-slate-800 hover:text-rose-400 border border-slate-700/50 rounded-lg text-xs font-semibold text-slate-400 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
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
                onClick={() => logout()}
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
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-6 bg-slate-900/40 backdrop-blur-md relative z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="text-slate-400 hover:text-white md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Branch display for Managers/Sales */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
              <Building className="w-4 h-4 text-slate-500" />
              <span>{user.role === 'customer' ? 'Khu vực thuê: TP.HCM' : 'Chi nhánh làm việc: Quận 1'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick switcher helper dropdown (visible in prototype demo) */}
            <div className="flex items-center gap-1.5 border border-violet-500/20 bg-violet-500/5 rounded-lg px-2 py-1 text-xs">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider hidden md:inline">Demo Switch:</span>
              <select 
                value={user.email} 
                onChange={(e) => handleQuickRoleSwitch(e.target.value)}
                className="bg-transparent text-violet-300 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option className="bg-slate-900 text-slate-200" value="admin@homestay.com">Admin Mode</option>
                <option className="bg-slate-900 text-slate-200" value="manager@homestay.com">Manager Mode</option>
                <option className="bg-slate-900 text-slate-200" value="sale@homestay.com">Sale Mode</option>
                <option className="bg-slate-900 text-slate-200" value="accountant@homestay.com">Accountant Mode</option>
                <option className="bg-slate-900 text-slate-200" value="customer@gmail.com">Customer Mode</option>
              </select>
            </div>

            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
              {user.full_name.charAt(0)}
            </div>
          </div>
        </header>

        {/* PAGE BODY */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<DashboardDispatcher />} />
            {user.role === 'customer' && <Route path="/customer/rooms" element={<CustomerRoomsScreen />} />}
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
    { title: 'Tỷ lệ phòng lấp đầy', val: '78%', desc: '+2.4% so với tháng trước', icon: Activity, color: 'text-emerald-400' },
    { title: 'Hợp đồng hoạt động', val: '45 hợp đồng', desc: '12 hợp đồng hết hạn tuần tới', icon: FileText, color: 'text-violet-400' },
    { title: 'Doanh thu cọc khả dụng', val: '45,000,000đ', desc: 'Có 3 cọc chưa được phê duyệt', icon: CreditCard, color: 'text-amber-400' },
    { title: 'Phòng đang bảo trì', val: '3 phòng', desc: '2 phòng dự kiến sửa xong hôm nay', icon: Layers, color: 'text-rose-400' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Xin chào, {user.full_name}!</h1>
        <p className="text-slate-400 text-sm mt-1">Hệ thống ghi nhận phiên đăng nhập quyền [{user.role.toUpperCase()}]. Đây là bàn làm việc của bạn.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-card rounded-xl p-5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</span>
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div className="text-2xl font-extrabold text-white mb-1">{c.val}</div>
              <span className="text-xs text-slate-400">{c.desc}</span>
            </div>
          );
        })}
      </div>

      <div className="glass-card rounded-xl p-6 border border-slate-800/80">
        <h3 className="text-lg font-bold text-white mb-4">Trình quản lý Phase 0 & Thử nghiệm Prototype</h3>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          Hệ thống hiện đang hoạt động ở chế độ **Frontend-First (Mock Mode)**. Tất cả dữ liệu bạn thao tác (chọn phòng đăng ký thuê, cập nhật trạng thái giường, tạo hóa đơn, hay chạy backup hệ thống) đều được lưu trữ trực tiếp ở Local Storage của trình duyệt này.
        </p>
        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Trải nghiệm Flow Đăng ký & Vận hành phòng:</h4>
            <p className="text-xs text-slate-500 mt-1">Chuyển sang "Customer Mode" ở góc trên bên phải để vào trang Tìm kiếm & Đăng ký phòng mẫu.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/customer/rooms" 
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-all"
            >
              Trải nghiệm Thuê phòng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SCREEN: CUSTOMER - ROOMS BROWSE & REGISTER (UC8, UC1)
// ----------------------------------------------------
function CustomerRoomsScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [genderFilter, setGenderFilter] = useState('all');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const db = getMockDB();
    setRooms(db.rooms || []);
  }, []);

  const handleRegisterLease = (roomName: string) => {
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  const filteredRooms = rooms.filter((r) => {
    if (genderFilter === 'all') return true;
    return r.gender_type === genderFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Tra cứu & Tìm kiếm KTX</h1>
          <p className="text-slate-400 text-sm mt-1">Tìm phòng, giường ghép an toàn, đầy đủ tiện ích.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button 
            onClick={() => setGenderFilter('all')} 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${genderFilter === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setGenderFilter('male')} 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${genderFilter === 'male' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Nam
          </button>
          <button 
            onClick={() => setGenderFilter('female')} 
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${genderFilter === 'female' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Nữ
          </button>
        </div>
      </div>

      {bookingSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>**Đăng ký thuê thành công!** Phiếu đăng ký đã được chuyển đến nhân viên Sale chi nhánh xử lý.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <div key={room.id} className="glass-card rounded-xl overflow-hidden flex flex-col border border-slate-800/80">
            <div className="p-5 border-b border-slate-800/60 bg-slate-900/20">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-extrabold text-white text-lg">{room.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  room.gender_type === 'male' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  Phòng {room.gender_type === 'male' ? 'Nam' : 'Nữ'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                <Building className="w-3.5 h-3.5" />
                <span>Chi nhánh Quận 1</span>
              </div>
            </div>

            <div className="p-5 flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/40 p-2.5 rounded-lg">
                  <span className="block text-slate-500 mb-0.5">Sức chứa</span>
                  <span className="font-semibold text-slate-200">{room.capacity} Giường</span>
                </div>
                <div className="bg-slate-900/40 p-2.5 rounded-lg">
                  <span className="block text-slate-500 mb-0.5">Loại phòng</span>
                  <span className="font-semibold text-slate-200 uppercase">{room.type}</span>
                </div>
                <div className="bg-slate-900/40 p-2.5 rounded-lg">
                  <span className="block text-slate-500 mb-0.5">Điều hòa</span>
                  <span className="font-semibold text-slate-200">{room.has_ac ? 'Có sẵn' : 'Không'}</span>
                </div>
                <div className="bg-slate-900/40 p-2.5 rounded-lg">
                  <span className="block text-slate-500 mb-0.5">WC riêng</span>
                  <span className="font-semibold text-slate-200">{room.has_private_wc ? 'Có sẵn' : 'Chung'}</span>
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-slate-800/40 pt-4">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Đơn giá thuê</span>
                  <span className="text-lg font-black text-violet-400">{room.price.toLocaleString('vi-VN')}đ<span className="text-slate-500 text-xs font-normal">/tháng</span></span>
                </div>
                <button
                  onClick={() => handleRegisterLease(room.name)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Đăng ký ở ngay
                </button>
              </div>
            </div>
          </div>
        ))}
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
