import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    plan: String,
    amount: Number,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: {
      type: String,
      default: "created",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
