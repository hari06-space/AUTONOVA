import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import * as fflate from 'fflate';
import { resolveExportValue } from 'ui-component/bos/BOSUtils';

/**
 * Standard BOS Excel Export with Header Metadata and Styling
 * @param {Array} data - Array of objects to export
 * @param {String} fileName - Name of the file
 * @param {Object} headerInfo - Optional metadata { userName: string }
 */
export const exportToExcel = (data, fileName, headerInfo = {}) => {
  const sheetName = 'BOS Report';
  const timestamp = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Helper to format values specifically for Excel cell display (User ID for Created User, etc.)
  const formatCellValue = (key, val) => {
    if (val === undefined || val === null) return '-';

    const keyLower = String(key).toLowerCase();
    const isUserField = keyLower.includes('user') || keyLower.includes('by');

    if (isUserField) {
      if (typeof val === 'object' && val !== null) {
        return val.username || val.userId || val.empCode || val.empId || val.id || '-';
      }
      return String(val);
    }

    return resolveExportValue(val);
  };

  const formattedData = (data || []).map((row) => {
    const newRow = {};
    Object.keys(row).forEach((key) => {
      newRow[key] = formatCellValue(key, row[key]);
    });
    return newRow;
  });

  // 1. Create a worksheet from the JSON data
  const worksheet = XLSX.utils.json_to_sheet([]);

  // 2. Define Styles
  const headerStyle = {
    fill: { fgColor: { rgb: 'FFCC99' } }, // Light Orange
    font: { bold: true, name: 'Calibri', sz: 12 },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    }
  };

  const titleStyle = {
    fill: { fgColor: { rgb: '4B8EEA' } }, // Blue background
    font: { bold: true, name: 'Calibri', sz: 12, color: { rgb: 'FFFFFF' } }, // White text
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const metaStyle = {
    font: { italic: true, name: 'Calibri', sz: 11, color: { rgb: '666666' } },
    alignment: { horizontal: 'left' }
  };

  const hasReportTitle = !!headerInfo.reportTitle;
  const headerRowIdx = hasReportTitle ? 1 : 0;

  // 3. Add the main data
  if (hasReportTitle) {
    XLSX.utils.sheet_add_aoa(worksheet, [[headerInfo.reportTitle.toUpperCase()]], { origin: 'A1' });
    XLSX.utils.sheet_add_json(worksheet, formattedData, { origin: 'A2', skipHeader: false });

    // Merge title row
    const colCount = Object.keys(formattedData[0] || {}).length;
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(colCount - 1, 0) } });
  } else {
    XLSX.utils.sheet_add_json(worksheet, formattedData, { origin: 'A1', skipHeader: false });
  }

  // Pre-calculate column alignments based on max data length (excluding header)
  const colKeys = Object.keys(formattedData[0] || {});
  const colAlignments = {};
  
  colKeys.forEach((key, index) => {
    const hasLongText = formattedData.some((row) => {
      const val = row[key];
      return typeof val === 'string' && val.length > 20;
    });
    colAlignments[index] = hasLongText ? 'left' : 'center';
  });

  // 4. Apply Styles (Advanced Enhancement)
  const range = XLSX.utils.decode_range(worksheet['!ref']);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[address]) continue;

      const cellValue = worksheet[address].v;
      let horizontalAlign = colAlignments[C] || 'center';

      // Base style for all data cells
      const baseStyle = {
        font: { name: 'Calibri', sz: 11 },
        border: {
          top: { style: 'thin', color: { rgb: 'E2E2E2' } },
          bottom: { style: 'thin', color: { rgb: 'E2E2E2' } },
          left: { style: 'thin', color: { rgb: 'E2E2E2' } },
          right: { style: 'thin', color: { rgb: 'E2E2E2' } }
        },
        alignment: { vertical: 'center', horizontal: horizontalAlign, wrapText: true }
      };

      if (hasReportTitle && R === 0) {
        worksheet[address].s = titleStyle;
      } else if (R === headerRowIdx) {
        // Table Headers
        worksheet[address].s = headerStyle;
      } else if (R > headerRowIdx) {
        // Data Rows - Zebra Striping
        if ((R - headerRowIdx) % 2 !== 0) {
          baseStyle.fill = { fgColor: { rgb: 'F9F9F9' } };
        }

        // Status Conditional Formatting
        if (cellValue === 'Outstanding') {
          baseStyle.fill = { fgColor: { rgb: 'dcfce7' } };
          baseStyle.font.color = { rgb: '166534' };
          baseStyle.font.bold = true;
        } else if (cellValue === 'Perfect') {
          baseStyle.fill = { fgColor: { rgb: 'dbeafe' } };
          baseStyle.font.color = { rgb: '1e40af' };
          baseStyle.font.bold = true;
        } else if (cellValue === 'Low') {
          baseStyle.fill = { fgColor: { rgb: 'fee2e2' } };
          baseStyle.font.color = { rgb: '991b1b' };
          baseStyle.font.bold = true;
        }

        worksheet[address].s = baseStyle;
      }
    }
  }

  // 5. Freeze Top Row(s)
  worksheet['!views'] = [{ state: 'frozen', ySplit: headerRowIdx + 1 }];

  // 7. Auto-calculate column widths (Fixed maximum to allow wrap)
  const colWidths = Object.keys(formattedData[0] || {}).map((key) => {
    const headerLen = key.length;
    const maxDataLen = formattedData.reduce((max, row) => {
      const val = row[key] ? String(row[key]).length : 0;
      return Math.max(max, val);
    }, 0);
    const finalWidth = Math.min(Math.max(headerLen, maxDataLen) + 4, 40); // Cap width to 40 for wrapping
    return { wch: finalWidth };
  });

  if (colWidths[0]) {
    colWidths[0].wch = Math.max(colWidths[0].wch, 8); // Ensure it's not too small but not huge
  }

  // Set explicit row heights to prevent excessively tall rows
  const rowHeights = [];
  if (hasReportTitle) {
    rowHeights.push({ hpt: 30 }); // Title
    rowHeights.push({ hpt: 25 }); // Header
  } else {
    rowHeights.push({ hpt: 25 }); // Header
  }
  for (let i = 0; i < formattedData.length; i++) {
    rowHeights.push({ hpt: 25 }); // Data rows
  }
  worksheet['!rows'] = rowHeights;

  worksheet['!cols'] = colWidths;

  // 8. Finalize and Save standard Excel workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // 9. Dynamic System Metadata & Print Header/Footer configuration (visible ONLY when printed)
  let finalBuffer = excelBuffer;
  try {
    const companyName = headerInfo.companyName || sessionStorage.getItem('companyName') || 'AUTONOMA';
    const shortName = headerInfo.shortName || sessionStorage.getItem('divisionName') || 'Business Operating System';
    const userName = headerInfo.userName || sessionStorage.getItem('userName') || 'SYSTEM';

    const escapeXml = (unsafe) => {
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const escapedCompany = escapeXml(companyName);
    const escapedShort = escapeXml(shortName);
    const escapedUser = escapeXml(userName);

    const headerFooterXml =
      `<headerFooter>` +
      `<oddHeader>&amp;L${escapedCompany} (${escapedShort})&amp;RPrinted: ${timestamp} | User: ${escapedUser}</oddHeader>` +
      `<oddFooter>&amp;CPage &amp;P of &amp;N</oddFooter>` +
      `</headerFooter>`;

    const zip = fflate.unzipSync(new Uint8Array(excelBuffer));
    let patched = false;

    Object.keys(zip).forEach((path) => {
      if (path.startsWith('xl/worksheets/sheet') && path.endsWith('.xml')) {
        let xml = fflate.strFromU8(zip[path]);
        if (!xml.includes('<headerFooter>')) {
          // OpenXML schema sequence order: headerFooter must come before rowBreaks, colBreaks,
          // customProperties, cellWatches, ignoredErrors, smartTags, drawing, drawingHF,
          // picture, oleObjects, controls, webPublishItems, tableParts, and extLst.
          const tags = [
            '<rowBreaks',
            '<colBreaks',
            '<customProperties',
            '<cellWatches',
            '<ignoredErrors',
            '<smartTags',
            '<drawing',
            '<drawingHF',
            '<picture',
            '<oleObjects',
            '<controls',
            '<webPublishItems',
            '<tableParts',
            '<extLst',
            '</worksheet>'
          ];

          let insertIdx = -1;
          const sheetDataEndIdx = xml.indexOf('</sheetData>');
          if (sheetDataEndIdx !== -1) {
            // Search only after </sheetData> to avoid matching cell values containing tags
            for (const tag of tags) {
              const idx = xml.indexOf(tag, sheetDataEndIdx);
              if (idx !== -1) {
                insertIdx = idx;
                break;
              }
            }
          } else {
            // Fallback search
            for (const tag of tags) {
              const idx = xml.indexOf(tag);
              if (idx !== -1) {
                insertIdx = idx;
                break;
              }
            }
          }

          if (insertIdx !== -1) {
            xml = xml.substring(0, insertIdx) + headerFooterXml + xml.substring(insertIdx);
            zip[path] = fflate.strToU8(xml);
            patched = true;
          }
        }
      }
    });

    if (patched) {
      finalBuffer = fflate.zipSync(zip);
    }
  } catch (err) {
    console.error('Failed to inject dynamic print headerFooter:', err);
  }

  const dataBlob = new Blob([finalBuffer], { type: 'application/octet-stream' });
  saveAs(dataBlob, `${fileName}.xlsx`);
};
