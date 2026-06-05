
interface FormLabelProps {
  label: string;
  required?: boolean;
  className?: string;
}

export default function FormLabel({ label, required = false, className = '' }: FormLabelProps) {
  if (!label) return null;
  
  // Clean trailing asterisks from the label text if any
  const cleanLabel = label.replace(/\s*\*+$/, '').trim();

  return (
    <label 
      className={`block text-sm font-medium ml-2 ${className}`}
      style={{ color: 'var(--form-label-color, #4e453c)' }}
    >
      {cleanLabel}
      {required && (
        <span 
          style={{ color: 'var(--form-required-color, #D85C5C)' }} 
          className="ml-1 font-bold"
        >
          *
        </span>
      )}
    </label>
  );
}
