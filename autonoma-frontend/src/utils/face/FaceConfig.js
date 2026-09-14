/**
 * FaceConfig.js
 * 
 * Centralized configuration for the enterprise face authentication engine.
 * All thresholds, model settings, and feature flags in one place.
 * Optimized for high speed, low-end webcams, and seamless user experience.
 */

const FaceConfig = Object.freeze({
  // ─── Detection ────────────────────────────────────────────────────────────
  detection: {
    model: 'ssd',                    // 'ssd' (SSD MobileNet v1) or 'tiny' (TinyFaceDetector)
    scoreThreshold: 0.50,            // Minimum detection confidence
    minFaceSize: 60,                 // Minimum face width/height in pixels
    optimalFaceSize: 120,            // Optimal face size for best embeddings
    maxFaceSize: 550,                // Maximum face size (too close warning)
    inputSize: 416,                  // SSD input resolution
    tinyInputSize: 320,              // TinyFaceDetector input size fallback
    maxDetectionRetries: 3,          // Retries before declaring no face
    throttleMs: 120,                 // Throttled detection interval (ms)
  },

  // ─── Authentication Zone ──────────────────────────────────────────────────
  authZone: {
    centerRatioX: 0.70,              // Generous width ratio of center authentication zone
    centerRatioY: 0.80,              // Generous height ratio of center authentication zone
    faceMinAreaRatio: 0.03,          // Minimum face area as ratio of frame area
    faceMaxAreaRatio: 0.75,          // Maximum face area ratio (too close)
    faceCenterToleranceX: 0.30,      // How far face center can be from frame center (X)
    faceCenterToleranceY: 0.35,      // How far face center can be from frame center (Y)
  },

  // ─── Quality Engine ──────────────────────────────────────────────────
  quality: {
    minScore: 48,                    // Auth quality gate (raised from 35 — rejects low-quality frames)
    registrationMinScore: 52,        // Registration quality gate (raised from 40)
    weights: {
      sharpness: 0.18,
      brightness: 0.12,
      contrast: 0.08,
      faceSize: 0.12,
      headPose: 0.15,
      eyeVisibility: 0.10,
      blur: 0.10,
      glare: 0.05,
      noise: 0.05,
      exposure: 0.05,
    },
    // Sub-thresholds
    brightness: { min: 35, max: 225, optimal: 130 },
    contrast: { min: 15 },
    sharpness: { min: 10 },
    blur: { maxVariance: 25 },       // Laplacian variance threshold (forgiving for motion blur)
    glare: { maxHotPixelRatio: 0.10 },
    noise: { maxHighFreqRatio: 0.45 },
    headPose: {
      maxYaw: 35,                    // Max left/right turn (degrees)
      maxPitch: 30,                  // Max up/down tilt (degrees)
      maxRoll: 25,                   // Max head tilt (degrees)
    },
    eyeAspectRatio: {
      closedThreshold: 0.15,         // Below this = eye closed
      minOpenRatio: 0.18,            // Minimum for "eyes open"
    },
  },

  // ─── Image Enhancement ────────────────────────────────────────────────────
  enhancement: {
    enabled: true,
    clahe: {
      enabled: true,
      clipLimit: 2.5,
      tileSize: 8,
    },
    gamma: {
      enabled: true,
      targetBrightness: 130,
      minGamma: 0.5,
      maxGamma: 2.2,
    },
    noiseReduction: {
      enabled: true,
      kernelSize: 3,
      strength: 0.4,
    },
    sharpen: {
      enabled: true,
      strength: 0.3,
    },
  },

  // ─── Face Alignment ───────────────────────────────────────────────────────
  alignment: {
    outputSize: 112,                 // Standard aligned face size
    eyeDesiredPosition: 0.35,        // Desired eye position ratio from top
    padding: 0.25,                   // Extra padding around face
    backgroundMask: true,            // Mask background using landmark convex hull
  },

  // ─── Liveness Detection ──────────────────────────────────────────────────
  liveness: {
    passive: {
      enabled: true,
      minFrames: 3,
      analysisWindowMs: 1500,
      // Minimum landmark centroid drift (pixels) between frames to confirm real face.
      // A printed photo held perfectly still will have near-zero motion.
      microMotionMinPx: 0.5,         // Below this across ALL frames = likely static image
      microMotionMaxPx: 15.0,        // Above this = too much movement (jitter/blur risk)
      confidenceThreshold: 0.50,
    },
    active: {
      enabled: false,                // Active challenges (blink/head turn) disabled by default
      blinkTimeout: 5000,
      headTurnTimeout: 5000,
      challengeTypes: ['blink'],
    },
    combined: {
      minScore: 0.45,
    },
  },

  // ─── Matching / Confidence ──────────────────────────────────────────────────
  matching: {
    // NOTE: This threshold is for UI/UX feedback only.
    // The FINAL security decision is always made on the backend (Spring Boot).
    // Do NOT rely on this value for security enforcement.
    distanceThreshold: 0.42,         // Match backend FACE_MATCH_THRESHOLD (calibrate together)
    cosineThreshold: 0.65,
    // Multi-frame collection: collect N quality frames before submitting to backend
    requiredFrames: 3,               // Must collect 3 good frames before auth attempt
    minFrameIntervalMs: 150,         // Minimum gap between captured frames
    collectionWindowMs: 1500,        // Max time to collect required frames
    stabilityWindowMs: 400,          // Face must be stable for this long before collection starts
    consecutiveMatchesRequired: 3,   // Kept for watchdog (face-present consistency checks)
    consecutiveMatchWindowMs: 1500,
    topK: 5,
    confidence: {
      autoAccept: 75,
      manualReview: 50,
      autoReject: 35,
    },
    adaptive: {
      lowLightPenalty: 0.05,
      highNoisePenalty: 0.04,
      smallFacePenalty: 0.04,
    },
  },

  // ─── Registration ───────────────────────────────────────────────────────────
  registration: {
    captureFrames: 7,                // Capture up to 7 frames, keep best quality ones
    minFrames: 6,                    // Minimum to attempt registration (kept for compat)
    maxFrames: 10,
    keepBestFrames: 5,               // Keep top 5 by quality score after filtering
    captureIntervalMs: 150,
    duplicateDistanceThreshold: 0.04,// Requires slight movement between frames to ensure a diverse multi-pose template
    modelVersion: 'FACE_API_V1',     // Written to FACE_TEMPLATE_VERSION in DB
    requiredPoses: ['front', 'neutral'],
    autoSelectBestFrames: true,
  },

  // ─── Camera ───────────────────────────────────────────────────────────────
  camera: {
    defaultWidth: 640,
    defaultHeight: 480,
    facingMode: 'user',
    frameRate: { ideal: 30, min: 15 },
    registrationWidth: 640,
    registrationHeight: 480,
    loginWidth: 640,
    loginHeight: 480,
  },

  // ─── Performance ──────────────────────────────────────────────────────────
  performance: {
    maxAuthTimeMs: 2500,             // Maximum total authentication time
    detectionIntervalMs: 120,        // Time between detection frames (throttling)
    useWebGL: true,
    warmupOnLoad: true,
  },

  // ─── UI Guidance Messages ─────────────────────────────────────────────────
  guidance: {
    noFace: 'Position your face in the frame',
    faceTooSmall: 'Move closer to the camera',
    faceTooLarge: 'Move back slightly',
    faceNotCentered: 'Center your face in the frame',
    tooDark: 'Increase lighting in your area',
    tooBlurry: 'Hold still',
    glareDetected: 'Reduce glare',
    eyesClosed: 'Please open your eyes',
    lookingAway: 'Look directly at the camera',
    multipleFaces: 'Multiple people detected. Please ensure only one person is present.',
    livenessCheck: 'Verifying face...',
    livenessFailed: 'Liveness check failed.',
    matching: 'Recognizing face...',
    lowConfidence: 'Hold still...',
    success: 'Identity verified',
    failed: 'Face not recognized',
  },
});

export default FaceConfig;
