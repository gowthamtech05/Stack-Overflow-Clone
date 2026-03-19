import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useTranslateObject } from "../../hooks/useTranslate";

const QUESTION_FIELDS = ["title", "description"];

const TAG_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
];

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeTab, setActiveTab] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [limitStatus, setLimitStatus] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const tQuestions = useTranslateObject(questions, QUESTION_FIELDS);

  const fetchQuestions = async (p = page, s = search) => {
    try {
      setLoading(true);
      const { data } = await API.get(`/questions?search=${s}&page=${p}`);
      setQuestions(data.questions);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLimitStatus = async () => {
    if (!user) return;
    try {
      const { data } = await API.get("/questions/limit-status");
      setLimitStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuestions(page, search);
  }, [page]);
  useEffect(() => {
    fetchLimitStatus();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions(1, search);
  };

  const filteredQuestions = [...questions].filter((q) => {
    if (activeTab === "unanswered") return (q.answerCount || 0) === 0;
    if (activeTab === "active") return (q.answerCount || 0) > 0;
    return true;
  });

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] text-orange-500 uppercase tracking-widest mb-0.5">
              {search ? "Search Results" : "All Questions"}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {search ? `"${search}"` : "Questions"}
            </h1>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {total.toLocaleString()} total
            </p>
          </div>
          {user && (
            <Link
              to="/ask"
              className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
            >
              + Ask Question
            </Link>
          )}
        </div>

        {limitStatus && (
          <div
            className={`mb-5 px-4 py-3 rounded-xl border text-[13px] flex items-center justify-between ${
              limitStatus.remaining === 0
                ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400"
                : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
            }`}
          >
            <span>
              <span className="text-orange-500 font-bold">
                {limitStatus.plan}
              </span>
              {" · "}
              {limitStatus.remaining === "Unlimited"
                ? "Unlimited questions today"
                : `${limitStatus.remaining} question${limitStatus.remaining !== 1 ? "s" : ""} left today`}
            </span>
            <Link
              to="/subscription"
              className="text-orange-500 hover:underline text-[12px]"
            >
              Upgrade
            </Link>
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-5 flex gap-2">
          <div className="relative flex-1">
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
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
            />
          </div>
          <button className="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-[13px] transition-colors">
            Search
          </button>
        </form>

        <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {["newest", "active", "unanswered"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-[12px] capitalize transition-colors ${
                activeTab === tab
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-semibold"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-gray-400 text-[13px]">No questions found.</p>
            {user && (
              <Link
                to="/ask"
                className="mt-3 inline-block text-orange-500 hover:underline text-[13px]"
              >
                Ask the first one →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredQuestions.map((q, idx) => (
              <QuestionRow
                key={q._id}
                question={q}
                translated={Array.isArray(tQuestions) ? tQuestions[idx] : q}
              />
            ))}
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-8">
            {["First", "Prev"].map((label) => (
              <button
                key={label}
                onClick={() =>
                  setPage(label === "First" ? 1 : (p) => Math.max(1, p - 1))
                }
                disabled={page === 1}
                className="px-3 py-1.5 text-[12px] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
              >
                {label}
              </button>
            ))}
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-[12px] border rounded-lg transition-colors ${
                    p === page
                      ? "bg-orange-500 border-orange-500 text-white font-bold"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            {["Next", "Last"].map((label) => (
              <button
                key={label}
                onClick={() =>
                  setPage(
                    label === "Last" ? pages : (p) => Math.min(pages, p + 1),
                  )
                }
                disabled={page === pages}
                className="px-3 py-1.5 text-[12px] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="hidden xl:block w-72 shrink-0">
        <RightSidebar allQuestions={questions} />
      </div>
    </div>
  );
}

function QuestionRow({ question: q, translated }) {
  const voteCount = (q.upvotes?.length || 0) - (q.downvotes?.length || 0);
  const answerCount = q.answerCount || 0;
  const hasAccepted = q.hasAccepted || false;

  return (
    <div className="group flex gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-orange-200 dark:hover:border-gray-700 transition-all">
      <div className="flex flex-col gap-2 shrink-0 w-16 text-center">
        <div>
          <p
            className={`text-[15px] font-bold ${voteCount > 0 ? "text-gray-800 dark:text-gray-100" : "text-gray-400"}`}
          >
            {voteCount}
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
            votes
          </p>
        </div>
        <div
          className={`rounded-lg py-1 text-center border ${
            hasAccepted
              ? "bg-green-500 border-green-500 text-white"
              : answerCount > 0
                ? "border-green-400 text-green-600 dark:text-green-400"
                : "border-gray-200 dark:border-gray-700 text-gray-400"
          }`}
        >
          <p className="text-[14px] font-bold">{answerCount}</p>
          <p className="text-[9px] uppercase tracking-wider">ans</p>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={`/question/${q._id}`}
          className="text-[15px] font-semibold text-gray-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors line-clamp-2 leading-snug"
        >
          {translated?.title || q.title}
        </Link>
        <p className="text-gray-400 text-[12px] mt-1 line-clamp-1">
          {translated?.description || q.description}
        </p>
        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
          <div className="flex flex-wrap gap-1">
            {q.tags?.map((tag, i) => (
              <span
                key={tag}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0">
            <Link
              to={`/profile/${q.user?._id}`}
              className="text-orange-500 hover:underline"
            >
              {q.user?.name}
            </Link>
            <span>·</span>
            <span>{timeAgo(q.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RightSidebar({ allQuestions = [] }) {
  const [popularQuestions, setPopularQuestions] = useState([]);
  const [recentQuestions, setRecentQuestions] = useState([]);

  useEffect(() => {
    const sorted = [...allQuestions]
      .sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0))
      .slice(0, 2);
    setPopularQuestions(sorted);

    const recent = [...allQuestions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    setRecentQuestions(recent);
  }, [allQuestions]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-[10px] text-orange-500 uppercase tracking-widest mb-0.5">
            Popular
          </p>
          <h3 className="text-[13px] font-bold text-gray-800 dark:text-white">
            The Overflow Blog
          </h3>
        </div>
        <div className="p-3 space-y-3">
          {popularQuestions.length > 0 ? (
            popularQuestions.map((q) => (
              <Link
                to={`/question/${q._id}`}
                key={q._id}
                className="flex gap-2.5 group"
              >
                <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[11px]">📝</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-700 dark:text-gray-300 group-hover:text-orange-500 transition-colors leading-snug line-clamp-2">
                    {q.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    ⬆️ {q.upvotes?.length || 0} upvotes
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-[12px] text-gray-400 text-center py-2">
              No posts yet.
            </p>
          )}
        </div>
      </div>

      {/* Hot Questions */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-[10px] text-orange-500 uppercase tracking-widest mb-0.5">
            Recent
          </p>
          <h3 className="text-[13px] font-bold text-gray-800 dark:text-white">
            Hot New Questions
          </h3>
        </div>
        <div className="p-3 space-y-3">
          {recentQuestions.length > 0 ? (
            recentQuestions.map((q) => (
              <Link
                to={`/question/${q._id}`}
                key={q._id}
                className="flex gap-2.5 group"
              >
                <div className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-900/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[11px]">🔥</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-700 dark:text-gray-300 group-hover:text-orange-500 transition-colors leading-snug line-clamp-2">
                    {q.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {timeAgo(q.createdAt)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-[12px] text-gray-400 text-center py-2">
              No questions yet.
            </p>
          )}
        </div>
      </div>

      {/* Upgrade */}
      <div className="bg-white dark:bg-gray-900 border border-orange-100 dark:border-orange-900/30 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-orange-100 dark:border-orange-900/30">
          <p className="text-[10px] text-orange-500 uppercase tracking-widest mb-0.5">
            Plans
          </p>
          <h3 className="text-[13px] font-bold text-gray-800 dark:text-white">
            Upgrade Plan
          </h3>
        </div>
        <div className="p-3 space-y-1.5">
          {[
            { icon: "🆓", name: "Free", limit: "1 Q/day", price: "" },
            { icon: "🥉", name: "Bronze", limit: "5 Q/day", price: "₹100/mo" },
            { icon: "🥈", name: "Silver", limit: "10 Q/day", price: "₹300/mo" },
            { icon: "🥇", name: "Gold", limit: "Unlimited", price: "₹1000/mo" },
          ].map((plan) => (
            <div
              key={plan.name}
              className="flex items-center justify-between py-1"
            >
              <span className="text-[12px] text-gray-600 dark:text-gray-400">
                {plan.icon} {plan.name} · {plan.limit}
              </span>
              {plan.price && (
                <span className="text-[11px] text-orange-500">
                  {plan.price}
                </span>
              )}
            </div>
          ))}
          <Link
            to="/subscription"
            className="mt-2 block text-center bg-orange-500 hover:bg-orange-400 text-white rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors"
          >
            View Plans →
          </Link>
        </div>
      </div>
    </div>
  );
}
