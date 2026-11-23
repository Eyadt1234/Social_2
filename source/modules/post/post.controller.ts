import { Router, type Request, type Response } from "express";
import { authentication, getAuth } from "../../middleware/authentication.js";
import { successResponse } from "../../utils/response.js";
import * as postService from "./post.service.js";
import { createPostSchema, idParamSchema, postQuerySchema, updatePostSchema } from "./post.validation.js";
import commentRouter from "../comment/comment.controller.js";

const router = Router();

router.use(authentication);

//comments are nested under posts
router.use("/:postId/comments", commentRouter);

//1: create a post
router.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  const data = createPostSchema.parse(req.body);
  successResponse(res, "post created", await postService.createPost(userId, data), 201);
});

//_________________________________________________________________________________//

//2: get my posts
router.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  const query = postQuerySchema.parse(req.query);
  successResponse(res, "posts fetched", await postService.getMyPosts(userId, query));
});

//_________________________________________________________________________________//

//3: get a single post
router.get("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = idParamSchema.parse(req.params);
  successResponse(res, "post fetched", await postService.getPost(id, userId));
});

//_________________________________________________________________________________//

//4: update a post (PUT and PATCH do the same)
const update = async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  const { id } = idParamSchema.parse(req.params);
  const data = updatePostSchema.parse(req.body);
  successResponse(res, "post updated", await postService.updatePost(id, userId, data));
};

router.put("/:id", update);
router.patch("/:id", update);

//_________________________________________________________________________________//

//5: delete a post
router.delete("/:id", async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = idParamSchema.parse(req.params);
  await postService.deletePost(id, userId);
  successResponse(res, "post deleted");
});

export default router;