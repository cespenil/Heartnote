import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, DISCLAIMER } from "@/lib/system-prompt";
import type { ReportRequest, ReportResponse } from "@/lib/schema";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Use vision model when a face image is provided, text model otherwise
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function POST(req: NextRequest) {
  console.log("\n🩺 [generate-report] POST received", new Date().toISOString())
  try {
    const body: ReportRequest = await req.json();

    console.log("📋 [generate-report] Payload summary:", {
      voice_input_length: body.voice_input?.length ?? 0,
      body_map_regions: body.body_map?.map(e => e.region) ?? [],
      has_face_image: !!body.face_image_base64,
      days_postpartum: body.days_postpartum ?? null,
      prior_conditions: body.prior_conditions ?? [],
    })

    if (!body.voice_input && (!body.body_map || body.body_map.length === 0)) {
      console.warn("⚠️ [generate-report] Rejected: no voice_input and no body_map")
      return NextResponse.json(
        { error: "At least one of voice_input or body_map must be provided." },
        { status: 400 }
      );
    }

    const hasImage = !!body.face_image_base64;
    console.log(`🤖 [generate-report] Using model: ${hasImage ? VISION_MODEL : TEXT_MODEL}`)

    const symptomPayload = JSON.stringify(
      {
        voice_input: body.voice_input || "",
        body_map: body.body_map || [],
        face_scan: body.face_scan || {
          facial_edema: false,
          periorbital_edema: false,
          pallor: false,
          facial_asymmetry: false,
          scan_available: false,
        },
        days_postpartum: body.days_postpartum ?? null,
        prior_conditions: body.prior_conditions ?? [],
      },
      null,
      2
    );

    // Build user message content — include image if provided
    const userContent: Groq.Chat.ChatCompletionContentPart[] = hasImage
      ? [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${body.face_image_base64}`,
            },
          },
          {
            type: "text",
            text: `Analyze the face photo above for visible clinical markers. Then process the following symptom data and return the full JSON report.\n\n${symptomPayload}`,
          },
        ]
      : [{ type: "text", text: symptomPayload }];

    const completion = await groq.chat.completions.create({
      model: hasImage ? VISION_MODEL : TEXT_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4096,
    });

    const rawText = completion.choices[0]?.message?.content ?? "";
    console.log(`📨 [generate-report] Groq responded, raw length: ${rawText.length} chars`)

    let report: ReportResponse;
    try {
      report = JSON.parse(rawText);
      console.log("✅ [generate-report] JSON parsed successfully")
    } catch {
      console.warn("⚠️ [generate-report] JSON parse failed, attempting cleanup...")
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      report = JSON.parse(cleaned);
      console.log("✅ [generate-report] JSON parsed after cleanup")
    }

    // Guarantee required fields — guard against AI returning partial/malformed JSON
    report.disclaimer = DISCLAIMER;
    report.generated_at = new Date().toISOString();
    if (!Array.isArray(report.faceSymptoms)) report.faceSymptoms = [];
    if (!Array.isArray(report.red_flags)) report.red_flags = [];
    if (!Array.isArray(report.what_to_do_now)) report.what_to_do_now = [];
    if (!Array.isArray(report.warning_signs_to_watch)) report.warning_signs_to_watch = [];
    if (!Array.isArray(report.symptom_plain_explanations)) report.symptom_plain_explanations = [];
    if (!Array.isArray(report.clinical_terms_used)) report.clinical_terms_used = [];
    if (!report.risk_level || !['LOW','MODERATE','HIGH'].includes(report.risk_level)) report.risk_level = 'LOW';
    if (!report.risk_explanation_plain) report.risk_explanation_plain = '';
    if (!report.patient_summary) report.patient_summary = '';
    // Ensure soap_note structure exists
    if (report.soap_note) {
      const s = report.soap_note;
      if (!s.subjective) s.subjective = {} as never;
      if (!s.objective) s.objective = {} as never;
      if (!s.assessment) s.assessment = {} as never;
      if (!s.plan) s.plan = {} as never;
      if (!Array.isArray(s.objective?.body_map_findings)) s.objective.body_map_findings = [];
      if (!Array.isArray(s.objective?.face_scan_findings)) s.objective.face_scan_findings = [];
      if (!Array.isArray(s.assessment?.symptom_risk_analysis)) s.assessment.symptom_risk_analysis = [];
      if (!Array.isArray(s.assessment?.differential_considerations)) s.assessment.differential_considerations = [];
      if (!Array.isArray(s.plan?.recommended_actions)) s.plan.recommended_actions = [];
      if (!Array.isArray(s.plan?.questions_for_provider)) s.plan.questions_for_provider = [];
      if (!Array.isArray(s.plan?.bring_to_appointment)) s.plan.bring_to_appointment = [];
      if (!s.plan?.urgency) s.plan.urgency = 'routine';
      if (!Array.isArray(s.subjective?.associated_symptoms)) s.subjective.associated_symptoms = [];
    }

    console.log(`🎉 [generate-report] Done — risk_level: ${report.risk_level}, red_flags: ${report.red_flags?.length ?? 0}`)
    return NextResponse.json(report);
  } catch (err) {
    console.error("❌ [generate-report] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate report. Please try again." },
      { status: 500 }
    );
  }
}
