import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import { sendPasswordResetEmail, sendOTPEmail } from "../utils/sendEmail.js";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

function parseUA(req) {
  const parser = new UAParser(req.headers["user-agent"]);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown";
  const os = result.os.name || "Unknown";

  const deviceType = result.device.type;
  let device = "Desktop";
  if (deviceType === "mobile") device = "Mobile";
  else if (deviceType === "tablet") device = "Tablet";
  else if (
    os?.toLowerCase().includes("windows") ||
    os?.toLowerCase().includes("mac")
  )
    device = "Desktop";

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "Unknown";

  return { browser, os, device, ip };
}

function isMobileTimeAllowed() {
  const now = new Date();
  const istHour = parseInt(
    now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }),
  );
  return istHour >= 10 && istHour < 13;
}

function isChrome(browser) {
  return (
    browser?.toLowerCase().includes("chrome") &&
    !browser?.toLowerCase().includes("edge") &&
    !browser?.toLowerCase().includes("opr")
  );
}

function isMicrosoft(browser) {
  return (
    browser?.toLowerCase().includes("edge") ||
    browser?.toLowerCase().includes("ie") ||
    browser?.toLowerCase().includes("internet explorer")
  );
}

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { browser, os, device, ip } = parseUA(req);

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    if (device === "Mobile" && !isMobileTimeAllowed()) {
      return res.status(403).json({
        message: "Mobile login is only allowed between 10:00 AM – 1:00 PM IST.",
      });
    }

    if (isChrome(browser)) {
      const otp = Math.floor(100000 + Math.random() * 900000);
      user.loginOTP = otp;
      user.loginOTPExpiry = new Date(Date.now() + 10 * 60000);
      user.pendingLoginData = { browser, os, device, ip };
      await user.save();

      await sendOTPEmail(user.email, "Login OTP", otp);

      return res.status(200).json({
        requireOTP: true,
        email: user.email,
        message: "OTP sent to your email. Please verify to complete login.",
      });
    }

    user.loginHistory.unshift({ browser, os, device, ip, time: new Date() });
    if (user.loginHistory.length > 20)
      user.loginHistory = user.loginHistory.slice(0, 20);
    await user.save();

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      points: user.points,
      phone: user.phone,
      subscriptionPlan: user.subscriptionPlan,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.loginOTP || user.loginOTPExpiry < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please login again." });
    }

    if (parseInt(otp) !== user.loginOTP) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    const { browser, os, device, ip } = user.pendingLoginData || {};
    user.loginHistory.unshift({ browser, os, device, ip });
    if (user.loginHistory.length > 20)
      user.loginHistory = user.loginHistory.slice(0, 20);
    user.loginOTP = null;
    user.loginOTPExpiry = null;
    user.pendingLoginData = null;
    await user.save();

    const token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      points: user.points,
      phone: user.phone,
      subscriptionPlan: user.subscriptionPlan,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logoutUser = (req, res) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
  res.json({ message: "Logged out" });
};

export const getMe = async (req, res) => {
  res.json(req.user);
};
export const forgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone)
      return res.status(400).json({ message: "Email or phone is required." });

    const query = email ? { email } : { phone };
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found." });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (
      user.forgotPasswordRequestedAt &&
      user.forgotPasswordRequestedAt >= today
    ) {
      return res
        .status(400)
        .json({ message: "You can use this option only one time per day." });
    }

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const newPassword = Array.from({ length: 8 }, () =>
      letters.charAt(Math.floor(Math.random() * letters.length)),
    ).join("");

    user.password = await bcrypt.hash(newPassword, 10);
    user.forgotPasswordRequestedAt = new Date();
    await user.save();

    if (email) {
      await sendPasswordResetEmail(
        user.email,
        `Your new password is: ${newPassword}`,
      );
    }

    res.json({ message: "New password has been sent to your email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
