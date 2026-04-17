import en from './en.json';
import pt from './pt.json';

export type Locale = 'en' | 'pt';

const strings = { en, pt } as const;

export type UIStrings = typeof en;

export function getUIStrings(lang: Locale): UIStrings {
  return strings[lang];
}

export function getLocaleFromPath(pathname: string): Locale {
  return pathname.startsWith('/pt') ? 'pt' : 'en';
}

export function localizePath(path: string, targetLang: Locale): string {
  const clean = path.replace(/^\/pt(?=\/|$)/, '') || '/';
  if (targetLang === 'en') return clean;
  return clean === '/' ? '/pt/' : `/pt${clean}`;
}

export function otherLocale(lang: Locale): Locale {
  return lang === 'en' ? 'pt' : 'en';
}
