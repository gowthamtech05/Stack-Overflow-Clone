import User from "../models/User.js";
import Notification from "../models/notificationModel.js";

export const getFriends = async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "friends",
    "name points",
  );
  res.json(user.friends);
};

export const getFriendRequests = async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "friendRequests",
    "name points",
  );
  res.json(user.friendRequests);
};
export const sendFriendRequest = async (req, res) => {
  const sender = await User.findById(req.user._id);
  const receiver = await User.findById(req.params.id);

  if (!receiver) return res.status(404).json({ message: "User not found" });
  if (receiver._id.equals(sender._id))
    return res.status(400).json({ message: "Cannot add yourself" });
  if (sender.friends.includes(receiver._id))
    return res.status(400).json({ message: "Already friends" });
  if (receiver.friendRequests.includes(sender._id))
    return res.status(400).json({ message: "Request already sent" });

  receiver.friendRequests.push(sender._id);
  await receiver.save();
  await Notification.create({
    user: receiver._id,
    message: `${sender.name} sent you a friend request 👋`,
    link: `/profile/${sender._id}`,
  });

  res.json({ message: "Friend request sent" });
};

export const acceptFriendRequest = async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  const requester = await User.findById(req.params.id);

  if (!requester) return res.status(404).json({ message: "User not found" });
  if (!currentUser.friendRequests.includes(requester._id))
    return res.status(400).json({ message: "No request from this user" });

  currentUser.friendRequests = currentUser.friendRequests.filter(
    (id) => !id.equals(requester._id),
  );
  currentUser.friends.push(requester._id);
  requester.friends.push(currentUser._id);

  await currentUser.save();
  await requester.save();
  await Notification.create({
    user: requester._id,
    message: `${currentUser.name} accepted your friend request 🎉`,
    link: `/profile/${currentUser._id}`,
  });

  res.json({ message: "Friend request accepted" });
};

export const rejectFriendRequest = async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  const requester = await User.findById(req.params.id);

  currentUser.friendRequests = currentUser.friendRequests.filter(
    (id) => id.toString() !== req.params.id,
  );
  await currentUser.save();
  if (requester) {
    await Notification.create({
      user: requester._id,
      message: `${currentUser.name} declined your friend request`,
      link: `/friends`,
    });
  }

  res.json({ message: "Friend request rejected" });
};
export const removeFriend = async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  const otherUser = await User.findById(req.params.id);

  if (!otherUser) return res.status(404).json({ message: "User not found" });

  currentUser.friends = currentUser.friends.filter(
    (id) => id.toString() !== req.params.id,
  );
  otherUser.friends = otherUser.friends.filter(
    (id) => id.toString() !== req.user._id.toString(),
  );

  await currentUser.save();
  await otherUser.save();

  res.json({ message: "Friend removed" });
};

export const getMutualFriends = async (req, res) => {
  const currentUser = await User.findById(req.user._id).populate(
    "friends",
    "_id name points",
  );
  const otherUser = await User.findById(req.params.id).populate(
    "friends",
    "_id name points",
  );

  const currentIds = new Set(currentUser.friends.map((f) => f._id.toString()));
  const mutual = otherUser.friends.filter((f) =>
    currentIds.has(f._id.toString()),
  );

  res.json(mutual);
};
