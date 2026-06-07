import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const logs = sqliteTable("logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gatewayId: integer("gateway_id"),
  status: text("status", { enum: ["ALLOWED", "BLOCKED", "OFF"] }).notNull(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
