import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface PdfOptions {
  filename?: string
  elementId?: string
}

export async function exportReportAsPDF({
  filename = 'symptom-report.pdf',
  elementId = 'report-root',
}: PdfOptions = {}): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`Element #${elementId} not found. Make sure the report page has id="${elementId}".`)

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  const imgData   = canvas.toDataURL('image/png')
  const pdf       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW     = pdf.internal.pageSize.getWidth()
  const pageH     = pdf.internal.pageSize.getHeight()
  const imgH      = (canvas.height * pageW) / canvas.width
  let   remaining = imgH
  let   yOffset   = 0

  pdf.addImage(imgData, 'PNG', 0, yOffset, pageW, imgH)
  remaining -= pageH

  while (remaining > 0) {
    yOffset -= pageH
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, yOffset, pageW, imgH)
    remaining -= pageH
  }

  pdf.save(filename)
}
