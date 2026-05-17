import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;

    if (!audio) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const groqFormData = new FormData();
    groqFormData.append("file", audio, "audio.webm");
    groqFormData.append("model", "whisper-large-v3");
    groqFormData.append("language", "en");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: groqFormData,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq transcription error:", err);
      return NextResponse.json(
        { error: "Transcription failed", details: err },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ transcript: data.text });

  } catch (error) {
    console.error("Transcribe route error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

