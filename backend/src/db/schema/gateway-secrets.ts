import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { gateways } from "./gateways";

export const gatewaySecrets = sqliteTable("gateway_secrets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gatewayId: integer("gateway_id").notNull().references(() => gateways.id),
  keyName: text("key_name").notNull(),
  envVar: text("env_var").notNull(),
});
