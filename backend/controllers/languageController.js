import User from "../models/User.js";
import { sendOTPEmail } from "../utils/sendEmail.js";

export const requestLanguageChange = async (req, res) => {
  try {
    const { language } = req.body;
    const user = await User.findById(req.user._id);

    const supportedLanguages = [
      "English",
      "Spanish",
      "Hindi",
      "Portuguese",
      "Chinese",
      "French",
    ];
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.languageOTP = otp;
    user.languageOTPExpiry = new Date(Date.now() + 10 * 60000);
    await user.save();

    if (language === "French") {
      await sendOTPEmail(user.email, `Your OTP for language change is: ${otp}`);
    } else {
      console.log(`OTP for ${language} sent to mobile: ${otp}`);
    }

    res.json({ message: "OTP sent for language verification" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyLanguageOTP = async (req, res) => {
  try {
    const { language, otp } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.languageOTP || user.languageOTPExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired or not generated" });
    }

    if (parseInt(otp) !== user.languageOTP) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.preferredLanguage = language;
    user.languageOTP = null;
    user.languageOTPExpiry = null;
    await user.save();

    res.json({ message: `Language changed to ${language}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
