/**
 * CameraManager.js
 * 
 * Reusable enterprise Camera Manager for biometric face operations.
 * Handles MediaStream lifecycle, resolution fallback, device change listeners,
 * cross-browser compatibility (Chrome, Edge, Firefox), and complete resource release.
 */

import FaceConfig from './FaceConfig';

export class CameraManager {
  constructor(options = {}) {
    this.width = options.width || FaceConfig.camera.defaultWidth;
    this.height = options.height || FaceConfig.camera.defaultHeight;
    this.facingMode = options.facingMode || FaceConfig.camera.facingMode;
    
    this.stream = null;
    this.videoElement = null;
    this.onDeviceChangeCallback = null;
    this._handleDeviceChange = this._handleDeviceChange.bind(this);
  }

  /**
   * Start webcam stream and attach to the provided video HTML element.
   * Uses multi-resolution fallback strategy to support diverse hardware.
   * 
   * @param {HTMLVideoElement} videoElement 
   * @returns {Promise<MediaStream>}
   */
  async start(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam access is not supported in this browser or context (requires HTTPS).');
    }

    // Stop existing stream if running
    this.stop();

    this.videoElement = videoElement;

    // Constraint configurations to try in sequence
    const constraintConfigs = [
      // 1. Preferred exact resolution
      {
        video: {
          width: { ideal: this.width },
          height: { ideal: this.height },
          facingMode: this.facingMode,
          frameRate: FaceConfig.camera.frameRate,
        },
        audio: false,
      },
      // 2. High-res fallback (1280x720)
      {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: this.facingMode,
        },
        audio: false,
      },
      // 3. Basic fallback
      {
        video: { facingMode: this.facingMode },
        audio: false,
      },
      // 4. Any camera
      {
        video: true,
        audio: false,
      },
    ];

    let lastError = null;
    for (const constraints of constraintConfigs) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (this.stream) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!this.stream) {
      const msg = lastError?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError'
        ? 'No webcam device found. Please connect a camera.'
        : 'Failed to access webcam. Please verify camera permissions.';
      throw new Error(msg);
    }

    // Attach to video element
    if (this.videoElement) {
      this.videoElement.srcObject = this.stream;
      
      // Wait until video data is loaded
      await new Promise((resolve) => {
        if (this.videoElement.readyState >= 2) {
          resolve();
        } else {
          this.videoElement.onloadedmetadata = () => resolve();
        }
      });

      try {
        await this.videoElement.play();
      } catch (playErr) {
        console.warn('[CameraManager] video.play() notice:', playErr.message);
      }
    }

    // Listen for device changes (disconnects/reconnects)
    if (navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', this._handleDeviceChange);
    }

    return this.stream;
  }

  /**
   * Stop camera stream and immediately release all hardware resources.
   */
  stop() {
    if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
      navigator.mediaDevices.removeEventListener('devicechange', this._handleDeviceChange);
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore track stop error
        }
      });
      this.stream = null;
    }

    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.srcObject = null;
      } catch (e) {
        // ignore video pause error
      }
      this.videoElement = null;
    }
  }

  /**
   * Set callback for webcam device changes (disconnections).
   */
  onDeviceChange(callback) {
    this.onDeviceChangeCallback = callback;
  }

  _handleDeviceChange() {
    if (this.onDeviceChangeCallback) {
      this.onDeviceChangeCallback();
    }
  }

  isActive() {
    if (!this.stream) return false;
    return this.stream.getTracks().some((track) => track.readyState === 'live');
  }

  getVideoDimensions() {
    if (this.videoElement && this.videoElement.videoWidth) {
      return {
        width: this.videoElement.videoWidth,
        height: this.videoElement.videoHeight,
      };
    }
    return { width: this.width, height: this.height };
  }
}

export default CameraManager;
