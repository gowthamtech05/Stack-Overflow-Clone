import express from "express";
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getMutualFriends,
} from "../controllers/friendController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getFriends);
router.get("/requests", protect, getFriendRequests);
router.post("/request/:id", protect, sendFriendRequest);
router.post("/accept/:id", protect, acceptFriendRequest);
router.post("/reject/:id", protect, rejectFriendRequest);

router.get("/mutual/:id", protect, getMutualFriends);
router.delete("/:id", protect, removeFriend);

export default router;
