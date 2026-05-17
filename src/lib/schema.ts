// Exact JSON schema for all Claude API inputs and outputs

export interface BodyMapEntry {
  region: BodyRegion;
  symptoms: string[];
  severity: "mild" | "moderate" | "severe";
  notes?: string;
}

export interface FaceScanResult {
  facial_edema: boolean;
  periorbital_edema: boolean;
  pallor: boolean;
  facial_asymmetry: boolean;
  scan_available: boolean;
  notes?: string;
}

export interface ReportRequest {
  voice_input: string;
  body_map: BodyMapEntry[];
  face_scan: FaceScanResult;
  face_image_base64?: string;
  days_postpartum?: number;
  prior_conditions?: string[];
  escalated?: boolean;
  dismissal_reason?: string;
}

export const FACE_SYMPTOMS_ENUM = [
  "periorbital edema",
  "facial edema",
  "facial flushing",
  "pallor",
  "jaundice",
  "visual disturbances",
  "facial paresthesia",
  "severe cephalgia",
  "diaphoresis",
  "cyanosis",
] as const;

export type FaceSymptom = typeof FACE_SYMPTOMS_ENUM[number];

export interface SOAPNote {
  subjective: {
    chief_complaint: string;
    history_of_present_illness: string;
    symptom_onset: string;
    aggravating_factors: string;
    relieving_factors: string;
    associated_symptoms: string[];
    postpartum_context: string;
  };
  objective: {
    reported_vitals: string;
    body_map_findings: string[];
    face_scan_findings: string[];
    symptom_distribution: string;
  };
  assessment: {
    clinical_impression: string;
    symptom_risk_analysis: {
      symptom: string;
      cardiovascular_significance: string;
      associated_conditions: string[];
    }[];
    differential_considerations: { condition: string; reasoning: string }[];
    red_flags_present: RedFlag[];
    risk_level: "LOW" | "MODERATE" | "HIGH";
    risk_rationale: string;
  };
  plan: {
    recommended_actions: string[];
    urgency: "routine" | "urgent" | "emergent";
    questions_for_provider: string[];
    bring_to_appointment: string[];
  };
}

export interface RedFlag {
  flag: string;
  clinical_concern: string;
  body_region?: string;
  severity: "warning" | "urgent" | "emergent";
}

export interface ReportResponse {
  soap_note: SOAPNote;
  patient_summary: string;
  risk_level: "LOW" | "MODERATE" | "HIGH";
  risk_explanation_plain: string;
  what_to_do_now: string[];
  symptom_plain_explanations: {
    symptom: string;
    plain_explanation: string;
    why_it_matters: string;
  }[];
  warning_signs_to_watch: string[];
  faceSymptoms: FaceSymptom[];
  red_flags: RedFlag[];
  clinical_terms_used: { lay_term: string; clinical_term: string }[];
  disclaimer: string;
  generated_at: string;
}

export type BodyRegion =
  | "head"
  | "face"
  | "neck"
  | "chest"
  | "left-breast"
  | "right-breast"
  | "upper-abdomen"
  | "lower-abdomen"
  | "left-arm"
  | "right-arm"
  | "left-hand"
  | "right-hand"
  | "left-thigh"
  | "right-thigh"
  | "left-calf"
  | "right-calf"
  | "left-foot"
  | "right-foot"
  | "upper-back"
  | "lower-back";

export const BODY_REGION_SYMPTOMS: Record<BodyRegion, string[]> = {
  head: ["headache", "severe headache", "dizziness", "lightheadedness", "confusion", "vision changes", "fainting"],
  face: ["facial swelling", "puffiness around eyes", "facial numbness", "paleness"],
  neck: ["neck pain", "neck stiffness", "swollen glands", "difficulty swallowing"],
  chest: ["chest pain", "chest tightness", "shortness of breath", "palpitations", "rapid heartbeat", "irregular heartbeat", "pressure"],
  "left-breast": ["breast pain", "swelling", "redness", "warmth", "lump"],
  "right-breast": ["breast pain", "swelling", "redness", "warmth", "lump"],
  "upper-abdomen": ["upper abdominal pain", "nausea", "vomiting", "bloating"],
  "lower-abdomen": ["cramping", "pelvic pain", "pressure", "bloating"],
  "left-arm": ["arm pain", "weakness", "numbness", "tingling", "swelling"],
  "right-arm": ["arm pain", "weakness", "numbness", "tingling", "swelling"],
  "left-hand": ["hand swelling", "numbness", "tingling", "pain", "weakness"],
  "right-hand": ["hand swelling", "numbness", "tingling", "pain", "weakness"],
  "left-thigh": ["thigh pain", "swelling", "warmth", "redness", "heaviness"],
  "right-thigh": ["thigh pain", "swelling", "warmth", "redness", "heaviness"],
  "left-calf": ["calf pain", "swelling", "warmth", "redness", "tenderness"],
  "right-calf": ["calf pain", "swelling", "warmth", "redness", "tenderness"],
  "left-foot": ["foot swelling", "ankle swelling", "pain", "numbness", "coldness"],
  "right-foot": ["foot swelling", "ankle swelling", "pain", "numbness", "coldness"],
  "upper-back": ["upper back pain", "shoulder blade pain", "muscle aches"],
  "lower-back": ["lower back pain", "radiating pain", "muscle spasm"],
};

