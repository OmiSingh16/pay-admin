import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function getLiveActivity() {
  // PDF ke hisaab se: Union of newest deposit, withdraw, and users
  const result = await db.execute(sql`
    (
      select 'dep' as type, id::text, price_inr::text as amount, user_id::text as user, deal_date as created_at 
      from deposit_orders order by deal_date desc limit 3
    )
    union all
    (
      select 'wd' as type, id::text, price_inr::text as amount, user_id::text as user, deal_date as created_at 
      from withdraw_orders order by deal_date desc limit 2
    )
    union all
    (
      select 'usr' as type, id::text, '0' as amount, id::text as user, created_at 
      from users order by created_at desc limit 2
    )
    order by created_at desc limit 7
  `);

  return result.map((r: any) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    user: r.user,
    createdAt: new Date(r.created_at),
  }));
}

export async function getTopUsers() {
  const result = await db.execute(sql`
    select user_id, sum(price_inr) as vol from deposit_orders 
    where status='approved' and deal_date >= date_trunc('month', now()) 
    group by user_id order by vol desc limit 5
  `);

  return result.map((r: any) => ({
    userId: r.user_id,
    volume: Number(r.vol),
  }));
}