import { z } from "zod";
import { paginationSchema } from "../../utils/pagination.js";

export const idParamSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "the id is not valid") });

export const createPostSchema = z.object({
  content: z.string().trim().min(1, "the content is required").max(3000, "the content must be at most 3000 characters"),
});

export const updatePostSchema = z.object({
  content: z.string().trim().min(1, "the content is required").max(3000, "the content must be at most 3000 characters"),
});

export const postQuerySchema = paginationSchema;

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdatePostDto = z.infer<typeof updatePostSchema>;