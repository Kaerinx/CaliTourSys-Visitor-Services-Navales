import { useState } from "react";
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button, ProductCard } from "../components/ui-kit";
import { products } from "../data";
import { useNavigate } from "react-router";

const chips = ["All", "Sweets", "Crafts", "Pantry", "Textiles", "Beverages", "Skincare"];

export function OTOPProducts() {
  const [active, setActive] = useState("All");
  const [showEmpty, setShowEmpty] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const navigate = useNavigate();

  const handleCategoryClick = (c: string) => {
    if (active === c) return;
    setActive(c);
    setIsFiltering(true);
    setTimeout(() => {
      setIsFiltering(false);
    }, 800);
  };

  const filtered =
    active === "All" ? products : products.filter((p) => p.category === active);

  return (
    <div>
      {/* Header */}
      <section className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10 flex flex-col lg:flex-row lg:items-end gap-6 lg:justify-between">
          <div>
            <span className="text-caption text-[#5C5C5C]">OTOP · One Town, One Product</span>
            <h1 className="mt-2">OTOP Products</h1>
            <p className="text-[#5C5C5C] max-w-xl mt-2">
              Explore locally-made products from Calabanga's accredited producers — every
              item is vetted by the LGU for quality and authenticity.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C5C]" />
              <input
                placeholder="Search products..."
                className="h-11 w-[280px] pl-10 pr-3 rounded-[8px] bg-[#F2F0EB] text-[14px] outline-none focus:ring-2 focus:ring-[#1B4332]/20"
              />
            </div>
            <button className="h-11 px-4 rounded-[8px] border border-[#E8E4DC] bg-white text-[14px] font-medium flex items-center gap-2 hover:border-[#1B4332]">
              Sort: Featured
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="h-11 px-4 rounded-[8px] border border-[#E8E4DC] bg-white text-[14px] font-medium flex items-center gap-2 hover:border-[#1B4332]">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        {/* Sticky chip row */}
        <div className="border-t border-[#E8E4DC] sticky top-16 bg-white z-30">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => handleCategoryClick(c)}
                className={`h-9 px-4 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                  active === c
                    ? "bg-[#1B4332] text-white"
                    : "bg-[#FFE8DE] text-[#7A2D0E] hover:bg-[#FBD5C2]"
                }`}
              >
                {c}
              </button>
            ))}
            <button
              onClick={() => setShowEmpty((s) => !s)}
              className="ml-auto h-9 px-3 text-[12px] text-[#5C5C5C] hover:text-[#1B4332]"
            >
              {showEmpty ? "Show results" : "Preview empty state"}
            </button>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-[#F2F0EB] py-10 min-h-[60vh]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between mb-6">
            <div className="text-[13px] text-[#5C5C5C]">
              Showing <span className="text-[#1A1A1A] font-medium">{filtered.length}</span> products
            </div>
          </div>

          {showEmpty || filtered.length === 0 ? (
            <div className="bg-white rounded-[16px] border border-[#E8E4DC] py-20 flex flex-col items-center text-center">
              <div className="w-40 h-40 rounded-[16px] border-2 border-dashed border-[#BDBDBD] grid place-items-center text-[#BDBDBD]">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="mt-6">No results found</h3>
              <p className="text-[#5C5C5C] mt-2 max-w-sm">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <div className="mt-6">
                <Button variant="ghost" onClick={() => { handleCategoryClick("All"); setShowEmpty(false); }}>
                  Clear filters
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {isFiltering
                  ? Array.from({ length: 6 }).map((_, i) => <ProductCard key={i} isLoading />)
                  : filtered.map((p) => (
                      <ProductCard key={p.id} p={p} onClick={() => navigate(`/otop-products/${p.id}`)} />
                    ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-1 mt-12">
                <button className="h-10 px-3 rounded-[8px] border border-[#E8E4DC] bg-white text-[14px] hover:border-[#1B4332]">
                  Previous
                </button>
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    className={`w-10 h-10 rounded-[8px] text-[14px] font-medium ${
                      n === 1
                        ? "bg-[#1B4332] text-white"
                        : "border border-[#E8E4DC] bg-white hover:border-[#1B4332]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <span className="px-2 text-[#5C5C5C]">…</span>
                <button className="w-10 h-10 rounded-[8px] border border-[#E8E4DC] bg-white text-[14px] hover:border-[#1B4332]">
                  12
                </button>
                <button className="h-10 px-3 rounded-[8px] border border-[#E8E4DC] bg-white text-[14px] font-medium hover:border-[#1B4332]">
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
