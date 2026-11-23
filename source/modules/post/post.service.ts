import { commentRepository, followRepository, postRepository, userRepository } from "../../DB/repositories/index.js";
import type { PostDocument } from "../../DB/models/post.model.js";
import type { UserDocument } from "../../DB/models/user.model.js";
import { toLimitedDto, type LimitedUserDto } from "../../utils/dto.js";
import { AppError } from "../../utils/errors.js";
import { getPageMeta, getSkip, type PageMeta, type PaginationDto } from "../../utils/pagination.js";
import type { CreatePostDto, UpdatePostDto } from "./post.validation.js";

export interface PostDto {
  id: string;
  content: string;
  userId: string;
  author: LimitedUserDto | null;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostList extends PageMeta {
  posts: PostDto[];
}

//_________________________________________________________________________________//

//1: toPostDto
const toPostDto = (post: PostDocument, author: LimitedUserDto | null, commentsCount: number): PostDto => ({
  id: post._id.toString(),
  content: post.content,
  userId: post.user.toString(),
  author,
  commentsCount,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

//_________________________________________________________________________________//

//2: toPostDtos
const toPostDtos = async (posts: PostDocument[]): Promise<PostDto[]> => {
  const authors = await userRepository.findActiveByIds([...new Set(posts.map((post) => post.user.toString()))]);
  const counts = await commentRepository.countByPosts(posts.map((post) => post._id));
  const byId = new Map(authors.map((author) => [author._id.toString(), toLimitedDto(author)]));
  return posts.map((post) => toPostDto(post, byId.get(post.user.toString()) ?? null, counts.get(post._id.toString()) ?? 0));
};

//_________________________________________________________________________________//

//3: toOnePostDto
const toOnePostDto = async (post: PostDocument): Promise<PostDto> => {
  const [dto] = await toPostDtos([post]);
  if (!dto) {
    throw new AppError("post not found", 404);
  }
  return dto;
};

//_________________________________________________________________________________//

//4: findPost
const findPost = async (id: string): Promise<PostDocument> => {
  const post = await postRepository.findById(id);
  if (!post) {
    throw new AppError("post not found", 404);
  }
  return post;
};

//_________________________________________________________________________________//

//5: ensureCanView
const ensureCanView = async (author: UserDocument, viewerId: string): Promise<void> => {
  if (author.isPrivate && author._id.toString() !== viewerId && (await followRepository.findStatus(viewerId, author._id)) !== "accepted") {
    throw new AppError("this account is private, follow it to see its posts", 403);
  }
};

//_________________________________________________________________________________//

//6: findVisiblePost - the post of a deleted user is hidden
export const findVisiblePost = async (id: string, viewerId: string): Promise<PostDocument> => {
  const post = await findPost(id);
  const author = await userRepository.findActiveById(post.user);
  if (!author) {
    throw new AppError("post not found", 404);
  }
  await ensureCanView(author, viewerId);
  return post;
};

//_________________________________________________________________________________//

//7: createPost
export const createPost = async (userId: string, data: CreatePostDto): Promise<PostDto> => {
  const post = await postRepository.create({ user: userId, content: data.content });
  return toOnePostDto(post);
};

//_________________________________________________________________________________//

//8: getMyPosts
export const getMyPosts = async (userId: string, query: PaginationDto): Promise<PostList> => {
  const { posts, total } = await postRepository.findAllByUser(userId, getSkip(query), query.limit);
  return { posts: await toPostDtos(posts), ...getPageMeta(query, total) };
};

//_________________________________________________________________________________//

//9: getUserPosts
export const getUserPosts = async (viewerId: string, targetId: string, query: PaginationDto): Promise<PostList> => {
  const target = await userRepository.findActiveById(targetId);
  if (!target) {
    throw new AppError("user not found", 404);
  }
  await ensureCanView(target, viewerId);

  const { posts, total } = await postRepository.findAllByUser(targetId, getSkip(query), query.limit);
  return { posts: await toPostDtos(posts), ...getPageMeta(query, total) };
};

//_________________________________________________________________________________//

//10: getPost
export const getPost = async (id: string, viewerId: string): Promise<PostDto> => {
  return toOnePostDto(await findVisiblePost(id, viewerId));
};

//_________________________________________________________________________________//

//11: updatePost
export const updatePost = async (id: string, userId: string, data: UpdatePostDto): Promise<PostDto> => {
  const post = await findPost(id);
  if (post.user.toString() !== userId) {
    throw new AppError("you are not allowed to do this", 403);
  }
  const updated = await postRepository.update(id, userId, data.content);
  if (!updated) {
    throw new AppError("post not found", 404);
  }
  return toOnePostDto(updated);
};

//_________________________________________________________________________________//

//12: deletePost
export const deletePost = async (id: string, userId: string): Promise<void> => {
  const post = await findPost(id);
  if (post.user.toString() !== userId) {
    throw new AppError("you are not allowed to do this", 403);
  }
  await postRepository.delete(id, userId);
  await commentRepository.deleteAllByPost(id);
};