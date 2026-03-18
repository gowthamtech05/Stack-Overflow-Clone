import Post from "../models/Post.js";
import User from "../models/User.js";
import Notification from "../models/notificationModel.js";
import cloudinary from "../config/cloudinary.js";

function getPostLimit(friendCount) {
  if (friendCount === 0) return 0;
  if (friendCount === 1) return 1;
  if (friendCount === 2) return 2;
  if (friendCount > 10) return Infinity;
  return Math.min(friendCount, 5);
}

export const getPostLimitStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friendCount = user.friends?.length || 0;
    const limit = getPostLimit(friendCount);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const usedToday = await Post.countDocuments({
      user: user._id,
      createdAt: { $gte: startOfDay },
    });
    const remaining =
      limit === Infinity ? Infinity : Math.max(0, limit - usedToday);
    res.json({
      friendCount,
      limit: limit === Infinity ? "Unlimited" : limit,
      used: usedToday,
      remaining: remaining === Infinity ? "Unlimited" : remaining,
      canPost: remaining > 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name _id")
      .populate("comments.user", "name _id")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friendCount = user.friends?.length || 0;
    const limit = getPostLimit(friendCount);
    if (limit === 0)
      return res
        .status(403)
        .json({ message: "You need at least 1 friend to post." });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const usedToday = await Post.countDocuments({
      user: user._id,
      createdAt: { $gte: startOfDay },
    });
    if (limit !== Infinity && usedToday >= limit)
      return res.status(429).json({ message: "Daily post limit reached." });

    const { content } = req.body;
    let mediaUrl = null;
    let mediaType = null;
    if (req.file) {
      mediaUrl = req.file.path;
      mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }
    if (!content?.trim() && !mediaUrl)
      return res
        .status(400)
        .json({ message: "Post must have content or media." });

    const post = await Post.create({
      user: user._id,
      content: content?.trim() || "",
      mediaUrl,
      mediaType,
    });
    const populated = await Post.findById(post._id).populate(
      "user",
      "name _id",
    );
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "user",
      "name _id",
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
      if (post.user._id.toString() !== userId) {
        const liker = await User.findById(req.user._id);
        await Notification.create({
          user: post.user._id,
          message: `${liker.name} liked your post ❤️`,
          link: `/posts`,
        });
      }
    }

    await post.save();
    res.json({ likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim())
      return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await Post.findById(req.params.id).populate(
      "user",
      "name _id",
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();

    if (post.user._id.toString() !== req.user._id.toString()) {
      const commenter = await User.findById(req.user._id);
      await Notification.create({
        user: post.user._id,
        message: `${commenter.name} commented on your post 💬`,
        link: `/posts`,
      });
    }

    const updated = await Post.findById(post._id)
      .populate("user", "name _id")
      .populate("comments.user", "name _id");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (post.mediaUrl) {
      try {
        const publicId = post.mediaUrl.split("/").slice(-1)[0].split(".")[0];
        await cloudinary.uploader.destroy(`stackoverflow_posts/${publicId}`, {
          resource_type: post.mediaType === "video" ? "video" : "image",
        });
      } catch (e) {
        console.error("Cloudinary delete error:", e.message);
      }
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.comments = post.comments.filter(
      (c) => c._id.toString() !== req.params.commentId,
    );
    await post.save();

    const updated = await Post.findById(post._id)
      .populate("user", "name _id")
      .populate("comments.user", "name _id");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
