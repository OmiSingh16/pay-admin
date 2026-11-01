"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { reviewWithdraw } from "@/actions/orders";
import { Search, RefreshCw, Copy, ExternalLink } from "lucide-react";
import { Ticket } from "@/components/ui/Ticket";
import { useToast } from "@/components/ui/Toast";

type WithdrawOrder = {
  id: number;
  userId: number;
  price: number;
  tokens: number;
  upiId: string;
  status: "pending" | "approved" | "rejected";
  date: number;
  paidConfirmedAt: number | null;
  formattedDate: string; // Add kiya
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const BANKS: Record<string, string> = {
  mbk: "MobiKwik",
  ybl: "PhonePe",
  ibl: "PhonePe",
  okhdfcbank: "Google Pay",
  oksbi: "Google Pay",
  paytm: "Paytm",
};

const getBankName = (upi: string) => BANKS[upi.split("@")[1]] || "UPI";

// Sparkline Component
function Sparkline({ orders }: { orders: WithdrawOrder[] }) {
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

function WithdrawTicket({
  order,
  onReview,
  paid,
  togglePaid,
}: {
  order: WithdrawOrder;
  onReview: (a: "approved" | "rejected") => void;
  paid: boolean;
  togglePaid: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const bankName = getBankName(order.upiId);
  const upiLink = `upi://pay?pa=${encodeURIComponent(order.upiId)}&am=${order.price}&cu=INR&tn=Withdraw%20${order.id}`;
  const isPending = order.status === "pending";

  return (
    <Ticket
      header={
        <>
          <div className="flex justify-between items-center">
            <span className="text-[var(--ink-2)] text-sm">Withdrawal #{order.id}</span>
            <span className={`px-3 py-1 rounded-lg border-2 border-current font-extrabold rotate-[-6deg] ${order.status === "pending" ? "text-[var(--warn)]" : order.status === "approved" ? "text-[var(--ok)]" : "text-[var(--bad)]"}`}>
              {cap(order.status)}
            </span>
          </div>
          <div className="text-6xl font-extrabold tracking-tighter mt-4 mb-1">{inr(order.price)}</div>
          <div className="text-sm text-[var(--ink-2)]">{order.tokens} tokens leave the user's wallet</div>
          <dl className="grid grid-cols-[auto_1fr] gap-3 mt-5 text-sm">
            <dt className="text-[var(--ink-2)]">Pay to</dt>
            <dd className="font-bold text-right flex justify-end items-center gap-2 break-all">
              {order.upiId}
              <button 
                onClick={() => { navigator.clipboard.writeText(order.upiId); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
                className="p-1 rounded bg-[var(--panel-2)] hover:bg-[var(--line)] shrink-0"
              >
                {copied ? <span className="text-[var(--ok)] text-[10px] font-bold">Copied</span> : <Copy className="w-3 h-3" />}
              </button>
            </dd>
            <dt className="text-[var(--ink-2)]">Bank app</dt>
            <dd className="font-bold text-right">{bankName}</dd>
            <dt className="text-[var(--ink-2)]">User ID</dt>
            <dd className="font-bold text-right">{order.userId}</dd>
            <dt className="text-[var(--ink-2)]">Placed</dt>
            <dd className="font-bold text-right">{order.formattedDate}</dd>
          </dl>
        </>
      }
      footer={
        <>
          {isPending && (
            <div className="grid gap-3 mb-5">
              <a 
                href={upiLink}
                className="block text-center bg-[var(--navy)] text-white py-3 rounded-xl font-extrabold no-underline flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Open in UPI app
              </a>
              <button 
                onClick={togglePaid}
                className={`flex items-center gap-3 p-3 rounded-xl bg-[var(--panel-2)] font-bold text-left transition-colors ${paid ? "!bg-[var(--ok-soft)] !text-[var(--ok)]" : ""}`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${paid ? "bg-[var(--ok)] border-[var(--ok)] text-white" : "border-[var(--ink-2)]"}`}>
                  {paid && "✓"}
                </div>
                Payment sent to this UPI
              </button>
              <span className="text-xs text-[var(--ink-2)]">Tick this after paying to unlock Approve.</span>
            </div>
          )}

          <div className="grid gap-3 mb-5">
            <div className="flex items-center gap-3 text-sm"><div className="w-3 h-3 rounded-full bg-[var(--ok)]" />Withdrawal requested</div>
            <div className="flex items-center gap-3 text-sm"><div className="w-3 h-3 rounded-full bg-[var(--ok)]" />UPI ID submitted</div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full ${order.status === "pending" ? (paid ? "bg-[var(--ok)]" : "bg-[var(--saffron)]") : order.status === "approved" ? "bg-[var(--ok)]" : "bg-[var(--bad)]"}`} />
              {order.status === "pending" 
                ? (paid ? "Payment sent, ready to approve" : "Waiting for your payout") 
                : order.status === "approved" ? "Approved, payout done" : "Rejected, tokens returned"}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1.6fr] gap-2.5">
            <button onClick={() => onReview("rejected")} disabled={!isPending} className="py-3.5 rounded-xl font-extrabold text-base bg-[var(--bad-soft)] text-[var(--bad)] disabled:opacity-40">Reject <kbd className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded ml-1">R</kbd></button>
            <button onClick={() => onReview("approved")} disabled={!isPending || !paid} className="py-3.5 rounded-xl font-extrabold text-base bg-[var(--ok)] text-white disabled:opacity-40">Approve <kbd className="text-[10px] bg-black/10 px-1.5 py-0.5 rounded ml-1">A</kbd></button>
          </div>
        </>
      }
    />
  );
}

export function WithdrawDesk({ initialOrders }: { initialOrders: WithdrawOrder[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(initialOrders[0]?.id || null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [paidMap, setPaidMap] = useState<Record<number, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const timers = useRef<Record<number, NodeJS.Timeout>>({});
  const lockRef = useRef<Set<number>>(new Set());

  // Swipe state
  const touchStart = useRef(0);
  const touchId = useRef<number | null>(null);

  const visibleOrders = orders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const matchesQuery = !query.trim() || String(o.id).includes(query) || o.upiId.includes(query) || String(o.price).includes(query);
    return matchesFilter && matchesQuery;
  });

  const selected = orders.find((o) => o.id === selectedId);
  const pendingAmount = orders.filter(o => o.status === "pending").reduce((t, o) => t + o.price, 0);

  const togglePaid = (id: number) => {
    setPaidMap((p) => ({ ...p, [id]: !p[id] }));
  };

  const handleReview = (id: number, action: "approved" | "rejected") => {
    if (lockRef.current.has(id)) return;
    const order = orders.find(o => o.id === id);
    if (!order || order.status !== "pending") return;

    if (action === "approved" && !paidMap[id]) {
      toast("Send the payment, then tick 'Payment sent'");
      return;
    }

    lockRef.current.add(id);
    const prevOrders = [...orders];
    const nextOrders = orders.map((o) => o.id === id ? { ...o, status: action } : o);
    setOrders(nextOrders);
    setIsMobileSheetOpen(false);

    const nextPending = nextOrders.find((o) => o.status === "pending");
    if (selectedId === id) setSelectedId(nextPending?.id || id);

    const timerId = setTimeout(async () => {
      delete timers.current[id];
      lockRef.current.delete(id);
      
      const res = await reviewWithdraw({ id, action });
      if (res.error) {
        toast(res.error);
        setOrders(prevOrders);
      } else {
        router.refresh();
      }
    }, 5000);

    timers.current[id] = timerId;

    toast(`#${id} ${action}`, () => {
      if (timers.current[id]) {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
      }
      lockRef.current.delete(id);
      setOrders(prevOrders);
      setSelectedId(id);
    }, 5000);
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
      else if (k === "escape") setIsMobileSheetOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visibleOrders, selectedId, paidMap]);

  useEffect(() => {
    return () => Object.values(timers.current).forEach(clearTimeout);
  }, []);

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent, id: number) => {
    touchStart.current = e.touches[0].clientX;
    touchId.current = id;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchId.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 90) {
      handleReview(touchId.current, dx > 0 ? "approved" : "rejected");
    }
    touchId.current = null;
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)] p-4 gap-4">
      {/* Top Pulse Strip with Sparkline */}
      <header className="bg-[var(--navy)] text-white rounded-[var(--r)] p-4 flex justify-between items-center shrink-0">
        <div>
          <small className="text-[#8da0c0]">Waiting to be paid out</small>
          <div className="text-3xl font-extrabold">{inr(pendingAmount)}</div>
        </div>
        <div className="hidden md:block flex-1 px-8">
          <Sparkline orders={orders} />
          <small className="text-[#8da0c0] block mt-1">Withdrawals in the last 24 hours</small>
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
            <h2 className="text-lg font-extrabold whitespace-nowrap">Withdrawal Orders</h2>
            <label className="flex items-center gap-2 bg-[var(--panel-2)] rounded-xl px-3 border-2 border-transparent focus-within:border-[var(--saffron)] flex-1 max-w-md">
              <Search className="w-4 h-4 text-[var(--ink-2)]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order ID, UPI or amount" className="flex-1 bg-transparent py-2 outline-none text-sm" />
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

        {/* DESKTOP TABLE */}
        <div className="hidden md:block flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--panel-2)] text-[var(--ink-2)] text-xs uppercase sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-bold">Order ID</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">UPI ID</th>
                <th className="px-6 py-4 font-bold">Bank</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {visibleOrders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-[var(--ink-2)]">No withdrawals match this filter.</td></tr>
              ) : (
                visibleOrders.map((o) => {
                  const paid = !!paidMap[o.id];
                  return (
                    <tr key={o.id} className="hover:bg-[var(--panel-2)] transition-colors">
                      <td className="px-6 py-4 font-bold">#{o.id}</td>
                      <td className="px-6 py-4 font-extrabold text-lg">{inr(o.price)}</td>
                      <td className="px-6 py-4 text-[var(--ink-2)] font-mono text-sm">{o.upiId}</td>
                      <td className="px-6 py-4 text-[var(--ink-2)]">{getBankName(o.upiId)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${o.status === "pending" ? "bg-[var(--warn-soft)] text-[var(--warn)]" : o.status === "approved" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--bad-soft)] text-[var(--bad)]"}`}>
                          {cap(o.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {o.status === "pending" ? (
                          <div className="flex justify-end gap-2 items-center">
                            <button onClick={() => togglePaid(o.id)} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold ${paid ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--panel-2)] text-[var(--ink-2)]"}`}>
                              <div className={`w-3 h-3 rounded-sm border ${paid ? "bg-[var(--ok)] border-[var(--ok)]" : "border-current"}`} />
                              Paid
                            </button>
                            <button onClick={() => handleReview(o.id, "rejected")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--bad-soft)] text-[var(--bad)] hover:bg-[var(--bad)] hover:text-white transition-colors">Reject</button>
                            <button onClick={() => handleReview(o.id, "approved")} disabled={!paid} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--ok)] text-white hover:bg-[#0b8a4c] disabled:opacity-40 transition-colors">Approve</button>
                          </div>
                        ) : (
                          <div className="text-right text-xs text-[var(--ink-2)]">Reviewed</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE LIST WITH SWIPE */}
        <div className="md:hidden flex-1 overflow-y-auto p-2">
          {visibleOrders.length === 0 ? (
            <div className="text-center p-8 text-[var(--ink-2)] text-sm">No withdrawals match this filter.</div>
          ) : (
            visibleOrders.map((o) => (
              <button
                key={o.id}
                onClick={() => { setSelectedId(o.id); setIsMobileSheetOpen(true); }}
                onTouchStart={(e) => onTouchStart(e, o.id)}
                onTouchEnd={onTouchEnd}
                className={`w-full text-left p-3 rounded-xl mb-1.5 border-2 transition-all ${selectedId === o.id ? "border-[var(--saffron)] bg-[var(--saffron-soft)]" : "border-transparent bg-[var(--panel)] hover:bg-[var(--panel-2)]"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <b className="text-lg font-extrabold">{inr(o.price)}</b>
                    <div className="text-xs text-[var(--ink-2)] mt-0.5">#{o.id} · {o.upiId.slice(0, 12)}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${o.status === "pending" ? "bg-[var(--warn-soft)] text-[var(--warn)]" : o.status === "approved" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--bad-soft)] text-[var(--bad)]"}`}>
                      {cap(o.status)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* MOBILE BOTTOM SHEET */}
        {selected && isMobileSheetOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center" onClick={() => setIsMobileSheetOpen(false)}>
            <div className="w-full bg-[var(--panel)] rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
               <div className="w-12 h-1.5 bg-[var(--line)] rounded-full mx-auto mb-5" />
               <WithdrawTicket 
                 order={selected} 
                 onReview={(a) => handleReview(selected.id, a)} 
                 paid={!!paidMap[selected.id]} 
                 togglePaid={() => togglePaid(selected.id)} 
               />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}