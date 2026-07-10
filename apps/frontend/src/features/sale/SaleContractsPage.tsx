import { useState, useEffect, useCallback } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import DepositPendingList from './components/DepositPendingList';
import ContractFormEditor from './components/ContractFormEditor';
import ContractSuccessModal from './components/ContractSuccessModal';
import ContractListView, { DraftContract } from './components/ContractListView';
import DraftToast from './components/DraftToast';
import {
  fetchEligibleDepositsApi,
  fetchSaleContractsApi,
  createSaleContractApi,
  EligibleDeposit,
} from './services/sale.service';

// ─── Type Definitions (giữ nguyên để các component con import) ────────────────

export interface TenantMember {
  name: string;
  cccd: string;
  phone: string;
  email?: string;
  role: 'representative' | 'member';
}

export interface DepositRecord {
  id: string;
  depositCode: string;
  depositDate: string;
  depositAmount: number;
  // Customer info
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCCCD: string;
  customerAddress: string;
  // Room info
  roomCode: string;
  roomType: string;
  branch: string;
  roomMonthlyRent: number;
  // Group info
  rentalType?: 'individual' | 'group';
  tenants?: TenantMember[];
  roomCapacity?: number;
}

export interface ContractFormData {
  depositId: string;
  customerId: string;
  roomCode: string;
  startDate: string;
  endDate: string;
  contractType: 'long_term' | 'short_term';
  rentPrice: number;
  paymentCycle: '1_month' | '3_months' | '6_months';
  terms: string;
  notes: string;
}

export interface CreatedContract {
  contractCode: string;
  invoiceCode: string;
  handoverCode: string;
  customerName: string;
  roomCode: string;
  branch: string;
  startDate: string;
}

// ─── Helpers: map dữ liệu THẬT từ backend → cấu trúc UI ──────────────────────

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN');
};

// Cọc đủ điều kiện (backend) → DepositRecord. Một số trường không có trong schema thật
// (email, CCCD, địa chỉ, nhóm khách) → để rỗng, form sẽ hiển thị "—" thay vì dữ liệu giả.
const toDepositRecord = (d: EligibleDeposit): DepositRecord => ({
  id: d.id,
  depositCode: d.id,
  depositDate: formatDate(d.deposit_date),
  depositAmount: d.amount,
  customerId: d.customer_id,
  customerName: d.customer_name,
  customerPhone: d.customer_phone,
  customerEmail: '',
  customerCCCD: '',
  customerAddress: '',
  roomCode: d.room_name,
  roomType: d.room_type || (d.deposit_type === 'bed' ? `Giường ${d.bed_name}`.trim() : 'Phòng'),
  branch: (d.branch_name || '').replace('Chi nhánh ', ''),
  roomMonthlyRent: d.room_monthly_rent,
  rentalType: 'individual',
});

// Hợp đồng thật (GET /sale/contracts) → CreatedContract cho danh sách "Hợp đồng đã lập".
// Lưu ý: sale-contract.repo trả dữ liệu LỒNG NHAU (deposit_requests → rooms/branches,
// rental_registrations → customers), không phẳng như /manager/deposits.
const toCreatedContract = (c: any): CreatedContract => {
  const dep = c.deposit_requests || {};
  const room = dep.rooms || {};
  const customer = dep.rental_registrations?.customers || {};
  return {
    contractCode: c.contract_code || c.id || '—',
    invoiceCode: '',
    handoverCode: '',
    customerName: customer.full_name || 'Khách thuê',
    roomCode: room.name || dep.room_id || '—',
    branch: (room.branches?.name || '').replace('Chi nhánh ', ''),
    startDate: formatDate(c.start_date),
  };
};

function getCurrentTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
    ' – ' + new Date().toLocaleDateString('vi-VN');
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type PageState = 'list' | 'form' | 'success' | 'contracts';
type ContractListTab = 'contracts' | 'drafts';

export default function SaleContractsPage() {
  const [pageState, setPageState] = useState<PageState>('list');
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRecord | null>(null);
  const [createdContract, setCreatedContract] = useState<CreatedContract | null>(null);
  const [completedDepositIds, setCompletedDepositIds] = useState<string[]>([]);
  const [completedContracts, setCompletedContracts] = useState<CreatedContract[]>([]);
  const [draftContracts, setDraftContracts] = useState<DraftContract[]>([]);
  const [showDraftToast, setShowDraftToast] = useState(false);
  const [contractListTab, setContractListTab] = useState<ContractListTab>('contracts');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Tải cọc đủ điều kiện + hợp đồng đã lập từ backend thật.
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [eligible, contracts] = await Promise.all([
        fetchEligibleDepositsApi(),
        fetchSaleContractsApi(),
      ]);
      setDeposits(eligible.map(toDepositRecord));
      setCompletedContracts((contracts as any[]).map(toCreatedContract));
    } catch (err: any) {
      setLoadError(err?.response?.data?.message || err?.message || 'Lỗi khi tải dữ liệu hợp đồng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingDeposits = deposits.filter((d) => !completedDepositIds.includes(d.id));

  const handleSelectDeposit = (deposit: DepositRecord) => {
    setSelectedDeposit(deposit);
    setSubmitError(null);
    setPageState('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitContract = async (data: ContractFormData) => {
    if (!selectedDeposit) return;
    setSubmitError(null);
    try {
      const created = await createSaleContractApi({
        deposit_id: selectedDeposit.id,
        start_date: data.startDate,
        end_date: data.endDate,
        rent_amount: data.rentPrice,
        contract_type: data.contractType,
        payment_cycle: data.paymentCycle,
      });
      const contract: CreatedContract = {
        contractCode: created?.contract_code || '—',
        invoiceCode: '',
        handoverCode: '',
        customerName: selectedDeposit.customerName,
        roomCode: selectedDeposit.roomCode,
        branch: selectedDeposit.branch,
        startDate: data.startDate ? new Date(data.startDate).toLocaleDateString('vi-VN') : '—',
      };
      setCreatedContract(contract);
      setCompletedContracts((prev) => [contract, ...prev]);
      setCompletedDepositIds((prev) => [...prev, selectedDeposit.id]);
      setDraftContracts((prev) => prev.filter((d) => d.depositCode !== selectedDeposit.depositCode));
      setPageState('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Lỗi khi lập hợp đồng. Vui lòng thử lại.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveDraft = (data: ContractFormData) => {
    if (!selectedDeposit) return;
    const draft: DraftContract = {
      id: `draft-${selectedDeposit.id}-${Date.now()}`,
      depositCode: selectedDeposit.depositCode,
      customerName: selectedDeposit.customerName,
      roomCode: selectedDeposit.roomCode,
      branch: selectedDeposit.branch,
      savedAt: getCurrentTime(),
      rentPrice: data.rentPrice ?? selectedDeposit.roomMonthlyRent,
      contractType: data.contractType ?? 'long_term',
      startDate: data.startDate ?? '',
    };
    setDraftContracts((prev) => {
      const filtered = prev.filter((d) => d.depositCode !== selectedDeposit.depositCode);
      return [draft, ...filtered];
    });
    setShowDraftToast(true);
  };

  const handleCloseSuccess = () => {
    setSelectedDeposit(null);
    setCreatedContract(null);
    setPageState('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewContracts = (tab: ContractListTab = 'contracts') => {
    setContractListTab(tab);
    setPageState('contracts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDraft = (draftId: string) => {
    setDraftContracts((prev) => prev.filter((d) => d.id !== draftId));
  };

  const handleResumeDraft = (draftId: string) => {
    const draft = draftContracts.find((d) => d.id === draftId);
    if (!draft) return;
    const deposit = deposits.find((d) => d.depositCode === draft.depositCode);
    if (deposit) {
      setSelectedDeposit(deposit);
      setPageState('form');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Submit error toast ── */}
      {submitError && (
        <div className="fixed top-6 right-6 z-[90] flex items-center gap-3 rounded-2xl border border-[#f4b4ae] bg-white px-5 py-3 shadow-xl">
          <XCircle className="h-5 w-5 text-[#ba1a1a] shrink-0" />
          <p className="text-sm font-semibold text-[#93000a]">{submitError}</p>
          <button onClick={() => setSubmitError(null)} className="text-[#9d8879] hover:text-[#6f583c] text-xs font-bold">Đóng</button>
        </div>
      )}

      {/* ── Deposit pending list ── */}
      {pageState === 'list' && (
        loading ? (
          <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm p-16 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-[#6f583c] animate-spin mb-3" />
            <p className="text-sm text-[#4e453c]">Đang tải danh sách phiếu cọc...</p>
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-2xl border border-[#f4b4ae] shadow-sm p-16 text-center">
            <XCircle className="w-10 h-10 mx-auto text-[#ba1a1a] mb-3" />
            <p className="text-[#93000a] font-semibold">{loadError}</p>
            <button
              onClick={loadData}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#6f583c] text-white text-sm font-bold rounded-xl hover:bg-[#5c4830] transition cursor-pointer active:scale-95"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <DepositPendingList
            deposits={pendingDeposits}
            onSelect={handleSelectDeposit}
            staffBranch="Tất cả chi nhánh"
            onViewContracts={() => handleViewContracts('contracts')}
          />
        )
      )}

      {/* ── Contract form editor ── */}
      {pageState === 'form' && selectedDeposit && (
        <ContractFormEditor
          deposit={selectedDeposit}
          onBack={() => {
            setPageState('list');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSubmit={handleSubmitContract}
          onSaveDraft={handleSaveDraft}
        />
      )}

      {/* ── Success state: list in background + modal on top ── */}
      {pageState === 'success' && createdContract && (
        <>
          <DepositPendingList
            deposits={pendingDeposits}
            onSelect={handleSelectDeposit}
            staffBranch="Tất cả chi nhánh"
            onViewContracts={() => handleViewContracts('contracts')}
          />
          <ContractSuccessModal
            {...createdContract}
            onClose={handleCloseSuccess}
            onViewContracts={() => handleViewContracts('contracts')}
            onPrint={() => window.print()}
          />
        </>
      )}

      {/* ── Contracts & Drafts list view ── */}
      {pageState === 'contracts' && (
        <ContractListView
          completedContracts={completedContracts}
          draftContracts={draftContracts}
          activeTab={contractListTab}
          onBack={() => setPageState('list')}
          onNewContract={() => setPageState('list')}
          onResumeDraft={handleResumeDraft}
          onDeleteDraft={handleDeleteDraft}
        />
      )}

      {/* ── Custom draft toast (global, above all) ── */}
      <DraftToast
        show={showDraftToast}
        onClose={() => setShowDraftToast(false)}
        onViewDrafts={() => handleViewContracts('drafts')}
      />
    </div>
  );
}
