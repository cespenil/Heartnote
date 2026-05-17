export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

export interface RiskRule {
  id: string;
  description: string;
  triggers: string[];
  risk_level: RiskLevel;
  red_flag_label: string;
  clinical_concern: string;
  urgency: "routine" | "urgent" | "emergent";
  severity: "warning" | "urgent" | "emergent";
}

export const RISK_RULES: RiskRule[] = [
  {
    id: "chest-pain-sob",
    description: "Chest pain combined with shortness of breath",
    triggers: ["chest", "shortness of breath", "chest pain", "dyspnea"],
    risk_level: "HIGH",
    red_flag_label: "Possible Peripartum Cardiomyopathy",
    clinical_concern: "Concurrent chest pain and dyspnea in a postpartum patient is a red-flag combination for peripartum cardiomyopathy or pulmonary embolism. Requires immediate evaluation.",
    urgency: "emergent",
    severity: "emergent",
  },
  {
    id: "severe-headache-vision",
    description: "Severe headache with visual changes",
    triggers: ["severe headache", "vision", "blurry vision", "spots", "flashing lights", "scotomata"],
    risk_level: "HIGH",
    red_flag_label: "Possible Postpartum Preeclampsia / Hypertensive Emergency",
    clinical_concern: "The combination of severe headache and visual disturbances is a hallmark presentation of postpartum preeclampsia or hypertensive emergency. Blood pressure evaluation is urgent.",
    urgency: "emergent",
    severity: "emergent",
  },
  {
    id: "unilateral-calf-dvt",
    description: "Unilateral calf swelling, warmth, or redness",
    triggers: ["left-calf", "right-calf", "one calf", "calf pain", "calf tenderness", "calf swelling"],
    risk_level: "HIGH",
    red_flag_label: "Possible Deep Vein Thrombosis (DVT)",
    clinical_concern: "Unilateral calf swelling, warmth, or tenderness in the postpartum period is highly suspicious for deep vein thrombosis. DVT can progress to pulmonary embolism if untreated.",
    urgency: "urgent",
    severity: "urgent",
  },
  {
    id: "hemoptysis",
    description: "Coughing up blood",
    triggers: ["coughing up blood", "hemoptysis", "blood when coughing"],
    risk_level: "HIGH",
    red_flag_label: "Possible Pulmonary Embolism",
    clinical_concern: "Hemoptysis combined with dyspnea in a postpartum patient is a critical warning sign for pulmonary embolism. Emergent evaluation is required.",
    urgency: "emergent",
    severity: "emergent",
  },
  {
    id: "syncope",
    description: "Loss of consciousness or fainting",
    triggers: ["passed out", "fainted", "syncope", "loss of consciousness", "blacked out"],
    risk_level: "HIGH",
    red_flag_label: "Syncope — Cardiac Origin Cannot Be Excluded",
    clinical_concern: "Syncope in the postpartum period may indicate hemodynamic compromise, arrhythmia, or hemorrhage. Requires urgent cardiac and hemodynamic evaluation.",
    urgency: "emergent",
    severity: "emergent",
  },
  {
    id: "pnd-orthopnea",
    description: "Cannot lie flat / wakes gasping",
    triggers: ["orthopnea", "paroxysmal nocturnal dyspnea", "can't breathe lying down", "waking up gasping"],
    risk_level: "HIGH",
    red_flag_label: "Orthopnea / PND — Possible Heart Failure",
    clinical_concern: "Inability to lie flat and nocturnal dyspnea are classic signs of left-sided heart failure, consistent with peripartum cardiomyopathy.",
    urgency: "urgent",
    severity: "urgent",
  },
  {
    id: "bilateral-edema-moderate",
    description: "Bilateral leg or foot swelling (moderate severity)",
    triggers: ["bilateral edema", "bilateral swelling", "both feet", "both ankles", "both legs swollen"],
    risk_level: "MODERATE",
    red_flag_label: "Bilateral Edema — Fluid Retention Concern",
    clinical_concern: "Bilateral pitting edema beyond what is expected in early postpartum recovery may indicate fluid overload, cardiac dysfunction, or hypertensive disease.",
    urgency: "urgent",
    severity: "urgent",
  },
  {
    id: "palpitations-alone",
    description: "Palpitations or racing heart without other symptoms",
    triggers: ["palpitations", "tachycardia", "racing heart", "heart pounding"],
    risk_level: "MODERATE",
    red_flag_label: "Palpitations — Arrhythmia Evaluation Recommended",
    clinical_concern: "Persistent palpitations or tachycardia in the postpartum period warrants cardiac evaluation to rule out arrhythmia or thyroid dysfunction.",
    urgency: "urgent",
    severity: "warning",
  },
  {
    id: "severe-headache-alone",
    description: "Severe headache without visual changes",
    triggers: ["severe headache", "worst headache", "throbbing headache"],
    risk_level: "MODERATE",
    red_flag_label: "Severe Headache — Blood Pressure Check Required",
    clinical_concern: "New severe headache in the postpartum period requires blood pressure measurement to rule out postpartum preeclampsia, even without visual symptoms.",
    urgency: "urgent",
    severity: "warning",
  },
  {
    id: "facial-edema",
    description: "Facial or periorbital swelling",
    triggers: ["facial edema", "periorbital edema", "face swollen", "puffy face", "puffiness around eyes"],
    risk_level: "MODERATE",
    red_flag_label: "Facial Edema — Hypertension / Preeclampsia Concern",
    clinical_concern: "Facial and periorbital edema in the postpartum period is a clinical marker associated with preeclampsia and fluid retention disorders.",
    urgency: "urgent",
    severity: "warning",
  },
  {
    id: "sob-exertion",
    description: "Shortness of breath with exertion only",
    triggers: ["shortness of breath", "dyspnea on exertion", "out of breath"],
    risk_level: "MODERATE",
    red_flag_label: "Exertional Dyspnea — Cardiac Evaluation Recommended",
    clinical_concern: "New-onset dyspnea on exertion postpartum exceeding normal deconditioning warrants evaluation for cardiac or pulmonary pathology.",
    urgency: "urgent",
    severity: "warning",
  },
  {
    id: "mild-fatigue",
    description: "Fatigue without cardiovascular symptoms",
    triggers: ["fatigue", "tired", "exhausted"],
    risk_level: "LOW",
    red_flag_label: "",
    clinical_concern: "Fatigue is common postpartum; no cardiovascular red flags identified. Monitor for escalating symptoms.",
    urgency: "routine",
    severity: "warning",
  },
  {
    id: "mild-edema",
    description: "Mild bilateral ankle swelling only",
    triggers: ["mild swelling", "ankle swelling"],
    risk_level: "LOW",
    red_flag_label: "",
    clinical_concern: "Mild bilateral ankle edema can be a normal postpartum finding. Document and reassess if worsening or accompanied by other symptoms.",
    urgency: "routine",
    severity: "warning",
  },
];

export const RISK_LEVEL_DEFINITIONS = `
RISK LEVEL DEFINITIONS (assign exactly one):

HIGH — Assign when ANY of the following are present:
  • Chest pain + shortness of breath (together)
  • Severe headache + visual changes (together)
  • Unilateral calf swelling/warmth/tenderness (DVT concern)
  • Hemoptysis (coughing up blood)
  • Syncope or loss of consciousness
  • Orthopnea (cannot lie flat) or paroxysmal nocturnal dyspnea
  • Rapid worsening of any symptom within hours
  HIGH urgency: recommend immediate emergency evaluation. Phrase as "go to the ER now" in patient view.

MODERATE — Assign when ANY of the following are present (without HIGH triggers):
  • Palpitations or tachycardia (persistent)
  • Shortness of breath with exertion only
  • Bilateral edema (moderate or severe)
  • Severe headache without visual changes
  • Facial or periorbital edema
  • Chest pain without dyspnea (mild severity)
  MODERATE urgency: recommend same-day or next-day evaluation. Phrase as "contact your provider today" in patient view.

LOW — Assign when:
  • Symptoms are mild and not cardiovascular-primary (fatigue, mild swelling only)
  • No combination risk factors present
  • Symptoms are explained by normal postpartum recovery
  LOW urgency: recommend mentioning at next scheduled appointment.
`;

export function getRulesForRegion(region: string): RiskRule[] {
  return RISK_RULES.filter((r) =>
    r.triggers.some((t) => t.toLowerCase().includes(region.toLowerCase()))
  );
}

