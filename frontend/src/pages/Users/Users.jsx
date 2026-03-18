import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await API.get("/users");
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] text-orange-500 uppercase tracking-widest mb-0.5">
            Directory
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            {users.length} members
          </p>
        </div>
      </div>
      <div className="relative mb-6">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search users by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-[13px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <p className="text-3xl mb-3">👤</p>
          <p className="text-[13px] text-gray-400">
            No users found for "{search}"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((u) => (
            <div
              key={u._id}
              onClick={() => navigate(`/profile/${u._id}`)}
              className="group flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5 cursor-pointer hover:border-orange-200 dark:hover:border-gray-700 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm uppercase shrink-0">
                {u.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                  {u.name}
                  {u._id === user?._id && (
                    <span className="ml-2 text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-yellow-600 font-medium">
                    ▲ {u.points ?? 0} pts
                  </span>
                  {u.subscriptionPlan && u.subscriptionPlan !== "Free" && (
                    <span className="text-[10px] bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-full border border-yellow-200 dark:border-yellow-800">
                      {u.subscriptionPlan === "Gold"
                        ? "🥇"
                        : u.subscriptionPlan === "Silver"
                          ? "🥈"
                          : "🥉"}{" "}
                      {u.subscriptionPlan}
                    </span>
                  )}
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
