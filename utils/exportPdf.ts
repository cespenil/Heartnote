import jsPDF from 'jspdf'
import type { ReportResponse } from '@/lib/schema'

export interface PdfOptions {
  filename?: string
  elementId?: string
}

export function exportClinicalPDF(report: ReportResponse, filename = 'heartnote-clinical-report.pdf'): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pW = 210
  const pH = 297
  const ml = 22
  const mr = 22
  const cW = pW - ml - mr
  let y = 0
  let pageNum = 1

  const rc: [number, number, number] =
    report.risk_level === 'HIGH'     ? [220, 38, 38]  :
    report.risk_level === 'MODERATE' ? [217, 119, 6]  :
                                       [5, 150, 105]

  // ── Core helpers ────────────────────────────────────────────

  const fill = (x: number, yp: number, w: number, h: number, c: [number, number, number]) => {
    pdf.setFillColor(c[0], c[1], c[2])
    pdf.rect(x, yp, w, h, 'F')
  }

  const hline = (yp: number, c: [number, number, number] = [210, 210, 220]): number => {
    pdf.setDrawColor(c[0], c[1], c[2])
    pdf.setLineWidth(0.3)
    pdf.line(ml, yp, pW - mr, yp)
    return yp + 5
  }

  const t = (
    str: string,
    x: number,
    yp: number,
    opts: { sz?: number; bold?: boolean; italic?: boolean; col?: [number, number, number]; mw?: number; lh?: number } = {}
  ): number => {
    if (!str?.trim()) return yp
    const { sz = 10, bold = false, italic = false, col = [30, 30, 40], mw = cW, lh = 5.5 } = opts
    pdf.setFontSize(sz)
    pdf.setFont('helvetica', italic ? 'italic' : bold ? 'bold' : 'normal')
    pdf.setTextColor(col[0], col[1], col[2])
    const lines = pdf.splitTextToSize(String(str), mw)
    pdf.text(lines, x, yp)
    return yp + lines.length * lh
  }

  const guard = (needed: number) => {
    if (y + needed > pH - 20) {
      renderFooter()
      pdf.addPage()
      pageNum++
      y = 22
      pdf.setFontSize(8.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(120, 80, 220)
      pdf.text('HeartNote Clinical Summary (continued)', ml, 14)
      pdf.setDrawColor(210, 210, 220)
      pdf.setLineWidth(0.25)
      pdf.line(ml, 17, pW - mr, 17)
    }
  }

  const renderFooter = () => {
    const fy = pH - 10
    pdf.setDrawColor(200, 200, 210)
    pdf.setLineWidth(0.25)
    pdf.line(ml, fy - 3, pW - mr, fy - 3)
    pdf.setFontSize(7.5)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(160, 160, 170)
    pdf.text('HeartNote — Clinical Communication Aid | NOT a diagnosis or medical advice', ml, fy + 1)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${pageNum}`, pW - mr, fy + 1, { align: 'right' })
  }

  const sectionBanner = (title: string, bg: [number, number, number] = [242, 242, 250]) => {
    guard(18)
    fill(ml, y, cW, 9, bg)
    pdf.setDrawColor(200, 200, 220)
    pdf.setLineWidth(0.25)
    pdf.rect(ml, y, cW, 9, 'S')
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(60, 60, 90)
    pdf.text(title, ml + 4, y + 6.2)
    y += 14
  }

  // field: label above value, generous vertical gaps
  const field = (label: string, value: string) => {
    if (!value?.trim()) return
    const lines = pdf.splitTextToSize(String(value), cW - 4)
    const needed = 6 + lines.length * 5.5 + 8
    guard(needed)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 140)
    pdf.text(label.toUpperCase(), ml, y)
    y += 5
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(25, 25, 35)
    pdf.text(lines, ml + 4, y)
    y += lines.length * 5.5 + 3
    pdf.setDrawColor(220, 220, 232)
    pdf.setLineWidth(0.2)
    pdf.line(ml, y, pW - mr, y)
    y += 6
  }

  const listField = (label: string, items: string[], numbered = false) => {
    if (!items?.length) return
    guard(24)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 140)
    pdf.text(label.toUpperCase(), ml, y)
    y += 5
    items.forEach((item, i) => {
      const lines = pdf.splitTextToSize(String(item), cW - 14)
      guard(lines.length * 5.5 + 5)
      const bullet = numbered ? `${i + 1}.` : '•'
      pdf.setFontSize(9.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(120, 90, 200)
      pdf.text(bullet, ml + 4, y)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(25, 25, 35)
      pdf.text(lines, ml + 11, y)
      y += lines.length * 5.5 + 3
    })
    pdf.setDrawColor(220, 220, 232)
    pdf.setLineWidth(0.2)
    pdf.line(ml, y, pW - mr, y)
    y += 6
  }

  // ══════════════════════════════════════════════════════════════
  // PAGE 1 HEADER
  // ══════════════════════════════════════════════════════════════

  fill(0, 0, pW, 30, [90, 50, 200])
  pdf.setFontSize(19)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(255, 255, 255)
  pdf.text('HeartNote', ml, 14)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(210, 190, 255)
  pdf.text('Postpartum Cardiovascular Clinical Summary', ml, 23)
  pdf.setFontSize(8.5)
  pdf.setTextColor(210, 190, 255)
  pdf.text(new Date(report.generated_at).toLocaleString(), pW - mr, 14, { align: 'right' })
  y = 34

  // Risk banner
  fill(ml, y, cW, 13, rc)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(255, 255, 255)
  pdf.text(`RISK LEVEL: ${report.risk_level}`, ml + 6, y + 8.5)
  const urg = report.soap_note?.plan?.urgency
  if (urg) {
    pdf.setFontSize(8.5)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Urgency: ${urg.toUpperCase()}`, pW - mr - 4, y + 8.5, { align: 'right' })
  }
  y += 17

  y = t(report.risk_explanation_plain, ml, y, { sz: 10, col: [50, 50, 70], lh: 5.5 })
  y += 6
  y = hline(y)

  // ══════════════════════════════════════════════════════════════
  // RED FLAGS
  // ══════════════════════════════════════════════════════════════
  if (report.red_flags?.length > 0) {
    sectionBanner('[!!] RED FLAGS - REQUIRES CLINICAL ATTENTION', [255, 243, 243])
    const sevCol: Record<string, [number, number, number]> = {
      warning:  [217, 119, 6],
      urgent:   [234, 88, 12],
      emergent: [220, 38, 38],
    }
    report.red_flags.forEach(flag => {
      // Normalize severity — AI sometimes returns [URGENT] or URGENT instead of urgent
      const sevKey = flag.severity.toLowerCase().replace(/[\[\]\s]/g, '') as keyof typeof sevCol
      const sc = sevCol[sevKey] ?? sevCol.urgent
      const sevLabel = sevKey.toUpperCase()
      const flagLines = pdf.splitTextToSize(flag.flag, cW - 14)
      const clines = pdf.splitTextToSize(flag.clinical_concern, cW - 14)
      // contentH: 5 (badge row) + 8 (gap) + flagLines×7 + 3 (gap) + clines×5.5
      const contentH = 5 + 8 + flagLines.length * 7 + 3 + clines.length * 5.5
      guard(contentH + 10)
      // Left accent bar
      pdf.setFillColor(sc[0], sc[1], sc[2])
      pdf.rect(ml, y, 2.5, contentH, 'F')
      // Row 1: severity badge (8pt) — baseline at y+5
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(sc[0], sc[1], sc[2])
      pdf.text(`[${sevLabel}]`, ml + 7, y + 5)
      y += 13  // 13mm gap ensures flag name baseline is clear of 8pt badge
      // Row 2: flag name (10.5pt bold)
      pdf.setFontSize(10.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(25, 25, 35)
      pdf.text(flagLines, ml + 7, y)
      y += flagLines.length * 7 + 4
      // Row 3: clinical concern (9pt)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(70, 70, 80)
      pdf.text(clines, ml + 7, y)
      y += clines.length * 5.5 + 10
    })
  }

  // ══════════════════════════════════════════════════════════════
  // SOAP NOTE
  // ══════════════════════════════════════════════════════════════
  if (report.soap_note) {
    const s = report.soap_note

    // S — Subjective
    sectionBanner('S — SUBJECTIVE', [248, 248, 255])
    field('Chief Complaint', s.subjective.chief_complaint)
    field('History of Present Illness', s.subjective.history_of_present_illness)
    field('Onset', s.subjective.symptom_onset)
    field('Aggravating Factors', s.subjective.aggravating_factors)
    field('Relieving Factors', s.subjective.relieving_factors)
    if (s.subjective.associated_symptoms?.length) field('Associated Symptoms', s.subjective.associated_symptoms.join('  ·  '))
    field('Postpartum Context', s.subjective.postpartum_context)

    // O — Objective
    sectionBanner('O — OBJECTIVE', [247, 255, 248])
    field('Reported Vitals', s.objective.reported_vitals)
    if (s.objective.body_map_findings?.length) listField('Body Map Findings', s.objective.body_map_findings, true)
    if (s.objective.face_scan_findings?.length) listField('Face Scan Findings', s.objective.face_scan_findings)
    field('Symptom Distribution', s.objective.symptom_distribution)

    // A — Assessment
    sectionBanner('A — ASSESSMENT', [255, 252, 245])
    field('Clinical Impression', s.assessment.clinical_impression)
    field('Risk Rationale', s.assessment.risk_rationale)

    if (s.assessment.differential_considerations?.length) {
      guard(24)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(100, 100, 140)
      pdf.text('DIFFERENTIAL CONSIDERATIONS', ml, y)
      y += 6
      s.assessment.differential_considerations.forEach((d, i) => {
        const rlines = pdf.splitTextToSize(d.reasoning, cW - 12)
        guard(8 + rlines.length * 5.5 + 5)
        y = t(`${i + 1}.  ${d.condition}`, ml + 4, y, { sz: 10.5, bold: true, col: [40, 40, 70], lh: 6 })
        pdf.setFontSize(9.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(80, 80, 90)
        pdf.text(rlines, ml + 10, y)
        y += rlines.length * 5.5 + 5
      })
      pdf.setDrawColor(220, 220, 232)
      pdf.setLineWidth(0.2)
      pdf.line(ml, y, pW - mr, y)
      y += 6
    }

    if (s.assessment.symptom_risk_analysis?.length) {
      guard(24)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(100, 100, 140)
      pdf.text('SYMPTOM RISK ANALYSIS', ml, y)
      y += 6
      s.assessment.symptom_risk_analysis.forEach(sym => {
        const sigLines = pdf.splitTextToSize(sym.cardiovascular_significance, cW - 8)
        const assocLines = sym.associated_conditions?.length
          ? pdf.splitTextToSize('Associated: ' + sym.associated_conditions.join(', '), cW - 8)
          : []
        const blockH = 6 + sigLines.length * 5.5 + (assocLines.length ? assocLines.length * 5 + 2 : 0) + 6
        guard(blockH)
        pdf.setFillColor(139, 92, 246)
        pdf.rect(ml, y, 2, blockH - 4, 'F')
        y = t(sym.symptom, ml + 6, y, { sz: 10.5, bold: true, col: [40, 40, 70], lh: 6 })
        pdf.setFontSize(9.5)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(70, 70, 90)
        pdf.text(sigLines, ml + 6, y)
        y += sigLines.length * 5.5
        if (assocLines.length) {
          y += 2
          pdf.setFontSize(8.5)
          pdf.setFont('helvetica', 'italic')
          pdf.setTextColor(130, 100, 200)
          pdf.text(assocLines, ml + 6, y)
          y += assocLines.length * 5
        }
        y += 7
      })
    }

    // P — Plan
    sectionBanner('P — PLAN', [245, 255, 252])

    const urgColors: Record<string, [number, number, number]> = {
      routine:  [5, 150, 105],
      urgent:   [217, 119, 6],
      emergent: [220, 38, 38],
    }
    const urgKey = s.plan.urgency.toLowerCase().replace(/[\[\]\s]/g, '') as keyof typeof urgColors
    const uc = urgColors[urgKey] ?? urgColors.routine
    fill(ml, y, 52, 9, uc)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text(`URGENCY: ${urgKey.toUpperCase()}`, ml + 5, y + 6.2)
    y += 14

    if (s.plan.recommended_actions?.length) listField('Recommended Actions', s.plan.recommended_actions, true)
    if (s.plan.questions_for_provider?.length) listField('Questions for Provider', s.plan.questions_for_provider)
    if (s.plan.bring_to_appointment?.length) field('Bring to Appointment', s.plan.bring_to_appointment.join(', '))
  }

  // ══════════════════════════════════════════════════════════════
  // CLINICAL TERMS
  // ══════════════════════════════════════════════════════════════
  if (report.clinical_terms_used?.length) {
    sectionBanner('CLINICAL TERMINOLOGY REFERENCE')
    const colSplit = 58  // clinical term column width
    const layX = ml + colSplit + 6  // lay term x position
    const layW = cW - colSplit - 6
    report.clinical_terms_used.forEach(term => {
      pdf.setFontSize(9.5)
      pdf.setFont('helvetica', 'bold')
      const clinLines = pdf.splitTextToSize(term.clinical_term, colSplit)
      pdf.setFont('helvetica', 'normal')
      const layLines = pdf.splitTextToSize(`— ${term.lay_term}`, layW)
      const rowH = Math.max(clinLines.length, layLines.length) * 6 + 5
      guard(rowH)
      pdf.setFontSize(9.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(40, 40, 60)
      pdf.text(clinLines, ml + 3, y)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(80, 80, 110)
      pdf.text(layLines, layX, y)
      pdf.setDrawColor(230, 230, 238)
      pdf.setLineWidth(0.15)
      pdf.line(ml, y + rowH - 3, pW - mr, y + rowH - 3)
      y += rowH
    })
    y += 4
  }

  // ══════════════════════════════════════════════════════════════
  // DISCLAIMER
  // ══════════════════════════════════════════════════════════════
  const discLines = pdf.splitTextToSize(report.disclaimer, cW - 8)
  guard(discLines.length * 5 + 22)
  y = hline(y)
  fill(ml, y, cW, discLines.length * 5 + 14, [248, 248, 252])
  y += 5
  y = t('DISCLAIMER', ml + 4, y, { sz: 8, bold: true, col: [110, 110, 130] })
  y += 2
  pdf.setFontSize(8.5)
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor(110, 110, 130)
  pdf.text(discLines, ml + 4, y)

  renderFooter()
  pdf.save(filename)
}
