import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import API from "../../api/axios";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q.trim()) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/users?search=${q}`);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [q]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-[11px] text-orange-500 uppercase tracking-widest mb-0.5">
          Search
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Results
        </h1>
        <p className="text-[13px] text-gray-400 mt-0.5">
          {loading
            ? "Searching..."
            : `${results.length} result${results.length !== 1 ? "s" : ""} for "${q}"`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-[13px] text-gray-400">
            No users found for "
            <strong className="text-gray-600 dark:text-gray-300">{q}</strong>"
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((u) => (
            <Link
              key={u._id}
              to={`/profile/${u._id}`}
              className="group flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 hover:border-orange-200 dark:hover:border-gray-700 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold uppercase shrink-0">
                {u.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">
                  {u.name}
                </p>
                <p className="text-[12px] text-yellow-600">
                  ▲ {u.points ?? 0} reputation
                </p>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
