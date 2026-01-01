import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const isEnglish = i18n.language === "en";

  const toggleLanguage = () => {
    i18n.changeLanguage(isEnglish ? "km" : "en");
  };

  return (
    <button
      onClick={toggleLanguage}
      className="
        flex items-center gap-2
        text-sm font-medium
        text-blue-500 underline
      "
    >
       {isEnglish ? "ភាសារខ្មែរ" : "English"}
    </button>
  );
}
