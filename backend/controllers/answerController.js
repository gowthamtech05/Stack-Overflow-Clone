import Answer from "../models/Answer.js";
import Question from "../models/Question.js";
import User from "../models/User.js";
import Notification from "../models/notificationModel.js";

export const postAnswer = async (req, res) => {
  try {
    const { content } = req.body;
    const questionId = req.params.questionId;

    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    const answer = await Answer.create({
      question: questionId,
      user: req.user._id,
      content,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 5 } });

    if (question.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: question.user,
        message: `${req.user.name} answered your question`,
        link: `/question/${question._id}`,
      });
    }

    const populated = await Answer.findById(answer._id).populate(
      "user",
      "name points",
    );
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const voteAnswer = async (req, res) => {
  try {
    const { type } = req.body;

    const answer = await Answer.findById(req.params.id).populate("user");
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    if (answer.user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot vote your own answer" });
    }

    const userId = req.user._id.toString();
    const alreadyUpvoted = answer.upvotes.map(String).includes(userId);
    const alreadyDownvoted = answer.downvotes.map(String).includes(userId);

    answer.upvotes = answer.upvotes.filter((id) => id.toString() !== userId);
    answer.downvotes = answer.downvotes.filter(
      (id) => id.toString() !== userId,
    );

    let pointsDelta = 0;

    if (type === "upvote") {
      if (!alreadyUpvoted) {
        answer.upvotes.push(req.user._id);
        pointsDelta += 1;
        if (alreadyDownvoted) pointsDelta += 2;
        if (answer.upvotes.length === 5 && !answer.bonusGiven) {
          pointsDelta += 5;
          answer.bonusGiven = true;
        }
        await Notification.create({
          user: answer.user._id,
          message: `${req.user.name} upvoted your answer`,
          link: `/question/${answer.question}`,
        });
      } else {
        pointsDelta -= 1;
      }
    } else if (type === "downvote") {
      if (!alreadyDownvoted) {
        answer.downvotes.push(req.user._id);
        pointsDelta -= 2;
        if (alreadyUpvoted) pointsDelta -= 1;

        await Notification.create({
          user: answer.user._id,
          message: `${req.user.name} downvoted your answer`,
          link: `/question/${answer.question}`,
        });
      } else {
        pointsDelta += 2;
      }
    }

    await answer.save();

    if (pointsDelta !== 0) {
      await User.findByIdAndUpdate(answer.user._id, {
        $inc: { points: pointsDelta },
      });
      await User.updateOne(
        { _id: answer.user._id, points: { $lt: 0 } },
        { $set: { points: 0 } },
      );
    }

    res.json({
      upvotes: answer.upvotes.length,
      downvotes: answer.downvotes.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptAnswer = async (req, res) => {
  try {
    const newAnswer = await Answer.findById(req.params.id);
    if (!newAnswer)
      return res.status(404).json({ message: "Answer not found" });

    const question = await Question.findById(newAnswer.question);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    if (question.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only question owner can accept answer" });
    }
    if (newAnswer.user.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot accept your own answer" });
    }

    const previouslyAccepted = await Answer.findOne({
      question: question._id,
      isAccepted: true,
      _id: { $ne: newAnswer._id },
    });

    if (
      previouslyAccepted &&
      previouslyAccepted.user.toString() !== newAnswer.user.toString()
    ) {
      await User.findByIdAndUpdate(previouslyAccepted.user, {
        $inc: { points: -15 },
      });
      await User.updateOne(
        { _id: previouslyAccepted.user, points: { $lt: 0 } },
        { $set: { points: 0 } },
      );
    }

    const sameUserWasAccepted =
      previouslyAccepted &&
      previouslyAccepted.user.toString() === newAnswer.user.toString();

    await Answer.updateMany({ question: question._id }, { isAccepted: false });

    newAnswer.isAccepted = true;
    await newAnswer.save();

    if (!sameUserWasAccepted) {
      await User.findByIdAndUpdate(newAnswer.user, { $inc: { points: 15 } });
    }

    await Notification.create({
      user: newAnswer.user,
      message: `${req.user.name} accepted your answer! +15 points`,
      link: `/question/${newAnswer.question}`,
    });

    res.json({ message: "Answer accepted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    if (answer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await User.findByIdAndUpdate(answer.user, { $inc: { points: -5 } });
    await User.updateOne(
      { _id: answer.user, points: { $lt: 0 } },
      { $set: { points: 0 } },
    );
    if (answer.isAccepted) {
      await User.findByIdAndUpdate(answer.user, { $inc: { points: -15 } });
      await User.updateOne(
        { _id: answer.user, points: { $lt: 0 } },
        { $set: { points: 0 } },
      );
    }

    await answer.deleteOne();
    res.json({ message: "Answer deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnswersByQuestion = async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const page = Number(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const answers = await Answer.find({ question: questionId })
      .populate("user", "name points")
      .sort({ isAccepted: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Answer.countDocuments({ question: questionId });

    res.json({
      answers,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
