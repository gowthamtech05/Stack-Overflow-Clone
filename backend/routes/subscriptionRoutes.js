import express from "express";
import {
  createOrder,
  verifyPayment,
  upgradeSubscription,
  getSubscriptionStatus,
  subscribePlan,
} from "../controllers/subscriptionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/status", protect, getSubscriptionStatus);
router.post("/create-order", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);
router.put("/upgrade", protect, upgradeSubscription);
router.post("/subscribe", protect, subscribePlan);

export default router;
