"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { reviewUpi, bulkApproveUpi, toggleUpiStatus } from "@/actions/upi";
import { Search, RefreshCw, Check, X, Zap, Copy, Landmark, Wallet, Shield } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type UpiRequest = {
  id: number;
  userId: number;
  upiId: string;
  enabled: boolean;
  status: "pending" | "approved" | "rejected";
  risk: "low" | "medium" | "high";
  createdAt: number;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const BANKS: Record<string, string> = { 
  mbk: "MobiKwik", ybl: "PhonePe", ibl: "PhonePe", axl: "PhonePe",
  okhdfcbank: "Google Pay", oksbi: "Google Pay", okaxis: "Google Pay",
  paytm: "Paytm", ptaxis: "Paytm", ptyes: "Paytm", ptsbi: "Paytm",
  apl: "Amazon Pay", jupiteraxis: "Jupiter"
};

const getBankName = (upi: string) => BANKS[upi.split("@")[1]] || "UPI";

// Bank ke hisaab se color (premium touch)
const getBankColor = (upi: string) => {
  const handle = upi.split("@")[1];
  if (["ybl", "ibl", "axl"].includes(handle)) return "bg-purple-100 text-purple-700"; // PhonePe
  if (["okhdfcbank", "oksbi", "okaxis"].includes(handle)) return "bg-blue-100 text-blue-700"; // GPay
  if (["paytm", "ptaxis", "ptyes", "ptsbi"].includes(handle)) return "bg-sky-100 text-sky-700"; // Paytm
  if (["mbk", "mbkns", "ikwik"].includes(handle)) return "bg-red-100 text-red-700"; // MobiKwik
  return "bg-gray-100 text-gray-700";
};

export function UpiDesk({ initialRequests }: { initialRequests: UpiRequest[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [query, setQuery] = useState("");
  
  const timers = useRef<Record<number, NodeJS.Timeout>>({});

  // Server se naya data aane pe local state sync karo
  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const visible = requests.filter(r => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesQuery = !query.trim() || String(r.userId).includes(query) || r.upiId.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const lowPending = requests.filter(r => r.status === "pending" && r.risk === "low");
  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  const handleReview = (ids: number[], action: "approved" | "rejected") => {
    const prev = [...requests];
    setRequests(reqs => reqs.map(r => ids.includes(r.id) ? { ...r, status: action } : r));

    const timerId = setTimeout(async () => {
      if (ids.length === 1) await reviewUpi({ id: ids[0], action });
      else if (action === "approved") await bulkApproveUpi(ids);
      
      ids.forEach(id => delete timers.current[id]);
      router.refresh();
    }, 3000);

    ids.forEach(id => { timers.current[id] = timerId; });

    toast(`${ids.length > 1 ? ids.length + " requests" : "Request"} ${action}`, () => {
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
      setRequests(prev);
    }, 3000);
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    setRequests(reqs => reqs.map(r => r.id === id ? { ...r, enabled } : r));
    await toggleUpiStatus({ id, enabled });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 md:p-6 grid gap-4 md:gap-6 content-start">
      
      {/* Premium Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 text-[var(--ink)]">
            Risk check repairs 
            <span className="bg-gradient-to-r from-[var(--navy)] to-[var(--navy-2)] text-white px-4 py-1 rounded-full text-lg shadow-lg">
              {visible.length}
            </span>
          </h1>
          <p className="text-sm text-[var(--ink-2)] mt-1">Review and manage UPI requests</p>
        </div>
        <button 
          onClick={() => { router.refresh(); toast("Refreshed"); }} 
          className="flex items-center gap-2 bg-[var(--panel)] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[var(--line)] transition-all shadow-sm hover:shadow-md"
        >
          <RefreshCw className="w-4 h-4" /> <span className="hidden md:inline">Refresh</span>
        </button>
      </header>

      {/* Premium Filter Bar */}
      <div className="bg-[var(--panel)] rounded-[var(--r)] p-4 grid gap-4 shadow-sm border border-[var(--line)]/50">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                filter === f 
                  ? "bg-gradient-to-r from-[var(--navy)] to-[var(--navy-2)] text-white shadow-lg shadow-[var(--navy)]/20" 
                  : "bg-[var(--panel-2)] text-[var(--ink-2)] hover:bg-[var(--line)]"
              }`}
            >
              {cap(f)} 
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${filter === f ? "bg-[var(--saffron)] text-[var(--navy)]" : "bg-white"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <label className="flex items-center gap-2 bg-[var(--panel-2)] rounded-xl px-3 border-2 border-transparent focus-within:border-[var(--saffron)] flex-1 transition-colors">
            <Search className="w-4 h-4 text-[var(--ink-2)]" />
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Search user ID or UPI" 
              className="flex-1 bg-transparent py-2.5 outline-none focus:outline-none focus:ring-0 text-sm" 
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-1 rounded-full bg-[var(--line)] hover:bg-[var(--ink-2)]/20">
                <X className="w-3 h-3" />
              </button>
            )}
          </label>
          {lowPending.length > 0 && (
            <button 
              onClick={() => handleReview(lowPending.map(r => r.id), "approved")} 
              className="bg-gradient-to-r from-[var(--navy)] to-[var(--navy-2)] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[var(--navy)]/20 hover:shadow-xl transition-all"
            >
              <Zap className="w-4 h-4" /> Approve {lowPending.length} low-risk
            </button>
          )}
        </div>
      </div>

      {/* Premium Cards */}
      <div className="grid gap-3">
        {visible.length === 0 ? (
          <div className="bg-[var(--panel)] rounded-[var(--r)] p-12 text-center border-2 border-dashed border-[var(--line)]">
            <div className="w-16 h-16 rounded-full bg-[var(--panel-2)] grid place-items-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-[var(--ink-2)]" />
            </div>
            <b className="block text-lg text-[var(--ink)] mb-1">No UPI requests here</b>
            <p className="text-[var(--ink-2)] text-sm">Try another filter or clear the search.</p>
          </div>
        ) : visible.map(r => {
          const isPending = r.status === "pending";
          const tileColor = r.status === "pending" 
            ? "bg-gradient-to-br from-[#ffcf44] to-[#ff9a1f] shadow-lg shadow-yellow-500/30" 
            : r.status === "approved" 
            ? "bg-gradient-to-br from-[#34c47c] to-[#0f9d58] shadow-lg shadow-green-500/30" 
            : "bg-gradient-to-br from-[#ff7a7a] to-[#d93a3a] shadow-lg shadow-red-500/30";
          
          return (
            <article 
              key={r.id} 
              className="bg-[var(--panel)] rounded-[var(--r)] p-4 md:p-5 grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-3 md:gap-4 items-start border-2 border-[var(--line)]/30 hover:border-[var(--saffron)]/50 transition-all duration-300 hover:shadow-lg group"
            >
              
              {/* Status Tile */}
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl grid place-items-center text-white shrink-0 ${tileColor} transition-transform group-hover:scale-105 mt-1`}>
                <Landmark className="w-7 h-7" />
              </div>

              {/* Info (Structured) */}
              <div className="grid gap-3 min-w-0">
                
                {/* Row 1: User, Status, Risk (ID hataya) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[var(--ink-2)] bg-[var(--panel-2)] px-2 py-0.5 rounded-md">
                    User {r.userId}
                  </span>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    r.status === "pending" ? "bg-[var(--saffron-soft)] text-[var(--warn)]" 
                    : r.status === "approved" ? "bg-[var(--ok-soft)] text-[var(--ok)]" 
                    : "bg-[var(--bad-soft)] text-[var(--bad)]"
                  }`}>
                    {cap(r.status)}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                    r.risk === "low" ? "bg-[var(--ok-soft)] text-[var(--ok)]" 
                    : r.risk === "medium" ? "bg-[var(--saffron-soft)] text-[var(--warn)]" 
                    : "bg-[var(--bad-soft)] text-[var(--bad)]"
                  }`}>
                    <Shield className="w-3 h-3" />
                    {r.risk === "low" ? "Low" : r.risk === "medium" ? "Medium" : "High"} risk
                  </span>
                </div>

                {/* Row 2: UPI ID + Bank + Copy */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[var(--ink)] font-mono truncate">{r.upiId}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getBankColor(r.upiId)}`}>
                    {getBankName(r.upiId)}
                  </span>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(r.upiId); toast("UPI copied"); }} 
                    className="p-1 rounded-lg hover:bg-[var(--panel-2)] transition-colors shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                  </button>
                </div>

                {/* Row 3: Enabled, Date (riskNote hataya) */}
                <div className="flex items-center gap-3 text-xs text-[var(--ink-2)] flex-wrap">
                  <button 
                    onClick={() => handleToggle(r.id, !r.enabled)}
                    className={`flex items-center gap-1.5 font-bold transition-colors ${r.enabled ? "text-[var(--ok)]" : "text-[var(--ink-2)]"}`}
                  >
                    <span className={`w-8 h-4 rounded-full relative transition-colors ${r.enabled ? "bg-[var(--ok)]" : "bg-[var(--ink-2)]"}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${r.enabled ? "left-4" : "left-0.5"}`} />
                    </span>
                    {r.enabled ? "Enabled" : "Disabled"}
                  </button>
                  <span className="w-1 h-1 rounded-full bg-[var(--ink-2)]" />
                  <span>{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                </div>
              </div>

              {/* Actions */}
              {isPending ? (
                <div className="col-span-2 md:col-span-1 flex md:flex-col gap-2 mt-2 md:mt-1">
                  <button 
                    onClick={() => handleReview([r.id], "approved")} 
                    className="flex-1 md:w-12 md:h-12 rounded-xl grid place-items-center bg-[var(--ok-soft)] text-[var(--ok)] hover:bg-[var(--ok)] hover:text-white transition-all hover:scale-105 shadow-sm"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleReview([r.id], "rejected")} 
                    className="flex-1 md:w-12 md:h-12 rounded-xl grid place-items-center bg-[var(--bad-soft)] text-[var(--bad)] hover:bg-[var(--bad)] hover:text-white transition-all hover:scale-105 shadow-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="col-span-2 md:col-span-1 text-center md:text-right text-xs font-bold text-[var(--ink-2)] bg-[var(--panel-2)] px-3 py-1.5 rounded-lg md:mt-1">
                  Reviewed
                </div>
              )}

            </article>
          );
        })}
      </div>
    </div>
  );
}