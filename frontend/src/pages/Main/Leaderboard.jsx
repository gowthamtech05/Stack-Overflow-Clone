import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const MEDALS = ["🥇", "🥈", "🥉"];

const getRankLabel = (index) => (index < 3 ? MEDALS[index] : `#${index + 1}`);

const RANK_COLORS = [
  {
    bar: "bg-yellow-400",
    text: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/10",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  {
    bar: "bg-gray-400",
    text: "text-gray-500",
    bg: "bg-gray-50 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
  },
  {
    bar: "bg-orange-400",
    text: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/10",
    border: "border-orange-200 dark:border-orange-800",
  },
];

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await API.get("/users/leaderboard");
        setUsers(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };
    fetchLeaderboard();
  }, []);

  const myRankIndex = users.findIndex((u) => u._id === user?._id);
  const me = users[myRankIndex];
  const maxPoints = users[0]?.points || 1;

  return (
    <>
      <div className="max-w-2xl mx-auto pb-24">
        <div className="mb-8">
          <p className="text-[11px] font-mono text-orange-500 uppercase tracking-widest mb-1">
            rankings
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leaderboard
          </h1>
        </div>

        {users.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[users[1], users[0], users[2]].map((u, i) => {
              const realIndex = i === 0 ? 1 : i === 1 ? 0 : 2;
              const colors = RANK_COLORS[realIndex];
              const isMe = u._id === user?._id;
              return (
                <div
                  key={u._id}
                  className={`relative flex flex-col items-center p-4 rounded-2xl border ${colors.bg} ${colors.border} ${
                    realIndex === 0 ? "mt-0" : "mt-6"
                  } ${isMe ? "ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-900" : ""}`}
                >
                  <div className={`w-2 h-2 rounded-full ${colors.bar} mb-3`} />
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
                    {u.name[0].toUpperCase()}
                  </div>
                  <p className="text-[13px] font-semibold text-gray-800 dark:text-white text-center truncate w-full">
                    {u.name}
                  </p>
                  <p
                    className={`text-[12px] font-mono font-bold ${colors.text} mt-1`}
                  >
                    {u.points} pts
                  </p>
                  <p className="text-[18px] mt-1">{MEDALS[realIndex]}</p>
                  {isMe && (
                    <span className="absolute -top-2 -right-2 text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-mono">
                      you
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-2">
          {users.map((u, index) => {
            const isMe = u._id === user?._id;
            const widthPct = Math.round((u.points / maxPoints) * 100);

            return (
              <div
                key={u._id}
                className={`relative flex items-center gap-4 px-4 py-3 rounded-xl border overflow-hidden transition-all ${
                  isMe
                    ? "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                }`}
              >
                <div
                  className={`absolute inset-0 opacity-5 ${isMe ? "bg-orange-500" : "bg-blue-500"}`}
                  style={{ width: `${widthPct}%` }}
                />

                <span className="font-mono text-[13px] text-gray-400 w-8 shrink-0 text-center z-10">
                  {getRankLabel(index)}
                </span>

                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[13px] font-bold text-gray-600 dark:text-gray-300 shrink-0 z-10">
                  {u.name[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0 z-10">
                  <p
                    className={`text-[14px] font-medium truncate ${isMe ? "text-orange-600 dark:text-orange-400" : "text-gray-800 dark:text-gray-100"}`}
                  >
                    {u.name}
                    {isMe && (
                      <span className="ml-2 text-[10px] font-mono bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                        you
                      </span>
                    )}
                  </p>
                </div>

                <span
                  className={`font-mono text-[13px] font-bold shrink-0 z-10 ${isMe ? "text-orange-500" : "text-gray-400 dark:text-gray-500"}`}
                >
                  {u.points} pts
                </span>
              </div>
            );
          })}
        </div>

        {user && !me && (
          <p className="text-center font-mono text-[12px] text-gray-400 mt-8">
            // answer questions to appear on the leaderboard
          </p>
        )}
      </div>

      {user && me && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 py-3">
            <div className="max-w-screen-xl mx-auto flex px-6">
              <div className="hidden md:block w-48 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                  </span>
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">
                    your rank
                  </span>
                  <span className="text-[15px] font-bold text-gray-900 dark:text-white">
                    {getRankLabel(myRankIndex)}
                  </span>
                  <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">
                    {me.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-orange-500 text-[14px] bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-lg border border-orange-200 dark:border-orange-800">
                  {me.points} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
