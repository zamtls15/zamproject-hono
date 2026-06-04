import { z } from "zod";

export const createPostSchema = z.object({
  userId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});
