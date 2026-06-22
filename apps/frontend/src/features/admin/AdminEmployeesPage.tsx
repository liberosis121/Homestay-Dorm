import { useState, useMemo, useEffect } from "react";
import CustomSelect from "../../components/ui/CustomSelect";
import {
  fetchAdminEmployees,
  createEmployeeApi,
  updateEmployeeApi,
  toggleEmployeeLockApi,
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

type Role = "sale" | "manager" | "accountant" | "admin";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  branch: string;
  status: "active" | "locked";
  joinDate: string;
}

const ROLES: Record<Role, { label: string; cls: string }> = {
  sale: {
    label: "Nhân viên Sale",
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  manager: {
    label: "Quản lý CN",
    cls: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  accountant: {
    label: "Kế toán",
    cls: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  admin: { label: "Quản trị viên", cls: "bg-[#e8ede7] text-[#5f745d]" },
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | "">("");
  const [editBranch, setEditBranch] = useState("");
  const [newEmp, setNewEmp] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "sale" as Role,
    branch: "Quận 1",
  });
  const [confirmLockEmployee, setConfirmLockEmployee] = useState<Employee | null>(null);
  const [isConfirmHover, setIsConfirmHover] = useState(false);

  const loadEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminEmployees();
      setEmployees(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi khi tải danh sách nhân viên");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (!selected) {
      setEditRole("");
      setEditBranch("");
      return;
    }
    setEditRole(selected.role);
    setEditBranch(selected.branch);
  }, [selected]);

  const kpis = useMemo(() => {
    const total = employees.length;
    const byRole = (r: Role) => employees.filter((e) => e.role === r).length;
    return [
      { icon: "badge", label: "Tổng nhân viên", val: total, iconCls: "" },
      {
        icon: "support_agent",
        label: "Nhân viên Sale",
        val: byRole("sale"),
        iconCls: "bg-blue-50 text-blue-700",
      },
      {
        icon: "manage_accounts",
        label: "Quản lý CN",
        val: byRole("manager"),
        iconCls: "bg-purple-50 text-purple-700",
      },
      {
        icon: "calculate",
        label: "Kế toán",
        val: byRole("accountant"),
        iconCls: "bg-amber-50 text-amber-700",
      },
    ];
  }, [employees]);

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const q = search.toLowerCase();
        const matchQ =
          !q ||
          e.full_name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q);
        const matchRole = !filterRole || e.role === filterRole;
        const matchBranch = !filterBranch || e.branch === filterBranch;
        return matchQ && matchRole && matchBranch;
      }),
    [employees, search, filterRole, filterBranch],
  );

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const displayedEmployees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole, filterBranch]);

  const confirmToggleLock = async () => {
    if (!confirmLockEmployee) return;
    try {
      const nextStatus = await toggleEmployeeLockApi(confirmLockEmployee.id);
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === confirmLockEmployee.id
            ? { ...e, status: nextStatus as any }
            : e,
        ),
      );
      if (selected?.id === confirmLockEmployee.id) {
        setSelected((prev) =>
          prev ? { ...prev, status: nextStatus as any } : null,
        );
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi thay đổi trạng thái khóa tài khoản!");
    } finally {
      setConfirmLockEmployee(null);
    }
  };

  const addEmployee = async () => {
    if (!newEmp.full_name || !newEmp.email) {
      alert("Họ tên và email là bắt buộc");
      return;
    }
    try {
      const created = await createEmployeeApi(newEmp);
      setEmployees((prev) => [...prev, created]);
      setShowAddModal(false);
      setNewEmp({
        full_name: "",
        email: "",
        phone: "",
        role: "sale",
        branch: "Quận 1",
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi thêm nhân viên mới");
    }
  };

  const saveChanges = async () => {
    if (!selected) return;
    try {
      await updateEmployeeApi(selected.id, {
        role: editRole,
        branch: editBranch,
      });
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === selected.id
            ? { ...e, role: editRole as Role, branch: editBranch }
            : e,
        ),
      );
      setSelected((prev) =>
        prev ? { ...prev, role: editRole as Role, branch: editBranch } : null,
      );
      alert("Cập nhật thông tin nhân viên thành công!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi cập nhật thông tin nhân viên");
    }
  };
  const roleOptions = [
    { value: "", label: "Tất cả" },
    { value: "sale", label: "Nhân viên Sale" },
    { value: "manager", label: "Quản lý CN" },
    { value: "accountant", label: "Kế toán" },
    { value: "admin", label: "Quản trị viên" }
  ];

  const branchOptions = [
    { value: "", label: "Tất cả" },
    { value: "Quận 1", label: "Quận 1" },
    { value: "Quận 3", label: "Quận 3" },
    { value: "Bình Thạnh", label: "Bình Thạnh" }
  ];

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
            Quản trị nhân viên
          </h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            Quản lý tài khoản nhân viên theo phân quyền: Sale, Kế toán, Quản lý,
            Quản trị viên.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow bg-[#6f583c] hover:bg-[#54422c] transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">
            person_add
          </span>
          Thêm nhân viên
        </button>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

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
            <div
              className={`p-2 rounded-lg w-fit ${kpi.iconCls || ""}`}
              style={
                !kpi.iconCls ? { background: A.badgeBg, color: A.accent } : {}
              }
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
            placeholder="Tìm theo tên hoặc email..."
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
          value={filterRole}
          onChange={setFilterRole}
          options={roleOptions}
          placeholder="Vai trò"
          theme="sale"
          triggerClassName="!py-2 min-w-[160px]"
        />
        <CustomSelect
          value={filterBranch}
          onChange={setFilterBranch}
          options={branchOptions}
          placeholder="Chi nhánh"
          theme="sale"
          triggerClassName="!py-2 min-w-[160px]"
        />
        <button
          onClick={() => {
            setSearch("");
            setFilterRole("");
            setFilterBranch("");
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
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
                  "Mã NV",
                  "Nhân viên",
                  "Liên hệ",
                  "Vai trò",
                  "Chi nhánh",
                  "Ngày vào",
                  "Trạng thái",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${h === "Thao tác" ? "text-center" : "text-left"}`}
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
                    className="border-b border-[#d1c4b9] animate-pulse"
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
                      <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
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
                  <td colSpan={8} className="py-16 text-center">
                    <span
                      className="material-symbols-outlined text-5xl block mb-3 animate-bounce"
                      style={{ color: A.border }}
                    >
                      manage_search
                    </span>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: A.textPrimary }}
                    >
                      Không tìm thấy nhân viên nào.
                    </p>
                    <p className="text-xs mt-1" style={{ color: A.textMuted }}>
                      Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedEmployees.map((emp, i) => {
                  const roleInfo = ROLES[emp.role];
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelected(emp)}
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
                        {emp.id}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                            style={{ background: A.primary }}
                          >
                            {emp.full_name.charAt(0)}
                          </div>
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: A.textPrimary }}
                            >
                              {emp.full_name}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: A.textMuted }}
                            >
                              Nhân viên
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm" style={{ color: A.textPrimary }}>
                          {emp.phone}
                        </p>
                        <p
                          className="text-xs opacity-70"
                          style={{ color: A.textMuted }}
                        >
                          {emp.email}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleInfo.cls}`}
                        >
                          {roleInfo.label}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3 text-sm"
                        style={{ color: A.textPrimary }}
                      >
                        {emp.branch}
                      </td>
                      <td
                        className="px-5 py-3 text-sm"
                        style={{ color: A.textMuted }}
                      >
                        {emp.joinDate}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`flex items-center gap-1.5 text-xs font-semibold ${emp.status === "active" ? "text-emerald-600" : "text-red-600"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${emp.status === "active" ? "bg-emerald-500" : "bg-red-500"}`}
                          />
                          {emp.status === "active" ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-center gap-1 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(emp);
                            }}
                            className="p-1.5 rounded-full hover:opacity-70"
                            style={{ color: A.accent }}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmLockEmployee(emp);
                            }}
                            className="p-1.5 rounded-full hover:opacity-70 text-red-600"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {emp.status === "active" ? "block" : "lock_open"}
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
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: A.surface, borderTop: `1px solid ${A.border}` }}
        >
          <p className="text-sm" style={{ color: A.textMuted }}>
            Hiển thị {filtered.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} -{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} trong số{" "}
            {filtered.length} nhân viên
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  style={
                    n === currentPage
                      ? { background: A.primary, color: "#fff" }
                      : { color: A.textPrimary }
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: `${A.primary}66` }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div
            className="w-full max-w-[440px] h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
            style={{ background: A.surface }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                background: A.sidebar,
                borderBottom: `1px solid ${A.border}`,
              }}
            >
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>
                Chi tiết nhân viên
              </h2>
              <button onClick={() => setSelected(null)}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: A.textMuted }}
                >
                  close
                </span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ background: A.primary }}
                >
                  {selected.full_name.charAt(0)}
                </div>
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: A.primary }}
                  >
                    {selected.full_name}
                  </h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${ROLES[selected.role].cls}`}
                  >
                    {ROLES[selected.role].label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Mã nhân viên", val: selected.id },
                  { label: "Email", val: selected.email },
                  { label: "Điện thoại", val: selected.phone },
                  { label: "Ngày vào làm", val: selected.joinDate },
                  {
                    label: "Trạng thái",
                    val: selected.status === "active" ? "Hoạt động" : "Bị khóa",
                  },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p
                      className="text-xs font-semibold uppercase"
                      style={{ color: A.textMuted }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-sm font-medium mt-0.5"
                      style={{ color: A.textPrimary }}
                    >
                      {val}
                    </p>
                  </div>
                ))}
              </div>
              <div
                className="p-4 rounded-lg"
                style={{ background: A.bg, border: `1px solid ${A.border}` }}
              >
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: A.accent }}
                >
                  Đổi vai trò
                </h4>
                <CustomSelect
                  value={editRole || selected.role}
                  onChange={(val) => setEditRole(val as Role)}
                  options={roleOptions.filter((o) => o.value !== "")}
                  placeholder="Vai trò"
                  theme="sale"
                />
              </div>
              <div
                className="p-4 rounded-lg"
                style={{ background: A.bg, border: `1px solid ${A.border}` }}
              >
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: A.accent }}
                >
                  Đổi chi nhánh
                </h4>
                <CustomSelect
                  value={editBranch || selected.branch}
                  onChange={setEditBranch}
                  options={[
                    ...branchOptions.filter((o) => o.value !== ""),
                    { value: "Tất cả", label: "Tất cả" },
                  ]}
                  placeholder="Chi nhánh"
                  theme="sale"
                />
              </div>
            </div>
            <div
              className="px-6 py-4 flex gap-3"
              style={{
                background: A.sidebar,
                borderTop: `1px solid ${A.border}`,
              }}
            >
              <button
                onClick={saveChanges}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#6f583c] hover:bg-[#54422c] transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
              >
                Lưu thay đổi
              </button>
              <button
                onClick={() => setConfirmLockEmployee(selected)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border text-red-600 border-red-300 hover:bg-red-50"
              >
                {selected.status === "active" ? "Tạm khóa" : "Mở khóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: `${A.primary}66` }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            style={{ background: A.surface }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>
                Thêm nhân viên mới
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
            <div>
              <label
                className="block text-xs font-semibold mb-1 uppercase"
                style={{ color: A.textMuted }}
              >
                Họ và tên
              </label>
              <input
                value={newEmp.full_name}
                onChange={(e) =>
                  setNewEmp({ ...newEmp, full_name: e.target.value })
                }
                placeholder="Nhập họ và tên..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  border: `1px solid ${A.border}`,
                  background: A.bg,
                  color: A.textPrimary,
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1 uppercase"
                style={{ color: A.textMuted }}
              >
                Email
              </label>
              <input
                value={newEmp.email}
                onChange={(e) =>
                  setNewEmp({ ...newEmp, email: e.target.value })
                }
                placeholder="email@homestay.vn"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  border: `1px solid ${A.border}`,
                  background: A.bg,
                  color: A.textPrimary,
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1 uppercase"
                style={{ color: A.textMuted }}
              >
                Mật khẩu
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  border: `1px solid ${A.border}`,
                  background: A.bg,
                  color: A.textPrimary,
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-semibold mb-1 uppercase"
                  style={{ color: A.textMuted }}
                >
                  Vai trò
                </label>
                <CustomSelect
                  value={newEmp.role}
                  onChange={(val) => setNewEmp({ ...newEmp, role: val as Role })}
                  options={roleOptions.filter((o) => o.value !== "")}
                  placeholder="Vai trò"
                  theme="sale"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold mb-1 uppercase"
                  style={{ color: A.textMuted }}
                >
                  Chi nhánh
                </label>
                <CustomSelect
                  value={newEmp.branch}
                  onChange={(val) => setNewEmp({ ...newEmp, branch: val })}
                  options={branchOptions.filter((o) => o.value !== "")}
                  placeholder="Chi nhánh"
                  theme="sale"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Hủy
              </button>
              <button
                onClick={addEmployee}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#6f583c] hover:bg-[#54422c] transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
              >
                Thêm nhân viên
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmLockEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmLockEmployee(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 transform transition-all border animate-fade-in-up"
            style={{
              background: A.surface,
              borderColor:
                confirmLockEmployee.status === "active" ? "#fca5a5" : A.border,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-full flex items-center justify-center"
                style={{
                  background:
                    confirmLockEmployee.status === "active"
                      ? "#fee2e2"
                      : "#d1fae5",
                  color:
                    confirmLockEmployee.status === "active"
                      ? "#dc2626"
                      : "#059669",
                }}
              >
                <span className="material-symbols-outlined text-2xl">
                  {confirmLockEmployee.status === "active"
                    ? "block"
                    : "lock_open"}
                </span>
              </div>
              <h3
                className="text-lg font-bold"
                style={{
                  color:
                    confirmLockEmployee.status === "active"
                      ? "#dc2626"
                      : "#059669",
                }}
              >
                {confirmLockEmployee.status === "active"
                  ? "Khóa tài khoản nhân viên"
                  : "Mở khóa tài khoản nhân viên"}
              </h3>
            </div>
            
            <div className="flex flex-col gap-3.5 py-1 text-sm text-[#4e453c]">
              <p className="leading-relaxed">
                Bạn có chắc chắn muốn {confirmLockEmployee.status === "active" ? "khóa" : "mở khóa"} tài khoản của nhân viên này không?
              </p>
              <div className="bg-[#faf2ec] border border-[#d1c4b9]/50 rounded-xl p-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-gray-500">Nhân viên:</span>
                  <span className="font-bold text-gray-900">{confirmLockEmployee.full_name}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="font-semibold text-gray-500">Mã NV:</span>
                  <span className="font-mono bg-[#fff8f3] border border-[#d1c4b9]/30 px-2 py-0.5 rounded text-gray-700 select-all max-w-[220px] truncate" title={confirmLockEmployee.id}>
                    {confirmLockEmployee.id}
                  </span>
                </div>
              </div>
              {confirmLockEmployee.status === "active" && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">warning</span>
                  <span>Nhân viên này sẽ không thể đăng nhập vào hệ thống sau khi tài khoản bị khóa.</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmLockEmployee(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-[#d1c4b9] text-[#4e453c] hover:bg-[#faf2ec] hover:border-[#6f583c] hover:text-[#6f583c] transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmToggleLock}
                onMouseEnter={() => setIsConfirmHover(true)}
                onMouseLeave={() => setIsConfirmHover(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
                style={{
                  background:
                    confirmLockEmployee.status === "active"
                      ? (isConfirmHover ? "#b91c1c" : "#dc2626")
                      : (isConfirmHover ? "#059669" : "#10b981"),
                }}
              >
                {confirmLockEmployee.status === "active"
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
