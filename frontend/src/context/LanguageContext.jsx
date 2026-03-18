import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import API from "../api/axios";

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { label: "English", code: "en", flag: "🇬🇧" },
  { label: "Spanish", code: "es", flag: "🇪🇸" },
  { label: "Hindi", code: "hi", flag: "🇮🇳" },
  { label: "Portuguese", code: "pt", flag: "🇧🇷" },
  { label: "Chinese", code: "zh", flag: "🇨🇳" },
  { label: "French", code: "fr", flag: "🇫🇷" },
];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem("preferredLanguage") || "English",
  );

  const cacheRef = useRef({});

  const setLanguage = useCallback((lang) => {
    localStorage.setItem("preferredLanguage", lang);
    cacheRef.current = {};
    setLanguageState(lang);
  }, []);

  // translateBatch(texts, lang) — lang passed explicitly from the hook
  // so it always uses the current language at call time, not a stale closure
  const translateBatch = useCallback(async (texts, lang) => {
    if (!texts || texts.length === 0) return texts;
    if (lang === "English") return texts;

    const results = [];
    const toFetch = [];
    const toFetchIdx = [];

    texts.forEach((text, i) => {
      if (!text || !text.trim()) {
        results[i] = text;
        return;
      }
      const key = `${lang}__${text}`;
      if (cacheRef.current[key] !== undefined) {
        results[i] = cacheRef.current[key];
      } else {
        results[i] = text; // show original while loading
        toFetch.push(text);
        toFetchIdx.push(i);
      }
    });

    if (toFetch.length === 0) return results;

    try {
      const { data } = await API.post("/translate", {
        texts: toFetch,
        targetLanguage: lang,
      });

      data.translations.forEach((t, i) => {
        const idx = toFetchIdx[i];
        results[idx] = t;
        cacheRef.current[`${lang}__${toFetch[i]}`] = t;
      });
    } catch {
      // keep originals on error
    }

    return results;
  }, []); // stable — no deps needed

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translateBatch }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
