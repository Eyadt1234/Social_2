import { z } from "zod";

export const postIdParamSchema = z.object({ postId: z.string().regex(/^[0-9a-fA-F]{24}$/, "the post id is not valid") });

export const commentParamSchema = z.object({
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/, "the post id is not valid"),
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "the comment id is not valid"),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "the content is required").max(1000, "the content must be at most 1000 characters"),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, "the content is required").max(1000, "the content must be at most 1000 characters"),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;