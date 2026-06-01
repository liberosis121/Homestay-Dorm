import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getMockDB } from '../../lib/supabaseClient';
import { useRoomSearchStore } from './store/useRoomSearchStore';
import ListingRoomCard from './components/ListingRoomCard';
import FilterBar from './components/FilterBar';
import ExtendedFilters from './components/ExtendedFilters';
import RoomListSkeleton from './components/RoomListSkeleton';
import EmptyState from './components/EmptyState';
import Navbar from '../../components/ui/Navbar';

export default function RoomsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showExtendedFilters, setShowExtendedFilters] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Zustand Store
  const { 
    keyword, branch, roomType, gender, sortBy, 
    amenities, priceRange, capacity, onlyAvailable 
  } = useRoomSearchStore();

  useEffect(() => {
    // Simulate API fetch
    setIsLoading(true);
    const fetchRooms = async () => {
      const db = getMockDB();
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setRooms(db.rooms || []);
      setIsLoading(false);
    };
    fetchRooms();
  }, []);

  // Filter Logic
  const filteredRooms = rooms.filter(room => {
    if (keyword && !room.name.toLowerCase().includes(keyword.toLowerCase())) return false;
    if (branch !== 'Tất cả chi nhánh' && room.branch_id !== branch) return false;
    if (roomType !== 'Loại phòng' && room.room_type !== roomType) return false;
    if (gender !== 'Giới tính' && gender !== 'Tất cả' && room.gender_type !== gender) return false;
    
    if (onlyAvailable && room.status !== 'available' && room.status !== 'partial') return false;
    
    if (capacity && capacity !== '') {
      if (capacity === '6+' && room.capacity < 6) return false;
      if (capacity !== '6+' && room.capacity.toString() !== capacity) return false;
    }
    
    if (room.price < priceRange[0] || room.price > priceRange[1]) return false;
    
    if (amenities.length > 0) {
      const hasAllAmenities = amenities.every(a => room.amenities.includes(a));
      if (!hasAllAmenities) return false;
    }
    
    return true;
  });

  // Sort Logic
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === 'Giá thấp nhất') return a.price - b.price;
    if (sortBy === 'Giá cao nhất') return b.price - a.price;
    if (sortBy === 'Trống nhiều nhất') return (b.capacity - b.current_occupants) - (a.capacity - a.current_occupants);
    // Mới nhất (default)
    return 0;
  });

  const handleActionClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/customer/register-lease'); // Navigate to register form
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      {/* Unified Top NavBar */}
      <Navbar />

      <main className="pt-20 flex-1">
        {/* Hero Section */}
        <section className="relative h-[400px] min-h-[300px] flex items-center justify-center overflow-hidden">
          <img 
            alt="Phòng Homestay Dorm cao cấp" 
            className="absolute inset-0 w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2000&auto=format&fit=crop"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="relative z-10 text-center px-margin-mobile">
            <h1 className="font-display-lg text-4xl md:text-5xl text-white mb-4">Khám phá không gian sống lý tưởng</h1>
            <p className="font-body-lg text-lg text-white/90 max-w-2xl mx-auto">Sự kết hợp hoàn hảo giữa tiện nghi khách sạn và sự ấm cúng của ngôi nhà thứ hai.</p>
          </div>
        </section>

        {/* Filter Section */}
        <div className="sticky top-20 z-40 bg-surface/95 backdrop-blur-md py-6 shadow-sm border-b border-outline-variant">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <FilterBar onToggleFilters={() => setShowExtendedFilters(!showExtendedFilters)} showExtended={showExtendedFilters} />
            {showExtendedFilters && <ExtendedFilters />}
          </div>
        </div>

        {/* Main Content Canvas */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <RoomListSkeleton key={i} />)}
            </div>
          ) : sortedRooms.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedRooms.map(room => (
                <ListingRoomCard 
                  key={room.id} 
                  room={room} 
                  onActionClick={handleActionClick} 
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && sortedRooms.length > 0 && (
            <div className="mt-16 flex items-center justify-center gap-2">
              <button className="w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-on-primary font-label-md">1</button>
              <button className="w-12 h-12 rounded-full flex items-center justify-center border border-transparent text-on-surface-variant font-label-md hover:bg-surface-container-low">2</button>
              <button className="w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-high py-12 px-6 mt-16">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="font-display-lg text-xl font-bold text-primary">HomeStay Dorm</h3>
            <p className="text-sm text-on-surface-variant max-w-xs">Giải pháp lưu trú hiện đại cho sinh viên và người đi làm tại TP. Hồ Chí Minh với tiêu chuẩn xanh và tiện ích cao cấp.</p>
            <p className="text-xs text-on-surface-variant">© 2024 HomeStay Dorm. Eco-friendly Luxury meets User-friendly Utility.</p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-label-md text-on-surface mb-2">Khám phá</h4>
            <span className="text-sm text-on-surface-variant">Chi nhánh Quận 1</span>
            <span className="text-sm text-on-surface-variant">Chi nhánh Quận 7</span>
            <span className="text-sm text-on-surface-variant">Thủ Đức - Làng Đại học</span>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-label-md text-on-surface mb-2">Kết nối</h4>
            <div className="flex gap-4 mb-2">
              <span className="text-sm text-on-surface-variant">Facebook</span>
              <span className="text-sm text-on-surface-variant">Instagram</span>
            </div>
            <p className="text-sm text-on-surface-variant">Contact Info: (+84) 123 456 789</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
