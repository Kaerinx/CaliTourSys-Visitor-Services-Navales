import { useState } from "react";
import { Search, Filter, Star, X, MapPin, Compass, Clock, Map as MapIcon, Bookmark } from "lucide-react";
import { Button, CategoryBadge, AccreditationBadge } from "../components/ui-kit";
import { locations } from "../data";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

const categories = [
  { key: "Nature", color: "#1B7A4A" },
  { key: "Beach", color: "#1565C0" },
  { key: "Food", color: "#B5451B" },
  { key: "Cultural", color: "#7B341E" },
];

export function MapDiscovery() {
  const [selectedId, setSelectedId] = useState<string>("quipayo");
  const [accreditedOnly, setAccreditedOnly] = useState(true);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    Nature: true, Beach: true, Food: true, Cultural: true,
  });
  const [showDetail, setShowDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      toast.success("Saved to itinerary");
    }, 800);
  };

  const visible = locations.filter((l) => enabled[l.category]);
  const selected = visible.find((l) => l.id === selectedId) ?? visible[0];

  return (
    <div className="h-[calc(100vh-64px)] flex">
      <aside className="w-[360px] shrink-0 bg-white border-r border-[#E8E4DC] flex flex-col">
        <div className="p-5 border-b border-[#E8E4DC]">
          <h2 style={{ fontSize: 22 }}>Discover</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C5C]" />
            <input
              placeholder="Search places, food, crafts..."
              className="w-full h-11 pl-10 pr-3 rounded-[8px] bg-[#F2F0EB] text-[14px] outline-none focus:ring-2 focus:ring-[#1B4332]/20"
            />
          </div>
        </div>

        <div className="p-5 border-b border-[#E8E4DC]">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 16 }}>Filter results</h3>
            <button className="text-[12px] text-[#1B4332] font-medium">Reset</button>
          </div>
          <div className="space-y-3">
            {categories.map((c) => (
              <label key={c.key} className="flex items-center gap-3 cursor-pointer text-[14px]">
                <span
                  onClick={() => setEnabled((e) => ({ ...e, [c.key]: !e[c.key] }))}
                  className={`w-4 h-4 rounded-[4px] border-[1.5px] grid place-items-center transition-colors ${
                    enabled[c.key] ? "bg-[#1B4332] border-[#1B4332]" : "border-[#1B4332]"
                  }`}
                >
                  {enabled[c.key] && <span className="text-white text-[10px] leading-none">✓</span>}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                <span className="flex-1">{c.key}</span>
                <span className="text-[12px] text-[#5C5C5C]">
                  {locations.filter((l) => l.category === c.key).length}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium">LGU Accredited only</div>
              <div className="text-[12px] text-[#5C5C5C]">Vetted producers & sites</div>
            </div>
            <button
              onClick={() => setAccreditedOnly((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                accreditedOnly ? "bg-[#1B4332]" : "bg-[#E8E4DC]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  accreditedOnly ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-5 pt-4 pb-2 text-[13px] text-[#5C5C5C]">
          Showing {visible.length} locations
        </div>
        <div className="flex-1 overflow-y-auto">
          {visible.map((l) => {
            const isSel = l.id === selected?.id;
            return (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={`w-full text-left px-5 py-4 border-b border-[#E8E4DC] flex gap-3 transition-colors ${
                  isSel ? "bg-[#D8F3DC] border-l-[3px] border-l-[#1B4332]" : "hover:bg-[#F2F0EB]"
                }`}
              >
                <div
                  className="w-14 h-14 rounded-[8px] shrink-0"
                  style={{ background: `linear-gradient(135deg, ${l.color}, ${l.color}AA)` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold truncate mb-1">{l.name}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <CategoryBadge>{l.category}</CategoryBadge>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-[#5C5C5C]">
                    <span>{l.distance}</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#D4AC0D] text-[#D4AC0D]" />
                      {l.rating}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="relative flex-1 map-tiles overflow-hidden">
        <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none">
          <div className="bg-white rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px] text-[#5C5C5C] pointer-events-auto">
            <span className="font-medium text-[#1A1A1A]">Calabanga</span> · Camarines Sur
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button className="bg-white border border-[#E8E4DC] rounded-[8px] h-10 px-3 text-[13px] font-medium flex items-center gap-2 hover:border-[#1B4332]">
              <Filter className="w-4 h-4" /> Layers
            </button>
            <Link to="/otop-products">
              <Button variant="primary" size="sm">Browse OTOP</Button>
            </Link>
          </div>
        </div>

        {visible.map((l) => {
          const isSel = l.id === selected?.id;
          return (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${l.x}%`, top: `${l.y}%` }}
            >
              <div
                className={`transition-transform ${isSel ? "scale-[1.3]" : ""}`}
                style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))" }}
              >
                <svg width="32" height="42" viewBox="0 0 28 36" fill="none">
                  <path
                    d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z"
                    fill={isSel ? "#B5451B" : l.color}
                  />
                  <circle cx="14" cy="14" r="5" fill="white" />
                </svg>
              </div>
            </button>
          );
        })}

        <div
          className="absolute w-11 h-11 rounded-full bg-[#1B4332] text-white grid place-items-center font-semibold text-[15px]"
          style={{ left: "48%", top: "48%", boxShadow: "0 0 0 6px rgba(27,67,50,0.15)" }}
        >
          12
        </div>

        {selected && (
          <div
            className="absolute fade-up pointer-events-auto"
            style={{
              left: `${selected.x}%`,
              top: `calc(${selected.y}% - 56px)`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="w-[280px] bg-white rounded-[12px] border border-[#E8E4DC] overflow-hidden">
              <div
                className="h-[140px] relative"
                style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}AA)` }}
              >
                <button className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full grid place-items-center">
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2">
                  <AccreditationBadge />
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[15px] font-semibold">{selected.name}</div>
                <div className="flex items-center gap-2">
                  <CategoryBadge>{selected.category}</CategoryBadge>
                  <span className="text-[12px] text-[#5C5C5C]">{selected.distance}</span>
                </div>
                <div className="flex items-center gap-1 text-[13px]">
                  <Star className="w-3.5 h-3.5 fill-[#D4AC0D] text-[#D4AC0D]" />
                  <span className="font-medium">{selected.rating}</span>
                  <span className="text-[#5C5C5C]">(284)</span>
                </div>
                <button 
                  onClick={() => setShowDetail(true)}
                  className="text-[13px] text-[#1B4332] font-medium pt-1 inline-block hover:underline"
                >
                  View details →
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-5 left-5 bg-white rounded-[12px] border border-[#E8E4DC] p-3 flex gap-4 text-[12px]">
          {categories.map((c) => (
            <div key={c.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              <span>{c.key}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showDetail && selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 pointer-events-auto"
              onClick={() => setShowDetail(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[600px] max-w-full bg-white z-[60] shadow-2xl overflow-y-auto flex flex-col pointer-events-auto"
            >
              <div 
                className="h-[240px] relative shrink-0"
                style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}AA)` }}
              >
                <button 
                  onClick={() => setShowDetail(false)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full grid place-items-center backdrop-blur-sm transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6">
                  <AccreditationBadge />
                </div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <CategoryBadge>{selected.category}</CategoryBadge>
                  <span className="text-[14px] text-[#5C5C5C]">{selected.distance}</span>
                </div>
                
                <h2 className="text-[32px] mb-2 leading-tight">{selected.name}</h2>
                
                <div className="flex items-center gap-1 text-[15px] mb-6">
                  <Star className="w-4 h-4 fill-[#D4AC0D] text-[#D4AC0D]" />
                  <span className="font-medium text-[#1A1A1A]">{selected.rating}</span>
                  <span className="text-[#5C5C5C]">(284 reviews)</span>
                </div>
                
                <p className="text-[16px] text-[#5C5C5C] leading-relaxed mb-8">
                  Experience the rich culture and history of Calabanga at this notable landmark. 
                  Perfect for your itinerary. Ensure you visit during operating hours.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3 text-[15px]">
                    <MapPin className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]">Poblacion, Calabanga, Camarines Sur</span>
                  </div>
                  <div className="flex items-start gap-3 text-[15px]">
                    <Clock className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]">Open daily • 8:00 AM - 5:00 PM</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-8 border-t border-[#E8E4DC] flex gap-4">
                  <Button className="flex-1" icon={<MapIcon className="w-4 h-4" />}>
                    Get directions
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex-1" 
                    icon={<Bookmark className="w-4 h-4" />}
                    isLoading={isSaving}
                    onClick={handleSave}
                  >
                    {saved ? "Saved ✓" : "Save to itinerary"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
