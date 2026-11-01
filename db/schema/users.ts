import { pgTable, bigint, numeric, text, timestamp, pgEnum, bigserial, uuid } from "drizzle-orm/pg-core";
import { admins } from "./auth";

export const userStatusEnum = pgEnum("user_status", ["active", "blocked"]);
export const ledgerKindEnum = pgEnum("ledger_kind", ["deposit_credit", "withdraw_hold", "withdraw_refund", "manual_adjust"]);

export const users = pgTable("users", {
  // Yahan change kiya hai: generatedAlwaysAsIdentity add kiya taaki auto-increment ho
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  balance: numeric("balance", { precision: 14, scale: 2 }).default("0").notNull(),
  pinHash: text("pin_hash").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// walletLedger waisa hi rahega...

export const walletLedger = pgTable("wallet_ledger", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }).references(() => users.id).notNull(),
  kind: ledgerKindEnum("kind").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 14, scale: 2 }).notNull(),
  refType: text("ref_type"),
  refId: bigint("ref_id", { mode: "number" }),
  adminId: uuid("admin_id").references(() => admins.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});