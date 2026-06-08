import { Hono } from "hono";
import { logger } from "hono/logger";
import type { Bindings, Variables } from "./types/env";
import { errorHandler } from "./middleware/error";
import users from "./routes/users";
import posts from "./routes/posts";
import groups   from "./routes/gateway/groups";
import gateways from "./routes/gateway/gateways";
import secrets  from "./routes/gateway/secrets";
import gwLogs   from "./routes/gateway/logs";
import proxy    from "./routes/gateway/proxy";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware — reads FRONTEND_URL from wrangler.jsonc env vars
app.use("*", async (c, next) => {
  const origin = c.env.FRONTEND_URL || "http://localhost:3000";
  c.header("Access-Control-Allow-Origin", origin);
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Allow-Credentials", "true");
  if (c.req.method === "OPTIONS") return c.text("");
  await next();
});

app.use(logger());
app.onError(errorHandler);

app.get("/", (c) => c.json({ status: "API Gateway OK", time: new Date().toISOString() }));
app.get("/health", (c) => c.json({ healthy: true }));

app.route("/users", users);
app.route("/posts", posts);
app.route("/gateway", groups);
app.route("/gateway", gateways);
app.route("/gateway", secrets);
app.route("/gateway", gwLogs);
app.route("/gateway", proxy);

export default app;
