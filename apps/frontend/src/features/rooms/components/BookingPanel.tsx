import { ClipboardList, Sparkles, AlertCircle, Users } from 'lucide-react';

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
  onAction: (type: 'interest' | 'group') => void;
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

  // beds.price is the single source of truth for money: the backend charges
  // deposits off it (customer-deposit.service.ts). rooms.price is only a
  // catalog/filter value and does not always match, so it is a fallback here.
  const bedPrices = beds.map(b => Number(b.price) || 0).filter(p => p > 0);
  const minBedPrice = bedPrices.length ? Math.min(...bedPrices) : roomPrice;
  const maxBedPrice = bedPrices.length ? Math.max(...bedPrices) : roomPrice;
  const hasMixedBedPrices = minBedPrice !== maxBedPrice;

  // Dynamic calculations
  const baseRent = isFullRoomSelected
    ? bedPrices.reduce((sum, p) => sum + p, 0)
    : selectedBedObjs.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const waterRatePerPerson = 100000;
  const waterCost = count * waterRatePerPerson;
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
            Nhân viên Sale sẽ xếp giường cụ thể sau khi tiếp nhận phiếu đăng ký của bạn.
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
            {count === 0
              ? hasMixedBedPrices ? 'Giá giường từ' : 'Đơn giá mỗi giường'
              : `Tiền thuê ${isFullRoomSelected ? 'phòng' : count > 1 ? `(${count} giường)` : 'giường'}`}
          </span>
          <div className="text-right">
            <p className="font-bold text-on-surface">
              {count === 0
                ? `${minBedPrice.toLocaleString('vi-VN')}đ`
                : `${baseRent.toLocaleString('vi-VN')}đ`}
              {count === 0 && (
                <span className="text-[10px] font-normal text-on-surface-variant"> /tháng</span>
              )}
            </p>
            {count === 0 && hasMixedBedPrices && (
              <p className="text-[11px] text-on-surface-variant">
                đến {maxBedPrice.toLocaleString('vi-VN')}đ tuỳ giường
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between text-body-md">
          <span className="text-on-surface-variant">Điện (Tạm tính)</span>
          <span className="font-bold text-on-surface">{electricityRate}</span>
        </div>
        <div className="flex justify-between text-body-md">
          <span className="text-on-surface-variant">Nước (Cố định)</span>
          <span className="font-bold text-on-surface">
            {count > 0 ? `${waterCost.toLocaleString('vi-VN')}đ` : `${waterRatePerPerson.toLocaleString('vi-VN')}đ`}
            <span className="text-[10px] font-normal text-on-surface-variant">
              {count > 0 ? ' /tháng' : ' /người/tháng'}
            </span>
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

        <button
          onClick={() => onAction('group')}
          disabled={roomStatus === 'maintenance' || availableBeds === 0}
          className={`w-full py-4 rounded-full font-label-md text-label-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-2 ${
            roomStatus !== 'maintenance' && availableBeds > 0
              ? 'border-primary text-primary hover:bg-primary/5 cursor-pointer'
              : 'border-outline-variant text-on-surface-variant opacity-60 cursor-not-allowed'
          }`}
        >
          <Users className="w-4 h-4" />
          Đăng ký thuê theo nhóm
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
