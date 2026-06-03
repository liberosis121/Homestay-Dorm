import {
  CheckCircle2, FileText, Printer, Eye, ArrowLeft, X,
  Building2, CalendarDays, Download, Sparkles, ChevronRight
} from 'lucide-react';

interface Props {
  contractCode: string;
  invoiceCode: string;
  handoverCode: string;
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
        style={{ animation: 'modalSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(40px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes pulseRing {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 0.2; }
          }
          @keyframes checkPop {
            0% { transform: scale(0) rotate(-15deg); opacity: 0; }
            60% { transform: scale(1.15) rotate(3deg); opacity: 1; }
            100% { transform: scale(1) rotate(0); opacity: 1; }
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Success Header ── */}
        <div className="relative bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] px-8 pt-10 pb-14 text-center overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

          {/* Sparkles */}
          <div className="absolute top-6 left-10 text-yellow-300 opacity-70">
            <Sparkles className="w-5 h-5" style={{ animation: 'pulseRing 2s ease-in-out infinite' }} />
          </div>
          <div className="absolute top-8 right-16 text-yellow-200 opacity-50">
            <Sparkles className="w-3.5 h-3.5" style={{ animation: 'pulseRing 2.4s ease-in-out infinite 0.5s' }} />
          </div>

          {/* Animated check icon */}
          <div className="relative mx-auto w-20 h-20 mb-4">
            <div
              className="absolute inset-0 rounded-full bg-white/15"
              style={{ animation: 'pulseRing 2s ease-in-out infinite' }}
            />
            <div
              className="relative w-20 h-20 rounded-full bg-white/20 ring-4 ring-white/30 flex items-center justify-center"
              style={{ animation: 'checkPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-white text-2xl font-extrabold leading-tight">
            Lập hợp đồng thuê
            <br />thành công!
          </h2>
          <p className="text-white/75 text-sm mt-2 leading-relaxed">
            Hợp đồng đã ghi nhận và chuyển sang<br />trạng thái <strong className="text-white/95">chờ thanh toán nhận phòng</strong>.
          </p>
        </div>

        {/* ── Contract Code Card (floating) ── */}
        <div className="mx-6 -mt-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border border-[#d1c4b9] overflow-hidden">
            <div className="bg-gradient-to-r from-[#6f583c] to-[#8C7355] px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Mã hợp đồng</p>
                <p className="text-white text-xl font-extrabold font-mono mt-0.5">{contractCode}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fef3c7] text-[#92400e] text-xs font-bold border border-[#fcd34d]">
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
          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step.done
                      ? 'bg-[#2d6a4f] text-white ring-2 ring-[#2d6a4f]/30'
                      : step.active
                        ? 'bg-[#fef3c7] text-[#92400e] ring-2 ring-[#fcd34d]/50'
                        : 'bg-[#eee7e1] text-[#9d8879]'
                  }`}>
                    {step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <p className={`text-[10px] font-semibold mt-1 text-center leading-tight ${
                    step.done ? 'text-[#2d6a4f]' : step.active ? 'text-[#92400e]' : 'text-[#9d8879]'
                  }`}>
                    {step.label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 mb-4 ${step.done ? 'bg-[#2d6a4f]' : 'bg-[#eee7e1]'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Auto-generated documents */}
          <div>
            <p className="text-[11px] font-bold text-[#4e453c] uppercase tracking-widest mb-2.5">
              Tài liệu tự động khởi tạo
            </p>
            <div className="space-y-2">
              {[
                {
                  color: 'text-[#2d6a4f] bg-[#d8f3dc]',
                  borderColor: 'border-[#b7e4c7]',
                  label: 'Kết quả kiểm tra lưu trú',
                  value: 'Đạt – Đủ điều kiện thuê phòng',
                  icon: CheckCircle2,
                  action: null,
                },
                {
                  color: 'text-[#6f583c] bg-[#faf2ec]',
                  borderColor: 'border-[#d1c4b9]',
                  label: 'Hóa đơn nhận phòng',
                  value: invoiceCode,
                  icon: FileText,
                  action: 'Tải xuống',
                },
                {
                  color: 'text-[#1565c0] bg-[#e3f2fd]',
                  borderColor: 'border-[#bbdefb]',
                  label: 'Biên bản bàn giao tài sản',
                  value: `${handoverCode} – Chờ ký`,
                  icon: FileText,
                  action: 'Xem',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl bg-white border ${item.borderColor} px-3.5 py-2.5 hover:shadow-sm transition`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#9d8879] uppercase tracking-wider font-semibold">{item.label}</p>
                      <p className="text-sm font-bold text-[#1e1b17] truncate mt-0.5">{item.value}</p>
                    </div>
                    {item.action && (
                      <button className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#6f583c] border border-[#d1c4b9] hover:bg-[#faf2ec] transition">
                        {item.action === 'Tải xuống' ? <Download className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {item.action}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#9d8879] bg-[#faf2ec] rounded-xl px-4 py-2.5">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            Ngày bắt đầu thuê: <strong className="text-[#1e1b17]">{startDate}</strong>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-6 pb-6 grid grid-cols-3 gap-2.5">
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-[#d1c4b9] text-[#4e453c] text-xs font-bold hover:bg-[#faf2ec] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Danh sách
          </button>
          <button
            onClick={onViewContracts}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border-2 border-[#6f583c] text-[#6f583c] text-xs font-bold hover:bg-[#fff8f3] transition"
          >
            <Eye className="w-3.5 h-3.5" />
            Xem HĐ
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={onPrint}
            className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-[#6f583c] text-white text-xs font-bold hover:bg-[#5c4830] transition shadow-md hover:shadow-lg active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            In HĐ
          </button>
        </div>
      </div>
    </div>
  );
}
