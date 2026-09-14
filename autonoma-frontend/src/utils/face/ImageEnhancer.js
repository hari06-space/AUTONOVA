/**
 * ImageEnhancer.js
 * 
 * Canvas-based image preprocessing for enterprise face authentication.
 * Automatically enhances camera frames before face detection/recognition.
 * 
 * Operations (all performed on an offscreen canvas, <10ms per frame):
 *  - Adaptive brightness normalization
 *  - CLAHE (Contrast Limited Adaptive Histogram Equalization)
 *  - Gamma correction
 *  - Noise reduction (box blur)
 *  - Glare detection & dampening
 *  - White balance correction
 *  - Low-light enhancement
 */

// ─── Configuration ───────────────────────────────────────────────────────────
const CONFIG = {
  // Brightness
  TARGET_BRIGHTNESS: 128,
  BRIGHTNESS_TOLERANCE: 30,
  
  // Gamma
  MIN_GAMMA: 0.5,
  MAX_GAMMA: 2.2,
  
  // CLAHE
  CLAHE_CLIP_LIMIT: 3.0,
  CLAHE_TILE_SIZE: 8,
  
  // Noise reduction
  NOISE_BLUR_RADIUS: 1,
  NOISE_THRESHOLD: 15,     // luminance std-dev below which noise reduction fires
  
  // Glare
  GLARE_THRESHOLD: 240,    // pixel brightness above which = glare
  GLARE_DAMPEN_FACTOR: 0.7,
  
  // Low light
  LOW_LIGHT_THRESHOLD: 60,
  LOW_LIGHT_GAMMA: 1.8,
};

// ─── Utility: Analyse frame statistics ───────────────────────────────────────
function analyzeFrame(imageData) {
  const data = imageData.data;
  const len = data.length;
  let sum = 0;
  let sumSq = 0;
  let glarePixels = 0;
  let darkPixels = 0;
  const histogram = new Uint32Array(256);
  const pixelCount = len / 4;

  for (let i = 0; i < len; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    sum += lum;
    sumSq += lum * lum;
    histogram[lum]++;
    if (lum >= CONFIG.GLARE_THRESHOLD) glarePixels++;
    if (lum <= CONFIG.LOW_LIGHT_THRESHOLD) darkPixels++;
  }

  const mean = sum / pixelCount;
  const variance = (sumSq / pixelCount) - (mean * mean);
  const stdDev = Math.sqrt(Math.max(0, variance));

  return {
    mean,
    stdDev,
    histogram,
    glareRatio: glarePixels / pixelCount,
    darkRatio: darkPixels / pixelCount,
    pixelCount,
  };
}

// ─── Adaptive Brightness ─────────────────────────────────────────────────────
function applyBrightnessCorrection(imageData, stats) {
  const diff = CONFIG.TARGET_BRIGHTNESS - stats.mean;
  if (Math.abs(diff) <= CONFIG.BRIGHTNESS_TOLERANCE) return; // Already fine

  const data = imageData.data;
  const adjustment = diff * 0.5; // Gentle correction
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.min(255, Math.max(0, data[i] + adjustment));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment));
  }
}

// ─── Gamma Correction ────────────────────────────────────────────────────────
function applyGammaCorrection(imageData, gamma) {
  if (Math.abs(gamma - 1.0) < 0.05) return;
  
  const data = imageData.data;
  const gammaLUT = new Uint8Array(256);
  const invGamma = 1.0 / gamma;
  for (let i = 0; i < 256; i++) {
    gammaLUT[i] = Math.min(255, Math.round(255 * Math.pow(i / 255, invGamma)));
  }
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = gammaLUT[data[i]];
    data[i + 1] = gammaLUT[data[i + 1]];
    data[i + 2] = gammaLUT[data[i + 2]];
  }
}

// ─── CLAHE (Simplified) ─────────────────────────────────────────────────────
function applyCLAHE(imageData, width, height) {
  const data = imageData.data;
  const tileW = Math.ceil(width / CONFIG.CLAHE_TILE_SIZE);
  const tileH = Math.ceil(height / CONFIG.CLAHE_TILE_SIZE);
  
  // Build luminance channel
  const lum = new Uint8Array(width * height);
  for (let i = 0; i < lum.length; i++) {
    const idx = i * 4;
    lum[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }
  
  // Process each tile
  for (let ty = 0; ty < CONFIG.CLAHE_TILE_SIZE; ty++) {
    for (let tx = 0; tx < CONFIG.CLAHE_TILE_SIZE; tx++) {
      const x0 = tx * tileW;
      const y0 = ty * tileH;
      const x1 = Math.min(x0 + tileW, width);
      const y1 = Math.min(y0 + tileH, height);
      
      // Build histogram for this tile
      const hist = new Uint32Array(256);
      let count = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          hist[lum[y * width + x]]++;
          count++;
        }
      }
      
      // Clip histogram
      const clipLimit = Math.ceil(CONFIG.CLAHE_CLIP_LIMIT * count / 256);
      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > clipLimit) {
          excess += hist[i] - clipLimit;
          hist[i] = clipLimit;
        }
      }
      const perBin = Math.floor(excess / 256);
      for (let i = 0; i < 256; i++) {
        hist[i] += perBin;
      }
      
      // Build CDF
      const cdf = new Float32Array(256);
      cdf[0] = hist[0];
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + hist[i];
      }
      const cdfMin = cdf.find(v => v > 0) || 0;
      
      // Apply equalization
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const pi = y * width + x;
          const idx = pi * 4;
          const oldLum = lum[pi];
          const newLum = Math.round(((cdf[oldLum] - cdfMin) / (count - cdfMin)) * 255);
          
          if (oldLum > 0) {
            const ratio = newLum / oldLum;
            const blendRatio = 0.4 * ratio + 0.6; // Gentle blend
            data[idx]     = Math.min(255, Math.round(data[idx] * blendRatio));
            data[idx + 1] = Math.min(255, Math.round(data[idx + 1] * blendRatio));
            data[idx + 2] = Math.min(255, Math.round(data[idx + 2] * blendRatio));
          }
        }
      }
    }
  }
}

// ─── Noise Reduction (3x3 Box Blur on luminance-guided blend) ────────────────
function applyNoiseReduction(imageData, width, height) {
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += copy[((y + dy) * width + (x + dx)) * 4 + c];
          }
        }
        const avg = sum / 9;
        const idx = (y * width + x) * 4 + c;
        // Blend original with average (gentle denoising)
        data[idx] = Math.round(data[idx] * 0.6 + avg * 0.4);
      }
    }
  }
}

// ─── Glare Reduction ─────────────────────────────────────────────────────────
function applyGlareReduction(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum >= CONFIG.GLARE_THRESHOLD) {
      data[i]     = Math.round(data[i] * CONFIG.GLARE_DAMPEN_FACTOR);
      data[i + 1] = Math.round(data[i + 1] * CONFIG.GLARE_DAMPEN_FACTOR);
      data[i + 2] = Math.round(data[i + 2] * CONFIG.GLARE_DAMPEN_FACTOR);
    }
  }
}

// ─── White Balance (Gray World Assumption) ───────────────────────────────────
function applyWhiteBalance(imageData) {
  const data = imageData.data;
  const pixelCount = data.length / 4;
  let rSum = 0, gSum = 0, bSum = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }
  
  const rMean = rSum / pixelCount;
  const gMean = gSum / pixelCount;
  const bMean = bSum / pixelCount;
  const globalMean = (rMean + gMean + bMean) / 3;
  
  // Only correct if channels are significantly imbalanced
  const maxDiff = Math.max(Math.abs(rMean - gMean), Math.abs(gMean - bMean), Math.abs(rMean - bMean));
  if (maxDiff < 10) return;
  
  const rScale = rMean > 0 ? globalMean / rMean : 1;
  const gScale = gMean > 0 ? globalMean / gMean : 1;
  const bScale = bMean > 0 ? globalMean / bMean : 1;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.min(255, Math.round(data[i] * rScale));
    data[i + 1] = Math.min(255, Math.round(data[i + 1] * gScale));
    data[i + 2] = Math.min(255, Math.round(data[i + 2] * bScale));
  }
}

// ─── Main Enhancement Pipeline ──────────────────────────────────────────────

/**
 * Enhance a video frame or canvas for face detection.
 * Returns an enhanced canvas ready for face-api processing.
 * 
 * @param {HTMLVideoElement|HTMLCanvasElement} source - Input source
 * @param {Object} [options] - Override default config
 * @returns {{ canvas: HTMLCanvasElement, stats: Object }}
 */
export function enhanceFrame(source, options = {}) {
  const cfg = { ...CONFIG, ...options };
  
  const width = source.videoWidth || source.width;
  const height = source.videoHeight || source.height;
  
  if (!width || !height) {
    return { canvas: null, stats: null };
  }
  
  // Draw to offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, width, height);
  
  let imageData = ctx.getImageData(0, 0, width, height);
  const stats = analyzeFrame(imageData);
  
  // 1. White balance
  applyWhiteBalance(imageData);
  
  // 2. Low-light enhancement (gamma boost)
  if (stats.mean < cfg.LOW_LIGHT_THRESHOLD) {
    const gamma = cfg.LOW_LIGHT_GAMMA;
    applyGammaCorrection(imageData, gamma);
  } else if (stats.mean > 180) {
    // Over-bright: darken slightly
    applyGammaCorrection(imageData, 0.8);
  }
  
  // 3. Adaptive brightness
  const postGammaStats = analyzeFrame(imageData);
  applyBrightnessCorrection(imageData, postGammaStats);
  
  // 4. CLAHE for local contrast
  if (stats.stdDev < 40) {
    applyCLAHE(imageData, width, height);
  }
  
  // 5. Glare reduction
  if (stats.glareRatio > 0.02) {
    applyGlareReduction(imageData);
  }
  
  // 6. Noise reduction for noisy cameras
  if (stats.stdDev < cfg.NOISE_THRESHOLD) {
    applyNoiseReduction(imageData, width, height);
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  return { canvas, stats };
}

/**
 * Enhance only the face region of a frame (more targeted processing).
 * 
 * @param {HTMLCanvasElement} sourceCanvas - Full frame canvas
 * @param {{ x: number, y: number, width: number, height: number }} faceBox - Face bounding box
 * @returns {HTMLCanvasElement} Enhanced face-only canvas
 */
export function enhanceFaceRegion(sourceCanvas, faceBox) {
  const padding = Math.round(faceBox.width * 0.2);
  const x = Math.max(0, Math.round(faceBox.x - padding));
  const y = Math.max(0, Math.round(faceBox.y - padding));
  const w = Math.min(sourceCanvas.width - x, Math.round(faceBox.width + padding * 2));
  const h = Math.min(sourceCanvas.height - y, Math.round(faceBox.height + padding * 2));
  
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = w;
  faceCanvas.height = h;
  const ctx = faceCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, w, h);
  
  let imageData = ctx.getImageData(0, 0, w, h);
  const stats = analyzeFrame(imageData);
  
  applyWhiteBalance(imageData);
  
  if (stats.mean < CONFIG.LOW_LIGHT_THRESHOLD) {
    applyGammaCorrection(imageData, CONFIG.LOW_LIGHT_GAMMA);
  }
  
  const postStats = analyzeFrame(imageData);
  applyBrightnessCorrection(imageData, postStats);
  
  if (stats.glareRatio > 0.02) {
    applyGlareReduction(imageData);
  }
  
  ctx.putImageData(imageData, 0, 0);
  return faceCanvas;
}

/**
 * Get lighting quality assessment for user guidance.
 * 
 * @param {Object} stats - Stats from analyzeFrame
 * @returns {{ quality: string, score: number, message: string }}
 */
export function assessLighting(stats) {
  if (!stats) return { quality: 'unknown', score: 0, message: 'No frame data' };
  
  let score = 100;
  const messages = [];
  
  // Brightness check
  if (stats.mean < 50) {
    score -= 40;
    messages.push('Very low lighting — increase room brightness');
  } else if (stats.mean < 80) {
    score -= 20;
    messages.push('Low lighting — move to a brighter area');
  } else if (stats.mean > 200) {
    score -= 25;
    messages.push('Too bright — reduce direct light');
  }
  
  // Contrast check
  if (stats.stdDev < 20) {
    score -= 20;
    messages.push('Low contrast — adjust lighting angle');
  }
  
  // Glare check
  if (stats.glareRatio > 0.1) {
    score -= 30;
    messages.push('Strong glare detected — avoid direct light on face');
  } else if (stats.glareRatio > 0.03) {
    score -= 15;
    messages.push('Slight glare — tilt head slightly');
  }
  
  score = Math.max(0, score);
  
  const quality = score >= 70 ? 'good' : score >= 40 ? 'fair' : 'poor';
  
  return {
    quality,
    score,
    message: messages.length > 0 ? messages[0] : 'Lighting is good',
  };
}

export default {
  enhanceFrame,
  enhanceFaceRegion,
  assessLighting,
};
