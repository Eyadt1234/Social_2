import { Router, type Request, type Response } from "express";
import { getAuth } from "../../middleware/authentication.js";
import { paginationSchema } from "../../utils/pagination.js";
import { successResponse } from "../../utils/response.js";
import * as commentService from "./comment.service.js";
import { commentParamSchema, createCommentSchema, postIdParamSchema, updateCommentSchema } from "./comment.validation.js";

//mergeParams lets us access :postId from the parent post router
const router = Router({ mergeParams: true });

//1: create a comment on a post
router.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = postIdParamSchema.parse(req.params);
  const data = createCommentSchema.parse(req.body);
  successResponse(res, "comment created", await commentService.createComment(postId, userId, data), 201);
});

//_________________________________________________________________________________//

//2: get all comments on a post
router.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = postIdParamSchema.parse(req.params);
  const query = paginationSchema.parse(req.query);
  successResponse(res, "comments fetched", await commentService.getPostComments(postId, userId, query));
});

//_________________________________________________________________________________//

//3: get a single comment
router.get("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  const { postId, id } = commentParamSchema.parse(req.params);
  successResponse(res, "comment fetched", await commentService.getComment(postId, id, userId));
});

//_________________________________________________________________________________//

//4: update a comment (PUT and PATCH do the same)
const update = async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  const { postId, id } = commentParamSchema.parse(req.params);
  const data = updateCommentSchema.parse(req.body);
  successResponse(res, "comment updated", await commentService.updateComment(postId, id, userId, data));
};

router.put("/:id", update);
router.patch("/:id", update);

//_________________________________________________________________________________//

//5: delete a comment
router.delete("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  const { postId, id } = commentParamSchema.parse(req.params);
  await commentService.deleteComment(postId, id, userId);
  successResponse(res, "comment deleted");
});

export default router;