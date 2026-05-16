 
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH'

export interface BodyMapEntry {
  region: string
  symptoms: string[]
  severity: 'Mild' | 'Moderate' | 'Severe'
  notes?: string
}

export interface FaceScanResult {
  facial_edema: boolean
  periorbital_edema: boolean
  pallor: boolean
  asymmetry: boolean
}

export interface SymptomReport {
  risk_level: RiskLevel
  red_flags: string[]
  soap: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
  patient_summary: string
  disclaimer: string
  generated_at: string
}

export interface ReportRequest {
  voice_input: string
  body_map: BodyMapEntry[]
  face_scan?: FaceScanResult
}