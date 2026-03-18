import nodemailer from "nodemailer";
import razorpay from "../config/razorpay.js";
import Payment from "../models/Payment.js";
import Question from "../models/Question.js";

import crypto from "crypto";
import User from "../models/User.js";

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    let paymentPlan = plan;
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (payment) {
      payment.status = "paid";
      payment.razorpayPaymentId = razorpay_payment_id;
      await payment.save();
      paymentPlan = payment.plan;
    }

    if (!paymentPlan) {
      return res.status(400).json({ message: "Plan not found" });
    }

    const user = await User.findById(req.user._id);
    user.subscriptionPlan = paymentPlan;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    user.subscriptionExpiry = expiry;
    await user.save();

    await sendInvoiceEmail(
      user.email,
      user.name,
      paymentPlan,
      payment?.amount || 0,
      razorpay_payment_id,
    );

    res.json({ message: `${paymentPlan} plan activated successfully!` });
  } catch (error) {
    console.error("Verify error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;

    const now = new Date();
    const hourIST = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    });

    if (hourIST < 10 || hourIST >= 11) {
      return res.status(400).json({
        message: "Payments allowed only between 10AM–11AM IST",
      });
    }

    const planPrices = {
      Bronze: 100,
      Silver: 300,
      Gold: 1000,
    };

    const amount = planPrices[plan];
    if (!amount) return res.status(400).json({ message: "Invalid plan" });

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    await Payment.create({
      user: req.user._id,
      plan,
      amount,
      razorpayOrderId: order.id,
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upgradeSubscription = async (req, res) => {
  try {
    const { plan, durationDays } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.subscriptionPlan = plan;
    const now = new Date();
    user.subscriptionExpiry = new Date(
      now.getTime() + durationDays * 24 * 60 * 60 * 1000,
    );

    await user.save();

    res.json({
      message: `Subscription upgraded to ${plan} for ${durationDays} days`,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiry: user.subscriptionExpiry,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (
      user.subscriptionExpiry &&
      new Date(user.subscriptionExpiry) < new Date()
    ) {
      user.subscriptionPlan = "Free";
      user.subscriptionExpiry = null;
      await user.save();
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const usedQuestions = await Question.countDocuments({
      user: user._id,
      createdAt: { $gte: startOfDay },
    });

    const limits = {
      Free: 1,
      Bronze: 5,
      Silver: 10,
      Gold: Infinity,
    };

    const limit = limits[user.subscriptionPlan] || 1;

    res.json({
      plan: user.subscriptionPlan,
      expiry: user.subscriptionExpiry,
      used: usedQuestions,
      limit: limit === Infinity ? "Unlimited" : limit,
      remaining:
        limit === Infinity ? "Unlimited" : Math.max(0, limit - usedQuestions),
    });
  } catch (error) {
    console.error("Subscription Status Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const subscribePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    user.subscriptionPlan = plan;
    user.subscriptionExpiry = expiry;
    await user.save();

    res.json({ message: `Subscribed to ${plan} plan`, expiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendInvoiceEmail = async (email, name, plan, amount, paymentId) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"StackOverflow Clone" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✅ Invoice - ${plan} Plan Subscription`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#3b82f6">Payment Successful 🎉</h2>
        <p>Hi <strong>${name}</strong>, your subscription has been activated.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <table style="width:100%;font-size:14px;color:#374151">
          <tr><td><strong>Plan</strong></td><td>${plan}</td></tr>
          <tr><td><strong>Amount</strong></td><td>₹${amount}</td></tr>
          <tr><td><strong>Payment ID</strong></td><td>${paymentId}</td></tr>
          <tr><td><strong>Date</strong></td><td>${new Date().toDateString()}</td></tr>
          <tr><td><strong>Valid Until</strong></td><td>${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toDateString()}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p style="font-size:12px;color:#9ca3af">Thank you for subscribing. Questions? Reply to this email.</p>
      </div>
    `,
  });
};
