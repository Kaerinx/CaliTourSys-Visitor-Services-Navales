import { ReactNode, ButtonHTMLAttributes } from "react";
import { Check, ShieldCheck, Star, Loader2 } from "lucide-react";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "white" | "whiteGhost";
  size?: "md" | "sm";
  icon?: ReactNode;
  full?: boolean;
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  full,
  isLoading,
  className = "",
  children,
  ...rest
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[8px] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-medium relative";
  const sizes = size === "sm" ? "h-9 px-4 text-[13px]" : "h-12 px-6 text-[15px]";
  const variants = {
    primary:
      "bg-[#1B4332] text-white hover:bg-[#14532D]",
    ghost:
      "border-[1.5px] border-[#1B4332] text-[#1B4332] hover:bg-[#D8F3DC] bg-transparent",
    white:
      "bg-white text-[#1B4332] hover:bg-[#F2F0EB]",
    whiteGhost:
      "border-[1.5px] border-white text-white hover:bg-white/10 bg-transparent",
  }[variant];
  return (
    <button
      className={`${base} ${sizes} ${variants} ${full ? "w-full" : ""} ${className}`}
      disabled={isLoading || rest.disabled}
      {...rest}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin absolute" />
      ) : icon ? (
        <span className="inline-flex">{icon}</span>
      ) : null}
      <span className={isLoading ? "opacity-0" : ""}>{children}</span>
    </button>
  );
}

export function AccreditationBadge({ 
  className = "",
  status = "accredited"
}: { 
  className?: string;
  status?: "accredited" | "pending" | "expired";
}) {
  const styles = {
    accredited: { bg: "#FFF9E6", color: "#7D5A00", border: "#D4AC0D", dot: "#D4AC0D", label: "LGU Accredited" },
    pending: { bg: "#F2F0EB", color: "#5C5C5C", border: "#E8E4DC", dot: "#5C5C5C", label: "Pending" },
    expired: { bg: "#FFE8DE", color: "#B5451B", border: "#B5451B", dot: "#B5451B", label: "Expired" },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium tracking-wide ${className}`}
      style={{
        background: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: styles.dot }} />
      {styles.label}
    </span>
  );
}

export function CategoryBadge({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "primary" | "gold";
}) {
  const styles = {
    accent: { bg: "#FFE8DE", color: "#7A2D0E" },
    primary: { bg: "#D8F3DC", color: "#1B4332" },
    gold: { bg: "#FFF9E6", color: "#7D5A00" },
  }[tone];
  return (
    <span
      className="inline-flex items-center h-[22px] px-2.5 rounded-full text-[12px] font-medium"
      style={{ background: styles.bg, color: styles.color }}
    >
      {children}
    </span>
  );
}

export function StarRow({ rating = 4.7, count }: { rating?: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] text-[#1A1A1A]">
      <Star className="w-3.5 h-3.5 fill-[#D4AC0D] text-[#D4AC0D]" />
      <span className="font-medium">{rating.toFixed(1)}</span>
      {count != null && <span className="text-[#5C5C5C]">({count})</span>}
    </span>
  );
}

export function VerifiedDot() {
  return (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1B7A4A]">
      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
    </span>
  );
}

export type ProductCardData = {
  id: string;
  name: string;
  producer: string;
  price: string;
  category: string;
  accent: string; // image accent color
  accredited?: boolean;
};

export function ProductCard({ p, onClick, isLoading }: { p?: ProductCardData; onClick?: () => void; isLoading?: boolean }) {
  if (isLoading || !p) {
    return (
      <div className="bg-white rounded-[12px] border border-[#E8E4DC] overflow-hidden flex flex-col animate-pulse">
        <div className="relative aspect-[4/3] bg-[#E8E4DC]"></div>
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="w-16 h-[22px] bg-[#E8E4DC] rounded-full"></div>
          <div className="w-full h-5 bg-[#E8E4DC] rounded-[4px] mt-1"></div>
          <div className="w-24 h-4 bg-[#E8E4DC] rounded-[4px]"></div>
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="w-16 h-5 bg-[#E8E4DC] rounded-[4px]"></div>
            <div className="w-20 h-4 bg-[#E8E4DC] rounded-[4px]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-[12px] border border-[#E8E4DC] hover:border-[#1B4332] hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${p.accent} 0%, ${p.accent}99 100%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.25), transparent 50%)",
          }}
        />
        {p.accredited && (
          <div className="absolute top-2 right-2">
            <AccreditationBadge />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <CategoryBadge>{p.category}</CategoryBadge>
        </div>
        <h3 className="line-clamp-2" style={{ fontSize: 16 }}>{p.name}</h3>
        <div className="flex items-center gap-1.5 text-[13px] text-[#5C5C5C]">
          <span>{p.producer}</span>
          <VerifiedDot />
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-[15px] font-medium text-[#1A1A1A]">{p.price}</span>
          <span className="text-[13px] text-[#1B4332] font-medium group-hover:translate-x-0.5 transition-transform">
            View product →
          </span>
        </div>
      </div>
    </button>
  );
}

export function PhotoTile({
  gradient,
  className = "",
  children,
  rounded = "rounded-[12px]",
}: {
  gradient: string;
  className?: string;
  children?: ReactNode;
  rounded?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{ background: gradient }}
    >
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.4), transparent 45%), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.35), transparent 55%)",
        }}
      />
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  link,
  subtitle,
}: {
  title: string;
  link?: { label: string; href?: string };
  subtitle?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-8 gap-6 flex-wrap">
      <div>
        <h2>{title}</h2>
        {subtitle && (
          <p className="text-[#5C5C5C] mt-2 max-w-xl">{subtitle}</p>
        )}
      </div>
      {link && (
        <a
          href={link.href || "#"}
          className="text-[13px] font-medium text-[#1B4332] hover:underline whitespace-nowrap"
        >
          {link.label} →
        </a>
      )}
    </div>
  );
}

export function Divider() {
  return <div className="h-px bg-[#E8E4DC]" />;
}
