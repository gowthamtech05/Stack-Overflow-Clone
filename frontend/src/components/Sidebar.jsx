import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold border-r-2 border-orange-500"
      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white";

  const NavLink = ({ to, icon, label, indent = false }) => (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-4 py-2 transition-colors text-[13px] ${indent ? "pl-7" : ""} ${isActive(to)}`}
    >
      {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
      {label}
    </Link>
  );

  return (
    <aside className="hidden md:flex flex-col w-48 shrink-0 pt-4 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto border-r border-gray-100 dark:border-gray-800">
      <nav className="flex flex-col">
        <NavLink
          to="/"
          label="Home"
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          }
        />

        <p className="px-4 pt-5 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Public
        </p>

        <NavLink
          to="/"
          indent
          label="Questions"
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        <NavLink
          to="/posts"
          indent
          label="Community Feed"
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          }
        />

        <NavLink
          to="/users"
          indent
          label="Users"
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"
              />
            </svg>
          }
        />

        <NavLink
          to="/leaderboard"
          indent
          label="Leaderboard"
          icon={
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />

        {user && (
          <>
            <p className="px-4 pt-5 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Personal
            </p>

            <Link
              to={`/profile/${user._id}`}
              className={`flex items-center gap-2.5 px-4 py-2 transition-colors text-[13px] ${isActive(`/profile/${user._id}`)}`}
            >
              <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-[8px] font-bold uppercase shrink-0">
                {user.name?.[0]}
              </div>
              Profile
            </Link>

            <NavLink
              to="/friends"
              label="Friends"
              icon={
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
            />

            <NavLink
              to="/notifications"
              label="Notifications"
              icon={
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              }
            />

            <NavLink
              to="/subscription"
              label="Subscription"
              icon={
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              }
            />

            <NavLink
              to="/ask"
              label="Ask Question"
              icon={
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
            />
          </>
        )}

        <div className="mt-6 mx-3 border-t border-gray-100 dark:border-gray-800 pt-4 pb-6">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Teams
          </p>
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-3 text-[12px]">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Stack Overflow for Teams
            </p>
            <p className="text-gray-400 text-[11px] mb-2">
              Collaborate in a private group.
            </p>
            <Link
              to="/subscription"
              className="block text-center bg-orange-500 hover:bg-orange-400 text-white rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}
