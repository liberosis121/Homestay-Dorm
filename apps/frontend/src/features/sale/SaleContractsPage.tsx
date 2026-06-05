import { useState } from 'react';
import DepositPendingList from './components/DepositPendingList';
import ContractFormEditor from './components/ContractFormEditor';
import ContractSuccessModal from './components/ContractSuccessModal';
import ContractListView, { DraftContract } from './components/ContractListView';
import DraftToast from './components/DraftToast';

// ─── Type Definitions ────────────────────────────────────────────────────────

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

// ─── Simulated current staff session ─────────────────────────────────────────
// Trong thực tế, giá trị này lấy từ auth context / store (chi nhánh của nhân viên đang đăng nhập)
const STAFF_BRANCH = 'Quận 1';

// ─── Mock Data: 15 phiếu cọc đủ điều kiện ───────────────────────────────────

export const MOCK_DEPOSITS: DepositRecord[] = [
  {
    id: 'd1',
    depositCode: 'PC-2026-0041',
    depositDate: '01/05/2026',
    depositAmount: 6_000_000,
    customerId: 'c1',
    customerName: 'Nguyễn Hoàng Nam',
    customerPhone: '0902334556',
    customerEmail: 'nam.nh92@gmail.com',
    customerCCCD: '001092008712',
    customerAddress: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    roomCode: 'P1204-TTA',
    roomType: 'Studio Luxury',
    branch: 'Quận 1',
    roomMonthlyRent: 6_500_000,
    rentalType: 'individual',
    roomCapacity: 2,
  },
  {
    id: 'd2',
    depositCode: 'PC-2026-0042',
    depositDate: '03/05/2026',
    depositAmount: 5_000_000,
    customerId: 'c2',
    customerName: 'Trần Thị Mai Anh',
    customerPhone: '0912445667',
    customerEmail: 'maianh.tran@gmail.com',
    customerCCCD: '002195009876',
    customerAddress: '45 Phan Đình Phùng, Quận Phú Nhuận, TP.HCM',
    roomCode: 'P305-TGB',
    roomType: '1PN Tiêu Chuẩn',
    branch: 'Bình Thạnh',
    roomMonthlyRent: 5_200_000,
  },
  {
    id: 'd3',
    depositCode: 'PC-2026-0043',
    depositDate: '04/05/2026',
    depositAmount: 7_000_000,
    customerId: 'c3',
    customerName: 'Lê Văn Phúc',
    customerPhone: '0978556789',
    customerEmail: 'phuc.le@outlook.com',
    customerCCCD: '040012345678',
    customerAddress: '78 Đường 3/2, Quận 10, TP.HCM',
    roomCode: 'P502-GVP',
    roomType: 'Studio Premium',
    branch: 'Gò Vấp',
    roomMonthlyRent: 7_200_000,
  },
  {
    id: 'd4',
    depositCode: 'PC-2026-0044',
    depositDate: '05/05/2026',
    depositAmount: 4_500_000,
    customerId: 'c4',
    customerName: 'Phạm Thị Hương',
    customerPhone: '0909123987',
    customerEmail: 'huong.pham.hcm@gmail.com',
    customerCCCD: '075120009988',
    customerAddress: '12 Trần Não, Quận 2, TP.HCM',
    roomCode: 'P101-TDB',
    roomType: 'Studio Nhỏ',
    branch: 'Thủ Đức',
    roomMonthlyRent: 4_800_000,
  },
  {
    id: 'd5',
    depositCode: 'PC-2026-0045',
    depositDate: '06/05/2026',
    depositAmount: 8_000_000,
    customerId: 'c5',
    customerName: 'Hoàng Minh Tuấn',
    customerPhone: '0933667123',
    customerEmail: 'm.tuan.hoang@gmail.com',
    customerCCCD: '001099001234',
    customerAddress: '99 Nguyễn Đình Chiểu, Quận 3, TP.HCM',
    roomCode: 'P801-Q1A',
    roomType: '2PN Cao Cấp',
    branch: 'Quận 1',
    roomMonthlyRent: 8_500_000,
  },
  {
    id: 'd6',
    depositCode: 'PC-2026-0046',
    depositDate: '07/05/2026',
    depositAmount: 5_500_000,
    customerId: 'c6',
    customerName: 'Đinh Thị Lan',
    customerPhone: '0945887456',
    customerEmail: 'lan.dinh.2026@gmail.com',
    customerCCCD: '036201012345',
    customerAddress: '201 Cách Mạng Tháng 8, Quận Tân Bình, TP.HCM',
    roomCode: 'P210-BTH',
    roomType: 'Studio Tiêu Chuẩn',
    branch: 'Bình Thạnh',
    roomMonthlyRent: 5_700_000,
  },
  {
    id: 'd7',
    depositCode: 'PC-2026-0047',
    depositDate: '08/05/2026',
    depositAmount: 6_000_000,
    customerId: 'c7',
    customerName: 'Vũ Quang Huy',
    customerPhone: '0956112345',
    customerEmail: 'quanghuy.vu@yahoo.com',
    customerCCCD: '025890876543',
    customerAddress: '55 Hoa Lan, Quận Phú Nhuận, TP.HCM',
    roomCode: 'P407-PNH',
    roomType: '1PN Mới',
    branch: 'Phú Nhuận',
    roomMonthlyRent: 6_200_000,
  },
  {
    id: 'd8',
    depositCode: 'PC-2026-0048',
    depositDate: '09/05/2026',
    depositAmount: 4_000_000,
    customerId: 'c8',
    customerName: 'Bùi Thị Thanh Hoa',
    customerPhone: '0967334221',
    customerEmail: 'thanhHoa.bui@gmail.com',
    customerCCCD: '050112001456',
    customerAddress: '33 Nguyễn Thị Định, Quận 2, TP.HCM',
    roomCode: 'P603-TDC',
    roomType: 'Studio Compact',
    branch: 'Thủ Đức',
    roomMonthlyRent: 4_200_000,
  },
  {
    id: 'd9',
    depositCode: 'PC-2026-0049',
    depositDate: '10/05/2026',
    depositAmount: 9_000_000,
    customerId: 'c9',
    customerName: 'Ngô Văn Tâm',
    customerPhone: '0912008765',
    customerEmail: 'v.tam.ngo@gmail.com',
    customerCCCD: '001201234567',
    customerAddress: '7 Đinh Tiên Hoàng, Quận Bình Thạnh, TP.HCM',
    roomCode: 'P1105-Q1P',
    roomType: 'Penthouse 2PN',
    branch: 'Quận 1',
    roomMonthlyRent: 9_800_000,
    rentalType: 'group',
    roomCapacity: 4,
    tenants: [
      {
        name: 'Ngô Văn Tâm',
        cccd: '001201234567',
        phone: '0912008765',
        email: 'v.tam.ngo@gmail.com',
        role: 'representative',
      },
      {
        name: 'Trần Minh Khoa',
        cccd: '079203456789',
        phone: '0908111222',
        email: 'khoa.tran@gmail.com',
        role: 'member',
      },
      {
        name: 'Lê Thảo Vy',
        cccd: '052204567890',
        phone: '0933444555',
        email: 'thao.vy@gmail.com',
        role: 'member',
      },
    ],
  },
  {
    id: 'd10',
    depositCode: 'PC-2026-0050',
    depositDate: '11/05/2026',
    depositAmount: 5_000_000,
    customerId: 'c10',
    customerName: 'Lý Thu Ngân',
    customerPhone: '0939112988',
    customerEmail: 'thu.ngan.ly@gmail.com',
    customerCCCD: '086203456789',
    customerAddress: '128 Khánh Hội, Quận 4, TP.HCM',
    roomCode: 'P308-GVA',
    roomType: 'Studio Luxury',
    branch: 'Gò Vấp',
    roomMonthlyRent: 5_500_000,
  },
  {
    id: 'd11',
    depositCode: 'PC-2026-0051',
    depositDate: '12/05/2026',
    depositAmount: 6_500_000,
    customerId: 'c11',
    customerName: 'Đặng Quốc Hưng',
    customerPhone: '0903551234',
    customerEmail: 'quochung.dang@gmail.com',
    customerCCCD: '082101987654',
    customerAddress: '500 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
    roomCode: 'P706-BTB',
    roomType: '1PN Cao Cấp',
    branch: 'Bình Thạnh',
    roomMonthlyRent: 6_800_000,
  },
  {
    id: 'd12',
    depositCode: 'PC-2026-0052',
    depositDate: '13/05/2026',
    depositAmount: 3_500_000,
    customerId: 'c12',
    customerName: 'Trương Minh Khoa',
    customerPhone: '0924667890',
    customerEmail: 'minhkhoa.truong@gmail.com',
    customerCCCD: '070112003456',
    customerAddress: '22 Lê Văn Việt, Quận 9, TP.HCM',
    roomCode: 'P203-TDA',
    roomType: 'Studio Mini',
    branch: 'Thủ Đức',
    roomMonthlyRent: 3_800_000,
  },
  {
    id: 'd13',
    depositCode: 'PC-2026-0053',
    depositDate: '14/05/2026',
    depositAmount: 7_500_000,
    customerId: 'c13',
    customerName: 'Phan Khánh Linh',
    customerPhone: '0947338765',
    customerEmail: 'khanhlinh.phan@yahoo.com',
    customerCCCD: '001210002345',
    customerAddress: '88 Nguyễn Công Trứ, Quận 1, TP.HCM',
    roomCode: 'P901-Q1B',
    roomType: 'Studio Deluxe',
    branch: 'Quận 1',
    roomMonthlyRent: 7_900_000,
  },
  {
    id: 'd14',
    depositCode: 'PC-2026-0054',
    depositDate: '15/05/2026',
    depositAmount: 5_200_000,
    customerId: 'c14',
    customerName: 'Hồ Thị Bích Ngọc',
    customerPhone: '0935119876',
    customerEmail: 'bich.ngoc.ho@gmail.com',
    customerCCCD: '060199001234',
    customerAddress: '64 Trần Hữu Trang, Quận Phú Nhuận, TP.HCM',
    roomCode: 'P504-PNA',
    roomType: '1PN Tiêu Chuẩn',
    branch: 'Phú Nhuận',
    roomMonthlyRent: 5_500_000,
  },
  {
    id: 'd15',
    depositCode: 'PC-2026-0055',
    depositDate: '16/05/2026',
    depositAmount: 6_000_000,
    customerId: 'c15',
    customerName: 'Mai Văn Sơn',
    customerPhone: '0988776543',
    customerEmail: 'maivanson.hcm@gmail.com',
    customerCCCD: '051101234567',
    customerAddress: '10 Quang Trung, Quận Gò Vấp, TP.HCM',
    roomCode: 'P405-GVB',
    roomType: 'Studio Standard',
    branch: 'Gò Vấp',
    roomMonthlyRent: 6_100_000,
  },
];

// ─── Helper: generate mock codes ─────────────────────────────────────────────
function genContractCode() {
  return `HD-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
}
function genInvoiceCode() {
  return `INV-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}
function genHandoverCode() {
  return `BG-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
}
function getCurrentTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
    ' – ' + new Date().toLocaleDateString('vi-VN');
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type PageState = 'list' | 'form' | 'success' | 'contracts';
type ContractListTab = 'contracts' | 'drafts';

export default function SaleContractsPage() {
  const [pageState, setPageState] = useState<PageState>('list');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRecord | null>(null);
  const [createdContract, setCreatedContract] = useState<CreatedContract | null>(null);
  const [completedDepositIds, setCompletedDepositIds] = useState<string[]>([]);
  const [completedContracts, setCompletedContracts] = useState<CreatedContract[]>([]);
  const [draftContracts, setDraftContracts] = useState<DraftContract[]>([]);
  const [showDraftToast, setShowDraftToast] = useState(false);
  const [contractListTab, setContractListTab] = useState<ContractListTab>('contracts');

  // Filter deposits by staff branch (implicit - no manual filter)
  const branchDeposits = MOCK_DEPOSITS.filter((d) => d.branch === STAFF_BRANCH);
  const pendingDeposits = branchDeposits.filter((d) => !completedDepositIds.includes(d.id));

  const handleSelectDeposit = (deposit: DepositRecord) => {
    setSelectedDeposit(deposit);
    setPageState('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitContract = (data: ContractFormData) => {
    if (!selectedDeposit) return;
    const contract: CreatedContract = {
      contractCode: genContractCode(),
      invoiceCode: genInvoiceCode(),
      handoverCode: genHandoverCode(),
      customerName: selectedDeposit.customerName,
      roomCode: selectedDeposit.roomCode,
      branch: selectedDeposit.branch,
      startDate: data.startDate
        ? new Date(data.startDate).toLocaleDateString('vi-VN')
        : '—',
    };
    setCreatedContract(contract);
    setCompletedContracts((prev) => [contract, ...prev]);
    setCompletedDepositIds((prev) => [...prev, selectedDeposit.id]);
    // Remove draft for this deposit if exists
    setDraftContracts((prev) => prev.filter((d) => d.depositCode !== selectedDeposit.depositCode));
    setPageState('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    // Replace existing draft for same deposit if exists
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
    const deposit = branchDeposits.find((d) => d.depositCode === draft.depositCode);
    if (deposit) {
      setSelectedDeposit(deposit);
      setPageState('form');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Deposit pending list ── */}
      {pageState === 'list' && (
        <DepositPendingList
          deposits={pendingDeposits}
          onSelect={handleSelectDeposit}
          staffBranch={STAFF_BRANCH}
          onViewContracts={() => handleViewContracts('contracts')}
        />
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
            staffBranch={STAFF_BRANCH}
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
