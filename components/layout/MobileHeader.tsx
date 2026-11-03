"use client";

import { useState, useEffect } from "react";

export function MobileHeader() {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem("payorbit_logo");
    if (savedLogo) setLogo(savedLogo);

    const handleLogoUpdate = () => {
      const updatedLogo = localStorage.getItem("payorbit_logo");
      setLogo(updatedLogo);
    };
    window.addEventListener("logoUpdated", handleLogoUpdate);
    return () => window.removeEventListener("logoUpdated", handleLogoUpdate);
  }, []);

  return (
    <header className="md:hidden sticky top-0 z-50 relative">
      {/* Glow border */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--saffron)] to-transparent opacity-80 shadow-[0_0_10px_var(--saffron)]" />

      <div className="flex justify-between items-center bg-gradient-to-br from-[var(--navy)] via-[var(--navy-2)] to-[var(--navy)] px-4 py-3 rounded-b-2xl shadow-2xl shadow-[var(--navy)]/50 border-b border-white/10">
        
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-[var(--saffron)]/30 blur-lg" />
            {logo ? (
              <img 
                src={logo} 
                alt="Logo" 
                className="relative w-10 h-10 rounded-xl object-cover shrink-0 ring-2 ring-[var(--saffron)]/50 shadow-lg" 
              />
            ) : (
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--saffron)] to-[#ffb347] grid place-items-center font-extrabold text-[var(--navy)] text-sm shadow-lg shadow-[var(--saffron)]/50">
                PO
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <h2 className="text-lg font-extrabold leading-tight text-white">
              Pay<span className="text-[var(--saffron)]">Orbit</span>
            </h2>
            <p className="text-[10px] text-[#8da0c0] font-bold uppercase tracking-widest">
              Admin Console
            </p>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 bg-[var(--ok)]/10 px-3 py-1.5 rounded-full border border-[var(--ok)]/30 shadow-lg shadow-[var(--ok)]/20">
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ok)] opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--ok)]" />
  </span>
  <span className="text-[11px] font-extrabold text-[var(--ok)] tracking-wider">
    LIVE
  </span>
</div>
      </div>
    </header>
  );
}