"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hash } from "@node-rs/argon2";
import { z } from "zod";

// 1. Update Balance (adjust_balance function use karega)
export async function updateBalance(input: { userId: number; amount: number }) {
  const session = await requireAdmin("manage_users");
  try {
    await db.execute(sql`select adjust_balance(${input.userId}, ${input.amount}, ${session.admin.id}::uuid)`);
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e: any) {
    if (e.message.includes("INSUFFICIENT_BALANCE")) return { error: "Balance cannot go below zero." };
    return { error: "Failed to update balance." };
  }
}

// 2. Add User
export async function addUser(input: { id: number; balance: number; pin: string }) {
  await requireAdmin("manage_users");
  try {
    const pinHash = await hash(input.pin, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
    await db.execute(sql`
      insert into users (id, balance, pin_hash, status)
      values (${input.id}, ${input.balance}, ${pinHash}, 'active')
    `);
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e: any) {
    if (e.message.includes("duplicate key")) return { error: "User ID already exists." };
    return { error: "Failed to create user." };
  }
}

// 3. Change PIN
export async function changePin(input: { userId: number; pin: string }) {
  await requireAdmin("manage_users");
  try {
    const pinHash = await hash(input.pin, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
    await db.execute(sql`update users set pin_hash = ${pinHash} where id = ${input.userId}`);
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e) {
    return { error: "Failed to change PIN." };
  }
}

// 4. Block / Unblock User
export async function toggleUserStatus(input: { userId: number; status: "active" | "blocked" }) {
  await requireAdmin("manage_users");
  try {
    await db.execute(sql`update users set status = ${input.status} where id = ${input.userId}`);
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e) {
    return { error: "Failed to update status." };
  }
}

// 5. Delete User (Soft Delete)
export async function deleteUser(userId: number) {
  await requireAdmin("manage_users");
  try {
    await db.execute(sql`update users set deleted_at = now() where id = ${userId}`);
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete user." };
  }
}