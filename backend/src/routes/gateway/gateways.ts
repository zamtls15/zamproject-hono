import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { getDB } from "../../db";
import { gateways } from "../../db/schema";
import { createGatewaySchema, updateGatewayStatusSchema } from "../../lib/validators";
import { validateJson } from "../../middleware/validate";
import { AppError } from "../../lib/errors";
import type { Bindings, Variables } from "../../types/env";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/groups/:id/gateways", async (c) => {
  const db = getDB(c.env.DB);
  const all = await db.select().from(gateways).where(eq(gateways.groupId, Number(c.req.param("id")))).all();
  return c.json({ success: true, data: all });
});

app.post("/groups/:id/gateways", validateJson(createGatewaySchema), async (c) => {
  const body = c.get("validated") as typeof createGatewaySchema._type;
  const db = getDB(c.env.DB);
  const result = await db.insert(gateways).values({ ...body, groupId: Number(c.req.param("id")) }).returning();
  return c.json({ success: true, data: result[0] }, 201);
});

app.patch("/groups/:id/gateways/:gwId", validateJson(updateGatewayStatusSchema), async (c) => {
  const body = c.get("validated") as typeof updateGatewayStatusSchema._type;
  const db = getDB(c.env.DB);
  const result = await db
    .update(gateways)
    .set({ status: body.status })
    .where(and(eq(gateways.id, Number(c.req.param("gwId"))), eq(gateways.groupId, Number(c.req.param("id")))))
    .returning();
  if (!result[0]) throw new AppError(404, "Gateway not found", "NOT_FOUND");
  return c.json({ success: true, data: result[0] });
});

app.delete("/groups/:id/gateways/:gwId", async (c) => {
  const db = getDB(c.env.DB);
  await db.delete(gateways).where(and(eq(gateways.id, Number(c.req.param("gwId"))), eq(gateways.groupId, Number(c.req.param("id")))));
  return c.json({ success: true, data: null });
});

export default app;
