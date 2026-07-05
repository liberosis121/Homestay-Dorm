import { Invoice } from '../store/useInvoiceStore';
import { Eye, CreditCard } from 'lucide-react';

interface Props {
  invoices: Invoice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPay: (id: string) => void;
}

export default function InvoiceTable({ invoices, selectedId, onSelect, onPay }: Props) {
  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex h-7 min-w-[104px] items-center justify-center rounded-full bg-status-success/15 px-3 text-xs font-semibold text-status-success">
            Đã thanh toán
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex h-7 min-w-[104px] items-center justify-center rounded-full bg-status-warning/15 px-3 text-xs font-semibold text-status-warning">
            Chờ thanh toán
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex h-7 min-w-[104px] items-center justify-center rounded-full bg-status-error/15 px-3 text-xs font-semibold text-status-error">
            Quá hạn
          </span>
        );
    }
  };

  const getInvoiceTypeLabel = (type: Invoice['type']) => {
    switch (type) {
      case 'monthly':
        return 'Định kỳ';
      case 'service':
        return 'Dịch vụ';
      case 'incidental':
        return 'Phát sinh';
    }
  };

  const getInvoiceTypeBadgeClass = (type: Invoice['type']) => {
    switch (type) {
      case 'monthly':
        return 'border-primary/15 bg-primary/10 text-primary';
      case 'service':
        return 'border-[#d1c4b9] bg-[#faf2ec] text-[#6f583c]';
      case 'incidental':
        return 'border-[#d8cbb8] bg-[#f4f1ec] text-[#7a6b5b]';
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
    <div className="w-full overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] table-fixed text-left border-collapse">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead className="bg-surface-container-low border-b border-outline-variant/20">
            <tr>
              <th className="px-5 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mã hóa đơn</th>
              <th className="px-5 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">Kỳ thanh toán</th>
              <th className="px-5 py-4 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Loại</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số tiền</th>
              <th className="px-5 py-4 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">Hạn thanh toán</th>
              <th className="px-5 py-4 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-on-surface-variant uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant italic">
                  Không tìm thấy hóa đơn nào khớp với bộ lọc.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => {
                const isSelected = invoice.id === selectedId;
                return (
                  <tr
                    key={invoice.id}
                    onClick={() => onSelect(invoice.id)}
                    className={`transition-colors cursor-pointer select-none active:bg-primary/10 ${
                      isSelected 
                        ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary' 
                        : 'hover:bg-surface-container-low hover:shadow-sm'
                    }`}
                  >
                    <td className="px-5 py-4 text-[13px] font-semibold text-primary" title={invoice.id}>
                      {invoice.id.length > 8 ? invoice.id.substring(0, 8) : invoice.id}
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant hidden sm:table-cell">
                      {invoice.billingPeriod}
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-on-surface-variant hidden md:table-cell">
                      <span className={`inline-flex h-7 min-w-[74px] items-center justify-center rounded-full border px-2.5 text-[11px] font-bold ${getInvoiceTypeBadgeClass(invoice.type)}`}>
                        {getInvoiceTypeLabel(invoice.type)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-on-surface text-sm">
                      {invoice.totalAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-on-surface-variant hidden lg:table-cell">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className={`flex items-center gap-2 ${invoice.status === 'paid' ? 'justify-center' : 'justify-start pl-2'}`}>
                        <button
                          onClick={() => onSelect(invoice.id)}
                          className="p-2 text-secondary hover:bg-secondary-container/40 hover:text-primary rounded-lg transition-all cursor-pointer active:scale-90"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => onPay(invoice.id)}
                            className="bg-primary hover:bg-[#253228] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer hover:shadow-md"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Thanh toán
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
