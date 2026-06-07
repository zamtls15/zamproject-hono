import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDB } from "../../db";
import { logs } from "../../db/schema";
import type { Bindings, Variables } from "../../types/env";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/logs", async (c) => {
  const db = getDB(c.env.DB);
  const all = await db.select().from(logs).all();
  return c.json({ success: true, data: all });
});

app.get("/gateways/:id/logs", async (c) => {
  const db = getDB(c.env.DB);
  const all = await db.select().from(logs).where(eq(logs.gatewayId, Number(c.req.param("id")))).all();
  return c.json({ success: true, data: all });
});

export default app;
