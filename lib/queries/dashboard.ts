import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function getDashboardData(range: number = 14) {
  // 1. Daily Series (Deposits vs Withdrawals for chart)
  const dailySeries = await db.execute(sql`
    select d::date as day,
      (select coalesce(sum(price_inr),0) from deposit_orders where status='approved' and deal_date::date = d::date) as dep,
      (select coalesce(sum(price_inr),0) from withdraw_orders where status='approved' and deal_date::date = d::date) as wd
    from generate_series(current_date - (${range} || ' days')::interval, current_date, interval '1 day') d
  `);

  // 2. Order Outcomes (For Donut)
  const outcomes = await db.execute(sql`
    select status, count(*)::int as count
    from (
      select status from deposit_orders
      union all
      select status from withdraw_orders
    ) combined
    group by status
  `);

  // 3. Pending Amounts (For Needs Review Card)
  const pendingDep = await db.execute(sql`
    select count(*)::int as n, coalesce(sum(price_inr),0) as amt
    from deposit_orders where status = 'pending'
  `);
  const pendingWd = await db.execute(sql`
    select count(*)::int as n, coalesce(sum(price_inr),0) as amt
    from withdraw_orders where status = 'pending'
  `);

  // 4. New Users (Current range)
  const newUsers = await db.execute(sql`
    select count(*)::int as count from users 
    where created_at >= now() - (${range} || ' days')::interval
  `);

  // 5. Top Users (This month)
  const topUsers = await db.execute(sql`
    select user_id, sum(price_inr) as vol from deposit_orders 
    where status='approved' and deal_date >= date_trunc('month', now()) 
    group by user_id order by vol desc limit 5
  `);

  // 6. Heatmap (7 days x 24 hours)
  const heatmap = await db.execute(sql`
    select extract(isodow from deal_date at time zone 'Asia/Kolkata')::int as dow,
           extract(hour from deal_date at time zone 'Asia/Kolkata')::int as hr,
           count(*)::int as count
    from deposit_orders 
    where deal_date > now() - interval '30 days' 
    group by 1,2
  `);

  // Formatting the data
  const statusCounts = { approved: 0, pending: 0, rejected: 0 };
  outcomes.forEach((r: any) => {
    statusCounts[r.status as keyof typeof statusCounts] = r.count;
  });

  return {
    dailySeries: dailySeries.map((r: any) => ({
      date: new Date(r.day),
      dep: Number(r.dep),
      wd: Number(r.wd),
    })),
    statusCounts,
    pending: {
      dep: { n: Number(pendingDep[0].n), amt: Number(pendingDep[0].amt) },
      wd: { n: Number(pendingWd[0].n), amt: Number(pendingWd[0].amt) },
    },
    newUsers: Number(newUsers[0].count),
    topUsers: topUsers.map((r: any) => ({
      userId: Number(r.user_id),
      vol: Number(r.vol),
    })),
    heatmap: heatmap.map((r: any) => ({
      dow: Number(r.dow),
      hr: Number(r.hr),
      count: Number(r.count),
    })),
  };
}