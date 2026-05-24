import { NavLink, Link } from "react-router";
import { useEffect, useState } from "react";
import { Search, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "./ui-kit";
import { Dialog, DialogContent } from "./ui/dialog";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/discover", label: "Map" },
  { to: "/otop-products", label: "OTOP" },
  { to: "/events", label: "Events" },
  { to: "/museum", label: "Museum" },
  { to: "/components", label: "Design" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  
  // Auth state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
      setIsAuthModalOpen(false);
      toast.success(authView === "login" ? "Logged in successfully" : "Account created successfully");
    }, 800);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-[#E8E4DC] transition-shadow ${
          scrolled ? "shadow-[0_2px_8px_rgba(0,0,0,0.08)]" : ""
        }`}
      >
        <div className="max-w-[1280px] mx-auto h-full px-6 lg:px-10 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#1B4332] grid place-items-center text-white font-display font-bold text-[15px]">
              T
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-display font-bold text-[20px] text-[#1B4332]">TWBIS</span>
              <span className="text-[11px] text-[#5C5C5C] -mt-0.5">Calabanga Tourism</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 self-stretch">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `relative px-3 flex items-center text-[15px] font-medium transition-colors ${
                    isActive ? "text-[#1B4332]" : "text-[#1A1A1A] hover:text-[#1B4332]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <span className="absolute left-3 right-3 bottom-0 h-0.5 bg-[#1B4332] rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              aria-label="Search"
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-[#F2F0EB] text-[#1A1A1A]"
            >
              <Search className="w-5 h-5" />
            </button>
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 ml-1 rounded-full bg-[#1B4332] text-white flex items-center justify-center hover:bg-[#14532D] transition-colors focus:outline-hidden">
                    <User className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border-[#E8E4DC] rounded-[12px]">
                  <div className="px-3 py-2 border-b border-[#E8E4DC] mb-1">
                    <div className="text-[14px] font-medium text-[#1A1A1A]">Tourist Account</div>
                    <div className="text-[12px] text-[#5C5C5C]">tourist@example.com</div>
                  </div>
                  <DropdownMenuItem className="text-[13px] text-[#1A1A1A] cursor-pointer hover:bg-[#F2F0EB] focus:bg-[#F2F0EB]">
                    My Itinerary
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[13px] text-[#1A1A1A] cursor-pointer hover:bg-[#F2F0EB] focus:bg-[#F2F0EB]">
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => { setIsLoggedIn(false); toast("Logged out"); }}
                    className="text-[13px] text-[#B5451B] cursor-pointer mt-1 border-t border-[#E8E4DC] pt-2 hover:bg-[#F2F0EB] focus:bg-[#F2F0EB]"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:inline-flex"
                onClick={() => {
                  setAuthView("login");
                  setIsAuthModalOpen(true);
                }}
              >
                Login
              </Button>
            )}
            <button
              aria-label="Menu"
              onClick={() => setOpen(true)}
              className="lg:hidden w-9 h-9 grid place-items-center rounded-full hover:bg-[#F2F0EB]"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] bg-white lg:hidden fade-up">
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#E8E4DC]">
            <span className="font-display font-bold text-[20px] text-[#1B4332]">TWBIS</span>
            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 grid place-items-center rounded-full hover:bg-[#F2F0EB]"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex flex-col p-6 gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `h-12 flex items-center px-3 rounded-[8px] text-[16px] ${
                    isActive
                      ? "bg-[#D8F3DC] text-[#1B4332] font-semibold"
                      : "text-[#1A1A1A] hover:bg-[#F2F0EB]"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {!isLoggedIn && (
              <Button 
                variant="primary" 
                full 
                className="mt-4"
                onClick={() => {
                  setOpen(false);
                  setAuthView("login");
                  setIsAuthModalOpen(true);
                }}
              >
                Login
              </Button>
            )}
          </nav>
        </div>
      )}

      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="max-w-[400px] p-8 bg-white border-[#E8E4DC] rounded-[16px]">
          <div className="text-center mb-6">
            <h2 className="text-[24px] mb-2">{authView === "login" ? "Welcome back" : "Create account"}</h2>
            <p className="text-[14px] text-[#5C5C5C]">
              {authView === "login" 
                ? "Log in to save locations to your itinerary." 
                : "Sign up to start planning your Calabanga trip."}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {authView === "register" && (
              <div>
                <label className="block text-[13px] font-medium text-[#1A1A1A] mb-1.5">Full name</label>
                <input 
                  type="text" 
                  required
                  className="w-full h-11 px-4 rounded-[8px] border border-[#E8E4DC] focus:border-[#1B4332] focus:outline-hidden text-[14px]"
                  placeholder="Juan Dela Cruz"
                />
              </div>
            )}
            <div>
              <label className="block text-[13px] font-medium text-[#1A1A1A] mb-1.5">Email address</label>
              <input 
                type="email" 
                required
                className="w-full h-11 px-4 rounded-[8px] border border-[#E8E4DC] focus:border-[#1B4332] focus:outline-hidden text-[14px]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-[#1A1A1A]">Password</label>
                {authView === "login" && (
                  <button type="button" className="text-[12px] text-[#1B4332] hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                required
                className="w-full h-11 px-4 rounded-[8px] border border-[#E8E4DC] focus:border-[#1B4332] focus:outline-hidden text-[14px]"
                placeholder="••••••••"
              />
            </div>
            {authView === "register" && (
              <div>
                <label className="block text-[13px] font-medium text-[#1A1A1A] mb-1.5">Confirm password</label>
                <input 
                  type="password" 
                  required
                  className="w-full h-11 px-4 rounded-[8px] border border-[#E8E4DC] focus:border-[#1B4332] focus:outline-hidden text-[14px]"
                  placeholder="••••••••"
                />
              </div>
            )}
            
            <Button type="submit" variant="primary" full className="mt-2" isLoading={isLoading}>
              {authView === "login" ? "Log in" : "Create account"}
            </Button>
            
            <div className="text-center mt-2 text-[13px] text-[#5C5C5C]">
              {authView === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button type="button" onClick={() => setAuthView("register")} className="text-[#1B4332] font-medium hover:underline">
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => setAuthView("login")} className="text-[#1B4332] font-medium hover:underline">
                    Back to login
                  </button>
                </>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
