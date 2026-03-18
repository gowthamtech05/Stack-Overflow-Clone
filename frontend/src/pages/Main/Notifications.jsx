import { useEffect, useState } from "react";
import API from "../../api/axios";
import { Link } from "react-router-dom";

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const getIcon = (message = "") => {
  if (message.includes("upvoted")) return "⬆️";
  if (message.includes("downvoted")) return "⬇️";
  if (message.includes("accepted")) return "✅";
  if (message.includes("answered")) return "💬";
  if (message.includes("sent you")) return "💰";
  if (message.includes("transferred")) return "💸";
  if (message.includes("language")) return "🌐";
  if (message.includes("friend request")) return "👋";
  if (message.includes("accepted your friend")) return "🎉";
  return "🔔";
};

const getType = (message = "") => {
  if (message.includes("upvoted")) return "upvote";
  if (message.includes("downvoted")) return "downvote";
  if (message.includes("accepted")) return "accept";
  if (message.includes("friend")) return "friend";
  if (message.includes("points")) return "points";
  return "default";
};

const TYPE_COLORS = {
  upvote: {
    dot: "bg-green-500",
    ring: "ring-green-500/20",
    text: "text-green-400",
  },
  downvote: {
    dot: "bg-red-500",
    ring: "ring-red-500/20",
    text: "text-red-400",
  },
  accept: {
    dot: "bg-yellow-500",
    ring: "ring-yellow-500/20",
    text: "text-yellow-400",
  },
  friend: {
    dot: "bg-blue-500",
    ring: "ring-blue-500/20",
    text: "text-blue-400",
  },
  points: {
    dot: "bg-purple-500",
    ring: "ring-purple-500/20",
    text: "text-purple-400",
  },
  default: {
    dot: "bg-gray-500",
    ring: "ring-gray-500/20",
    text: "text-gray-400",
  },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get("/notifications");
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await API.put("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-mono text-orange-500 uppercase tracking-widest mb-1">
            inbox
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[12px] font-mono text-gray-400 hover:text-orange-500 transition-colors"
            >
              mark all read
            </button>
          )}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {["all", "unread"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-[12px] font-mono transition-colors ${
                  filter === f
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                {f}
                {f === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-mono text-gray-400 text-[13px]">
            {filter === "unread"
              ? "no unread notifications"
              : "notifications empty"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const type = getType(n.message);
            const colors = TYPE_COLORS[type];
            return (
              <div
                key={n._id}
                onClick={() => !n.read && markRead(n._id)}
                className={`group flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  n.read
                    ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                    : `bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 ring-1 ${colors.ring}`
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                    n.read
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  {getIcon(n.message)}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[14px] leading-snug ${
                      n.read
                        ? "text-gray-500 dark:text-gray-400"
                        : "text-gray-900 dark:text-white font-medium"
                    }`}
                  >
                    {n.message}
                  </p>
                  <p className="text-[11px] font-mono text-gray-400 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && (
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  )}
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 text-[11px] font-mono text-orange-500 hover:text-orange-400 transition-all"
                    >
                      view →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
