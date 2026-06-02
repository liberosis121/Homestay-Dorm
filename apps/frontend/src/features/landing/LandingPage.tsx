import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomSearchStore } from '../rooms/store/useRoomSearchStore';
import heroImage from '../../assets/hero.jpg';
import roomStudio from '../../assets/room-studio.jpg';
import roomTwin from '../../assets/room-twin.jpg';
import roomDorm from '../../assets/room-dorm.jpg';
import roomSingle from '../../assets/room-single.jpg';
import RoomCard from '../../components/ui/RoomCard';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import CustomSelect from '../../components/ui/CustomSelect';
import { AlertCircle, CheckCircle } from 'lucide-react';

const featuredRooms = [
  {
    id: 'r-2',
    title: 'Phòng Studio Quận 1',
    image: roomStudio,
    tag: 'Studio',
    price: '5.500.000đ',
    amenities: [
      { icon: 'ac_unit', text: 'Điều hòa' },
      { icon: 'wc', text: 'WC riêng' }
    ]
  },
  {
    id: 'r-4',
    title: 'Phòng Twin Quận 7',
    image: roomTwin,
    tag: 'Phòng đôi',
    price: '3.200.000đ',
    amenities: [
      { icon: 'ac_unit', text: 'Điều hòa' },
      { icon: 'wifi', text: 'Wifi' }
    ]
  },
  {
    id: 'r-3',
    title: 'KTX Thủ Đức',
    image: roomDorm,
    tag: 'KTX 4 Giường',
    price: '1.800.000đ',
    amenities: [
      { icon: 'cleaning_services', text: 'Dọn dẹp' },
      { icon: 'wc', text: 'WC riêng' }
    ]
  },
  {
    id: 'r-6',
    title: 'Luxury Single Quận 7',
    image: roomSingle,
    tag: 'Phòng đơn',
    price: '4.000.000đ',
    amenities: [
      { icon: 'balcony', text: 'Ban công' },
      { icon: 'ac_unit', text: 'Điều hòa' }
    ]
  }
];

export default function LandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { setBranch, setPriceRange, setRoomType, setGender } = useRoomSearchStore();

  const [localBranch, setLocalBranch] = useState('Tất cả chi nhánh');
  const [localPrice, setLocalPrice] = useState('Tất cả');
  const [localRoomType, setLocalRoomType] = useState('Loại phòng');
  const [localGender, setLocalGender] = useState('Giới tính');
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);

  const handleRegisterClick = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
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

    navigate(`/customer/rooms/${roomId}`);
  };

  const handleSearch = () => {
    setBranch(localBranch);
    setRoomType(localRoomType);
    setGender(localGender);
    
    if (localPrice === 'Dưới 2tr') setPriceRange([0, 2000000]);
    else if (localPrice === '2tr - 5tr') setPriceRange([2000000, 5000000]);
    else if (localPrice === 'Trên 5tr') setPriceRange([5000000, 50000000]);
    else setPriceRange([0, 50000000]); // Tất cả

    navigate('/rooms');
  };

  useEffect(() => {
    // Micro-interaction: Header scroll effect
    const handleScroll = () => {
      const header = document.querySelector('header');
      if (header) {
        if (window.scrollY > 20) {
          header.classList.add('shadow-md');
          header.classList.remove('shadow-sm');
        } else {
          header.classList.add('shadow-sm');
          header.classList.remove('shadow-md');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Simple Fade-in Animation for Hero
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in', 'fade-in', 'slide-in-from-bottom-4', 'duration-700');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.group, .animate-fade-in-up').forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="bg-surface text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      {/* Header: Unified TopNavBar */}
      {/* Header: Unified TopNavBar */}
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

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-margin-mobile md:px-margin-desktop py-12 md:py-24 max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <h1 className="font-display-lg text-[40px] md:text-display-lg leading-tight text-on-surface">
                Trải nghiệm không gian sống xanh tại <span className="text-primary whitespace-nowrap">HomeStay Dorm</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
                Nơi ký túc xá gặp gỡ sự sang trọng và tiện nghi. Chúng tôi tái định nghĩa không gian lưu trú cho thế hệ trẻ hiện đại.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 bg-timber-accent text-white px-8 py-4 rounded-24 font-label-md text-label-md shadow-lg shadow-timber-accent/20 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  Tìm phòng ngay
                  <span className="material-symbols-outlined">arrow_downward</span>
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl relative z-10">
                <img alt="Modern dorm" className="w-full h-full object-cover" src={heroImage}/>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary-fixed-dim/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-tertiary-fixed-dim/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="px-margin-mobile md:px-margin-desktop -mt-12 relative z-20 max-w-container-max mx-auto" id="search-section">
          <div className="bg-white/80 dark:bg-surface-container-highest/80 backdrop-blur-xl border border-glass-stroke shadow-xl rounded-[32px] p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
              <div className="space-y-2">
                <label className="block font-label-md text-caption text-on-surface-variant ml-2">Chi nhánh</label>
                <CustomSelect
                  value={localBranch}
                  onChange={setLocalBranch}
                  options={[
                    { value: 'Tất cả chi nhánh', label: 'Tất cả chi nhánh' },
                    { value: 'b-1', label: 'Quận 1' },
                    { value: 'b-2', label: 'Quận 7' },
                    { value: 'b-3', label: 'Thủ Đức' }
                  ]}
                  triggerClassName="h-14 bg-surface-container-low border-none rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-caption text-on-surface-variant ml-2">Khoảng giá</label>
                <CustomSelect
                  value={localPrice}
                  onChange={setLocalPrice}
                  options={[
                    'Tất cả',
                    'Dưới 2tr',
                    '2tr - 5tr',
                    'Trên 5tr'
                  ]}
                  icon="payments"
                  triggerClassName="h-14 bg-surface-container-low border-none rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-caption text-on-surface-variant ml-2">Loại phòng</label>
                <CustomSelect
                  value={localRoomType}
                  onChange={setLocalRoomType}
                  options={[
                    { value: 'Loại phòng', label: 'Loại phòng' },
                    { value: 'Studio', label: 'Studio' },
                    { value: 'Twin', label: 'Twin' },
                    { value: 'Dorm', label: 'KTX (Dorm)' }
                  ]}
                  icon="bed"
                  triggerClassName="h-14 bg-surface-container-low border-none rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-caption text-on-surface-variant ml-2">Giới tính</label>
                <CustomSelect
                  value={localGender}
                  onChange={setLocalGender}
                  options={[
                    { value: 'Giới tính', label: 'Giới tính' },
                    { value: 'Male', label: 'Nam' },
                    { value: 'Female', label: 'Nữ' },
                    { value: 'All', label: 'Tất cả' }
                  ]}
                  icon="wc"
                  triggerClassName="h-14 bg-surface-container-low border-none rounded-2xl"
                />
              </div>
              <button onClick={handleSearch} className="h-14 bg-primary text-on-primary rounded-2xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-lg shadow-primary/10 group cursor-pointer w-full">
                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">search</span>
                Tìm kiếm
              </button>
            </div>
          </div>
        </section>

        {/* Featured Rooms */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
              <span className="text-primary font-label-md tracking-widest uppercase">Phòng trống</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Phòng trống tiêu biểu</h2>
            </div>
            <button 
              onClick={() => navigate('/rooms')} 
              className="text-primary font-label-md flex items-center gap-1.5 px-4 py-2 border border-transparent rounded-full hover:border-primary/25 hover:bg-primary/5 transition-all duration-300 group cursor-pointer"
            >
              Xem tất cả phòng
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            
            {featuredRooms.map((room, index) => (
              <RoomCard
                key={index}
                title={room.title}
                image={room.image}
                tag={room.tag}
                price={room.price}
                amenities={room.amenities}
                onRegisterClick={(e) => handleRegisterClick(e, room.id)}
              />
            ))}

          </div>
        </section>

        {/* Call to Action for Staff */}
        {!user && (
          <section className="py-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <div className="bg-primary-container/20 border border-primary-container/30 rounded-[32px] p-8 md:p-12 text-center space-y-6">
              <h3 className="font-headline-md text-2xl text-on-primary-container">Bạn là nhân viên hệ thống?</h3>
              <p className="text-on-surface-variant max-w-lg mx-auto">Truy cập vào hệ thống quản lý để thực hiện các thao tác vận hành và quản lý phòng trống.</p>
              <a className="inline-flex items-center gap-2 bg-primary text-on-primary px-10 py-4 rounded-full font-label-md hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95" href="#/login">
                Đăng nhập hệ thống quản lý
                <span className="material-symbols-outlined">login</span>
              </a>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
