
"use client";

import useSWR from "swr";
import { useEffect, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, UserPlus } from "lucide-react";

interface Activity {
  id: string;
  type: "dep" | "wd" | "usr";
  amount: number;
  user: string;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export function LiveFeed() {
  const { data } = useSWR<Activity[]>("/api/dashboard/activity", fetcher, {
    refreshInterval: 40000, // 10 seconds polling
  });

  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;
    
    // Dono ko string mein convert karo taaki comparison sahi ho
    const currentIds = new Set(data.map((d) => String(d.id)));
    const added = new Set<string>();
    
    currentIds.forEach((id) => {
      if (!prevIds.current.has(id)) added.add(id);
    });

    // Sirf tab flash karo jab pehle se data tha (initial load pe nahi)
    if (prevIds.current.size > 0 && added.size > 0) {
      setNewIds(added);
      setTimeout(() => setNewIds(new Set()), 1200);
    }

    prevIds.current = currentIds;
  }, [data]);

  if (!data) return <div className="text-[var(--ink-2)] text-sm">Loading feed...</div>;

  return (
    <ul className="grid gap-1">
      {data.map((ev) => {
        const isNew = newIds.has(String(ev.id));
        const time = new Date(ev.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        
        let icon = <UserPlus className="w-4 h-4" />;
        let iconBg = "bg-[var(--panel-2)] text-[var(--ink)]";
        let text = `${ev.user.slice(0, 5)}... joined`;
        let amount = "New";

        if (ev.type === "dep") {
          icon = <ArrowDownLeft className="w-4 h-4" />;
          iconBg = "bg-[var(--ok-soft)] text-[var(--ok)]";
          text = `${ev.user.slice(0, 5)}... deposited`;
          amount = inr(ev.amount);
        } else if (ev.type === "wd") {
          icon = <ArrowUpRight className="w-4 h-4" />;
          iconBg = "bg-[var(--bad-soft)] text-[var(--bad)]";
          text = `${ev.user.slice(0, 5)}... requested`;
          amount = inr(ev.amount);
        }

        return (
          <li
            key={ev.id}
            className={`grid grid-cols-[36px_1fr_auto] gap-3 items-center p-2 rounded-xl transition-colors ${isNew ? "animate-[flash_1.2s_ease-out]" : ""}`}
          >
            <span className={`w-9 h-9 rounded-xl grid place-items-center ${iconBg}`}>
              {icon}
            </span>
            <span className="text-sm font-semibold">
              {text}
              <small className="block text-[var(--ink-2)] text-xs font-normal">{time}</small>
            </span>
            <b className="text-[15px]">{amount}</b>
          </li>
        );
      })}
    </ul>
  );
}