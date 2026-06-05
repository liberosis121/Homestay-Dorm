import { Check, Sparkles } from 'lucide-react';

interface Bed {
  id: string;
  room_id: string;
  name: string;
  price: number;
  status: 'available' | 'deposited' | 'occupied' | 'maintenance';
}

interface Props {
  beds: Bed[];
  selectedBeds: string[];
  onSelectionChange: (selectedIds: string[], isFullRoom: boolean) => void;
  isFullRoomSelected: boolean;
  currentOccupants: number;
}

export default function BedAvailability({
  beds,
  selectedBeds,
  onSelectionChange,
  isFullRoomSelected
}: Props) {
  const totalBeds = beds.length;
  const availableBeds = beds.filter(b => b.status === 'available');
  
  // Customer catalog only shows availability. Sale assigns actual beds after reviewing the registration form.
  const canRentFullRoom = false;

  const handleBedToggle = (bedId: string) => {
    if (isFullRoomSelected) return; // Locked in full room mode

    const isSelected = selectedBeds.includes(bedId);
    let newSelection: string[];
    if (isSelected) {
      newSelection = selectedBeds.filter(id => id !== bedId);
    } else {
      newSelection = [...selectedBeds, bedId];
    }
    
    onSelectionChange(newSelection, false);
  };

  const handleFullRoomToggle = () => {
    if (isFullRoomSelected) {
      // Toggle off full room mode: clear all selected
      onSelectionChange([], false);
    } else {
      // Toggle on full room mode: select all available beds
      const allAvailableIds = availableBeds.map(b => b.id);
      onSelectionChange(allAvailableIds, true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Sơ đồ giường & Trạng thái</h2>
          <p className="text-sm text-on-surface-variant">Thông tin tham khảo. Nhân viên Sale sẽ xếp phòng/giường sau khi nhận phiếu đăng ký.</p>
        </div>

        {/* Full Room Option (Only if eligible) */}
        {canRentFullRoom && (
          <button
            onClick={handleFullRoomToggle}
            className={`flex items-center gap-2 px-5 py-3 rounded-full border transition-all cursor-pointer font-label-md text-sm ${
              isFullRoomSelected
                ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20 scale-[0.98]'
                : 'bg-white hover:bg-sage-light text-primary border-primary/30 hover:border-primary/50'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isFullRoomSelected ? 'animate-bounce' : ''}`} />
            Thuê trọn gói nguyên phòng
            {isFullRoomSelected && <Check className="w-4 h-4 ml-1" />}
          </button>
        )}
      </div>

      {/* Beds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {beds.map((bed) => {
          const isSelected = selectedBeds.includes(bed.id);
          
          let cardStyle = '';
          let badgeText = '';
          let badgeStyle = '';
          let clickable = false;

          switch (bed.status) {
            case 'available':
              clickable = false;
              badgeText = 'Đang trống';
              badgeStyle = 'bg-status-success/15 text-status-success';
              
              if (isFullRoomSelected) {
                cardStyle = 'border-primary/60 bg-primary/5 opacity-90';
              } else if (isSelected) {
                cardStyle = 'border-primary bg-surface-bright ring-2 ring-primary/20 shadow-md scale-[0.99]';
              } else {
                cardStyle = 'border-outline-variant hover:border-primary/50 hover:shadow-sm bg-white';
              }
              break;

            case 'deposited':
              badgeText = 'Đã đặt cọc';
              badgeStyle = 'bg-status-warning/15 text-status-warning';
              cardStyle = 'border-outline-variant/40 bg-surface-container-low opacity-60 cursor-not-allowed';
              break;

            case 'occupied':
              badgeText = 'Đã có người';
              badgeStyle = 'bg-on-surface-variant/10 text-on-surface-variant';
              cardStyle = 'border-outline-variant/40 bg-surface-container-low opacity-60 cursor-not-allowed';
              break;

            case 'maintenance':
              badgeText = 'Bảo trì';
              badgeStyle = 'bg-status-error/15 text-status-error';
              cardStyle = 'border-outline-variant/40 bg-surface-container-low opacity-60 cursor-not-allowed';
              break;
          }

          return (
            <div
              key={bed.id}
              onClick={() => clickable && handleBedToggle(bed.id)}
              className={`p-5 border-2 rounded-2xl flex items-center justify-between transition-all duration-300 ${cardStyle} ${
                clickable ? 'cursor-pointer active:scale-[0.98]' : 'pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected || isFullRoomSelected ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined font-bold text-[24px]">bed</span>
                </div>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface flex items-center gap-2">
                    {bed.name}
                    {isFullRoomSelected && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-normal">
                        Bao phòng
                      </span>
                    )}
                  </h4>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold tracking-wide mt-1.5 ${badgeStyle}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      bed.status === 'available' ? 'bg-status-success' : bed.status === 'deposited' ? 'bg-status-warning' : bed.status === 'occupied' ? 'bg-on-surface-variant' : 'bg-status-error'
                    }`}></span>
                    {badgeText}
                  </span>
                </div>
              </div>

              {/* Selection Check Icon */}
              {bed.status === 'available' && (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                  isSelected || isFullRoomSelected
                    ? 'bg-primary border-primary text-on-primary scale-110 shadow-md shadow-primary/15'
                    : 'border-outline-variant bg-transparent'
                }`}>
                  {(isSelected || isFullRoomSelected) && <Check className="w-4 h-4" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Friendly Guide Info */}
      {isFullRoomSelected && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-primary text-sm flex items-start gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Bạn đang kích hoạt chế độ **Thuê nguyên phòng**. Tất cả giường trống ({availableBeds.length}/{totalBeds} giường) đã được chọn. Khách hàng lân cận sẽ không thể thuê lẻ giường của phòng này nữa. Mức giá trọn gói sẽ được áp dụng trong bảng bên phải.
          </p>
        </div>
      )}
    </div>
  );
}
