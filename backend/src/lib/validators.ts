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

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
});

export const createGatewaySchema = z.object({
  name: z.string().min(1).max(100),
  baseUrl: z.string().url(),
  groupId: z.coerce.number().int().positive().optional(),
});

export const updateGatewayStatusSchema = z.object({
  status: z.enum(["ON", "OFF"]),
});

export const createSecretSchema = z.object({
  keyName: z.string().min(1),
  envVar: z.string().min(1),
});
