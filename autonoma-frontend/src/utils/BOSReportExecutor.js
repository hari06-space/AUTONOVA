/**
 * Organization: AUTONOVA
 * Owner: Aksar-S
 * Description: Universal Runtime Report Executor & Dynamic Data Interpolator.
 * Renders designed templates with live ERP page data into high-fidelity PDF documents.
 */

import * as jspdfModule from 'jspdf';
import fileSaverPkg from 'file-saver';

const jsPDF = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
const saveAs = typeof fileSaverPkg === 'function' ? fileSaverPkg : (fileSaverPkg?.saveAs || fileSaverPkg?.default?.saveAs || fileSaverPkg?.default);

/**
 * Safely resolves a nested dot-notation property path from a data object
 * Example: resolvePath({ company: { name: 'AUTONOVA' } }, 'company.name') => 'AUTONOVA'
 */
export const resolvePath = (obj, path, fallback = '') => {
  if (!obj || !path) return fallback;
  const parts = String(path).trim().replace(/^\{\{|\}\}$/g, '').split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return fallback;
    current = current[part];
  }
  return current !== undefined && current !== null ? current : fallback;
};

/**
 * Formats a value using optional transformation pipes (e.g. `{{val | date:'DD/MM/YYYY'}}`, `{{amount | currency}}`)
 */
const formatValueWithPipes = (rawVal, pipeExpr) => {
  if (!pipeExpr) return rawVal;
  const [pipeName, pipeArg] = pipeExpr.split(':').map(s => s.trim().replace(/['"]/g, ''));

  if (pipeName === 'uppercase') return String(rawVal).toUpperCase();
  if (pipeName === 'lowercase') return String(rawVal).toLowerCase();
  if (pipeName === 'capitalize') return String(rawVal).replace(/\b\w/g, c => c.toUpperCase());
  if (pipeName === 'currency') {
    const num = Number(rawVal);
    if (isNaN(num)) return rawVal;
    return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (pipeName === 'date') {
    try {
      const d = new Date(rawVal);
      if (isNaN(d.getTime())) return rawVal;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return rawVal;
    }
  }

  return rawVal;
};

/**
 * Replaces all dynamic placeholder tags `{{path.to.variable}}` or `{{variable | pipe}}` with runtime values
 */
export const interpolatePlaceholders = (text, dataContext = {}) => {
  if (!text || typeof text !== 'string') return text || '';

  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
    const [pathPart, pipePart] = expression.split('|').map(s => s.trim());
    const val = resolvePath(dataContext, pathPart, match);
    if (val === match) return match; // Keep unchanged if path not found
    return formatValueWithPipes(val, pipePart);
  });
};

/**
 * Generates a QR Code as DataURL
 */
const generateQrDataUrl = async (text) => {
  try {
    const encoded = encodeURIComponent(text || 'https://autonova.erp');
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
  } catch (err) {
    console.warn('[BOSReportExecutor] QR code generation failed:', err);
    return null;
  }
};

/**
 * Generates a true vector PDF blob from a template JSON definition and live runtime dataContext
 * 
 * @param {Object} template - The template object containing elements, pageFormat, etc.
 * @param {Object} dataContext - The live page runtime data { doc, row, tableData, user, company, summary }
 * @param {Object} [options] - Optional PDF rendering overrides
 * @returns {Promise<Blob>}
 */
export const renderReportToPdfBlob = async (template, dataContext = {}, options = {}) => {
  const elements = template.elements || template.templateData?.elements || [];
  const pageFormat = template.pageFormat || template.templateData?.pageFormat || 'A4 Portrait';
  const isLandscape = pageFormat.includes('Landscape');

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidthMm = isLandscape ? 297 : 210;
  const pageHeightMm = isLandscape ? 210 : 297;
  const canvasBaseWidth = 800; // standard designer base px
  const canvasBaseHeight = isLandscape ? 560 : 1100;

  const mmX = (px) => (px / canvasBaseWidth) * pageWidthMm;
  const mmY = (px) => (px / canvasBaseHeight) * pageHeightMm;

  // Background / Watermark if configured
  if (template.watermarkText || template.templateData?.watermarkText) {
    pdf.saveGraphicsState();
    pdf.setFontSize(48);
    pdf.setTextColor(220, 220, 220);
    pdf.text(template.watermarkText || template.templateData.watermarkText, pageWidthMm / 2, pageHeightMm / 2, {
      align: 'center',
      angle: 45
    });
    pdf.restoreGraphicsState();
  }

  // Render each canvas element
  for (const el of elements) {
    const x = mmX(el.x || 0);
    const y = mmY(el.y || 0);
    const width = mmX(el.width || 100);
    const height = mmY(el.height || 20);

    if (el.type === 'text' || el.type === 'dynamic') {
      const interpolatedText = interpolatePlaceholders(el.content || '', dataContext);
      const fontSizePt = Math.max(6, Math.round((el.fontSize || 12) * 0.75));

      pdf.setFontSize(fontSizePt);
      pdf.setTextColor(el.color || '#0f172a');
      pdf.setFont('helvetica', el.fontWeight === 700 || el.fontWeight === 'bold' ? 'bold' : 'normal');

      const align = el.textAlign || 'left';
      let textX = x;
      if (align === 'center') textX = x + width / 2;
      else if (align === 'right') textX = x + width;

      pdf.text(String(interpolatedText), textX, y + (fontSizePt * 0.35), {
        align,
        maxWidth: width
      });
    } else if (el.type === 'line' || el.type === 'divider') {
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.35);
      pdf.line(x, y, x + width, y);
    } else if (el.type === 'rectangle') {
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(248, 250, 252);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(x, y, width, height, 2, 2, 'FD');
    } else if (el.type === 'qrcode') {
      const qrVal = interpolatePlaceholders(el.content || 'https://autonova.erp', dataContext);
      const qrDataUrl = await generateQrDataUrl(qrVal);
      if (qrDataUrl) {
        const qrSize = Math.min(width, height, 35);
        pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);
      }
    } else if (el.type === 'image' && el.content) {
      try {
        pdf.addImage(el.content, 'JPEG', x, y, width, height);
      } catch (err) {
        console.warn('[BOSReportExecutor] Image render failed:', err);
      }
    }
  }

  return pdf.output('blob');
};

/**
 * Downloads a generated report PDF file
 */
export const downloadReportPdf = async (template, dataContext = {}, customFilename = null) => {
  const blob = await renderReportToPdfBlob(template, dataContext);
  const name = customFilename || `${template.templateName || 'Report'}_${new Date().toISOString().substring(0, 10)}.pdf`;
  saveAs(blob, name);
};

export default {
  resolvePath,
  interpolatePlaceholders,
  renderReportToPdfBlob,
  downloadReportPdf
};
