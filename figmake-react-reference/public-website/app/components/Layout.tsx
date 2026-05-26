import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "motion/react";

export function Layout() {
  const location = useLocation();
  const isMap = location.pathname === "/discover";

  return (
    <div className="min-h-screen bg-[#F2F0EB]">
      <Toaster position="bottom-right" richColors />
      <Navbar />
      <main className={isMap ? "mt-16" : "pt-16"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isMap && <Footer />}
    </div>
  );
}
