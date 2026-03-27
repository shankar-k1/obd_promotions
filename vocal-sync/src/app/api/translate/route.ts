import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (sourceLang === targetLang) {
      return NextResponse.json({ translatedText: text });
    }

    console.log(`[Translate] ${sourceLang} → ${targetLang}, Text length: ${text.length}`);

    // Use MyMemory Translation API (free, no API key required, supports 100+ languages)
    const encodedText = encodeURIComponent(text);
    const langPair = `${sourceLang}|${targetLang}`;
    
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}`
    );

    if (!response.ok) {
      throw new Error(`Translation API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      console.log(`[Translate] Success: "${translated.substring(0, 100)}..."`);
      
      return NextResponse.json({ 
        translatedText: translated,
        sourceLang,
        targetLang
      });
    } else {
      // Fallback: try Lingva Translate
      console.log("[Translate] MyMemory failed, trying Lingva...");
      const lingvaResponse = await fetch(
        `https://lingva.ml/api/v1/${sourceLang}/${targetLang}/${encodedText}`
      );
      
      if (lingvaResponse.ok) {
        const lingvaData = await lingvaResponse.json();
        return NextResponse.json({ 
          translatedText: lingvaData.translation,
          sourceLang,
          targetLang
        });
      }

      throw new Error(data.responseDetails || "Translation failed");
    }

  } catch (error: any) {
    console.error("[Translate] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
