import React, { useEffect } from 'react';

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
      {/* Header: TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-sm dark:shadow-none transition-shadow duration-300">
        <nav className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">HomeStay Dorm</span>
          </div>
          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 font-body-md text-body-md">
            <a className="text-primary dark:text-primary-fixed font-bold border-b-2 border-primary dark:border-primary-fixed pb-1" href="#">Giới thiệu</a>
            <a className="text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Dịch vụ</a>
            <a className="text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Phòng trống</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#/login" className="px-6 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-all active:scale-95">Đăng nhập</a>
            <button className="md:hidden text-on-surface-variant">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </nav>
      </header>
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-margin-mobile md:px-margin-desktop py-12 md:py-24 max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <h1 className="font-display-lg text-[40px] md:text-display-lg leading-tight text-on-surface">
                Trải nghiệm không gian sống xanh tại <span className="text-primary">HomeStay Dorm</span>
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
                <img alt="Modern dorm" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgSOWSBPzZibACRxQygYu1qvDAnOB_S9lxzwZbghYzE0n-T0Y4YhuVidVftQhlQwoQKN5O1DsUDnC-kCvCIIpLtDyibJsUzAI13g1hMkm7hRQtcTo-FhGFP0riNzxYGKjJmEsAkqzOiyV6PNWIZ_-MhjeRieYNtIuA6Rm289yITcgN9HVfMNj6VB5gH8lGspYFT62f1KPn4dwVGl0TmxM6OKrJeP8n7VL8ho4ZwADEJxmwP3eCIkW6YSl4prZfQYa_vOn5tyReEQ"/>
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
            
            {/* Room Card 1 */}
            <div className="group bg-white rounded-24 overflow-hidden border border-sage-light hover:shadow-2xl hover:shadow-sage-dark/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img alt="Room 1" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9VoLp9e5msCc5wKqAM4XBKLiAa8vGorAl4zC7qrpSO3Jw6aR51FmBOkCruFWm_ttRriBnwS_qHxrJbpNrwqS_qc_-CgVuX0uz5WDx5wJuwxNKYr4YQ0uTBoO6-GIxmdAmtuylRyLwD5P6vBiRdjqLcCncovbXcpASwuvw1eIQpOA2ZXrONwzYcxQC3nFFNHVNtVdqmLJZyyxDNwS_jyUqae4dPz1iMxd_BLefONF9ADc4MnwJQ-RlIyn_dWgvA5nFb2ZKpJwgbg"/>
                <div className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 rounded-full text-caption font-label-md">Studio</div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-headline-md text-xl text-on-surface">Phòng Studio Quận 1</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant rounded-full text-caption flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">ac_unit</span> Điều hòa
                  </span>
                  <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant rounded-full text-caption flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">wc</span> WC riêng
                  </span>
                </div>
                <div className="pt-4 border-t border-surface-variant flex items-center justify-between">
                  <span className="text-primary font-bold text-lg">5.500.000đ<span className="text-caption font-normal text-on-surface-variant">/tháng</span></span>
                  <a className="px-4 py-2 bg-sage-light text-sage-dark rounded-xl font-label-md text-sm hover:bg-primary hover:text-white transition-colors" href="#/login">Đăng ký</a>
                </div>
              </div>
            </div>

            {/* Room Card 2 */}
            <div className="group bg-white rounded-24 overflow-hidden border border-sage-light hover:shadow-2xl hover:shadow-sage-dark/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img alt="Room 2" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDS-wWqvTcUXUsyOBK2iRwWzNn1gAA-V6yK3DOAEZIbjtRhv_kkIU67S4BOI9Z-eNYnmfPlPc4W9Gyf3TFLu16_-2jCQYM0kZGAxfBfDAJP35cdTTfw_avhzDjU0vk-DFGTLdrlyUH_uYA0_P8TxtRd-Cy0ejMlFGsc4V_g_YvwwKXtW8wkoJ5YXbSZor9BpvL6mim1Za0MEStJoQ0TUDHvMgCEDQVczcMeNiiS2gjPItMncTl2bieZ7vwaLZ3YT4AnKyJyJylr1g"/>
                <div className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 rounded-full text-caption font-label-md">Phòng đôi</div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-headline-md text-xl text-on-surface">Phòng Twin Quận 7</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant rounded-full text-caption flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">ac_unit</span> Điều hòa
                  </span>
                  <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant rounded-full text-caption flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">wifi</span> Wifi
                  </span>
                </div>
                <div className="pt-4 border-t border-surface-variant flex items-center justify-between">
                  <span className="text-primary font-bold text-lg">3.200.000đ<span className="text-caption font-normal text-on-surface-variant">/tháng</span></span>
                  <a className="px-4 py-2 bg-sage-light text-sage-dark rounded-xl font-label-md text-sm hover:bg-primary hover:text-white transition-colors" href="#/login">Đăng ký</a>
                </div>
              </div>
            </div>

            {/* Room Card 3 */}
            <div className="group bg-white rounded-24 overflow-hidden border border-sage-light hover:shadow-2xl hover:shadow-sage-dark/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img alt="Room 3" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc4on6VPwYcPdcWUMc2Zf7J2Bf3b-lJ1EDaHM5lcquSfNnjCE2YqkMJ7yj54NAubmgGTt_E8yL8aFHK7xFxqLAYiBW3k__OymcEFUYm692whQkxOorjGYggMF05FFvaozFFESgDEid9EJ6LSGWPZWcVZRvvBI6Dv4ERkEthuT59O-JhUqv9Z5UtKcV9Mx6zve91EDgxvt1AeodWvHo2kfu3Rm_Olt6Bh1uSBPWHwJ_19A1QFcebmuV-t7yBHLacuDIpP9Jvz3vHg"/>
                <div className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 rounded-full text-caption font-label-md">KTX 4 Giường</div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-headline-md text-xl text-on-surface">KTX Thủ Đức</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant rounded-full text-caption flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">cleaning_services</span> Dọn dẹp
                  </span>
                  <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant rounded-full text-caption flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">wc</span> WC riêng
                  </span>
                </div>
                <div className="pt-4 border-t border-surface-variant flex items-center justify-between">
                  <span className="text-primary font-bold text-lg">1.800.000đ<span className="text-caption font-normal text-on-surface-variant">/tháng</span></span>
                  <a className="px-4 py-2 bg-sage-light text-sage-dark rounded-xl font-label-md text-sm hover:bg-primary hover:text-white transition-colors" href="#/login">Đăng ký</a>
                </div>
              </div>
            </div>

            {/* Room Card 4 */}
            <div className="group bg-white rounded-24 overflow-hidden border border-sage-light hover:shadow-2xl hover:shadow-sage-dark/10 transition-all duration-300 transform hover:-translate-y-1">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img alt="Room 4" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiYYlGJ4z4E9tt_aurd5KQAIVfuxWe3iu5Qd6PA_SLzWoHMWoeCFRJwG7iS670pbPeQU1XNl9kgUhLusFafrBiaehyQrTNOmO9BMpL5BI1DmgERoXFm36JvovET4ucpMC9tiWQdyUMS8dSDT_Kxr4Y20xbWD8-uvchl7-KLgxnCnzzUDGDe1JmLgOYvYbnhHsN6WyksR19bDuCywjG7pwriM2gL4mOc89es4-d4yyFkq_jUANxV9cQCqhO9mzxoI7W9_uhi31QQQ"/>
                <div className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 rounded-full text-caption font-label-md">Phòng đơn</div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-headline-md text-xl text-on-surface">Luxury Single Quận 7</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant rounded-full text-caption flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">balcony</span> Ban công
                  </span>
                  <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant rounded-full text-caption flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">ac_unit</span> Điều hòa
                  </span>
                </div>
                <div className="pt-4 border-t border-surface-variant flex items-center justify-between">
                  <span className="text-primary font-bold text-lg">4.000.000đ<span className="text-caption font-normal text-on-surface-variant">/tháng</span></span>
                  <a className="px-4 py-2 bg-sage-light text-sage-dark rounded-xl font-label-md text-sm hover:bg-primary hover:text-white transition-colors" href="#/login">Đăng ký</a>
                </div>
              </div>
            </div>

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
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">HomeStay Dorm</span>
            </div>
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
