"use client";

import { useState, useEffect } from "react";

export function MobileHeader() {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    // Load logo from localStorage
    const savedLogo = localStorage.getItem("payorbit_logo");
    if (savedLogo) setLogo(savedLogo);

    // Listen for logo updates from Settings
    const handleLogoUpdate = () => {
      const updatedLogo = localStorage.getItem("payorbit_logo");
      setLogo(updatedLogo);
    };
    window.addEventListener("logoUpdated", handleLogoUpdate);
    return () => window.removeEventListener("logoUpdated", handleLogoUpdate);
  }, []);

  return (
    <header className="md:hidden flex justify-between items-center bg-[var(--panel)] p-4 rounded-[var(--r)] shadow-sm">
      <div className="flex items-center gap-3">
        {/* Logo ya fallback "PO" */}
        {logo ? (
          <img 
            src={logo} 
            alt="Logo" 
            className="w-10 h-10 rounded-xl object-cover shrink-0" 
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-[var(--saffron)] grid place-items-center font-extrabold text-[var(--navy)] text-sm shrink-0">
            PO
          </div>
        )}
        <div>
          <h2 className="text-lg font-extrabold leading-tight">PayOrbit</h2>
          <p className="text-[11px] text-[var(--ink-2)] font-semibold uppercase tracking-wider">Admin Console</p>
        </div>
      </div>
      <span className="inline-flex gap-2 items-center bg-[var(--ok-soft)] text-[var(--ok)] px-3 py-1.5 rounded-full font-bold text-xs">
        <i className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
        Live
      </span>
    </header>
  );
}