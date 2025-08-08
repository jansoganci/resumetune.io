import React, { useEffect } from 'react';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const current = (['en','tr','es','de','zh','ko','ja','ar'].find(l => i18n.language.startsWith(l)) || 'en') as 'en'|'tr'|'es'|'de'|'zh'|'ko'|'ja'|'ar';

  const change = (lang: 'en' | 'tr' | 'es' | 'de' | 'zh' | 'ko' | 'ja' | 'ar') => {
    i18n.changeLanguage(lang);
    try { localStorage.setItem('lang', lang); } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
    setOpen(false);
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
    }
  }, [current]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1 rounded-full text-xs font-medium transition-colors border bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {t(current === 'en' ? 'langEN' : current === 'tr' ? 'langTR' : current === 'es' ? 'langES' : current === 'de' ? 'langDE' : current === 'zh' ? 'langZH' : current === 'ko' ? 'langKO' : current === 'ja' ? 'langJA' : 'langAR')}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          <button
            className={`w-full text-left px-3 py-2 text-xs rounded ${current === 'en' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
            onClick={() => change('en')}
          >
            {t('langEN')}
          </button>
          <button
            className={`w-full text-left px-3 py-2 text-xs rounded ${current === 'tr' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
            onClick={() => change('tr')}
          >
            {t('langTR')}
          </button>
          <button className={`w-full text-left px-3 py-2 text-xs rounded ${current === 'es' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => change('es')}>{t('langES')}</button>
          <button className={`w-full text-left px-3 py-2 text-xs rounded ${current === 'de' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => change('de')}>{t('langDE')}</button>
          <button className={`w-full text-left px-3 py-2 text-xs rounded ${current === 'zh' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => change('zh')}>{t('langZH')}</button>
          <button className={`w-full text-left px-3 py-2 text-xs rounded ${current === 'ko' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => change('ko')}>{t('langKO')}</button>
          <button className={`w-full text-left px-3 py-2 text-xs rounded ${current === 'ja' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => change('ja')}>{t('langJA')}</button>
          <button className={`w-full text-left px-3 py-2 text-xs rounded ${current === 'ar' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => change('ar')}>{t('langAR')}</button>
        </div>
      )}
    </div>
  );
};


