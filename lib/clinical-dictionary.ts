// Layperson → clinical terminology dictionary
// Used in the system prompt and for annotating the report output

export interface ClinicalMapping {
  lay_terms: string[];
  clinical_term: string;
  icd_hint?: string;
  cardiovascular_relevance: "primary" | "secondary" | "indirect";
}

export const SYMPTOM_DICTIONARY: ClinicalMapping[] = [
  // Cardiovascular — primary
  {
    lay_terms: ["racing heart", "heart beating fast", "heart pounding", "heartbeat too fast", "heart fluttering"],
    clinical_term: "tachycardia / palpitations",
    icd_hint: "R00.0",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["irregular heartbeat", "heart skipping", "heart missing a beat", "uneven heartbeat"],
    clinical_term: "cardiac arrhythmia / palpitations",
    icd_hint: "R00.1",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["chest pain", "chest tightness", "pressure in chest", "chest heaviness", "squeezing in chest"],
    clinical_term: "chest pain / angina-like symptoms",
    icd_hint: "R07.9",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["short of breath", "can't breathe", "hard to breathe", "breathless", "out of breath at rest", "winded"],
    clinical_term: "dyspnea / shortness of breath",
    icd_hint: "R06.09",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["can't breathe lying down", "have to sit up to breathe", "breathless when flat"],
    clinical_term: "orthopnea",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["waking up gasping", "can't breathe in the middle of the night", "waking up short of breath"],
    clinical_term: "paroxysmal nocturnal dyspnea (PND)",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["swelling", "puffiness", "bloated legs", "swollen ankles", "swollen feet", "swollen legs"],
    clinical_term: "bilateral pitting edema",
    icd_hint: "R60.0",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["one leg swollen", "one foot swollen", "one ankle swollen", "swelling in one leg"],
    clinical_term: "unilateral lower extremity edema",
    icd_hint: "R60.0",
    cardiovascular_relevance: "primary",
  },

  // Neurological — preeclampsia / hypertensive emergency
  {
    lay_terms: ["bad headache", "worst headache of my life", "throbbing headache", "pounding headache", "severe headache"],
    clinical_term: "severe cephalgia",
    icd_hint: "R51",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["blurry vision", "can't see clearly", "spots in vision", "vision is off", "seeing stars", "flashing lights"],
    clinical_term: "visual disturbance / scotomata",
    icd_hint: "H53.9",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["dizzy", "lightheaded", "woozy", "room spinning", "vertigo", "feel like fainting"],
    clinical_term: "dizziness / presyncope",
    icd_hint: "R42",
    cardiovascular_relevance: "secondary",
  },
  {
    lay_terms: ["passed out", "fainted", "blacked out", "lost consciousness"],
    clinical_term: "syncope / loss of consciousness",
    icd_hint: "R55",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["confused", "foggy brain", "hard to think", "can't concentrate", "not thinking clearly"],
    clinical_term: "cognitive impairment / altered mentation",
    cardiovascular_relevance: "secondary",
  },

  // DVT / PE indicators
  {
    lay_terms: ["calf pain", "back of leg pain", "leg cramp that won't go away", "calf tenderness"],
    clinical_term: "calf tenderness / Homan sign concern",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["leg is warm", "leg is hot", "warm spot on leg", "red leg"],
    clinical_term: "unilateral erythema and warmth of lower extremity",
    cardiovascular_relevance: "primary",
  },
  {
    lay_terms: ["coughing up blood", "blood when I cough"],
    clinical_term: "hemoptysis",
    icd_hint: "R04.2",
    cardiovascular_relevance: "primary",
  },

  // General / systemic
  {
    lay_terms: ["tired", "exhausted", "no energy", "fatigued", "drained", "can't get off the couch"],
    clinical_term: "fatigue / generalized weakness",
    icd_hint: "R53.83",
    cardiovascular_relevance: "indirect",
  },
  {
    lay_terms: ["face is puffy", "face looks swollen", "puffy face", "puffy around eyes"],
    clinical_term: "facial edema / periorbital edema",
    cardiovascular_relevance: "secondary",
  },
  {
    lay_terms: ["nausea", "feel sick", "queasy", "stomach upset"],
    clinical_term: "nausea",
    icd_hint: "R11.0",
    cardiovascular_relevance: "indirect",
  },
  {
    lay_terms: ["upper right stomach pain", "right side stomach pain under ribs", "pain under right ribs"],
    clinical_term: "right upper quadrant (RUQ) pain",
    cardiovascular_relevance: "secondary",
  },
  {
    lay_terms: ["pale", "look white", "skin is gray", "no color in my face"],
    clinical_term: "pallor / cutaneous hypoperfusion",
    cardiovascular_relevance: "secondary",
  },
];

export const SEVERITY_MAPPINGS: Record<string, string> = {
  mild: "Grade 1 — present but not limiting activity",
  moderate: "Grade 2 — limiting some daily activities",
  severe: "Grade 3 — limiting most/all daily activities or present at rest",
};

// Quick lookup: given a lay phrase, find its clinical term
export function findClinicalTerm(layPhrase: string): string | null {
  const lower = layPhrase.toLowerCase();
  for (const entry of SYMPTOM_DICTIONARY) {
    if (entry.lay_terms.some((t) => lower.includes(t.toLowerCase()))) {
      return entry.clinical_term;
    }
  }
  return null;
}

// Build the dictionary block injected into the system prompt
export function buildDictionaryBlock(): string {
  const lines = SYMPTOM_DICTIONARY.map(
    (e) => `  - "${e.lay_terms[0]}" → "${e.clinical_term}" (and variants: ${e.lay_terms.slice(1).join(", ")})`
  );
  return lines.join("\n");
}
