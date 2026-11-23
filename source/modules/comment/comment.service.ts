import { commentRepository, postRepository, userRepository } from "../../DB/repositories/index.js";
import type { CommentDocument } from "../../DB/models/comment.model.js";
import type { PostDocument } from "../../DB/models/post.model.js";
import { toLimitedDto, type LimitedUserDto } from "../../utils/dto.js";
import { AppError } from "../../utils/errors.js";
import { getPageMeta, getSkip, type PageMeta, type PaginationDto } from "../../utils/pagination.js";
import { findVisiblePost } from "../post/post.service.js";
import type { CreateCommentDto, UpdateCommentDto } from "./comment.validation.js";

export interface CommentDto {
  id: string;
  postId: string;
  userId: string;
  author: LimitedUserDto | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentList extends PageMeta {
  comments: CommentDto[];
}

//_________________________________________________________________________________//

//1: toCommentDto
const toCommentDto = (comment: CommentDocument, author: LimitedUserDto | null): CommentDto => ({
  id: comment._id.toString(),
  postId: comment.post.toString(),
  userId: comment.user.toString(),
  author,
  content: comment.content,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

//_________________________________________________________________________________//

//2: toCommentDtos
const toCommentDtos = async (comments: CommentDocument[]): Promise<CommentDto[]> => {
  const authors = await userRepository.findActiveByIds([...new Set(comments.map((comment) => comment.user.toString()))]);
  const byId = new Map(authors.map((author) => [author._id.toString(), toLimitedDto(author)]));
  return comments.map((comment) => toCommentDto(comment, byId.get(comment.user.toString()) ?? null));
};

//_________________________________________________________________________________//

//3: toOneCommentDto
const toOneCommentDto = async (comment: CommentDocument): Promise<CommentDto> => {
  const [dto] = await toCommentDtos([comment]);
  if (!dto) {
    throw new AppError("comment not found", 404);
  }
  return dto;
};

//_________________________________________________________________________________//

//4: ensurePostExists
const ensurePostExists = async (postId: string): Promise<PostDocument> => {
  const post = await postRepository.findById(postId);
  if (!post) {
    throw new AppError("post not found", 404);
  }
  return post;
};

//_________________________________________________________________________________//

//5: findCommentOnPost
const findCommentOnPost = async (post: PostDocument, id: string): Promise<CommentDocument> => {
  const comment = await commentRepository.findById(id);
  if (!comment || comment.post.toString() !== post._id.toString()) {
    throw new AppError("comment not found", 404);
  }
  return comment;
};

//_________________________________________________________________________________//

//6: createComment
export const createComment = async (postId: string, userId: string, data: CreateCommentDto): Promise<CommentDto> => {
  await findVisiblePost(postId, userId);
  const comment = await commentRepository.create({ post: postId, user: userId, content: data.content });
  return toOneCommentDto(comment);
};

//_________________________________________________________________________________//

//7: getPostComments
export const getPostComments = async (postId: string, viewerId: string, query: PaginationDto): Promise<CommentList> => {
  await findVisiblePost(postId, viewerId);
  const { comments, total } = await commentRepository.findAllByPost(postId, getSkip(query), query.limit);
  return { comments: await toCommentDtos(comments), ...getPageMeta(query, total) };
};

//_________________________________________________________________________________//

//8: getComment
export const getComment = async (postId: string, id: string, viewerId: string): Promise<CommentDto> => {
  const post = await findVisiblePost(postId, viewerId);
  return toOneCommentDto(await findCommentOnPost(post, id));
};

//_________________________________________________________________________________//

//9: updateComment
export const updateComment = async (postId: string, id: string, userId: string, data: UpdateCommentDto): Promise<CommentDto> => {
  const post = await ensurePostExists(postId);
  const comment = await findCommentOnPost(post, id);
  if (comment.user.toString() !== userId) {
    throw new AppError("you are not allowed to do this", 403);
  }
  const updated = await commentRepository.update(id, userId, data.content);
  if (!updated) {
    throw new AppError("comment not found", 404);
  }
  return toOneCommentDto(updated);
};

//_________________________________________________________________________________//

//10: deleteComment - comment owner or post owner can delete
export const deleteComment = async (postId: string, id: string, userId: string): Promise<void> => {
  const post = await ensurePostExists(postId);
  const comment = await findCommentOnPost(post, id);

  //comment owner
  if (comment.user.toString() === userId) {
    await commentRepository.deleteByOwner(id, userId);
    return;
  }

  //post owner
  if (post.user.toString() === userId) {
    await commentRepository.deleteById(id);
    return;
  }

  throw new AppError("you are not allowed to do this", 403);
};