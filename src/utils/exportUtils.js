import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

/**
 * Convert all SVG elements within a cloned node to inline <img> tags
 * so html2canvas can render them correctly.
 */
function inlineSVGs(clonedEl, sourceEl) {
  const clonedSVGs = clonedEl.querySelectorAll('svg');
  const sourceSVGs = sourceEl.querySelectorAll('svg');

  clonedSVGs.forEach((svg, i) => {
    const source = sourceSVGs[i];
    if (!source) return;

    // Get rendered dimensions from the original DOM element
    const { width, height } = source.getBoundingClientRect();

    // Ensure the SVG has explicit dimensions for serialization
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    const svgData = new XMLSerializer().serializeToString(svg);
    const encodedData = btoa(unescape(encodeURIComponent(svgData)));

    const img = document.createElement('img');
    img.src = `data:image/svg+xml;base64,${encodedData}`;
    img.style.width = `${width}px`;
    img.style.height = `${height}px`;
    img.style.display = 'block';

    svg.parentNode.replaceChild(img, svg);
  });
}

/**
 * Export a DOM element to a canvas with proper SVG handling
 */
async function elementToCanvas(element) {
  return html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    onclone: (_doc, clonedEl) => {
      inlineSVGs(clonedEl, element);
    },
  });
}

/**
 * Export a single DOM element as a PNG download
 */
export async function exportChartAsPNG(element, filename = 'chart.png') {
  const canvas = await elementToCanvas(element);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Generate a full PDF report from multiple chart elements
 */
export async function exportAllAsPDF(chartElements, summaryText) {
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

    const canvas = await elementToCanvas(el);
    const imgData = canvas.toDataURL('image/png');

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;

    if (yOffset + imgHeight > pageHeight - margin) {
      pdf.addPage();
      yOffset = margin;
    }

    pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
    yOffset += imgHeight + 10;
  }

  pdf.save('sprint-report.pdf');
}

/**
 * Export all charts as a ZIP of PNGs
 */
export async function exportAllAsZIP(chartElements, chartNames) {
  const zip = new JSZip();

  for (let i = 0; i < chartElements.length; i++) {
    const el = chartElements[i];
    if (!el) continue;

    const canvas = await elementToCanvas(el);
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const name = chartNames[i] || `chart-${i + 1}`;
    zip.file(`${name}.png`, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = 'sprint-charts.zip';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}
