import express from "express";
import {
  postAnswer,
  voteAnswer,
  acceptAnswer,
  deleteAnswer,
  getAnswersByQuestion,
} from "../controllers/answerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:questionId", protect, postAnswer);
router.put("/:id/vote", protect, voteAnswer);
router.put("/:id/accept", protect, acceptAnswer);
router.delete("/:id", protect, deleteAnswer);
router.get("/:questionId", getAnswersByQuestion);

export default router;
