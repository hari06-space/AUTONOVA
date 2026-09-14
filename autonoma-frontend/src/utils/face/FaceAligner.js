/**
 * FaceAligner.js
 * 
 * Aligns detected faces based on landmarks.
 * Ensures eyes are horizontal, scales to a fixed size, and centers the face.
 * This dramatically improves embedding consistency and recognition accuracy.
 */

const ALIGN_CONFIG = {
  OUTPUT_SIZE: 160,          // Target dimension (160x160)
  LEFT_EYE_TARGET: 0.35,     // X relative position of left eye
  RIGHT_EYE_TARGET: 0.65,    // X relative position of right eye
  EYE_Y_TARGET: 0.40,        // Y relative position of eyes (top 40%)
};

/**
 * Calculates the center point of an array of landmark points.
 */
function getCenterPoint(points) {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

/**
 * Aligns the face from the source canvas based on landmarks.
 * Returns a new 160x160 canvas with the aligned face.
 * 
 * @param {HTMLCanvasElement} sourceCanvas 
 * @param {Object} landmarks - face-api.js landmarks object
 * @returns {HTMLCanvasElement}
 */
export function alignFace(sourceCanvas, landmarks) {
  if (!landmarks || !landmarks.getLeftEye || !landmarks.getRightEye) {
    throw new Error('Invalid landmarks provided for alignment.');
  }

  // 1. Get eye centers
  const leftEyeCenter = getCenterPoint(landmarks.getLeftEye());
  const rightEyeCenter = getCenterPoint(landmarks.getRightEye());

  // 2. Calculate angle between eyes
  const dx = rightEyeCenter.x - leftEyeCenter.x;
  const dy = rightEyeCenter.y - leftEyeCenter.y;
  const angle = Math.atan2(dy, dx); // Angle in radians

  // 3. Calculate distance between eyes
  const eyeDistance = Math.sqrt(dx * dx + dy * dy);

  // 4. Calculate scale factor
  // We want the eyes to be separated by (RIGHT_EYE_TARGET - LEFT_EYE_TARGET) * OUTPUT_SIZE
  const targetEyeDistance = (ALIGN_CONFIG.RIGHT_EYE_TARGET - ALIGN_CONFIG.LEFT_EYE_TARGET) * ALIGN_CONFIG.OUTPUT_SIZE;
  let scale = targetEyeDistance / eyeDistance;
  
  // Guard against extreme scaling (e.g. if face is tiny or huge)
  if (scale < 0.1 || scale > 10) {
      scale = 1.0;
  }

  // 5. Calculate center point between eyes in original image
  const centerOriginalX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
  const centerOriginalY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

  // 6. Setup destination canvas
  const alignedCanvas = document.createElement('canvas');
  alignedCanvas.width = ALIGN_CONFIG.OUTPUT_SIZE;
  alignedCanvas.height = ALIGN_CONFIG.OUTPUT_SIZE;
  const ctx = alignedCanvas.getContext('2d', { willReadFrequently: true });
  
  // Fill with black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, ALIGN_CONFIG.OUTPUT_SIZE, ALIGN_CONFIG.OUTPUT_SIZE);

  // 7. Apply transformation
  // Target center between eyes in the new canvas
  const targetCenterX = ALIGN_CONFIG.OUTPUT_SIZE / 2;
  const targetCenterY = ALIGN_CONFIG.EYE_Y_TARGET * ALIGN_CONFIG.OUTPUT_SIZE;

  ctx.save();
  // Move to target center
  ctx.translate(targetCenterX, targetCenterY);
  // Rotate to level eyes
  ctx.rotate(-angle);
  // Scale
  ctx.scale(scale, scale);
  // Move back by original eye center (so it maps to the target center)
  ctx.translate(-centerOriginalX, -centerOriginalY);

  // Draw the image
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.restore();

  return alignedCanvas;
}

export default {
  alignFace,
  ALIGN_CONFIG,
};
