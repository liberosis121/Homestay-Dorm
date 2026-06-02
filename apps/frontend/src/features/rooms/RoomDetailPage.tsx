import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMockDB } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import { useDepositStore } from '../customer/store/useDepositStore';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import Gallery from './components/Gallery';
import BedAvailability from './components/BedAvailability';
import BookingPanel from './components/BookingPanel';
import { 
  Users, 
  MapPin, 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Star,
  Layers,
  Maximize,
  CheckCircle,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface Room {
  id: string;
  branch_id: string;
  name: string;
  capacity: number;
  current_occupants: number;
  floor: number;
  room_type: string;
  gender_type: 'male' | 'female' | 'unisex';
  has_ac: boolean;
  has_private_wc: boolean;
  price: number;
  amenities: string[];
  image_url: string;
  status: 'available' | 'deposited' | 'occupied' | 'maintenance' | 'partial';
}

interface Bed {
  id: string;
  room_id: string;
  name: string;
  price: number;
  status: 'available' | 'deposited' | 'occupied' | 'maintenance';
}

export default function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [room, setRoom] = useState<Room | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [branchAddress, setBranchAddress] = useState<string>('Quận 1, TP. Hồ Chí Minh');
  const [branchName, setBranchName] = useState<string>('Chi nhánh Quận 1');
  
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);
  const [isFullRoomSelected, setIsFullRoomSelected] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Success Notification States
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  const fetchRoomData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const db = getMockDB();
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const foundRoom = db.rooms?.find((r: any) => r.id === roomId) as Room;
      if (!foundRoom) {
        setRoom(null);
        setIsLoading(false);
        return;
      }

      setRoom(foundRoom);

      // Fetch or generate beds
      let matchedBeds = db.beds?.filter((b: any) => b.room_id === roomId) as Bed[];
      if (!matchedBeds || matchedBeds.length === 0) {
        // Dynamically generate beds for rich demo data based on capacity & status
        const count = foundRoom.capacity;
        const occupiedCount = foundRoom.current_occupants;
        
        matchedBeds = Array.from({ length: count }).map((_, index) => {
          let status: 'available' | 'occupied' | 'deposited' = 'available';
          if (index < occupiedCount) {
            status = 'occupied';
          }
          return {
            id: `${foundRoom.id}-bed-${index + 1}`,
            room_id: foundRoom.id,
            name: `Giường ${String.fromCharCode(65 + index)}`, // Giường A, Giường B, Giường C...
            price: foundRoom.price,
            status: status
          };
        });
      }
      setBeds(matchedBeds);

      // Fetch branch info
      const foundBranch = db.branches?.find((b: any) => b.id === foundRoom.branch_id);
      if (foundBranch) {
        setBranchName(foundBranch.name);
        setBranchAddress(foundBranch.address);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi kết nối dữ liệu. Vui lòng tải lại trang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
    // Scroll to top
    window.scrollTo(0, 0);
  }, [roomId]);

  const handleSelectionChange = (selectedIds: string[], isFullRoom: boolean) => {
    setSelectedBeds(selectedIds);
    setIsFullRoomSelected(isFullRoom);
  };

  const handleBookingAction = (type: 'rent' | 'deposit' | 'schedule') => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'customer' && user.renting_room_name) {
      setNotification({
        type: 'warning',
        message: `Hiện bạn đang thuê ${user.renting_room_name}, lưu ý trả phòng theo hợp đồng trước khi thuê phòng mới.`
      });
      return;
    }

    if (type === 'schedule') {
      setNotification({
        type: 'success',
        message: `Hẹn lịch xem phòng thành công! Nhân viên tư vấn của chi nhánh "${branchName}" sẽ liên hệ với bạn qua SĐT/Email trong vòng 15 phút.`
      });
      return;
    }

    if (selectedBeds.length === 0) return;

    if (type === 'rent') {
      const selectedBedsNames = isFullRoomSelected 
        ? beds.map(b => b.name) 
        : beds.filter(b => selectedBeds.includes(b.id)).map(b => b.name);
        
      const state = { 
        roomId: room?.id, 
        roomName: room?.name, 
        capacity: room?.capacity,
        availableBeds: beds.filter(b => b.status === 'available').length,
        selectedBedsNames,
        genderType: room?.gender_type
      };
      
      if (selectedBeds.length > 1 || isFullRoomSelected) {
        navigate('/customer/register-group', { state });
      } else {
        navigate('/customer/register-lease', { state });
      }
    } else if (type === 'deposit') {
      if (!room || selectedBeds.length === 0) return;

      const selectedBedObjs = beds.filter(b => selectedBeds.includes(b.id));
      let depositAmount = 0;
      if (isFullRoomSelected) {
        const originalRent = beds.length * room.price;
        const discount = originalRent * 0.05;
        depositAmount = originalRent - discount;
      } else {
        depositAmount = selectedBedObjs.reduce((sum, b) => sum + b.price, 0);
      }

      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const checkInDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const bedNames = isFullRoomSelected 
        ? beds.map(b => b.name)
        : selectedBedObjs.map(b => b.name);

      const roomType = room.room_type === 'Studio' 
        ? 'Phòng Studio Cao cấp' 
        : room.room_type === 'Twin' 
          ? 'Phòng đôi Twin' 
          : 'Phòng ký túc xá (Dorm)';

      const depositInfo = {
        roomId: room.id,
        roomName: room.name,
        roomType,
        bedNames,
        branch: branchName,
        checkInDate,
        depositAmount,
        deadline,
      };

      // Reset first to clear any old payment proof/status, then set info
      useDepositStore.getState().reset();
      useDepositStore.getState().setDepositInfo(depositInfo);

      navigate('/customer/deposit');
    }
  };

  // Helper labels
  const getGenderLabel = (type: string) => {
    switch (type) {
      case 'female': return 'Nữ';
      case 'male': return 'Nam';
      default: return 'Unisex';
    }
  };

  const getGenderBadge = (type: string) => {
    switch (type) {
      case 'female':
        return <span className="bg-error/10 text-error px-3 py-1 rounded-full text-caption font-bold inline-block">Nữ duy nhất</span>;
      case 'male':
        return <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-caption font-bold inline-block">Nam duy nhất</span>;
      default:
        return <span className="bg-timber-accent/15 text-timber-accent px-3 py-1 rounded-full text-caption font-bold inline-block">Phòng Unisex</span>;
    }
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
      case 'AC': return 'Máy lạnh Inverter';
      case 'Wifi': return 'Wifi 5G tốc độ cao';
      case 'Private WC': return 'Nhà vệ sinh riêng';
      case 'Kitchen': return 'Bếp điện cao cấp';
      case 'Washing Machine': return 'Máy giặt & sấy';
      default: return am;
    }
  };

  // ----------------------------------------------------
  // RENDER: LOADING STATE (Skeleton)
  // ----------------------------------------------------
  if (isLoading) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col pt-20">
        <Navbar />
        <main className="flex-grow pt-8 pb-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full animate-pulse">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-surface-container-highest rounded-full" />
            <div className="w-32 h-6 bg-surface-container-highest rounded-md" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-12">
            <div className="lg:col-span-8 space-y-4">
              <div className="aspect-[16/9] bg-surface-container-highest rounded-[24px]" />
              <div className="flex gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="w-24 h-24 bg-surface-container-highest rounded-2xl shrink-0" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-center space-y-4">
              <div className="w-28 h-6 bg-surface-container-highest rounded-full" />
              <div className="w-72 h-10 bg-surface-container-highest rounded-md" />
              <div className="w-48 h-6 bg-surface-container-highest rounded-md" />
              <div className="h-28 bg-surface-container rounded-2xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-3">
                <div className="w-40 h-8 bg-surface-container-highest rounded-md" />
                <div className="h-20 bg-surface-container-highest rounded-xl" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-28 bg-surface-container rounded-2xl" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="h-96 bg-surface-container rounded-[32px]" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: ERROR STATE
  // ----------------------------------------------------
  if (error) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6 pt-28">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-32 p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="font-headline-md font-bold text-on-surface">Đã xảy ra lỗi</h3>
            <p className="text-on-surface-variant text-sm">{error}</p>
            <button
              onClick={fetchRoomData}
              className="w-full py-3.5 bg-primary text-on-primary rounded-full font-label-md hover:opacity-90 transition-all cursor-pointer"
            >
              Thử tải lại dữ liệu
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: NOT FOUND STATE (Unavailable Room)
  // ----------------------------------------------------
  if (!room) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6 pt-28">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-32 p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-timber-accent/15 text-timber-accent rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-headline-md font-bold text-on-surface">Không tìm thấy phòng</h3>
            <p className="text-on-surface-variant text-sm">
              Mã phòng này không tồn tại trong hệ thống hoặc hiện đang trong quá trình bảo trì nâng cấp chất lượng.
            </p>
            <Link
              to="/rooms"
              className="inline-flex w-full py-3.5 bg-primary text-on-primary rounded-full font-label-md items-center justify-center hover:opacity-90 transition-all cursor-pointer"
            >
              Quay lại danh sách phòng trống
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Dummy gallery photos
  const galleryImages = [
    room.image_url,
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80'
  ];

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col">
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow pt-24 pb-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full relative">
        
        {notification && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] w-full max-w-xl p-4 animate-fade-in-up">
            <div className={`backdrop-blur-md p-5 rounded-2xl shadow-2xl flex items-start gap-4 border border-white/20 ${
              notification.type === 'warning' 
                ? 'bg-status-warning/95 text-white' 
                : 'bg-primary/95 text-on-primary'
            }`}>
              {notification.type === 'warning' ? (
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" />
              )}
              <div className="flex-grow">
                <h4 className="font-bold text-label-md">
                  {notification.type === 'warning' ? 'Lưu ý' : 'Xử lý thành công'}
                </h4>
                <p className="text-xs opacity-90 mt-1 leading-relaxed">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className={`${
                  notification.type === 'warning' 
                    ? 'text-white/80 hover:text-white hover:bg-white/10' 
                    : 'text-on-primary/80 hover:text-on-primary hover:bg-white/10'
                } p-1 rounded-full cursor-pointer transition-colors`}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6 mb-8">
          <Link 
            to="/rooms" 
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-transparent rounded-full hover:border-primary/25 hover:bg-primary/5 transition-all duration-300 text-primary font-label-md group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> Quay lại danh sách phòng
          </Link>
        </div>

        {/* Hero Gallery & Header Info Row */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-12">
          {/* Left: Gallery Component */}
          <div className="lg:col-span-8">
            <Gallery images={galleryImages} roomName={room.name} />
          </div>

          {/* Right: Header quick details */}
          <div className="lg:col-span-4 flex flex-col justify-center space-y-5">
            <div>
              {getGenderBadge(room.gender_type)}
              <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mt-2 leading-tight">
                {room.name}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-on-surface-variant">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="font-body-md text-sm">
                  <strong className="font-semibold">{branchName}</strong> - {branchAddress}
                </span>
              </div>
            </div>

            <div className="p-6 bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-sm">
              <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-1 font-semibold">
                Đơn giá mỗi giường
              </p>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-md text-headline-md text-primary font-bold">
                  {room.price.toLocaleString('vi-VN')}đ
                </span>
                <span className="text-on-surface-variant text-sm">/tháng</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-status-success/10 border border-status-success/20 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
              <div>
                <p className="font-label-md text-status-success text-sm font-bold">An ninh & Bảo mật</p>
                <p className="text-caption text-status-success/80 mt-0.5">Camera giám sát 24/7 và hệ thống thẻ từ an toàn tuyệt đối.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Details and Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          
          {/* Left: Detailed Contents */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Description */}
            <section className="space-y-4">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Mô tả phòng</h2>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Chào mừng bạn đến với {room.name}, không gian sống lý tưởng được thiết kế tỉ mỉ mang phong cách Sage & Timber đặc trưng. Căn phòng sở hữu hệ thống cửa sổ kịch trần đón trọn ánh sáng tự nhiên và tầm nhìn xanh mát hướng ra khuôn viên thành phố yên tĩnh. Nội thất cao cấp chế tác hoàn toàn từ gỗ tự nhiên sáng màu kết hợp cùng các chi tiết trang trí tối giản, thân thiện với môi trường, mang lại cảm giác thư thái tối ưu sau một ngày học tập và làm việc mệt mỏi.
              </p>
            </section>

            {/* Bento Grid Info Box */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-2xl text-center space-y-1 shadow-sm hover:shadow-md transition-shadow">
                <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-caption text-on-surface-variant">Sức chứa tối đa</p>
                <p className="font-label-md text-label-md text-on-surface font-bold">{room.capacity} người</p>
              </div>

              <div className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-2xl text-center space-y-1 shadow-sm hover:shadow-md transition-shadow">
                <span className="material-symbols-outlined text-[26px] text-primary block text-center mb-1">
                  {room.gender_type === 'female' ? 'female' : room.gender_type === 'male' ? 'male' : 'wc'}
                </span>
                <p className="text-caption text-on-surface-variant">Giới tính phù hợp</p>
                <p className="font-label-md text-label-md text-on-surface font-bold">{getGenderLabel(room.gender_type)}</p>
              </div>

              <div className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-2xl text-center space-y-1 shadow-sm hover:shadow-md transition-shadow">
                <Layers className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-caption text-on-surface-variant">Vị trí tầng</p>
                <p className="font-label-md text-label-md text-on-surface font-bold">Tầng {room.floor}</p>
              </div>

              <div className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-2xl text-center space-y-1 shadow-sm hover:shadow-md transition-shadow">
                <Maximize className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-caption text-on-surface-variant">Diện tích sử dụng</p>
                <p className="font-label-md text-label-md text-on-surface font-bold">25 m²</p>
              </div>
            </section>

            {/* Amenities Section */}
            <section className="space-y-5">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Tiện ích cao cấp</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {room.amenities.map((am, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-outline-variant/30 rounded-2xl shadow-sm hover:border-primary/30 transition-all">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">{getAmenityIcon(am)}</span>
                    </div>
                    <span className="text-body-md font-medium text-on-surface-variant">{getAmenityLabel(am)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Bed Availability Component */}
            <section className="border-t border-outline-variant/40 pt-10">
              <BedAvailability
                beds={beds}
                selectedBeds={selectedBeds}
                onSelectionChange={handleSelectionChange}
                isFullRoomSelected={isFullRoomSelected}
                currentOccupants={room.current_occupants}
              />
            </section>

            {/* Map Location Section */}
            <section className="space-y-4">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Vị trí thực tế</h2>
              <div className="relative w-full h-80 rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 border border-outline-variant/50 shadow-md">
                {/* Styled Iframe representation/mock for high accessibility */}
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                  <div className="text-center p-6 space-y-3 z-10 max-w-sm">
                    <MapPin className="w-10 h-10 text-primary mx-auto animate-bounce" />
                    <p className="font-bold text-on-surface">{branchName}</p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {branchAddress}
                    </p>
                  </div>
                  {/* Real map aesthetic image background from Unsplash */}
                  <img 
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80" 
                    alt="Map illustration background" 
                    className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                  />
                </div>
              </div>
              <p className="flex items-start gap-2.5 text-on-surface-variant text-sm mt-3">
                <span className="material-symbols-outlined text-[20px] text-primary shrink-0">pin_drop</span>
                <span>{branchAddress} (Tọa lạc tại khu dân cư an ninh cao, cách trạm xe buýt 100m, cách các trường đại học lân cận chỉ 5-10 phút đi bộ).</span>
              </p>
            </section>

            {/* Room Rules Section */}
            <section className="p-8 bg-surface-container-high border border-outline-variant/40 rounded-32 space-y-5">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-timber-accent font-bold text-[28px]">gavel</span>
                Nội quy và Điều khoản phòng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex gap-3 text-sm items-start text-on-surface-variant font-medium">
                    <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
                    <span>Giữ gìn vệ sinh chung, dọn dẹp khu vực cá nhân gọn gàng.</span>
                  </div>
                  <div className="flex gap-3 text-sm items-start text-on-surface-variant font-medium">
                    <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
                    <span>Không phát tiếng ồn, mở loa quá lớn sau 23:00 tối.</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 text-sm items-start text-on-surface-variant font-medium">
                    <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
                    <span>Khách ngoài vào chơi vui lòng đăng ký trước với quản lý.</span>
                  </div>
                  <div className="flex gap-3 text-sm items-start text-on-surface-variant font-medium">
                    <XCircle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
                    <span>Tuyệt đối không hút thuốc hoặc tàng trữ chất dễ cháy nổ.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Customer Reviews Section */}
            <section className="space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant/40 pb-4">
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Đánh giá từ khách thuê</h2>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-status-warning fill-status-warning" />
                  <span className="font-bold text-headline-md text-on-surface">4.8</span>
                  <span className="text-caption text-on-surface-variant font-medium">(24 nhận xét)</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-white dark:bg-slate-900 border border-outline-variant/30 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-lg shadow-inner">
                      N
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Nguyễn Thảo Nguyên</p>
                      <p className="text-caption text-on-surface-variant">Đang thuê • Tháng 10, 2023</p>
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface-variant italic leading-relaxed pl-1">
                    "Phòng ốc sạch sẽ, thoáng mát, nội thất gỗ tự nhiên rất đẹp và thơm mùi gỗ mới. Quản lý chi nhánh hỗ trợ siêu nhiệt tình. Khu dân cư cực an ninh, gần ĐH Hoa Sen đi học rất tiện lợi!"
                  </p>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border border-outline-variant/30 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-timber-accent/15 text-timber-accent flex items-center justify-center font-bold text-lg shadow-inner">
                      A
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Trần Minh Anh</p>
                      <p className="text-caption text-on-surface-variant">Đã ở 1 năm • Tháng 08, 2023</p>
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface-variant italic leading-relaxed pl-1">
                    "Không gian chung rất thoáng đãng, các bạn cùng phòng đều có ý thức văn minh cao. Bếp và máy giặt hiện đại, tiện lợi. Rất thích phong cách Sage & Timber mộc mạc thư thái ở đây."
                  </p>
                </div>

                <button className="w-full py-3.5 border border-outline-variant hover:bg-surface-container-low rounded-full text-label-md font-label-md text-primary transition-colors cursor-pointer">
                  Xem thêm đánh giá cũ hơn
                </button>
              </div>
            </section>

          </div>

          {/* Right: Sticky Booking Panel SideBar */}
          <aside className="lg:col-span-4 sticky top-24 z-10">
            <BookingPanel
              roomPrice={room.price}
              selectedBeds={selectedBeds}
              beds={beds}
              isFullRoomSelected={isFullRoomSelected}
              onAction={handleBookingAction}
              roomStatus={room.status}
            />
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}
