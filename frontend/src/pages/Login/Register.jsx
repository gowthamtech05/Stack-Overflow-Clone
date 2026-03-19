import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

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

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [otpRequired, setOtpRequired] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    if (phone && !/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, ""))) {
      setError("Please enter a valid phone number.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await API.post("/auth/register", {
        name,
        email,
        phone: phone.trim() || null,
        password,
      });
      if (data.requireOTP) {
        setOtpEmail(data.email);
        setOtpRequired(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const otpHandler = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setOtpLoading(true);
      const { data } = await API.post("/auth/verify-register-otp", {
        email: otpEmail,
        otp,
      });
      setUser(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          {!otpRequired ? (
            <>
              <h1 className="text-[22px] font-bold text-gray-900 dark:text-white mb-1">
                Create account
              </h1>
              <p className="text-[13px] text-gray-400 mb-7">
                Join the developer community today.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-5 text-[13px] text-red-600 dark:text-red-400">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={submitHandler} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
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
                <div>
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Phone Number
                    <span className="text-gray-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none">
                      📱
                    </span>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pl-10 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Include country code · Used for password recovery
                  </p>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-10 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[13px]"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={
                    loading || !name.trim() || !email.trim() || !password.trim()
                  }
                  className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-[14px] transition-colors shadow-sm"
                >
                  {loading ? "Sending OTP..." : "Create Account"}
                </button>
              </form>

              <p className="text-[13px] text-center mt-6 text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-500 hover:underline font-semibold"
                >
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  📧
                </div>
                <h1 className="text-[20px] font-bold text-gray-900 dark:text-white mb-1">
                  Verify your email
                </h1>
                <p className="text-[13px] text-gray-400">
                  We sent a 6-digit code to{" "}
                  <span className="text-blue-500 font-medium">{otpEmail}</span>
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-5 text-[13px] text-red-600 dark:text-red-400">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={otpHandler} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    6-digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="· · · · · ·"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-[18px] text-center tracking-[0.5em] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={otpLoading || otp.length < 6}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-[14px] transition-colors shadow-sm"
                >
                  {otpLoading ? "Verifying..." : "Verify & Create Account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpRequired(false);
                    setOtp("");
                    setError("");
                  }}
                  className="w-full py-2 text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  ← Back to registration
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
