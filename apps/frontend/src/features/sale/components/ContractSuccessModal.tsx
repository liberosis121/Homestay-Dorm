import { CheckCircle2, FileText, Printer, Eye, ArrowLeft, X } from 'lucide-react';

interface Props {
  contractCode: string;
  invoiceCode: string;
  handoverCode: string;
  customerName: string;
  roomCode: string;
  branch: string;
  startDate: string;
  onClose: () => void;
  onViewInvoice: () => void;
  onPrint: () => void;
}

export default function ContractSuccessModal({
  contractCode,
  invoiceCode,
  handoverCode,
  customerName,
  roomCode,
  branch,
  startDate,
  onClose,
  onViewInvoice,
  onPrint,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#eee7e1] flex items-center justify-center text-[#4e453c] hover:bg-[#d1c4b9] transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Success header */}
        <div className="bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] px-8 pt-10 pb-8 text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-white text-2xl font-extrabold font-headline-lg">
            Lập hợp đồng thuê thành công!
          </h2>
          <p className="text-white/80 text-sm mt-2">
            Hợp đồng đã được ghi nhận và chuyển sang trạng thái chờ thanh toán nhận phòng.
          </p>
        </div>

        {/* Contract code highlight */}
        <div className="mx-6 -mt-5 bg-white rounded-2xl shadow-lg border border-[#d1c4b9] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#9d8879] font-medium">Mã hợp đồng</p>
              <p className="text-xl font-extrabold text-[#6f583c] font-mono mt-0.5">{contractCode}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#9d8879] font-medium">Trạng thái</p>
              <span className="inline-block mt-1 text-xs font-bold px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
                Chờ thanh toán nhận phòng
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4">
          {/* Customer & Room */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#fff8f3] rounded-xl p-3">
              <p className="text-xs text-[#9d8879] mb-1">Khách thuê</p>
              <p className="font-semibold text-[#1e1b17] text-sm">{customerName}</p>
            </div>
            <div className="bg-[#fff8f3] rounded-xl p-3">
              <p className="text-xs text-[#9d8879] mb-1">Phòng thuê</p>
              <p className="font-semibold text-[#1e1b17] text-sm">{roomCode}</p>
              <p className="text-[11px] text-[#9d8879]">{branch}</p>
            </div>
          </div>

          {/* Auto-generated documents */}
          <div>
            <p className="text-xs font-bold text-[#4e453c] uppercase tracking-wider mb-2.5">
              Tài liệu tự động khởi tạo
            </p>
            <div className="space-y-2">
              {[
                {
                  icon: CheckCircle2,
                  color: 'text-[#2d6a4f] bg-[#d8f3dc]',
                  label: 'Kết quả kiểm tra lưu trú',
                  value: 'Đạt – Đủ điều kiện thuê phòng',
                },
                {
                  icon: FileText,
                  color: 'text-[#6f583c] bg-[#faf2ec]',
                  label: 'Hóa đơn nhận phòng',
                  value: invoiceCode,
                },
                {
                  icon: FileText,
                  color: 'text-[#1565c0] bg-[#e3f2fd]',
                  label: 'Biên bản bàn giao tài sản',
                  value: `${handoverCode} – Chờ ký`,
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-[#faf2ec]/60 px-3 py-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#9d8879]">{item.label}</p>
                      <p className="text-sm font-semibold text-[#1e1b17] truncate">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-[#9d8879] text-center">
            Ngày bắt đầu thuê: <strong className="text-[#1e1b17]">{startDate}</strong>
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 grid grid-cols-3 gap-2.5">
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#d1c4b9] text-[#4e453c] text-sm font-semibold hover:bg-[#faf2ec] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Danh sách
          </button>
          <button
            onClick={onViewInvoice}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#6f583c] text-[#6f583c] text-sm font-semibold hover:bg-[#fff8f3] transition"
          >
            <Eye className="w-4 h-4" />
            Xem HĐ
          </button>
          <button
            onClick={onPrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#6f583c] text-white text-sm font-semibold hover:bg-[#5c4830] transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            In HĐ
          </button>
        </div>
      </div>
    </div>
  );
}
