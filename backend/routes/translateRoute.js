import express from "express";
import { translateTexts } from "../controllers/translateController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", protect, translateTexts);

export default router;
