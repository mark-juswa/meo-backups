import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import ConfirmationModal from "./modals/confirmation/Confirm.jsx";
import translations from "../../lang/translations.js";
import axios from "axios";


const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { auth, setAuth } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Get translation function
  const t = translations[language].navbar;

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
      setAuth(null);
      navigate("/login");
      setIsLogoutModalOpen(false);
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-blue-600 text-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-3">
          <img
            src="/Logo.png"
            alt="MEO Logo"
            className="h-12 w-12 bg-white rounded-full p-0.5"
          />
          <div>
            <p className="text-xs sm:text-sm font-light leading-tight hidden sm:block">
              MUNICIPAL ENGINEERING OFFICE OF SAN VICENTE
            </p>
            <h1 className="text-md sm:text-xl font-medium sm:font-bold leading-tight">
              Online Services System
            </h1>
          </div>
        </div>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden sm:flex items-center space-x-6">

          <Link to="/#application" className="text-sm font-medium hover:underline"> {t.apply} </Link>
          <a href="/#track" className="text-sm font-medium hover:underline"> {t.track} </a>

          {auth?.accessToken && (
            <Link
              to="/me"
              className="text-sm font-medium hover:underline"
            >
              {t.me}
            </Link>
          )}
          
          <LanguageSwitcher />

          {auth?.accessToken ? (
            <button
              onClick={handleLogout}
              className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-100 transition"
            >
              {t.logout}
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-100 transition"
              >
                {t.login}
              </Link>
              <Link
                to="/register"
                className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-100 transition"
              >
                {t.register}
              </Link>
            </>
          )}
        </nav>

        {/* MOBILE MENU BUTTON */}
        {auth?.accessToken && (
          <button
            className="sm:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>

      {/* MOBILE NAVIGATION */}
      {isMenuOpen && auth?.accessToken && (
        <nav className="sm:hidden bg-blue-700 flex flex-col space-y-4 px-6 py-4 text-white">

          <Link
            to="/#application"
            className="text-sm font-medium hover:underline"
            onClick={() => setIsMenuOpen(false)}
          >
            {t.apply}
          </Link>

          <Link
            to="/#track"
            className="text-sm font-medium hover:underline"
            onClick={() => setIsMenuOpen(false)}
          >
            {t.track}
          </Link>

          <Link
            to="/me"
            className="text-sm font-medium hover:underline"
            onClick={() => setIsMenuOpen(false)}
          >
            {t.me}
          </Link>

          {/* MOBILE LANGUAGE SWITCHER */}
          <div
            onClick={() => setIsMenuOpen(false)}
            className="mt-2"
          >
            <LanguageSwitcher />
          </div>

          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-100 transition"
          >
            {t.logout}
          </button>
        </nav>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="Logout?"
        message="Are you sure you want to log out of the system?"
        confirmText="Yes, Logout"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onClose={() => setIsLogoutModalOpen(false)}
        isProcessing={isLoggingOut}
      />
    </header>
  );
};

export default NavBar;
