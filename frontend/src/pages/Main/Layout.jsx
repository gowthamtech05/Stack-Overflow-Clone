import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";

export default function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="max-w-screen-xl mx-auto flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
