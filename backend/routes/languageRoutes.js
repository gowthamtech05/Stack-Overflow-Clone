import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  requestLanguageChange,
  verifyLanguageOTP,
} from "../controllers/languageController.js";

const router = express.Router();

router.post("/request", protect, requestLanguageChange);
router.post("/verify", protect, verifyLanguageOTP);

export default router;
