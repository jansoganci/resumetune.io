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

const resources = {
  en: { common: enCommon },
  tr: { common: trCommon },
  es: { common: esCommon },
  de: { common: deCommon },
  zh: { common: zhCommon },
  ko: { common: koCommon },
  ja: { common: jaCommon },
  ar: { common: arCommon }
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
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false }
  });

export default i18n;


