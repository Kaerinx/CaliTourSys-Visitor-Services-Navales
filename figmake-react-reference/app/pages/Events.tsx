import { useState } from "react";
import { CalendarDays, List, MapPin, X, CalendarPlus } from "lucide-react";
import { Button, CategoryBadge } from "../components/ui-kit";
import { Dialog, DialogContent, DialogClose } from "../components/ui/dialog";
import { events } from "../data";

export function Events() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  const featured = events[0];
  const rest = events.slice(1);
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthIndex = 4; // May (0-based)
  const displayMonthIndex = (currentMonthIndex + monthOffset + 12) % 12;
  const displayMonth = months[displayMonthIndex];

  return (
    <div className="pb-20">
      {/* Header */}
      <section className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10 flex flex-col lg:flex-row lg:items-end gap-6 lg:justify-between">
          <div>
            <span className="text-caption text-[#5C5C5C]">Calendar · 2026</span>
            <h1 className="mt-2">Events & Promotions</h1>
            <p className="text-[#5C5C5C] max-w-xl mt-2">
              Festivals, regattas, and community celebrations across Calabanga. Plan your visit around our calendar.
            </p>
          </div>
          <div className="inline-flex h-11 p-1 bg-[#F2F0EB] rounded-[10px]">
            <button
              onClick={() => setView("list")}
              className={`h-full px-4 rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-colors ${
                view === "list" ? "bg-white text-[#1B4332] shadow-sm" : "text-[#5C5C5C]"
              }`}
            >
              <List className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`h-full px-4 rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-colors ${
                view === "calendar" ? "bg-white text-[#1B4332] shadow-sm" : "text-[#5C5C5C]"
              }`}
            >
              <CalendarDays className="w-4 h-4" /> Calendar
            </button>
          </div>
        </div>
      </section>

      {/* Featured banner */}
      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-10">
        <div
          className="relative rounded-[16px] overflow-hidden h-[400px] flex items-end"
          style={{
            background: `linear-gradient(105deg, ${featured.accent} 0%, ${featured.accent}CC 60%, transparent 100%), linear-gradient(135deg, #1B4332, #2D6A4F)`,
          }}
        >
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 80% 60%, rgba(255,255,255,0.25), transparent 50%)" }} />
          <div className="relative p-10 max-w-xl text-white">
            <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#FFF9E6] text-[#7D5A00] text-[12px] font-medium border border-[#D4AC0D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AC0D]" />
              Featured
            </span>
            <h2 className="text-white mt-4" style={{ fontSize: 40 }}>{featured.title}</h2>
            <div className="flex items-center gap-3 text-[14px] text-white/90 mt-2">
              <span>{featured.day} {featured.month} 2026</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {featured.location}</span>
            </div>
            <p className="text-white/85 mt-4 max-w-md text-[15px]">{featured.desc}</p>
            <div className="flex gap-3 mt-6">
              <Button variant="white" onClick={() => setSelectedEventId(featured.id)}>View event details</Button>
              <Button variant="whiteGhost">Add to itinerary</Button>
            </div>
          </div>
          <div className="absolute top-6 right-6 bg-white rounded-[12px] px-4 py-3 text-center">
            <div className="text-[11px] tracking-widest text-[#5C5C5C]">{featured.month}</div>
            <div className="font-display font-bold text-[36px] text-[#1B4332] leading-none">{featured.day}</div>
            <div className="text-[11px] text-[#5C5C5C] mt-1">2026</div>
          </div>
        </div>
      </section>

      {view === "list" ? (
        <section className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rest.map((e) => (
              <article
                key={e.id}
                className="bg-white rounded-[12px] border border-[#E8E4DC] hover:border-[#1B4332] hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col"
              >
                <div
                  className="relative aspect-[16/9]"
                  style={{ background: `linear-gradient(135deg, ${e.accent}, ${e.accent}AA)` }}
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
                    <MapPin className="w-3.5 h-3.5" /> {e.location}
                  </div>
                  <p className="text-[14px] text-[#5C5C5C] line-clamp-2">{e.desc}</p>
                  <button onClick={() => setSelectedEventId(e.id)} className="text-[13px] text-[#1B4332] font-medium mt-1 text-left">View event →</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-10">
          <div className="bg-white rounded-[16px] border border-[#E8E4DC] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3>{displayMonth} 2026</h3>
              <div className="flex gap-2">
                <button onClick={() => setMonthOffset(m => m - 1)} className="w-9 h-9 rounded-[8px] border border-[#E8E4DC] hover:border-[#1B4332] grid place-items-center">‹</button>
                <button onClick={() => setMonthOffset(m => m + 1)} className="w-9 h-9 rounded-[8px] border border-[#E8E4DC] hover:border-[#1B4332] grid place-items-center">›</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-[12px] text-[#5C5C5C] mb-3">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => {
                const day = i - 4;
                const hasEvent = [24, 8].includes(day);
                const eventForDay = events.find((e) => parseInt(e.day) === day);
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-[8px] border p-2 text-[13px] ${
                      day < 1 || day > 31
                        ? "border-transparent text-[#BDBDBD]"
                        : hasEvent
                        ? "border-[#1B4332] bg-[#D8F3DC]"
                        : "border-[#E8E4DC]"
                    }`}
                  >
                    {day >= 1 && day <= 31 && (
                      <>
                        <div className={hasEvent ? "font-semibold text-[#1B4332]" : ""}>{day}</div>
                        {eventForDay && (
                          <div className="text-[10px] text-[#1B4332] mt-1 truncate font-medium">
                            {eventForDay.title}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Dialog open={!!selectedEventId} onOpenChange={(open) => !open && setSelectedEventId(null)}>
        <DialogContent className="max-w-[700px] p-0 bg-white border-[#E8E4DC] rounded-[16px] overflow-hidden gap-0">
          {selectedEvent && (
            <>
              <div 
                className="relative h-[240px]"
                style={{ background: `linear-gradient(135deg, ${selectedEvent.accent}, ${selectedEvent.accent}AA)` }}
              >
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 50%)" }} />
                <DialogClose className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 grid place-items-center text-white border-none focus:outline-hidden">
                  <X className="w-4 h-4" />
                </DialogClose>
              </div>
              <div className="p-8">
                <CategoryBadge>{selectedEvent.category}</CategoryBadge>
                <h2 className="mt-3 text-[32px]">{selectedEvent.title}</h2>
                <div className="flex items-center gap-4 text-[14px] text-[#5C5C5C] mt-3">
                  <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {selectedEvent.month} {selectedEvent.day}, 2026</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {selectedEvent.location}</span>
                </div>
                <Divider className="my-6" />
                <div className="text-[15px] text-[#1A1A1A] leading-relaxed mb-8">
                  {selectedEvent.desc}
                  <br/><br/>
                  Join us for a spectacular event in Calabanga. Whether you're coming with family or friends, there's something for everyone. Experience local food, performances, and the hospitality of our community. 
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setSelectedEventId(null)}>Close</Button>
                  <Button variant="primary" icon={<CalendarPlus className="w-4 h-4" />}>
                    <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-white">
                      Add to calendar
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Divider({ className }: { className?: string }) {
  return <div className={`h-px bg-[#E8E4DC] w-full ${className || ""}`} />;
}
