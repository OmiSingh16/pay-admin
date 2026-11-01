"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { reviewUpi, bulkApproveUpi, toggleUpiStatus } from "@/actions/upi";
import { Search, RefreshCw, Check, X, Clock, Zap, Copy } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type UpiRequest = {
  id: number;
  userId: number;
  upiId: string;
  enabled: boolean;
  status: "pending" | "approved" | "rejected";
  risk: "low" | "medium" | "high";
  riskNote: string;
  createdAt: number;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const BANKS: Record<string, string> = { mbk: "MobiKwik", ybl: "PhonePe", ibl: "PhonePe", okhdfcbank: "Google Pay", oksbi: "Google Pay", paytm: "Paytm" };
const getBankName = (upi: string) => BANKS[upi.split("@")[1]] || "UPI";

export function UpiDesk({ initialRequests }: { initialRequests: UpiRequest[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [query, setQuery] = useState("");
  
  const timers = useRef<Record<number, NodeJS.Timeout>>({});

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
    }, 5000);

    ids.forEach(id => { timers.current[id] = timerId; });

    toast(`${ids.length > 1 ? ids.length + " requests" : "#" + ids[0]} ${action}`, () => {
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
      setRequests(prev);
    }, 5000);
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    setRequests(reqs => reqs.map(r => r.id === id ? { ...r, enabled } : r));
    await toggleUpiStatus({ id, enabled });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 md:p-6 grid gap-4 md:gap-6 content-start">
      
      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
          Risk check repairs <span className="bg-[var(--navy)] text-white px-3 py-1 rounded-full text-lg">{visible.length}</span>
        </h1>
        <button onClick={() => router.refresh()} className="flex items-center gap-2 bg-[var(--panel)] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[var(--line)]">
          <RefreshCw className="w-4 h-4" /> <span className="hidden md:inline">Refresh</span>
        </button>
      </header>

      {/* Filter Bar */}
      <div className="bg-[var(--panel)] rounded-[var(--r)] p-4 grid gap-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${filter === f ? "bg-[var(--navy)] text-white" : "bg-[var(--panel-2)] text-[var(--ink-2)]"}`}
            >
              {cap(f)} <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === f ? "bg-[var(--saffron)] text-[var(--navy)]" : "bg-white"}`}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <label className="flex items-center gap-2 bg-[var(--panel-2)] rounded-xl px-3 border-2 border-transparent focus-within:border-[var(--saffron)] flex-1">
            <Search className="w-4 h-4 text-[var(--ink-2)]" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search user ID or UPI" className="flex-1 bg-transparent py-2.5 outline-none text-sm" />
            {query && <button onClick={() => setQuery("")} className="p-1 rounded-full bg-[var(--line)]"><X className="w-3 h-3" /></button>}
          </label>
          {lowPending.length > 0 && (
            <button onClick={() => handleReview(lowPending.map(r => r.id), "approved")} className="bg-[var(--navy)] text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Approve {lowPending.length} low-risk
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-3">
        {visible.length === 0 ? (
          <div className="bg-[var(--panel)] rounded-[var(--r)] p-10 text-center text-[var(--ink-2)]">
            <b className="block text-lg text-[var(--ink)] mb-1">No UPI requests here</b>
            Try another filter or clear the search.
          </div>
        ) : visible.map(r => {
          const isPending = r.status === "pending";
          const tileColor = r.status === "pending" ? "bg-gradient-to-br from-[#ffcf44] to-[#ff9a1f]" : r.status === "approved" ? "bg-gradient-to-br from-[#34c47c] to-[#0f9d58]" : "bg-gradient-to-br from-[#ff7a7a] to-[#d93a3a]";
          
          return (
            <article key={r.id} className="bg-[var(--panel)] rounded-[var(--r)] p-4 md:p-5 grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] gap-3 md:gap-4 items-center border-2 border-transparent hover:border-[var(--line)] transition-colors">
              
              {/* Status Tile */}
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl grid place-items-center text-white ${tileColor}`}>
                {r.status === "pending" ? <Clock className="w-7 h-7" /> : r.status === "approved" ? <Check className="w-7 h-7" /> : <X className="w-7 h-7" />}
              </div>

              {/* Info */}
              <div className="grid gap-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-extrabold">#{r.id}</span>
                  <span className="text-sm font-semibold text-[var(--ink-2)]">User {r.userId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${r.status === "pending" ? "bg-[var(--saffron-soft)] text-[var(--warn)]" : r.status === "approved" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--bad-soft)] text-[var(--bad)]"}`}>
                    {cap(r.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-2)] min-w-0">
                  <span className="truncate">{r.upiId}</span>
                  <span className="bg-[var(--panel-2)] px-2 py-0.5 rounded text-xs font-bold text-[var(--ink)] shrink-0">{getBankName(r.upiId)}</span>
                  <button onClick={() => { navigator.clipboard.writeText(r.upiId); toast("UPI copied"); }} className="p-1 rounded hover:bg-[var(--panel-2)] shrink-0"><Copy className="w-3 h-3" /></button>
                </div>
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <button 
                    onClick={() => handleToggle(r.id, !r.enabled)}
                    className={`flex items-center gap-1.5 font-bold ${r.enabled ? "text-[var(--ok)]" : "text-[var(--ink-2)]"}`}
                  >
                    <span className={`w-8 h-4 rounded-full relative transition-colors ${r.enabled ? "bg-[var(--ok)]" : "bg-[var(--ink-2)]"}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${r.enabled ? "left-4" : "left-0.5"}`} />
                    </span>
                    {r.enabled ? "Enabled" : "Disabled"}
                  </button>
                  <span className="text-[var(--ink-2)]">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${r.risk === "low" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : r.risk === "medium" ? "bg-[var(--saffron-soft)] text-[var(--warn)]" : "bg-[var(--bad-soft)] text-[var(--bad)]"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {r.risk === "low" ? "Low" : r.risk === "medium" ? "Medium" : "High"} risk
                  </span>
                  <span className="text-[var(--ink-2)] hidden md:inline">{r.riskNote}</span>
                </div>
              </div>

              {/* Actions */}
              {isPending ? (
                <div className="col-span-2 md:col-span-1 flex md:flex-col gap-2 mt-2 md:mt-0">
                  <button onClick={() => handleReview([r.id], "approved")} className="flex-1 md:w-12 md:h-12 rounded-xl grid place-items-center bg-[var(--ok-soft)] text-[var(--ok)] hover:bg-[var(--ok)] hover:text-white transition-colors"><Check className="w-5 h-5" /></button>
                  <button onClick={() => handleReview([r.id], "rejected")} className="flex-1 md:w-12 md:h-12 rounded-xl grid place-items-center bg-[var(--bad-soft)] text-[var(--bad)] hover:bg-[var(--bad)] hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
              ) : (
                <div className="col-span-2 md:col-span-1 text-center md:text-right text-xs text-[var(--ink-2)]">Reviewed</div>
              )}

            </article>
          );
        })}
      </div>
    </div>
  );
}