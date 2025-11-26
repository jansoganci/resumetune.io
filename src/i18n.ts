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
import enComponents from './locales/en/components';
import trComponents from './locales/tr/components';
import esComponents from './locales/es/components';
import deComponents from './locales/de/components';
import zhComponents from './locales/zh/components';
import koComponents from './locales/ko/components';
import jaComponents from './locales/ja/components';
import arComponents from './locales/ar/components';
import enPages from './locales/en/pages';
import trPages from './locales/tr/pages';
import esPages from './locales/es/pages';
import dePages from './locales/de/pages';
import zhPages from './locales/zh/pages';
import koPages from './locales/ko/pages';
import jaPages from './locales/ja/pages';
import arPages from './locales/ar/pages';

const resources = {
  en: { common: enCommon, auth: enAuth, components: enComponents, pages: enPages },
  tr: { common: trCommon, auth: trAuth, components: trComponents, pages: trPages },
  es: { common: esCommon, auth: esAuth, components: esComponents, pages: esPages },
  de: { common: deCommon, auth: deAuth, components: deComponents, pages: dePages },
  zh: { common: zhCommon, auth: zhAuth, components: zhComponents, pages: zhPages },
  ko: { common: koCommon, auth: koAuth, components: koComponents, pages: koPages },
  ja: { common: jaCommon, auth: jaAuth, components: jaComponents, pages: jaPages },
  ar: { common: arCommon, auth: arAuth, components: arComponents, pages: arPages }
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
    ns: ['common', 'auth', 'components', 'pages'],
    defaultNS: 'common',
    interpolation: { escapeValue: false }
  });

export default i18n;


