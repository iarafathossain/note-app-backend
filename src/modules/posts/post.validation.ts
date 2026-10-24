import { isValidObjectId } from "mongoose";
import { z } from "zod";

export const postBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50_000),
});

export const updatePostSchema = postBodySchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one post field is required.",
  );

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100, "Search is too long.").optional(),
});

export type PostListQuery = z.infer<typeof paginationSchema>;

export const postIdSchema = z.object({
  id: z.string().refine(isValidObjectId, "Invalid post ID."),
});

export const userIdSchema = z.object({
  userId: z.string().refine(isValidObjectId, "Invalid user ID."),
});