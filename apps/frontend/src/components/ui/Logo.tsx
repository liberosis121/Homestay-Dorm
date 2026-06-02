

interface LogoProps {
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Logo({ variant = 'horizontal', size = 'md', className = '' }: LogoProps) {
  // Determine icon size
  const iconSizeClass = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  }[size];

  // Determine text style
  const textStyleClass = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-bold',
    lg: 'text-headline-md font-bold',
    xl: 'text-3xl font-extrabold mt-2',
  }[size];

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center gap-0 ${className}`}>
        <span 
          className={`material-symbols-outlined text-primary ${iconSizeClass} drop-shadow-sm`} 
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          eco
        </span>
        <span className={`font-headline-lg text-primary whitespace-nowrap drop-shadow-sm ${textStyleClass}`}>
          HomeStay Dorm
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span 
        className={`material-symbols-outlined text-primary ${iconSizeClass}`} 
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        eco
      </span>
      <span className={`text-primary dark:text-primary-fixed ${textStyleClass}`}>
        HomeStay Dorm
      </span>
    </div>
  );
}
