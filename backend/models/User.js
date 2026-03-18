import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema({
  browser: String,
  os: String,
  device: String,
  ip: String,
  time: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, trim: true, default: null },
    password: { type: String, required: true },
    points: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    subscriptionPlan: {
      type: String,
      enum: ["Free", "Bronze", "Silver", "Gold"],
      default: "Free",
    },
    subscriptionExpiry: { type: Date, default: null },
    forgotPasswordRequestedAt: { type: Date, default: null },
    preferredLanguage: { type: String, default: "English" },
    languageOTP: { type: Number, default: null },
    languageOTPExpiry: { type: Date, default: null },
    loginHistory: [loginHistorySchema],

    loginOTP: { type: Number, default: null },
    loginOTPExpiry: { type: Date, default: null },
    pendingLoginData: { type: Object, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
