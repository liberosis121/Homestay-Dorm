

interface Room {
  id: string;
  branch_id: string;
  name: string;
  room_type: string;
  gender_type: string;
  capacity: number;
  current_occupants: number;
  price: number;
  amenities: string[];
  status: string;
  image_url: string;
}

interface Props {
  room: Room;
  onActionClick: () => void;
}

export default function ListingRoomCard({ room, onActionClick }: Props) {
  const isAvailable = room.status === 'Available' || room.status === 'Partial';
  const availableBeds = room.capacity - room.current_occupants;
  
  // Tag style based on status
  const tagBg = availableBeds === room.capacity ? 'bg-status-success' : 'bg-status-warning';
  const tagText = availableBeds === room.capacity ? 'Sẵn sàng' : `Còn ${availableBeds} giường`;

  const getBranchName = (id: string) => {
    const map: Record<string, string> = {
      'b-1': 'Chi nhánh Quận 1',
      'b-2': 'Chi nhánh Quận 7',
      'b-3': 'Thủ Đức - Làng Đại Học'
    };
    return map[id] || 'Chi nhánh khác';
  };

  const getAmenityIcon = (am: string) => {
    switch (am) {
      case 'AC': return 'ac_unit';
      case 'Wifi': return 'wifi';
      case 'Private WC': return 'wc';
      case 'Kitchen': return 'kitchen';
      case 'Washing Machine': return 'local_laundry_service';
      default: return 'check_circle';
    }
  };

  const getAmenityLabel = (am: string) => {
    switch (am) {
      case 'AC': return 'Điều hòa';
      case 'Wifi': return 'Wifi';
      case 'Private WC': return 'WC riêng';
      case 'Kitchen': return 'Bếp chung';
      case 'Washing Machine': return 'Máy giặt';
      default: return am;
    }
  };

  return (
    <article className="bg-white rounded-[24px] overflow-hidden shadow-[0_10px_40px_-10px_rgba(95,116,93,0.08)] hover:shadow-[0_20px_50px_-15px_rgba(95,116,93,0.15)] hover:-translate-y-1 transition-all duration-300 flex flex-col group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={room.image_url} 
          alt={room.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        {isAvailable && (
          <div className="absolute top-4 left-4">
            <span className={`${tagBg} text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-lg`}>
              {tagText}
            </span>
          </div>
        )}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-primary hover:bg-white transition-colors">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>favorite</span>
          </button>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[12px] text-primary font-semibold mb-1 uppercase tracking-tight">{getBranchName(room.branch_id)}</p>
            <h3 className="font-headline-md text-[20px] leading-tight text-on-surface">{room.name}</h3>
          </div>
        </div>
        
        <p className="text-on-surface-variant font-body-md text-sm mb-4">
          Phòng {room.room_type === 'Studio' ? 'đơn' : room.room_type === 'Twin' ? 'đôi' : 'Dorm'} • Sức chứa {room.capacity} người
        </p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {room.amenities.slice(0, 3).map((am, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-[#E8EDE7] text-[#5F745D] px-2.5 py-1 rounded-lg text-[12px] font-medium">
              <span className="material-symbols-outlined text-[16px]">{getAmenityIcon(am)}</span> {getAmenityLabel(am)}
            </div>
          ))}
          {room.amenities.length > 3 && (
            <div className="flex items-center gap-1 bg-[#E8EDE7] text-[#5F745D] px-2.5 py-1 rounded-lg text-[12px] font-medium">
              +{room.amenities.length - 3}
            </div>
          )}
        </div>
        
        <div className="mt-auto border-t border-outline-variant pt-4 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[12px] text-on-surface-variant">Giá hàng tháng</p>
              <p className="font-headline-md text-primary text-[22px]">
                {room.price.toLocaleString('vi-VN')}đ
              </p>
            </div>
            <div className="text-right">
              {isAvailable ? (
                <p className="text-[12px] text-status-success font-medium">Cần {availableBeds} khách</p>
              ) : (
                <p className="text-[12px] text-error font-medium">Đã hết chỗ</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={onActionClick}
              disabled={!isAvailable}
              className={`col-span-2 py-3 rounded-full font-label-md transition-all ${
                isAvailable ? 'bg-primary text-on-primary hover:opacity-90' : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'
              }`}
            >
              Đăng ký thuê
            </button>
            <button className="py-2.5 border border-outline-variant rounded-full text-label-md hover:bg-surface-container-low transition-all">
              Xem chi tiết
            </button>
            <button onClick={onActionClick} className="py-2.5 border border-outline-variant rounded-full text-label-md hover:bg-surface-container-low transition-all">
              Hẹn xem
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
