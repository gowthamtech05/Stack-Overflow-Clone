import express from "express";
import {
  getPosts,
  createPost,
  likePost,
  addComment,
  deletePost,
  deleteComment,
  getPostLimitStatus,
} from "../controllers/postController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/", getPosts);
router.get("/limit", protect, getPostLimitStatus);

router.post("/", protect, upload.single("media"), createPost);

router.post("/:id/like", protect, likePost);
router.post("/:id/comment", protect, addComment);
router.delete("/:id", protect, deletePost);
router.delete("/:id/comment/:commentId", protect, deleteComment);

export default router;
