"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hash } from "@node-rs/argon2";

// 1. Create Deposit Order (Admin)
export async function adminCreateDeposit(data: { userId: number; price: number; tokens: number; utr: string }) {
  await requireAdmin("manage_admins");
  try {
    await db.execute(sql`
      insert into deposit_orders (user_id, price_inr, tokens, utr, status)
      values (${data.userId}, ${data.price}, ${data.tokens}, ${data.utr}, 'pending')
    `);
    revalidatePath("/dashboard/deposit");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e: any) {
    return { error: "Failed to create deposit. User may not exist." };
  }
}

// 2. Create Withdraw Order (Admin)
export async function adminCreateWithdraw(data: { userId: number; price: number; tokens: number; upiId: string }) {
  await requireAdmin("manage_admins");
  try {
    // Direct insert (bypassing create_withdraw function for admin manual entry)
    await db.execute(sql`
      insert into withdraw_orders (user_id, price_inr, tokens, upi_id, status)
      values (${data.userId}, ${data.price}, ${data.tokens}, ${data.upiId}, 'pending')
    `);
    revalidatePath("/dashboard/withdraw");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e: any) {
    return { error: "Failed to create withdraw order." };
  }
}

// 3. Create User
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
    await db.execute(sql`delete from deposit_orders where id = ${id} and status = 'pending'`);
    revalidatePath("/dashboard/deposit");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e) {
    return { error: "Cannot delete. Order may be approved or have ledger entries." };
  }
}

// 5. Delete Withdraw Order
export async function adminDeleteWithdraw(id: number) {
  await requireAdmin("manage_admins");
  try {
    await db.execute(sql`delete from withdraw_orders where id = ${id} and status = 'pending'`);
    revalidatePath("/dashboard/withdraw");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e) {
    return { error: "Cannot delete. Order may be approved or have ledger entries." };
  }
}