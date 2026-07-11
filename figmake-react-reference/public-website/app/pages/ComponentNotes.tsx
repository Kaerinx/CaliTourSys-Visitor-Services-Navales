import { Button, AccreditationBadge, CategoryBadge, ProductCard, StarRow, VerifiedDot } from "../components/ui-kit";
import { products } from "../data";
import { Leaf, Landmark, UtensilsCrossed, Calendar, MapPin, Compass, Search } from "lucide-react";

const palette = [
  { name: "Primary", hex: "#1B4332", text: "white", use: "Buttons, links, active states" },
  { name: "Primary Hover", hex: "#14532D", text: "white", use: "Primary button hover" },
  { name: "Primary Light", hex: "#D8F3DC", text: "#1B4332", use: "Hover fills, section backgrounds" },
  { name: "Accent", hex: "#B5451B", text: "white", use: "Terra-cotta — selected pins, accents" },
  { name: "Accent Light", hex: "#FFE8DE", text: "#7A2D0E", use: "Category pills" },
  { name: "Gold", hex: "#D4AC0D", text: "white", use: "Accreditation, ratings" },
  { name: "Neutral Dark", hex: "#1A1A1A", text: "white", use: "Body text" },
  { name: "Neutral Mid", hex: "#5C5C5C", text: "white", use: "Secondary text, captions" },
  { name: "Neutral Light", hex: "#F2F0EB", text: "#1A1A1A", use: "Page background" },
  { name: "Border", hex: "#E8E4DC", text: "#1A1A1A", use: "Card borders, dividers" },
  { name: "Success", hex: "#1B7A4A", text: "white", use: "Confirmation, verified" },
  { name: "Danger", hex: "#C0392B", text: "white", use: "Errors, destructive" },
];

const typeSamples = [
  { label: "H1 · Plus Jakarta Sans 700", size: 44, sample: "Discover the Heart of Bicol" },
  { label: "H2 · Plus Jakarta Sans 600", size: 32, sample: "Calabanga's Finest" },
  { label: "H3 · Plus Jakarta Sans 600", size: 20, sample: "Pili Nut Brittle" },
  { label: "Body · Inter 400 / 16px", size: 16, sample: "Explore Calabanga's coast, culture, and crafts.", body: true },
  { label: "Caption · Inter 500 / 12px uppercase", size: 12, sample: "CALABANGA · CAMARINES SUR", caps: true },
];

export function ComponentNotes() {
  return (
    <div className="bg-[#F2F0EB] pb-20">
      <section className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10">
          <span className="text-caption text-[#5C5C5C]">Design System · v1.0</span>
          <h1 className="mt-2">TWBIS Design Language</h1>
          <p className="text-[#5C5C5C] max-w-2xl mt-3">
            The shared visual foundation behind every page of TWBIS — calibrated for
            warmth, cultural rootedness, and the trust of an LGU platform.
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 space-y-16">
        {/* Palette */}
        <section>
          <h2>Color palette</h2>
          <p className="text-[#5C5C5C] mt-2">12 tokens — every brand color used across TWBIS.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {palette.map((c) => (
              <div key={c.hex} className="bg-white rounded-[12px] border border-[#E8E4DC] overflow-hidden">
                <div className="h-24 flex items-end p-3 font-mono text-[12px]" style={{ background: c.hex, color: c.text }}>
                  {c.hex}
                </div>
                <div className="p-4">
                  <div className="text-[14px] font-semibold">{c.name}</div>
                  <div className="text-[12px] text-[#5C5C5C] mt-1">{c.use}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2>Typography</h2>
          <p className="text-[#5C5C5C] mt-2">Plus Jakarta Sans for display, Inter for body.</p>
          <div className="mt-6 bg-white rounded-[16px] border border-[#E8E4DC] divide-y divide-[#E8E4DC]">
            {typeSamples.map((t) => (
              <div key={t.label} className="p-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
                <div className="text-[12px] text-[#5C5C5C] md:w-64 shrink-0">{t.label}</div>
                <div
                  className={`${t.body ? "font-body" : "font-display"} text-[#1A1A1A] flex-1`}
                  style={{
                    fontSize: t.size,
                    fontWeight: t.body ? 400 : 600,
                    letterSpacing: t.caps ? "0.05em" : undefined,
                    textTransform: t.caps ? "uppercase" : "none",
                  }}
                >
                  {t.sample}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spacing */}
        <section>
          <h2>Spacing system</h2>
          <p className="text-[#5C5C5C] mt-2">8px base grid.</p>
          <div className="mt-6 bg-white rounded-[16px] border border-[#E8E4DC] p-6 flex items-end gap-4 flex-wrap">
            {[4, 8, 12, 16, 24, 32, 48, 64, 96, 128].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className="bg-[#1B4332]" style={{ width: s, height: s }} />
                <span className="text-[12px] text-[#5C5C5C]">{s}px</span>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2>Buttons</h2>
          <div className="mt-6 bg-white rounded-[16px] border border-[#E8E4DC] p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="text-caption text-[#5C5C5C] mb-4">Primary</div>
              <div className="flex flex-col gap-3 items-start">
                <Button variant="primary">Default</Button>
                <Button variant="primary" icon={<Compass className="w-5 h-5" />}>With icon</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>
            <div>
              <div className="text-caption text-[#5C5C5C] mb-4">Ghost</div>
              <div className="flex flex-col gap-3 items-start">
                <Button variant="ghost">Default</Button>
                <Button variant="ghost" icon={<Search className="w-5 h-5" />}>Search</Button>
                <Button variant="ghost" disabled>Disabled</Button>
              </div>
            </div>
            <div className="bg-[#1B4332] -m-4 p-8 rounded-[12px]">
              <div className="text-caption text-white/70 mb-4">On dark — White</div>
              <div className="flex flex-col gap-3 items-start">
                <Button variant="white">Default</Button>
                <Button variant="whiteGhost">Ghost outline</Button>
              </div>
            </div>
            <div>
              <div className="text-caption text-[#5C5C5C] mb-4">Sizes</div>
              <div className="flex flex-col gap-3 items-start">
                <Button variant="primary" size="md">48px medium</Button>
                <Button variant="primary" size="sm">36px small</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2>Badges</h2>
          <div className="mt-6 bg-white rounded-[16px] border border-[#E8E4DC] p-8 flex flex-wrap gap-3 items-center">
            <AccreditationBadge />
            <CategoryBadge>Sweets</CategoryBadge>
            <CategoryBadge>Crafts</CategoryBadge>
            <CategoryBadge tone="primary">Nature</CategoryBadge>
            <CategoryBadge tone="gold">18th century</CategoryBadge>
            <StarRow rating={4.8} count={124} />
            <span className="inline-flex items-center gap-1.5 text-[13px]">
              <VerifiedDot /> Verified producer
            </span>
          </div>
        </section>

        {/* Icons */}
        <section>
          <h2>Icon set</h2>
          <p className="text-[#5C5C5C] mt-2">Lucide icons at 20px in #1B4332.</p>
          <div className="mt-6 bg-white rounded-[16px] border border-[#E8E4DC] p-8 grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { icon: Leaf, label: "Nature" },
              { icon: Landmark, label: "Culture" },
              { icon: UtensilsCrossed, label: "Food" },
              { icon: Calendar, label: "Events" },
              { icon: MapPin, label: "Location" },
              { icon: Compass, label: "Discover" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#D8F3DC] grid place-items-center text-[#1B4332]">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[12px] text-[#5C5C5C]">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Product card states */}
        <section>
          <h2>Product card</h2>
          <p className="text-[#5C5C5C] mt-2">Default, hover (translated), and skeleton loading state.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <ProductCard p={products[0]} />
            <ProductCard p={products[1]} />
            <div className="bg-white rounded-[12px] border border-[#E8E4DC] overflow-hidden">
              <div className="aspect-[4/3] bg-[#E8E4DC] skeleton-pulse" />
              <div className="p-4 space-y-3 skeleton-pulse">
                <div className="h-3 w-1/3 bg-[#F2F0EB] rounded-full" />
                <div className="h-4 w-4/5 bg-[#F2F0EB] rounded-full" />
                <div className="h-4 w-3/5 bg-[#F2F0EB] rounded-full" />
                <div className="h-4 w-1/4 bg-[#F2F0EB] rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Elevation */}
        <section>
          <h2>Elevation & borders</h2>
          <p className="text-[#5C5C5C] mt-2">Flat design — borders, not shadows.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <div className="bg-white rounded-[12px] border border-[#E8E4DC] p-6">
              <div className="text-[14px] font-semibold">Default</div>
              <div className="text-[12px] text-[#5C5C5C] mt-1">1px · #E8E4DC</div>
            </div>
            <div className="bg-white rounded-[12px] border border-[#1B4332] p-6">
              <div className="text-[14px] font-semibold">Hover</div>
              <div className="text-[12px] text-[#5C5C5C] mt-1">1px · Primary</div>
            </div>
            <div className="bg-white rounded-[12px] border-2 border-[#1B4332] p-6">
              <div className="text-[14px] font-semibold">Selected</div>
              <div className="text-[12px] text-[#5C5C5C] mt-1">2px · Primary</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
