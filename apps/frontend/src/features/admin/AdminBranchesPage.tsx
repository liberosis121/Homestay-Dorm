import { formatShortId } from '../../lib/utils';
import { useState, useMemo, useEffect } from "react";
import CustomSelect from "../../components/ui/CustomSelect";
import {
  fetchAdminBranches,
  createBranchApi,
  updateBranchApi,
  fetchAdminRooms,
} from "./services/admin.service";

const A = {
  bg: "#fff8f3", // Sand background
  sidebar: "#faf2ec", // Warm Cream
  surface: "#ffffff",
  primary: "#6f583c", // Wood Brown
  accent: "#5f745d", // Sage Green
  badgeBg: "#e8ede7", // Sage Light
  border: "#d1c4b9", // Border Brownish
  textPrimary: "#1e1b17", // Dark Wood
  textMuted: "#4e453c", // Soft Wood / Muted Text
};

interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
  totalRooms: number;
  activeRooms: number;
  status: "active" | "inactive";
}

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<Partial<Branch>>({});
  const [confirmStatusBranch, setConfirmStatusBranch] = useState<Branch | null>(
    null,
  );

  // Tải danh sách chi nhánh thật + tính số phòng theo branch_id từ /admin/rooms.
  // Lưu ý: DB branches chỉ có {id,name,address,phone,email,status,manager_id};
  // các trường district/city/code/manager-name không có trong DB → map mặc định.
  const loadBranches = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [dbBranches, dbRooms] = await Promise.all([
        fetchAdminBranches(),
        fetchAdminRooms(),
      ]);
      const rooms: any[] = dbRooms || [];
      const mapped: Branch[] = (dbBranches || []).map((b: any) => {
        const branchRooms = rooms.filter((r) => r.branch_id === b.id);
        const activeRooms = branchRooms.filter((r) =>
          ["occupied", "full", "partial"].includes(r.status),
        ).length;
        return {
          id: b.id,
          code: b.id,
          name: b.name ?? "",
          address: b.address ?? "",
          district: "",
          city: "",
          phone: b.phone ?? "",
          email: b.email ?? "",
          manager: b.manager_id ?? "",
          totalRooms: branchRooms.length,
          activeRooms,
          status: b.status === "inactive" ? "inactive" : "active",
        };
      });
      setBranches(mapped);
    } catch (err: any) {
      setLoadError(err.message || "Lỗi khi tải danh sách chi nhánh");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const kpis = useMemo(() => {
    const total = branches.length;
    const totalRooms = branches.reduce((s, b) => s + b.totalRooms, 0);
    const activeRooms = branches.reduce((s, b) => s + b.activeRooms, 0);
    const occupancy = totalRooms
      ? Math.round((activeRooms / totalRooms) * 100)
      : 0;
    return [
      { icon: "location_city", label: "Tổng chi nhánh", val: total },
      { icon: "meeting_room", label: "Tổng số phòng", val: totalRooms },
      { icon: "bed", label: "Phòng đang hoạt động", val: activeRooms },
      { icon: "percent", label: "Tỷ lệ lấp đầy", val: `${occupancy}%` },
    ];
  }, [branches]);

  const filtered = useMemo(
    () =>
      branches.filter((b) => {
        const q = search.toLowerCase();
        const matchQ =
          !q ||
          b.name.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q);
        const matchStatus = !filterStatus || b.status === filterStatus;
        return matchQ && matchStatus;
      }),
    [branches, search, filterStatus],
  );

  const openAdd = () => {
    setModalMode("add");
    setForm({
      name: "",
      address: "",
      phone: "",
      district: "",
      city: "TP. Hồ Chí Minh",
      email: "",
      manager: "",
      totalRooms: 0,
      status: "active",
    });
    setShowModal(true);
  };

  const openEdit = (b: Branch) => {
    setModalMode("edit");
    setForm({ ...b });
    setShowModal(true);
  };

  const saveForm = async () => {
    if (!form.name || !form.address || !form.phone) return;
    // Chỉ gửi các field DB thật. KHÔNG gửi manager (UI đang là tên, DB cần manager_id)
    // để tránh ghi sai dữ liệu — gán quản lý sẽ tích hợp sau qua employees API.
    const payload = {
      name: form.name,
      address: form.address,
      phone: form.phone,
      email: form.email ?? "",
      status: form.status ?? "active",
    };
    try {
      if (modalMode === "add") {
        await createBranchApi(payload);
      } else if (form.id) {
        await updateBranchApi(form.id, payload);
      }
      setShowModal(false);
      await loadBranches();
    } catch (err: any) {
      alert(err.message || "Lỗi khi lưu chi nhánh");
    }
  };

  const toggleBranchStatus = (branch: Branch) => {
    setConfirmStatusBranch(branch);
  };

  const confirmToggleStatus = async () => {
    if (!confirmStatusBranch) return;
    const nextStatus =
      confirmStatusBranch.status === "active" ? "inactive" : "active";
    try {
      await updateBranchApi(confirmStatusBranch.id, { status: nextStatus });
      setConfirmStatusBranch(null);
      await loadBranches();
    } catch (err: any) {
      alert(err.message || "Lỗi khi đổi trạng thái chi nhánh");
    }
  };

  return (
    <div
      className="space-y-6 animate-fade-in-up"
      style={{ fontFamily: "Lexend, sans-serif" }}
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: A.primary }}
          >
            Quản trị chi nhánh
          </h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            Quản lý thông tin liên hệ, địa chỉ và tình trạng hoạt động của các
            chi nhánh HomeStay Dorm.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow bg-[#6f583c] hover:bg-[#54422c] transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">
            add_business
          </span>
          Thêm chi nhánh
        </button>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{
              background: A.surface,
              border: `1px solid ${A.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              className="p-2 rounded-lg w-fit"
              style={{ background: A.badgeBg, color: A.accent }}
            >
              <span className="material-symbols-outlined text-xl">
                {kpi.icon}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: A.textMuted }}>
                {kpi.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: A.primary }}>
                {kpi.val}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Filter */}
      <section
        className="rounded-xl p-4 flex flex-wrap items-center gap-3"
        style={{ background: A.surface, border: `1px solid ${A.border}` }}
      >
        <div className="flex-1 min-w-[240px] relative">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]"
            style={{ color: A.textMuted }}
          >
            search
          </span>
          <input
            placeholder="Tìm theo tên chi nhánh hoặc địa chỉ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{
              border: `1px solid ${A.border}`,
              background: A.bg,
              color: A.textPrimary,
            }}
          />
        </div>
        <CustomSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            { value: "active", label: "Đang hoạt động" },
            { value: "inactive", label: "Tạm dừng" },
          ]}
          theme="sale"
          placeholder="Tất cả trạng thái"
          triggerClassName="!py-2 min-w-[160px]"
        />
        <button
          onClick={() => {
            setSearch("");
            setFilterStatus("");
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[#e8ede7] hover:text-[#4d5e4b] active:scale-95 cursor-pointer"
          style={{ color: A.accent }}
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Load error */}
      {loadError && !isLoading && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {loadError}
        </div>
      )}

      {/* Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-5 border border-[#d1c4b9] bg-white animate-pulse space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-5 bg-gray-200 rounded w-40"></div>
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#d1c4b9] rounded-2xl">
          <span
            className="material-symbols-outlined text-5xl block mb-3 animate-bounce"
            style={{ color: A.border }}
          >
            manage_search
          </span>
          <p className="text-sm font-semibold" style={{ color: A.textPrimary }}>
            Không tìm thấy chi nhánh nào.
          </p>
          <p className="text-xs mt-1" style={{ color: A.textMuted }}>
            Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((b) => {
            const occupancy = b.totalRooms
              ? Math.round((b.activeRooms / b.totalRooms) * 100)
              : 0;
            return (
              <div
                key={b.id}
                className="rounded-xl p-5 transition-all hover:shadow-md"
                style={{
                  background: A.surface,
                  border: `1px solid ${A.border}`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block"
                      style={{ background: A.badgeBg, color: A.accent }}
                    >
                      {formatShortId(b.code, 'branch')}
                    </span>
                    <h3
                      className="text-base font-bold mt-1"
                      style={{ color: A.primary }}
                    >
                      {b.name}
                    </h3>
                    <p
                      className="text-xs mt-0.5 flex items-center gap-1"
                      style={{ color: A.textMuted }}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        location_on
                      </span>
                      {b.address}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center justify-center whitespace-nowrap min-w-[84px] text-[11px] px-2.5 py-1 rounded-full font-medium ${b.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {b.status === "active" ? "Hoạt động" : "Tạm dừng"}
                  </span>
                </div>

                {/* Occupancy bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: A.textMuted }}>Phòng đang thuê</span>
                    <span
                      className="font-semibold"
                      style={{ color: A.primary }}
                    >
                      {b.activeRooms}/{b.totalRooms} phòng
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: A.border }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${occupancy}%`,
                        background: occupancy > 70 ? A.accent : A.primary,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <div className="flex gap-1 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(b);
                      }}
                      className="p-1.5 rounded-full transition-all hover:bg-[#e8ede7] hover:text-[#5f745d] active:scale-90 cursor-pointer"
                      style={{ color: A.accent }}
                      title="Sửa"
                    >
                      <span className="material-symbols-outlined text-[18px] block">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBranchStatus(b);
                      }}
                      className={`p-1.5 rounded-full transition-all active:scale-90 cursor-pointer ${
                        b.status === "active"
                          ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                          : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                      title={b.status === "active" ? "Ngưng hoạt động" : "Kích hoạt"}
                    >
                      <span className="material-symbols-outlined text-[18px] block">
                        {b.status === "active" ? "toggle_off" : "toggle_on"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: `${A.primary}66` }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            style={{ background: A.surface }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>
                {modalMode === "add"
                  ? "Thêm chi nhánh mới"
                  : "Sửa thông tin chi nhánh"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 active:scale-90 transition-all cursor-pointer"
              >
                <span
                  className="material-symbols-outlined block"
                  style={{ color: A.textMuted }}
                >
                  close
                </span>
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">
                Tên chi nhánh
              </label>
              <input
                type="text"
                value={form.name || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nhập tên chi nhánh..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">
                Địa chỉ
              </label>
              <input
                type="text"
                value={form.address || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Nhập địa chỉ..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">
                Số điện thoại
              </label>
              <input
                type="text"
                value={form.phone || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Nhập số điện thoại..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase text-[#4e453c]">
                Email
              </label>
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Nhập email chi nhánh..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border border-[#d1c4b9] hover:border-[#6f583c] focus:border-[#6f583c] focus:ring-2 focus:ring-[#6f583c]/20 bg-[#fff8f3] text-[#1e1b17]"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-gray-50 hover:border-[#6f583c] hover:text-[#6f583c] hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Hủy
              </button>
              <button
                onClick={saveForm}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all bg-[#6f583c] hover:bg-[#54422c] hover:scale-[1.01] active:scale-[0.98] shadow-sm hover:shadow cursor-pointer"
              >
                {modalMode === "add" ? "Thêm chi nhánh" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmStatusBranch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmStatusBranch(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 transform transition-all border animate-fade-in-up"
            style={{
              background: A.surface,
              borderColor:
                confirmStatusBranch.status === "active" ? "#fca5a5" : A.border,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-full flex items-center justify-center"
                style={{
                  background:
                    confirmStatusBranch.status === "active"
                      ? "#fee2e2"
                      : "#d1fae5",
                  color:
                    confirmStatusBranch.status === "active"
                      ? "#dc2626"
                      : "#059669",
                }}
              >
                <span className="material-symbols-outlined text-2xl">
                  {confirmStatusBranch.status === "active"
                    ? "warning"
                    : "check_circle"}
                </span>
              </div>
              <h3
                className="text-lg font-bold"
                style={{
                  color:
                    confirmStatusBranch.status === "active"
                      ? "#dc2626"
                      : "#059669",
                }}
              >
                {confirmStatusBranch.status === "active"
                  ? "Ngưng hoạt động chi nhánh"
                  : "Kích hoạt lại chi nhánh"}
              </h3>
            </div>
            
            <div className="flex flex-col gap-3.5 py-1 text-sm text-[#4e453c]">
              <p className="leading-relaxed">
                Bạn có chắc chắn muốn {confirmStatusBranch.status === "active" ? "ngưng hoạt động" : "kích hoạt lại"} chi nhánh này không?
              </p>
              
              <div className="bg-[#faf2ec] border border-[#d1c4b9]/50 rounded-xl p-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-gray-500">Chi nhánh:</span>
                  <span className="font-bold text-gray-900">{confirmStatusBranch.name}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="font-semibold text-gray-500">Mã chi nhánh:</span>
                  <span className="font-mono bg-[#fff8f3] border border-[#d1c4b9]/30 px-2 py-0.5 rounded text-gray-700 select-all max-w-[220px] truncate" title={confirmStatusBranch.id}>
                    {confirmStatusBranch.id}
                  </span>
                </div>
              </div>

              {confirmStatusBranch.status === "active" && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">warning</span>
                  <span>Mọi hoạt động của chi nhánh này sẽ bị tạm dừng cho đến khi được kích hoạt lại.</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmStatusBranch(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[#d1c4b9] text-[#4e453c] hover:bg-[#faf2ec] hover:border-[#6f583c] hover:text-[#6f583c] transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmToggleStatus}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm hover:brightness-95 active:scale-[0.98] hover:scale-[1.01] transition-all cursor-pointer"
                style={{
                  background:
                    confirmStatusBranch.status === "active"
                      ? "#dc2626"
                      : "#10b981",
                }}
              >
                {confirmStatusBranch.status === "active"
                  ? "Ngưng hoạt động"
                  : "Kích hoạt lại"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
