import { isValidObjectId } from "mongoose";
import { z } from "zod";

export const noteBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50_000),
});

export const updateNoteSchema = noteBodySchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one note field is required.",
  );

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const noteIdSchema = z.object({
  id: z.string().refine(isValidObjectId, "Invalid note ID."),
});
