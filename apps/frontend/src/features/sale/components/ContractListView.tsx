import { useState } from 'react';
import {
  FileText, Clock, Eye, Edit3, Trash2, Search, CheckCircle2,
  ArrowLeft, FileSignature, AlertCircle, ChevronRight, Building2,
  CalendarDays, Banknote, User
} from 'lucide-react';
import { CreatedContract } from '../SaleContractsPage';

export interface DraftContract {
  id: string;
  depositCode: string;
  customerName: string;
  roomCode: string;
  branch: string;
  savedAt: string;
  rentPrice: number;
  contractType: 'long_term' | 'short_term';
  startDate: string;
}

interface Props {
  completedContracts: CreatedContract[];
  draftContracts: DraftContract[];
  onBack: () => void;
  onNewContract: () => void;
  onResumeDraft: (draftId: string) => void;
  onDeleteDraft: (draftId: string) => void;
  activeTab?: 'contracts' | 'drafts';
}

type Tab = 'contracts' | 'drafts';

const CONTRACT_STATUS_BADGE = (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
    <Clock className="w-3 h-3" />
    Chờ thanh toán nhận phòng
  </span>
);

export default function ContractListView({
  completedContracts,
  draftContracts,
  onBack,
  onNewContract,
  onResumeDraft,
  onDeleteDraft,
  activeTab = 'contracts',
}: Props) {
  const [tab, setTab] = useState<Tab>(activeTab);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContracts = completedContracts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      c.contractCode.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.roomCode.toLowerCase().includes(q)
    );
  });

  const filteredDrafts = draftContracts.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      d.depositCode.toLowerCase().includes(q) ||
      d.customerName.toLowerCase().includes(q) ||
      d.roomCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[#6f583c] hover:text-[#5c4830] font-medium transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách phiếu cọc
          </button>
          <h1 className="font-headline-lg text-2xl font-bold text-[#1e1b17]">
            Hợp đồng & Bản nháp
          </h1>
          <p className="text-[#4e453c] mt-1 text-sm">
            Quản lý hợp đồng đã lập và các bản nháp đang chờ hoàn thiện.
          </p>
        </div>
        <button
          onClick={onNewContract}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6f583c] hover:bg-[#5c4830] text-white text-sm font-bold rounded-xl transition shadow-sm hover:shadow-md active:scale-95"
        >
          <FileSignature className="w-4 h-4" />
          Lập hợp đồng mới
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9d8879]" />
          <input
            type="text"
            placeholder="Tìm theo mã hợp đồng, tên khách, mã phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d1c4b9] text-sm bg-[#fff8f3] focus:outline-none focus:ring-2 focus:ring-[#6f583c]/30 focus:border-[#6f583c] transition placeholder-[#b5a89c]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-[#d1c4b9] shadow-sm overflow-hidden">
        {/* Tab header */}
        <div className="flex border-b border-[#eee7e1]">
          <button
            onClick={() => setTab('contracts')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition border-b-2 -mb-px ${
              tab === 'contracts'
                ? 'border-[#6f583c] text-[#6f583c] bg-[#fff8f3]'
                : 'border-transparent text-[#9d8879] hover:text-[#4e453c] hover:bg-[#faf2ec]'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            Hợp đồng đã lập
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              tab === 'contracts' ? 'bg-[#6f583c] text-white' : 'bg-[#eee7e1] text-[#9d8879]'
            }`}>
              {completedContracts.length}
            </span>
          </button>
          <button
            onClick={() => setTab('drafts')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition border-b-2 -mb-px ${
              tab === 'drafts'
                ? 'border-[#6f583c] text-[#6f583c] bg-[#fff8f3]'
                : 'border-transparent text-[#9d8879] hover:text-[#4e453c] hover:bg-[#faf2ec]'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Bản nháp
            {draftContracts.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                tab === 'drafts' ? 'bg-[#6f583c] text-white' : 'bg-[#fef3c7] text-[#92400e]'
              }`}>
                {draftContracts.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Tab: Hợp đồng đã lập ── */}
        {tab === 'contracts' && (
          <>
            {filteredContracts.length === 0 ? (
              <div className="p-16 text-center">
                <FileText className="w-14 h-14 mx-auto text-[#c4b5a9] mb-4" />
                <p className="text-[#1e1b17] font-semibold text-lg">
                  {searchQuery ? 'Không tìm thấy hợp đồng phù hợp' : 'Chưa có hợp đồng nào'}
                </p>
                <p className="text-[#9d8879] text-sm mt-2">
                  {searchQuery
                    ? 'Thử điều chỉnh từ khóa tìm kiếm.'
                    : 'Bắt đầu bằng cách chọn phiếu cọc và lập hợp đồng đầu tiên.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={onNewContract}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#6f583c] text-white text-sm font-bold rounded-xl transition hover:bg-[#5c4830]"
                  >
                    <FileSignature className="w-4 h-4" />
                    Lập hợp đồng mới
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[#faf2ec] border-b border-[#d1c4b9]">
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-[#6f583c] uppercase tracking-wider">Mã HĐ</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-[#6f583c] uppercase tracking-wider">Khách thuê</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-[#6f583c] uppercase tracking-wider">Phòng</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-[#6f583c] uppercase tracking-wider">Ngày bắt đầu</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-[#6f583c] uppercase tracking-wider">Trạng thái</th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-[#6f583c] uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee7e1]">
                    {filteredContracts.map((c, idx) => (
                      <tr key={idx} className="hover:bg-[#fff8f3] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#6f583c]/10 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-[#6f583c]" />
                            </div>
                            <div>
                              <p className="font-bold text-[#6f583c] font-mono text-xs">{c.contractCode}</p>
                              <p className="text-[10px] text-[#9d8879]">{c.invoiceCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6f583c] to-[#8C7355] flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {c.customerName.charAt(0)}
                            </div>
                            <p className="font-semibold text-[#1e1b17] text-sm">{c.customerName}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#1e1b17] text-sm">{c.roomCode}</p>
                          <div className="flex items-center gap-1 text-[11px] text-[#9d8879] mt-0.5">
                            <Building2 className="w-3 h-3" />{c.branch}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-[#4e453c]">
                            <CalendarDays className="w-3.5 h-3.5 text-[#9d8879]" />
                            {c.startDate}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {CONTRACT_STATUS_BADGE}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#d1c4b9] text-[#4e453c] text-xs font-semibold hover:bg-[#faf2ec] transition hover:border-[#6f583c] hover:text-[#6f583c] group-hover:border-[#9d8879]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Chi tiết
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 bg-[#faf2ec] border-t border-[#d1c4b9] flex items-center gap-2 text-xs text-[#9d8879]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  Hiển thị <strong className="text-[#1e1b17] mx-1">{filteredContracts.length}</strong> hợp đồng đã lập
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Tab: Bản nháp ── */}
        {tab === 'drafts' && (
          <>
            {filteredDrafts.length === 0 ? (
              <div className="p-16 text-center">
                <Edit3 className="w-14 h-14 mx-auto text-[#c4b5a9] mb-4" />
                <p className="text-[#1e1b17] font-semibold text-lg">
                  {searchQuery ? 'Không tìm thấy bản nháp phù hợp' : 'Chưa có bản nháp nào'}
                </p>
                <p className="text-[#9d8879] text-sm mt-2">
                  {searchQuery
                    ? 'Thử điều chỉnh từ khóa tìm kiếm.'
                    : 'Khi lập hợp đồng, nhấn "Lưu nháp" để lưu tiến độ và tiếp tục sau.'}
                </p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-[#eee7e1]">
                {/* Warning banner */}
                <div className="px-5 py-3 bg-[#fffbeb] flex items-center gap-2 text-xs text-[#92400e] border-b border-[#fcd34d]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Bản nháp chỉ lưu tạm thời trong phiên làm việc. Nhớ hoàn thiện và lập hợp đồng sớm.
                </div>

                {filteredDrafts.map((d) => (
                  <div key={d.id} className="px-5 py-4 hover:bg-[#fff8f3] transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#fef3c7] flex items-center justify-center shrink-0 mt-0.5">
                          <Edit3 className="w-4 h-4 text-[#92400e]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[#1e1b17] text-sm">{d.customerName}</p>
                            <span className="text-xs text-[#9d8879] font-mono bg-[#faf2ec] px-2 py-0.5 rounded-md">
                              {d.depositCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-[#4e453c]">
                              <Building2 className="w-3 h-3 text-[#9d8879]" />
                              {d.roomCode} – {d.branch}
                            </div>
                            {d.startDate && (
                              <div className="flex items-center gap-1 text-xs text-[#4e453c]">
                                <CalendarDays className="w-3 h-3 text-[#9d8879]" />
                                Bắt đầu: {new Date(d.startDate).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                            {d.rentPrice > 0 && (
                              <div className="flex items-center gap-1 text-xs text-[#2d6a4f] font-semibold">
                                <Banknote className="w-3 h-3" />
                                {d.rentPrice.toLocaleString('vi-VN')} đ/tháng
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#9d8879]">
                            <User className="w-3 h-3" />
                            Lưu lúc: {d.savedAt}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onDeleteDraft(d.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9d8879] hover:text-red-500 hover:bg-red-50 transition"
                          title="Xóa bản nháp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onResumeDraft(d.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6f583c] text-white text-xs font-bold hover:bg-[#5c4830] transition shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Tiếp tục chỉnh sửa
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="px-5 py-3 bg-[#faf2ec] border-t border-[#d1c4b9] flex items-center gap-2 text-xs text-[#9d8879]">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span><strong className="text-[#1e1b17]">{filteredDrafts.length}</strong> bản nháp đang chờ hoàn thiện</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
