import { useEffect } from 'react';
import heroImage from '../../assets/hero.jpg';
import roomStudio from '../../assets/room-studio.jpg';
import roomTwin from '../../assets/room-twin.jpg';
import roomDorm from '../../assets/room-dorm.jpg';
import roomSingle from '../../assets/room-single.jpg';
import Logo from '../../components/ui/Logo';
import RoomCard from '../../components/ui/RoomCard';
import Navbar from '../../components/ui/Navbar';

const featuredRooms = [
  {
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
    <div className="bg-surface text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* Header: Unified TopNavBar */}
      <Navbar />
      
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
                <a className="inline-flex items-center gap-2 bg-timber-accent text-white px-8 py-4 rounded-24 font-label-md text-label-md shadow-lg shadow-timber-accent/20 hover:scale-[1.02] transition-transform" href="#search-section">
                  Tìm phòng ngay
                  <span className="material-symbols-outlined">arrow_downward</span>
                </a>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="block font-label-md text-caption text-on-surface-variant ml-2">Chi nhánh</label>
                <div className="relative">
                  <select className="w-full h-14 pl-4 pr-10 bg-surface-container-low border-none rounded-2xl font-body-md focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option>Quận 1</option>
                    <option>Quận 7</option>
                    <option>Thủ Đức</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-4 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-caption text-on-surface-variant ml-2">Khoảng giá</label>
                <div className="relative">
                  <select className="w-full h-14 pl-4 pr-10 bg-surface-container-low border-none rounded-2xl font-body-md focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option>Dưới 2tr</option>
                    <option>2tr - 5tr</option>
                    <option>Trên 5tr</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-4 pointer-events-none text-on-surface-variant">payments</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-caption text-on-surface-variant ml-2">Loại phòng</label>
                <div className="relative">
                  <select className="w-full h-14 pl-4 pr-10 bg-surface-container-low border-none rounded-2xl font-body-md focus:ring-2 focus:ring-primary/20 appearance-none">
                    <option>Phòng đơn</option>
                    <option>Phòng đôi</option>
                    <option>KTX 4 giường</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-4 pointer-events-none text-on-surface-variant">bed</span>
                </div>
              </div>
              <button className="h-14 bg-primary text-on-primary rounded-2xl font-label-md flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-lg shadow-primary/10 group">
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
            <button className="text-primary font-label-md flex items-center gap-1 hover:underline">
              Xem tất cả phòng
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
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
              />
            ))}

          </div>
        </section>

        {/* Call to Action for Staff */}
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
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-high dark:bg-surface-container-highest mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter py-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="space-y-4">
            <Logo size="md" />
            <p className="font-caption text-caption text-on-surface-variant leading-relaxed max-w-xs">
              © 2024 HomeStay Dorm. Eco-friendly Luxury meets User-friendly Utility. Hệ thống ký túc xá cao cấp dành cho sinh viên và người đi làm.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-label-md text-on-surface mb-4">Thông tin</h4>
              <ul className="space-y-2 font-caption text-caption text-on-surface-variant">
                <li><a className="hover:underline decoration-primary" href="#">Contact Info</a></li>
                <li><a className="hover:underline decoration-primary" href="#">Branch Locations</a></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-label-md text-on-surface mb-4">Mạng xã hội</h4>
              <ul className="space-y-2 font-caption text-caption text-on-surface-variant">
                <li><a className="hover:underline decoration-primary" href="#">Facebook</a></li>
                <li><a className="hover:underline decoration-primary" href="#">Instagram</a></li>
                <li><a className="hover:underline decoration-primary" href="#">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-label-md text-on-surface">Đăng ký nhận tin</h4>
            <div className="relative">
              <input className="w-full h-12 px-4 rounded-xl bg-surface-container border-none focus:ring-1 focus:ring-primary font-caption text-caption" placeholder="Email của bạn" type="email"/>
              <button className="absolute right-1 top-1 h-10 px-4 bg-primary text-on-primary rounded-lg text-caption font-label-md">Gửi</button>
            </div>
            <div className="flex gap-4 pt-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">call</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">location_on</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
