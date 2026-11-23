import { Types } from "mongoose";
import { Comment, type IComment, type CommentDocument } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";

type Id = string | Types.ObjectId;

export type NewComment = Pick<IComment, "content"> & { post: Id; user: Id };

export class CommentRepository {
  //1: create
  public create(data: NewComment): Promise<CommentDocument> {
    return Comment.create(data);
  }

  //_________________________________________________________________________________//

  //2: findById
  public findById(id: Id): Promise<CommentDocument | null> {
    return Comment.findById(id);
  }

  //_________________________________________________________________________________//

  //3: findAllByPost
  public async findAllByPost(postId: Id, skip: number, limit: number): Promise<{ comments: CommentDocument[]; total: number }> {
    const filter = { post: postId };
    const [comments, total] = await Promise.all([
      Comment.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Comment.countDocuments(filter),
    ]);
    return { comments, total };
  }

  //_________________________________________________________________________________//

  //4: update
  public update(id: Id, userId: Id, content: string): Promise<CommentDocument | null> {
    return Comment.findOneAndUpdate({ _id: id, user: userId }, { $set: { content } }, { returnDocument: "after", runValidators: true });
  }

  //_________________________________________________________________________________//

  //5: deleteByOwner
  public async deleteByOwner(id: Id, userId: Id): Promise<boolean> {
    const result = await Comment.deleteOne({ _id: id, user: userId });
    return result.deletedCount > 0;
  }

  //_________________________________________________________________________________//

  //6: deleteByPostOwner
  public async deleteById(id: Id): Promise<boolean> {
    const result = await Comment.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  //_________________________________________________________________________________//

  //7: deleteAllByPost
  public async deleteAllByPost(postId: Id): Promise<number> {
    const result = await Comment.deleteMany({ post: postId });
    return result.deletedCount;
  }

  //_________________________________________________________________________________//

  //8: countByPosts
  public async countByPosts(postIds: Types.ObjectId[]): Promise<Map<string, number>> {
    const rows = await Comment.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((row) => [row._id.toString(), row.count]));
  }

  //_________________________________________________________________________________//

  //9: deleteOrphans
  public async deleteOrphans(): Promise<number> {
    const orphans = await Comment.aggregate<{ _id: Types.ObjectId }>([
      { $lookup: { from: Post.collection.name, localField: "post", foreignField: "_id", as: "posts" } },
      { $match: { posts: { $size: 0 } } },
      { $project: { _id: 1 } },
    ]);
    const result = await Comment.deleteMany({ _id: { $in: orphans.map((orphan) => orphan._id) } });
    return result.deletedCount;
  }
}

export const commentRepository = new CommentRepository();