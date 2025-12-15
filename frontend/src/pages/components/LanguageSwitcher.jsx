import React from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex space-x-2">
      {/* English Button */}
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded text-sm font-semibold transition
          ${language === "en" 
            ? "bg-white text-blue-600 shadow" 
            : "bg-blue-500 hover:bg-blue-400 text-white"}
        `}
      >
        Eng
      </button>

      {/* Filipino Button */}
      <button
        onClick={() => setLanguage("fil")}
        className={`px-3 py-1 rounded text-sm font-semibold transition
          ${language === "fil"
            ? "bg-white text-blue-600 shadow"
            : "bg-blue-500 hover:bg-blue-400 text-white"}
        `}
      >
        Fil
      </button>
    </div>
  );
}
