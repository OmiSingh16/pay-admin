"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/actions/auth";

const ICONS = {
  dash: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  deposit: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  withdraw: "M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5",
  upi: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3z",
  users: "M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  chev: "M15 6l-6 6 6 6",
  out: "M9 4H5v16h4M16 8l4 4-4 4M20 12H9",
};

const GROUPS = [
  { name: "Overview", items: [["dash", "Dashboard", "/dashboard"]] },
  {
    name: "Review",
    items: [
      ["deposit", "Deposits", "/dashboard/deposit"],
      ["withdraw", "Withdrawals", "/dashboard/withdraw"],
      ["upi", "UPI requests", "/dashboard/upi"],
    ],
  },
  { name: "People", items: [["users", "Users", "/dashboard/users"]] },
  { name: "System", items: [["settings", "Settings", "/dashboard/settings"]] },
];

const ico = (d: string) => (
  <svg className="w-5 h-5 fill-none stroke-current stroke-2 stroke-linecap-round stroke-linejoin-round shrink-0" viewBox="0 0 24 24">
    <path d={d} />
  </svg>
);

export default function Sidebar({ counts = {} }: { counts?: Record<string, number> }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sb-open");
    const open = saved === null ? window.innerWidth >= 1280 : saved === "1";
    setIsOpen(open);
    document.documentElement.classList.toggle("sb-open", open);

    // Load logo
    const savedLogo = localStorage.getItem("payorbit_logo");
    if (savedLogo) setLogo(savedLogo);

    // Listen for logo updates
    const handleLogoUpdate = () => {
      const updatedLogo = localStorage.getItem("payorbit_logo");
      setLogo(updatedLogo);
    };
    window.addEventListener("logoUpdated", handleLogoUpdate);

    // Keyboard shortcut
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "[" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        setIsOpen((prev) => {
          const next = !prev;
          localStorage.setItem("sb-open", next ? "1" : "0");
          document.documentElement.classList.toggle("sb-open", next);
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("logoUpdated", handleLogoUpdate);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  const toggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem("sb-open", next ? "1" : "0");
      document.documentElement.classList.toggle("sb-open", next);
      return next;
    });
  };

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  return (
    <nav className={`rail bg-[var(--navy)] rounded-r-[28px] flex flex-col sticky top-0 h-[100dvh] shrink-0 z-30 transition-all 
      ${isOpen ? "w-[252px]" : "w-[72px]"} 
      max-md:fixed max-md:bottom-2 max-md:left-2 max-md:right-2 max-md:top-auto max-md:h-auto max-md:w-auto max-md:flex-row max-md:rounded-[20px] max-md:p-1.5 max-md:z-50`}>
      
      {/* Top Brand & Toggle */}
      <div className={`flex ${isOpen ? "flex-row justify-between" : "flex-col items-center"} gap-2.5 mb-3 px-2 pt-4 max-md:hidden`}>
        <Link href="/dashboard" className="flex items-center gap-3 text-white">
          {logo ? (
            <img 
              src={logo} 
              alt="Logo" 
              className="w-[42px] h-[42px] rounded-[14px] object-cover shrink-0" 
            />
          ) : (
            <span className="w-[42px] h-[42px] rounded-[14px] bg-[var(--saffron)] grid place-items-center font-extrabold text-[var(--navy)] shrink-0 text-[13px]">
              PO
            </span>
          )}
          {isOpen && (
            <span className="leading-tight whitespace-nowrap">
              <b className="block text-[17px] font-extrabold">PayOrbit</b>
              <small className="text-[#8da0c0] text-[12px]">Admin console</small>
            </span>
          )}
        </Link>
        <button onClick={toggle} className="w-8 h-8 rounded-[10px] grid place-items-center text-[#8da0c0] bg-white/5 hover:text-white hover:bg-white/10" aria-label="Toggle sidebar">
          <svg className={`w-[18px] h-[18px] transition-transform ${isOpen ? "" : "rotate-180"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS.chev} />
          </svg>
        </button>
      </div>

      {/* Navigation Items */}
      <div className={`flex ${isOpen ? "flex-col items-stretch" : "flex-col items-center"} gap-1 max-md:flex-row max-md:justify-around max-md:w-full max-md:gap-0`}>
        {GROUPS.map((group) => (
          <div key={group.name} className="contents">
            <span className={`text-[12px] font-bold text-[#6f84a6] mx-3.5 mt-4 mb-1.5 ${isOpen ? "block" : "hidden"} max-md:hidden`}>
              {group.name}
            </span>
            {group.items.map(([id, label, href]) => {
              const active = pathname === href;
              const badge = counts[id];
              return (
                <Link
                  key={id}
                  href={href}
                  className={`relative flex items-center gap-3.5 rounded-[14px] font-semibold text-[15px] whitespace-nowrap transition-colors 
                    ${isOpen ? "md:w-full md:justify-start md:px-3.5" : "md:w-[46px] md:justify-center"} 
                    w-full justify-center max-md:px-0 max-md:gap-0
                    h-[46px] ${active ? "bg-[var(--navy-2)] text-[var(--saffron)]" : "text-[#8da0c0] hover:bg-[var(--navy-2)] hover:text-white"}`}
                  title={label}
                >
                  {active && isOpen && (
                    <span className="absolute -left-3 top-3 bottom-3 w-1 rounded-r bg-[var(--saffron)] max-md:hidden" />
                  )}
                  {ico(ICONS[id as keyof typeof ICONS])}
                  {isOpen && <span className="max-md:hidden">{label}</span>}
                  {badge ? (
                    <span className={`min-w-[17px] h-[17px] rounded-full bg-[var(--saffron)] text-[var(--navy)] text-[10.5px] font-extrabold grid place-items-center px-1 ${isOpen ? "ml-auto" : "absolute top-1 right-1"} max-md:hidden`}>
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer (Profile & Logout) - Hidden on Mobile */}
      <div className={`mt-auto flex ${isOpen ? "flex-row justify-between bg-[var(--navy-2)] rounded-2xl p-2.5" : "flex-col items-center"} gap-2 max-md:hidden`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#ffb347] to-[var(--saffron)] text-[var(--navy)] grid place-items-center font-extrabold shrink-0">
            H
          </span>
          {isOpen && (
            <span className="leading-tight whitespace-nowrap text-white">
              <b>Admin</b>
              <small className="block text-[#8da0c0] text-[12px]">Owner</small>
            </span>
          )}
        </div>
        <button onClick={handleLogout} className="w-[38px] h-[38px] rounded-xl grid place-items-center text-[#8da0c0] hover:bg-white/10 hover:text-white" aria-label="Log out">
          {ico(ICONS.out)}
        </button>
      </div>
    </nav>
  );
}