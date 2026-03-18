import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [friendStatus, setFriendStatus] = useState("none");
  const [mutualFriends, setMutualFriends] = useState([]);
  const [transferPoints, setTransferPoints] = useState("");
  const [transferMsg, setTransferMsg] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id, currentUser]);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get(`/users/${id}`);
      setUser(data.user);
      if (!currentUser || currentUser._id === id) return;
      const [friendsRes, requestsRes, mutualRes] = await Promise.all([
        API.get("/friends"),
        API.get("/friends/requests"),
        API.get(`/friends/mutual/${id}`),
      ]);
      const isFriend = friendsRes.data.some((f) => f._id === id);
      const receivedRequest = requestsRes.data.some((r) => r._id === id);
      const sentRequest = data.user.friendRequests?.includes(currentUser._id);
      if (isFriend) setFriendStatus("friends");
      else if (receivedRequest) setFriendStatus("request_received");
      else if (sentRequest) setFriendStatus("request_sent");
      else setFriendStatus("none");
      setMutualFriends(mutualRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendRequest = async () => {
    try {
      await API.post(`/friends/request/${id}`);
      setFriendStatus("request_sent");
    } catch (err) {
      alert(err.response?.data?.message || "Error sending request");
    }
  };

  const handleAccept = async () => {
    try {
      await API.post(`/friends/accept/${id}`);
      setFriendStatus("friends");
    } catch (err) {
      alert(err.response?.data?.message || "Error accepting");
    }
  };

  const handleReject = async () => {
    try {
      await API.post(`/friends/reject/${id}`);
      setFriendStatus("none");
    } catch (err) {
      alert(err.response?.data?.message || "Error rejecting");
    }
  };

  const handleRemove = async () => {
    try {
      await API.delete(`/friends/${id}`);
      setFriendStatus("none");
      setMutualFriends([]);
    } catch (err) {
      alert(err.response?.data?.message || "Error removing");
    }
  };

  const handleTransfer = async () => {
    setTransferMsg("");
    setTransferError("");
    const pts = parseInt(transferPoints);
    if (!pts || pts <= 0) return setTransferError("Enter a valid amount.");
    if ((currentUser?.points || 0) <= 10)
      return setTransferError("You need more than 10 points to transfer.");
    if (pts > (currentUser?.points || 0) - 10)
      return setTransferError(
        `Max transferable: ${(currentUser?.points || 0) - 10} pts.`,
      );
    try {
      setTransferring(true);
      await API.post("/users/transfer-points", { toUserId: id, points: pts });
      setTransferMsg(`✅ Successfully sent ${pts} points to ${user.name}!`);
      setTransferPoints("");
      fetchProfile();
    } catch (err) {
      setTransferError(err.response?.data?.message || "Transfer failed.");
    } finally {
      setTransferring(false);
    }
  };

  if (!user)
    return (
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const isOwnProfile = currentUser?._id === user._id;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-2xl font-bold uppercase shrink-0">
            {user.name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.name}
              </h1>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${
                  user.subscriptionPlan === "Gold"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
                    : user.subscriptionPlan === "Silver"
                      ? "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                      : user.subscriptionPlan === "Bronze"
                        ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
                        : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                }`}
              >
                {user.subscriptionPlan || "Free"} Plan
              </span>
            </div>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Member since {new Date(user.createdAt).toDateString()}
            </p>

            <div className="flex flex-wrap gap-5 mt-4">
              {[
                {
                  label: "Reputation",
                  value: `▲ ${user.points ?? 0}`,
                  color: "text-yellow-500",
                },
                { label: "Questions", value: user.questionsCount ?? 0 },
                { label: "Answers", value: user.answersCount ?? 0 },
                {
                  label: "Accepted",
                  value: user.acceptedCount ?? 0,
                  color: "text-green-500",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p
                    className={`text-lg font-bold ${color || "text-gray-900 dark:text-white"}`}
                  >
                    {value}
                  </p>
                  <p className="text-[11px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {currentUser && !isOwnProfile && (
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 flex gap-2 flex-wrap">
            {friendStatus === "friends" && (
              <button
                onClick={handleRemove}
                className="px-4 py-1.5 rounded-xl bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 text-[13px] font-medium transition-colors"
              >
                Unfriend
              </button>
            )}
            {friendStatus === "none" && (
              <button
                onClick={handleSendRequest}
                className="px-4 py-1.5 rounded-xl bg-orange-500 text-white hover:bg-orange-400 text-[13px] font-semibold transition-colors"
              >
                + Add Friend
              </button>
            )}
            {friendStatus === "request_sent" && (
              <span className="px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 text-[13px]">
                Request Sent
              </span>
            )}
            {friendStatus === "request_received" && (
              <>
                <button
                  onClick={handleAccept}
                  className="px-4 py-1.5 rounded-xl bg-green-500 text-white hover:bg-green-600 text-[13px] font-semibold transition-colors"
                >
                  Accept Request
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 text-[13px] transition-colors"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {currentUser && !isOwnProfile && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1">
            Transfer Points
          </h3>
          <p className="text-[12px] text-gray-400 mb-4">
            You have{" "}
            <span className="text-yellow-500 font-semibold">
              ▲ {currentUser?.points ?? 0} pts
            </span>
            .
            {(currentUser?.points || 0) > 10
              ? ` You can send up to ${(currentUser?.points || 0) - 10} pts.`
              : " You need more than 10 points to transfer."}
          </p>
          {(currentUser?.points || 0) <= 10 ? (
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 text-[13px] text-orange-600 dark:text-orange-400">
              ⚠️ Earn more points by answering questions to unlock transfers.
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                value={transferPoints}
                onChange={(e) => setTransferPoints(e.target.value)}
                placeholder={`Max ${(currentUser?.points || 0) - 10}`}
                min={1}
                max={(currentUser?.points || 0) - 10}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-orange-400 transition-colors"
              />
              <button
                onClick={handleTransfer}
                disabled={transferring || !transferPoints}
                className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap"
              >
                {transferring ? "Sending..." : `Send to ${user.name}`}
              </button>
            </div>
          )}
          {transferError && (
            <p className="mt-2 text-[12px] text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
              ⚠️ {transferError}
            </p>
          )}
          {transferMsg && (
            <p className="mt-2 text-[12px] text-green-600 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
              {transferMsg}
            </p>
          )}
        </div>
      )}
      {!isOwnProfile && mutualFriends.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">
            {mutualFriends.length} Mutual Friend
            {mutualFriends.length > 1 ? "s" : ""}
          </h3>
          <div className="flex flex-wrap gap-2">
            {mutualFriends.map((f) => (
              <Link
                key={f._id}
                to={`/profile/${f._id}`}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-full text-[13px] hover:border-orange-200 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {f.name[0].toUpperCase()}
                </span>
                {f.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {friendStatus === "friends" && user.friends?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-[14px] font-bold text-gray-900 dark:text-white mb-3">
            {user.name}'s Friends
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.friends.map((f) => (
              <Link
                key={f._id || f}
                to={`/profile/${f._id || f}`}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-full text-[13px] hover:border-orange-200 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {(f.name || "?")[0].toUpperCase()}
                </span>
                {f.name || f}
              </Link>
            ))}
          </div>
        </div>
      )}


      {isOwnProfile && user?.loginHistory?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-[14px] font-bold text-gray-800 dark:text-white mb-3">
            🔐 Login History
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {user.loginHistory.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-[12px]"
              >
                <span className="text-lg shrink-0">
                  {entry.device === "Mobile"
                    ? "📱"
                    : entry.device === "Tablet"
                      ? "📟"
                      : "🖥️"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {entry.browser}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-gray-400">{entry.os}</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span
                      className={`font-medium ${entry.device === "Mobile" ? "text-blue-500" : entry.device === "Tablet" ? "text-purple-500" : "text-green-500"}`}
                    >
                      {entry.device}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-0.5 text-gray-400">
                    <span>IP: {entry.ip}</span>
                    <span>·</span>
                    <span>{new Date(entry.time).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
