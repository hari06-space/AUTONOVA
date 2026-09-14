/**
 * LivenessDetector.js
 * 
 * Multi-signal passive liveness detection to prevent spoofing attacks (printed photos, phone screens).
 * Analyzes:
 * 1. Blink detection (EAR analysis over consecutive frames)
 * 2. Micro-movement tracking (Nose position variance)
 * 3. Texture/Frequency analysis (Moiré pattern detection for screens)
 * 4. Temporal consistency (Face area micro-variations)
 */

import FaceConfig from './FaceConfig';
import { calculateEAR } from './FaceQualityEngine';

export class LivenessState {
  constructor() {
    this.reset();
  }

  reset() {
    this.earHistory = [];
    this.noseHistory = [];
    this.sizeHistory = [];
    this.blinkDetected = false;
    this.lastBlinkTime = 0;
  }
  
  update(detection, canvas, faceBox) {
    if (!detection || !detection.landmarks || !faceBox) {
      return { isLive: false, score: 0, reason: 'No landmarks' };
    }

    const landmarks = detection.landmarks;
    const now = Date.now();
    
    // 1. EAR & Blink
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const ear = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2;
    this.earHistory.push({ time: now, value: ear });
    if (this.earHistory.length > 10) this.earHistory.shift();
    
    this.detectBlink();
    
    // 2. Micro-movement (nose position variance)
    const nose = landmarks.getNose();
    const noseTip = nose[nose.length - 1] || nose[3];
    this.noseHistory.push({ x: noseTip.x, y: noseTip.y });
    if (this.noseHistory.length > 8) this.noseHistory.shift();
    
    // 3. Face size temporal variance
    const faceSize = faceBox.width * faceBox.height;
    this.sizeHistory.push(faceSize);
    if (this.sizeHistory.length > 8) this.sizeHistory.shift();
    
    // 4. Texture score
    const textureScore = this.analyzeTexture(canvas, faceBox);
    
    return this.calculateFinalScore(textureScore);
  }
  
  detectBlink() {
    if (this.earHistory.length < 3) return;
    
    const recent = this.earHistory.slice(-4);
    const minEar = Math.min(...recent.map(h => h.value));
    const maxEar = Math.max(...this.earHistory.map(h => h.value));
    
    const closedThreshold = FaceConfig.quality.eyeAspectRatio.closedThreshold;
    const minOpenRatio = FaceConfig.quality.eyeAspectRatio.minOpenRatio;

    if (minEar < closedThreshold && maxEar > minOpenRatio) {
      this.blinkDetected = true;
      this.lastBlinkTime = Date.now();
    }
    
    // Decay blink status after 8 seconds
    if (this.blinkDetected && (Date.now() - this.lastBlinkTime > 8000)) {
      this.blinkDetected = false;
    }
  }
  
  analyzeMovement() {
    if (this.noseHistory.length < 3) return 50;
    
    let sumX = 0, sumY = 0, sumSqX = 0, sumSqY = 0;
    const n = this.noseHistory.length;
    
    for (const p of this.noseHistory) {
      sumX += p.x;
      sumY += p.y;
      sumSqX += p.x * p.x;
      sumSqY += p.y * p.y;
    }
    
    const varX = (sumSqX / n) - (sumX / n) ** 2;
    const varY = (sumSqY / n) - (sumY / n) ** 2;
    const stdDev = Math.sqrt(Math.max(0, varX + varY));
    
    const minDev = FaceConfig.liveness.passive.microMotionThreshold;
    
    if (stdDev < minDev * 0.3) return 20; // Static photo
    if (stdDev > 25.0) return 30;         // Too erratic (moving photo/screen)
    
    return 100;
  }
  
  analyzeTemporal() {
    if (this.sizeHistory.length < 3) return 50;
    
    const mean = this.sizeHistory.reduce((a, b) => a + b, 0) / this.sizeHistory.length;
    const variance = this.sizeHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.sizeHistory.length;
    const relVariance = variance / (mean * mean + 1e-5);
    
    if (relVariance < 0.0001) return 20; // Completely static photo
    if (relVariance > 0.08) return 40;   // Unstable
    return 100;
  }
  
  analyzeTexture(canvas, faceBox) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const cw = Math.max(10, Math.round(faceBox.width * 0.15));
    const ch = Math.max(10, Math.round(faceBox.height * 0.15));
    const cx = Math.round(faceBox.x + faceBox.width * 0.2);
    const cy = Math.round(faceBox.y + faceBox.height * 0.6);
    
    if (cx < 0 || cy < 0 || cx + cw > canvas.width || cy + ch > canvas.height) return 50;
    
    try {
      const imgData = ctx.getImageData(cx, cy, cw, ch);
      const data = imgData.data;
      
      let diff = 0;
      let count = 0;
      for (let y = 0; y < ch; y++) {
        for (let x = 1; x < cw; x++) {
          const i1 = (y * cw + x) * 4;
          const i2 = (y * cw + (x - 1)) * 4;
          const l1 = 0.299 * data[i1] + 0.587 * data[i1+1] + 0.114 * data[i1+2];
          const l2 = 0.299 * data[i2] + 0.587 * data[i2+1] + 0.114 * data[i2+2];
          diff += Math.abs(l1 - l2);
          count++;
        }
      }
      
      const avgDiff = count > 0 ? diff / count : 0;
      
      if (avgDiff > 14) return 20; // Screen moiré
      if (avgDiff > 10) return 60;
      return 100;
    } catch (e) {
      return 50;
    }
  }
  
  calculateFinalScore(textureScore) {
    const blinkScore = this.blinkDetected ? 100 : 40;
    const moveScore = this.analyzeMovement();
    const temporalScore = this.analyzeTemporal();
    
    const finalScore = Math.round(
      blinkScore * 0.25 +
      moveScore * 0.35 +
      textureScore * 0.25 +
      temporalScore * 0.15
    );
    
    const passThreshold = Math.round(FaceConfig.liveness.combined.minScore * 100);

    return {
      isLive: finalScore >= passThreshold,
      score: finalScore,
      signals: {
        blink: this.blinkDetected,
        movement: moveScore,
        texture: textureScore,
        temporal: temporalScore,
      }
    };
  }
}

export default LivenessState;
