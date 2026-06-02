import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-high dark:bg-surface-container-highest mt-auto pt-16 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
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
            <button className="absolute right-1 top-1 h-10 px-4 bg-primary text-on-primary rounded-lg text-caption font-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer">Gửi</button>
          </div>
          <div className="flex gap-4 pt-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined">call</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined">location_on</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
