import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDB } from "../../db";
import { gatewayGroups } from "../../db/schema";
import { createGroupSchema } from "../../lib/validators";
import { validateJson } from "../../middleware/validate";
import { AppError } from "../../lib/errors";
import type { Bindings, Variables } from "../../types/env";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/groups", async (c) => {
  const db = getDB(c.env.DB);
  const all = await db.select().from(gatewayGroups).all();
  return c.json({ success: true, data: all });
});

app.post("/groups", validateJson(createGroupSchema), async (c) => {
  const body = c.get("validated") as typeof createGroupSchema._type;
  const db = getDB(c.env.DB);
  const result = await db.insert(gatewayGroups).values(body).returning();
  return c.json({ success: true, data: result[0] }, 201);
});

app.delete("/groups/:id", async (c) => {
  const db = getDB(c.env.DB);
  await db.delete(gatewayGroups).where(eq(gatewayGroups.id, Number(c.req.param("id"))));
  return c.json({ success: true, data: null });
});

export default app;
