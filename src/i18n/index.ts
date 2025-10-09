// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";

// what you’ll ship
export const supportedLngs = ["en", "fr"] as const;
const fallbackLng = "en";
const defaultNS = "common";

// Vite will code-split these JSON files per language/namespace
// We’ll keep a {lng}/{ns}.json pattern, e.g. locales/en/common.json
const loaders = import.meta.glob("../locales/*/*.json");

// Map (lng, ns) -> dynamic import fn
const backend = resourcesToBackend((lng: string, ns: string) => {
  const key = `../locales/${lng}/${ns}.json`;
  const loader = loaders[key];
  if (!loader) {
    // fallback to 'en' if missing translation file
    return (loaders[`../locales/${fallbackLng}/${ns}.json`] as any)();
  }
  return (loader as any)();
});

void i18n
  .use(LanguageDetector)
  .use(backend)
  .use(initReactI18next)
  .init({
    fallbackLng,
    supportedLngs: supportedLngs as unknown as string[],
    ns: [defaultNS],
    defaultNS,
    interpolation: { escapeValue: false },
    detection: {
      // querystring -> localStorage -> cookie -> navigator -> <html lang>
      order: ["querystring", "localStorage", "cookie", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
    react: { useSuspense: false }, // avoid needing <Suspense> until you want it
  });

// Optional: keep <html lang> in sync
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
