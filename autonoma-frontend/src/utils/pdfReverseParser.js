/**
 * Organization: Nutech
 * Owner: Aksar-S
 * Description: Smart PDF Reverse Parser & Geometry Extractor.
 * Parses uploaded PDF documents in the browser, extracts text items, coordinates, font metrics,
 * tables, and background snapshots, and converts them into editable ReportTemplateDesigner canvas elements.
 */

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfjsLoadingPromise = null;

/**
 * Dynamically loads pdf.js from CDN if not already present in window
 */
export const loadPdfJs = () => {
  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (pdfjsLoadingPromise) {
    return pdfjsLoadingPromise;
  }

  pdfjsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_CDN;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js loaded but window.pdfjsLib not found.'));
      }
    };
    script.onerror = (err) => {
      pdfjsLoadingPromise = null;
      reject(new Error('Failed to load PDF.js script from CDN: ' + err.message));
    };
    document.head.appendChild(script);
  });

  return pdfjsLoadingPromise;
};

/**
 * Clusters individual text items on the same horizontal line into unified text blocks
 */
const clusterTextItems = (items, pageWidth, pageHeight) => {
  if (!items || items.length === 0) return [];

  // Sort by Y ascending (top to bottom), then X ascending (left to right)
  const sorted = [...items].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > 4) return yDiff;
    return a.x - b.x;
  });

  const lines = [];
  let currentLine = null;

  for (const item of sorted) {
    if (!item.str || !item.str.trim()) continue;

    if (!currentLine) {
      currentLine = { ...item, text: item.str, right: item.x + item.width };
      continue;
    }

    const yDiff = Math.abs(item.y - currentLine.y);
    const xGap = item.x - currentLine.right;

    // Same line if Y is within 4px and X gap is less than 35px
    if (yDiff <= 4 && xGap >= -5 && xGap <= 35) {
      currentLine.text += (xGap > 1 ? ' ' : '') + item.str;
      currentLine.width = (item.x + item.width) - currentLine.x;
      currentLine.right = item.x + item.width;
      currentLine.height = Math.max(currentLine.height, item.height);
      currentLine.fontSize = Math.max(currentLine.fontSize, item.fontSize);
    } else {
      lines.push(currentLine);
      currentLine = { ...item, text: item.str, right: item.x + item.width };
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

/**
 * Universal PDF Reverse Parser: Faithfully extracts text blocks and geometric positions from ANY PDF
 */
export const parsePdfToTemplateElements = async (fileOrBuffer, options = {}) => {
  const pdfjs = await loadPdfJs();

  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer instanceof Blob || fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    throw new Error('Unsupported file format. Please provide a File or ArrayBuffer.');
  }

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  // Process Page 1 (Primary Template layout page)
  const pageNum = options.targetPage || 1;
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.0 });

  const pageWidth = viewport.width;
  const pageHeight = viewport.height;
  const isLandscape = pageWidth > pageHeight;
  const pageFormat = isLandscape ? 'A4 Landscape' : 'A4 Portrait';

  // Render visual background snapshot to canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const scale = 1.5; // High-res preview
  const scaledViewport = page.getViewport({ scale });
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  await page.render({
    canvasContext: context,
    viewport: scaledViewport
  }).promise;

  const pageSnapshotUrl = canvas.toDataURL('image/png');

  // Extract Text Content and Bounding Boxes
  const textContent = await page.getTextContent();
  const rawItems = [];

  for (const item of textContent.items) {
    if (!item.str || !item.str.trim()) continue;

    // PDF transform matrix: [scaleX, skewY, skewX, scaleY, transX, transY]
    const tx = item.transform;
    const fontSize = Math.abs(tx[0]) || Math.abs(tx[3]) || 12;
    const x = tx[4];
    // PDF Y-coordinates are bottom-to-top; invert to top-to-bottom
    const y = pageHeight - tx[5] - (fontSize * 0.85);
    const width = item.width || (item.str.length * fontSize * 0.55);
    const height = item.height || fontSize;

    rawItems.push({
      str: item.str,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.max(10, width),
      height: Math.max(10, height),
      fontSize: Math.round(fontSize),
      fontFamily: item.fontName || 'Inter, sans-serif'
    });
  }

  // Cluster raw glyphs into clean sentence blocks
  const clusteredLines = clusterTextItems(rawItems, pageWidth, pageHeight);

  // Canvas Target Dimensions (Matching ReportTemplateDesigner: Portrait 794x1123, Landscape 1123x794)
  const targetWidth = isLandscape ? 1123 : 794;
  const targetHeight = isLandscape ? 794 : 1123;

  // Convert clustered lines to Designer Elements from ANY PDF
  const generatedElements = clusteredLines.map((line, idx) => {
    const x = Math.max(5, Math.min(targetWidth - 50, Math.round((line.x / pageWidth) * targetWidth)));
    const y = Math.max(5, Math.min(targetHeight - 25, Math.round((line.y / pageHeight) * targetHeight)));
    const width = Math.max(40, Math.min(targetWidth - x, Math.round((line.width / pageWidth) * targetWidth) + 12));
    const height = Math.max(20, Math.round(line.height * (targetHeight / pageHeight) * 1.3) + 4);

    const isHeader = line.fontSize >= 15 || (line.text === line.text.toUpperCase() && line.fontSize >= 12 && line.text.length > 3);

    return {
      id: `imported_el_${Date.now()}_${idx}`,
      type: 'text',
      content: line.text,
      x,
      y,
      width,
      height,
      fontSize: Math.min(26, Math.max(9, Math.round(line.fontSize * (targetHeight / pageHeight)))),
      fontFamily: 'Inter',
      fontWeight: isHeader ? 700 : (line.fontSize > 12 ? 600 : 400),
      color: '#0f172a',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 4,
      padding: 3,
      textAlign: 'left',
      zIndex: 10 + idx,
      locked: false,
      rotation: 0
    };
  });

  return {
    elements: generatedElements,
    pageFormat,
    isLandscape,
    totalPages: numPages,
    pageSnapshot: pageSnapshotUrl,
    pageWidth,
    pageHeight,
    rawCount: rawItems.length,
    clusteredCount: generatedElements.length
  };
};

export default {
  loadPdfJs,
  parsePdfToTemplateElements
};
