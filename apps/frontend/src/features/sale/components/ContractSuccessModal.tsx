import {
  CheckCircle2, FileText, Printer, Eye, ArrowLeft, X,
  Building2, CalendarDays, Download, ChevronRight
} from 'lucide-react';

interface Props {
  contractCode: string;
  invoiceCode?: string;
  handoverCode?: string;
  customerName: string;
  roomCode: string;
  branch: string;
  startDate: string;
  onClose: () => void;
  onViewContracts: () => void;
  onPrint: () => void;
}

const STEPS = [
  { label: 'Lập hợp đồng', done: true },
  { label: 'Chờ thanh toán', done: false, active: true },
  { label: 'Nhận phòng', done: false },
];

export default function ContractSuccessModal({
  contractCode,
  invoiceCode,
  handoverCode,
  customerName,
  roomCode,
  branch,
  startDate,
  onClose,
  onViewContracts,
  onPrint,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#d1c4b9]/50"
        style={{ animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#9d8879] hover:bg-[#e8e1d3]/40 hover:text-[#6f583c] transition z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Success Header ── */}
        <div className="relative bg-[#faf2ec] border-b border-[#d1c4b9]/50 px-8 pt-4 pb-8 text-center">
          <div className="mx-auto inline-flex max-w-full rounded-2xl border border-[#d1c4b9]/70 bg-[#fffdf9] px-5 py-2.5 shadow-sm">
            <h2 className="text-[#1e1b17] text-base font-bold leading-tight">
              Lập hợp đồng thuê thành công
            </h2>
          </div>
        </div>

        {/* ── Contract Code Card (floating) ── */}
        <div className="mx-6 -mt-3 relative z-10">
          <div className="bg-white rounded-2xl shadow-md border border-[#d1c4b9] overflow-hidden">
            <div className="bg-[#6f583c] px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-[9px] uppercase tracking-widest font-bold">Mã hợp đồng</p>
                <p className="text-white text-lg font-extrabold font-mono mt-0.5">{contractCode}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fef3c7] text-[#92400e] text-[10px] font-bold border border-[#fcd34d]">
                Chờ thanh toán
              </span>
            </div>
            {/* Customer + Room */}
            <div className="grid grid-cols-2 divide-x divide-[#eee7e1]">
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#9d8879] uppercase tracking-wider font-semibold">Khách thuê</p>
                <p className="font-bold text-[#1e1b17] text-sm mt-0.5">{customerName}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-[#9d8879] uppercase tracking-wider font-semibold">Phòng thuê</p>
                <p className="font-bold text-[#1e1b17] text-sm mt-0.5">{roomCode}</p>
                <div className="flex items-center gap-1 text-[10px] text-[#9d8879] mt-0.5">
                  <Building2 className="w-3 h-3" />{branch}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 pt-5 pb-4 space-y-4">
          {/* Progress steps */}
          <div className="flex items-center justify-between bg-[#faf2ec]/30 border border-[#d1c4b9]/20 rounded-xl py-2.5 px-4">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    step.done
                      ? 'bg-[#4a6549] text-white'
                      : step.active
                        ? 'bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]'
                        : 'bg-[#eee7e1] text-[#9d8879] border border-[#d1c4b9]/30'
                  }`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span className={`text-[11px] font-bold whitespace-nowrap ${
                    step.done ? 'text-[#4a6549]' : step.active ? 'text-[#92400e]' : 'text-[#9d8879]'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mx-3 ${step.done ? 'bg-[#4a6549]' : 'bg-[#d1c4b9]/30'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Auto-generated documents */}
          <div>
            <p className="text-[11px] font-bold text-[#4e453c] uppercase tracking-widest mb-2">
              Tài liệu tự động khởi tạo
            </p>
            <div className="space-y-2">
              {[
                {
                  color: 'text-[#4a6549] bg-[#eff3ef]',
                  borderColor: 'border-[#a8c3a5]/40',
                  label: 'Kết quả kiểm tra lưu trú',
                  value: 'Đạt – Đủ điều kiện thuê phòng',
                  icon: CheckCircle2,
                  action: null,
                },
                ...(invoiceCode ? [{
                  color: 'text-[#6f583c] bg-[#faf2ec]',
                  borderColor: 'border-[#d1c4b9]/40',
                  label: 'Hóa đơn nhận phòng',
                  value: invoiceCode,
                  icon: FileText,
                  action: 'Tải xuống',
                }] : []),
                ...(handoverCode ? [{
                  color: 'text-[#5e503f] bg-[#faf2ec]/60',
                  borderColor: 'border-[#d1c4b9]/30',
                  label: 'Biên bản bàn giao tài sản',
                  value: `${handoverCode} – Chờ ký`,
                  icon: FileText,
                  action: 'Xem',
                }] : []),
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 rounded-xl bg-white border ${item.borderColor} px-3 py-2 hover:shadow-sm transition`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-[#9d8879] uppercase tracking-wider font-semibold">{item.label}</p>
                      <p className="text-xs font-bold text-[#1e1b17] truncate mt-0.5">{item.value}</p>
                    </div>
                    {item.action && (
                      <button className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold text-[#6f583c] border border-[#d1c4b9]/85 hover:bg-[#faf2ec] hover:text-[#5c4830] transition cursor-pointer">
                        {item.action === 'Tải xuống' ? <Download className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {item.action}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#9d8879] bg-[#faf2ec]/60 border border-[#d1c4b9]/20 rounded-xl px-4 py-2.5">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            Ngày bắt đầu thuê: <strong className="text-[#1e1b17]">{startDate}</strong>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-6 pb-6 grid grid-cols-3 gap-2.5">
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-[#d1c4b9] text-[#4e453c] text-xs font-bold hover:bg-[#faf2ec] transition cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Danh sách
          </button>
          <button
            onClick={onViewContracts}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-[#6f583c] text-[#6f583c] text-xs font-bold hover:bg-[#faf2ec] transition cursor-pointer active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            Xem HĐ
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={onPrint}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-[#6f583c] text-white text-xs font-bold hover:bg-[#5c4830] transition shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            In HĐ
          </button>
        </div>
      </div>
    </div>
  );
}
