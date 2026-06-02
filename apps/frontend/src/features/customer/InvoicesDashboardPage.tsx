import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceStore } from './store/useInvoiceStore';
import InvoiceTable from './components/InvoiceTable';
import InvoiceDetail from './components/InvoiceDetail';
import { FileClock, DollarSign, CalendarDays, CheckCircle } from 'lucide-react';

export default function InvoicesDashboardPage() {
  const navigate = useNavigate();
  const { invoices, filters, setFilters, selectedInvoiceId, setSelectedInvoiceId } = useInvoiceStore();

  // Local state for filter inputs until "Tìm kiếm" is pressed
  const [selectedMonth, setSelectedMonth] = useState(filters.month);
  const [selectedYear, setSelectedYear] = useState(filters.year);

  // 1. KPI Calculations (on ALL invoices)
  const unpaidCount = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue').length;
  }, [invoices]);

  const currentMonthCost = useMemo(() => {
    // Current month is 10 (October) in our mock database
    return invoices
      .filter((inv) => inv.month === 10 && inv.year === 2024)
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
    return invoices.filter((inv) => {
      // Month
      if (filters.month !== 'Tất cả' && inv.month !== parseInt(filters.month)) return false;
      // Year
      if (filters.year !== 'Tất cả' && inv.year !== parseInt(filters.year)) return false;
      // Status
      if (filters.status !== 'Tất cả') {
        if (filters.status === 'paid' && inv.status !== 'paid') return false;
        if (filters.status === 'unpaid' && inv.status !== 'unpaid') return false;
        if (filters.status === 'overdue' && inv.status !== 'overdue') return false;
      }
      return true;
    });
  }, [invoices, filters]);

  // Selected Invoice Object
  const selectedInvoice = useMemo(() => {
    return invoices.find((inv) => inv.id === selectedInvoiceId) || null;
  }, [invoices, selectedInvoiceId]);

  const handleSearch = () => {
    setFilters({ month: selectedMonth, year: selectedYear });
  };

  const handleStatusFilterChange = (status: string) => {
    setFilters({ status });
  };

  const handlePayAction = (invoiceId: string) => {
    navigate(`/customer/payment/${invoiceId}`);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8">
      {/* Header Section */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline-lg text-primary mb-2">Hóa đơn của tôi</h1>
        <p className="text-on-surface-variant font-body-md text-[15px]">
          Tra cứu thông tin chi phí định kỳ và thực hiện thanh toán trực tuyến nhanh chóng.
        </p>
      </header>

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
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tổng chi phí tháng 10</h3>
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
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Month selector */}
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-primary text-on-surface cursor-pointer min-w-[120px]"
          >
            <option value="Tất cả">Tất cả các tháng</option>
            <option value="05">Tháng 05</option>
            <option value="06">Tháng 06</option>
            <option value="07">Tháng 07</option>
            <option value="08">Tháng 08</option>
            <option value="09">Tháng 09</option>
            <option value="10">Tháng 10</option>
          </select>

          {/* Year selector */}
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-primary text-on-surface cursor-pointer min-w-[100px]"
          >
            <option value="Tất cả">Tất cả năm</option>
            <option value="2024">Năm 2024</option>
          </select>

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
                  className={`px-4 py-2 text-xs sm:text-sm rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isStatusActive 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search button */}
        <button 
          onClick={handleSearch}
          className="w-full md:w-auto bg-primary hover:bg-[#253228] text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span>Tìm kiếm</span>
        </button>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Column Left: Table */}
        <div className="lg:col-span-8 w-full">
          <InvoiceTable 
            invoices={filteredInvoices} 
            selectedId={selectedInvoiceId}
            onSelect={setSelectedInvoiceId}
            onPay={handlePayAction}
          />
        </div>

        {/* Column Right: Detail Sidebar */}
        <div className="lg:col-span-4 w-full sticky top-24">
          <InvoiceDetail 
            invoice={selectedInvoice}
            onPay={handlePayAction}
          />
        </div>
      </div>
    </div>
  );
}
