import { model, Schema, type HydratedDocument, type Types } from "mongoose";

export interface IPost {
  user: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PostDocument = HydratedDocument<IPost>;

//_________________________________________________________________________________//

const postSchema = new Schema<IPost>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
  },
  { timestamps: true }
);

export const Post = model<IPost>("Post", postSchema);