import type { Types } from "mongoose";
import { Post, type IPost, type PostDocument } from "../models/post.model.js";

type Id = string | Types.ObjectId;

export type NewPost = Pick<IPost, "content"> & { user: Id };

export class PostRepository {
  //1: create
  public create(data: NewPost): Promise<PostDocument> {
    return Post.create(data);
  }

  //_________________________________________________________________________________//

  //2: findById
  public findById(id: Id): Promise<PostDocument | null> {
    return Post.findById(id);
  }

  //_________________________________________________________________________________//

  //3: findAllByUser
  public async findAllByUser(userId: Id, skip: number, limit: number): Promise<{ posts: PostDocument[]; total: number }> {
    const filter = { user: userId };
    const [posts, total] = await Promise.all([
      Post.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);
    return { posts, total };
  }

  //_________________________________________________________________________________//

  //4: update
  public update(id: Id, userId: Id, content: string): Promise<PostDocument | null> {
    return Post.findOneAndUpdate({ _id: id, user: userId }, { $set: { content } }, { returnDocument: "after", runValidators: true });
  }

  //_________________________________________________________________________________//

  //5: delete
  public async delete(id: Id, userId: Id): Promise<boolean> {
    const result = await Post.deleteOne({ _id: id, user: userId });
    return result.deletedCount > 0;
  }
}

export const postRepository = new PostRepository();