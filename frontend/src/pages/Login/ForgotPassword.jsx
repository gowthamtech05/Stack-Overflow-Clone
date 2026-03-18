import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";

const Logo = () => (
  <div className="flex flex-col items-center mb-8">
    <div className="flex items-end gap-[3px] mb-3">
      {[18, 13, 16, 10, 18].map((h, i) => (
        <span
          key={i}
          className="w-[4px] bg-orange-400 rounded-sm inline-block"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
    <span className="text-[13px] font-semibold text-orange-400 tracking-widest uppercase">
      Stack Overflow
    </span>
  </div>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setStatus(null);

    try {
      setLoading(true);
      const { data } = await API.post("/auth/forgot-password", { email });
      setStatus("success");
      setMessage(data.message);
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong.";
      if (msg.toLowerCase().includes("one time per day")) {
        setStatus("warning");
      } else {
        setStatus("error");
      }
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    success: {
      icon: "✅",
      classes:
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400",
    },
    error: {
      icon: "❌",
      classes:
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400",
    },
    warning: {
      icon: "⚠️",
      classes:
        "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <Logo />

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-5">
            🔑
          </div>

          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white text-center mb-1">
            Forgot password?
          </h1>
          <p className="text-[13px] text-gray-400 text-center mb-6">
            Enter your email and we'll send you a new password.
          </p>

          <div className="flex gap-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-6 text-[12px] text-blue-600 dark:text-blue-400">
            <span className="shrink-0 mt-0.5">ℹ️</span>
            <span>
              You can only request a reset <strong>once per day</strong>. Your
              new password will contain only letters.
            </span>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 border rounded-xl px-4 py-3 mb-5 text-[13px] ${statusConfig[status].classes}`}
            >
              <span>{statusConfig[status].icon}</span>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-[14px] transition-colors shadow-sm"
            >
              {loading ? "Sending..." : "Send New Password"}
            </button>
          </form>

          <p className="text-[13px] text-center mt-6 text-gray-400">
            Remembered it?{" "}
            <Link
              to="/login"
              className="text-blue-500 hover:underline font-semibold"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
