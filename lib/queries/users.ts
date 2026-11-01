import { db } from "@/lib/db";
import { sql } from "drizzle-orm";


export async function getUsers() {
  const result = await db.execute(sql`
    select id, balance, status, created_at, pin_hash
    from users
    where deleted_at is null
    order by created_at desc
  `);
  return result.map((r: any) => ({
    id: Number(r.id),
    balance: Number(r.balance),
    status: r.status as "active" | "blocked",
    createdAt: new Date(r.created_at).getTime(),
    pinHash: r.pin_hash,
  }));
}

export async function getUsersStats() {
  const result = await db.execute(sql`
    select 
      coalesce(avg(balance), 0) as avg_balance,
      coalesce(sum(balance), 0) as total_held,
      count(*) as total,
      count(*) filter (where status = 'active') as active,
      count(*) filter (where status = 'blocked') as blocked
    from users where deleted_at is null
  `);
  const r = result[0] as any;
  return {
    avgBalance: Number(r.avg_balance),
    totalHeld: Number(r.total_held),
    total: Number(r.total),
    active: Number(r.active),
    blocked: Number(r.blocked),
  };
}