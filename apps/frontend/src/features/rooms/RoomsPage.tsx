import { useEffect, useState } from 'react';
import { getMockDB } from '../../lib/supabaseClient';
import { useRoomSearchStore } from './store/useRoomSearchStore';
import ListingRoomCard from './components/ListingRoomCard';
import FilterBar from './components/FilterBar';
import ExtendedFilters from './components/ExtendedFilters';
import RoomListSkeleton from './components/RoomListSkeleton';
import EmptyState from './components/EmptyState';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import heroImage from '../../assets/hero.jpg';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function RoomsPage() {
  const [showExtendedFilters, setShowExtendedFilters] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

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

  // Pagination Logic
  const ITEMS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(sortedRooms.length / ITEMS_PER_PAGE);
  const paginatedRooms = sortedRooms.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRooms.length]);


  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      {/* Unified Top NavBar */}
      <Navbar />

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

      <main className="pt-20 flex-1">
        {/* Hero Section */}
        <section className="relative h-[400px] min-h-[300px] flex items-center justify-center overflow-hidden">
          <img 
            alt="Phòng Homestay Dorm cao cấp" 
            className="absolute inset-0 w-full h-full object-cover" 
            src={heroImage}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30"></div>
          <div className="relative z-10 text-center px-margin-mobile">
            <h1 className="font-display-lg text-4xl md:text-5xl text-white mb-4">Khám phá không gian sống lý tưởng</h1>
            <p className="font-body-lg text-lg text-white/90 max-w-4xl mx-auto">Sự kết hợp hoàn hảo giữa tiện nghi khách sạn và sự ấm cúng của ngôi nhà thứ hai.</p>
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
              {paginatedRooms.map(room => (
                  <ListingRoomCard 
                    key={room.id} 
                    room={room} 
                  />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-2">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-label-md transition-all cursor-pointer ${
                    currentPage === i + 1 
                      ? 'bg-primary text-on-primary' 
                      : 'border border-transparent text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
