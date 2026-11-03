"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reviewSchema = z.object({
  id: z.number(),
  action: z.enum(["approved", "rejected"]),
});

export async function reviewDeposit(input: { id: number; action: "approved" | "rejected" }) {
  const session = await requireAdmin("review_orders");
  const { id, action } = reviewSchema.parse(input);

  try {
    if (action === "approved") {
      await db.execute(sql`select approve_deposit(${id}, ${session.admin.id}::uuid)`);
    } else {
      await db.execute(sql`select reject_deposit(${id}, ${session.admin.id}::uuid)`);
    }
    
    revalidatePath("/dashboard/deposit");
    // revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    const msg = e.message || e.cause?.message || "";
    if (msg.includes("ALREADY_REVIEWED")) return { error: "This order was already reviewed." };
    if (msg.includes("ORDER_NOT_FOUND")) return { error: "Order not found." };
    if (msg.includes("violates foreign key constraint")) return { error: "User account missing. Please re-seed data." };
    return { error: msg || "Something went wrong. Please try again." };
  }
}

export async function reviewWithdraw(input: { id: number; action: "approved" | "rejected" }) {
  const session = await requireAdmin("review_orders");
  const { id, action } = reviewSchema.parse(input);

  try {
   
    if (action === "approved") {
      await db.execute(sql`
        update withdraw_orders 
        set paid_confirmed_at = now() 
        where id = ${id} and status = 'pending'
      `);
      await db.execute(sql`select approve_withdraw(${id}, ${session.admin.id}::uuid)`);
    } else {
      await db.execute(sql`select reject_withdraw(${id}, ${session.admin.id}::uuid)`);
    }
    
    revalidatePath("/dashboard/withdraw");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    const msg = e.message || e.cause?.message || "";
    if (msg.includes("ALREADY_REVIEWED")) return { error: "This order was already reviewed." };
    if (msg.includes("ORDER_NOT_FOUND")) return { error: "Order not found." };
    if (msg.includes("PAYMENT_NOT_CONFIRMED")) return { error: "Please tick 'Payment sent' before approving." };
    return { error: msg || "Something went wrong. Please try again." };
  }
}