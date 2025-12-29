import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
  <select
  value={i18n.language}
  onChange={(e) => i18n.changeLanguage(e.target.value)}
  className="
    bg-gray-600
    rounded-md px-3 py-1.5
    text-sm cursor-pointer
    focus:outline-none focus:ring-2 focus:ring-blue-500
  "
>
  <option value="en">EN</option>
  <option value="km">KH</option>
</select>

  );
}

export default LanguageSwitcher;
