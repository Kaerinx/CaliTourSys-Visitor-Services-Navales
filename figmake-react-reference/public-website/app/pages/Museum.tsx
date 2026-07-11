import { useState } from "react";
import { X, Play, Volume2, ChevronRight } from "lucide-react";
import { artifacts } from "../data";
import { Button, CategoryBadge } from "../components/ui-kit";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";

export function Museum() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const open = artifacts.find((a) => a.id === openId);

  return (
    <div className="pb-20">
      {/* Cinematic Hero */}
      <section className="relative w-full overflow-hidden museum-hero" style={{ aspectRatio: "21 / 9", minHeight: 360 }}>
        <div className="absolute inset-0 grid place-items-center text-center px-6">
          <div className="max-w-2xl text-white fade-up">
            <span className="text-caption text-white/80">Calabanga Heritage Collection</span>
            <h1 className="text-white mt-3" style={{ fontSize: 56, lineHeight: 1.05 }}>
              Calabanga Cultural Museum
            </h1>
            <p className="text-white/90 mt-4 text-[17px]">
              Step into centuries of Bicolano craft, faith, and seafaring tradition —
              digitized for the world.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="white" icon={<Play className="w-4 h-4 fill-current" />}>
                Watch intro
              </Button>
              <Button variant="whiteGhost">Browse collection</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Artifact grid */}
      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2>The Collection</h2>
            <p className="text-[#5C5C5C] mt-2 max-w-xl">
              {artifacts.length} artifacts spanning pre-colonial trade, Spanish-era worship,
              and 20th-century folk tradition.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["All", "Pre-colonial", "Spanish-era", "Modern"].map((c, i) => (
              <button
                key={c}
                className={`h-9 px-4 rounded-full text-[13px] font-medium ${
                  i === 0 ? "bg-[#1B4332] text-white" : "bg-white border border-[#E8E4DC] hover:border-[#1B4332]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artifacts.map((a) => (
            <button
              key={a.id}
              onClick={() => { setOpenId(a.id); setSelectedImageIdx(0); }}
              className="group text-left bg-white rounded-[12px] border border-[#E8E4DC] hover:border-[#1B4332] hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div
                className="aspect-square relative"
                style={{ background: `linear-gradient(135deg, ${a.accent}, ${a.accent}AA)` }}
              >
                <div
                  className="absolute inset-0 opacity-40 mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.5), transparent 45%), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.4), transparent 55%)",
                  }}
                />
              </div>
              <div className="p-5">
                <CategoryBadge tone="gold">{a.era}</CategoryBadge>
                <h3 className="mt-3">{a.name}</h3>
                <p className="text-[14px] text-[#5C5C5C] mt-2 line-clamp-2">{a.desc}</p>
                <span className="text-[13px] text-[#1B4332] font-medium mt-3 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Explore <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-6"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setOpenId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-none md:rounded-[16px] w-full h-full md:h-auto md:max-w-[800px] md:max-h-[90vh] overflow-hidden grid grid-cols-1 md:grid-cols-2 fade-up"
          >
            <div
              className="aspect-square md:aspect-auto md:h-full relative overflow-hidden flex flex-col"
            >
              <div 
                className="flex-1 transition-colors duration-300"
                style={{ background: `linear-gradient(135deg, ${open.accent}, ${open.accent}${selectedImageIdx === 0 ? 'AA' : selectedImageIdx === 1 ? 'CC' : '88'})` }}
              >
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 50%)" }} />
              </div>
              <div className="h-[100px] absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-3 bg-gradient-to-t from-black/50 to-transparent">
                {[0, 1, 2].map((idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-14 h-14 rounded-[8px] border-2 overflow-hidden transition-all ${selectedImageIdx === idx ? 'border-white scale-110' : 'border-white/40 hover:border-white/70 opacity-70 hover:opacity-100'}`}
                    style={{ background: open.accent }}
                  >
                    <div className="w-full h-full bg-white/20 mix-blend-overlay" />
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8 overflow-y-auto relative">
              <button
                onClick={() => setOpenId(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F2F0EB] grid place-items-center hover:bg-[#E8E4DC] focus:outline-hidden"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-[12px] text-[#5C5C5C] mb-2">Collection / Heritage</div>
              <h1 style={{ fontSize: 30 }}>{open.name}</h1>
              <div className="mt-3">
                <CategoryBadge tone="gold">{open.era}</CategoryBadge>
              </div>
              <p className="text-[15px] text-[#1A1A1A] mt-5 leading-relaxed">{open.desc}</p>
              <p className="text-[14px] text-[#5C5C5C] mt-3">
                Recovered and preserved by the LGU Calabanga heritage program in collaboration
                with the National Museum of the Philippines.
              </p>

              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="mt-6 rounded-[12px] border border-[#E8E4DC] p-4 flex items-center gap-3 opacity-60 cursor-not-allowed">
                    <span className="w-10 h-10 rounded-full bg-[#F2F0EB] grid place-items-center text-[#5C5C5C]">
                      <Volume2 className="w-4 h-4" />
                    </span>
                    <div className="flex-1">
                      <div className="text-[14px] font-medium">Audio guide</div>
                      <div className="text-[12px] text-[#5C5C5C]">Coming soon</div>
                    </div>
                    <button disabled className="h-9 px-4 rounded-[8px] bg-[#F2F0EB] text-[#5C5C5C] text-[13px] pointer-events-none">
                      Play
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1B4332] text-white">
                  Coming soon in next update
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
