interface ImagePlaceholderProps {
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}

export function ImagePlaceholder({ className = "", label, style }: ImagePlaceholderProps) {
  return (
    <div
      className={`relative bg-[#E0E0E0] overflow-hidden flex items-center justify-center ${className}`}
      style={style}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="#BDBDBD" strokeWidth="1.5" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="#BDBDBD" strokeWidth="1.5" />
      </svg>
      {label && (
        <span className="relative z-10 text-[#757575] font-mono text-xs border border-[#BDBDBD] px-2 py-1 bg-[#E0E0E0]">
          {label}
        </span>
      )}
    </div>
  );
}
