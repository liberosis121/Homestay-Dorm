import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminDashboard } from './services/admin.service';
import {
  Building,
  Layers,
  Users,
  Folder,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadError(null);
        const dashboard = await fetchAdminDashboard();
        setData(dashboard);
      } catch (err: any) {
        setLoadError(err.message || 'Lỗi khi tải số liệu tổng quan');
      }
    })();
  }, []);

  // API shape: { branches, rooms{total,byStatus}, beds{total,occupied,available},
  //   capacity{maxOccupants,occupancyRate}, accounts{staff,customers,total}, services{total,available} }
  // Lưu ý: "Giường" ← beds.total; "người (sức chứa)" ← capacity.maxOccupants (DB không có capacity/current_occupants ở rooms).
  const stats = useMemo(() => {
    if (!data) return null;

    const rs = data.rooms?.byStatus || {};
    return {
      branchesCount: data.branches ?? 0,
      roomsCount: data.rooms?.total ?? 0,
      capacityCount: data.beds?.total ?? 0,
      occupantsCount: data.beds?.occupied ?? 0,
      maxOccupants: data.capacity?.maxOccupants ?? 0,
      staffCount: data.accounts?.staff ?? 0,
      customerCount: data.accounts?.customers ?? 0,
      servicesCount: data.services?.total ?? 0,
      servicesAvailable: data.services?.available ?? 0,
      roomStatus: {
        available: rs.available ?? 0,
        occupied: rs.occupied ?? 0,
        deposited: rs.deposited ?? 0,
        maintenance: rs.maintenance ?? 0,
        partial: rs.partial ?? 0,
      },
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
        {loadError ? (
          <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {loadError}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-4 border-[#6f583c] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-[#6f583c] mt-2">Đang tải dữ liệu tổng quan...</p>
          </div>
        )}
      </div>
    );
  }

  // Calculate percentages for UI display
  const occupancyRate = stats.capacityCount > 0
    ? Math.round((stats.occupantsCount / stats.capacityCount) * 100)
    : 0;

  // Vẽ vòng donut theo số liệu phòng THẬT (không hardcode tỉ lệ).
  const donutBase = [
    { label: 'Trống', color: '#5f745d', count: stats.roomStatus.available },
    { label: 'Đang ở', color: '#6f583c', count: stats.roomStatus.occupied },
    { label: 'Đã cọc', color: '#c9af8f', count: stats.roomStatus.deposited },
    { label: 'Trống một phần', color: '#a48f7a', count: stats.roomStatus.partial },
    { label: 'Bảo trì', color: '#9e9489', count: stats.roomStatus.maintenance },
  ];
  const donutTotal = donutBase.reduce((sum, s) => sum + s.count, 0);
  let donutAcc = 0;
  const donutSegments = donutBase
    .filter((s) => s.count > 0)
    .map((s) => {
      const len = donutTotal > 0 ? (s.count / donutTotal) * 100 : 0;
      const seg = { ...s, len, offset: -donutAcc };
      donutAcc += len;
      return seg;
    });



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
            Tổng số chi nhánh đang quản lý trong hệ thống
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
          <h3 className="text-lg xl:text-xl font-bold text-[#1e1b17] mt-1 whitespace-nowrap">{stats.roomsCount} Phòng / {stats.capacityCount} Giường</h3>
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
              {stats.servicesAvailable} ĐANG BẬT
            </span>
          </div>
          <p className="text-xs text-[#4e453c] font-semibold uppercase tracking-wider">Danh mục dịch vụ cung cấp</p>
          <h3 className="text-2xl font-bold text-[#1e1b17] mt-1">{stats.servicesCount} Dịch vụ</h3>
          <p className="text-xs text-[#4e453c] mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#5f745d]" />
            <span>{stats.servicesAvailable}/{stats.servicesCount} dịch vụ đang hoạt động</span>
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
              {/* Left Column: Donut chart vẽ theo số liệu thật */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#F3EFE8" strokeWidth="3" />

                    {/* Các cung vẽ theo số liệu phòng thật từ roomStatus */}
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.label}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="3"
                        strokeDasharray={`${seg.len} ${100 - seg.len}`}
                        strokeDashoffset={seg.offset}
                      />
                    ))}
                  </svg>
                  {/* Center Text */}
                  <div className="absolute text-center">
                    <p className="text-3xl font-extrabold text-[#1e1b17]">{stats.roomsCount}</p>
                    <p className="text-[10px] text-[#4e453c] font-bold uppercase tracking-wider">Tổng số phòng</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 text-xs font-semibold">
                  {donutSegments.length === 0 ? (
                    <span className="text-[#7f756b]">Chưa có dữ liệu phòng</span>
                  ) : (
                    donutSegments.map((seg) => (
                      <div key={seg.label} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }}></span>
                        <span className="text-[#4e453c]">{seg.label} ({seg.count})</span>
                      </div>
                    ))
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
                      <span className="font-bold">{stats.maxOccupants} người</span>
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



        </div>

        {/* Column 3: System Logs timeline */}
        <div className="space-y-6">

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

            <div className="py-8 text-center text-xs text-[#7f756b]">
              Chưa có bản ghi hoạt động nào.
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
