import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { UserRole } from "./user.model.js";

const interestsSchema = z
  .array(z.string().trim().min(1).max(100))
  .optional();

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(UserRole).default(UserRole.USER),
  interests: interestsSchema,
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
    password: z.string().min(8).max(128).optional(),
    role: z.enum(UserRole).optional(),
    interests: z.array(z.string().trim().min(1).max(100)).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one user field is required.",
  });

export const userIdSchema = z.object({
  id: z.string().refine(isValidObjectId, "Invalid user ID."),
});