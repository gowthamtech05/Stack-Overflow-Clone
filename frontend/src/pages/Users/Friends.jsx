import { useState, useEffect, useContext } from "react";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export default function Friends() {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [friendsRes, requestsRes, usersRes] = await Promise.all([
        API.get("/friends"),
        API.get("/friends/requests"),
        API.get("/users"),
      ]);
      const friendIds = new Set(friendsRes.data.map((f) => f._id));
      const requestIds = new Set(requestsRes.data.map((r) => r._id));
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
      setSuggestions(
        usersRes.data.filter(
          (u) =>
            user?._id &&
            u._id !== user._id &&
            !friendIds.has(u._id) &&
            !requestIds.has(u._id),
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const sendRequest = async (id) => {
    try {
      await API.post(`/friends/request/${id}`);
      setSentRequests((prev) => new Set(prev).add(id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    }
  };

  const acceptRequest = async (id) => {
    try {
      await API.post(`/friends/accept/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept");
    }
  };

  const rejectRequest = async (id) => {
    try {
      await API.post(`/friends/reject/${id}`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject");
    }
  };

  const removeFriend = async (id) => {
    try {
      await API.delete(`/friends/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove");
    }
  };

  if (!user)
    return (
      <div className="text-center py-24 text-gray-400 text-[13px]">
        Please log in to view friends.
      </div>
    );

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const UserCard = ({ person, avatarColor = "bg-orange-500", actions }) => (
    <div className="flex items-center justify-between gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold uppercase shrink-0 text-[13px]`}
        >
          {person.name?.[0]}
        </div>
        <div className="min-w-0">
          <Link
            to={`/profile/${person._id}`}
            className="text-[14px] font-semibold text-gray-900 dark:text-white hover:text-orange-500 transition-colors truncate block"
          >
            {person.name}
          </Link>
          <p className="text-[11px] text-yellow-600">
            ▲ {person.points ?? 0} pts
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">{actions}</div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {requests.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div>
              <p className="text-[11px] text-orange-500 uppercase tracking-widest mb-0.5">
                Incoming
              </p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Friend Requests
                <span className="text-[12px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">
                  {requests.length}
                </span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requests.map((r) => (
              <UserCard
                key={r._id}
                person={r}
                avatarColor="bg-orange-500"
                actions={
                  <>
                    <button
                      onClick={() => acceptRequest(r._id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(r._id)}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 px-3 py-1.5 rounded-xl text-[12px] transition-colors"
                    >
                      Reject
                    </button>
                  </>
                }
              />
            ))}
          </div>
        </section>
      )}
      <section>
        <div className="mb-4">
          <p className="text-[11px] text-orange-500 uppercase tracking-widest mb-0.5">
            Connected
          </p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Your Friends{" "}
            <span className="text-gray-400 text-base font-normal">
              ({friends.length})
            </span>
          </h2>
        </div>
        {friends.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <p className="text-2xl mb-3">👋</p>
            <p className="text-[13px] text-gray-400">
              No friends yet. Start adding some below!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friends.map((f) => (
              <UserCard
                key={f._id}
                person={f}
                avatarColor="bg-blue-500"
                actions={
                  <button
                    onClick={() => removeFriend(f._id)}
                    className="bg-red-50 dark:bg-red-900/10 text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-100 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors"
                  >
                    Unfriend
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>
      <section>
        <div className="mb-4">
          <p className="text-[11px] text-orange-500 uppercase tracking-widest mb-0.5">
            Discover
          </p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            People You May Know
          </h2>
        </div>
        {suggestions.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <p className="text-2xl mb-3">🔍</p>
            <p className="text-[13px] text-gray-400">
              No suggestions right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((u) => (
              <UserCard
                key={u._id}
                person={u}
                avatarColor="bg-purple-500"
                actions={
                  sentRequests.has(u._id) ? (
                    <span className="text-[12px] text-gray-400 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl">
                      Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => sendRequest(u._id)}
                      className="bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors"
                    >
                      + Add
                    </button>
                  )
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
