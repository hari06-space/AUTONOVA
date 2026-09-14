/**
 * BackgroundSegmenter.js
 * 
 * Removes background pixels using a convex hull based on facial landmarks.
 * This prevents background objects, lighting, and other people from influencing
 * the generated face embeddings.
 */

/**
 * Creates a mask from facial landmarks and applies it to the canvas.
 * Pixels outside the mask are rendered black.
 * 
 * @param {HTMLCanvasElement} canvas - The aligned face canvas (modified in place)
 * @param {Object} landmarks - face-api.js landmarks object (already mapped to aligned canvas space if possible, or we estimate)
 * 
 * Note: For best results, face-api should generate landmarks *on the aligned canvas*.
 * If we don't have aligned landmarks, we use an elliptical mask as a robust fallback.
 */
export function segmentBackground(canvas, alignedLandmarks = null) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;

  // Save current image data
  const originalImageData = ctx.getImageData(0, 0, w, h);

  // Create a mask canvas
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext('2d');
  
  maskCtx.fillStyle = '#000000';
  maskCtx.fillRect(0, 0, w, h);
  
  maskCtx.fillStyle = '#FFFFFF';

  if (alignedLandmarks) {
    // If we have precise landmarks on the aligned image, use the jawline + forehead estimation
    const jaw = alignedLandmarks.getJawOutline();
    const leftEye = alignedLandmarks.getLeftEye();
    const rightEye = alignedLandmarks.getRightEye();
    
    if (jaw && jaw.length > 0) {
      maskCtx.beginPath();
      // Start at left jaw
      maskCtx.moveTo(jaw[0].x, jaw[0].y);
      // Trace jaw
      for (let i = 1; i < jaw.length; i++) {
        maskCtx.lineTo(jaw[i].x, jaw[i].y);
      }
      
      // Estimate forehead to close the loop
      // Roughly symmetric above the eyes based on face width
      const faceLeft = jaw[0].x;
      const faceRight = jaw[jaw.length - 1].x;
      const faceWidth = faceRight - faceLeft;
      
      const eyeCenterY = (leftEye[0].y + rightEye[0].y) / 2;
      
      // Arc over the top
      maskCtx.quadraticCurveTo(
        faceRight, eyeCenterY - faceWidth * 0.4, // Control point right-high
        faceLeft + faceWidth / 2, eyeCenterY - faceWidth * 0.6 // Peak of forehead
      );
      maskCtx.quadraticCurveTo(
        faceLeft, eyeCenterY - faceWidth * 0.4, // Control point left-high
        jaw[0].x, jaw[0].y // Back to start
      );
      
      maskCtx.fill();
    } else {
      drawFallbackMask(maskCtx, w, h);
    }
  } else {
    // Robust fallback: An ellipse centered perfectly on the aligned face
    // Since we know FaceAligner puts eyes at Y=40% and centered X, 
    // the face is always in a predictable location.
    drawFallbackMask(maskCtx, w, h);
  }

  // Get mask data
  const maskData = maskCtx.getImageData(0, 0, w, h).data;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Apply mask: zero out RGB where mask is black (0)
  for (let i = 0; i < data.length; i += 4) {
    if (maskData[i] < 128) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      // Keep alpha opaque
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Draws a standard elliptical mask assuming the face was aligned by FaceAligner.
 */
function drawFallbackMask(ctx, w, h) {
  ctx.beginPath();
  const centerX = w / 2;
  const centerY = h * 0.50; // Center is slightly below eyes (eyes are at 0.40)
  const radiusX = w * 0.38; // Face width is roughly 75% of canvas
  const radiusY = h * 0.45; // Face height is roughly 90% of canvas
  
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.fill();
}

export default {
  segmentBackground,
};
