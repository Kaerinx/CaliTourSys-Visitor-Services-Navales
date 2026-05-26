import { Link, useNavigate } from "react-router";
import { ArrowRight, Leaf, Landmark, UtensilsCrossed, Calendar, MapPin, Compass } from "lucide-react";
import { Button, ProductCard, SectionHeader, CategoryBadge, AccreditationBadge } from "../components/ui-kit";
import { products, events, locations } from "../data";

const quickCats = [
  { icon: Leaf, label: "Nature" },
  { icon: Landmark, label: "Cultural" },
  { icon: UtensilsCrossed, label: "Food" },
  { icon: Calendar, label: "Events" },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[88vh] hero-photo overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-20 pt-24 pb-40 min-h-[88vh] flex items-center">
          <div className="max-w-[560px] text-white fade-up">
            <span className="text-caption inline-flex items-center gap-2 text-white/85">
              <span className="w-6 h-px bg-white/60" /> Calabanga · Camarines Sur
            </span>
            <h1 className="text-white mt-4" style={{ fontSize: 56, lineHeight: 1.05 }}>
              Discover the Heart of Bicol
            </h1>
            <p className="text-white/90 mt-5" style={{ fontSize: 18 }}>
              Explore Calabanga's coastal wonders, centuries-old churches, and the
              local treasures of its OTOP producers.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button variant="white" icon={<Compass className="w-5 h-5" />}>
                <Link to="/discover">Start exploring</Link>
              </Button>
              <Button variant="whiteGhost">
                <Link to="/otop-products">Shop OTOP</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick-category floating tiles — outside hero to avoid overflow-hidden clipping */}
      <div className="relative z-10 -mt-[44px] w-full px-6 flex justify-center">
        <div className="w-full max-w-[1100px]">
          <div className="bg-white rounded-[16px] border border-[#E8E4DC] grid grid-cols-2 md:grid-cols-4 overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
            {quickCats.map(({ icon: Icon, label }, i) => (
              <button
                key={label}
                onClick={() => {
                  if (label === "Events") navigate("/events");
                  else navigate(`/discover?category=${label.toLowerCase()}`);
                }}
                className={`group flex items-center gap-4 px-6 py-5 hover:bg-[#F2F0EB] transition-colors ${
                  i < 3 ? "md:border-r border-[#E8E4DC]" : ""
                } ${i < 2 ? "border-b md:border-b-0 border-[#E8E4DC]" : ""} ${
                  i === 2 ? "border-b md:border-b-0 border-[#E8E4DC]" : ""
                }`}
              >
                <span className="w-11 h-11 rounded-full bg-[#1B4332] group-hover:bg-[#14532D] grid place-items-center text-white shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="text-left">
                  <div className="text-[15px] font-semibold text-[#1A1A1A]">{label}</div>
                  <div className="text-[12px] text-[#5C5C5C]">Browse {label.toLowerCase()}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURED PROMOTIONS */}
      <section className="bg-white pt-20 pb-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            title="What's On"
            subtitle="Seasonal promotions and partner offers from Calabanga's accredited producers and homestays."
            link={{ label: "View all promotions" }}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.slice(0, 3).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE MAP PREVIEW */}
      <section className="bg-[#F2F0EB] py-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            title="Explore Calabanga"
            subtitle="Hundreds of curated locations across the coast, mountains, and town center."
            link={{ label: "Open full map" }}
          />
          <div className="relative h-[480px] rounded-[16px] overflow-hidden border border-[#E8E4DC] map-grid">
            {/* Left filter panel */}
            <div className="absolute top-0 left-0 bottom-0 w-[320px] bg-white/95 backdrop-blur-sm p-6 hidden md:flex flex-col gap-5 border-r border-[#E8E4DC]">
              <div>
                <span className="text-caption text-[#5C5C5C]">Filter</span>
                <h3 className="mt-1">Find your way</h3>
              </div>
              <div className="space-y-3 text-[14px]">
                {[
                  { label: "Nature & Outdoors", count: 18, on: true, color: "#1B7A4A" },
                  { label: "Beaches", count: 7, on: true, color: "#1565C0" },
                  { label: "Cultural Sites", count: 12, on: false, color: "#7B341E" },
                  { label: "Food & Markets", count: 9, on: true, color: "#B5451B" },
                ].map((f) => (
                  <label key={f.label} className="flex items-center gap-3 cursor-pointer">
                    <span
                      className={`w-4 h-4 rounded-[4px] border-[1.5px] grid place-items-center ${
                        f.on ? "bg-[#1B4332] border-[#1B4332]" : "border-[#5C5C5C]"
                      }`}
                    >
                      {f.on && <span className="text-white text-[10px] leading-none">✓</span>}
                    </span>
                    <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                    <span className="flex-1 text-[#1A1A1A]">{f.label}</span>
                    <span className="text-[12px] text-[#5C5C5C]">{f.count}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 border-t border-[#E8E4DC] pt-4">
                <div className="text-[12px] text-[#5C5C5C] mb-3">Showing 5 highlights</div>
                <div className="space-y-2.5">
                  {locations.slice(0, 3).map((l) => (
                    <div key={l.id} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                      <span className="text-[14px] font-semibold flex-1 truncate">{l.name}</span>
                      <span className="text-[12px] text-[#5C5C5C]">{l.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map markers */}
            {locations.slice(0, 5).map((l, i) => (
              <MapPin5
                key={l.id}
                color={l.color}
                style={{ left: `calc(${l.x}% + 160px)`, top: `${l.y}%` }}
                selected={i === 1}
              />
            ))}

            {/* CTA */}
            <Link to="/discover" className="absolute bottom-5 right-5">
              <Button variant="primary" icon={<ArrowRight className="w-5 h-5" />}>
                Open full map
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* OTOP HIGHLIGHTS */}
      <section className="bg-white py-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            title="Calabanga's Finest"
            subtitle="Hand-picked products from our OTOP (One Town, One Product) accredited producers."
            link={{ label: "Shop all OTOP" }}
          />
          <div className="flex gap-2 mb-6 flex-wrap">
            {["All", "Sweets", "Crafts", "Pantry", "Textiles"].map((t, i) => (
              <button
                key={t}
                className={`h-9 px-4 rounded-full text-[13px] font-medium ${
                  i === 0
                    ? "bg-[#1B4332] text-white"
                    : "bg-[#F2F0EB] text-[#1A1A1A] hover:bg-[#D8F3DC]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="bg-[#F2F0EB] py-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <SectionHeader
            title="Upcoming Festivals & Events"
            subtitle="From the Pili Festival to the San Miguel Bay Regatta — plan your trip around our calendar."
            link={{ label: "View all events" }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 3).map((e) => (
              <Link
                key={e.id}
                to="/events"
                className="bg-white rounded-[12px] border border-[#E8E4DC] hover:border-[#1B4332] hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
              >
                <div
                  className="relative aspect-[16/9]"
                  style={{
                    background: `linear-gradient(135deg, ${e.accent}, ${e.accent}AA)`,
                  }}
                >
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 50%)" }} />
                  <div className="absolute top-3 left-3 bg-[#1B4332] text-white rounded-[8px] px-3 py-2 leading-none">
                    <div className="font-display font-bold text-[28px]">{e.day}</div>
                    <div className="text-[11px] tracking-widest mt-0.5">{e.month}</div>
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-2">
                  <CategoryBadge>{e.category}</CategoryBadge>
                  <h3>{e.title}</h3>
                  <div className="flex items-center gap-1.5 text-[13px] text-[#5C5C5C]">
                    <MapPin className="w-3.5 h-3.5" />
                    {e.location}
                  </div>
                  <p className="text-[14px] text-[#5C5C5C] line-clamp-2">{e.desc}</p>
                  <span className="text-[13px] text-[#1B4332] font-medium mt-1">View event →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-white py-16 border-t border-[#E8E4DC]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <AccreditationBadge />
            <div className="text-[14px] text-[#5C5C5C]">
              Every producer on TWBIS is vetted and accredited by LGU Calabanga.
            </div>
          </div>
          <Link to="/components" className="text-[13px] text-[#1B4332] font-medium hover:underline">
            About our accreditation →
          </Link>
        </div>
      </section>
    </div>
  );
}

function MapPin5({ color, style, selected }: { color: string; style?: React.CSSProperties; selected?: boolean }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-full" style={style}>
      <div
        className={`relative ${selected ? "scale-125" : ""} transition-transform`}
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
      >
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" fill={selected ? "#B5451B" : color} />
          <circle cx="14" cy="14" r="5" fill="white" />
        </svg>
      </div>
    </div>
  );
}