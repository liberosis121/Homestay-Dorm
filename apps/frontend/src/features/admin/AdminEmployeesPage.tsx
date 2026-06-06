import { useState, useMemo, useEffect } from 'react';
import CustomSelect from '../../components/ui/CustomSelect';

const A = {
  bg: '#fff8f3',          // Sand background
  sidebar: '#faf2ec',     // Warm Cream
  surface: '#ffffff',
  primary: '#6f583c',     // Wood Brown
  accent: '#5f745d',      // Sage Green
  badgeBg: '#e8ede7',     // Sage Light
  border: '#d1c4b9',      // Border Brownish
  textPrimary: '#1e1b17', // Dark Wood
  textMuted: '#4e453c',   // Soft Wood / Muted Text
};

type Role = 'sale' | 'manager' | 'accountant' | 'admin';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  branch: string;
  status: 'active' | 'locked';
  joinDate: string;
  birthDate?: string;
  gender?: string;
}

const ROLES: Record<Role, { label: string; cls: string }> = {
  sale: { label: 'Nhân viên Sale', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  manager: { label: 'Quản lý CN', cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
  accountant: { label: 'Kế toán', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  admin: { label: 'Quản trị viên', cls: 'bg-[#e8ede7] text-[#5f745d]' },
};

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'NV-001', full_name: 'Trần Minh Khoa', email: 'khoa.tran@homestay.vn', phone: '090 111 2233', role: 'sale', branch: 'Quận 1', status: 'active', joinDate: '01/03/2023', birthDate: '15/05/1995', gender: 'Nam' },
  { id: 'NV-002', full_name: 'Nguyễn Thị Lan', email: 'lan.nguyen@homestay.vn', phone: '091 222 3344', role: 'manager', branch: 'Quận 3', status: 'active', joinDate: '15/07/2022', birthDate: '20/10/1990', gender: 'Nữ' },
  { id: 'NV-003', full_name: 'Lê Văn Đức', email: 'duc.le@homestay.vn', phone: '093 333 4455', role: 'accountant', branch: 'Quận 1', status: 'active', joinDate: '10/01/2024', birthDate: '05/12/1993', gender: 'Nam' },
  { id: 'NV-004', full_name: 'Phạm Thị Hoa', email: 'hoa.pham@homestay.vn', phone: '094 444 5566', role: 'sale', branch: 'Bình Thạnh', status: 'locked', joinDate: '05/09/2023', birthDate: '12/08/1998', gender: 'Nữ' },
  { id: 'NV-005', full_name: 'Hoàng Admin', email: 'admin@homestay.vn', phone: '095 000 0000', role: 'admin', branch: 'Tất cả', status: 'active', joinDate: '01/01/2022', birthDate: '01/01/1988', gender: 'Nam' },
];

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmp, setNewEmp] = useState({ full_name: '', email: '', phone: '', role: 'sale' as Role, branch: 'Quận 1', birthDate: '', gender: 'Nam' });
  const [isEditing, setIsEditing] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [confirmLockEmployee, setConfirmLockEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selected) {
      setEditEmp({ ...selected });
      setIsEditing(false);
    } else {
      setEditEmp(null);
      setIsEditing(false);
    }
  }, [selected]);

  const kpis = useMemo(() => {
    const total = employees.length;
    const byRole = (r: Role) => employees.filter((e) => e.role === r).length;
    return [
      { icon: 'badge', label: 'Tổng nhân viên', val: total, iconCls: '' },
      { icon: 'support_agent', label: 'Nhân viên Sale', val: byRole('sale'), iconCls: 'bg-blue-50 text-blue-700' },
      { icon: 'manage_accounts', label: 'Quản lý CN', val: byRole('manager'), iconCls: 'bg-purple-50 text-purple-700' },
      { icon: 'calculate', label: 'Kế toán', val: byRole('accountant'), iconCls: 'bg-amber-50 text-amber-700' },
    ];
  }, [employees]);

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const q = search.toLowerCase();
        const matchQ = !q || e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
        const matchRole = !filterRole || e.role === filterRole;
        const matchBranch = !filterBranch || e.branch === filterBranch;
        return matchQ && matchRole && matchBranch;
      }),
    [employees, search, filterRole, filterBranch],
  );

  const confirmToggleLock = () => {
    if (!confirmLockEmployee) return;
    const nextStatus = confirmLockEmployee.status === 'active' ? 'locked' : 'active';
    setEmployees((prev) =>
      prev.map((e) => e.id === confirmLockEmployee.id ? { ...e, status: nextStatus } : e),
    );
    if (selected?.id === confirmLockEmployee.id) {
      setSelected((prev) => prev ? { ...prev, status: nextStatus } : null);
    }
    setConfirmLockEmployee(null);
  };

  const addEmployee = () => {
    const emp: Employee = {
      ...newEmp,
      id: `NV-${String(employees.length + 1).padStart(3, '0')}`,
      status: 'active',
      joinDate: new Date().toLocaleDateString('vi-VN'),
    };
    setEmployees((prev) => [...prev, emp]);
    setShowAddModal(false);
    setNewEmp({ full_name: '', email: '', phone: '', role: 'sale', branch: 'Quận 1', birthDate: '', gender: 'Nam' });
  };

  return (
    <div className="space-y-6 animate-fade-in-up" style={{ fontFamily: 'Lexend, sans-serif' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: A.primary }}>
            Quản trị nhân viên
          </h1>
          <p className="text-sm mt-1" style={{ color: A.textMuted }}>
            Quản lý tài khoản nhân viên theo phân quyền: Sale, Kế toán, Quản lý, Quản trị viên.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow transition-all hover:opacity-90 active:scale-95"
          style={{ background: A.primary }}
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Thêm nhân viên
        </button>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <div
              className={`p-2 rounded-lg w-fit ${kpi.iconCls || ''}`}
              style={!kpi.iconCls ? { background: A.badgeBg, color: A.accent } : {}}
            >
              <span className="material-symbols-outlined text-xl">{kpi.icon}</span>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: A.textMuted }}>{kpi.label}</p>
              <p className="text-3xl font-bold" style={{ color: A.primary }}>{kpi.val}</p>
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
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: A.textMuted }}>search</span>
          <input
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }}
          />
        </div>
        <CustomSelect
          value={filterRole}
          onChange={setFilterRole}
          options={[
            { value: '', label: 'Tất cả vai trò' },
            { value: 'sale', label: 'Nhân viên Sale' },
            { value: 'manager', label: 'Quản lý CN' },
            { value: 'accountant', label: 'Kế toán' },
            { value: 'admin', label: 'Quản trị viên' }
          ]}
          className="min-w-[160px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <CustomSelect
          value={filterBranch}
          onChange={setFilterBranch}
          options={[
            { value: '', label: 'Tất cả chi nhánh' },
            { value: 'Quận 1', label: 'Quận 1' },
            { value: 'Quận 3', label: 'Quận 3' },
            { value: 'Bình Thạnh', label: 'Bình Thạnh' }
          ]}
          className="min-w-[160px]"
          triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
        />
        <button
          onClick={() => { setSearch(''); setFilterRole(''); setFilterBranch(''); }}
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
        style={{ background: A.surface, border: `1px solid ${A.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}>
              <tr>
                {['Mã NV', 'Nhân viên', 'Liên hệ', 'Vai trò', 'Chi nhánh', 'Ngày vào', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#d1c4b9] animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-3 bg-gray-200 rounded w-32"></div></div></td>
                    <td className="px-5 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-8 bg-gray-200 rounded-full w-24"></div></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <span className="material-symbols-outlined text-5xl block mb-3 animate-bounce" style={{ color: A.border }}>manage_search</span>
                    <p className="text-sm font-semibold" style={{ color: A.textPrimary }}>Không tìm thấy nhân viên nào.</p>
                    <p className="text-xs mt-1" style={{ color: A.textMuted }}>Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp, i) => {
                  const roleInfo = ROLES[emp.role];
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelected(emp)}
                      className="group cursor-pointer transition-colors"
                      style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? A.surface : A.bg }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = A.bg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? A.surface : A.bg)}
                    >
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: A.textMuted }}>{emp.id}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                            style={{ background: A.primary }}
                          >
                            {emp.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: A.textPrimary }}>{emp.full_name}</p>
                            <p className="text-xs" style={{ color: A.textMuted }}>Nhân viên</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm" style={{ color: A.textPrimary }}>{emp.phone}</p>
                        <p className="text-xs opacity-70" style={{ color: A.textMuted }}>{emp.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleInfo.cls}`}>{roleInfo.label}</span>
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: A.textPrimary }}>{emp.branch}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: A.textMuted }}>{emp.joinDate}</td>
                      <td className="px-5 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${emp.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {emp.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); setSelected(emp); setIsEditing(true); }}
                            className="p-1.5 rounded-full hover:opacity-70"
                            style={{ color: A.accent }}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmLockEmployee(emp); }}
                            className="p-1.5 rounded-full hover:opacity-70 text-red-600"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {emp.status === 'active' ? 'block' : 'lock_open'}
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
            Hiển thị {filtered.length} trong số {employees.length} nhân viên
          </p>
          <div className="flex gap-1">
            {[1, 2].map((n) => (
              <button
                key={n}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium"
                style={n === 1 ? { background: A.primary, color: '#fff' } : { color: A.textPrimary }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: `${A.primary}66` }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div
            className="w-full max-w-[440px] h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
            style={{ background: A.surface }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: A.sidebar, borderBottom: `1px solid ${A.border}` }}
            >
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Chi tiết nhân viên</h2>
              <button onClick={() => setSelected(null)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ background: A.primary }}
                >
                  {(editEmp?.full_name || selected.full_name).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: A.primary }}>
                    {editEmp?.full_name || selected.full_name}
                  </h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${ROLES[editEmp?.role || selected.role].cls}`}>
                    {ROLES[editEmp?.role || selected.role].label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Mã nhân viên', val: selected.id },
                  { label: 'Vai trò', val: ROLES[selected.role].label },
                  { label: 'Chi nhánh', val: selected.branch },
                  { label: 'Email', val: selected.email },
                  { label: 'Điện thoại', val: selected.phone },
                  { label: 'Ngày sinh', val: selected.birthDate || 'Chưa cập nhật' },
                  { label: 'Giới tính', val: selected.gender || 'Chưa cập nhật' },
                  { label: 'Ngày vào làm', val: selected.joinDate },
                  { label: 'Trạng thái', val: selected.status === 'active' ? 'Hoạt động' : 'Bị khóa' },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase" style={{ color: A.textMuted }}>{label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: A.textPrimary }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 flex gap-3" style={{ background: A.sidebar, borderTop: `1px solid ${A.border}` }}>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: A.primary }}
              >
                Sửa thông tin
              </button>
              <button
                onClick={() => setConfirmLockEmployee(selected)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border text-red-600 border-red-300 hover:bg-red-50"
              >
                {selected.status === 'active' ? 'Tạm khóa' : 'Mở khóa'}
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
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            style={{ background: A.surface }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Thêm nhân viên mới</h2>
              <button onClick={() => setShowAddModal(false)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Họ và tên</label>
                <input value={newEmp.full_name} onChange={e => setNewEmp({ ...newEmp, full_name: e.target.value })}
                  placeholder="Nhập họ và tên..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Email</label>
                <input value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
                  placeholder="email@homestay.vn"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Số điện thoại</label>
                <input value={newEmp.phone} onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })}
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Ngày sinh</label>
                <input value={newEmp.birthDate} onChange={e => setNewEmp({ ...newEmp, birthDate: e.target.value })}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Giới tính</label>
                <CustomSelect
                  value={newEmp.gender}
                  onChange={val => setNewEmp({ ...newEmp, gender: val })}
                  options={['Nam', 'Nữ', 'Khác']}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Vai trò</label>
                <CustomSelect
                  value={newEmp.role}
                  onChange={val => setNewEmp({ ...newEmp, role: val as Role })}
                  options={[
                    { value: 'sale', label: 'Nhân viên Sale' },
                    { value: 'manager', label: 'Quản lý CN' },
                    { value: 'accountant', label: 'Kế toán' },
                    { value: 'admin', label: 'Quản trị viên' }
                  ]}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Chi nhánh</label>
                <CustomSelect
                  value={newEmp.branch}
                  onChange={val => setNewEmp({ ...newEmp, branch: val })}
                  options={[
                    { value: 'Quận 1', label: 'Quận 1' },
                    { value: 'Quận 3', label: 'Quận 3' },
                    { value: 'Bình Thạnh', label: 'Bình Thạnh' }
                  ]}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}>
                Hủy
              </button>
              <button onClick={addEmployee}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}>
                Thêm nhân viên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Lock/Unlock Modal (from nhatanh) */}
      {confirmLockEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
          style={{
            background: confirmLockEmployee.status === 'active'
              ? 'rgba(185, 28, 28, 0.4)'
              : 'rgba(30, 27, 23, 0.4)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmLockEmployee(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 transform transition-all border animate-fade-in-up"
            style={{
              background: A.surface,
              borderColor: confirmLockEmployee.status === 'active' ? '#fca5a5' : A.border,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-full flex items-center justify-center"
                style={{
                  background: confirmLockEmployee.status === 'active' ? '#fee2e2' : '#d1fae5',
                  color: confirmLockEmployee.status === 'active' ? '#dc2626' : '#059669',
                }}
              >
                <span className="material-symbols-outlined text-2xl">
                  {confirmLockEmployee.status === 'active' ? 'block' : 'lock_open'}
                </span>
              </div>
              <h3
                className="text-lg font-bold"
                style={{ color: confirmLockEmployee.status === 'active' ? '#dc2626' : '#059669' }}
              >
                {confirmLockEmployee.status === 'active' ? 'Khóa tài khoản nhân viên' : 'Mở khóa tài khoản nhân viên'}
              </h3>
            </div>
            
            <p className="text-sm leading-relaxed" style={{ color: A.textMuted }}>
              {confirmLockEmployee.status === 'active' ? (
                <>
                  Bạn có chắc muốn <strong>khóa tài khoản</strong> của nhân viên{' '}
                  <span className="font-semibold text-gray-900">{confirmLockEmployee.full_name}</span>{' '}
                  (Mã: {confirmLockEmployee.id}) không? Nhân viên này sẽ không thể đăng nhập vào hệ thống.
                </>
              ) : (
                <>
                  Bạn có chắc muốn <strong>mở khóa tài khoản</strong> của nhân viên{' '}
                  <span className="font-semibold text-gray-900">{confirmLockEmployee.full_name}</span>{' '}
                  (Mã: {confirmLockEmployee.id}) không?
                </>
              )}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmLockEmployee(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: A.border, color: A.textMuted }}
              >
                Hủy
              </button>
              <button
                onClick={confirmToggleLock}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ background: confirmLockEmployee.status === 'active' ? '#dc2626' : '#10b981' }}
              >
                {confirmLockEmployee.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && editEmp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: `${A.primary}66` }}
          onClick={e => { if (e.target === e.currentTarget) setIsEditing(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl p-5 flex flex-col gap-4 overflow-hidden"
            style={{ background: A.surface }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: A.primary }}>Chỉnh sửa nhân viên</h2>
              <button onClick={() => setIsEditing(false)}>
                <span className="material-symbols-outlined" style={{ color: A.textMuted }}>close</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Họ và tên</label>
                <input value={editEmp.full_name || ''} onChange={e => setEditEmp({ ...editEmp, full_name: e.target.value })}
                  placeholder="Nhập họ và tên..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Email</label>
                <input value={editEmp.email || ''} onChange={e => setEditEmp({ ...editEmp, email: e.target.value })}
                  placeholder="email@homestay.vn"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Số điện thoại</label>
                <input value={editEmp.phone || ''} onChange={e => setEditEmp({ ...editEmp, phone: e.target.value })}
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Ngày sinh</label>
                <input value={editEmp.birthDate || ''} onChange={e => setEditEmp({ ...editEmp, birthDate: e.target.value })}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Giới tính</label>
                <CustomSelect
                  value={editEmp.gender || 'Nam'}
                  onChange={val => setEditEmp({ ...editEmp, gender: val })}
                  options={['Nam', 'Nữ', 'Khác']}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Vai trò</label>
                <CustomSelect
                  value={editEmp.role}
                  onChange={val => setEditEmp({ ...editEmp, role: val as Role })}
                  options={[
                    { value: 'sale', label: 'Nhân viên Sale' },
                    { value: 'manager', label: 'Quản lý CN' },
                    { value: 'accountant', label: 'Kế toán' },
                    { value: 'admin', label: 'Quản trị viên' }
                  ]}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Chi nhánh</label>
                <CustomSelect
                  value={editEmp.branch}
                  onChange={val => setEditEmp({ ...editEmp, branch: val })}
                  options={[
                    { value: 'Quận 1', label: 'Quận 1' },
                    { value: 'Quận 3', label: 'Quận 3' },
                    { value: 'Bình Thạnh', label: 'Bình Thạnh' }
                  ]}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Ngày vào làm</label>
                <input value={editEmp.joinDate || ''} onChange={e => setEditEmp({ ...editEmp, joinDate: e.target.value })}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${A.border}`, background: A.bg, color: A.textPrimary }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase" style={{ color: A.textMuted }}>Trạng thái</label>
                <CustomSelect
                  value={editEmp.status}
                  onChange={val => setEditEmp({ ...editEmp, status: val as any })}
                  options={[
                    { value: 'active', label: 'Hoạt động' },
                    { value: 'locked', label: 'Bị khóa' }
                  ]}
                  className="w-full"
                  triggerClassName="h-10 !rounded-lg !border-[#d1c4b9] !bg-[#fff8f3] text-[#1e1b17] py-2"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-1">
              <button onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                style={{ borderColor: A.border, color: A.textMuted }}>Hủy</button>
              <button onClick={() => {
                setEmployees(prev => prev.map(e => e.id === editEmp.id ? editEmp : e));
                setSelected(editEmp);
                setIsEditing(false);
              }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: A.primary }}>Lưu thay đổi</button>
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
