import {
  X, FileText, Printer, Building2, CalendarDays,
  User, Phone, Mail, CreditCard, MapPin, Receipt,
  CheckCircle2, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { CreatedContract, MOCK_DEPOSITS } from '../SaleContractsPage';

interface Props {
  contract: CreatedContract;
  onClose: () => void;
  onPrint: () => void;
}

export default function ContractDetailModal({ contract, onClose, onPrint }: Props) {
  // Find matching deposit record for richer info (phone, email, CCCD, roomType, depositAmount etc.)
  const deposit = MOCK_DEPOSITS.find(
    (d) => d.roomCode === contract.roomCode || d.customerName === contract.customerName
  );

  const steps = [
    { label: 'Lập hợp đồng', done: true, time: 'Đã hoàn thành' },
    { label: 'Chờ thanh toán', done: false, active: true, time: 'Hạn chót: 3 ngày sau nhận phòng' },
    { label: 'Nhận bàn giao phòng', done: false, active: false, time: 'Sau khi thanh toán' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" />

      {/* Modal Card */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-[#d1c4b9] flex flex-col max-h-[90vh]"
        style={{ animation: 'modalSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(40px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white hover:text-white transition z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header (Timber Earth Brown Gradient) */}
        <div className="relative bg-gradient-to-br from-[#5c4830] via-[#6f583c] to-[#8c7355] px-6 py-8 text-white shrink-0">
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
          
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-white/20 text-white border border-white/20">
              Chi tiết Hợp đồng
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
              <Clock className="w-2.5 h-2.5" />
              Chờ thanh toán nhận phòng
            </span>
          </div>

          <h2 className="text-2xl font-extrabold font-headline leading-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-white/90" />
            {contract.contractCode}
          </h2>
          <p className="text-white/85 text-xs mt-1.5 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-white/70" />
            {contract.branch} • Phòng {contract.roomCode}
          </p>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fff8f3]">
          
          {/* Progress Timeline */}
          <div className="bg-white rounded-2xl border border-[#d1c4b9] p-4 shadow-sm">
            <h3 className="text-xs font-bold text-[#6f583c] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Tiến trình hợp đồng
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col relative bg-[#faf2ec] rounded-xl p-3 border border-[#eee7e1]">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      step.done 
                        ? 'bg-[#2d6a4f] text-white' 
                        : step.active 
                          ? 'bg-[#fef3c7] text-[#92400e] ring-2 ring-[#fcd34d]/50'
                          : 'bg-[#eee7e1] text-[#9d8879]'
                    }`}>
                      {step.done ? '✓' : idx + 1}
                    </span>
                    <span className={`text-xs font-bold ${
                      step.done ? 'text-[#2d6a4f]' : step.active ? 'text-[#92400e]' : 'text-[#9d8879]'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9d8879] mt-1.5 font-medium pl-8">{step.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info Blocks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Info Card */}
            <div className="bg-white rounded-2xl border border-[#d1c4b9] p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-[#6f583c] uppercase tracking-wider border-b border-[#eee7e1] pb-2 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Thông tin khách thuê
              </h3>
              
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] text-[#9d8879] uppercase font-semibold">Họ và tên</p>
                  <p className="text-sm font-bold text-[#1e1b17] mt-0.5">{contract.customerName}</p>
                </div>
                
                {deposit && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-[#9d8879] uppercase font-semibold flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Điện thoại
                        </p>
                        <p className="text-xs font-semibold text-[#1e1b17] mt-0.5">{deposit.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#9d8879] uppercase font-semibold flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> CCCD/CMND
                        </p>
                        <p className="text-xs font-semibold text-[#1e1b17] mt-0.5">{deposit.customerCCCD}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9d8879] uppercase font-semibold flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </p>
                      <p className="text-xs font-semibold text-[#1e1b17] truncate mt-0.5">{deposit.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9d8879] uppercase font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Địa chỉ thường trú
                      </p>
                      <p className="text-xs text-[#4e453c] mt-0.5 leading-relaxed">{deposit.customerAddress}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Room & Contract Details Card */}
            <div className="bg-white rounded-2xl border border-[#d1c4b9] p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-[#6f583c] uppercase tracking-wider border-b border-[#eee7e1] pb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> Thông tin phòng & hợp đồng
              </h3>
              
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-[#9d8879] uppercase font-semibold">Mã phòng</p>
                    <p className="text-sm font-bold text-[#6f583c] mt-0.5">{contract.roomCode}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9d8879] uppercase font-semibold">Chi nhánh</p>
                    <p className="text-sm font-bold text-[#1e1b17] mt-0.5">{contract.branch}</p>
                  </div>
                </div>

                {deposit && (
                  <div>
                    <p className="text-[10px] text-[#9d8879] uppercase font-semibold">Loại phòng</p>
                    <p className="text-xs font-semibold text-[#1e1b17] mt-0.5">{deposit.roomType}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-[#9d8879] uppercase font-semibold flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> Ngày bắt đầu
                    </p>
                    <p className="text-xs font-bold text-[#1e1b17] mt-0.5">{contract.startDate}</p>
                  </div>
                  {deposit && (
                    <div>
                      <p className="text-[10px] text-[#9d8879] uppercase font-semibold">Tiền đặt cọc cọc</p>
                      <p className="text-xs font-bold text-[#2d6a4f] mt-0.5">
                        {deposit.depositAmount.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  )}
                </div>

                {deposit && (
                  <div className="pt-1 border-t border-dashed border-[#eee7e1] flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-[#9d8879] uppercase font-semibold">Giá thuê phòng/tháng</p>
                      <p className="text-sm font-extrabold text-[#6f583c]">
                        {deposit.roomMonthlyRent.toLocaleString('vi-VN')} đ/tháng
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-[#6f583c] bg-[#6f583c]/10 px-2 py-0.5 rounded-md">
                      HĐ 1 Năm (Kỳ 1 tháng)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Generated Documents list */}
          <div className="bg-white rounded-2xl border border-[#d1c4b9] p-4 shadow-sm">
            <h3 className="text-xs font-bold text-[#6f583c] uppercase tracking-wider border-b border-[#eee7e1] pb-2 mb-3 flex items-center gap-1.5">
              <Receipt className="w-4 h-4" /> Danh sách tài liệu đi kèm
            </h3>
            
            <div className="space-y-2.5">
              {[
                {
                  label: 'Kết quả kiểm tra điều kiện lưu trú',
                  code: 'KQ-LT-PASS',
                  status: 'Hợp lệ',
                  statusColor: 'text-[#2d6a4f] bg-[#d8f3dc] border-[#b7e4c7]',
                  icon: CheckCircle2,
                },
                {
                  label: 'Hóa đơn cọc & thanh toán tháng đầu',
                  code: contract.invoiceCode,
                  status: 'Chờ thanh toán',
                  statusColor: 'text-[#92400e] bg-[#fef3c7] border-[#fcd34d]',
                  icon: FileText,
                },
                {
                  label: 'Biên bản bàn giao tài sản phòng',
                  code: contract.handoverCode,
                  status: 'Chờ ký biên bản',
                  statusColor: 'text-[#1565c0] bg-[#e3f2fd] border-[#bbdefb]',
                  icon: FileText,
                },
              ].map((doc, idx) => {
                const Icon = doc.icon;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-[#eee7e1] bg-[#faf2ec]/50 hover:bg-[#faf2ec] transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#d1c4b9] flex items-center justify-center text-[#6f583c] shrink-0">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1e1b17] truncate">{doc.label}</p>
                        <p className="text-[10px] text-[#9d8879] font-mono mt-0.5">{doc.code}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${doc.statusColor}`}>
                      {doc.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Notice */}
          <div className="bg-[#fffbeb] border border-[#fcd34d] rounded-2xl p-4 flex gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#92400e] mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Lưu ý nghiệp vụ dành cho Sale:</p>
              <p className="text-amber-800/90 leading-relaxed">
                Yêu cầu khách hàng thanh toán hóa đơn tạm tính và ký nhận bàn giao tài sản tại quầy lễ tân hoặc thông qua ứng dụng khách thuê để kích hoạt trạng thái hợp đồng chính thức.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#faf2ec] border-t border-[#eee7e1] flex items-center justify-end shrink-0">
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#6f583c] hover:bg-[#5c4830] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            In hợp đồng
          </button>
        </div>

      </div>
    </div>
  );
}
