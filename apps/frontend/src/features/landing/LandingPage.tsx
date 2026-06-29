import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useRoomSearchStore } from '../rooms/store/useRoomSearchStore';
import heroImage from '../../assets/hero.jpg';

import RoomCard from '../../components/ui/RoomCard';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import CustomSelect from '../../components/ui/CustomSelect';
import { AlertCircle, CheckCircle } from 'lucide-react';
import servicesImage from '../../assets/homestay-services.png';
import { getRoomsApi, Room } from '../rooms/rooms.api';

export default function LandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { setBranch, setPriceRange, setRoomType, setGender } = useRoomSearchStore();

  const [localBranch, setLocalBranch] = useState('Tất cả chi nhánh');
  const [localPrice, setLocalPrice] = useState('Tất cả');
  const [localRoomType, setLocalRoomType] = useState('Loại phòng');
  const [localGender, setLocalGender] = useState('Giới tính');
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

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

    // Tải danh sách phòng tiêu biểu từ backend
    getRoomsApi()
      .then((res) => {
        setRooms(res.slice(0, 4));
      })
      .catch((err) => {
        console.error('Không thể tải phòng tiêu biểu:', err);
      });

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
        <section className="relative overflow-hidden px-margin-mobile md:px-margin-desktop py-10 md:py-24 max-w-container-max mx-auto">
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
        <section className="px-margin-mobile md:px-margin-desktop -mt-3 relative z-20 max-w-container-max mx-auto" id="search-section">
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
            
            {rooms.map((room, index) => {
              // Convert danh sách amenities dạng text sang dạng object icon + text cho RoomCard
              const amenities = (room.amenities || []).map((name) => {
                let icon = 'eco';
                const lower = name.toLowerCase();
                if (lower.includes('điều hòa') || lower.includes('ac') || lower.includes('lạnh')) icon = 'ac_unit';
                else if (lower.includes('wifi') || lower.includes('mạng') || lower.includes('internet')) icon = 'wifi';
                else if (lower.includes('vệ sinh') || lower.includes('wc')) icon = 'wc';
                else if (lower.includes('giặt') || lower.includes('sấy')) icon = 'local_laundry_service';
                else if (lower.includes('dọn dẹp') || lower.includes('vệ sinh')) icon = 'cleaning_services';
                return { icon, text: name };
              });

              // Nếu chưa có amenities nào trong DB, gán mock defaults dựa trên loại phòng
              const finalAmenities = amenities.length > 0 ? amenities : (
                room.room_type.toLowerCase() === 'dorm' 
                  ? [{ icon: 'wifi', text: 'Wifi miễn phí' }, { icon: 'wc', text: 'WC riêng' }]
                  : [{ icon: 'ac_unit', text: 'Điều hòa' }, { icon: 'wifi', text: 'Wifi miễn phí' }]
              );

              return (
                <RoomCard
                  key={index}
                  title={room.name}
                  image={room.image_url}
                  tag={room.room_type}
                  price={`${room.price.toLocaleString('vi-VN')}đ`}
                  amenities={finalAmenities}
                  onRegisterClick={(e) => handleRegisterClick(e, room.id)}
                />
              );
            })}

          </div>
        </section>

        {/* Services Showcase Section */}
        <section className="py-15 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto border-t border-outline-variant/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Image Column */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/4.5] rounded-[40px] overflow-hidden shadow-2xl relative z-10 border border-outline-variant/20">
                <img
                  alt="Co-living services"
                  className="w-full h-full object-cover transform hover:scale-[1.03] transition-transform duration-700"
                  src={servicesImage}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
              </div>
              
              {/* Decorative glows */}
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-secondary/15 rounded-full blur-3xl -z-10"></div>
            </div>

            {/* Right Content Column */}
            <div className="lg:col-span-7 space-y-8 animate-fade-in-up">
              <div className="space-y-0.5">
                <span className="text-primary font-label-md tracking-widest uppercase block">Hệ sinh thái tiện ích</span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface leading-relaxed">
                  Dịch vụ đa dạng,<br />Cuộc sống tiện nghi vượt trội
                </h2>
              </div>
              
              <p className="font-body-md text-on-surface-variant leading-relaxed max-w-2xl">
                HomeStay Dorm không chỉ cung cấp một chốn nghỉ chân, mà là một hệ sinh thái sống hiện đại và năng động. Chúng tôi mang đến trọn gói các dịch vụ từ thiết yếu đến cao cấp để bạn thoải mái học tập, làm việc và tận hưởng cuộc sống trọn vẹn nhất.
              </p>

              {/* Service Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-4 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/20 hover:bg-surface-container-high transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Dịch vụ thiết yếu</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Điện nước sinh hoạt ổn định, thanh toán minh bạch theo chỉ số tiêu dùng thực tế.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/20 hover:bg-surface-container-high transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined">wifi</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Kết nối & Xe cộ</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Wifi cáp quang tốc độ cao phủ sóng toàn khu, bãi gửi xe thông minh bảo vệ 24/7.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/20 hover:bg-surface-container-high transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined">local_laundry_service</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Giặt là & Vệ sinh</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Giặt sấy tự động tiện lợi hoặc pick-up tận phòng, dọn dẹp vệ sinh phòng định kỳ.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/20 hover:bg-surface-container-high transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined">star</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">Tiện nghi cao cấp</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Tủ lạnh mini, máy giặt lồng ngang riêng, điều hòa bổ sung, két sắt điện tử an toàn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => navigate('/customer/services')}
                  className="inline-flex items-center gap-2.5 bg-primary text-on-primary px-8 py-4 rounded-full font-label-md shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                >
                  Khám phá bảng giá dịch vụ
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
                </button>
              </div>
            </div>

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
