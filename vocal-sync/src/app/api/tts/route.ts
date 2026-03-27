import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSetting, getCache, setCache, addToHistory } from "@/lib/db";
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  let engine = "unknown";
  try {
    const body = await req.json();
    const { text, targetLang, voiceId } = body;
    engine = body.engine || "unknown";

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Cache lookup
    const textHash = crypto.createHash('md5').update(`${text}_${engine}_${voiceId}_${targetLang}`).digest('hex');
    const cacheKey = `tts_${textHash}`;
    const cachedResult = getCache(cacheKey);
    if (cachedResult) {
       console.log(`[TTS] Cache HIT for snippet: "${text.substring(0, 30)}..."`);
       return NextResponse.json(cachedResult);
    }

    console.log(`[TTS] Engine: ${engine}, Lang: ${targetLang}, Text: "${text.substring(0, 80)}..."`);

    if (engine === "elevenlabs") {
      const apiKey = getSetting("ELEVENLABS_API_KEY") || process.env.ELEVENLABS_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "ElevenLabs API key not configured." }, { status: 401 });
      }

      const selectedVoice = voiceId || "21m00Tcm4TlvDq8ikWAM";

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
        {
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
          },
          responseType: "arraybuffer",
          timeout: 30000,
        }
      );

      const base64Audio = Buffer.from(response.data).toString("base64");
      const finalResult = {
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        message: "Generated via ElevenLabs Multilingual V2"
      };
      setCache(cacheKey, finalResult);
      addToHistory({ type: 'TTS', engine, text, targetLang, voiceId, audioUrl: finalResult.audioUrl });
      return NextResponse.json(finalResult);

    } else if (engine === "murf") {
      const apiKey = getSetting("MURF_API_KEY") || process.env.MURF_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Murf AI API key not configured." }, { status: 401 });
      }

      const response = await axios.post("https://api.murf.ai/v1/speech/generate", {
        voiceId: voiceId || "en-US-natalie",
        text: text,
        format: "MP3",
        sampleRate: 48000,
      }, {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json"
        },
        timeout: 30000,
      });

      const finalResult = {
        audioUrl: response.data.audioFile,
        message: "Generated via Murf AI"
      };
      setCache(cacheKey, finalResult);
      addToHistory({ type: 'TTS', engine, text, targetLang, voiceId, audioUrl: finalResult.audioUrl });
      return NextResponse.json(finalResult);

    } else if (engine === "openai") {
      const apiKey = getSetting("OPENAI_API_KEY") || process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 401 });
      }

      const response = await axios.post(
        "https://api.openai.com/v1/audio/speech",
        {
          model: "tts-1-hd",
          input: text,
          voice: voiceId || "alloy",
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      );

      const base64Audio = Buffer.from(response.data).toString("base64");
      const finalResult = {
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
        message: "Generated via OpenAI TTS HD"
      };
      setCache(cacheKey, finalResult);
      addToHistory({ type: 'TTS', engine, text, targetLang, voiceId, audioUrl: finalResult.audioUrl });
      return NextResponse.json(finalResult);

    } else if (engine === "huggingface") {
      const apiKey = getSetting("HUGGINGFACE_API_KEY") || process.env.HUGGINGFACE_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Hugging Face API key not configured." }, { status: 401 });
      }

      const mmsModelMap: Record<string, string> = {
        "en": "eng", "es": "spa", "fr": "fra", "de": "deu", "it": "ita",
        "pt": "por", "hi": "hin", "ja": "jpn", "zh": "cmn", "ru": "rus",
        "ko": "kor", "ta": "tam", "bn": "ben", "ml": "mal", "te": "tel"
      };

      const mmsSuffix = mmsModelMap[targetLang] || "eng";
      const modelId = `facebook/mms-tts-${mmsSuffix}`;

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${modelId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Hugging Face API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString("base64");
      const finalResult = {
        audioUrl: `data:audio/wav;base64,${base64Audio}`,
        message: `Generated via Hugging Face MMS TTS (${mmsSuffix})`
      };
      setCache(cacheKey, finalResult);
      addToHistory({ type: 'TTS', engine, text, targetLang, voiceId, audioUrl: finalResult.audioUrl });
      return NextResponse.json(finalResult);

    } else if (engine === "gtts") {
      const lang = targetLang || "en";
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

      const finalResult = {
        audioUrl: url,
        message: "Generated via Free Google TTS (GTTS)"
      };
      setCache(cacheKey, finalResult);
      addToHistory({ type: 'TTS', engine, text, targetLang, voiceId, audioUrl: finalResult.audioUrl });
      return NextResponse.json(finalResult);

    } else {
      return NextResponse.json({ error: `Unsupported TTS engine: ${engine}` }, { status: 400 });
    }

  } catch (error: any) {
    const status = error.response?.status || 500;
    const responseData = error.response?.data;
    let detail = "";
    if (responseData) {
      if (typeof responseData === "string") {
        detail = responseData;
      } else if (Buffer.isBuffer(responseData) || responseData instanceof ArrayBuffer) {
        try { detail = Buffer.from(responseData).toString("utf-8").substring(0, 500); } catch {}
      } else {
        detail = JSON.stringify(responseData).substring(0, 500);
      }
    }
    console.error(`[TTS] Error (${status}):`, error.message, detail ? `\nResponse: ${detail}` : "");
    
    const errorMessage = error.response?.data?.detail?.message 
      || error.response?.data?.error 
      || error.response?.data?.message
      || error.message 
      || "TTS generation failed";
    
    return NextResponse.json({
      error: `TTS Error (${engine || "unknown"}): ${errorMessage}`,
      details: detail || undefined
    }, { status: 500 });
  }
}
