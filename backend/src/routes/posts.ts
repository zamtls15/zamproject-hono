import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDB } from "../db";
import { posts } from "../db/schema";
import { createPostSchema } from "../lib/validators";
import { validateJson } from "../middleware/validate";
import { AppError } from "../lib/errors";
import type { Bindings, Variables } from "../types/env";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/", async (c) => {
  const db = getDB(c.env.DB);
  const allPosts = await db.select().from(posts).all();
  return c.json({ success: true, data: allPosts });
});

app.post("/", validateJson(createPostSchema), async (c) => {
  const body = c.get("validated") as typeof createPostSchema._type;
  const db = getDB(c.env.DB);

  const result = await db.insert(posts).values(body).returning();
  return c.json({ success: true, data: result[0] }, 201);
});

app.get("/:id", async (c) => {
  const db = getDB(c.env.DB);
  const post = await db
    .select()
    .from(posts)
    .where(eq(posts.id, Number(c.req.param("id"))))
    .get();

  if (!post) throw new AppError(404, "Post not found", "NOT_FOUND");
  return c.json({ success: true, data: post });
});

app.delete("/:id", async (c) => {
  const db = getDB(c.env.DB);
  await db.delete(posts).where(eq(posts.id, Number(c.req.param("id"))));
  return c.json({ success: true, data: null }, 204);
});

export default app;
