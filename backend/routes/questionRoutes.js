import express from "express";
import {
  askQuestion,
  getQuestions,
  voteQuestion,
  getSingleQuestion,
  getDailyLimitStatus,
  deleteQuestion,
} from "../controllers/questionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, askQuestion);
router.put("/:id/vote", protect, voteQuestion);
router.get("/limit-status", protect, getDailyLimitStatus);
router.get("/", getQuestions);
router.get("/:id", getSingleQuestion);
router.delete("/:id", protect, deleteQuestion);

export default router;
