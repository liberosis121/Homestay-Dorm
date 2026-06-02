

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ to = '#/login', label = 'Quay lại', className = '' }: BackButtonProps) {
  return (
    <a 
      href={to} 
      className={`group flex items-center gap-2.5 px-4 py-2 w-fit bg-primary/5 dark:bg-white/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-full text-on-surface hover:text-primary transition-all duration-300 font-bold text-sm shadow-sm hover:shadow active:scale-95 cursor-pointer ${className}`}
    >
      <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:-translate-x-1">
        arrow_back
      </span>
      {label}
    </a>
  );
}
