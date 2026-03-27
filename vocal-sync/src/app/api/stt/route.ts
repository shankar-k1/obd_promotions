import { NextRequest, NextResponse } from "next/server";
import { DeepgramClient } from "@deepgram/sdk";
import axios from "axios";
import { getSetting, getCache, setCache, addToHistory } from "@/lib/db";
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const engine = formData.get("engine") as string || "deepgram";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file size limit from database
    const limitMb = parseInt(getSetting("FILE_SIZE_LIMIT_MB") || "25");
    const limitBytes = limitMb * 1024 * 1024;

    if (file.size > limitBytes) {
      return NextResponse.json({
        error: `File size exceeds the limit of ${limitMb}MB set by administrator.`
      }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create a cache key based on file hash and engine
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');
    const cacheKey = `stt_${engine}_${fileHash}`;

    // Check cache
    const cachedResult = getCache(cacheKey);
    if (cachedResult) {
      console.log(`[STT] Cache HIT for ${file.name}`);
      return NextResponse.json(cachedResult);
    }

    console.log(`[STT] Cache MISS for ${file.name}. Engine: ${engine}, Size: ${file.size} bytes`);

    if (engine === "deepgram") {
      const apiKey = getSetting("DEEPGRAM_API_KEY") || process.env.DEEPGRAM_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Deepgram API key not configured. Update in Admin Panel or .env file." }, { status: 401 });
      }

      let contentType = file.type;
      if (!contentType || contentType === "application/octet-stream") {
        if (file.name.endsWith(".wav")) contentType = "audio/wav";
        else if (file.name.endsWith(".mp3")) contentType = "audio/mpeg";
        else if (file.name.endsWith(".m4a")) contentType = "audio/mp4";
        else if (file.name.endsWith(".ogg")) contentType = "audio/ogg";
        else contentType = "audio/mpeg"; // Default
      }

      // Use Deepgram REST API directly for reliability
      const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&detect_language=true", {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiKey}`,
          "Content-Type": contentType,
        },
        body: buffer,
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("[STT] Deepgram API Error:", response.status, errBody);
        return NextResponse.json({ error: `Deepgram error: ${response.status} - ${errBody}` }, { status: response.status });
      }

      let result = await response.json();
      console.log(`[STT] Deepgram Result (initial):`, JSON.stringify(result, null, 2));

      let transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      let detectedLang = result?.results?.channels?.[0]?.detected_language || "en";

      // Fallback: If no transcript, try a simpler request without language detection/smart format
      if (!transcript) {
        console.warn("[STT] No transcript with advanced features, retrying with basic settings...");
        const fallbackResponse = await fetch("https://api.deepgram.com/v1/listen?model=nova-2", {
          method: "POST",
          headers: {
            "Authorization": `Token ${apiKey}`,
            "Content-Type": contentType,
          },
          body: buffer,
        });

        if (fallbackResponse.ok) {
          result = await fallbackResponse.json();
          console.log(`[STT] Deepgram Result (fallback):`, JSON.stringify(result, null, 2));
          transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
        }
      }

      if (!transcript || transcript.trim() === "") {
        console.warn("[STT] Deepgram returned no transcript for file:", file.name);
        return NextResponse.json({ 
          error: "No transcript could be generated. This often happens with very short audio, silence, or low volume.",
          details: "Try a different STT engine (like Groq or AssemblyAI) or ensure the audio quality is clear."
        }, { status: 422 });
      }

      const finalResult = { text: transcript, language: detectedLang };
      setCache(cacheKey, finalResult);
      return NextResponse.json(finalResult);

    } else if (engine === "whisper") {
      const apiKey = getSetting("OPENAI_API_KEY") || process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 401 });
      }

      const whisperFormData = new FormData();
      whisperFormData.append("file", file);
      whisperFormData.append("model", "whisper-1");

      const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", whisperFormData, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });

      const finalResult = { text: response.data.text, language: "en" };
      setCache(cacheKey, finalResult);
      return NextResponse.json(finalResult);

    } else if (engine === "assemblyai") {
      const apiKey = getSetting("ASSEMBLYAI_API_KEY") || process.env.ASSEMBLYAI_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "AssemblyAI API key not configured." }, { status: 401 });
      }

      // Step 1: Upload file
      const uploadResponse = await axios.post("https://api.assemblyai.com/v2/upload", buffer, {
        headers: { "Authorization": apiKey, "Content-Type": "application/octet-stream" }
      });

      const audioUrl = uploadResponse.data.upload_url;

      // Step 2: Transcribe
      const transcribeResponse = await axios.post("https://api.assemblyai.com/v2/transcript", {
        audio_url: audioUrl,
        language_detection: true,
      }, {
        headers: { "Authorization": apiKey, "Content-Type": "application/json" }
      });

      const transcriptId = transcribeResponse.data.id;

      // Step 3: Wait for completion
      let status = "queued";
      let transcriptResult: any = null;

      while (status !== "completed" && status !== "error") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: { "Authorization": apiKey }
        });
        status = statusResponse.data.status;
        transcriptResult = statusResponse.data;
      }

      if (status === "error") {
        return NextResponse.json({ error: "AssemblyAI transcription failed." }, { status: 500 });
      }

      const finalResult = { text: transcriptResult.text, language: transcriptResult.language_code || "en" };
      setCache(cacheKey, finalResult);
      return NextResponse.json(finalResult);

    } else if (engine === "groq") {
      const apiKey = getSetting("GROQ_API_KEY") || process.env.GROQ_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Groq API key not configured." }, { status: 401 });
      }

      const groqFormData = new FormData();
      groqFormData.append("file", file);
      groqFormData.append("model", "whisper-large-v3");
      groqFormData.append("response_format", "verbose_json"); // Request detailed output including language

      const response = await axios.post("https://api.groq.com/openai/v1/audio/transcriptions", groqFormData, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });

      const finalResult = { text: response.data.text, language: response.data.language || "en" };
      setCache(cacheKey, finalResult);
      return NextResponse.json(finalResult);

    } else if (engine === "huggingface") {
      const apiKey = getSetting("HUGGINGFACE_API_KEY") || process.env.HUGGINGFACE_API_KEY;
      if (!apiKey || apiKey.includes("your_")) {
        return NextResponse.json({ error: "Hugging Face API key not configured." }, { status: 401 });
      }

      const response = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3", {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: "POST",
        body: buffer,
      });

      const finalResult = { text: result.text, language: "en" };
      setCache(cacheKey, finalResult);
      return NextResponse.json(finalResult);

    } else {
      return NextResponse.json({ error: `Unsupported STT engine: ${engine}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[STT] Unhandled Error:", error.response?.data || error.message || error);
    return NextResponse.json({
      error: error.response?.data?.error?.message || error.message || "Unknown error occurred"
    }, { status: 500 });
  }
}
