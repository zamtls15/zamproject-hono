import { Hono } from "hono";
import { cors } from "hono/cors";
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

app.use("*", cors({
  origin: (origin) => origin || "http://localhost:3000",
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

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
