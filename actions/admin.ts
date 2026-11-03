"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hash } from "@node-rs/argon2";

// Helper function: User exist karta hai ya nahi check karo, agar nahi toh banao
async function ensureUserExists(userId: number) {
  const existing = await db.execute(sql`select id from users where id = ${userId} limit 1`);
  
  if (existing.length === 0) {
    // User nahi hai, default values ke saath create karo
    const pinHash = await hash("000000", { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
    
    await db.execute(sql`
      insert into users (id, balance, pin_hash, status)
      values (${userId}, 100, ${pinHash}, 'active')
    `);
  }
}

// 1. Create Deposit Order (Admin)
export async function adminCreateDeposit(data: { userId: number; price: number; tokens: number; utr: string; dealDate?: string }) {
  await requireAdmin("manage_admins");
  try {
    // Pehle user check karo/banao
    await ensureUserExists(data.userId);
    
    // Ab order insert karo
    if (data.dealDate) {
      await db.execute(sql`
        insert into deposit_orders (user_id, price_inr, tokens, utr, status, deal_date)
        values (${data.userId}, ${data.price}, ${data.tokens}, ${data.utr}, 'pending', ${data.dealDate}::timestamptz)
      `);
    } else {
      await db.execute(sql`
        insert into deposit_orders (user_id, price_inr, tokens, utr, status)
        values (${data.userId}, ${data.price}, ${data.tokens}, ${data.utr}, 'pending')
      `);
    }
    
    revalidatePath("/dashboard/deposit");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/users"); // Users list bhi refresh ho
    return { success: true };
  } catch (e: any) {
    console.error("❌ Create Deposit Error:", e.message);
    return { error: e.message || "Failed to create deposit." };
  }
}

// 2. Create Withdraw Order (Admin)
export async function adminCreateWithdraw(data: { userId: number; price: number; tokens: number; upiId: string }) {
  await requireAdmin("manage_admins");
  try {
    // Pehle user check karo/banao
    await ensureUserExists(data.userId);
    
    // Ab order insert karo
    await db.execute(sql`
      insert into withdraw_orders (user_id, price_inr, tokens, upi_id, status)
      values (${data.userId}, ${data.price}, ${data.tokens}, ${data.upiId}, 'pending')
    `);
    
    revalidatePath("/dashboard/withdraw");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e: any) {
    console.error("❌ Create Withdraw Error:", e.message);
    return { error: e.message || "Failed to create withdraw." };
  }
}

// 3. Create User (Manual - Settings se)
export async function adminCreateUser(data: { id: number; balance: number; pin: string }) {
  await requireAdmin("manage_admins");
  try {
    const pinHash = await hash(data.pin, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
    await db.execute(sql`
      insert into users (id, balance, pin_hash, status)
      values (${data.id}, ${data.balance}, ${pinHash}, 'active')
    `);
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e: any) {
    if (e.message.includes("duplicate key")) return { error: "User ID already exists." };
    return { error: "Failed to create user." };
  }
}

// 4. Delete Deposit Order
export async function adminDeleteDeposit(id: number) {
  await requireAdmin("manage_admins");
  try {
    await db.execute(sql`delete from deposit_orders where id = ${id}`);
    revalidatePath("/dashboard/deposit");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e) {
    return { error: "Cannot delete. Order may have ledger entries." };
  }
}

// 5. Delete Withdraw Order
export async function adminDeleteWithdraw(id: number) {
  await requireAdmin("manage_admins");
  try {
    await db.execute(sql`delete from withdraw_orders where id = ${id}`);
    revalidatePath("/dashboard/withdraw");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e) {
    return { error: "Cannot delete. Order may have ledger entries." };
  }
}