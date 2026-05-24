import { Link, useParams } from "react-router";
import { useState } from "react";
import { Facebook, MessageCircle, Link2, Bookmark, ChevronRight, X } from "lucide-react";
import { Button, AccreditationBadge, CategoryBadge, ProductCard, VerifiedDot, StarRow, Divider } from "../components/ui-kit";
import { products } from "../data";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";

export function ProductDetail() {
  const { id } = useParams();
  const p = products.find((x) => x.id === id) ?? products[0];
  const [active, setActive] = useState(0);
  const thumbs = [p.accent, "#2D6A4F", "#D4AC0D", "#7B341E"];

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      toast.success("Saved to itinerary");
    }, 800);
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowContact(false);
      toast.success("Inquiry sent successfully!");
    }, 800);
  };

  return (
    <div className="bg-[#F2F0EB] pb-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-4 flex items-center gap-2 text-[13px] text-[#5C5C5C]">
          <Link to="/" className="hover:text-[#1B4332]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/otop-products" className="hover:text-[#1B4332]">OTOP Products</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1A1A1A]">{p.name}</span>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10">
        {/* Left: Gallery */}
        <div>
          <div
            className="aspect-[16/9] rounded-[12px] border border-[#E8E4DC] overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${thumbs[active]}, ${thumbs[active]}AA)` }}
          >
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.3), transparent 50%)" }} />
            <div className="absolute top-4 right-4">
              <AccreditationBadge />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {thumbs.map((c, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-20 h-[60px] rounded-[8px] overflow-hidden transition-all ${
                  active === i ? "ring-2 ring-[#1B4332]" : "border border-[#E8E4DC] hover:border-[#1B4332]"
                }`}
                style={{ background: `linear-gradient(135deg, ${c}, ${c}AA)` }}
              />
            ))}
          </div>

          {/* About section */}
          <div className="mt-10">
            <h2 style={{ fontSize: 22 }}>About this product</h2>
            <p className="text-[15px] text-[#1A1A1A] mt-4 leading-relaxed">
              {p.name} is a hand-crafted product by {p.producer}, made using traditional
              techniques passed down through generations in Calabanga. Each piece carries the
              warmth of the maker and the character of our coastal community.
            </p>
            <ul className="mt-6 space-y-3 text-[14px] text-[#1A1A1A]">
              {[
                "Hand-made in small batches in Calabanga, Camarines Sur",
                "All-natural ingredients sourced from local farms",
                "Packaging is biodegradable and locally produced",
                "Supports a registered OTOP producer cooperative",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1B4332] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: details */}
        <aside className="lg:sticky lg:top-24 self-start space-y-5">
          <div className="bg-white rounded-[16px] border border-[#E8E4DC] p-6">
            <div className="flex gap-2 flex-wrap">
              <CategoryBadge>{p.category}</CategoryBadge>
              <AccreditationBadge />
            </div>
            <h1 className="mt-4" style={{ fontSize: 32 }}>{p.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StarRow rating={4.8} count={124} />
              <span className="text-[13px] text-[#5C5C5C]">· In stock</span>
            </div>
            <div className="text-[28px] font-medium mt-4" style={{ fontFamily: "Inter" }}>{p.price}</div>
            <p className="text-[15px] text-[#5C5C5C] mt-3">
              A small-batch favorite from {p.producer}. Hand-made and shipped from Calabanga
              within 3–5 business days.
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="primary" full onClick={() => setShowContact(true)}>Contact producer</Button>
              <Button 
                variant="ghost" 
                full 
                icon={<Bookmark className="w-5 h-5" />}
                isLoading={isSaving}
                onClick={handleSave}
              >
                {saved ? "Saved ✓" : "Save to itinerary"}
              </Button>
            </div>

            <Divider />
            <div className="pt-4 mt-4">
              <div className="text-[13px] text-[#5C5C5C] mb-2.5">Share this product</div>
              <div className="flex gap-2">
                {[Facebook, MessageCircle, Link2].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-10 h-10 rounded-full border border-[#E8E4DC] grid place-items-center hover:border-[#1B4332] hover:text-[#1B4332]"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Producer card */}
          <div className="bg-white rounded-[12px] border border-[#E8E4DC] p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D8F3DC] grid place-items-center text-[#1B4332] font-semibold">
                {p.producer.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[14px] font-semibold">
                  By {p.producer}
                  <VerifiedDot />
                </div>
                <div className="text-[12px] text-[#5C5C5C]">Accredited since 2022 · Quipayo</div>
              </div>
              <AccreditationBadge />
            </div>
            <a className="text-[13px] text-[#1B4332] font-medium mt-3 inline-block">
              View producer profile →
            </a>
          </div>
        </aside>
      </div>

      {/* Related */}
      <section className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="bg-white rounded-[16px] border border-[#E8E4DC] p-8">
          <h2 style={{ fontSize: 24 }}>You might also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-6">
            {products.filter((x) => x.id !== p.id).slice(0, 4).map((rp) => (
              <ProductCard key={rp.id} p={rp} />
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showContact && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowContact(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DC]">
                <h3 className="text-[18px] font-semibold text-[#1B4332]">Contact Producer</h3>
                <button
                  onClick={() => setShowContact(false)}
                  className="w-8 h-8 rounded-full grid place-items-center hover:bg-[#F2F0EB]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSendInquiry} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#1A1A1A] mb-1">Name</label>
                  <input required className="w-full h-11 px-3 rounded-[8px] border border-[#E8E4DC] focus:border-[#1B4332] outline-none text-[14px]" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1A1A1A] mb-1">Email</label>
                  <input required type="email" className="w-full h-11 px-3 rounded-[8px] border border-[#E8E4DC] focus:border-[#1B4332] outline-none text-[14px]" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1A1A1A] mb-1">Message</label>
                  <textarea required className="w-full h-24 p-3 rounded-[8px] border border-[#E8E4DC] focus:border-[#1B4332] outline-none text-[14px] resize-none"></textarea>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" type="button" onClick={() => setShowContact(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isSending}>Send inquiry</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
