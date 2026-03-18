import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

export function useTranslateObject(data, fields) {
  const { language, translateBatch } = useLanguage();
  // null means "not yet translated" — components show original while waiting
  const [translated, setTranslated] = useState(null);
  const prevKey = useRef("");

  useEffect(() => {
    if (!data || !fields || fields.length === 0) {
      setTranslated(data);
      return;
    }

    const isArray = Array.isArray(data);
    const items = isArray ? data : [data];

    if (items.length === 0) {
      setTranslated(data);
      return;
    }

    // Build a key from language + data content to detect real changes
    const dataKey =
      language +
      JSON.stringify(items.map((item) => fields.map((f) => item?.[f])));

    if (dataKey === prevKey.current) return;
    prevKey.current = dataKey;

    // English — no API call needed, return originals immediately
    if (language === "English") {
      setTranslated(data);
      return;
    }

    let cancelled = false;

    const run = async () => {
      // Flatten all translatable fields into one single API call
      const allTexts = [];
      items.forEach((item) => {
        fields.forEach((field) => {
          allTexts.push(item?.[field] || "");
        });
      });

      const results = await translateBatch(allTexts, language);
      if (cancelled) return;

      const out = items.map((item, i) => {
        const copy = { ...item };
        fields.forEach((field, j) => {
          copy[field] = results[i * fields.length + j] ?? item?.[field];
        });
        return copy;
      });

      setTranslated(isArray ? out : out[0]);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [language, data, translateBatch, fields]);

  // While translating, return original so page isn't blank
  return translated ?? data;
}

export function useTranslate(texts) {
  const { language, translateBatch } = useLanguage();
  const [translated, setTranslated] = useState(texts);
  const prevKey = useRef("");

  useEffect(() => {
    if (!texts || texts.length === 0) return;

    const key = language + JSON.stringify(texts);
    if (key === prevKey.current) return;
    prevKey.current = key;

    if (language === "English") {
      setTranslated(texts);
      return;
    }

    let cancelled = false;
    translateBatch(texts, language).then((result) => {
      if (!cancelled) setTranslated(result);
    });
    return () => {
      cancelled = true;
    };
  }, [language, texts, translateBatch]);

  return translated ?? texts;
}
