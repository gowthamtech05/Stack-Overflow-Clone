import fetch from "node-fetch";

const LANGUAGE_CODES = {
  English: "en",
  Spanish: "es",
  Hindi: "hi",
  Portuguese: "pt",
  Chinese: "zh",
  French: "fr",
};

export const translateTexts = async (req, res) => {
  try {
    const { texts, targetLanguage } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ message: "texts array is required" });
    }

    const targetCode = LANGUAGE_CODES[targetLanguage];
    if (!targetCode) {
      return res.status(400).json({ message: "Unsupported language" });
    }
    if (targetCode === "en") {
      return res.json({ translations: texts });
    }
    const translated = await Promise.all(
      texts.map(async (text) => {
        if (!text || !text.trim()) return text;
        try {
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetCode}&de=${process.env.EMAIL_USER}`;
          const response = await fetch(url);
          const data = await response.json();

          if (
            data.responseStatus === 200 &&
            data.responseData?.translatedText
          ) {
            return data.responseData.translatedText;
          }
          return text;
        } catch {
          return text;
        }
      }),
    );

    res.json({ translations: translated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
