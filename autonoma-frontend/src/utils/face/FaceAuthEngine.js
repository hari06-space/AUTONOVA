/**
 * FaceAuthEngine.js
 *
 * Organization: Nutech
 * Owner: Nutech
 * Updated By: Nutech
 * Updated At: 2026-08-29
 * Description: Banking-grade enterprise face authentication pipeline.
 *
 * Security Architecture:
 * 1. Stability Gate (400ms): Face must be continuously present before collection starts.
 * 2. Quality Gate (≥48): Each frame must pass quality check.
 * 3. Passive Liveness Gate: Landmark micro-motion must confirm a real face (not photo).
 * 4. Multi-Frame Collection (3 frames, 150ms apart): Three descriptors are collected.
 * 5. Backend Submission: All 3 descriptors sent as `faceDescriptors` array.
 * 6. Backend is Final Authority: All matching decisions (Top-1/Top-2 margin, threshold)
 *    are made server-side. Frontend never accepts or rejects on its own.
 *
 * Security Principle: WHEN IN DOUBT, DENY. False acceptance is catastrophically
 * worse than false rejection.
 */

import { enhanceFrame } from './ImageEnhancer';
import { FaceDetectionService } from './FaceDetectionService';
import { validateDetections } from './MultiPersonValidator';
import { assessFaceQuality } from './FaceQualityEngine';
import { PassiveLivenessEngine } from './PassiveLivenessEngine';
import FaceConfig from './FaceConfig';

const REQUIRED_FRAMES = FaceConfig.matching.requiredFrames || 3;
const MIN_FRAME_INTERVAL_MS = FaceConfig.matching.minFrameIntervalMs || 150;
const STABILITY_MS = FaceConfig.matching.stabilityWindowMs || 400;
const QUALITY_MIN = FaceConfig.quality.minScore || 48;
const THROTTLE_MS = FaceConfig.performance.detectionIntervalMs || 120;

export class FaceAuthEngine {
  constructor(videoElement, onStateChange, onAuthenticate) {
    this.video = videoElement;
    this.onStateChange = onStateChange;
    this.onAuthenticate = onAuthenticate;

    this.isRunning = false;

    // Lock flags
    this.hasAuthenticated = false;
    this.isPendingAuth = false;
    this.isErrorCooldown = false;

    // Throttling
    this.lastInferenceTime = 0;

    // Stability tracking (face must be stable before collection starts)
    this._faceFirstSeen = null;

    // ── Multi-frame collection state ──────────────────────────────────────────
    // Collected frames: Array of { descriptor: number[], detectedAt: number }
    this._collectedFrames = [];
    this._lastFrameCapturedAt = 0;
    this._collectionStartedAt = null;

    // Passive liveness engine — shared across the current collection window
    this._livenessEngine = new PassiveLivenessEngine();

    this.uiState = {
      status: 'INITIALIZING',
      message: 'Loading secure engine...',
      qualityScore: 0,
      box: null,
      videoDimensions: { width: 640, height: 480 },
      guidance: [],
      // Multi-frame collection progress (0 of REQUIRED_FRAMES)
      framesCollected: 0,
      framesRequired: REQUIRED_FRAMES,
    };
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._resetCollection();
    this.hasAuthenticated = false;
    this.isPendingAuth = false;
    this.isErrorCooldown = false;
    this._faceFirstSeen = null;

    if (FaceDetectionService.isLoaded) {
      this.updateUI({ status: 'SCANNING', message: 'Look at the camera...' });
    } else {
      this.updateUI({ status: 'LOADING_MODELS', message: 'Loading neural models...' });
    }

    try {
      await FaceDetectionService.initialize();
      this.updateUI({ status: 'SCANNING', message: 'Look at the camera...' });
      this.loop();
    } catch (err) {
      this.isRunning = false;
      this.updateUI({ status: 'ERROR', message: 'Failed to initialize face engine' });
      console.error('[FaceAuthEngine] Initialization error:', err);
    }
  }

  stop() {
    this.isRunning = false;
    this._faceFirstSeen = null;
    this._resetCollection();
    FaceDetectionService.cleanupTensors();
  }

  updateUI(newState) {
    this.uiState = { ...this.uiState, ...newState };
    if (this.onStateChange && this.isRunning) {
      this.onStateChange(this.uiState);
    }
  }

  _resetCollection() {
    this._collectedFrames = [];
    this._lastFrameCapturedAt = 0;
    this._collectionStartedAt = null;
    this._livenessEngine = new PassiveLivenessEngine();
  }

  async loop() {
    if (!this.isRunning || this.hasAuthenticated) return;

    const now = Date.now();
    const shouldRunInference = (now - this.lastInferenceTime) >= THROTTLE_MS;

    if (shouldRunInference && this.video && this.video.readyState >= 2) {
      this.lastInferenceTime = now;
      try {
        await this.processFrame();
      } catch (err) {
        console.warn('[FaceAuthEngine] Frame warning:', err);
      }
    }

    if (this.isRunning && !this.hasAuthenticated) {
      requestAnimationFrame(() => this.loop());
    }
  }

  async processFrame() {
    const { canvas } = enhanceFrame(this.video);
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    const detections = await FaceDetectionService.detectFaces(canvas);
    const validation = validateDetections(detections, width, height);

    if (validation.status === 'VALID' && validation.primaryFace) {
      const face = validation.primaryFace;
      const box = face.detection.box;
      const quality = assessFaceQuality(canvas, face);
      const now = Date.now();

      // ── Stability Gate ────────────────────────────────────────────────────
      if (!this._faceFirstSeen) {
        this._faceFirstSeen = now;
      }
      const stabilityMs = now - this._faceFirstSeen;
      const isStable = stabilityMs >= STABILITY_MS;

      if (this.isErrorCooldown) {
        // Silent during error cooldown — do not update UI
        return;
      }

      if (!isStable) {
        this.updateUI({
          status: 'SCANNING',
          message: 'Hold still...',
          qualityScore: quality.score,
          box,
          videoDimensions: { width, height },
          guidance: quality.guidance,
          framesCollected: 0,
          framesRequired: REQUIRED_FRAMES,
        });
        return;
      }

      // ── Quality Gate ──────────────────────────────────────────────────────
      if (quality.score < QUALITY_MIN) {
        this.updateUI({
          status: 'LOW_QUALITY',
          message: quality.guidance[0] || 'Improve lighting or move closer',
          qualityScore: quality.score,
          box,
          videoDimensions: { width, height },
          guidance: quality.guidance,
          framesCollected: this._collectedFrames.length,
          framesRequired: REQUIRED_FRAMES,
        });
        // Quality failure resets collection — don't accumulate bad frames
        this._resetCollection();
        return;
      }

      // ── Passive Liveness: Feed Frame ──────────────────────────────────────
      this._livenessEngine.addFrame(face);

      // ── Multi-Frame Collection ─────────────────────────────────────────────
      if (this.isPendingAuth) {
        // Already submitting — show waiting state
        this.updateUI({
          status: 'AUTHENTICATING',
          message: 'Verifying identity...',
          qualityScore: quality.score,
          box,
          videoDimensions: { width, height },
          guidance: [],
          framesCollected: REQUIRED_FRAMES,
          framesRequired: REQUIRED_FRAMES,
        });
        return;
      }

      const canCaptureFrame = (now - this._lastFrameCapturedAt) >= MIN_FRAME_INTERVAL_MS;

      if (canCaptureFrame && face.descriptor && this._collectedFrames.length < REQUIRED_FRAMES) {
        this._collectedFrames.push({
          descriptor: Array.from(face.descriptor),
          detectedAt: now,
        });
        this._lastFrameCapturedAt = now;

        if (this._collectionStartedAt === null) {
          this._collectionStartedAt = now;
        }

        const collected = this._collectedFrames.length;

        if (collected < REQUIRED_FRAMES) {
          this.updateUI({
            status: 'COLLECTING',
            message: `Scanning ${collected}/${REQUIRED_FRAMES}...`,
            qualityScore: quality.score,
            box,
            videoDimensions: { width, height },
            guidance: [],
            framesCollected: collected,
            framesRequired: REQUIRED_FRAMES,
          });
          return;
        }

        // All REQUIRED_FRAMES collected — run liveness then submit
        if (collected >= REQUIRED_FRAMES) {
          this.isPendingAuth = true;
          this.updateUI({
            status: 'AUTHENTICATING',
            message: 'Verifying identity...',
            qualityScore: quality.score,
            box,
            videoDimensions: { width, height },
            guidance: [],
            framesCollected: REQUIRED_FRAMES,
            framesRequired: REQUIRED_FRAMES,
          });
          this._submitMultiFrameAuth(canvas, face, [...this._collectedFrames]);
          this._resetCollection();
        }
      } else {
        // Waiting for frame interval — show progress
        this.updateUI({
          status: 'COLLECTING',
          message: this._collectedFrames.length === 0
            ? 'Look at the camera...'
            : `Scanning ${this._collectedFrames.length}/${REQUIRED_FRAMES}...`,
          qualityScore: quality.score,
          box,
          videoDimensions: { width, height },
          guidance: [],
          framesCollected: this._collectedFrames.length,
          framesRequired: REQUIRED_FRAMES,
        });
      }
    } else {
      // Face lost or invalid — reset stability and collection
      this._faceFirstSeen = null;
      if (!this.isPendingAuth && !this.isErrorCooldown) {
        this._resetCollection();
        this.updateUI({
          status: validation.status,
          message: validation.message,
          qualityScore: 0,
          box: validation.primaryFace?.detection?.box || null,
          videoDimensions: { width: canvas.width, height: canvas.height },
          guidance: [validation.message],
          framesCollected: 0,
          framesRequired: REQUIRED_FRAMES,
        });
      }
    }
  }

  /**
   * Submit multi-frame auth payload to backend.
   * All 3 descriptors are sent as `faceDescriptors` array.
   * Backend performs: median aggregate → user-level Top-1/Top-2 margin → threshold gate.
   *
   * @param {HTMLCanvasElement} rawCanvas
   * @param {Object} detection  - face-api detection (for snapshot)
   * @param {Array}  frames     - collected frames [{ descriptor, detectedAt }]
   */
  async _submitMultiFrameAuth(rawCanvas, detection, frames) {
    try {
      // ── Gate 1: Passive Liveness ──────────────────────────────────────────
      const livenessResult = this._livenessEngine.analyze();
      if (!livenessResult.passed) {
        console.warn('[FaceAuthEngine] Liveness FAILED:', livenessResult.reason);
        throw new Error(`Liveness check failed: ${livenessResult.reason}`);
      }
      console.info('[FaceAuthEngine] Liveness OK:', livenessResult.reason,
        '| confidence:', livenessResult.confidence?.toFixed(2));

      // ── Gate 2: Descriptor Validity ───────────────────────────────────────
      const descriptors = frames.map(f => f.descriptor).filter(d => d && d.length === 128);
      if (descriptors.length < REQUIRED_FRAMES) {
        throw new Error(`Only ${descriptors.length}/${REQUIRED_FRAMES} valid descriptors available.`);
      }

      // ── Face Snapshot (for display purposes only — not used in matching) ──
      const box = detection.detection?.box;
      let imageBase64 = null;
      if (box) {
        const cropCanvas = document.createElement('canvas');
        const pad = 15;
        const sx = Math.max(0, Math.floor(box.x - pad));
        const sy = Math.max(0, Math.floor(box.y - pad));
        const sw = Math.min(rawCanvas.width - sx, Math.ceil(box.width + pad * 2));
        const sh = Math.min(rawCanvas.height - sy, Math.ceil(box.height + pad * 2));
        cropCanvas.width = sw;
        cropCanvas.height = sh;
        cropCanvas.getContext('2d').drawImage(rawCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
        imageBase64 = cropCanvas.toDataURL('image/jpeg', 0.80);
      }

      // ── Submit to Backend ─────────────────────────────────────────────────
      // Backend receives all descriptors and performs the final security decision.
      // Frontend NEVER makes an accept/reject decision here.
      if (this.onAuthenticate) {
        await this.onAuthenticate({
          // Canonical property: 3 × 128-D descriptors
          faceDescriptors: descriptors,
          descriptors,
          descriptor: descriptors[0],
          imageBase64,
          livenessScore: livenessResult.confidence,
          frameCount: descriptors.length,
        });
        this.hasAuthenticated = true;
      }
    } catch (err) {
      console.warn('[FaceAuthEngine] Auth error:', err.message || err);
      const msg = typeof err === 'string'
        ? err
        : err?.response?.data?.message || err?.message || 'Face not recognized.';

      this.isErrorCooldown = true;
      this.updateUI({
        status: 'ERROR',
        message: msg,
        box: detection?.detection?.box || null,
        videoDimensions: { width: rawCanvas.width, height: rawCanvas.height },
        framesCollected: 0,
        framesRequired: REQUIRED_FRAMES,
      });

      // 2 second error cooldown
      await new Promise(resolve => setTimeout(resolve, 2000));

      this._faceFirstSeen = null;
      this._resetCollection();
      this.isErrorCooldown = false;
      if (this.isRunning && !this.hasAuthenticated) {
        this.updateUI({
          status: 'SCANNING',
          message: 'Look at the camera...',
          framesCollected: 0,
          framesRequired: REQUIRED_FRAMES,
        });
      }
    } finally {
      this.isPendingAuth = false;
    }
  }
}

export default FaceAuthEngine;
