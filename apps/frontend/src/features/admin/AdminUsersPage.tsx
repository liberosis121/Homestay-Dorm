import { useState, useEffect, useMemo } from "react";
import { fetchAdminCustomers, toggleCustomerLockApi } from "./services/admin.service";

// ─── ADMIN DESIGN TOKENS (Timber Earth Harmony) ───────────────────
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

interface CustomerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  renting_room_name?: string;
  status: "renting" | "not_renting" | "pending" | "checked_out";
  accountStatus: "active" | "locked";
  joinDate: string;
  note?: string;
}

const STATUS_MAP = {
  renting: { label: "Đang thuê", cls: "bg-[#e8ede7] text-[#5f745d]" },
  not_renting: {
    label: "Chưa thuê",
    cls: "bg-[#faf2ec] text-[#4e453c] border border-[#d1c4b9]",
  },
  pending: {
    label: "Chờ duyệt",
    cls: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  checked_out: { label: "Đã trả phòng", cls: "bg-gray-100 text-gray-600" },
};

const ACCT_MAP = {
  active: {
    label: "Hoạt động",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  },
  locked: { label: "Bị khóa", dot: "bg-red-500", text: "text-red-600" },
};

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRent, setFilterRent] = useState("");
  const [filterAcct, setFilterAcct] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(
    null,
  );
  const [drawerTab, setDrawerTab] = useState<"info" | "history" | "invoice">(
    "info",
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmLockCustomer, setConfirmLockCustomer] = useState<CustomerRow | null>(null);

  // Load from database
  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const rows = await fetchAdminCustomers();
        if (active) {
          setCustomers(rows);
        }
      } catch (err) {
        console.error("Lỗi khi tải khách hàng:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const kpis = useMemo(() => {
    const total = customers.length;
    const renting = customers.filter((c) => c.status === "renting").length;
    const notRenting = customers.filter(
      (c) => c.status === "not_renting",
    ).length;
    const locked = customers.filter((c) => c.accountStatus === "locked").length;
    return [
      {
        icon: "groups",
        label: "Tổng khách hàng",
        val: total,
        badge: "+2%",
        badgeColor: "text-emerald-600 bg-emerald-50",
      },
      {
        icon: "bed",
        label: "Đang thuê",
        val: renting,
        badge: "",
        badgeColor: "",
      },
      {
        icon: "event_busy",
        label: "Chưa thuê",
        val: notRenting,
        badge: "",
        badgeColor: "",
      },
      {
        icon: "lock_person",
        label: "Tài khoản bị khóa",
        val: locked,
        badge: "",
        badgeColor: "",
        iconCls: "bg-red-50 text-red-600",
      },
    ];
  }, [customers]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q);
      const matchRent = !filterRent || c.status === filterRent;
      const matchAcct = !filterAcct || c.accountStatus === filterAcct;
      return matchQ && matchRent && matchAcct;
    });
  }, [customers, search, filterRent, filterAcct]);

  const confirmToggleLock = async () => {
    if (!confirmLockCustomer) return;
    try {
      const res = await toggleCustomerLockApi(confirmLockCustomer.id);
      const nextStatus = res.accountStatus;
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === confirmLockCustomer.id
            ? { ...c, accountStatus: nextStatus }
            : c
        )
      );
      if (selectedCustomer?.id === confirmLockCustomer.id) {
        setSelectedCustomer((prev) =>
          prev ? { ...prev, accountStatus: nextStatus } : null
        );
      }
    } catch (err) {
      console.error("Lỗi khi thay đổi khóa:", err);
      alert("Không thể thay đổi trạng thái khóa tài khoản!");
    } finally {
      setConfirmLockCustomer(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + " VND";

  const invoiceItems = useMemo(() => {
    if (!selectedCustomer) return [];
    return (selectedCustomer as any).invoices || [];
  }, [selectedCustomer]);

  const invoiceStatusMap: Record<string, { label: string; cls: string }> = {
    paid: { label: "Đã thanh toán", cls: "bg-emerald-50 text-emerald-700" },
    pending: { label: "Chờ thanh toán", cls: "bg-amber-50 text-amber-700" },
    overdue: { label: "Quá hạn", cls: "bg-red-50 text-red-700" },
    cancelled: { label: "Đã hủy", cls: "bg-gray-100 text-gray-600" },
    draft: { label: "Nháp", cls: "bg-gray-100 text-gray-600" },
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
            Quản trị khách hàng
          </h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            Quản lý thông tin cá nhân, tài khoản và trạng thái thuê phòng của
            khách hàng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow transition-all hover:opacity-90 active:scale-95"
            style={{ background: A.primary }}
          >
            <span className="material-symbols-outlined text-[18px]">
              person_add
            </span>
            Thêm khách hàng
          </button>
        </div>
      </header>

      {/* KPI Cards */}
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
            <div className="flex justify-between items-start">
              <div
                className={`p-2 rounded-lg ${kpi.iconCls || ""}`}
                style={
                  !kpi.iconCls ? { background: A.badgeBg, color: A.accent } : {}
                }
              >
                <span className="material-symbols-outlined text-xl">
                  {kpi.icon}
                </span>
              </div>
              {kpi.badge && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${kpi.badgeColor}`}
                >
                  {kpi.badge}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: A.textMuted }}>
                {kpi.label}
              </p>
              <p
                className="text-3xl font-bold mt-0.5"
                style={{ color: A.primary }}
              >
                {kpi.val}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Filter Bar */}
      <section
        className="rounded-xl p-4 flex flex-wrap items-center gap-3"
        style={{
          background: A.surface,
          border: `1px solid ${A.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div className="flex-1 min-w-[240px] relative">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]"
            style={{ color: A.textMuted }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-all"
            style={{
              border: `1px solid ${A.border}`,
              background: A.bg,
              color: A.textPrimary,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = A.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = A.border)}
          />
        </div>
        <select
          value={filterRent}
          onChange={(e) => setFilterRent(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm min-w-[160px] outline-none cursor-pointer"
          style={{
            border: `1px solid ${A.border}`,
            background: A.surface,
            color: A.textPrimary,
          }}
        >
          <option value="">Trạng thái thuê</option>
          <option value="renting">Đang thuê</option>
          <option value="not_renting">Chưa thuê</option>
          <option value="pending">Chờ duyệt</option>
          <option value="checked_out">Đã trả phòng</option>
        </select>
        <select
          value={filterAcct}
          onChange={(e) => setFilterAcct(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm min-w-[160px] outline-none cursor-pointer"
          style={{
            border: `1px solid ${A.border}`,
            background: A.surface,
            color: A.textPrimary,
          }}
        >
          <option value="">Trạng thái tài khoản</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>
        <button
          onClick={() => {
            setSearch("");
            setFilterRent("");
            setFilterAcct("");
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: A.accent }}
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </section>

      {/* Table */}
      <section
        className="rounded-xl overflow-hidden"
        style={{
          background: A.surface,
          border: `1px solid ${A.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead
              style={{
                background: A.sidebar,
                borderBottom: `1px solid ${A.border}`,
              }}
            >
              <tr>
                {[
                  "Mã KH",
                  "Khách hàng",
                  "Liên hệ",
                  "Phòng thuê",
                  "Trạng thái thuê",
                  "Tài khoản",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: A.textMuted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#DDD6CC] animate-pulse"
                  >
                    <td className="px-5 py-4">
                      <div className="h-4 bg-gray-200 rounded w-8"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <span
                      className="material-symbols-outlined text-5xl block mb-3"
                      style={{ color: A.border }}
                    >
                      manage_search
                    </span>
                    <p className="text-sm" style={{ color: A.textMuted }}>
                      Không tìm thấy khách hàng phù hợp.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  const rentInfo = STATUS_MAP[c.status];
                  const acctInfo = ACCT_MAP[c.accountStatus];
                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setDrawerTab("info");
                      }}
                      className="group cursor-pointer transition-colors"
                      style={{
                        borderBottom: `1px solid ${A.border}`,
                        background: i % 2 === 0 ? A.surface : A.bg,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = A.bg)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          i % 2 === 0 ? A.surface : A.bg)
                      }
                    >
                      <td
                        className="px-5 py-3 text-sm font-medium"
                        style={{ color: A.textMuted }}
                      >
                        {c.id}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                            style={{ background: A.primary }}
                          >
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: A.textPrimary }}
                            >
                              {c.full_name}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: A.textMuted }}
                            >
                              Khách hàng
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm" style={{ color: A.textPrimary }}>
                          {c.phone}
                        </p>
                        <p
                          className="text-xs opacity-70"
                          style={{ color: A.textMuted }}
                        >
                          {c.email}
                        </p>
                      </td>
                      <td
                        className="px-5 py-3 text-sm"
                        style={{ color: A.textPrimary }}
                      >
                        {c.renting_room_name || (
                          <span style={{ color: A.textMuted }}>Chưa có</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${rentInfo.cls}`}
                        >
                          {rentInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`flex items-center gap-1.5 text-xs font-medium ${acctInfo.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${acctInfo.dot}`}
                          />
                          {acctInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(c);
                              setDrawerTab("info");
                            }}
                            className="p-1.5 rounded-full transition-colors hover:opacity-70"
                            style={{ color: A.textMuted }}
                            title="Xem chi tiết"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              visibility
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmLockCustomer(c);
                            }}
                            className="p-1.5 rounded-full transition-colors hover:opacity-70 text-red-600"
                            title={
                              c.accountStatus === "active"
                                ? "Tạm khóa"
                                : "Mở khóa"
                            }
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {c.accountStatus === "active"
                                ? "block"
                                : "lock_open"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: A.surface, borderTop: `1px solid ${A.border}` }}
        >
          <p className="text-sm" style={{ color: A.textMuted }}>
            Hiển thị {filtered.length} trong số {customers.length} khách hàng
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
                style={
                  n === 1
                    ? { background: A.primary, color: "#fff" }
                    : { color: A.textPrimary }
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── DRAWER ── */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex justify-end transition-opacity duration-300"
          style={{ background: `${A.primary}66` }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCustomer(null);
          }}
        >
          <div
            className="w-full max-w-[480px] h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
            style={{ background: A.surface }}
          >
            {/* Drawer Header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                background: A.sidebar,
                borderBottom: `1px solid ${A.border}`,
              }}
            >
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>
                Chi tiết khách hàng
              </h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-full transition-colors hover:opacity-70"
                style={{ color: A.textMuted }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* Profile */}
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ background: A.primary }}
                >
                  {selectedCustomer.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: A.primary }}
                  >
                    {selectedCustomer.full_name}
                  </h3>
                  <p className="text-sm" style={{ color: A.textMuted }}>
                    Mã: {selectedCustomer.id} •{" "}
                    <span
                      className={ACCT_MAP[selectedCustomer.accountStatus].text}
                    >
                      {ACCT_MAP[selectedCustomer.accountStatus].label}
                    </span>
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div
                className="flex"
                style={{ borderBottom: `1px solid ${A.border}` }}
              >
                {(["info", "history", "invoice"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className="flex-1 py-2 text-sm font-medium transition-colors"
                    style={
                      drawerTab === tab
                        ? {
                            color: A.primary,
                            borderBottom: `2px solid ${A.primary}`,
                          }
                        : { color: A.textMuted }
                    }
                  >
                    {tab === "info"
                      ? "Thông tin"
                      : tab === "history"
                        ? "Lịch sử thuê"
                        : "Hóa đơn"}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {drawerTab === "info" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p
                        className="text-xs font-semibold uppercase"
                        style={{ color: A.textMuted }}
                      >
                        Email
                      </p>
                      <p
                        className="text-sm font-medium mt-0.5"
                        style={{ color: A.textPrimary }}
                      >
                        {selectedCustomer.email || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs font-semibold uppercase"
                        style={{ color: A.textMuted }}
                      >
                        Điện thoại
                      </p>
                      <p
                        className="text-sm font-medium mt-0.5"
                        style={{ color: A.textPrimary }}
                      >
                        {selectedCustomer.phone}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs font-semibold uppercase"
                        style={{ color: A.textMuted }}
                      >
                        Ngày tạo tài khoản
                      </p>
                      <p
                        className="text-sm font-medium mt-0.5"
                        style={{ color: A.textPrimary }}
                      >
                        {selectedCustomer.joinDate}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs font-semibold uppercase"
                        style={{ color: A.textMuted }}
                      >
                        Trạng thái
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-0.5 ${STATUS_MAP[selectedCustomer.status].cls}`}
                      >
                        {STATUS_MAP[selectedCustomer.status].label}
                      </span>
                    </div>
                  </div>

                  {selectedCustomer.renting_room_name && (
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: A.bg,
                        border: `1px solid ${A.border}`,
                      }}
                    >
                      <h4
                        className="text-sm font-semibold mb-2"
                        style={{ color: A.accent }}
                      >
                        Thông tin phòng hiện tại
                      </h4>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm"
                          style={{ color: A.textPrimary }}
                        >
                          Mã phòng:{" "}
                          <strong style={{ color: A.primary }}>
                            {selectedCustomer.renting_room_name}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {drawerTab === "history" && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm" style={{ color: A.textMuted }}>
                    Lịch sử các hợp đồng thuê phòng của khách hàng.
                  </p>
                  {selectedCustomer.renting_room_name ? (
                    <div
                      className="p-4 rounded-lg flex items-start gap-3"
                      style={{
                        background: A.bg,
                        border: `1px solid ${A.border}`,
                      }}
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ color: A.accent }}
                      >
                        home
                      </span>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: A.primary }}
                        >
                          {selectedCustomer.renting_room_name}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: A.textMuted }}
                        >
                          Đang hoạt động
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-sm text-center py-6"
                      style={{ color: A.textMuted }}
                    >
                      Chưa có lịch sử thuê phòng.
                    </p>
                  )}
                </div>
              )}

              {drawerTab === "invoice" && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm" style={{ color: A.textMuted }}>
                    Danh sách hóa đơn của khách hàng.
                  </p>
                  {invoiceItems.length === 0 ? (
                    <p
                      className="text-sm text-center py-6"
                      style={{ color: A.textMuted }}
                    >
                      Chưa có hóa đơn cho khách hàng này.
                    </p>
                  ) : (
                    invoiceItems.map((inv: any) => {
                      const status = invoiceStatusMap[inv.status] || {
                        label: "Không xác định",
                        cls: "bg-gray-100 text-gray-600",
                      };
                      return (
                        <div
                          key={inv.id}
                          className="p-4 rounded-lg flex items-start justify-between gap-3"
                          style={{
                            background: A.bg,
                            border: `1px solid ${A.border}`,
                          }}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-semibold uppercase"
                                style={{ color: A.textMuted }}
                              >
                                {inv.type}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}
                              >
                                {status.label}
                              </span>
                            </div>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: A.primary }}
                            >
                              {inv.id}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: A.textMuted }}
                            >
                              {inv.room || "Chưa có phòng"} • {inv.dateLabel}
                            </p>
                          </div>
                          <div
                            className="text-sm font-semibold"
                            style={{ color: A.textPrimary }}
                          >
                            {formatCurrency(inv.amount)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD MODAL (minimal) ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: `${A.primary}66` }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
            style={{ background: A.surface }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>
                Thêm khách hàng mới
              </h2>
              <button onClick={() => setShowAddModal(false)}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: A.textMuted }}
                >
                  close
                </span>
              </button>
            </div>
            {["Họ và tên", "CCCD", "Email", "Mật khẩu"].map((label) => (
              <div key={label}>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase"
                  style={{ color: A.textMuted }}
                >
                  {label}
                </label>
                <input
                  type={label === "Mật khẩu" ? "password" : "text"}
                  placeholder={`Nhập ${label.toLowerCase()}...`}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    border: `1px solid ${A.border}`,
                    background: A.bg,
                    color: A.textPrimary,
                  }}
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Hủy
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmLockCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
          style={{
            background:
              confirmLockCustomer.accountStatus === "active"
                ? "rgba(185, 28, 28, 0.4)" // Red tint overlay for lock
                : "rgba(30, 27, 23, 0.4)", // Dark tint overlay for unlock
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmLockCustomer(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 transform transition-all border animate-fade-in-up"
            style={{
              background: A.surface,
              borderColor:
                confirmLockCustomer.accountStatus === "active" ? "#fca5a5" : A.border,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-full flex items-center justify-center"
                style={{
                  background:
                    confirmLockCustomer.accountStatus === "active"
                      ? "#fee2e2"
                      : "#d1fae5",
                  color:
                    confirmLockCustomer.accountStatus === "active"
                      ? "#dc2626"
                      : "#059669",
                }}
              >
                <span className="material-symbols-outlined text-2xl">
                  {confirmLockCustomer.accountStatus === "active"
                    ? "block"
                    : "lock_open"}
                </span>
              </div>
              <h3
                className="text-lg font-bold"
                style={{
                  color:
                    confirmLockCustomer.accountStatus === "active"
                      ? "#dc2626"
                      : "#059669",
                }}
              >
                {confirmLockCustomer.accountStatus === "active"
                  ? "Khóa tài khoản khách hàng"
                  : "Mở khóa tài khoản khách hàng"}
              </h3>
            </div>
            
            <p className="text-sm leading-relaxed" style={{ color: A.textMuted }}>
              {confirmLockCustomer.accountStatus === "active" ? (
                <>
                  Bạn có chắc muốn <strong>khóa tài khoản</strong> của khách hàng{" "}
                  <span className="font-semibold text-gray-900">
                    {confirmLockCustomer.full_name}
                  </span>{" "}
                  (Mã: {confirmLockCustomer.id}) không? Khách hàng này sẽ không thể đăng nhập vào hệ thống.
                </>
              ) : (
                <>
                  Bạn có chắc muốn <strong>mở khóa tài khoản</strong> của khách hàng{" "}
                  <span className="font-semibold text-gray-900">
                    {confirmLockCustomer.full_name}
                  </span>{" "}
                  (Mã: {confirmLockCustomer.id}) không?
                </>
              )}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmLockCustomer(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Hủy
              </button>
              <button
                onClick={confirmToggleLock}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                style={{
                  background:
                    confirmLockCustomer.accountStatus === "active"
                      ? "#dc2626"
                      : "#10b981",
                }}
              >
                {confirmLockCustomer.accountStatus === "active"
                  ? "Khóa tài khoản"
                  : "Mở khóa"}
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
