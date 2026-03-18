import { useState } from "react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function PointsTransfer() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const { data } = await API.get(`/users?search=${searchQuery}`);
      setSearchResults(data.filter((u) => u._id !== user?._id));
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async () => {
    setError("");
    setSuccess("");
    if (!selectedUser) return setError("Select a user to transfer to.");
    const pts = parseInt(points);
    if (!pts || pts <= 0) return setError("Enter a valid point amount.");
    if ((user?.points || 0) <= 10)
      return setError("You need more than 10 points to transfer.");
    if (pts > (user?.points || 0) - 10)
      return setError(
        `You can transfer at most ${(user?.points || 0) - 10} points.`,
      );
    try {
      setLoading(true);
      await API.post("/users/transfer-points", {
        toUserId: selectedUser._id,
        points: pts,
      });
      setSuccess(
        `Successfully transferred ${pts} points to ${selectedUser.name}!`,
      );
      setPoints("");
      setSelectedUser(null);
      setSearchResults([]);
      setSearchQuery("");
    } catch (err) {
      setError(err.response?.data?.message || "Transfer failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const canTransfer = (user?.points || 0) > 10;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 max-w-lg">
      <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-1">
        Transfer Points
      </h3>
      <p className="text-[13px] text-gray-400 mb-5">
        You have{" "}
        <span className="text-yellow-500 font-semibold">
          ▲ {user.points ?? 0} pts
        </span>
        .
        {canTransfer
          ? ` Send up to ${(user.points || 0) - 10} pts.`
          : " Need more than 10 points."}
      </p>

      {!canTransfer ? (
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-[13px] text-orange-600 dark:text-orange-400">
          ⚠️ Earn more by answering questions to unlock transfers.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Find User
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-orange-400 transition-colors placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-[13px] transition-colors"
              >
                {searching ? "..." : "Search"}
              </button>
            </form>
          </div>

          {searchResults.length > 0 && (
            <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 max-h-48 overflow-y-auto">
              {searchResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => {
                    setSelectedUser(u);
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                    {u.name?.[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                      {u.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      ▲ {u.points} pts
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedUser && (
            <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                {selectedUser.name?.[0]}
              </div>
              <p className="text-[13px] font-semibold text-orange-700 dark:text-orange-400 flex-1">
                Sending to: {selectedUser.name}
              </p>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-orange-400 hover:text-orange-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Points to Transfer
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min={1}
              max={(user.points || 0) - 10}
              placeholder={`Max: ${Math.max(0, (user.points || 0) - 10)}`}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-orange-400 transition-colors placeholder-gray-400"
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
              ⚠️ {error}
            </p>
          )}
          {success && (
            <p className="text-[12px] text-green-600 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
              ✅ {success}
            </p>
          )}

          <button
            onClick={handleTransfer}
            disabled={loading || !selectedUser || !points}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
          >
            {loading ? "Transferring..." : "Transfer Points"}
          </button>
        </div>
      )}
    </div>
  );
}
