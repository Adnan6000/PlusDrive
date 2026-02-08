import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your translation files
import en from './locales/en/translation.json';
import da from './locales/da/translation.json';

i18n
  // 1. Detect user language (Browser, Cookies, LocalStorage)
  .use(LanguageDetector)
  // 2. Connect to React
  .use(initReactI18next)
  // 3. Initialize
  .init({
    resources: {
      en: { translation: en },
      da: { translation: da }
    },
    fallbackLng: 'en', // If language not found, use English
    interpolation: {
      escapeValue: false // React already protects from XSS
    },
    detection: {
      // Order to check for language:
      order: ['localStorage', 'navigator'],
      // Where to cache the user's choice:
      caches: ['localStorage']
    }
  });

export default i18n;