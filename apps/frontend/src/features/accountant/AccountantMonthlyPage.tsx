import { useState, useEffect } from 'react';
import { 
  Receipt, Search, Check, Eye, Printer, X, Plus, Trash2, AlertTriangle, FileText
} from 'lucide-react';
import { mockSupabase, getMockDB, saveMockDB, MonthlyInvoice, ServiceSubscription } from '../../lib/supabaseClient';
import CustomSelect from '../../components/ui/CustomSelect';
import { useAuthStore } from '../../stores/authStore';
import { accountantService } from './services/accountant.service';
import { formatShortId } from '../../lib/utils';

const STANDARD_INCIDENTALS = [
  { value: 'voi_sen', label: 'Đền bù làm hỏng vòi sen tắm', code: 'CPPS-8821', amount: 150000 },
  { value: 'the_tu', label: 'Đền bù làm mất thẻ từ/chìa khóa', code: 'CPPS-4102', amount: 100000 },
  { value: 've_sinh', label: 'Phạt vi phạm nội quy vệ sinh', code: 'CPPS-1104', amount: 200000 },
  { value: 'tu_ao', label: 'Đền bù hư hỏng tủ quần áo', code: 'CPPS-5531', amount: 500000 },
  { value: 'phu_thu', label: 'Phí phụ thu vệ sinh phòng thêm', code: 'CPPS-3211', amount: 300000 },
  { value: 'ban_hoc', label: 'Đền bù làm hư hỏng bàn học + ghế', code: 'CPPS-6204', amount: 150000 },
  { value: 'khoa_cua', label: 'Đền bù làm hỏng khóa cửa điện tử', code: 'CPPS-7128', amount: 800000 },
  { value: 'giuong_nem', label: 'Đền bù hư hỏng giường đơn + nệm', code: 'CPPS-9901', amount: 200000 },
  { value: 'other', label: 'Khác (Tự nhập chi tiết)', code: '', amount: 0 },
];

export default function AccountantMonthlyPage() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [activeTab, setActiveTab] = useState<'input' | 'list'>('input');
  
  // Contracts list for Tab 1
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  
  // Filters for Tab 2
  const [selectedPeriod, setSelectedPeriod] = useState('06/2026');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected contract inputs
  const [elecOld, setElecOld] = useState(1200);
  const [elecNew, setElecNew] = useState(1280);
  const [waterOld, setWaterOld] = useState(45);
  const [waterNew, setWaterNew] = useState(51);
  const [incidentals, setIncidentals] = useState<{ id: string; name: string; amount: number; confirmed: boolean; dateRecorded?: string }[]>([]);
  const [subscriptions, setSubscriptions] = useState<ServiceSubscription[]>([]);

  // Modal states for adding incidental cost (UC 5)
  const [showAddIncidentalModal, setShowAddIncidentalModal] = useState(false);
  const [newIncidentalCode, setNewIncidentalCode] = useState('');
  const [newIncidentalName, setNewIncidentalName] = useState('');
  const [newIncidentalAmount, setNewIncidentalAmount] = useState(0);
  const [newIncidentalStatus, setNewIncidentalStatus] = useState('confirmed');
  const [newIncidentalDate, setNewIncidentalDate] = useState('');
  const [selectedIncidentalType, setSelectedIncidentalType] = useState('voi_sen');

  // Search query for contracts list in left panel
  const [contractSearchQuery, setContractSearchQuery] = useState('');
  
  // Drawer Detail for Tab 2
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<MonthlyInvoice | null>(null);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      const email = user?.email || 'accountant@homestay.vn';
      try {
        const [liveInvoices, liveContracts] = await Promise.all([
          accountantService.fetchMonthlyInvoices(email),
          accountantService.fetchActiveContracts(email)
        ]);

        const mappedInvoices = (liveInvoices || []).map((inv: any) => {
          const contract = inv.contracts || {};
          const reading = inv.electricity_water_records || {};
          const elecUse = reading.end_electricity - reading.start_electricity;
          const waterUse = reading.end_water - reading.start_water;
          return {
            id: inv.id,
            customer_id: contract.id || inv.customer_id,
            customer_name: inv.customer_name || 'Khách hàng',
            room_id: contract.room_id || inv.room_id,
            room_name: inv.room_name || contract.rooms?.name || 'Phòng',
            period: reading.billing_period || inv.period || '06/2026',
            rent_amount: contract.rent_price || 1500000,
            electricity_kwh: elecUse > 0 ? elecUse : 80,
            electricity_cost: elecUse > 0 ? elecUse * 3500 : 80 * 3500,
            water_m3: waterUse > 0 ? waterUse : 6,
            water_cost: waterUse > 0 ? waterUse * 15000 : 6 * 15000,
            services_cost: 150000,
            total: inv.amount,
            due_date: inv.due_date || '2026-07-10',
            status: inv.status,
            created_at: inv.created_at || ''
          };
        });
        setInvoices(mappedInvoices);
        setContracts(liveContracts || []);
      } catch (err) {
        console.warn('[AccountantMonthly] Failed to load from backend, falling back to mock:', err);
        const db = getMockDB();
        setInvoices(db.monthly_invoices || []);
        
        const mockContracts = [
          { id: 'HD-2026-0001', customer_id: 'u-5', customer_name: 'Lê Lâm Trí Đức', room_id: 'r-1', room_name: 'Phòng 101 (Nam)', rent_price: 1500000, period: '06/2026' },
          { id: 'HD-2026-0002', customer_id: 'u-mock-mon-101', customer_name: 'Nguyễn Văn Hải', room_id: 'r-1', room_name: 'Phòng 101 (Nam)', rent_price: 1500000, period: '06/2026' },
          { id: 'HD-2026-0003', customer_id: 'u-mock-mon-102', customer_name: 'Trần Thị Thu', room_id: 'r-2', room_name: 'Phòng 102 (Nữ)', rent_price: 2000000, period: '06/2026' },
          { id: 'HD-2026-0004', customer_id: 'u-mock-mon-104', customer_name: 'Đinh Thị Hoa', room_id: 'r-4', room_name: 'Phòng 202 (Nữ)', rent_price: 1200000, period: '06/2026' },
          { id: 'HD-2026-0005', customer_id: 'u-mock-mon-105', customer_name: 'Vũ Tú Anh', room_id: 'r-5', room_name: 'Phòng 103 (Nam)', rent_price: 1600000, period: '06/2026' },
        ];
        setContracts(mockContracts);
      }
    };
    loadData();
  }, [user]);

  const selectedContract = contracts.find(c => c.id === selectedContractId);

  useEffect(() => {
    if (selectedContract) {
      const fetchReading = async () => {
        const email = user?.email || 'accountant@homestay.vn';
        try {
          const reading = await accountantService.fetchLatestMeterReading(email, selectedContract.room_id);
          if (reading) {
            setElecOld(reading.end_electricity);
            setElecNew(reading.end_electricity + 85);
            setWaterOld(reading.end_water);
            setWaterNew(reading.end_water + 6);
          } else {
            const oldE = 1200 + (selectedContract.id === 'HD-2026-0001' ? 80 : 40);
            const oldW = 45 + (selectedContract.id === 'HD-2026-0001' ? 8 : 4);
            setElecOld(oldE);
            setElecNew(oldE + 85);
            setWaterOld(oldW);
            setWaterNew(oldW + 6);
          }
        } catch (err) {
          const oldE = 1200 + (selectedContract.id === 'HD-2026-0001' ? 80 : 40);
          const oldW = 45 + (selectedContract.id === 'HD-2026-0001' ? 8 : 4);
          setElecOld(oldE);
          setElecNew(oldE + 85);
          setWaterOld(oldW);
          setWaterNew(oldW + 6);
        }
      };
      fetchReading();

      const db = getMockDB();
      const subs = db.service_subscriptions?.filter(
        (s: ServiceSubscription) => s.customer_id === selectedContract.customer_id && s.status === 'active'
      ) || [];
      setSubscriptions(subs);

      if (selectedContract.customer_id === 'u-5') {
        setIncidentals([
          { id: 'CPPS-8821', name: 'Đền bù làm hỏng vòi sen tắm (báo cáo bởi Quản lý)', amount: 150000, confirmed: false, dateRecorded: '2026-06-05' }
        ]);
      } else {
        setIncidentals([]);
      }
    }
  }, [selectedContractId]);

  const elecUse = Math.max(0, elecNew - elecOld);
  const elecCost = elecUse * 3500;
  const waterUse = Math.max(0, waterNew - waterOld);
  const waterCost = waterUse * 15000;
  const servicesCost = subscriptions.reduce((sum, s) => sum + s.monthly_cost, 0) || 150000; // default to 150k if no services

  const incidentalsCost = incidentals.reduce((sum, inc) => sum + inc.amount, 0);
  const rentAmount = selectedContract ? selectedContract.rent_price : 0;
  const totalCost = rentAmount + elecCost + waterCost + servicesCost + incidentalsCost;

  const hasUnconfirmedIncidentals = incidentals.some(inc => !inc.confirmed);
  
  const handleConfirmAllIncidentals = () => {
    setIncidentals(prev => prev.map(inc => ({ ...inc, confirmed: true })));
  };

  const handleConfirmIncidental = (id: string) => {
    setIncidentals(prev => prev.map(inc => inc.id === id ? { ...inc, confirmed: true } : inc));
  };

  const handleAddIncidental = () => {
    setSelectedIncidentalType('voi_sen');
    setNewIncidentalCode('CPPS-8821');
    setNewIncidentalName('Đền bù làm hỏng vòi sen tắm');
    setNewIncidentalAmount(150000);
    setNewIncidentalStatus('confirmed');
    setNewIncidentalDate(new Date().toISOString().split('T')[0]);
    setShowAddIncidentalModal(true);
  };

  const handleIncidentalTypeChange = (value: string) => {
    setSelectedIncidentalType(value);
    const standard = STANDARD_INCIDENTALS.find(item => item.value === value);
    if (standard) {
      if (value === 'other') {
        setNewIncidentalCode(`CPPS-${Math.floor(1000 + Math.random() * 9000)}`);
        setNewIncidentalName('');
        setNewIncidentalAmount(0);
      } else {
        setNewIncidentalCode(standard.code);
        setNewIncidentalName(standard.label);
        setNewIncidentalAmount(standard.amount);
      }
    }
  };

  const handleSubmitIncidental = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = selectedIncidentalType === 'other' ? newIncidentalName : STANDARD_INCIDENTALS.find(item => item.value === selectedIncidentalType)?.label;
    if (!finalName || !finalName.trim()) return;

    setIncidentals(prev => [...prev, {
      id: newIncidentalCode.trim() || `CPPS-${Math.floor(1000 + Math.random() * 9000)}`,
      name: finalName,
      amount: newIncidentalAmount,
      confirmed: newIncidentalStatus === 'confirmed',
      dateRecorded: newIncidentalDate
    }]);
    setShowAddIncidentalModal(false);
  };

  const handleDeleteIncidental = (id: string) => {
    setIncidentals(prev => prev.filter(inc => inc.id !== id));
  };

  const handleCreateMonthlyInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    if (hasUnconfirmedIncidentals) {
      alert("Cảnh báo: Bạn có khoản phát sinh chưa xác nhận! Vui lòng xác nhận hoặc xóa bỏ trước khi lập hóa đơn.");
      return;
    }

    const email = user?.email || 'accountant@homestay.vn';

    try {
      await accountantService.createMonthlyInvoice(email, {
        contractId: selectedContract.id,
        roomId: selectedContract.room_id,
        billingPeriod: selectedPeriod,
        prevElectricity: elecOld,
        newElectricity: elecNew,
        prevWater: waterOld,
        newWater: waterNew,
        rentPrice: rentAmount,
        servicePrice: servicesCost,
        note: JSON.stringify({ incidentals })
      });

      alert(`Lập hóa đơn định kỳ thành công!`);

      // Refresh list
      const liveInvoices = await accountantService.fetchMonthlyInvoices(email);
      const mappedInvoices = (liveInvoices || []).map((inv: any) => {
        const contract = inv.contracts || {};
        const reading = inv.electricity_water_records || {};
        const elecUse = reading.end_electricity - reading.start_electricity;
        const waterUse = reading.end_water - reading.start_water;
        return {
          id: inv.id,
          customer_id: contract.id || inv.customer_id,
          customer_name: inv.customer_name || 'Khách hàng',
          room_id: contract.room_id || inv.room_id,
          room_name: inv.room_name || contract.rooms?.name || 'Phòng',
          period: reading.billing_period || inv.period || '06/2026',
          rent_amount: contract.rent_price || 1500000,
          electricity_kwh: elecUse > 0 ? elecUse : 80,
          electricity_cost: elecUse > 0 ? elecUse * 3500 : 80 * 3500,
          water_m3: waterUse > 0 ? waterUse : 6,
          water_cost: waterUse > 0 ? waterUse * 15000 : 6 * 15000,
          services_cost: 150000,
          total: inv.amount,
          due_date: inv.due_date || '2026-07-10',
          status: inv.status,
          created_at: inv.created_at || ''
        };
      });
      setInvoices(mappedInvoices);

      const updatedContracts = contracts.map(c => {
        if (c.id === selectedContract.id) {
          return { ...c, period: '07/2026' };
        }
        return c;
      });
      setContracts(updatedContracts);

      setSelectedContractId('');
      setIncidentals([]);
      setActiveTab('list');
    } catch (err: any) {
      console.warn('[AccountantMonthly] Failed to create live invoice, falling back to mock:', err);
      const db = getMockDB();
      const invoiceId = `MON-${Date.now().toString().slice(-4)}`;
      const newInvoice: MonthlyInvoice = {
        id: invoiceId,
        customer_id: selectedContract.customer_id,
        customer_name: selectedContract.customer_name,
        room_id: selectedContract.room_id,
        room_name: selectedContract.room_name,
        period: selectedPeriod,
        rent_amount: rentAmount,
        electricity_kwh: elecUse,
        electricity_cost: elecCost,
        water_m3: waterUse,
        water_cost: waterCost,
        services_cost: servicesCost,
        total: totalCost,
        due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
        status: 'pending',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      db.monthly_invoices = [newInvoice, ...(db.monthly_invoices || [])];
      saveMockDB(db);
      
      const updatedContracts = contracts.map(c => {
        if (c.id === selectedContract.id) {
          return { ...c, period: '07/2026' };
        }
        return c;
      });
      setContracts(updatedContracts);
      setInvoices(db.monthly_invoices);

      setSelectedContractId('');
      setIncidentals([]);
      setActiveTab('list');
      alert(`Lập hóa đơn định kỳ thành công (Mock DB)! Mã hóa đơn: ${invoiceId}`);
    }
  };

  const handleConfirmPayment = async (id: string) => {
    const email = user?.email || 'accountant@homestay.vn';
    try {
      await accountantService.confirmInvoicePayment(email, id, 'transfer');
      const liveInvoices = await accountantService.fetchMonthlyInvoices(email);
      const mappedInvoices = (liveInvoices || []).map((inv: any) => {
        const contract = inv.contracts || {};
        const reading = inv.electricity_water_records || {};
        const elecUse = reading.end_electricity - reading.start_electricity;
        const waterUse = reading.end_water - reading.start_water;
        return {
          id: inv.id,
          customer_id: contract.id || inv.customer_id,
          customer_name: inv.customer_name || 'Khách hàng',
          room_id: contract.room_id || inv.room_id,
          room_name: inv.room_name || contract.rooms?.name || 'Phòng',
          period: reading.billing_period || inv.period || '06/2026',
          rent_amount: contract.rent_price || 1500000,
          electricity_kwh: elecUse > 0 ? elecUse : 80,
          electricity_cost: elecUse > 0 ? elecUse * 3500 : 80 * 3500,
          water_m3: waterUse > 0 ? waterUse : 6,
          water_cost: waterUse > 0 ? waterUse * 15000 : 6 * 15000,
          services_cost: 150000,
          total: inv.amount,
          due_date: inv.due_date || '2026-07-10',
          status: inv.status,
          created_at: inv.created_at || ''
        };
      });
      setInvoices(mappedInvoices);
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice({ ...selectedInvoice, status: 'paid' });
      }
    } catch (err) {
      console.warn('[AccountantMonthly] Payment confirm failed, falling back to mock:', err);
      const res = mockSupabase.from('monthly_invoices').update(id, { status: 'paid' });
      if (res.data) {
        const db = getMockDB();
        setInvoices(db.monthly_invoices || []);
        if (selectedInvoice && selectedInvoice.id === id) {
          setSelectedInvoice({ ...selectedInvoice, status: 'paid' });
        }
      }
    }
  };

  // Filtered List
  const filteredInvoices = invoices.filter(inv => {
    const matchesPeriod = inv.period === selectedPeriod;
    const matchesStatus = selectedStatus === 'all' ? true : inv.status === selectedStatus;
    const matchesSearch = 
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPeriod && matchesStatus && matchesSearch;
  });

  // Filtered Contracts for Left List
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.customer_name.toLowerCase().includes(contractSearchQuery.toLowerCase()) ||
      c.room_name.toLowerCase().includes(contractSearchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(contractSearchQuery.toLowerCase());
    return matchesSearch;
  });

  // Financial Stats
  const expectedMonthlySum = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidMonthlySum = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const debtMonthlySum = expectedMonthlySum - paidMonthlySum;
  const paymentRate = expectedMonthlySum > 0 ? ((paidMonthlySum / expectedMonthlySum) * 100).toFixed(1) : '0';

  const periodOptions = [
    { value: '06/2026', label: 'Tháng 06/2026' },
    { value: '05/2026', label: 'Tháng 05/2026' }
  ];

  const branchOptions = [
    { value: 'all', label: 'Tất cả chi nhánh' },
    { value: 'b1', label: 'Chi nhánh Q1' },
    { value: 'b2', label: 'Chi nhánh Thủ Đức' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'pending', label: 'Chờ thanh toán' },
    { value: 'overdue', label: 'Quá hạn' }
  ];

  return (
    <div className="space-y-6 text-[#1b1c1c] font-body-md relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline-md text-2xl text-[#5a462d] font-semibold">Hóa đơn định kỳ</h2>
          <p className="text-[#5e5f5d] text-sm mt-1">Quản lý và chốt chỉ số điện/nước hàng tháng</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={periodOptions}
            theme="accountant"
            className="w-48"
            triggerClassName="h-14 bg-[#F5F2EE] border-none rounded-2xl"
          />
          <CustomSelect
            value={selectedBranch}
            onChange={setSelectedBranch}
            options={branchOptions}
            theme="accountant"
            className="w-44"
            triggerClassName="h-14 bg-[#F5F2EE] border-none rounded-2xl"
          />
          <CustomSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statusOptions}
            theme="accountant"
            className="w-48"
            triggerClassName="h-14 bg-[#F5F2EE] border-none rounded-2xl"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm">
          <h3 className="font-headline-sm text-sm text-[#5e5f5d] font-bold uppercase tracking-wider mb-1">Dự kiến tháng</h3>
          <p className="text-3xl font-semibold tabular-nums text-[#1b1c1c]">{expectedMonthlySum.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm border-b-4 border-b-[#2E7D32]">
          <h3 className="font-headline-sm text-sm text-[#2E7D32] font-bold uppercase tracking-wider mb-1">Đã thu</h3>
          <p className="text-3xl font-semibold tabular-nums text-[#1b1c1c]">{paidMonthlySum.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm border-b-4 border-b-[#ba1a1a]">
          <h3 className="font-headline-sm text-sm text-[#ba1a1a] font-bold uppercase tracking-wider mb-1">Còn nợ</h3>
          <p className="text-3xl font-semibold tabular-nums text-[#1b1c1c]">{debtMonthlySum.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-white border border-[#d1c4b9] p-4 rounded-lg shadow-sm">
          <h3 className="font-headline-sm text-sm text-[#5e5f5d] font-bold uppercase tracking-wider mb-1">Tỷ lệ thanh toán</h3>
          <p className="text-3xl font-semibold tabular-nums text-[#1b1c1c]">{paymentRate} %</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#d1c4b9] rounded-lg">
        <div className="flex border-b border-[#d1c4b9]">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'input' ? 'border-[#5a462d] text-[#5a462d]' : 'border-transparent text-[#5e5f5d] hover:text-[#5a462d]'
            }`}
          >
            Lập hóa đơn định kỳ
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'list' ? 'border-[#5a462d] text-[#5a462d]' : 'border-transparent text-[#5e5f5d] hover:text-[#5a462d]'
            }`}
          >
            Danh sách hóa đơn
          </button>
        </div>

        {/* Tab 1: Input Page */}
        {activeTab === 'input' && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Left Col: active contracts list */}
            <div className="lg:col-span-4 border-r border-transparent lg:border-[#d1c4b9] pr-0 lg:pr-6 space-y-4">
              <div>
                <h3 className="font-bold text-[#5a462d] text-sm mb-1 font-headline-sm">Hợp đồng chờ thanh toán</h3>
                <p className="text-xs text-[#5e5f5d]">Chọn một hợp đồng đang hoạt động để tiến hành lập hóa đơn.</p>
              </div>

              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5e5f5d]">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={contractSearchQuery}
                  onChange={(e) => setContractSearchQuery(e.target.value)}
                  placeholder="Tìm khách hàng, phòng..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-[#d1c4b9] rounded text-xs focus:outline-none focus:border-[#5a462d] w-full"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredContracts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedContractId(c.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                      selectedContractId === c.id
                        ? 'border-[#5a462d] bg-[#fbf9f8] shadow-sm'
                        : 'border-[#d1c4b9] hover:bg-[#fff8f3] hover:border-[#5a462d]/50 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-[#5a462d]">{formatShortId(c.id)}</span>
                      <span className="text-[10px] bg-[#e4e2e1] text-[#4e453d] font-bold px-1.5 py-0.5 rounded">Tháng {c.period}</span>
                    </div>
                    <h4 className="font-semibold text-sm mt-1 text-[#1b1c1c]">{c.customer_name}</h4>
                    <div className="flex justify-between text-xs text-[#5e5f5d] mt-2 font-mono">
                      <span>{c.room_name}</span>
                      <span className="font-bold text-[#5a462d]">{c.rent_price.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                ))}
                {filteredContracts.length === 0 && (
                  <p className="text-center text-xs text-[#5e5f5d] py-6">Không tìm thấy hợp đồng nào.</p>
                )}
              </div>
            </div>

            {/* Right Col: contract periodic billing details */}
            <div className="lg:col-span-8 space-y-6">
              {selectedContract ? (
                <form onSubmit={handleCreateMonthlyInvoice} className="space-y-6">
                  {/* Warning Banner for unconfirmed incidentals */}
                  {hasUnconfirmedIncidentals && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2.5 animate-fade-in">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-amber-900 text-sm">Khoản phí phát sinh chưa xác nhận</h5>
                          <p className="font-body-md text-amber-800 text-xs mt-0.5">
                            Hệ thống ghi nhận có khoản phí phát sinh chưa được kế toán xác nhận trước khi lập hóa đơn định kỳ.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={handleConfirmAllIncidentals}
                          className="px-3 py-1 bg-amber-700 text-white rounded font-bold hover:opacity-90 transition cursor-pointer"
                        >
                          Xác nhận tất cả
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contract info card */}
                  <div className="bg-[#FAF9F6] border border-[#d1c4b9] p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-[#5a462d] mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="font-bold text-sm uppercase tracking-wide font-label-caps">Chi tiết hợp đồng</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[#5e5f5d] block">Khách thuê đại diện</span>
                        <span className="font-semibold text-sm text-[#1b1c1c]">{selectedContract.customer_name}</span>
                      </div>
                      <div>
                        <span className="text-[#5e5f5d] block">Mã phòng/giường</span>
                        <span className="font-semibold text-sm text-[#1b1c1c]">{selectedContract.room_name}</span>
                      </div>
                      <div>
                        <span className="text-[#5e5f5d] block">Kỳ thanh toán</span>
                        <span className="font-semibold text-sm text-[#1b1c1c] font-mono">Tháng {selectedPeriod}</span>
                      </div>
                      <div>
                        <span className="text-[#5e5f5d] block">Tiền phòng định kỳ</span>
                        <span className="font-semibold text-sm text-[#5a462d] font-mono">{rentAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>

                  {/* Utility readings form */}
                  <div className="border border-[#d1c4b9] rounded-xl p-4 space-y-4">
                    <h4 className="font-bold text-[#5a462d] text-sm border-b border-[#e4e2e1] pb-2">Chốt chỉ số sử dụng (Điện & Nước)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Electricity section */}
                      <div className="space-y-3 bg-[#fbf9f8] p-3 rounded-lg border border-[#eee7e1]">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-[#7f756b]">Điện sinh hoạt (kWh)</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-[#5e5f5d] mb-1 font-bold">Chỉ số cũ</label>
                            <input
                              type="number"
                              value={elecOld}
                              readOnly
                              className="w-full bg-[#e4e2e1] text-[#5e5f5d] border border-[#d1c4b9] rounded py-1 px-2.5 text-right font-mono text-xs cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-[#5a462d] mb-1 font-bold">Chỉ số mới</label>
                            <input
                              type="number"
                              value={elecNew}
                              onChange={(e) => setElecNew(parseInt(e.target.value) || 0)}
                              className="w-full bg-white text-[#1b1c1c] border border-[#d1c4b9] rounded py-1 px-2.5 text-right font-mono text-xs focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-[#eee7e1] text-[#5e5f5d]">
                          <span>Tiêu thụ: <strong className="font-mono text-[#1b1c1c]">{elecUse} kWh</strong></span>
                          <span>Đơn giá: <strong className="font-mono text-[#1b1c1c]">3,500đ</strong></span>
                        </div>
                        <div className="text-right text-xs font-bold text-[#5a462d] font-mono">
                          Thành tiền: {elecCost.toLocaleString('vi-VN')} đ
                        </div>
                      </div>

                      {/* Water section */}
                      <div className="space-y-3 bg-[#fbf9f8] p-3 rounded-lg border border-[#eee7e1]">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-[#7f756b]">Nước sinh hoạt (m³)</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-[#5e5f5d] mb-1 font-bold">Chỉ số cũ</label>
                            <input
                              type="number"
                              value={waterOld}
                              readOnly
                              className="w-full bg-[#e4e2e1] text-[#5e5f5d] border border-[#d1c4b9] rounded py-1 px-2.5 text-right font-mono text-xs cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-[#5a462d] mb-1 font-bold">Chỉ số mới</label>
                            <input
                              type="number"
                              value={waterNew}
                              onChange={(e) => setWaterNew(parseInt(e.target.value) || 0)}
                              className="w-full bg-white text-[#1b1c1c] border border-[#d1c4b9] rounded py-1 px-2.5 text-right font-mono text-xs focus:ring-1 focus:ring-[#5a462d] focus:border-[#5a462d]"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-[#eee7e1] text-[#5e5f5d]">
                          <span>Tiêu thụ: <strong className="font-mono text-[#1b1c1c]">{waterUse} m³</strong></span>
                          <span>Đơn giá: <strong className="font-mono text-[#1b1c1c]">15,000đ</strong></span>
                        </div>
                        <div className="text-right text-xs font-bold text-[#5a462d] font-mono">
                          Thành tiền: {waterCost.toLocaleString('vi-VN')} đ
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registered services list */}
                  <div className="border border-[#d1c4b9] rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-[#5a462d] text-sm border-b border-[#e4e2e1] pb-2">Phí dịch vụ cố định đã đăng ký</h4>
                    <div className="space-y-1.5 text-xs">
                      {subscriptions.map((s) => (
                        <div key={s.id} className="flex justify-between items-center py-1 border-b border-[#f0eded] border-dashed">
                          <span className="text-[#1b1c1c]">{s.service_name}</span>
                          <span className="font-mono font-bold text-[#4e453d]">{s.monthly_cost.toLocaleString('vi-VN')} đ</span>
                        </div>
                      ))}
                      {subscriptions.length === 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-[#f0eded] border-dashed">
                          <span className="text-[#1b1c1c]">Dịch vụ mặc định (Wifi, Rác)</span>
                          <span className="font-mono font-bold text-[#4e453d]">150.000 đ</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 font-bold text-[#5a462d]">
                        <span>Tổng tiền dịch vụ:</span>
                        <span className="font-mono">{servicesCost.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>

                  {/* Incidental fees section (UC 5) */}
                  <div className="border border-[#d1c4b9] rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-[#e4e2e1] pb-2">
                      <h4 className="font-bold text-[#5a462d] text-sm">Khoản phí phát sinh thêm trong kỳ</h4>
                      <button
                        type="button"
                        onClick={handleAddIncidental}
                        className="text-xs bg-[#5a462d]/10 hover:bg-[#5a462d]/20 text-[#5a462d] font-bold py-1 px-2.5 rounded transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm khoản phí
                      </button>
                    </div>

                    <div className="space-y-2">
                      {incidentals.map((inc) => (
                        <div
                          key={inc.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                            inc.confirmed 
                              ? 'bg-white border-[#d1c4b9]' 
                              : 'bg-amber-50/50 border-amber-300'
                          }`}
                        >
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-2">
                              {!inc.confirmed && (
                                <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider shrink-0 mr-1.5">Chưa xác nhận</span>
                              )}
                              <span className="font-sans font-bold text-[#1b1c1c] text-xs">{inc.name}</span>
                            </div>
                            <div className="text-[10px] text-[#5e5f5d] font-mono flex items-center gap-3">
                              <span>Mã: <strong className="text-[#5a462d]">{formatShortId(inc.id)}</strong></span>
                              <span className="text-[#d1c4b9]">•</span>
                              <span>Ngày sự cố: <strong>{inc.dateRecorded || new Date().toISOString().split('T')[0]}</strong></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-[#5a462d] text-xs font-mono">{inc.amount.toLocaleString('vi-VN')} đ</span>
                            {!inc.confirmed && (
                              <button
                                type="button"
                                onClick={() => handleConfirmIncidental(inc.id)}
                                className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                Xác nhận
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteIncidental(inc.id)}
                              className="text-error hover:bg-error/10 p-1.5 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {incidentals.length === 0 && (
                        <p className="text-center text-xs text-[#5e5f5d] py-2 font-sans">Không có khoản phí phát sinh nào.</p>
                      )}
                    </div>
                  </div>

                  {/* Summary cost calculation breakdown & Submit */}
                  <div className="bg-[#FAF9F6] border border-[#d1c4b9] rounded-xl p-5 space-y-4 shadow-sm">
                    <h4 className="font-bold text-sm text-[#5a462d]">Tổng hợp hóa đơn định kỳ</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#5e5f5d]">Tiền phòng:</span>
                        <span className="font-mono text-[#1b1c1c]">{rentAmount.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5e5f5d]">Tiền điện nước:</span>
                        <span className="font-mono text-[#1b1c1c]">{(elecCost + waterCost).toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5e5f5d]">Tiền dịch vụ đã đăng ký:</span>
                        <span className="font-mono text-[#1b1c1c]">{servicesCost.toLocaleString('vi-VN')} đ</span>
                      </div>
                      {incidentalsCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[#5e5f5d]">Phí phát sinh trong kỳ:</span>
                          <span className="font-mono text-[#ba1a1a]">+{incidentalsCost.toLocaleString('vi-VN')} đ</span>
                        </div>
                      )}
                      <div className="h-px bg-[#d1c4b9] my-2"></div>
                      <div className="flex justify-between items-center text-sm font-bold text-[#5a462d]">
                        <span>Tổng tiền cần thanh toán:</span>
                        <span className="text-lg font-mono">{totalCost.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedContractId('')}
                        className="border border-[#5a462d] text-[#5a462d] bg-transparent font-semibold py-2 px-4 rounded text-sm hover:bg-[#735d43] hover:text-[#f5d8b7] transition-colors cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                      <button
                        type="submit"
                        className="bg-[#5a462d] text-white font-bold py-2 px-5 rounded text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Receipt className="w-4 h-4" />
                        Lập hóa đơn định kỳ
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-[#faf2ec]/50 border border-dashed border-[#d1c4b9] rounded-2xl">
                  <div className="p-4 bg-[#5a462d]/10 rounded-2xl text-[#5a462d] mb-4 flex items-center justify-center">
                    <Receipt className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1e1b17] mb-1 font-headline-sm">Chưa chọn hợp đồng</h4>
                  <p className="text-xs text-[#5e5f5d] max-w-sm">
                    Vui lòng chọn một hợp đồng trong danh sách bên trái để kiểm tra chỉ số sử dụng và tiến hành lập hóa đơn định kỳ.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Invoices List */}
        {activeTab === 'list' && (
          <div className="p-4 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-semibold text-[#5a462d] text-sm">Danh sách hóa đơn tháng {selectedPeriod}</h3>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5e5f5d]">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm khách hàng, phòng..."
                  className="pl-8 pr-3 py-1 bg-white border border-[#d1c4b9] rounded text-xs focus:outline-none focus:border-[#5a462d] w-48"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-[#d1c4b9] rounded">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#e4e2e1] text-[#4e453d] font-label-caps text-[11px] font-bold uppercase tracking-wider border-b border-[#d1c4b9]">
                    <th className="p-3">Mã HĐ</th>
                    <th className="p-3">Khách hàng</th>
                    <th className="p-3">Phòng</th>
                    <th className="p-3 text-right">Tiền phòng</th>
                    <th className="p-3 text-right">Điện (VND)</th>
                    <th className="p-3 text-right">Nước (VND)</th>
                    <th className="p-3 text-right">Tổng (VND)</th>
                    <th className="p-3 text-center">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1c4b9] font-mono text-xs">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#f6f3f2] cursor-pointer" onClick={() => { setSelectedInvoice(inv); setDrawerOpen(true); }}>
                      <td className="p-3 font-bold text-[#5a462d]" title={inv.id}>
                        {formatShortId(inv.id)}
                      </td>
                      <td className="p-3 font-sans font-medium text-[#1b1c1c]">{inv.customer_name}</td>
                      <td className="p-3 font-sans text-[#4e453d]">{inv.room_name}</td>
                      <td className="p-3 text-right">{inv.rent_amount.toLocaleString('vi-VN')}</td>
                      <td className="p-3 text-right">{inv.electricity_cost.toLocaleString('vi-VN')}</td>
                      <td className="p-3 text-right">{inv.water_cost.toLocaleString('vi-VN')}</td>
                      <td className="p-3 text-right font-bold text-[#1b1c1c]">{inv.total.toLocaleString('vi-VN')}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'paid' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                          inv.status === 'pending' ? 'bg-[#FFF3E0] text-[#E65100]' :
                          'bg-[#ffdad6] text-[#93000a]'
                        }`}>
                          {inv.status === 'paid' ? 'Đã thu' :
                           inv.status === 'pending' ? 'Chờ TT' : 'Quá hạn'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => handleConfirmPayment(inv.id)}
                              className="px-2 py-0.5 bg-[#2E7D32] text-white rounded text-[10px] font-semibold hover:opacity-90 cursor-pointer"
                            >
                              Thu tiền
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedInvoice(inv); setDrawerOpen(true); }}
                            className="p-1 hover:bg-[#e4e2e1] rounded text-[#5e5f5d] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#5e5f5d] font-sans">
                        Không tìm thấy hóa đơn định kỳ nào trong kỳ này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Drawer: Detailed Invoice Details */}
      {drawerOpen && selectedInvoice && (
        <>
          {/* Overlay backdrop */}
          <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          
          <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white border-l border-[#d1c4b9] shadow-2xl z-50 flex flex-col justify-between animate-slide-left">
            <div className="p-6 border-b border-[#d1c4b9] flex justify-between items-center bg-[#fbf9f8]">
              <div>
                <h3 className="font-headline-sm text-base text-[#5a462d] font-bold">Chi tiết Hóa đơn</h3>
                <p className="font-mono text-xs text-[#5e5f5d] mt-1">#{formatShortId(selectedInvoice.id)}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-[#5e5f5d] hover:bg-[#e4e2e1] rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-[11px] text-[#5a462d] font-bold uppercase tracking-wider">Trạng thái</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  selectedInvoice.status === 'paid' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                  selectedInvoice.status === 'pending' ? 'bg-[#FFF3E0] text-[#E65100]' :
                  'bg-[#ffdad6] text-[#93000a]'
                }`}>
                  {selectedInvoice.status === 'paid' ? 'Đã thanh toán' :
                   selectedInvoice.status === 'pending' ? 'Chờ thanh toán' : 'Quá hạn'}
                </span>
              </div>

              <div className="border-t border-[#d1c4b9] pt-4">
                <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider font-label-caps">Thông tin phòng</h4>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-[#5e5f5d]">Phòng:</div>
                  <div className="text-right font-bold text-[#1b1c1c]">{selectedInvoice.room_name}</div>
                  <div className="text-[#5e5f5d]">Khách thuê:</div>
                  <div className="text-right text-[#1b1c1c]">{selectedInvoice.customer_name}</div>
                  <div className="text-[#5e5f5d]">Kỳ thanh toán:</div>
                  <div className="text-right text-[#1b1c1c]">Tháng {selectedInvoice.period}</div>
                </div>
              </div>

              <div className="border-t border-[#d1c4b9] pt-4">
                <h4 className="font-label-caps text-[11px] text-[#5a462d] mb-2 font-bold uppercase tracking-wider font-label-caps">Chi tiết phí</h4>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-sm">
                    <span className="font-sans font-medium text-[#1b1c1c]">Tiền phòng:</span>
                    <span>{selectedInvoice.rent_amount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="pl-3 border-l-2 border-[#d1c4b9] space-y-1 text-[#5e5f5d]">
                    <div className="flex justify-between">
                      <span>Điện ({selectedInvoice.electricity_kwh} kWh x 3,500):</span>
                      <span>{selectedInvoice.electricity_cost.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nước ({selectedInvoice.water_m3} m³ x 15,000):</span>
                      <span>{selectedInvoice.water_cost.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dịch vụ khác:</span>
                      <span>{selectedInvoice.services_cost.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#f0eded] border border-[#d1c4b9] rounded flex justify-between items-center">
                <span className="font-bold text-[#1b1c1c]">Tổng cộng:</span>
                <span className="text-xl font-bold text-[#5a462d] font-mono">{selectedInvoice.total.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>

            <div className="p-6 border-t border-[#d1c4b9] flex gap-3 bg-[#fbf9f8]">
              <button className="flex-1 border border-[#5a462d] text-[#5a462d] py-2 rounded text-sm font-semibold bg-transparent hover:bg-[#e4e2e1] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Printer className="w-4 h-4" />
                In PDF
              </button>
              {selectedInvoice.status === 'pending' && (
                <button
                  onClick={() => handleConfirmPayment(selectedInvoice.id)}
                  className="flex-1 bg-[#5a462d] text-[#ffffff] py-2 rounded text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Ghi nhận TT
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {/* Modal: Thêm khoản phí phát sinh */}
      {showAddIncidentalModal && (
        <>
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-black/45 z-50 backdrop-blur-sm transition-all duration-300"
            onClick={() => setShowAddIncidentalModal(false)}
          />
          
          {/* Modal Container */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-[#d1c4b9] rounded-3xl shadow-2xl z-[60] overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="p-6 border-b border-[#e4e2e1] flex justify-between items-center bg-[#faf2ec]/50">
              <div>
                <h3 className="text-sm text-[#5a462d] font-bold font-headline-sm uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Chi phí phát sinh
                </h3>
                <p className="text-xs text-[#5e5f5d] mt-1 font-sans">Thêm mới khoản chi phí phát sinh / phạt trong kỳ</p>
              </div>
              <button 
                onClick={() => setShowAddIncidentalModal(false)} 
                className="p-1.5 text-[#5e5f5d] hover:bg-[#e4e2e1] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitIncidental} className="p-6 space-y-4 text-xs font-sans">
              {/* Row 1: Chọn Loại chi phí (Dropdown đồng bộ) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#4e453c] uppercase tracking-wider">
                  Loại chi phí phát sinh <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={selectedIncidentalType}
                  onChange={handleIncidentalTypeChange}
                  options={STANDARD_INCIDENTALS}
                  theme="accountant"
                  pill={true}
                  dropdownClassName="z-[70]"
                />
              </div>

              {/* Tên chi phí tùy chỉnh (chỉ hiển thị khi chọn 'Khác') */}
              {selectedIncidentalType === 'other' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="block text-xs font-bold text-[#4e453c] uppercase tracking-wider">
                    Tên chi phí khác <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newIncidentalName}
                    onChange={(e) => setNewIncidentalName(e.target.value)}
                    placeholder="Nhập mô tả chi tiết chi phí..."
                    className="w-full bg-[#fbf9f8] border border-[#d1c4b9] rounded-24 py-3 px-5 text-xs focus:outline-none focus:ring-2 focus:border-[#5a462d] focus:ring-[#5a462d]/10 text-[#1e1b17]"
                  />
                </div>
              )}

              {/* Row 2: Mã chi phí */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#4e453c] uppercase tracking-wider">
                  Mã chi phí <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={selectedIncidentalType !== 'other'}
                  value={newIncidentalCode}
                  onChange={(e) => setNewIncidentalCode(e.target.value)}
                  placeholder="Ví dụ: CPPS-1021"
                  className="w-full bg-[#fbf9f8] border border-[#d1c4b9] rounded-24 py-3 px-5 text-xs focus:outline-none focus:ring-2 focus:border-[#5a462d] focus:ring-[#5a462d]/10 text-[#1e1b17] font-mono disabled:opacity-60 disabled:bg-[#f3ede8]"
                />
              </div>

              {/* Row 3: Số tiền phạt */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#4e453c] uppercase tracking-wider">
                  Số tiền phạt (đ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  disabled={selectedIncidentalType !== 'other'}
                  value={newIncidentalAmount || ''}
                  onChange={(e) => setNewIncidentalAmount(parseInt(e.target.value) || 0)}
                  placeholder="Nhập số tiền..."
                  className="w-full bg-[#fbf9f8] border border-[#d1c4b9] rounded-24 py-3 px-5 text-xs focus:outline-none focus:ring-2 focus:border-[#5a462d] focus:ring-[#5a462d]/10 text-[#1e1b17] font-mono disabled:opacity-60 disabled:bg-[#f3ede8]"
                />
              </div>

              {/* Row 4: Trạng thái & Ngày ghi nhận sự cố */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#4e453c] uppercase tracking-wider">
                    Trạng thái <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={newIncidentalStatus}
                    onChange={(val) => setNewIncidentalStatus(val)}
                    options={[
                      { value: 'pending', label: 'Chưa xác nhận' },
                      { value: 'confirmed', label: 'Đã xác nhận' }
                    ]}
                    theme="accountant"
                    pill={true}
                    dropdownClassName="z-[70]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#4e453c] uppercase tracking-wider">
                    Ngày ghi nhận sự cố <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newIncidentalDate}
                    onChange={(e) => setNewIncidentalDate(e.target.value)}
                    className="w-full bg-[#fbf9f8] border border-[#d1c4b9] rounded-24 py-2.5 px-4 text-xs focus:outline-none focus:ring-2 focus:border-[#5a462d] focus:ring-[#5a462d]/10 text-[#1e1b17] font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#e4e2e1]">
                <button
                  type="button"
                  onClick={() => setShowAddIncidentalModal(false)}
                  className="flex-1 border border-[#d1c4b9] text-[#4e453c] hover:bg-[#e4e2e1]/30 py-3 rounded-24 text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#5a462d] text-white hover:opacity-90 py-3 rounded-24 text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  Xác nhận thêm
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
