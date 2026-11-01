import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { connection } from "next/server";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function getPendingOrders() {
  const dep = await db.execute(sql`select id, utr from deposit_orders where status='pending' order by id desc limit 20`);
  const wd = await db.execute(sql`select id, upi_id from withdraw_orders where status='pending' order by id desc limit 20`);
  return { dep, wd };
}

async function SettingsContent() {
  await connection();
  
  let session;
  try {
    session = await requireAdmin();
  } catch (e) {
    redirect("/login");
  }

  const { dep, wd } = await getPendingOrders();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto grid gap-6">
      <h1 className="text-2xl md:text-3xl font-extrabold">Admin Control Center</h1>
      <SettingsClient 
        admin={session.admin} 
        depositOrders={dep.map((r: any) => ({ id: Number(r.id), utr: r.utr }))}
        withdrawOrders={wd.map((r: any) => ({ id: Number(r.id), upiId: r.upi_id }))}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}