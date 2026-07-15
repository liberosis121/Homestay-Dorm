import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useInvoiceStore } from './store/useInvoiceStore';
import type { Invoice } from './store/useInvoiceStore';
import InvoiceTable from './components/InvoiceTable';
import InvoiceDetail from './components/InvoiceDetail';
import CustomSelect from '../../components/ui/CustomSelect';
import { ArrowLeft, FileClock, DollarSign, CalendarDays, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const MONTH_OPTIONS = [
  { value: 'Tất cả', label: 'Tất cả các tháng' },
  { value: '01', label: 'Tháng 01' },
  { value: '02', label: 'Tháng 02' },
  { value: '03', label: 'Tháng 03' },
  { value: '04', label: 'Tháng 04' },
  { value: '05', label: 'Tháng 05' },
  { value: '06', label: 'Tháng 06' },
  { value: '07', label: 'Tháng 07' },
  { value: '08', label: 'Tháng 08' },
  { value: '09', label: 'Tháng 09' },
  { value: '10', label: 'Tháng 10' },
  { value: '11', label: 'Tháng 11' },
  { value: '12', label: 'Tháng 12' },
];

const YEAR_OPTIONS = [
  { value: 'Tất cả', label: 'Tất cả năm' },
  { value: '2024', label: 'Năm 2024' },
  { value: '2025', label: 'Năm 2025' },
  { value: '2026', label: 'Năm 2026' },
];

const INVOICE_TYPE_OPTIONS = [
  { value: 'Tất cả', label: 'Tất cả loại' },
  { value: 'deposit', label: 'Đặt cọc' },
  { value: 'monthly', label: 'Định kỳ' },
  { value: 'service', label: 'Dịch vụ' },
  { value: 'incidental', label: 'Phát sinh' },
];

// Cac khoan dich vu ma khach dang dung (dien, nuoc, tien ich dang ky them) KHONG duoc lap hoa don rieng
// loai 'service' — chung duoc GOP vao hoa don dinh ky. Neu bo loc "Dich vu" chi so khop inv.type === 'service'
// thi no luon rong (ke ca nut "Lich su thanh toan" ben trang Dich vu dieu huong sang day).
// Dung nghiep vu: "Dich vu" = moi hoa don co chua khoan dich vu / dien / nuoc.
const matchesTypeFilter = (inv: Invoice, type: string): boolean => {
  if (!type || type === 'Tất cả') return true;
  if (type === 'service') {
    return inv.type === 'service'
      || inv.servicePrice > 0
      || inv.electricityPrice > 0
      || inv.waterPrice > 0;
  }
  return inv.type === type;
};

export default function InvoicesDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { 
    invoices, 
    filters, 
    setFilters, 
    selectedInvoiceId, 
    setSelectedInvoiceId, 
    fetchInvoices, 
    isLoading, 
    error 
  } = useInvoiceStore();

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (user?.email) {
      fetchInvoices(user.email);
    }
  }, [user?.email, fetchInvoices]);

  useEffect(() => {
    if (location.state?.filterType) {
      setFilters({ 
        type: location.state.filterType,
        status: 'Tất cả'
      });
    } else if (location.state?.from === '/profile') {
      setFilters({ 
        type: 'Tất cả',
        status: 'Tất cả'
      });
    }
  }, [location.state?.filterType, location.state?.from, setFilters]);

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setIsDetailModalOpen(true);
  };

  // 1. KPI Calculations (on ALL invoices)
  const unpaidCount = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue').length;
  }, [invoices]);

  const currentMonthCost = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    return invoices
      .filter((inv) => inv.month === currentMonth && inv.year === currentYear)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  }, [invoices]);

  const closestDueDate = useMemo(() => {
    const activeInvoices = invoices.filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue');
    if (activeInvoices.length === 0) return 'Không có';
    
    // Sort by due date ascending
    const sorted = [...activeInvoices].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const dateParts = sorted[0].dueDate.split('-');
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  }, [invoices]);

  const overdueCount = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'overdue').length;
  }, [invoices]);

  // 2. Applying Filter logic (on invoices displayed in the table)
  const filteredInvoices = useMemo(() => {
    const list = invoices.filter((inv) => {
      // Month
      if (filters.month !== 'Tất cả' && inv.month !== parseInt(filters.month)) return false;
      // Year
      if (filters.year !== 'Tất cả' && inv.year !== parseInt(filters.year)) return false;
      // Invoice type
      if (!matchesTypeFilter(inv, filters.type)) return false;
      // Status
      if (filters.status !== 'Tất cả') {
        if (filters.status === 'paid' && inv.status !== 'paid') return false;
        if (filters.status === 'unpaid' && inv.status !== 'unpaid' && inv.status !== 'pending') return false;
        if (filters.status === 'overdue' && inv.status !== 'overdue') return false;
      }
      return true;
    });

    // Sort by due date descending (newest / most recent first)
    return [...list].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [invoices, filters]);

  // Selected Invoice Object
  const selectedInvoice = useMemo(() => {
    return invoices.find((inv) => inv.id === selectedInvoiceId) || null;
  }, [invoices, selectedInvoiceId]);

  const handleStatusFilterChange = (status: string) => {
    setFilters({ status });
  };

  const handlePayAction = (invoiceId: string) => {
    navigate(`/customer/payment/${invoiceId}`);
  };

  const currentMonthLabel = useMemo(() => {
    return new Date().getMonth() + 1;
  }, []);

  if (isLoading && invoices.length === 0) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-on-surface-variant font-medium text-sm">Đang tải danh sách hóa đơn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8">
      {/* Header Section */}
      <header className="mb-8">
        <button
          type="button"
          onClick={() => navigate(location.state?.from || '/profile')}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary/80 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <h1 className="text-3xl font-bold font-headline-lg text-primary mb-2">Hóa đơn của tôi</h1>
        <p className="text-on-surface-variant font-body-md text-[15px]">
          Tra cứu thông tin chi phí định kỳ và thực hiện thanh toán trực tuyến nhanh chóng.
        </p>
      </header>

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-status-error/10 border border-status-error/20 rounded-2xl text-status-error text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:translate-y-[-4px] transition-transform duration-300">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <FileClock className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Hóa đơn chưa trả</h3>
          <p className="text-2xl font-bold text-primary">
            {unpaidCount < 10 ? `0${unpaidCount}` : unpaidCount}{' '}
            <span className="text-sm font-medium text-on-surface-variant">Hóa đơn</span>
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:translate-y-[-4px] transition-transform duration-300">
          <div className="w-10 h-10 bg-tertiary/10 text-tertiary rounded-xl flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tổng chi phí tháng {currentMonthLabel}</h3>
          <p className="text-2xl font-bold text-on-surface">
            {currentMonthCost.toLocaleString('vi-VN')}{' '}
            <span className="text-sm font-medium text-on-surface-variant">VNĐ</span>
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:translate-y-[-4px] transition-transform duration-300">
          <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center mb-4">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Hạn thanh toán gần nhất</h3>
          <p className="text-xl font-bold text-on-surface">{closestDueDate}</p>
        </div>

        {/* Card 4 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:translate-y-[-4px] transition-transform duration-300">
          <div className="w-10 h-10 bg-status-success/15 text-status-success rounded-xl flex items-center justify-center mb-4">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Hóa đơn quá hạn</h3>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-status-error animate-pulse' : 'text-status-success'}`}>
            {overdueCount}
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {/* Month selector */}
          <CustomSelect
            value={filters.month}
            onChange={(month) => setFilters({ month })}
            options={MONTH_OPTIONS}
            pill
            className="w-full sm:w-[180px]"
            triggerClassName="hover:bg-primary/5 active:scale-[0.99]"
          />

          {/* Year selector */}
          <CustomSelect
            value={filters.year}
            onChange={(year) => setFilters({ year })}
            options={YEAR_OPTIONS}
            pill
            className="w-full sm:w-[140px]"
            triggerClassName="hover:bg-primary/5 active:scale-[0.99]"
          />

          {/* Invoice type selector */}
          <CustomSelect
            value={filters.type || 'Tất cả'}
            onChange={(type) => setFilters({ type })}
            options={INVOICE_TYPE_OPTIONS}
            pill
            className="w-full sm:w-[160px]"
            triggerClassName="hover:bg-primary/5 active:scale-[0.99]"
          />

          {/* Vertical divider */}
          <div className="h-6 w-px bg-outline-variant/30 hidden md:block"></div>

          {/* Filter Status buttons */}
          <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'Tất cả', label: 'Tất cả' },
              { id: 'unpaid', label: 'Chưa thanh toán' },
              { id: 'paid', label: 'Đã thanh toán' },
              { id: 'overdue', label: 'Quá hạn' },
            ].map((btn) => {
              const isStatusActive = filters.status === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => handleStatusFilterChange(btn.id)}
                  className={`px-4 py-2 text-xs sm:text-sm rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap active:scale-[0.97] ${
                    isStatusActive 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'hover:bg-surface-container hover:text-primary text-on-surface-variant'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Table Layout (Full Width) */}
      <div className="w-full mb-8">
        <InvoiceTable 
          invoices={filteredInvoices} 
          selectedId={selectedInvoiceId}
          onSelect={handleSelectInvoice}
          onPay={handlePayAction}
        />
      </div>

      {/* Invoice Detail Modal */}
      {isDetailModalOpen && selectedInvoice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-surface-variant bg-surface-container-lowest shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-surface/30 bg-surface/95 text-primary shadow-sm transition-all hover:bg-surface hover:text-primary/80 active:scale-90 cursor-pointer"
              title="Đóng"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            <InvoiceDetail 
              invoice={selectedInvoice}
              onPay={(id) => {
                setIsDetailModalOpen(false);
                handlePayAction(id);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
