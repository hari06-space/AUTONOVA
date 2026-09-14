/**
 * FaceDetectionService.js
 * 
 * High-performance Face Detection Service for enterprise biometric auth.
 * Manages model loading, SSD MobileNet v1 / TinyFaceDetector inference,
 * model warm-up, and TF.js tensor memory cleanup.
 */

import { loadFaceApiModels, getFaceApi, isModelsLoaded } from '../faceApi';
import FaceConfig from './FaceConfig';

let isWarmedUp = false;
let initPromise = null;

export class FaceDetectionService {
  /**
   * Returns true if neural network models are already loaded in WebGL memory.
   */
  static get isLoaded() {
    return isModelsLoaded();
  }

  /**
   * Preload face-api neural network models and warm up TF.js execution pipeline.
   * Caches initialization promise so background preloads and explicit calls share one load execution.
   */
  static initialize() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      await loadFaceApiModels();
      
      if (!isWarmedUp && FaceConfig.performance.warmupOnLoad) {
        try {
          const faceapi = await getFaceApi();
          const dummyCanvas = document.createElement('canvas');
          dummyCanvas.width = 64;
          dummyCanvas.height = 64;
          const options = new faceapi.SsdMobilenetv1Options({
            minConfidence: FaceConfig.detection.scoreThreshold,
          });
          await faceapi.detectAllFaces(dummyCanvas, options);
          isWarmedUp = true;
        } catch (err) {
          console.warn('[FaceDetectionService] Warm-up notice:', err.message);
        }
      }
    })();

    return initPromise;
  }

  /**
   * Detect all faces in a canvas or video element with landmarks and descriptors.
   * 
   * @param {HTMLCanvasElement|HTMLVideoElement} input 
   * @param {Object} [options]
   * @returns {Promise<Array>}
   */
  static async detectFaces(input, options = {}) {
    try {
      await this.initialize();
      const faceapi = await getFaceApi();

      if (!faceapi.nets.ssdMobilenetv1?.isLoaded) {
        await loadFaceApiModels();
      }

      if (!faceapi.nets.ssdMobilenetv1?.isLoaded) {
        return [];
      }

      const minConfidence = options.minConfidence || FaceConfig.detection.scoreThreshold;
      const ssdOptions = new faceapi.SsdMobilenetv1Options({ minConfidence });

      const detections = await faceapi
        .detectAllFaces(input, ssdOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();

      return detections || [];
    } catch (err) {
      console.warn('[FaceDetectionService] Detection error:', err);
      return [];
    }
  }

  /**
   * Fast detection for single face (for low-end devices or lightweight checks).
   * 
   * @param {HTMLCanvasElement|HTMLVideoElement} input 
   * @returns {Promise<Object|null>}
   */
  static async detectSingleFace(input, options = {}) {
    await this.initialize();
    const faceapi = await getFaceApi();

    const minConfidence = options.minConfidence || FaceConfig.detection.scoreThreshold;
    const ssdOptions = new faceapi.SsdMobilenetv1Options({ minConfidence });

    try {
      const detection = await faceapi
        .detectSingleFace(input, ssdOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection || null;
    } catch (err) {
      console.warn('[FaceDetectionService] Single face detection error:', err);
      return null;
    }
  }

  /**
   * Clean up WebGL tensors to prevent memory leaks.
   */
  static cleanupTensors() {
    try {
      const faceapi = getFaceApi();
      if (faceapi && faceapi.tf && typeof faceapi.tf.disposeVariables === 'function') {
        faceapi.tf.disposeVariables();
      }
    } catch (err) {
      // Ignore cleanup warnings
    }
  }
}

export default FaceDetectionService;
