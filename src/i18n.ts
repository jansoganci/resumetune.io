import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common';
import trCommon from './locales/tr/common';
import esCommon from './locales/es/common';
import deCommon from './locales/de/common';
import zhCommon from './locales/zh/common';
import koCommon from './locales/ko/common';
import jaCommon from './locales/ja/common';
import arCommon from './locales/ar/common';
import enAuth from './locales/en/auth';
import trAuth from './locales/tr/auth';
import esAuth from './locales/es/auth';
import deAuth from './locales/de/auth';
import zhAuth from './locales/zh/auth';
import koAuth from './locales/ko/auth';
import jaAuth from './locales/ja/auth';
import arAuth from './locales/ar/auth';

const resources = {
  en: { common: enCommon, auth: enAuth },
  tr: { common: trCommon, auth: trAuth },
  es: { common: esCommon, auth: esAuth },
  de: { common: deCommon, auth: deAuth },
  zh: { common: zhCommon, auth: zhAuth },
  ko: { common: koCommon, auth: koAuth },
  ja: { common: jaCommon, auth: jaAuth },
  ar: { common: arCommon, auth: arAuth }
};

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
const supported = ['en', 'tr', 'es', 'de', 'zh', 'ko', 'ja', 'ar'] as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang || ((supported as readonly string[]).includes(browserLang) ? browserLang : 'en'),
    fallbackLng: 'en',
    ns: ['common', 'auth'],
    defaultNS: 'common',
    interpolation: { escapeValue: false }
  });

export default i18n;


