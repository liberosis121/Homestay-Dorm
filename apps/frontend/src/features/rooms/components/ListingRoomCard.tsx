

import { useNavigate } from 'react-router-dom';

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
  available_beds_count?: number;
  branches?: {
    id: string;
    name: string;
    address: string;
  };
}

interface Props {
  room: Room;
}

export default function ListingRoomCard({ room }: Props) {
  const navigate = useNavigate();
  const availableBeds = Math.max(room.available_beds_count ?? (room.capacity - room.current_occupants), 0);
  const isAvailable = (room.status === 'available' || room.status === 'partial') && availableBeds > 0;
  
  // Tag style based on status
  const tagBg = availableBeds === room.capacity ? 'bg-status-success' : 'bg-status-warning';
  const tagText = availableBeds === room.capacity ? 'Sẵn sàng' : `Còn ${availableBeds} giường`;


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

      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[12px] text-primary font-semibold mb-1 uppercase tracking-tight">{room.branches?.name || 'Chi nhánh khác'}</p>
            <h3 className="font-headline-md text-[20px] leading-tight text-on-surface">{room.name}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-on-surface-variant font-body-md text-sm">
            Phòng {room.room_type === 'Studio' ? 'đơn' : room.room_type === 'Twin' ? 'đôi' : 'Dorm'}
          </span>
          <span className="inline-flex items-center bg-primary/10 text-primary text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            Sức chứa {room.capacity} người
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {room.amenities.slice(0, 3).map((am, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full text-caption font-medium">
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{getAmenityIcon(am)}</span> {getAmenityLabel(am)}
            </div>
          ))}
          {room.amenities.length > 3 && (
            <div className="flex items-center gap-1 bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full text-caption font-medium">
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
                <p className="text-[12px] text-status-success font-medium">Còn {availableBeds} giường</p>
              ) : (
                <p className="text-[12px] text-error font-medium">Đã hết chỗ</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-center mt-2">
            <button 
              onClick={() => navigate(`/customer/rooms/${room.id}`)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-xs font-semibold hover:shadow-[0_8px_20px_-6px_rgba(95,116,93,0.4)] hover:-translate-y-0.5 hover:bg-primary/95 transition-all duration-300 group/btn cursor-pointer"
            >
              <span>Xem chi tiết</span>
              <span className="material-symbols-outlined text-[14px] transition-transform duration-300 group-hover/btn:translate-x-0.5">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
