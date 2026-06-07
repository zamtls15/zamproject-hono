import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { gatewayGroups } from "./gateway-groups";

export const gateways = sqliteTable("gateways", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").notNull().references(() => gatewayGroups.id),
  name: text("name").notNull().unique(),
  baseUrl: text("base_url").notNull(),
  status: text("status", { enum: ["ON", "OFF"] }).notNull().default("ON"),
});
