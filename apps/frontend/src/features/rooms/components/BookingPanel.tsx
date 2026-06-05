import { ClipboardList, Sparkles, AlertCircle } from 'lucide-react';

interface Bed {
  id: string;
  room_id: string;
  name: string;
  price: number;
  status: 'available' | 'deposited' | 'occupied' | 'maintenance';
}

interface Props {
  roomPrice: number;
  selectedBeds: string[];
  beds: Bed[];
  isFullRoomSelected: boolean;
  onAction: (type: 'interest') => void;
  roomStatus: string;
}

export default function BookingPanel({
  roomPrice,
  selectedBeds,
  beds,
  isFullRoomSelected,
  onAction,
  roomStatus
}: Props) {
  const count = selectedBeds.length;
  
  // Resolve selected bed objects
  const selectedBedObjs = beds.filter(b => selectedBeds.includes(b.id));

  // Dynamic calculations
  let baseRent = 0;
  let discount = 0;
  
  if (isFullRoomSelected) {
    // 5% discount for full room package booking
    const originalRent = beds.length * roomPrice;
    discount = originalRent * 0.05;
    baseRent = originalRent - discount;
  } else {
    // Sum of selected bed prices
    baseRent = selectedBedObjs.reduce((sum, b) => sum + b.price, 0);
  }

  const waterCost = Math.max(1, count) * 100000; // 100k per person
  const electricityRate = '4.000đ/kwh';

  // Availability text and indicator styles
  const availableBeds = beds.filter(b => b.status === 'available').length;
  
  const getStatusIndicator = () => {
    if (roomStatus === 'maintenance') {
      return (
        <span className="text-status-error font-bold flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5" />
          Phòng đang bảo trì
        </span>
      );
    }
    if (availableBeds === 0) {
      return (
        <span className="text-status-error font-bold flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5" />
          Đã hết giường trống
        </span>
      );
    }
    return (
      <span className="text-status-success font-bold flex items-center gap-2 text-sm">
        <Sparkles className="w-5 h-5 animate-pulse" />
        Còn {availableBeds} giường trống
      </span>
    );
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-32 border border-outline-variant/40 shadow-xl shadow-sage-dark/5 space-y-6">
      
      {/* Header Info inside booking panel */}
      <div>
        <p className="text-caption text-on-surface-variant mb-1 font-medium">Tình trạng phòng</p>
        <div className="flex items-center justify-between">
          {getStatusIndicator()}
          {count > 0 && (
            <span className="bg-primary/15 text-primary font-bold px-3 py-1 rounded-full text-caption">
              {isFullRoomSelected ? 'Nguyên phòng' : `Đã chọn: ${count}`}
            </span>
          )}
        </div>
      </div>

      {/* Selected Beds list */}
      <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
        <p className="text-[12px] font-bold text-primary mb-2 uppercase tracking-wide">Giường lựa chọn</p>
        {count === 0 ? (
          <p className="text-xs text-on-surface-variant italic">
            Chưa chọn giường nào. Vui lòng tích chọn trên sơ đồ phòng.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {isFullRoomSelected ? (
              <span className="bg-primary text-on-primary text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> Bao trọn phòng ({beds.length} Giường)
              </span>
            ) : (
              selectedBedObjs.map((b) => (
                <span 
                  key={b.id} 
                  className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold px-2.5 py-1 rounded-full"
                >
                  {b.name}
                </span>
              ))
            )}
          </div>
        )}
      </div>

      {/* Price breakdown details */}
      <div className="border-t border-b border-outline-variant py-4 space-y-3">
        <div className="flex justify-between items-center text-body-md">
          <span className="text-on-surface-variant flex items-center gap-1.5">
            Tiền thuê {isFullRoomSelected ? 'phòng' : count > 1 ? `(${count} giường)` : 'giường'}
          </span>
          <div className="text-right">
            {discount > 0 && (
              <p className="text-[11px] text-error line-through">
                {(beds.length * roomPrice).toLocaleString('vi-VN')}đ
              </p>
            )}
            <p className="font-bold text-on-surface">
              {baseRent > 0 ? `${baseRent.toLocaleString('vi-VN')}đ` : '0đ'}
            </p>
          </div>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-xs text-status-success font-medium">
            <span>Ưu đãi thuê nguyên phòng (-5%)</span>
            <span>-{discount.toLocaleString('vi-VN')}đ</span>
          </div>
        )}

        <div className="flex justify-between text-body-md">
          <span className="text-on-surface-variant">Điện (Tạm tính)</span>
          <span className="font-bold text-on-surface">{electricityRate}</span>
        </div>
        <div className="flex justify-between text-body-md">
          <span className="text-on-surface-variant">Nước (Cố định)</span>
          <span className="font-bold text-on-surface">
            {count > 0 ? `${waterCost.toLocaleString('vi-VN')}đ` : '0đ'} 
            <span className="text-[10px] font-normal text-on-surface-variant"> /tháng</span>
          </span>
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => onAction('interest')}
          disabled={roomStatus === 'maintenance'}
          className={`w-full py-4 rounded-full font-label-md text-label-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md ${
            roomStatus !== 'maintenance'
              ? 'bg-primary text-on-primary hover:shadow-lg hover:shadow-primary/20'
              : 'bg-surface-variant text-on-surface-variant opacity-60 cursor-not-allowed shadow-none'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Tôi quan tâm phòng này
        </button>

        <p className="text-xs text-on-surface-variant leading-relaxed text-center px-2">
          Nhân viên Sale sẽ kiểm tra tình trạng thực tế và sắp xếp lịch xem phòng phù hợp. Khách chỉ đặt cọc sau khi đã xem phòng.
        </p>
      </div>

      {/* Bottom guarantee badge */}
      <p className="text-center text-caption text-on-surface-variant flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
        Gửi phiếu nhu cầu trước, Sale xếp phòng sau
      </p>
    </div>
  );
}
