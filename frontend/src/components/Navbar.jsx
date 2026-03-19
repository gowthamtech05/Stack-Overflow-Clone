import { useAuth } from "../context/AuthContext";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import API from "../api/axios";

export default function Navbar({ darkMode, setDarkMode }) {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");


  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const langMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const debounceRef = useRef(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.label === language);

  
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const { data } = await API.get("/notifications/unread-count");
        setUnreadCount(data.count);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  
  useEffect(() => {
    if (location.pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await API.get(`/users?search=${val.trim()}`);
        setSuggestions(data.slice(0, 3));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    setSuggestions([]);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSuggestionClick = (userId) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchQuery("");
    navigate(`/profile/${userId}`);
  };

  const handleLanguageSelect = async (lang) => {
    setLangMenuOpen(false);
    if (lang.label === language) return;
    if (lang.label === "English") {
      setLanguage("English");
      return;
    }
    setPendingLanguage(lang);
    setOtpSent(false);
    setOtpValue("");
    setOtpError("");
    setOtpSuccess("");
    setOtpModal(true);
    await sendOTP(lang.label);
  };

  const sendOTP = async (langLabel) => {
    setOtpLoading(true);
    setOtpError("");
    try {
      await API.post("/users/request-language-change", { language: langLabel });
      setOtpSuccess(
        langLabel === "French"
          ? "OTP sent to your registered email."
          : "OTP sent to your registered mobile number.",
      );
      setOtpSent(true);
    } catch (err) {
      setOtpError(
        err.response?.data?.message || "Failed to send OTP. Try again.",
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpValue.trim()) {
      setOtpError("Please enter the OTP.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      await API.post("/users/verify-language-otp", {
        language: pendingLanguage.label,
        otp: otpValue,
      });
      setLanguage(pendingLanguage.label);
      setOtpModal(false);
      setPendingLanguage(null);
      setOtpValue("");
    } catch (err) {
      setOtpError(
        err.response?.data?.message || "Invalid OTP. Please try again.",
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const closeOtpModal = () => {
    setOtpModal(false);
    setPendingLanguage(null);
    setOtpValue("");
    setOtpError("");
    setOtpSuccess("");
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
      if (langMenuRef.current && !langMenuRef.current.contains(e.target))
        setLangMenuOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target))
        setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const mobileNavLinks = [
    { label: "Questions", to: "/" },
    { label: "Users", to: "/users" },
    { label: "Leaderboard", to: "/leaderboard" },
    { label: "Friends", to: "/friends" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-screen-xl mx-auto flex items-center h-12 px-4 gap-3">
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-end gap-[2px]">
              {[14, 10, 12, 8, 14].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] bg-orange-500 rounded-sm inline-block"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            <span className="font-bold text-sm text-gray-700 dark:text-gray-200 hidden sm:inline">
              stack
              <span className="text-gray-900 dark:text-white">overflow</span>
            </span>
          </Link>
          <Link
            to="/posts"
            className={`md:hidden px-2.5 py-1.5 rounded-lg text-[13px] transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === "/posts"
                ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Community
          </Link>
          <nav className="hidden md:flex items-center gap-1 h-full">
            {[
              { label: "Questions", to: "/" },
              { label: "Community", to: "/posts" },
              { label: "Users", to: "/users" },
              { label: "Leaderboard", to: "/leaderboard" },
              { label: "Friends", to: "/friends" },
            ].map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                  location.pathname === to
                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div ref={searchRef} className="flex-1 max-w-xl mx-2 relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() =>
                    suggestions.length > 0 && setShowSuggestions(true)
                  }
                  placeholder="Search users..."
                  className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
                />
              </div>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-50">
                {suggestions.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleSuggestionClick(u._id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                      {u.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-yellow-600">
                        ▲ {u.points ?? 0} pts
                      </p>
                    </div>
                    <svg
                      className="w-3.5 h-3.5 text-gray-300 shrink-0"
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
                  </button>
                ))}
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Press Enter to search all
                  </span>
                  <kbd className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                    ↵
                  </kbd>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {user && (
              <Link
                to="/ask"
                className="hidden lg:inline-flex items-center px-3 py-1.5 text-[13px] text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors whitespace-nowrap font-semibold"
              >
                + Ask
              </Link>
            )}

            <div className="relative hidden md:block" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen((p) => !p)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors text-[13px]"
              >
                <span>{currentLang?.flag}</span>
                <span className="hidden lg:inline text-[12px]">
                  {currentLang?.label}
                </span>
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden">
                  <p className="px-4 py-1.5 text-[10px] text-gray-400 uppercase tracking-widest font-semibold border-b border-gray-100 dark:border-gray-800">
                    Language
                  </p>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-[13px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        language === lang.label
                          ? "text-orange-500 font-semibold"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {language === lang.label ? (
                        <svg
                          className="w-3.5 h-3.5 text-orange-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        lang.label !== "English" && (
                          <span className="text-[10px] text-gray-400">OTP</span>
                        )
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 transition-colors"
            >
              {darkMode ? (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 011.42 1.42l-.71.7a1 1 0 01-1.41-1.41l.7-.71zM18 9a1 1 0 110 2h-1a1 1 0 110-2h1zM4.78 15.22a1 1 0 001.41-1.41l-.7-.71a1 1 0 00-1.42 1.42l.71.7zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM3.51 4.78a1 1 0 011.41 0l.71.71a1 1 0 01-1.42 1.41l-.7-.71a1 1 0 010-1.41zM2 9a1 1 0 110 2H1a1 1 0 110-2h1zm13.49 6.22a1 1 0 010-1.41l.71-.71a1 1 0 011.41 1.42l-.7.7a1 1 0 01-1.42 0zM10 6a4 4 0 100 8 4 4 0 000-8z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {!user ? (
              <div className="hidden md:flex items-center gap-1.5 ml-1">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-[13px] text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors font-semibold"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-[13px] bg-orange-500 hover:bg-orange-400 text-white rounded-xl transition-colors font-semibold"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1 ml-1">
                
                <Link
                  to="/notifications"
                  className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 transition-colors"
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5M13 21a2 2 0 01-4 0"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((p) => !p)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                      {user.name?.[0] || "U"}
                    </div>
                    <span className="text-[13px] text-gray-700 dark:text-gray-300 hidden sm:inline">
                      {user.name}
                    </span>
                    <span className="text-[11px] text-yellow-600 font-semibold hidden sm:inline">
                      ▲ {user.points ?? 0}
                    </span>
                    <svg
                      className="w-3 h-3 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-1.5 text-[13px] overflow-hidden z-50">
                      {[
                        {
                          to: `/profile/${user._id}`,
                          label: "Profile",
                          icon: (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5.121 17.804A7 7 0 1118.88 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          ),
                        },
                        {
                          to: "/friends",
                          label: "Friends",
                          icon: (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          ),
                        },
                        {
                          to: "/ask",
                          label: "Ask Question",
                          icon: (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          ),
                          mobileOnly: true,
                        },
                      ].map(({ to, label, icon, mobileOnly }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-2.5 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${mobileOnly ? "lg:hidden" : ""}`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {icon}
                          </svg>
                          {label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
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
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                            />
                          </svg>
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="md:hidden relative" ref={mobileMenuRef}>
              <button
                onClick={() => setMobileMenuOpen((p) => !p)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              >
                {mobileMenuOpen ? (
                  <svg
                    className="w-5 h-5"
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
                ) : (
                  <div className="relative">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                   
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </div>
                )}
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                      Navigate
                    </p>
                    {mobileNavLinks.map(({ label, to }) => (
                      <Link
                        key={to}
                        to={to}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-colors ${
                          location.pathname === to
                            ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                  <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                      Language
                    </p>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLanguageSelect(lang);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-colors ${
                          language === lang.label
                            ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500 font-semibold"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {lang.label !== "English" &&
                            language !== lang.label && (
                              <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                                OTP
                              </span>
                            )}
                          {language === lang.label && (
                            <svg
                              className="w-3.5 h-3.5 text-orange-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="p-2">
                    {!user ? (
                      <div className="flex flex-col gap-1.5">
                        <Link
                          to="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-center py-2.5 text-[13px] text-orange-600 border border-orange-300 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
                        >
                          Log in
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-center py-2.5 text-[13px] bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold transition-colors"
                        >
                          Sign up
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 px-3 py-2 mb-1">
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold uppercase">
                            {user.name?.[0]}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-yellow-600">
                              ▲ {user.points ?? 0} pts
                            </p>
                          </div>
                        </div>
                        {[
                          { to: `/profile/${user._id}`, label: "My Profile" },
                          {
                            to: "/notifications",
                            label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
                          },
                          { to: "/subscription", label: "Subscription" },
                          { to: "/ask", label: "+ Ask Question" },
                        ].map(({ to, label }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-2.5 rounded-xl text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            {label}
                          </Link>
                        ))}
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {otpModal && pendingLanguage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  Verify Language Switch
                </h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Switching to {pendingLanguage.flag} {pendingLanguage.label}
                </p>
              </div>
              <button
                onClick={closeOtpModal}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
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
            </div>

            <div
              className={`flex items-start gap-2.5 p-3 rounded-xl mb-4 text-[13px] ${
                pendingLanguage.label === "French"
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
              }`}
            >
              <span>{pendingLanguage.label === "French" ? "📧" : "📱"}</span>
              <p>
                {pendingLanguage.label === "French"
                  ? "An OTP has been sent to your registered email."
                  : "An OTP has been sent to your registered mobile number."}
              </p>
            </div>

            {otpSuccess && !otpError && (
              <p className="text-[12px] text-green-500 mb-3">{otpSuccess}</p>
            )}

            <div className="mb-4">
              <label className="block text-[12px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Enter OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpValue}
                onChange={(e) => {
                  setOtpValue(e.target.value.replace(/\D/g, ""));
                  setOtpError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                placeholder="• • • • • •"
                className="w-full px-4 py-3 text-center text-xl tracking-[0.6em] border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
              />
              {otpError && (
                <p className="text-[12px] text-red-500 mt-1.5">{otpError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={closeOtpModal}
                className="flex-1 py-2.5 text-[13px] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={otpLoading || !otpValue}
                className="flex-1 py-2.5 text-[13px] bg-orange-500 hover:bg-orange-400 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {otpLoading ? "Verifying..." : "Verify"}
              </button>
            </div>

            <button
              onClick={() => sendOTP(pendingLanguage.label)}
              disabled={otpLoading}
              className="w-full mt-3 text-[12px] text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-40"
            >
              Didn't receive it? Resend OTP
            </button>
          </div>
        </div>
      )}
    </>
  );
}
