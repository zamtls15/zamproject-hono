import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getDB } from "../db";
import { users } from "../db/schema";
import { createUserSchema } from "../lib/validators";
import { validateJson } from "../middleware/validate";
import { AppError } from "../lib/errors";
import type { Bindings, Variables } from "../types/env";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/", async (c) => {
  const db = getDB(c.env.DB);
  const allUsers = await db.select().from(users).all();
  return c.json({ success: true, data: allUsers });
});

app.post("/", validateJson(createUserSchema), async (c) => {
  const body = c.get("validated") as typeof createUserSchema._type;
  const db = getDB(c.env.DB);

  try {
    const result = await db.insert(users).values(body).returning();
    return c.json({ success: true, data: result[0] }, 201);
  } catch (err: any) {
    const msg = err?.cause?.message || err?.message || "";
    if (msg.includes("UNIQUE constraint failed")) {
      throw new AppError(409, "Email already exists", "CONFLICT");
    }
    throw err;
  }
});

app.get("/:id", async (c) => {
  const db = getDB(c.env.DB);
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(c.req.param("id"))))
    .get();

  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
  return c.json({ success: true, data: user });
});

export default app;
