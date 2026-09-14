/**
 * FaceQualityEngine.js
 * 
 * Comprehensive face quality scoring engine for enterprise biometric auth.
 * Generates a 0–100 quality score based on multiple metrics:
 *   - Face size, blur, brightness, contrast, sharpness
 *   - Face angle (yaw/pitch/roll), eye visibility, symmetry
 *   - Noise, exposure, centering
 * 
 * Used for both authentication (threshold: 55) and registration (threshold: 70).
 */

import FaceConfig from './FaceConfig';

// ─── Utility: 2D distance ────────────────────────────────────────────────────
function dist2D(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// ─── Utility: Eye Aspect Ratio ───────────────────────────────────────────────
export function calculateEAR(eyePoints) {
  if (!eyePoints || eyePoints.length < 6) return 0;
  const p2_p6 = dist2D(eyePoints[1], eyePoints[5]);
  const p3_p5 = dist2D(eyePoints[2], eyePoints[4]);
  const p1_p4 = dist2D(eyePoints[0], eyePoints[3]);
  return p1_p4 > 0 ? (p2_p6 + p3_p5) / (2.0 * p1_p4) : 0;
}

// ─── Metric: Face Size Score ─────────────────────────────────────────────────
function scoreFaceSize(faceBox, frameWidth, frameHeight) {
  const faceArea = faceBox.width * faceBox.height;
  const frameArea = frameWidth * frameHeight;
  const ratio = faceArea / frameArea;
  
  if (ratio < FaceConfig.authZone.faceMinAreaRatio) return 0;
  if (ratio > FaceConfig.authZone.faceMaxAreaRatio) return 40; // Too close
  
  // Ideal ratio ~0.12 - 0.25
  if (ratio < 0.12) {
    return Math.round(40 + 60 * (ratio - FaceConfig.authZone.faceMinAreaRatio) / (0.12 - FaceConfig.authZone.faceMinAreaRatio));
  }
  return 100;
}

// ─── Metric: Blur Score (Laplacian Variance) ─────────────────────────────────
function scoreBlur(canvas, faceBox) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  const x = Math.max(0, Math.round(faceBox.x));
  const y = Math.max(0, Math.round(faceBox.y));
  const w = Math.min(canvas.width - x, Math.round(faceBox.width));
  const h = Math.min(canvas.height - y, Math.round(faceBox.height));
  
  if (w < 10 || h < 10) return 0;
  
  const imageData = ctx.getImageData(x, y, w, h);
  const data = imageData.data;
  
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  
  for (let yy = 1; yy < h - 1; yy++) {
    for (let xx = 1; xx < w - 1; xx++) {
      const lap = -4 * gray[yy * w + xx]
        + gray[(yy - 1) * w + xx]
        + gray[(yy + 1) * w + xx]
        + gray[yy * w + (xx - 1)]
        + gray[yy * w + (xx + 1)];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }
  
  const variance = count > 0 ? (sumSq / count) - (sum / count) ** 2 : 0;
  
  if (variance >= 80) return 100;
  if (variance >= FaceConfig.quality.blur.maxVariance) {
    return Math.round(60 + 40 * (variance - FaceConfig.quality.blur.maxVariance) / (80 - FaceConfig.quality.blur.maxVariance));
  }
  if (variance > 5) {
    return Math.round(60 * variance / FaceConfig.quality.blur.maxVariance);
  }
  return 0;
}

// ─── Metric: Brightness Score ────────────────────────────────────────────────
function scoreBrightness(canvas, faceBox) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const x = Math.max(0, Math.round(faceBox.x));
  const y = Math.max(0, Math.round(faceBox.y));
  const w = Math.min(canvas.width - x, Math.round(faceBox.width));
  const h = Math.min(canvas.height - y, Math.round(faceBox.height));
  
  if (w < 5 || h < 5) return 0;
  
  const imageData = ctx.getImageData(x, y, w, h);
  const data = imageData.data;
  let sum = 0;
  const pixelCount = w * h;
  
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  
  const mean = sum / pixelCount;
  const { min, max } = FaceConfig.quality.brightness;

  if (mean >= min && mean <= max) {
    return 100;
  }
  
  if (mean < min) {
    return Math.max(0, Math.round(100 * mean / min));
  }
  
  return Math.max(0, Math.round(100 * (255 - mean) / (255 - max)));
}

// ─── Metric: Contrast Score ──────────────────────────────────────────────────
function scoreContrast(canvas, faceBox) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const x = Math.max(0, Math.round(faceBox.x));
  const y = Math.max(0, Math.round(faceBox.y));
  const w = Math.min(canvas.width - x, Math.round(faceBox.width));
  const h = Math.min(canvas.height - y, Math.round(faceBox.height));
  
  if (w < 5 || h < 5) return 0;
  
  const imageData = ctx.getImageData(x, y, w, h);
  const data = imageData.data;
  let sum = 0;
  let sumSq = 0;
  const pixelCount = w * h;
  
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;
    sumSq += lum * lum;
  }
  
  const mean = sum / pixelCount;
  const stdDev = Math.sqrt(Math.max(0, (sumSq / pixelCount) - mean * mean));
  
  if (stdDev >= 50) return 100;
  if (stdDev >= 25) return Math.round(50 + 50 * (stdDev - 25) / 25);
  return Math.round(50 * stdDev / 25);
}

// ─── Metric: Sharpness Score ──────────────────────────────────────────────────
function scoreSharpness(canvas, faceBox) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const x = Math.max(0, Math.round(faceBox.x));
  const y = Math.max(0, Math.round(faceBox.y));
  const w = Math.min(canvas.width - x, Math.round(faceBox.width));
  const h = Math.min(canvas.height - y, Math.round(faceBox.height));
  
  if (w < 10 || h < 10) return 0;
  
  const imageData = ctx.getImageData(x, y, w, h);
  const data = imageData.data;
  
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  
  let energy = 0;
  let count = 0;
  
  for (let yy = 1; yy < h - 1; yy++) {
    for (let xx = 1; xx < w - 1; xx++) {
      const gx = -gray[(yy - 1) * w + (xx - 1)] + gray[(yy - 1) * w + (xx + 1)]
        - 2 * gray[yy * w + (xx - 1)] + 2 * gray[yy * w + (xx + 1)]
        - gray[(yy + 1) * w + (xx - 1)] + gray[(yy + 1) * w + (xx + 1)];
      
      const gy = -gray[(yy - 1) * w + (xx - 1)] - 2 * gray[(yy - 1) * w + xx] - gray[(yy - 1) * w + (xx + 1)]
        + gray[(yy + 1) * w + (xx - 1)] + 2 * gray[(yy + 1) * w + xx] + gray[(yy + 1) * w + (xx + 1)];
      
      energy += Math.sqrt(gx * gx + gy * gy);
      count++;
    }
  }
  
  const avgEnergy = count > 0 ? energy / count : 0;
  
  if (avgEnergy >= 25) return 100;
  if (avgEnergy >= 10) return Math.round(50 + 50 * (avgEnergy - 10) / 15);
  return Math.round(50 * avgEnergy / 10);
}

// ─── Metric: Face Angle Score ────────────────────────────────────────────────
function scoreFaceAngle(landmarks) {
  if (!landmarks) return 0;
  
  const jaw = landmarks.getJawOutline();
  const nose = landmarks.getNose();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  
  if (!jaw || !nose || !leftEye || !rightEye) return 0;
  
  const faceLeft = jaw[0].x;
  const faceRight = jaw[jaw.length - 1].x;
  const faceCenter = (faceLeft + faceRight) / 2;
  const noseTip = nose[nose.length - 1] || nose[3];
  const noseOffset = Math.abs(noseTip.x - faceCenter) / (faceRight - faceLeft);
  const estimatedYaw = noseOffset * 90;
  
  const eyeCenter = (leftEye[0].y + rightEye[0].y) / 2;
  const mouthTop = landmarks.getMouth()[0].y;
  const faceHeight = mouthTop - eyeCenter;
  const noseY = noseTip.y;
  const noseRelative = faceHeight > 0 ? (noseY - eyeCenter) / faceHeight : 0.5;
  const estimatedPitch = Math.abs(noseRelative - 0.6) * 60;
  
  const leftEyeCenter = {
    x: leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length,
    y: leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length,
  };
  const rightEyeCenter = {
    x: rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length,
    y: rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length,
  };
  const eyeAngle = Math.abs(Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) * 180 / Math.PI);
  
  let score = 100;
  const { maxYaw, maxPitch, maxRoll } = FaceConfig.quality.headPose;

  if (estimatedYaw > maxYaw) score -= 50;
  else if (estimatedYaw > maxYaw * 0.6) score -= 20;
  
  if (estimatedPitch > maxPitch) score -= 30;
  else if (estimatedPitch > maxPitch * 0.6) score -= 15;
  
  if (eyeAngle > maxRoll) score -= 30;
  else if (eyeAngle > maxRoll * 0.6) score -= 15;
  
  return Math.max(0, score);
}

// ─── Metric: Eye Visibility ──────────────────────────────────────────────────
function scoreEyeVisibility(landmarks) {
  if (!landmarks) return 0;
  
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  
  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);
  
  let score = 100;
  const closedThreshold = FaceConfig.quality.eyeAspectRatio.closedThreshold;

  if (leftEAR < closedThreshold) score -= 40;
  if (rightEAR < closedThreshold) score -= 40;
  
  if (leftEAR < closedThreshold + 0.03 || rightEAR < closedThreshold + 0.03) score -= 20;
  
  return Math.max(0, score);
}

// ─── Metric: Centering Score ─────────────────────────────────────────────────
function scoreCentering(faceBox, frameWidth, frameHeight) {
  const faceCenterX = faceBox.x + faceBox.width / 2;
  const faceCenterY = faceBox.y + faceBox.height / 2;
  const frameCenterX = frameWidth / 2;
  const frameCenterY = frameHeight / 2;
  
  const maxDistX = frameWidth / 2;
  const maxDistY = frameHeight / 2;
  
  const offsetX = Math.abs(faceCenterX - frameCenterX) / maxDistX;
  const offsetY = Math.abs(faceCenterY - frameCenterY) / maxDistY;
  
  const offset = Math.sqrt(offsetX * offsetX + offsetY * offsetY) / Math.sqrt(2);
  
  if (offset < 0.15) return 100;
  if (offset < 0.35) return Math.round(100 - (offset - 0.15) * 250);
  return Math.max(0, Math.round(100 - offset * 150));
}

// ─── Estimate head pose for guidance ─────────────────────────────────────────
export function estimateHeadPose(landmarks) {
  if (!landmarks) return { yaw: 0, pitch: 0, roll: 0, poseLabel: 'unknown' };
  
  const jaw = landmarks.getJawOutline();
  const nose = landmarks.getNose();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  
  const faceLeft = jaw[0].x;
  const faceRight = jaw[jaw.length - 1].x;
  const faceWidth = faceRight - faceLeft;
  const faceCenter = (faceLeft + faceRight) / 2;
  const noseTip = nose[nose.length - 1] || nose[3];
  const yaw = faceWidth > 0 ? ((noseTip.x - faceCenter) / faceWidth) * 90 : 0;
  
  const eyeCenter = (leftEye[0].y + rightEye[0].y) / 2;
  const mouthTop = landmarks.getMouth()[0].y;
  const faceHeight = mouthTop - eyeCenter;
  const noseRelative = faceHeight > 0 ? (noseTip.y - eyeCenter) / faceHeight : 0.5;
  const pitch = (noseRelative - 0.6) * 60;
  
  const leftCenter = { x: leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length, y: leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length };
  const rightCenter = { x: rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length, y: rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length };
  const roll = Math.atan2(rightCenter.y - leftCenter.y, rightCenter.x - leftCenter.x) * 180 / Math.PI;
  
  let poseLabel = 'front';
  if (Math.abs(yaw) > 18) poseLabel = yaw > 0 ? 'right' : 'left';
  else if (Math.abs(pitch) > 15) poseLabel = pitch > 0 ? 'down' : 'up';
  
  return { yaw: Math.round(yaw), pitch: Math.round(pitch), roll: Math.round(roll * 10) / 10, poseLabel };
}

// ─── Main Quality Assessment ─────────────────────────────────────────────────
export function assessFaceQuality(canvas, detection, options = {}) {
  const faceBox = detection.detection.box;
  const landmarks = detection.landmarks;
  const frameWidth = canvas.width;
  const frameHeight = canvas.height;
  
  const metrics = {
    faceSize: scoreFaceSize(faceBox, frameWidth, frameHeight),
    blur: scoreBlur(canvas, faceBox),
    brightness: scoreBrightness(canvas, faceBox),
    contrast: scoreContrast(canvas, faceBox),
    sharpness: scoreSharpness(canvas, faceBox),
    faceAngle: scoreFaceAngle(landmarks),
    eyeVisibility: scoreEyeVisibility(landmarks),
    centering: scoreCentering(faceBox, frameWidth, frameHeight),
  };
  
  let score = 0;
  const weights = FaceConfig.quality.weights;
  for (const [key, weight] of Object.entries(weights)) {
    score += (metrics[key] || 0) * weight;
  }
  score = Math.round(score);
  
  const guidance = [];
  if (metrics.faceSize < 30) guidance.push(FaceConfig.guidance.faceTooSmall);
  else if (metrics.faceSize < 50) guidance.push('Move slightly closer');
  if (metrics.faceSize > 90 && faceBox.width / frameWidth > 0.65) guidance.push(FaceConfig.guidance.faceTooLarge);
  
  if (metrics.blur < 40) guidance.push(FaceConfig.guidance.tooBlurry);
  if (metrics.brightness < 40) guidance.push(FaceConfig.guidance.tooDark);
  if (metrics.faceAngle < 50) guidance.push(FaceConfig.guidance.lookingAway);
  if (metrics.eyeVisibility < 50) guidance.push(FaceConfig.guidance.eyesClosed);
  if (metrics.centering < 40) guidance.push(FaceConfig.guidance.faceNotCentered);
  
  const headPose = estimateHeadPose(landmarks);
  
  return {
    score,
    metrics,
    isAcceptable: score >= FaceConfig.quality.minScore,
    isRegistrationQuality: score >= FaceConfig.quality.registrationMinScore,
    guidance,
    headPose,
  };
}

export const QUALITY_CONFIG = FaceConfig.quality;

export default {
  assessFaceQuality,
  estimateHeadPose,
  calculateEAR,
  QUALITY_CONFIG,
};
