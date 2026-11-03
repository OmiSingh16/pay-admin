import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function getDepositOrders() {
  console.log("📥 [getDepositOrders] Fetching orders from DB...");
  
  const result = await db.execute(sql`
    select 
      o.id, 
      o.user_id, 
      o.price_inr, 
      o.tokens, 
      o.utr, 
      o.status, 
      o.deal_date,
      to_char(o.deal_date at time zone 'Asia/Kolkata', 'DD Mon, HH12:MI AM') as formatted_date
    from deposit_orders o
    order by o.deal_date desc
    limit 500
  `);

  console.log("📥 [getDepositOrders] Fetched", result.length, "orders");
  console.log("📥 [getDepositOrders] Pending count:", result.filter((r: any) => r.status === "pending").length);

  return result.map((r: any) => ({
    id: Number(r.id),
    userId: Number(r.user_id),
    price: Number(r.price_inr),
    tokens: Number(r.tokens),
    utr: r.utr,
    status: r.status as "pending" | "approved" | "rejected",
    date: new Date(r.deal_date).getTime(),
    formattedDate: r.formatted_date,
  }));
}
export async function getWithdrawOrders() {
  const result = await db.execute(sql`
    select 
      id, 
      user_id, 
      price_inr, 
      tokens, 
      upi_id, 
      status, 
      deal_date, 
      paid_confirmed_at,
      to_char(deal_date at time zone 'Asia/Kolkata', 'DD Mon, HH12:MI AM') as formatted_date
    from withdraw_orders
    order by deal_date desc
    limit 500
  `);

  return result.map((r: any) => ({
    id: Number(r.id),
    userId: Number(r.user_id),
    price: Number(r.price_inr),
    tokens: Number(r.tokens),
    upiId: r.upi_id,
    status: r.status as "pending" | "approved" | "rejected",
    date: new Date(r.deal_date).getTime(),
    paidConfirmedAt: r.paid_confirmed_at ? new Date(r.paid_confirmed_at).getTime() : null,
    formattedDate: r.formatted_date, // <-- Ye important hai
  }));
}

// export async function getWithdrawOrders() {
//   const result = await db.execute(sql`
//     select id, user_id, price_inr, tokens, upi_id, status, deal_date, paid_confirmed_at
//     from withdraw_orders
//     order by deal_date desc
//     limit 40
//   `);

//   return result.map((r: any) => ({
//     id: Number(r.id),
//     userId: Number(r.user_id),
//     price: Number(r.price_inr),
//     tokens: Number(r.tokens),
//     upiId: r.upi_id,
//     status: r.status as "pending" | "approved" | "rejected",
//     date: new Date(r.deal_date).getTime(),
//     paidConfirmedAt: r.paid_confirmed_at ? new Date(r.paid_confirmed_at).getTime() : null,
//   }));
// }

export async function getUpiRequests() {
  const result = await db.execute(sql`
    select id, user_id, upi_id, enabled, status, risk, risk_note, created_at
    from upi_requests
    order by created_at desc
    limit 50
  `);
  return result.map((r: any) => ({
    id: Number(r.id),
    userId: Number(r.user_id),
    upiId: r.upi_id,
    enabled: r.enabled,
    status: r.status as "pending" | "approved" | "rejected",
    risk: r.risk as "low" | "medium" | "high",
    riskNote: r.risk_note,
    createdAt: new Date(r.created_at).getTime(),
  }));
}