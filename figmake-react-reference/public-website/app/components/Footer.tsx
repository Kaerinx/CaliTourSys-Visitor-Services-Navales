import { Link } from "react-router";
import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#1B4332] text-white mt-24">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-[10px] bg-white grid place-items-center text-[#1B4332] font-display font-bold">
              T
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-[20px]">TWBIS</span>
              <span className="text-[12px] text-white/70 -mt-0.5">Calabanga Tourism</span>
            </div>
          </div>
          <p className="text-[14px] text-white/70 max-w-xs">
            The official tourism platform of the Local Government of Calabanga,
            Camarines Sur — celebrating our coast, culture, and craft.
          </p>
          <div className="flex gap-2 mt-5">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 grid place-items-center rounded-full border border-white/20 hover:bg-white/10"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white text-caption mb-4 text-[12px]">Explore</h4>
          <ul className="space-y-2.5 text-[14px] text-white/80">
            <li><Link to="/discover" className="hover:text-white">Map & Discovery</Link></li>
            <li><Link to="/otop-products" className="hover:text-white">OTOP Products</Link></li>
            <li><Link to="/events" className="hover:text-white">Events</Link></li>
            <li><Link to="/museum" className="hover:text-white">Virtual Museum</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-caption mb-4 text-[12px]">Visit</h4>
          <ul className="space-y-2.5 text-[14px] text-white/80">
            <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />LGU Calabanga, Camarines Sur 4405</li>
            <li className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 shrink-0" />+63 54 871 1234</li>
            <li className="flex gap-2"><Mail className="w-4 h-4 mt-0.5 shrink-0" />tourism@calabanga.gov.ph</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-caption mb-4 text-[12px]">Stay updated</h4>
          <p className="text-[14px] text-white/70 mb-3">
            Festival dates, new producers, and seasonal guides — once a month.
          </p>
          <form className="flex gap-2">
            <input
              placeholder="you@email.com"
              className="flex-1 h-10 rounded-[8px] px-3 bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-[14px] outline-none focus:border-white"
            />
            <button className="h-10 px-4 rounded-[8px] bg-white text-[#1B4332] text-[13px] font-medium hover:bg-[#D8F3DC]">
              Join
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/20" />
      <div className="bg-[#14532D]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-white/70">
          <span>© 2026 LGU Calabanga, Camarines Sur. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Accessibility</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
