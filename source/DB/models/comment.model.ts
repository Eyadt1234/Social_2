import { model, Schema, type HydratedDocument, type Types } from "mongoose";

export interface IComment {
  post: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CommentDocument = HydratedDocument<IComment>;

//_________________________________________________________________________________//

const commentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export const Comment = model<IComment>("Comment", commentSchema);