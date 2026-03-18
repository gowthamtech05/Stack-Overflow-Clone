import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { useTranslateObject } from "../../hooks/useTranslate";

const QUESTION_FIELDS = ["title", "description"];
const ANSWER_FIELDS = ["content"];

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function QuestionDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const tQuestion = useTranslateObject(question, QUESTION_FIELDS);
  const tAnswers = useTranslateObject(answers, ANSWER_FIELDS);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [qRes, aRes] = await Promise.all([
        API.get(`/questions/${id}`),
        API.get(`/answers/${id}`),
      ]);
      setQuestion(qRes.data);
      const arr = Array.isArray(aRes.data)
        ? aRes.data
        : aRes.data.answers || [];
      setAnswers(sortAnswers(arr));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sortAnswers = (arr) =>
    [...arr].sort((a, b) => {
      if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
      return (
        b.upvotes?.length -
        b.downvotes?.length -
        (a.upvotes?.length - a.downvotes?.length)
      );
    });

  const getUserVote = (item) => {
    if (!user) return null;
    if (item.upvotes?.map(String).includes(String(user._id))) return "upvote";
    if (item.downvotes?.map(String).includes(String(user._id)))
      return "downvote";
    return null;
  };

  const voteQuestion = async (type) => {
    if (!user) return alert("Login to vote");
    try {
      const { data } = await API.put(`/questions/${id}/vote`, { type });
      setQuestion((prev) => ({
        ...prev,
        upvotes: Array(data.upvotes).fill("x"),
        downvotes: Array(data.downvotes).fill("x"),
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Vote failed");
    }
  };

  const voteAnswer = async (answerId, type) => {
    if (!user) return alert("Login to vote");
    try {
      await API.put(`/answers/${answerId}/vote`, { type });
      const { data } = await API.get(`/answers/${id}`);
      const arr = Array.isArray(data) ? data : data.answers || [];
      setAnswers(sortAnswers(arr));
    } catch (err) {
      alert(err.response?.data?.message || "Vote failed");
    }
  };

  const acceptAnswer = async (answerId) => {
    try {
      await API.put(`/answers/${answerId}/accept`, {});
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const deleteAnswer = async (answerId) => {
    if (!window.confirm("Delete this answer?")) return;
    try {
      await API.delete(`/answers/${answerId}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const deleteQuestion = async () => {
    if (
      !window.confirm("Delete this question? All answers will also be deleted.")
    )
      return;
    try {
      await API.delete(`/questions/${id}`);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const submitAnswer = async () => {
    if (!content.trim()) return;
    try {
      setSubmitting(true);
      await API.post(`/answers/${id}`, { content });
      setContent("");
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-32">
        <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!question)
    return (
      <div className="text-center py-32 text-gray-400">Question not found.</div>
    );

  const qScore =
    (question.upvotes?.length || 0) - (question.downvotes?.length || 0);
  const qUserVote = getUserVote(question);
  const isQAuthor = user?._id === question.user?._id;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {question.tags?.map((tag) => (
            <span
              key={tag}
              className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[11px] font-medium px-2.5 py-0.5 rounded-lg border border-orange-100 dark:border-orange-800"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4 leading-snug">
          {tQuestion?.title || question.title}
        </h1>

        <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">
          {tQuestion?.description || question.description}
        </p>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <VoteButton
              direction="up"
              active={qUserVote === "upvote"}
              onClick={() => voteQuestion("upvote")}
              disabled={isQAuthor}
            />
            <span
              className={`text-lg font-bold w-8 text-center ${qScore > 0 ? "text-green-500" : qScore < 0 ? "text-red-500" : "text-gray-400"}`}
            >
              {qScore}
            </span>
            <VoteButton
              direction="down"
              active={qUserVote === "downvote"}
              onClick={() => voteQuestion("downvote")}
              disabled={isQAuthor}
            />
            {isQAuthor && (
              <button
                onClick={deleteQuestion}
                className="ml-2 text-[12px] text-red-400 hover:text-red-600 hover:underline transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs uppercase">
              {question.user?.name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/profile/${question.user?._id}`}
                  className="text-orange-500 hover:underline font-semibold"
                >
                  {question.user?.name}
                </Link>
                <span className="text-yellow-500 text-[11px]">
                  ▲ {question.user?.points ?? 0}
                </span>
              </div>
              <p className="text-gray-400 text-[11px]">
                {timeAgo(question.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-bold text-gray-700 dark:text-gray-300 mb-3">
          {answers.length} Answer{answers.length !== 1 ? "s" : ""}
        </h2>

        {answers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 text-[13px]">
            No answers yet — be the first!
          </div>
        ) : (
          <div className="space-y-3">
            {answers.map((answer, idx) => {
              const score =
                (answer.upvotes?.length || 0) - (answer.downvotes?.length || 0);
              const userVote = getUserVote(answer);
              const isAuthor = user?._id === answer.user?._id;
              const translatedAnswer = Array.isArray(tAnswers)
                ? tAnswers[idx]
                : null;

              return (
                <div
                  key={answer._id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border p-6 ${
                    answer.isAccepted
                      ? "border-green-300 dark:border-green-700"
                      : "border-gray-100 dark:border-gray-800"
                  }`}
                >
                  {answer.isAccepted && (
                    <div className="flex items-center gap-1.5 text-green-500 text-[13px] font-semibold mb-3">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Accepted Answer
                    </div>
                  )}

                  <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-5">
                    {translatedAnswer?.content || answer.content}
                  </p>

                  <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <VoteButton
                        direction="up"
                        active={userVote === "upvote"}
                        onClick={() => voteAnswer(answer._id, "upvote")}
                        disabled={isAuthor}
                      />
                      <span
                        className={`text-lg font-bold w-8 text-center ${score > 0 ? "text-green-500" : score < 0 ? "text-red-500" : "text-gray-400"}`}
                      >
                        {score}
                      </span>
                      <VoteButton
                        direction="down"
                        active={userVote === "downvote"}
                        onClick={() => voteAnswer(answer._id, "downvote")}
                        disabled={isAuthor}
                      />

                      {isQAuthor &&
                        !answer.isAccepted &&
                        String(user?._id) !== String(answer.user?._id) && (
                          <button
                            onClick={() => acceptAnswer(answer._id)}
                            title="Accept answer"
                            className="ml-2 w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors"
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
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                        )}

                      {isAuthor && (
                        <button
                          onClick={() => deleteAnswer(answer._id)}
                          className="ml-2 text-[12px] text-red-400 hover:text-red-600 hover:underline transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[13px]">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                        {answer.user?.name?.[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/profile/${answer.user?._id}`}
                            className="text-orange-500 hover:underline font-semibold"
                          >
                            {answer.user?.name}
                          </Link>
                          <span className="text-yellow-500 text-[11px]">
                            ▲ {answer.user?.points ?? 0}
                          </span>
                        </div>
                        <p className="text-gray-400 text-[11px]">
                          {timeAgo(answer.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
        {user ? (
          <>
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-1">
              Your Answer
            </h3>
            <p className="text-[12px] text-gray-400 mb-4">
              +5 pts for answering · +5 bonus at 5 upvotes · accepted = +15 pts
            </p>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your answer here..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors resize-y"
            />
            <button
              onClick={submitAnswer}
              disabled={submitting || !content.trim()}
              className="mt-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors"
            >
              {submitting ? "Posting..." : "Post Answer"}
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-[14px] text-gray-400 mb-4">
              Log in to post an answer
            </p>
            <div className="flex justify-center gap-3">
              <Link
                to="/login"
                className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2 rounded-xl text-[13px] font-semibold transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="border border-orange-300 dark:border-orange-700 text-orange-500 px-5 py-2 rounded-xl text-[13px] font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VoteButton({ direction, active, onClick, disabled }) {
  const isUp = direction === "up";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={
        disabled ? "Can't vote your own post" : isUp ? "Upvote" : "Downvote"
      }
      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? isUp
            ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-500"
            : "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-500"
          : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
      }`}
    >
      {isUp ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 01.707.293l6 6a1 1 0 01-1.414 1.414L10 5.414 4.707 10.707A1 1 0 013.293 9.293l6-6A1 1 0 0110 3z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 17a1 1 0 01-.707-.293l-6-6a1 1 0 011.414-1.414L10 14.586l5.293-5.293a1 1 0 011.414 1.414l-6 6A1 1 0 0110 17z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
