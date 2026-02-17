import { toBlob, toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

const IMAGE_OPTIONS = {
  backgroundColor: '#ffffff',
  pixelRatio: 2,
  cacheBust: true,
};

/**
 * Trigger a file download from a blob
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  // Clean up after a short delay to allow download to start
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Export a single DOM element as a PNG download
 */
export async function exportChartAsPNG(element, filename = 'chart.png') {
  try {
    const blob = await toBlob(element, IMAGE_OPTIONS);
    if (!blob) throw new Error('Failed to create image blob');
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Failed to export chart as PNG:', error);
    throw error;
  }
}

/**
 * Generate a full PDF report from multiple chart elements
 */
export async function exportAllAsPDF(chartElements, summaryText) {
  if (chartElements.length === 0) {
    throw new Error('No chart elements found to export');
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const usableWidth = pageWidth - margin * 2;

  // Title page
  pdf.setFontSize(24);
  pdf.setTextColor(30, 41, 59);
  pdf.text('Sprint Performance Report', margin, 30);

  pdf.setFontSize(12);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 40);

  // Summary
  if (summaryText) {
    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    const summaryLines = pdf.splitTextToSize(summaryText, usableWidth);
    pdf.text(summaryLines, margin, 55);
  }

  // Charts
  let yOffset = summaryText ? 80 : 55;

  for (let i = 0; i < chartElements.length; i++) {
    const el = chartElements[i];
    if (!el) continue;

    try {
      const canvas = await toCanvas(el, IMAGE_OPTIONS);
      const imgData = canvas.toDataURL('image/png');

      const imgWidth = usableWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;

      if (yOffset + imgHeight > pageHeight - margin) {
        pdf.addPage();
        yOffset = margin;
      }

      pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 10;
    } catch (err) {
      console.warn(`Failed to render chart ${i}:`, err);
    }
  }

  pdf.save('sprint-report.pdf');
}

/**
 * Export all charts as a ZIP of PNGs
 */
export async function exportAllAsZIP(chartElements, chartNames) {
  if (chartElements.length === 0) {
    throw new Error('No chart elements found to export');
  }

  const zip = new JSZip();

  for (let i = 0; i < chartElements.length; i++) {
    const el = chartElements[i];
    if (!el) continue;

    try {
      const canvas = await toCanvas(el, IMAGE_OPTIONS);
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      const name = chartNames[i] || `chart-${i + 1}`;
      zip.file(`${name}.png`, base64, { base64: true });
    } catch (err) {
      console.warn(`Failed to render chart ${i} for ZIP:`, err);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'sprint-charts.zip');
}
