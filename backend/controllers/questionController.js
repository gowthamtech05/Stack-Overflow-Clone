import Question from "../models/Question.js";
import User from "../models/User.js";
import Answer from "../models/Answer.js";

export const askQuestion = async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    const user = await User.findById(req.user._id);

    // Check subscription expiry
    if (user.subscriptionExpiry && user.subscriptionExpiry < new Date()) {
      user.subscriptionPlan = "Free";
      user.subscriptionExpiry = null;
      await user.save();
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await Question.countDocuments({
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

    if (todayCount >= limit) {
      return res.status(400).json({
        message: `Daily limit reached for ${user.subscriptionPlan} plan`,
      });
    }

    const question = await Question.create({
      title,
      description,
      user: user._id,
      tags,
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuestions = async (req, res) => {
  try {
    const { search = "", page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const query = search ? { title: { $regex: search, $options: "i" } } : {};

    const questions = await Question.find(query)
      .populate("user", "name points")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Question.countDocuments(query);
    const questionsWithCounts = await Promise.all(
      questions.map(async (q) => {
        const answerCount = await Answer.countDocuments({ question: q._id });
        const acceptedAnswer = await Answer.exists({
          question: q._id,
          isAccepted: true,
        });
        return {
          ...q.toObject(),
          answerCount,
          hasAccepted: !!acceptedAnswer,
        };
      }),
    );

    res.json({
      questions: questionsWithCounts,
      total,
      pages: Math.ceil(total / limit),
      page: Number(page),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const voteQuestion = async (req, res) => {
  try {
    const { type } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    if (question.user.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot vote your own question" });
    }

    const userId = req.user._id.toString();
    const alreadyUpvoted = question.upvotes.map(String).includes(userId);
    const alreadyDownvoted = question.downvotes.map(String).includes(userId);

    question.upvotes = question.upvotes.filter(
      (id) => id.toString() !== userId,
    );
    question.downvotes = question.downvotes.filter(
      (id) => id.toString() !== userId,
    );

    if (type === "upvote") {
      if (!alreadyUpvoted) {
        question.upvotes.push(req.user._id);
      }
    } else if (type === "downvote") {
      if (!alreadyDownvoted) {
        question.downvotes.push(req.user._id);
      }
    }

    await question.save();

    res.json({
      upvotes: question.upvotes.length,
      downvotes: question.downvotes.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSingleQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate(
      "user",
      "name points",
    );

    if (!question)
      return res.status(404).json({ message: "Question not found" });

    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDailyLimitStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await Question.countDocuments({
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
      used: todayCount,
      limit,
      remaining: limit === Infinity ? "Unlimited" : limit - todayCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    if (question.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Answer.deleteMany({ question: question._id });

    await question.deleteOne();
    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
