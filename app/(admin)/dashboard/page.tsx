import { getDashboardData } from "@/lib/queries/dashboard";
import { LineChart } from "@/components/charts/LineChart";
import { StatCard } from "@/components/ui/StatCard";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { LiveFeed } from "@/components/ui/LiveFeed";
import { Heatmap } from "@/components/charts/Heatmap";
import { getTopUsers } from "@/lib/queries/activity";
// import { MobileHeader } from "@/components/layout/MobileHeader";

async function DashboardContent() {
  await connection();
  
  const data = await getDashboardData(14);

  // Hero calculations
  const dep = data.dailySeries.reduce((t, d) => t + d.dep, 0);
  const wd = data.dailySeries.reduce((t, d) => t + d.wd, 0);
  const half = Math.floor(data.dailySeries.length / 2);
  const cur = data.dailySeries.slice(half).reduce((t, d) => t + d.dep, 0);
  const prev = data.dailySeries.slice(0, half).reduce((t, d) => t + d.dep, 0) || 1;
  const pct = ((cur / prev) - 1) * 100;

  const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

  const totalOrders = data.statusCounts.approved + data.statusCounts.pending + data.statusCounts.rejected;
  const topUsers = await getTopUsers();

  return (
    <div className="p-4 md:p-6 grid gap-4 md:gap-6">
            {/* Mobile Header (Client Component) */}
      {/* <MobileHeader /> */}

      {/* Desktop Header (Only for large screens) */}
      <header className="hidden md:flex justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Good evening, Admin</h1>
          <p className="text-[var(--ink-2)] text-[13px] mt-1">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <span className="inline-flex gap-2 items-center bg-[var(--panel)] px-3.5 py-2 rounded-full font-bold text-[13px]">
          <i className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse" />
          Live
        </span>
      </header>

      {/* Mobile Greeting Card (Only for small screens) */}
      <div className="md:hidden bg-gradient-to-br from-[var(--navy)] to-[var(--navy-2)] p-5 rounded-[var(--r)] text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[var(--saffron)] text-sm font-bold mb-1">Welcome back,</p>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Admin</h1>
          <p className="text-[#8da0c0] text-xs">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        {/* Decorative Circle */}
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
      </div>

      {/* Bento Grid */}
      <section className="grid grid-cols-12 gap-4 md:gap-6">
        
        {/* HERO CARD */}
        <article className="col-span-12 lg:col-span-5 bg-[var(--navy)] text-white rounded-[var(--r)] p-6 flex flex-col justify-between gap-6 min-h-[280px]">
          <div>
            <small className="text-[#8da0c0]">Deposit volume · last 14 days</small>
            <div className="text-5xl font-extrabold tracking-tighter leading-none mt-1 flex items-center gap-2 flex-wrap">
              {inr(dep)}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-extrabold ${pct >= 0 ? "bg-[#0f9d5833] text-[#5be0a0]" : "bg-[#d93a3a33] text-[#ff9a9a]"}`}>
                {pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <StatCard label="Withdrawn" value={inr(wd)} />
            <StatCard label="Net" value={inr(dep - wd)} />
            <StatCard label="New users" value={String(data.newUsers)} />
          </div>
        </article>

        {/* LINE CHART */}
        <article className="col-span-12 lg:col-span-7 bg-[var(--panel)] rounded-[var(--r)] p-6">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h2 className="text-[17px] font-extrabold">Money in and out</h2>
            <div className="flex bg-[var(--panel-2)] rounded-full p-[3px]">
              {[7, 14, 30].map((r) => (
                <button key={r} className={`px-3.5 py-1.5 rounded-full font-bold text-[13px] ${r === 14 ? "bg-[var(--navy)] text-white" : "text-[var(--ink-2)]"}`}>
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 text-[13px] text-[var(--ink-2)] mb-1.5">
            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[var(--saffron)]" />Deposits</span>
            <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-[var(--navy)]" />Withdrawals</span>
          </div>
          <LineChart data={data.dailySeries} />
        </article>

        {/* NEEDS REVIEW */}
        <article className="col-span-12 lg:col-span-4 bg-[var(--panel)] rounded-[var(--r)] p-6 grid gap-3 content-start">
          <h2 className="text-[17px] font-extrabold mb-1">Needs your review</h2>
          <div className="flex justify-between items-center gap-3 p-3.5 rounded-[14px] bg-[var(--saffron-soft)]">
            <div>
              <small className="text-[var(--ink-2)] text-[13px]">Deposits waiting</small>
              <b className="block text-[22px] tracking-tight">{data.pending.dep.n} · {inr(data.pending.dep.amt)}</b>
            </div>
            <Link href="/dashboard/deposit" className="bg-[var(--navy)] text-white px-4 py-2.5 rounded-xl font-bold text-sm">Review</Link>
          </div>
          <div className="flex justify-between items-center gap-3 p-3.5 rounded-[14px] bg-[var(--panel-2)]">
            <div>
              <small className="text-[var(--ink-2)] text-[13px]">Withdrawals waiting</small>
              <b className="block text-[22px] tracking-tight">{data.pending.wd.n} · {inr(data.pending.wd.amt)}</b>
            </div>
            <Link href="/dashboard/withdraw" className="bg-[var(--navy)] text-white px-4 py-2.5 rounded-xl font-bold text-sm">Review</Link>
          </div>
        </article>

        {/* DONUT */}
        <article className="col-span-12 lg:col-span-4 bg-[var(--panel)] rounded-[var(--r)] p-6 grid justify-items-center gap-3.5">
          <div className="w-full">
            <h2 className="text-[17px] font-extrabold">Order outcomes</h2>
          </div>
          <div className="relative w-[min(180px,60%)]">
            <svg viewBox="0 0 140 140" className="w-full">
              {(() => {
                const R = 54, C = 2 * Math.PI * R;
                let off = 0;
                return [
                  ["approved", "var(--ok)"],
                  ["pending", "var(--saffron)"],
                  ["rejected", "var(--bad)"],
                ].map(([key, color]) => {
                  const val = data.statusCounts[key as keyof typeof data.statusCounts];
                  const len = totalOrders > 0 ? (val / totalOrders) * C : 0;
                  const el = (
                    <circle key={key} cx="70" cy="70" r={R} fill="none" stroke={color} strokeWidth="16"
                      strokeDasharray={`${Math.max(len - 3, 0)} ${C}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" />
                  );
                  off += len;
                  return el;
                });
              })()}
            </svg>
            <b className="absolute inset-0 grid place-items-center text-center text-[26px] leading-tight">
              {totalOrders}
              <small className="text-[var(--ink-2)] text-[13px] font-normal">orders</small>
            </b>
          </div>
          <ul className="w-full grid gap-2 text-sm">
            {[
              ["Approved", "ok", data.statusCounts.approved],
              ["Pending", "saffron", data.statusCounts.pending],
              ["Rejected", "bad", data.statusCounts.rejected],
            ].map(([label, color, val]) => (
              <li key={label as string} className="flex justify-between">
                <span className="flex items-center gap-2">
                  <i className={`w-2.5 h-2.5 rounded-full bg-[var(--${color})]`} />
                  {label}
                </span>
                <b>{val} · {totalOrders > 0 ? Math.round((Number(val) / totalOrders) * 100) : 0}%</b>
              </li>
            ))}
          </ul>
        </article>

        {/* FEED & HEATMAP (Placeholders) */}
                {/* FEED */}
        <article className="col-span-12 lg:col-span-4 bg-[var(--panel)] rounded-[var(--r)] p-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[17px] font-extrabold">Live activity</h2>
            <span className="text-[10px] font-bold text-[var(--ok)] bg-[var(--ok-soft)] px-2 py-0.5 rounded-full flex items-center gap-1">
              <i className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" /> LIVE
            </span>
          </div>
          <LiveFeed />
        </article>

        {/* TOP USERS */}
        <article className="col-span-12 lg:col-span-6 bg-[var(--panel)] rounded-[var(--r)] p-6">
          <h2 className="text-[17px] font-extrabold mb-4">Top users this month</h2>
          <div className="grid gap-3">
            {topUsers.length === 0 && <p className="text-sm text-[var(--ink-2)]">No deposits this month yet.</p>}
            {topUsers.map((u, i) => {
              const max = topUsers[0].volume || 1;
              return (
                <div key={u.userId} className="grid grid-cols-[36px_1fr_auto] gap-3 items-center">
                  <span className="w-9 h-9 rounded-full bg-[var(--navy)] text-white grid place-items-center font-extrabold text-[13px]">
                    U{i + 1}
                  </span>
                  <div>
                    <b className="text-sm">User #{u.userId}</b>
                    <div className="h-1.5 rounded-full bg-[var(--panel-2)] mt-1 overflow-hidden">
                      <div className="h-full bg-[var(--saffron)] rounded-full" style={{ width: `${(u.volume / max) * 100}%` }} />
                    </div>
                  </div>
                  <b className="text-[15px]">₹{u.volume.toLocaleString("en-IN")}</b>
                </div>
              );
            })}
          </div>
        </article>

        {/* HEATMAP */}
        <article className="col-span-12 lg:col-span-6 bg-[var(--panel)] rounded-[var(--r)] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[17px] font-extrabold">When users deposit</h2>
            <span className="text-[var(--ink-2)] text-[13px]">Darker means busier</span>
          </div>
          <Heatmap data={data.heatmap} />
        </article>

      </section>
    </div>
  );
}

export default function DashboardPage() {
    return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}