import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const gatewayGroups = sqliteTable("gateway_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});
