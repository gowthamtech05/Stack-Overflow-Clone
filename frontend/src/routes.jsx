import { LanguageProvider } from "./context/LanguageContext";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Main/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Login/Register";
import Profile from "./pages/Users/Profile";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import AskQuestion from "./pages/Questions/AskQuestion";
import QuestionDetails from "./pages/Questions/QuestionDetails";
import Leaderboard from "./pages/Main/Leaderboard";
import Notifications from "./pages/Main/Notifications";
import MySubscription from "./pages/Users/MySubscription";
import Friends from "./pages/Users/Friends";
import Posts from "./pages/Questions/Posts"; 
import SearchResults from "./pages/Users/SearchResults";
import ForgotPassword from "./pages/Login/ForgotPassword";
import Users from "./pages/Users/Users";

const NO_SIDEBAR_ROUTES = ["/login", "/register", "/forgot-password"];

function AppLayout({ darkMode, setDarkMode }) {
  const location = useLocation();
  const hideSidebar = NO_SIDEBAR_ROUTES.includes(location.pathname);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="max-w-screen-xl mx-auto flex">
        {!hideSidebar && <Sidebar />}

        <main className={`flex-1 min-w-0 ${!hideSidebar ? "px-6 py-6" : ""}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/subscription" element={<MySubscription />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/posts" element={<Posts />} /> 
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/users" element={<Users />} />
            <Route path="/question/:id" element={<QuestionDetails />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/search" element={<SearchResults />} />
            <Route
              path="/ask"
              element={
                <ProtectedRoute>
                  <AskQuestion />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}


export default function AppRoutes() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppLayout darkMode={darkMode} setDarkMode={setDarkMode} />
      </LanguageProvider>
    </BrowserRouter>
  );
}
