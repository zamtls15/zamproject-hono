import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { getDB } from "../../db";
import { gatewayGroups, gateways, gatewaySecrets, logs } from "../../db/schema";
import { AppError } from "../../lib/errors";
import type { Bindings, Variables } from "../../types/env";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.all("/:group/:name", async (c) => {
  const db = getDB(c.env.DB);
  const { group, name } = c.req.param();

  // 1. Find group
  const foundGroup = await db.select().from(gatewayGroups)
    .where(eq(gatewayGroups.name, group)).get();
  if (!foundGroup) throw new AppError(404, "Group not found", "NOT_FOUND");

  // 2. Find gateway
  const gateway = await db.select().from(gateways)
    .where(and(eq(gateways.name, name), eq(gateways.groupId, foundGroup.id)))
    .get();
  if (!gateway) throw new AppError(404, "Gateway not found", "NOT_FOUND");

  // 3. Check status
  if (gateway.status === "OFF") {
    await db.insert(logs).values({
      gatewayId: gateway.id,
      status: "OFF",
      reason: "Gateway is disabled"
    });
    return c.json({ success: false, error: "Gateway is disabled" }, 403);
  }

  // 4. Fetch secrets
  const secrets = await db.select().from(gatewaySecrets)
    .where(eq(gatewaySecrets.gatewayId, gateway.id)).all();

  // 5. Build headers from env
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  for (const secret of secrets) {
    const value = (c.env as any)[secret.envVar];
    if (value) headers[secret.keyName] = value;
  }

  // 6. Forward to base_url
  const originalUrl = new URL(c.req.url);
  const targetUrl = `${gateway.baseUrl}${originalUrl.pathname.replace(`/gateway/${group}/${name}`, "")}${originalUrl.search}`;

  const body = c.req.method !== "GET" ? await c.req.text() : undefined;
  const response = await fetch(targetUrl, {
    method: c.req.method,
    headers,
    body,
  });

  // 7. Log ALLOWED
  await db.insert(logs).values({ gatewayId: gateway.id, status: "ALLOWED" });

  // 8. Return response
  const data = await response.json();
  return c.json(data, response.status as any);
});

export default app;
