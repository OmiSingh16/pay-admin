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

export async function reviewUpi(input: { id: number; action: "approved" | "rejected" }) {
  const session = await requireAdmin("review_orders");
  const { id, action } = reviewSchema.parse(input);

  try {
    await db.execute(sql`
      update upi_requests 
      set status = ${action}, reviewed_by = ${session.admin.id}::uuid, reviewed_at = now()
      where id = ${id} and status = 'pending'
    `);
    revalidatePath("/dashboard/upi");
    return { success: true };
  } catch (e: any) {
    return { error: "Failed to update request." };
  }
}

export async function bulkApproveUpi(ids: number[]) {
  const session = await requireAdmin("review_orders");
  try {
    await db.execute(sql`select approve_upi_bulk(${ids}, ${session.admin.id}::uuid)`);
    revalidatePath("/dashboard/upi");
    return { success: true };
  } catch (e: any) {
    return { error: "Bulk approve failed." };
  }
}

export async function toggleUpiStatus(input: { id: number; enabled: boolean }) {
  await requireAdmin("review_orders");
  try {
    await db.execute(sql`update upi_requests set enabled = ${input.enabled} where id = ${input.id}`);
    revalidatePath("/dashboard/upi");
    return { success: true };
  } catch (e) {
    return { error: "Failed to toggle status." };
  }
}