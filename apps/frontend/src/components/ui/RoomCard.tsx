

export interface Amenity {
  icon: string;
  text: string;
}

interface RoomCardProps {
  title: string;
  image: string;
  tag: string;
  price: string;
  period?: string;
  amenities: Amenity[];
  registerLink?: string;
}

export default function RoomCard({
  title,
  image,
  tag,
  price,
  period = '/tháng',
  amenities,
  registerLink = '#/login',
}: RoomCardProps) {
  return (
    <div className="group bg-white rounded-24 overflow-hidden border border-sage-light hover:shadow-2xl hover:shadow-sage-dark/10 transition-all duration-300 transform hover:-translate-y-1">
      <div className="aspect-[4/3] overflow-hidden relative">
        <img 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          src={image}
        />
        <div className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 rounded-full text-caption font-label-md">
          {tag}
        </div>
      </div>
      <div className="p-6 space-y-4">
        <h3 className="font-headline-md text-xl text-on-surface">{title}</h3>
        <div className="flex gap-2 flex-wrap">
          {amenities.map((item, idx) => (
            <span 
              key={idx} 
              className="px-3 py-1 bg-surface-container-low text-on-surface-variant rounded-full text-caption flex items-center gap-1"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                {item.icon}
              </span>
              {item.text}
            </span>
          ))}
        </div>
        <div className="pt-4 border-t border-surface-variant flex items-center justify-between">
          <span className="text-primary font-bold text-lg">
            {price}
            <span className="text-caption font-normal text-on-surface-variant">{period}</span>
          </span>
          <a 
            className="px-4 py-2 bg-sage-light text-sage-dark rounded-xl font-label-md text-sm hover:bg-primary hover:text-white transition-colors" 
            href={registerLink}
          >
            Đăng ký
          </a>
        </div>
      </div>
    </div>
  );
}
