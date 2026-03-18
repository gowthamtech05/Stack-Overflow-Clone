import User from "../models/User.js";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
import Notification from "../models/notificationModel.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("friends", "name points");

    if (!user) return res.status(404).json({ message: "User not found" });
    const [questionsCount, answersCount, acceptedCount] = await Promise.all([
      Question.countDocuments({ user: user._id }),
      Answer.countDocuments({ user: user._id }),
      Answer.countDocuments({ user: user._id, isAccepted: true }),
    ]);

    res.json({
      user: {
        ...user.toObject(),
        questionsCount,
        answersCount,
        acceptedCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .select("name points")
      .sort({ points: -1 })
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ user: req.params.id }).sort({
      createdAt: -1,
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserAnswers = async (req, res) => {
  try {
    const answers = await Answer.find({ user: req.params.id })
      .populate("question", "title")
      .sort({ createdAt: -1 });
    res.json(answers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name points _id")
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const transferPoints = async (req, res) => {
  try {
    const { toUserId, points } = req.body;
    const pts = parseInt(points);

    if (!toUserId || !pts || pts <= 0)
      return res.status(400).json({ message: "Invalid transfer." });
    if (toUserId === req.user._id.toString())
      return res.status(400).json({ message: "Cannot transfer to yourself." });

    const sender = await User.findById(req.user._id);
    const receiver = await User.findById(toUserId);

    if (!receiver) return res.status(404).json({ message: "User not found." });
    if (sender.points <= 10)
      return res
        .status(403)
        .json({ message: "You need more than 10 points to transfer." });
    if (sender.points - pts < 10)
      return res
        .status(400)
        .json({ message: `Max transferable: ${sender.points - 10} pts.` });

    sender.points -= pts;
    receiver.points += pts;
    await sender.save();
    await receiver.save();

    await Notification.create({
      user: receiver._id,
      message: `${sender.name} sent you ${pts} points! 💰`,
      link: `/profile/${sender._id}`,
    });
    await Notification.create({
      user: sender._id,
      message: `You transferred ${pts} points to ${receiver.name}`,
      link: `/profile/${receiver._id}`,
    });

    res.json({ message: `Transferred ${pts} points to ${receiver.name}.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    const oldLanguage = user.preferredLanguage;
    user.preferredLanguage = language;
    user.languageOTP = null;
    user.languageOTPExpiry = null;
    await user.save();
    await Notification.create({
      user: user._id,
      message: `Your language was changed from ${oldLanguage} to ${language} 🌐`,
      link: `/profile/${user._id}`,
    });

    res.json({ message: `Language changed to ${language}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
    await sendOTPEmail(user.email, language, otp);

    res.json({ message: "OTP sent for language verification" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
