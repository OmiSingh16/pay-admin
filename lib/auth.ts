import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sessions, admins } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { hasPermission, Permission, Role } from "./permissions";

const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-session" : "session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminId: string, ip?: string, userAgent?: string) {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    adminId,
    tokenHash,
    ip: ip || null,
    userAgent: userAgent || null,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  
  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const result = await db
    .select({
      admin: admins,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(admins, eq(sessions.adminId, admins.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, sql`now()`),
        eq(admins.isActive, true)
      )
    )
    .limit(1);

  if (!result.length) return null;
  return result[0];
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAdmin(permission?: Permission) {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (permission && !hasPermission(session.admin.role as Role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}