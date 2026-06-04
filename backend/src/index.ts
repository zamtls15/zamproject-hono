import { Hono } from "hono";
import { logger } from "hono/logger";
import type { Bindings, Variables } from "./types/env";
import { errorHandler } from "./middleware/error";
import users from "./routes/users";
import posts from "./routes/posts";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(logger());
app.onError(errorHandler);

app.get("/", (c) => c.json({ status: "API Gateway OK", time: new Date().toISOString() }));
app.get("/health", (c) => c.json({ healthy: true }));

app.route("/users", users);
app.route("/posts", posts);

export default app;
