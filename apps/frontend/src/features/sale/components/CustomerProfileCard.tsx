import { formatShortId } from '../../../lib/utils';
import { Customer } from '../services/customerLookup.service';
export type { Customer };

interface CustomerProfileCardProps {
  customer: Customer;
}

export default function CustomerProfileCard({
  customer,
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
  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'KH';
    return words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  };

  return (
    <div className="bg-white p-6 rounded-24 border border-[#d1c4b9] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="relative">
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#faf2ec] text-lg font-extrabold text-[#6f583c] ring-2 ring-[#6f583c]/20 shadow-sm">
            <span>{getInitials(customer.fullName)}</span>
            {customer.avatar && (
              <img
                alt={customer.fullName}
                className="absolute inset-0 h-full w-full object-cover"
                src={customer.avatar}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
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
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
            <span className="inline-flex items-center rounded-full border border-[#d1c4b9]/80 bg-[#faf2ec]/70 px-2.5 py-1 text-[11px] font-semibold text-[#5f584f]">
              Mã KH: <span className="ml-1 font-bold text-[#6f583c]">{formatShortId(customer.code, 'customer')}</span>
            </span>

          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 shrink-0">
      </div>
    </div>
  );
}
