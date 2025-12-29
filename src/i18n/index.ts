import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import km from './locales/km.json';

i18n
  .use(LanguageDetector) // detect browser language
  .use(initReactI18next)
  .init({
    resources: {
        km: { translation: km },
        en: { translation: en },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already escapes
    },
  });

export default i18n;
