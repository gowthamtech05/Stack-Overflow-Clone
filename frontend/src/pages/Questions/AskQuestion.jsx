import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

export default function AskQuestion() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [limitInfo, setLimitInfo] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await API.post("/questions", {
        title,
        description,
        tags: tags.split(",").map((tag) => tag.trim()),
      });
      navigate("/");
    } catch (err) {
      alert("Error creating question");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const limitRes = await API.get("/questions/limit/status");
      setLimitInfo(limitRes.data);
      const userRes = await API.get("/auth/me");
      setUser(userRes.data);
    };
    fetchData();
  }, []);

  const remaining = limitInfo?.remaining;
  const isBlocked = remaining === 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-[11px] text-orange-500 uppercase tracking-widest mb-0.5">
          New Question
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ask a Question
        </h1>
        {user && (
          <p className="text-[13px] text-gray-400 mt-1">
            {user.name} · {user.points} reputation
          </p>
        )}
      </div>

      {limitInfo && (
        <div
          className={`mb-5 px-4 py-3 rounded-xl border text-[13px] flex items-center justify-between ${
            isBlocked
              ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400"
              : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
          }`}
        >
          <span>
            <span className="font-semibold text-orange-500">
              {limitInfo.plan}
            </span>
            {" · "}
            {limitInfo.used} of {limitInfo.limit} used today
          </span>
          <span
            className={`font-semibold ${isBlocked ? "text-red-500" : "text-green-500"}`}
          >
            {isBlocked ? "Limit reached" : `${remaining} left`}
          </span>
        </div>
      )}


      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 space-y-5">
        <form onSubmit={submitHandler} className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Title
            </label>
            <input
              type="text"
              placeholder="What's your question? Be specific."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Be specific and imagine you're asking another developer.
            </p>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Explain your problem in detail. Include what you've tried and what you expected to happen."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={7}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors resize-y"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tags
            </label>
            <input
              type="text"
              placeholder="e.g. javascript, react, node.js"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Separate tags with commas · up to 5 tags
            </p>
            {tags.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag, i) => (
                    <span
                      key={i}
                      className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-[11px] font-medium px-2 py-0.5 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-[12px] text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
            <span>📝 Post = +0 pts</span>
            <span>⬆️ Upvote received = +5 pts</span>
            <span>✅ Answer accepted = +15 pts</span>
          </div>
          <button
            type="submit"
            disabled={isBlocked}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-[14px] transition-colors"
          >
            {isBlocked ? "Daily limit reached" : "Post Question"}
          </button>
        </form>
      </div>
    </div>
  );
}
