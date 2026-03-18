import express from "express";
import {
  getAllUsers,
  getUserProfile,
  getLeaderboard,
  getUserQuestions,
  getUserAnswers,
  transferPoints,
  requestLanguageChange,
  verifyLanguageOTP,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllUsers);
router.get("/leaderboard", getLeaderboard);
router.post("/transfer-points", protect, transferPoints);
router.post("/request-language-change", protect, requestLanguageChange);
router.post("/verify-language-otp", protect, verifyLanguageOTP);

router.get("/:id", getUserProfile);
router.get("/:id/questions", getUserQuestions);
router.get("/:id/answers", getUserAnswers);

export default router;
