import { Mail, CalendarPlus } from 'lucide-react';
import { Customer } from '../../../lib/mockCustomers';
export type { Customer };

interface CustomerProfileCardProps {
  customer: Customer;
  onActionEmail?: () => void;
  onActionAppointment?: () => void;
}

export default function CustomerProfileCard({
  customer,
  onActionEmail,
  onActionAppointment,
}: CustomerProfileCardProps) {
  // Huy hiệu phân hạng khách hàng
  const getTierBadge = (tier: Customer['tier']) => {
    if (tier === 'New') {
      return {
        label: 'Khách hàng mới',
        cls: 'bg-[#d2e9cd] text-[#384c37] border-[#4d614b]/20',
      };
    } else {
      return {
        label: 'Khách hàng cũ',
        cls: 'bg-[#e6e2de] text-[#605e5b] border-[#d1c4b9]/25',
      };
    }
  };

  const badge = getTierBadge(customer.tier);

  return (
    <div className="bg-white p-6 rounded-24 border border-[#d1c4b9] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="relative">
          <img
            alt={customer.fullName}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-[#6f583c]/20 shadow-sm"
            src={customer.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150'}
            onError={(e) => {
              // Fallback avatar
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150';
            }}
          />
          <span
            className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${
              customer.status === 'active' ? 'bg-[#4d614b]' : 'bg-[#605e5b]'
            }`}
            title={customer.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
          />
        </div>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
            <h3 className="text-xl font-bold text-[#6f583c] tracking-tight">{customer.fullName}</h3>
            <span className={`inline-block px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border text-center ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-[#4e453c] font-medium">
            Mã KH: <span className="font-bold text-[#6f583c]">{customer.code}</span> • Tham gia từ {customer.joinDate}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 shrink-0">
        <button
          onClick={onActionEmail}
          className="flex items-center gap-2 px-4 py-2 border border-[#d1c4b9] text-[#4e453c] hover:bg-[#faf2ec] rounded-xl transition-all cursor-pointer font-semibold text-xs active:scale-95 duration-200"
        >
          <Mail className="w-4 h-4 text-[#6f583c]" />
          Gửi email
        </button>
        <button
          onClick={onActionAppointment}
          className="flex items-center gap-2 px-4 py-2 bg-[#6f583c] hover:bg-[#6f583c]/90 text-white rounded-xl transition-all cursor-pointer font-semibold text-xs shadow-sm shadow-[#6f583c]/10 active:scale-95 duration-200"
        >
          <CalendarPlus className="w-4 h-4" />
          Tạo lịch hẹn
        </button>
      </div>
    </div>
  );
}
