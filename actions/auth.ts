"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { admins, loginAttempts } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { verify } from "@node-rs/argon2";
import { createSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authenticator } from "otplib";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp: z.string().optional(),
});

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const totp = formData.get("totp") as string;

  const parsed = loginSchema.safeParse({ email, password, totp });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = headersList.get("user-agent") || "Unknown";

  // Rate Limiting (5 failures in 15 mins)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentFailures = await db
    .select({ count: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email),
        eq(loginAttempts.success, false),
        gte(loginAttempts.createdAt, fifteenMinsAgo)
      )
    );

  if (Number(recentFailures[0].count) >= 5) {
    return { error: "Too many attempts. Try again later." };
  }

  const adminRecord = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  const admin = adminRecord[0];

  let isValid = false;
  if (admin) {
    isValid = await verify(admin.passwordHash, password);
  }

  if (!admin || !isValid) {
    await db.insert(loginAttempts).values({ email, ip, success: false });
    return { error: "Invalid email or password" };
  }

  // TOTP Check (Owner/Admin only)
  if ((admin.role === "owner" || admin.role === "admin") && admin.totpSecret) {
    if (!totp) return { error: "TOTP code required" };
    const isValidTotp = authenticator.check(totp, admin.totpSecret);
    if (!isValidTotp) {
      await db.insert(loginAttempts).values({ email, ip, success: false });
      return { error: "Invalid TOTP code" };
    }
  }

  await db.insert(loginAttempts).values({ email, ip, success: true });
  await createSession(admin.id, ip, userAgent);
  
   return { success: true };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}