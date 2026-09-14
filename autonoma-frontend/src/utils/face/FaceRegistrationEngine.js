/**
 * FaceRegistrationEngine.js
 * 
 * Production-Ready Fast Face Enrollment Engine.
 * Optimized for low-end laptop webcams, lighting variations, and ultra-fast (1–2 second) completion.
 * 
 * Pipeline:
 * 1. Automatically captures 6–8 quality frames in ~1 second as the user looks at the camera.
 * 2. Filters out excessive blur or out-of-frame detections.
 * 3. Synthesizes a robust multi-embedding template payload and clean thumbnail image.
 */

import { assessFaceQuality } from './FaceQualityEngine';
import { getFaceDescriptor } from '../faceApi';
import { enhanceFrame } from './ImageEnhancer';
import { validateDetections } from './MultiPersonValidator';
import { FaceDetectionService } from './FaceDetectionService';
import { FaceRecognitionService } from './FaceRecognitionService';
import FaceConfig from './FaceConfig';

export class FaceRegistrationEngine {
  constructor(videoElement, onProgress, onComplete, onError) {
    this.video = videoElement;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
    
    this.isRunning = false;
    this.capturedFrames = []; // Array of { descriptor, qualityScore, imageBase64, capturedAt }
    
    this.lastCaptureTime = 0;
    this.captureIntervalMs = FaceConfig.registration.captureIntervalMs;
    // Capture up to 7 frames, finalizeRegistration will keep the best 5
    this.targetFrameCount = FaceConfig.registration.captureFrames || 7;
    this.keepBestFrames = FaceConfig.registration.keepBestFrames || 5;
    this.modelVersion = FaceConfig.registration.modelVersion || 'FACE_API_V1';
  }
  
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.capturedFrames = [];
    
    try {
      await FaceDetectionService.initialize();
      this.loop();
    } catch (err) {
      this.isRunning = false;
      if (this.onError) this.onError(err);
    }
  }
  
  stop() {
    this.isRunning = false;
  }
  
  async loop() {
    if (!this.isRunning) return;
    
    const now = Date.now();
    const canCapture = (now - this.lastCaptureTime) > this.captureIntervalMs;
    
    try {
      if (this.video && this.video.readyState >= 2) {
        // 1. Frame Enhancement
        const { canvas } = enhanceFrame(this.video);
        
        if (canvas) {
          // 2. Detection & Validation
          const detections = await FaceDetectionService.detectFaces(canvas);
          const validation = validateDetections(detections, canvas.width, canvas.height);
          
          const progressPercent = Math.min(99, Math.round((this.capturedFrames.length / this.targetFrameCount) * 100));

          let state = {
            progress: progressPercent,
            status: 'SEARCHING',
            message: validation.message || 'Look straight at the camera',
            qualityScore: 0,
            box: null,
            canCapture: false,
            capturedCount: this.capturedFrames.length,
          };
          
          if (validation.status === 'VALID' && validation.primaryFace) {
            const face = validation.primaryFace;
            state.box = face.detection.box;
            
            // 3. Quality Evaluation
            const quality = assessFaceQuality(canvas, face);
            state.qualityScore = quality.score;
            state.headPose = quality.headPose;
            
            if (quality.isRegistrationQuality || (quality.score && quality.score >= FaceConfig.quality.registrationMinScore)) {
              state.status = 'READY';
              state.canCapture = canCapture;
              state.message = 'Capturing face template... Hold still';

              if (canCapture) {
                await this.captureFrame(canvas, face, quality.score);
              }
            } else {
              state.status = 'LOW_QUALITY';
              state.message = quality.guidance[0] || 'Center your face and look at the camera';
            }
          } else if (validation.status === 'MULTIPLE_FACES') {
            state.status = 'MULTIPLE_FACES';
            state.message = validation.message;
            state.box = validation.primaryFace?.detection?.box;
          }
          
          if (this.onProgress && this.isRunning) {
            this.onProgress(state);
          }
        }
      }
    } catch (err) {
      console.warn('[FaceRegistrationEngine] Loop warning:', err);
    }
    
    if (this.isRunning) {
      requestAnimationFrame(() => this.loop());
    }
  }
  
  async captureFrame(canvas, detection, qualityScore) {
    this.lastCaptureTime = Date.now();
    
    const descriptor = await getFaceDescriptor(canvas);
    if (!descriptor) return;

    const rawDesc = Array.from(descriptor);
    const existingDescriptors = this.capturedFrames.map(f => f.descriptor);
    const isDuplicate = existingDescriptors.some(existing => 
      FaceRecognitionService.euclideanDistance(rawDesc, existing) < FaceConfig.registration.duplicateDistanceThreshold
    );

    if (isDuplicate) {
      return; // Skip duplicate frame
    }

    // Capture crisp face snapshot on the first frame
    let imageBase64 = null;
    if (this.capturedFrames.length === 0) {
      const cropCanvas = document.createElement('canvas');
      const box = detection.detection.box;
      const pad = 15;
      const sx = Math.max(0, Math.floor(box.x - pad));
      const sy = Math.max(0, Math.floor(box.y - pad));
      const sw = Math.min(canvas.width - sx, Math.ceil(box.width + pad * 2));
      const sh = Math.min(canvas.height - sy, Math.ceil(box.height + pad * 2));

      cropCanvas.width = sw;
      cropCanvas.height = sh;
      const ctx = cropCanvas.getContext('2d');
      ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      imageBase64 = cropCanvas.toDataURL('image/jpeg', 0.85);
    }
    
    this.capturedFrames.push({
      descriptor: rawDesc,
      qualityScore,
      imageBase64,
      capturedAt: new Date().toISOString(),
    });
    
    // Total frames collected >= target (6 frames)?
    if (this.capturedFrames.length >= this.targetFrameCount) {
      this.isRunning = false;
      this.finalizeRegistration();
    }
  }
  
  finalizeRegistration() {
    if (!this.onComplete) return;

    // Sort by quality score descending, keep the best N frames
    const sorted = [...this.capturedFrames].sort((a, b) => b.qualityScore - a.qualityScore);
    const best = sorted.slice(0, this.keepBestFrames);

    const avgQuality = best.reduce((sum, f) => sum + f.qualityScore, 0) / (best.length || 1);
    const displayImage = best.find(f => f.imageBase64)?.imageBase64
      || this.capturedFrames.find(f => f.imageBase64)?.imageBase64;
    
    const allDescriptors = best.map(f => f.descriptor);
    const uniqueDescriptors = FaceRecognitionService.deduplicateDescriptors(allDescriptors);

    // ── Template Consistency Validation ──────────────────────────────────────────
    // Disabled to allow for multi-pose capture with high variance (e.g. head shaking, lighting changes)
    // and to prevent frustrating "Inconsistent face capture" errors for valid users.
    
    const centroidDescriptor = FaceRecognitionService.synthesizeCentroid(uniqueDescriptors);

    const embeddings = uniqueDescriptors.map(desc => ({
      descriptor: desc,
      quality: Math.round(avgQuality),
      capturedAt: new Date().toISOString(),
      modelVersion: this.modelVersion, // Track which model version was used for enrollment
    }));

    if (this.onProgress) {
      this.onProgress({ progress: 100, status: 'SUCCESS', message: 'Registration complete!' });
    }
    
    this.onComplete({
      embeddings,
      centroidDescriptor,
      displayImage,
      qualityScore: Math.round(avgQuality),
      frameCount: uniqueDescriptors.length,
      modelVersion: this.modelVersion,
    });
  }
}

export default FaceRegistrationEngine;
