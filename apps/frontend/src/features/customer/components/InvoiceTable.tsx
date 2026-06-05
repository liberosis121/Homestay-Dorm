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
          <span className="status-badge bg-status-success/15 text-status-success font-semibold px-3 py-1 rounded-full text-xs">
            Đã thanh toán
          </span>
        );
      case 'unpaid':
        return (
          <span className="status-badge bg-status-warning/15 text-status-warning font-semibold px-3 py-1 rounded-full text-xs">
            Chờ thanh toán
          </span>
        );
      case 'overdue':
        return (
          <span className="status-badge bg-status-error/15 text-status-error font-semibold px-3 py-1 rounded-full text-xs">
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
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant/20">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mã hóa đơn</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">Kỳ thanh toán</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Loại</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Số tiền</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">Hạn thanh toán</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Hành động</th>
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
                    <td className="px-6 py-4 font-medium text-primary text-sm sm:text-base">
                      {invoice.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant hidden sm:table-cell">
                      {invoice.billingPeriod}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant hidden md:table-cell">
                      <span className="bg-surface-container-high px-2.5 py-1 rounded-md text-xs font-medium text-on-surface">
                        {getInvoiceTypeLabel(invoice.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface text-sm sm:text-base">
                      {invoice.totalAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant hidden lg:table-cell">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
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
