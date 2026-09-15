/**
 * PassiveLivenessEngine.js
 *
 * Organization: AUTONOVA
 * Owner: hari06-space
 * Updated By: hari06-space
 * Updated At: 2026-08-29
 * Description: Passive liveness detection for enterprise face authentication.
 *
 * Architecture & Limitations:
 * - This engine provides client-side UX gating and preliminary static spoof detection.
 * - Detects static printed photo / frozen screen attacks by tracking 68-point facial
 *   landmark micro-motion normalized against face bounding-box width.
 * - Normalized metric: (landmark centroid drift in pixels) / (face width in pixels).
 *   This ensures consistent behavior across 480p, 720p, 1080p, and 4K camera resolutions.
 *
 * SECURITY NOTICE:
 * - Frontend liveness detection is NEVER treated as a final security authority.
 * - Backend Spring Boot performs all authoritative multi-frame consensus, Top-1/Top-2
 *   margin verification, and JWT session authorization.
 * - Sophisticated physical attacks (e.g. high-resolution video replays, silicon 3D masks)
 *   cannot be mathematically ruled out without hardware-level depth/IR sensors.
 *   Therefore, the system operates strictly on: WHEN IN DOUBT, DENY.
 */

import FaceConfig from './FaceConfig.js';

const cfg = FaceConfig.liveness.passive;

function centroid(points) {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

function dist2D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export class PassiveLivenessEngine {
  constructor() {
    this._frames = [];
    this.reset();
  }

  reset() {
    this._frames = [];
  }

  /**
   * Record a frame's landmark data and face bounding box for normalized analysis.
   * @param {Object} detection - face-api detection result with landmarks and box.
   */
  addFrame(detection) {
    if (!detection || !detection.landmarks) return;

    const pts = detection.landmarks.positions || detection.landmarks._positions;
    if (!pts || pts.length === 0) return;

    const box = detection.detection?.box || detection.box || {};
    const faceWidth = Math.max(30, box.width || 150);

    const c = centroid(pts);
    this._frames.push({
      centroid: c,
      faceWidth,
      capturedAt: Date.now(),
    });
  }

  /**
   * Analyze collected frames for normalized micro-motion signals.
   *
   * @returns {{
   *   passed: boolean,
   *   confidence: number,
   *   reason: string,
   *   motionStats: { minNormDrift: number, maxNormDrift: number, avgNormDrift: number }
   * }}
   */
  analyze() {
    const minFrames = cfg.minFrames || 3;
    // Normalized motion thresholds (relative to face width):
    // Real living faces typically exhibit 0.004 to 0.06 normalized drift between 150ms frames.
    const minNormMotion = 0.003; // < 0.3% face width movement across all frame pairs = static photo
    const maxNormMotion = 0.12;  // > 12% face width sudden displacement = excessive shake

    if (this._frames.length < minFrames) {
      return {
        passed: false,
        confidence: 0,
        reason: `Insufficient frames for liveness analysis (${this._frames.length}/${minFrames})`,
        motionStats: null,
      };
    }

    const avgFaceWidth = this._frames.reduce((sum, f) => sum + f.faceWidth, 0) / this._frames.length;

    // Compute normalized frame-to-frame centroid drift
    const normDrifts = [];
    for (let i = 1; i < this._frames.length; i++) {
      const rawDist = dist2D(this._frames[i - 1].centroid, this._frames[i].centroid);
      normDrifts.push(rawDist / avgFaceWidth);
    }

    const minNormDrift = Math.min(...normDrifts);
    const maxNormDrift = Math.max(...normDrifts);
    const avgNormDrift = normDrifts.reduce((s, d) => s + d, 0) / normDrifts.length;

    const motionStats = { minNormDrift, maxNormDrift, avgNormDrift };

    // Gate 1: Completely static image detection (normalized)
    if (maxNormDrift < minNormMotion) {
      return {
        passed: false,
        confidence: 0.0,
        reason: `Static face detected (normalized drift ${(maxNormDrift * 100).toFixed(2)}% < ${(minNormMotion * 100).toFixed(2)}%) — possible static photo/screen attack`,
        motionStats,
      };
    }

    // Gate 2: Excessive motion (too much shake / blur risk)
    if (avgNormDrift > maxNormMotion) {
      return {
        passed: false,
        confidence: 0.3,
        reason: `Excessive face motion (normalized drift ${(avgNormDrift * 100).toFixed(1)}% > ${(maxNormMotion * 100).toFixed(1)}%) — hold still`,
        motionStats,
      };
    }

    // Confidence normalized by expected natural motion range (0.5% – 3% of face width is ideal)
    const idealNormMotion = 0.015;
    const motionScore = Math.min(1.0, avgNormDrift / idealNormMotion);
    const confidence = Math.max(0.5, Math.min(1.0, motionScore));

    return {
      passed: true,
      confidence,
      reason: `Liveness confirmed (drift ${(avgNormDrift * 100).toFixed(2)}% of face width, frames=${this._frames.length})`,
      motionStats,
    };
  }

  get frameCount() {
    return this._frames.length;
  }
}

export default PassiveLivenessEngine;
