const baseUrl = import.meta.env.BASE_URL || '/';
const MODEL_URL = baseUrl.endsWith('/') ? baseUrl + 'models' : baseUrl + '/models';
let modelsLoaded = false;
let modelsLoading = false;
let modelLoadCallbacks = [];
let faceapiInstance = null;

export async function getFaceApi() {
  if (!faceapiInstance) {
    faceapiInstance = await import('face-api.js');
  }
  return faceapiInstance;
}

export function isModelsLoaded() {
  return modelsLoaded;
}

export async function loadModels() {
  return loadFaceApiModels();
}

export async function loadFaceApiModels() {
  const faceapi = await getFaceApi();

  if (modelsLoaded && faceapi.nets.ssdMobilenetv1?.isLoaded) return;

  if (modelsLoading) {
    return new Promise((resolve, reject) => {
      modelLoadCallbacks.push({ resolve, reject });
    });
  }

  modelsLoading = true;
  try {
    const promises = [];
    if (!faceapi.nets.ssdMobilenetv1?.isLoaded) {
      promises.push(faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL));
    }
    if (!faceapi.nets.faceLandmark68Net?.isLoaded) {
      promises.push(faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL));
    }
    if (!faceapi.nets.faceRecognitionNet?.isLoaded) {
      promises.push(faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    modelsLoaded = true;
    modelsLoading = false;
    modelLoadCallbacks.forEach((cb) => cb.resolve());
    modelLoadCallbacks = [];
  } catch (err) {
    modelsLoaded = false;
    modelsLoading = false;
    modelLoadCallbacks.forEach((cb) => cb.reject(err));
    modelLoadCallbacks = [];
    throw err;
  }
}

/**
 * Dispose all face-api.js neural network models to free GPU/WASM tensor memory
 * (~60–90 MB). Call this when the face watchdog is disabled so the browser can
 * GC the tensors rather than holding them in memory for the entire session.
 */
export function disposeModels() {
  if (!modelsLoaded || !faceapiInstance) return;
  try {
    const nets = faceapiInstance.nets;
    if (nets.ssdMobilenetv1?.dispose) nets.ssdMobilenetv1.dispose();
    if (nets.faceLandmark68Net?.dispose) nets.faceLandmark68Net.dispose();
    if (nets.faceRecognitionNet?.dispose) nets.faceRecognitionNet.dispose();
  } catch (e) {
    console.warn('[faceApi] disposeModels error:', e);
  }
  modelsLoaded = false;
  modelsLoading = false;
  modelLoadCallbacks = [];
  // Do NOT null faceapiInstance — the JS module chunk stays loaded in memory,
  // but the heavy tensor weights are freed from GPU/WASM heap.
}


// ─── NEW SSD-BASED METHODS ──────────────────────────────────────────────────

export async function detectAllFacesSSD(element) {
  try {
    await loadFaceApiModels();
    const faceapi = await getFaceApi();

    if (!faceapi.nets.ssdMobilenetv1?.isLoaded) {
      return [];
    }

    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 });
    return await faceapi.detectAllFaces(element, options)
      .withFaceLandmarks()
      .withFaceDescriptors();
  } catch (err) {
    console.warn('[faceApi] detectAllFacesSSD error:', err);
    return [];
  }
}

// ─── BACKWARD COMPATIBLE EXPORTS (Deprecated but kept for watchdog) ─────────

export async function getFaceDescriptor(element) {
  try {
    await loadFaceApiModels();
    const faceapi = await getFaceApi();

    if (!faceapi.nets.ssdMobilenetv1?.isLoaded) {
      return null;
    }

    const detection = await faceapi
      .detectSingleFace(element, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;
    return Array.from(detection.descriptor);
  } catch (err) {
    console.warn('[faceApi] getFaceDescriptor error:', err);
    return null;
  }
}

export function euclideanDistance(d1, d2) {
  if (!d1 || !d2 || d1.length !== d2.length) return Infinity;
  return Math.sqrt(d1.reduce((sum, v, i) => sum + Math.pow(v - d2[i], 2), 0));
}

export function descriptorsMatch(d1, d2, threshold = 0.45) {
  return euclideanDistance(d1, d2) <= threshold;
}

export async function drawFaceDetection(video, canvas) {
  if (!video.videoWidth || video.videoWidth === 0) return false;

  await loadFaceApiModels();
  const faceapi = await getFaceApi();
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  const detections = await faceapi
    .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks();

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (detections && detections.length > 0) {
    const resized = faceapi.resizeResults(detections, displaySize);

    // Sort by largest face area to find the primary face
    resized.sort((a, b) => {
      const areaA = a.detection.box.width * a.detection.box.height;
      const areaB = b.detection.box.width * b.detection.box.height;
      return areaB - areaA;
    });

    const primaryFace = resized[0];
    const backgroundFaces = resized.slice(1);

    // 1. Draw faded red boxes for background faces
    backgroundFaces.forEach((f) => {
      const { x, y, width, height } = f.detection.box;
      ctx.strokeStyle = 'rgba(255, 60, 60, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    });

    // 2. Draw high-tech focus frame brackets for the primary face
    const { x, y, width, height } = primaryFace.detection.box;
    ctx.strokeStyle = '#00B0FF';
    ctx.lineWidth = 4;
    const bracketLen = width * 0.2;

    ctx.beginPath();
    // Top-Left
    ctx.moveTo(x, y + bracketLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + bracketLen, y);
    // Top-Right
    ctx.moveTo(x + width - bracketLen, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + bracketLen);
    // Bottom-Left
    ctx.moveTo(x, y + height - bracketLen);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + bracketLen, y + height);
    // Bottom-Right
    ctx.moveTo(x + width, y + height - bracketLen);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width - bracketLen, y + height);
    ctx.stroke();

    // Draw landmarks only for the primary face
    faceapi.draw.drawFaceLandmarks(canvas, primaryFace);

    return true;
  }
  return false;
}

// Deprecated - we now use LivenessDetector.js
export async function checkLiveness(videoElement, timeoutMs = 2500) {
  return 'live'; // Stub for backwards compat
}
