import BackButton from './BackButton';

interface AuthBackgroundProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
}

export default function AuthBackground({
  children,
  showBackButton = true,
  backTo = '#/login',
  backLabel = 'Quay lại'
}: AuthBackgroundProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface relative overflow-hidden p-6">
      
      {/* Background Decorators to make the page less empty */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-primary-container/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-tertiary-fixed-dim/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[15%] w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
      </div>

      {/* Absolute Back Button with premium translucent style */}
      {showBackButton && (
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
          <BackButton to={backTo} label={backLabel} />
        </div>
      )}

      {children}
    </div>
  );
}
