import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// PUBLIC_INTERFACE
export async function exportAsPdf(elementId, fileName = 'resume.pdf') {
  /** Export a DOM element to PDF (A4 portrait) using html2canvas and jsPDF. */
  const input = document.getElementById(elementId);
  if (!input) throw new Error('Preview element not found');
  const canvas = await html2canvas(input, { scale: 2, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let position = 0;
  let heightLeft = imgHeight;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(fileName);
}
