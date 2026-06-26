import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMockDB } from '../../lib/supabaseClient';
import { 
  Building, 
  Layers, 
  Users, 
  Folder, 
  Database, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  UserCheck,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const db = getMockDB();
    setData(db);
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;

    const branchesCount = data.branches?.length || 0;
    const rooms = data.rooms || [];
    const roomsCount = rooms.length;
    const capacityCount = rooms.reduce((acc: number, r: any) => acc + (r.capacity || 0), 0);
    const occupantsCount = rooms.reduce((acc: number, r: any) => acc + (r.current_occupants || 0), 0);

    const profiles = data.profiles || [];
    const staffCount = profiles.filter((p: any) => p.role !== 'customer').length;
    const customerCount = profiles.filter((p: any) => p.role === 'customer').length;

    const servicesCount = data.services?.length || 0;

    // Room Status breakdown
    const roomStatus = {
      available: rooms.filter((r: any) => r.status === 'available').length,
      occupied: rooms.filter((r: any) => r.status === 'occupied').length,
      deposited: rooms.filter((r: any) => r.status === 'deposited').length,
      maintenance: rooms.filter((r: any) => r.status === 'maintenance').length,
      partial: rooms.filter((r: any) => r.status === 'partial').length,
    };

    return {
      branchesCount,
      roomsCount,
      capacityCount,
      occupantsCount,
      staffCount,
      customerCount,
      servicesCount,
      roomStatus,
    };
  }, [data]);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-[#6f583c] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-[#6f583c] mt-2">Đang tải dữ liệu tổng quan...</p>
        </div>
      </div>
    );
  }

  // Calculate percentages for UI display
  const occupancyRate = stats.capacityCount > 0 
    ? Math.round((stats.occupantsCount / stats.capacityCount) * 100) 
    : 0;

  const quickActions = [
    { label: 'Cấu hình chi nhánh', path: '/admin/branches', icon: Building, color: 'bg-[#e8ede7] text-[#5f745d] border-[#d8e2d6] hover:bg-[#d8e2d6]/50' },
    { label: 'Cấu hình phòng/giường', path: '/admin/rooms-catalog', icon: Layers, color: 'bg-[#faf2ec] text-[#6f583c] border-[#eadacd] hover:bg-[#eadacd]/50' },
    { label: 'Danh mục dịch vụ', path: '/admin/services', icon: Folder, color: 'bg-[#eef3f0] text-[#738a71] border-[#d0dfcf] hover:bg-[#d0dfcf]/50' },
    { label: 'Sao lưu dữ liệu', path: '/admin/backup', icon: Database, color: 'bg-[#faf6f0] text-[#8a7051] border-[#ebdcc8] hover:bg-[#ebdcc8]/50' },
  ];

  const sysLogs = [
    { action: 'Sao lưu tự động', time: '10 phút trước', desc: 'Bản sao lưu định kỳ tuần 23 hoàn tất', type: 'system', icon: Database, color: 'text-[#8a7051] bg-[#faf6f0]' },
    { action: 'Thêm nhân viên mới', time: '2 giờ trước', desc: 'Tài khoản NV. Nguyễn Thị Trúc Hằng (Sale) đã được tạo', type: 'user', icon: UserCheck, color: 'text-[#5f745d] bg-[#e8ede7]' },
    { action: 'Cập nhật dịch vụ', time: '4 giờ trước', desc: 'Đơn giá "Điện sinh hoạt" được cấu hình lại thành 3,500đ/kWh', type: 'service', icon: Folder, color: 'text-[#738a71] bg-[#eef3f0]' },
    { action: 'Cấu hình quy định', time: 'Hôm qua', desc: 'Cập nhật quy chế lưu trú đối với khách nước ngoài', type: 'policy', icon: ShieldCheck, color: 'text-[#6f583c] bg-[#faf2ec]' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      
      {/* ── Greeting Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#6f583c]">Xin chào, {user?.full_name?.split(' (')[0] || 'Admin'}!</h1>
          <p className="text-sm text-[#4e453c] mt-1 flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-[#6f583c]" />
            {todayLabel}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all hover:bg-[#e8ede7] hover:text-[#4b5c4a] active:scale-95 cursor-pointer bg-[#faf2ec] border border-[#eadacd] text-[#6f583c] hover:border-[#d8e2d6]"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới dữ liệu
        </button>
      </div>

      {/* ── KPI Grid ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Branch Card */}
        <div className="bg-white border border-[#d1c4b9] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#e8ede7] text-[#5f745d] rounded-xl transition-colors group-hover:bg-[#d8e2d6]">
              <Building className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-[#e8ede7] text-[#5f745d]">
              {stats.branchesCount} CHI NHÁNH
            </span>
          </div>
          <p className="text-xs text-[#4e453c] font-semibold uppercase tracking-wider">Hạ tầng hoạt động</p>
          <h3 className="text-2xl font-bold text-[#1e1b17] mt-1">{stats.branchesCount} Cơ sở</h3>
          <p className="text-xs text-[#4e453c] mt-2 flex items-center gap-1">
            Danh sách ở <span className="font-semibold text-[#5f745d]">Quận 1</span> và <span className="font-semibold text-[#5f745d]">Thủ Đức</span>
          </p>
        </div>

        {/* Room/Bed Card */}
        <div className="bg-white border border-[#d1c4b9] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#faf2ec] rounded-xl text-[#8c7355] transition-colors group-hover:bg-[#f4ede6]">
              <Layers className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-[#faf2ec] text-[#8c7355]">
              LẤP ĐẦY {occupancyRate}%
            </span>
          </div>
          <p className="text-xs text-[#4e453c] font-semibold uppercase tracking-wider">Tổng số phòng & giường</p>
          <h3 className="text-2xl font-bold text-[#1e1b17] mt-1">{stats.roomsCount} Phòng / {stats.capacityCount} Giường</h3>
          <div className="mt-3">
            <div className="w-full bg-[#faf2ec] rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#8c7355] h-1.5 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
            </div>
            <p className="text-[11px] text-[#4e453c] mt-1.5 flex justify-between font-medium">
              <span>Đang ở: {stats.occupantsCount} giường</span>
              <span>Trống: {stats.capacityCount - stats.occupantsCount}</span>
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-white border border-[#d1c4b9] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#faf6f0] rounded-xl text-[#8a7051] transition-colors group-hover:bg-[#ebdcc8]">
              <Users className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-[#faf6f0] text-[#8a7051]">
              HOẠT ĐỘNG
            </span>
          </div>
          <p className="text-xs text-[#4e453c] font-semibold uppercase tracking-wider">Tài khoản trên hệ thống</p>
          <h3 className="text-2xl font-bold text-[#1e1b17] mt-1">{stats.staffCount + stats.customerCount} Tài khoản</h3>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#e8ede7] text-[#5f745d] text-[11px] font-semibold border border-[#d8e2d6]">
              {stats.staffCount} Nhân sự
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#faf2ec] text-[#6f583c] text-[11px] font-semibold border border-[#eadacd]">
              {stats.customerCount} Khách thuê
            </span>
          </div>
        </div>

        {/* Services Card */}
        <div className="bg-white border border-[#d1c4b9] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#eef3f0] rounded-xl text-[#738a71] transition-colors group-hover:bg-[#d0dfcf]">
              <Folder className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-[#eef3f0] text-[#738a71]">
              8 LOẠI CHÍNH
            </span>
          </div>
          <p className="text-xs text-[#4e453c] font-semibold uppercase tracking-wider">Danh mục dịch vụ cung cấp</p>
          <h3 className="text-2xl font-bold text-[#1e1b17] mt-1">{stats.servicesCount} Dịch vụ</h3>
          <p className="text-xs text-[#4e453c] mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#5f745d]" />
            <span>Có 2 dịch vụ mới được cập nhật giá tuần này</span>
          </p>
        </div>

      </section>

      {/* ── Main Grid (Dashboard Details) ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columns 1 & 2: Rooms Status Analysis & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Room Status Analysis Panel */}
          <div className="bg-white border border-[#d1c4b9] rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1e1b17] mb-6">
              Phân tích trạng thái phòng trống & lấp đầy
            </h2>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left Column: Visual Chart (SVG Donut Chart Mock) */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  {/* SVG Donut Circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#F3EFE8" strokeWidth="3" />
                    
                    {/* Available Segment (Sage Green) - 66.7% */}
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#5f745d" strokeWidth="3" 
                            strokeDasharray="66.7 33.3" strokeDashoffset="0" />
                    
                    {/* Occupied Segment (Wood Brown) - 16.7% */}
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#6f583c" strokeWidth="3" 
                            strokeDasharray="16.7 83.3" strokeDashoffset="-66.7" />
 
                    {/* Deposited Segment (Sand) - 16.7% */}
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#c9af8f" strokeWidth="3" 
                            strokeDasharray="16.6 83.4" strokeDashoffset="-83.4" />
                  </svg>
                  {/* Center Text */}
                  <div className="absolute text-center">
                    <p className="text-3xl font-extrabold text-[#1e1b17]">{stats.roomsCount}</p>
                    <p className="text-[10px] text-[#4e453c] font-bold uppercase tracking-wider">Tổng số phòng</p>
                  </div>
                </div>
 
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5f745d]"></span>
                    <span className="text-[#4e453c]">Trống ({stats.roomStatus.available})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6f583c]"></span>
                    <span className="text-[#4e453c]">Đang ở ({stats.roomStatus.occupied})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#c9af8f]"></span>
                    <span className="text-[#4e453c]">Đã cọc ({stats.roomStatus.deposited})</span>
                  </div>
                  {stats.roomStatus.partial > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#a48f7a]"></span>
                      <span className="text-[#4e453c]">Trống một phần ({stats.roomStatus.partial})</span>
                    </div>
                  )}
                </div>
              </div>
 
              {/* Right Column: Key Details */}
              <div className="space-y-4">
                <div className="p-4 bg-[#faf2ec] rounded-2xl border border-[#d1c4b9] space-y-3">
                  <p className="text-xs font-bold text-[#6f583c] uppercase tracking-wider">Chi tiết vận hành cơ sở</p>
                  <div className="space-y-2 text-sm text-[#1e1b17]">
                    <div className="flex justify-between">
                      <span className="text-[#4e453c]">Sức chứa tối đa:</span>
                      <span className="font-bold">{stats.capacityCount} người</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4e453c]">Đang ở thực tế:</span>
                      <span className="font-bold">{stats.occupantsCount} người</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#4e453c]">Tỷ lệ lấp đầy bình quân:</span>
                      <span className="font-bold text-[#5f745d]">{occupancyRate}%</span>
                    </div>
                  </div>
                </div>
 
                <div className="border border-[#d1c4b9] rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-[#4e453c] uppercase">Cảnh báo bảo trì phòng</p>
                  <div className="flex items-center justify-between text-sm">
                    {stats.roomStatus.maintenance > 0 ? (
                      <>
                        <span className="text-[#ba1a1a] font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                          Có {stats.roomStatus.maintenance} phòng đang bảo trì
                        </span>
                        <Link to="/admin/rooms-catalog" className="text-xs text-[#8c7355] hover:underline font-bold">Kiểm tra ngay</Link>
                      </>
                    ) : (
                      <span className="text-[#5f745d] font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#5f745d]"></span>
                        Không có phòng nào đang sửa chữa/bảo trì
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
 
          {/* Quick Administration Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#4e453c] uppercase tracking-wider">Lối tắt quản trị nhanh</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((act) => {
                const Icon = act.icon;
                return (
                  <Link
                    key={act.label}
                    to={act.path}
                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl text-center shadow-sm border transition-all hover:shadow hover:scale-[1.02] active:scale-95 ${act.color}`}
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-[#d1c4b9]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#1e1b17] leading-snug">{act.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
 
        </div>
 
        {/* Column 3: System Logs timeline & Backup summary */}
        <div className="space-y-6">
          
          {/* Backup Summary Widget */}
          <div className="bg-white border border-[#d1c4b9] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-[#1e1b17]">
                TRẠNG THÁI SAO LƯU
              </h3>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8ede7] text-[#5f745d] border border-[#d8e2d6]">
                TỰ ĐỘNG BẬT
              </span>
            </div>
            
            <div className="p-4 bg-[#faf2ec] rounded-2xl border border-[#d1c4b9] text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#4e453c]">Bản sao lưu gần nhất:</span>
                <span className="font-bold text-[#1e1b17]">01/06/2026 23:30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4e453c]">Kích thước tệp:</span>
                <span className="font-bold text-[#1e1b17]">3.8 MB (.sql)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4e453c]">Tần suất:</span>
                <span className="font-bold text-[#1e1b17]">Hàng tuần (Chủ nhật)</span>
              </div>
            </div>
 
            <Link
              to="/admin/backup"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#6f583c] hover:bg-[#54422c] active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:gap-3 cursor-pointer duration-200"
            >
              Vào trang Sao lưu & Khôi phục
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
 
          {/* System Audit Logs */}
          <div className="bg-white border border-[#d1c4b9] rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-extrabold text-[#1e1b17]">
                LỊCH SỬ HOẠT ĐỘNG
              </h3>
              <span className="text-[10px] text-[#4e453c] font-bold bg-[#faf2ec] px-2 py-0.5 rounded border border-[#d1c4b9]">
                LOGS
              </span>
            </div>
 
            <div className="space-y-4">
              {sysLogs.map((log, i) => {
                const Icon = log.icon;
                return (
                  <div key={i} className="flex gap-3 text-xs items-start p-2.5 rounded-2xl hover:bg-[#faf2ec] transition-colors">
                    <div className={`p-2 rounded-xl ${log.color} shrink-0`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#1e1b17] truncate">{log.action}</span>
                        <span className="text-[10px] text-[#4e453c] shrink-0">{log.time}</span>
                      </div>
                      <p className="text-[#4e453c] mt-0.5 leading-relaxed">{log.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="pt-6 pb-2 text-center border-t border-[#d1c4b9]">
        <p className="text-xs text-[#4e453c] font-medium">© 2026 HomeStay Dorm Property Management System. Quyền quản trị tối cao.</p>
      </footer>

    </div>
  );
}
