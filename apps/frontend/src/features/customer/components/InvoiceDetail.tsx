import { formatShortId } from '../../../lib/utils';
import { Invoice } from '../store/useInvoiceStore';
import { Info, CreditCard, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  invoice: Invoice | null;
  onPay: (id: string) => void;
}

export default function InvoiceDetail({ invoice, onPay }: Props) {
  if (!invoice) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-8 text-center text-on-surface-variant italic shadow-sm">
        <Info className="w-8 h-8 text-primary/40 mx-auto mb-3" />
        Vui lòng chọn một hóa đơn trong danh sách để xem chi tiết chi phí thanh toán.
      </div>
    );
  }

  const getStatusAlert = () => {
    switch (invoice.status) {
      case 'paid':
        return (
          <div className="flex items-center gap-2 p-3 bg-status-success/10 border border-status-success/20 rounded-xl text-status-success text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Hóa đơn đã được thanh toán đầy đủ vào {invoice.paidAt ? new Date(invoice.paidAt).toLocaleString('vi-VN') : 'vừa xong'}.</span>
          </div>
        );
      case 'overdue':
        return (
          <div className="flex items-center gap-2 p-3 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-xs font-semibold animate-pulse">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Hóa đơn này đã quá hạn thanh toán! Vui lòng thanh toán ngay để tránh gián đoạn dịch vụ.</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="flex w-full flex-col overflow-hidden bg-surface-container-lowest">
      {/* Header banner */}
      <div className="bg-primary py-6 pl-6 pr-16 text-on-primary">
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="rounded-full border border-surface/40 bg-surface/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm">
            {invoice.typeName}
          </span>
          <span className="whitespace-nowrap text-xs font-semibold text-on-primary/85">Hạn: {formatDate(invoice.dueDate)}</span>
        </div>
        <h2 className="text-xl font-bold font-headline-md tracking-wide">{formatShortId(invoice.id, 'invoice')}</h2>
        <p className="text-xs opacity-90 mt-1 font-medium">Kỳ thanh toán: {invoice.billingPeriod}</p>
      </div>

      {/* Breakdown details */}
      <div className="p-6 flex-1 space-y-5">
        {getStatusAlert()}

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wide border-b border-outline-variant/20 pb-2">
            Chi tiết các khoản phí
          </h3>

          {/* Tiền phòng */}
          {invoice.roomPrice > 0 && (
            <div className="flex justify-between items-center py-1">
              <span className="text-on-surface-variant text-sm font-medium">Tiền thuê phòng</span>
              <span className="font-semibold text-on-surface">{invoice.roomPrice.toLocaleString('vi-VN')}đ</span>
            </div>
          )}

          {/* Tiền điện */}
          {invoice.electricityPrice > 0 && (
            <div className="flex justify-between items-start py-1">
              <div>
                <span className="text-on-surface-variant text-sm font-medium block">Tiền điện tiêu thụ</span>
                <span className="text-[11px] text-on-surface-variant/70 italic font-medium">
                  {invoice.electricityUsage}
                </span>
              </div>
              <span className="font-semibold text-on-surface">{invoice.electricityPrice.toLocaleString('vi-VN')}đ</span>
            </div>
          )}

          {/* Tiền nước */}
          {invoice.waterPrice > 0 && (
            <div className="flex justify-between items-start py-1">
              <div>
                <span className="text-on-surface-variant text-sm font-medium block">Tiền nước sinh hoạt</span>
                <span className="text-[11px] text-on-surface-variant/70 italic font-medium">
                  {invoice.waterUsage}
                </span>
              </div>
              <span className="font-semibold text-on-surface">{invoice.waterPrice.toLocaleString('vi-VN')}đ</span>
            </div>
          )}

          {/* Phí dịch vụ */}
          {invoice.servicePrice > 0 && (
            <div className="flex justify-between items-start py-1 border-b border-outline-variant/10 pb-3">
              <div>
                <span className="text-on-surface-variant text-sm font-medium block">Dịch vụ & tiện ích</span>
                <span className="text-[11px] text-on-surface-variant/70 font-medium">
                  {invoice.serviceDetails}
                </span>
              </div>
              <span className="font-semibold text-on-surface">{invoice.servicePrice.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
        </div>

        {/* Total Price */}
        <div className="pt-2">
          <div className="flex justify-between items-baseline mb-6">
            <span className="text-base font-bold text-primary">Tổng thanh toán</span>
            <span className="text-2xl font-bold text-primary tracking-tight">
              {invoice.totalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>

          {invoice.status !== 'paid' ? (
            <button
              onClick={() => onPay(invoice.id)}
              className="w-full py-3.5 bg-primary hover:bg-[#253228] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-primary/10 hover:shadow-lg cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
              THANH TOÁN NGAY
            </button>
          ) : (
            <div className="w-full py-3 text-center border-2 border-status-success/30 text-status-success font-bold rounded-xl flex items-center justify-center gap-1.5 bg-status-success/5 cursor-default">
              <CheckCircle2 className="w-5 h-5" />
              ĐÃ THANH TOÁN
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
