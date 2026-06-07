import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDB } from "../../db";
import { gatewaySecrets } from "../../db/schema";
import { createSecretSchema } from "../../lib/validators";
import { validateJson } from "../../middleware/validate";
import type { Bindings, Variables } from "../../types/env";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/gateways/:id/secrets", async (c) => {
  const db = getDB(c.env.DB);
  const all = await db.select().from(gatewaySecrets).where(eq(gatewaySecrets.gatewayId, Number(c.req.param("id")))).all();
  return c.json({ success: true, data: all });
});

app.post("/gateways/:id/secrets", validateJson(createSecretSchema), async (c) => {
  const body = c.get("validated") as typeof createSecretSchema._type;
  const db = getDB(c.env.DB);
  const result = await db.insert(gatewaySecrets).values({ ...body, gatewayId: Number(c.req.param("id")) }).returning();
  return c.json({ success: true, data: result[0] }, 201);
});

app.delete("/gateways/:id/secrets/:sid", async (c) => {
  const db = getDB(c.env.DB);
  await db.delete(gatewaySecrets).where(eq(gatewaySecrets.id, Number(c.req.param("sid"))));
  return c.json({ success: true, data: null });
});

export default app;
