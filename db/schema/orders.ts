import { pgTable, bigint, numeric, integer, text, timestamp, pgEnum, varchar, boolean, uuid, bigserial, jsonb, inet } from "drizzle-orm/pg-core";
import { users } from "./users";
import { admins } from "./auth";

export const orderStatusEnum = pgEnum("order_status", ["pending", "approved", "rejected"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);

export const depositOrders = pgTable("deposit_orders", {
  // Yahan change kiya hai
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint("user_id", { mode: "number" }).references(() => users.id).notNull(),
  priceInr: numeric("price_inr", { precision: 12, scale: 2 }).notNull(),
  tokens: integer("tokens").notNull(),
  utr: varchar("utr", { length: 32 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  dealDate: timestamp("deal_date", { withTimezone: true }).defaultNow().notNull(),
  reviewedBy: uuid("reviewed_by").references(() => admins.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const withdrawOrders = pgTable("withdraw_orders", {
  // Yahan change kiya hai
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint("user_id", { mode: "number" }).references(() => users.id).notNull(),
  priceInr: numeric("price_inr", { precision: 12, scale: 2 }).notNull(),
  tokens: integer("tokens").notNull(),
  upiId: varchar("upi_id", { length: 80 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  dealDate: timestamp("deal_date", { withTimezone: true }).defaultNow().notNull(),
  paidConfirmedAt: timestamp("paid_confirmed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => admins.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});


export const upiRequests = pgTable("upi_requests", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint("user_id", { mode: "number" }).references(() => users.id).notNull(),
  upiId: varchar("upi_id", { length: 80 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  risk: riskLevelEnum("risk").default("low").notNull(),
  riskNote: text("risk_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedBy: uuid("reviewed_by").references(() => admins.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  adminId: uuid("admin_id").references(() => admins.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  meta: jsonb("meta").default({}).notNull(),
  ip: inet("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});