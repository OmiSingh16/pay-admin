"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { reviewDeposit } from "@/actions/orders";
import { Search, RefreshCw, Copy } from "lucide-react";
import { Ticket } from "@/components/ui/Ticket";
import { useToast } from "@/components/ui/Toast";

type Order = {
  id: number;
  userId: number;
  price: number;
  tokens: number;
  utr: string;
  status: "pending" | "approved" | "rejected";
  date: number;
  formattedDate: string;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Sparkline({ orders }: { orders: Order[] }) {
  const B = 12, now = Date.now(), b = Array(B).fill(0);
  orders.forEach(o => {
    const i = Math.floor((now - o.date) / 72e5);
    if (i >= 0 && i < B) b[B - 1 - i] += o.price;
  });
  const max = Math.max(...b, 1);
  const pts = b.map((v, i) => `${(i / (B - 1)) * 300},${58 - (v / max) * 50}`);
  
  return (
    <svg className="w-full h-16" viewBox="0 0 300 64" preserveAspectRatio="none">
      <polygon points={`0,64 ${pts.join(" ")} 300,64`} fill="#ff8a0030" />
      <polyline points={pts.join(" ")} fill="none" stroke="#ff8a00" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function TicketContent({ order, onReview }: { order: Order; onReview: (a: "approved" | "rejected") => void }) {
  const [copied, setCopied] = useState(false);
  const pend = order.status === "pending";
  
  return (
    <Ticket
      header={
        <>
          <div className="flex justify-between items-center">
            <span className="text-[var(--ink-2)] text-sm">Deposit </span>
            <span className={`px-3 py-1 rounded-lg border-2 border-current font-extrabold rotate-[-6deg] ${order.status === "pending" ? "text-[var(--warn)]" : order.status === "approved" ? "text-[var(--ok)]" : "text-[var(--bad)]"}`}>
              {cap(order.status)}
            </span>
          </div>
          <div className="text-6xl font-extrabold tracking-tighter mt-4 mb-1">{inr(order.price)}</div>
          <div className="text-sm text-[var(--ink-2)]">{order.tokens} tokens to credit</div>
          <dl className="grid grid-cols-[auto_1fr] gap-3 mt-5 text-sm">
            <dt className="text-[var(--ink-2)]">UTR</dt>
            <dd className="font-bold text-right flex justify-end items-center gap-2">
              {order.utr}
              <button onClick={() => { navigator.clipboard.writeText(order.utr); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1 rounded bg-[var(--panel-2)] hover:bg-[var(--line)]">
                {copied ? <span className="text-[var(--ok)] text-[10px] font-bold">Copied</span> : <Copy className="w-3 h-3" />}
              </button>
            </dd>
            <dt className="text-[var(--ink-2)]">User ID</dt>
            <dd className="font-bold text-right">{order.userId}</dd>
            <dt className="text-[var(--ink-2)]">Placed</dt>
            <dd className="font-bold text-right">{order.formattedDate}</dd>
          </dl>
        </>
      }
      footer={
        <>
          <div className="grid gap-3 mb-5">
            <div className="flex items-center gap-3 text-sm"><div className="w-3 h-3 rounded-full bg-[var(--ok)]" />Order placed</div>
            <div className="flex items-center gap-3 text-sm"><div className="w-3 h-3 rounded-full bg-[var(--ok)]" />UTR submitted by user</div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full ${pend ? "bg-[var(--saffron)]" : order.status === "approved" ? "bg-[var(--ok)]" : "bg-[var(--bad)]"}`} />
              {pend ? "Waiting for your decision" : order.status === "approved" ? "Approved, tokens credited" : "Rejected"}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1.6fr] gap-2.5">
            <button onClick={() => onReview("rejected")} disabled={!pend} className="py-3.5 rounded-xl font-extrabold text-base bg-[var(--bad-soft)] text-[var(--bad)] disabled:opacity-40">Reject <kbd className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded ml-1">R</kbd></button>
            <button onClick={() => onReview("approved")} disabled={!pend} className="py-3.5 rounded-xl font-extrabold text-base bg-[var(--ok)] text-white disabled:opacity-40">Approve <kbd className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded ml-1">A</kbd></button>
          </div>
        </>
      }
    />
  );
}

export function ReviewDesk({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(initialOrders[0]?.id || null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const timers = useRef<Record<number, NodeJS.Timeout>>({});
  const lockRef = useRef<Set<number>>(new Set());

  const [swipeX, setSwipeX] = useState(0);
  const [swipingId, setSwipingId] = useState<number | null>(null);
  const touchStartX = useRef(0);

  // Sync local state with server data on refresh
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const visibleOrders = orders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const matchesQuery = !query.trim() || 
      String(o.id).includes(query) || 
      String(o.userId).includes(query) ||
      o.utr.includes(query) || 
      String(o.price).includes(query);
    return matchesFilter && matchesQuery;
  });
  const selected = orders.find((o) => o.id === selectedId);
  const pendingAmount = orders.filter(o => o.status === "pending").reduce((t, o) => t + o.price, 0);

  const handleReview = (id: number, action: "approved" | "rejected") => {
    if (lockRef.current.has(id)) return;
    const order = orders.find(o => o.id === id);
    if (!order || order.status !== "pending") return;

    lockRef.current.add(id);
    const prevOrders = [...orders];
    const nextOrders = orders.map((o) => o.id === id ? { ...o, status: action } : o);
    setOrders(nextOrders);
    setIsSheetOpen(false);

    const nextPending = nextOrders.find(o => o.status === "pending");
    if (selectedId === id) setSelectedId(nextPending?.id || id);

    const timerId = setTimeout(async () => {
      delete timers.current[id];
      lockRef.current.delete(id);
      
      const res = await reviewDeposit({ id, action });
      
      if (res.error) {
        if (res.error.includes("already reviewed")) {
          toast("This order was already reviewed. Refreshing...");
          router.refresh(); 
        } else {
          toast(res.error);
          setOrders(prevOrders); 
        }
      } else {
        setTimeout(() => {
          setIsRefreshing(true);
          router.refresh();
          setTimeout(() => setIsRefreshing(false), 800);
        }, 2000); 
      }
    }, 3000);

    timers.current[id] = timerId;

    toast(`#${id} ${action}`, () => {
      if (timers.current[id]) {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
      }
      lockRef.current.delete(id);
      setOrders(prevOrders);
      setSelectedId(id);
    }, 3000);
  };

  const moveSel = (d: number) => {
    if (!visibleOrders.length) return;
    const i = visibleOrders.findIndex(o => o.id === selectedId);
    const n = visibleOrders[Math.max(0, Math.min(visibleOrders.length - 1, i + d))];
    setSelectedId(n.id);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
      const k = e.key.toLowerCase();
      
      if (k === "j" || k === "arrowdown") { e.preventDefault(); moveSel(1); }
      else if (k === "k" || k === "arrowup") { e.preventDefault(); moveSel(-1); }
      else if (k === "a" && selectedId) handleReview(selectedId, "approved");
      else if (k === "r" && selectedId) handleReview(selectedId, "rejected");
      else if (k === "escape") setIsSheetOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visibleOrders, selectedId]);

  useEffect(() => {
    return () => Object.values(timers.current).forEach(clearTimeout);
  }, []);

  const onTouchStart = (e: React.TouchEvent, id: number) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipingId(id);
    setSwipeX(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (swipingId === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    setSwipeX(dx);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (swipingId === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 90) {
      handleReview(swipingId, dx > 0 ? "approved" : "rejected");
    }
    setSwipeX(0);
    setSwipingId(null);
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)] p-4 gap-4">
      <header className="bg-[var(--navy)] text-white rounded-[var(--r)] p-4 flex justify-between items-center shrink-0">
        <div>
          <small className="text-[#8da0c0]">Waiting for your review</small>
          <div className="text-3xl font-extrabold">{inr(pendingAmount)}</div>
        </div>
        <div className="hidden md:block flex-1 px-8">
          <Sparkline orders={orders} />
          <small className="text-[#8da0c0] block mt-1">Deposits in the last 24 hours</small>
        </div>
        <div className="flex gap-6">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <div key={s}>
              <small className="text-[#8da0c0]">{cap(s)}</small>
              <b className="block text-xl">{orders.filter(o => o.status === s).length}</b>
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1 bg-[var(--panel)] rounded-[var(--r)] flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--line)] flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-lg font-extrabold whitespace-nowrap">Deposit Orders</h2>
            <label className="flex items-center gap-2 bg-[var(--panel-2)] rounded-xl px-3 border-2 border-transparent focus-within:border-[var(--saffron)] flex-1 max-w-md">
              <Search className="w-4 h-4 text-[var(--ink-2)]" />
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="User ID, UTR or amount" 
                className="flex-1 bg-transparent py-2 outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 text-sm" 
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${filter === f ? "bg-[var(--navy)] text-white" : "bg-[var(--panel-2)] text-[var(--ink-2)]"}`}>
                  {cap(f)} · {f === "all" ? orders.length : orders.filter(o => o.status === f).length}
                </button>
              ))}
            </div>
            <button onClick={() => { setIsRefreshing(true); router.refresh(); setTimeout(() => setIsRefreshing(false), 800); }} className="p-2 rounded-lg bg-[var(--panel-2)] hover:bg-[var(--line)] shrink-0">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="hidden md:block flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--panel-2)] text-[var(--ink-2)] text-xs uppercase sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Tokens</th>
                <th className="px-6 py-4 font-bold">UTR</th>
                <th className="px-6 py-4 font-bold">User ID</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {visibleOrders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-[var(--ink-2)]">No orders match this filter.</td></tr>
              ) : (
                visibleOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--panel-2)] transition-colors">
                    <td className="px-6 py-4 font-bold">#{o.id}</td>
                    <td className="px-6 py-4 font-extrabold text-lg">{inr(o.price)}</td>
                    <td className="px-6 py-4 text-[var(--ink-2)]">{o.tokens}</td>
                    <td className="px-6 py-4 text-[var(--ink-2)] font-mono text-sm">{o.utr}</td>
                    <td className="px-6 py-4 text-[var(--ink-2)]">{o.userId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${o.status === "pending" ? "bg-[var(--warn-soft)] text-[var(--warn)]" : o.status === "approved" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--bad-soft)] text-[var(--bad)]"}`}>
                        {cap(o.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {o.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleReview(o.id, "rejected")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--bad-soft)] text-[var(--bad)] hover:bg-[var(--bad)] hover:text-white transition-colors">Reject</button>
                          <button onClick={() => handleReview(o.id, "approved")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--ok)] text-white hover:bg-[#0b8a4c] transition-colors">Approve</button>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-[var(--ink-2)]">Reviewed</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden flex-1 overflow-y-auto p-2">
          {visibleOrders.length === 0 ? (
            <div className="text-center p-8 text-[var(--ink-2)] text-sm">No orders match this filter.</div>
          ) : (
            visibleOrders.map((o) => (
              <div
                key={o.id}
                className="relative rounded-xl mb-1.5 overflow-hidden bg-[var(--panel-2)]"
              >
                <div className="absolute inset-0 flex justify-between items-center px-5 font-extrabold text-white bg-gradient-to-r from-[var(--ok)] to-[var(--bad)]">
                  <span>Approve</span>
                  <span>Reject</span>
                </div>

                <button
                  onClick={() => { setSelectedId(o.id); setIsSheetOpen(true); }}
                  onTouchStart={(e) => onTouchStart(e, o.id)}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  style={{
                    transform: swipingId === o.id ? `translateX(${swipeX}px)` : "translateX(0px)",
                    transition: swipingId === o.id ? "none" : "transform 0.2s ease-out",
                  }}
                  className={`relative w-full text-left p-3 rounded-xl border-2 touch-pan-y ${
                    selectedId === o.id
                      ? "border-[var(--saffron)] bg-[var(--saffron-soft)]"
                      : "border-transparent bg-[var(--panel)] hover:bg-[var(--panel-2)]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <b className="text-lg font-extrabold">{inr(o.price)}</b>
                      <div className="text-xs text-[var(--ink-2)] mt-0.5">#{o.id} · {o.formattedDate}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${o.status === "pending" ? "bg-[var(--warn-soft)] text-[var(--warn)]" : o.status === "approved" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--bad-soft)] text-[var(--bad)]"}`}>
                        {cap(o.status)}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            ))
          )}
        </div>

        {selected && isSheetOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" onClick={() => setIsSheetOpen(false)}>
            <div className="w-full bg-[var(--panel)] rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
               <div className="w-12 h-1.5 bg-[var(--line)] rounded-full mx-auto mb-5" />
               <TicketContent order={selected} onReview={(a) => handleReview(selected.id, a)} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}