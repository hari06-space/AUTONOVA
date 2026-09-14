/**
 * MultiPersonValidator.js
 * 
 * Multi-face detection validator for enterprise face authentication.
 * Defines the authentication zone and ensures exactly ONE valid face is present.
 * Rejects multiple faces or faces outside the zone with descriptive guidance.
 */

import FaceConfig from './FaceConfig';

/**
 * Checks if a detected face box is within the active authentication zone.
 */
function isInAuthZone(faceBox, frameWidth, frameHeight) {
  if (!faceBox || !frameWidth || !frameHeight) return false;

  const faceCenterX = faceBox.x + faceBox.width / 2;
  const faceCenterY = faceBox.y + faceBox.height / 2;
  
  const relX = faceCenterX / frameWidth;
  const relY = faceCenterY / frameHeight;
  
  const halfZoneX = FaceConfig.authZone.centerRatioX / 2;
  const halfZoneY = FaceConfig.authZone.centerRatioY / 2;

  const minX = 0.5 - halfZoneX;
  const maxX = 0.5 + halfZoneX;
  const minY = 0.5 - halfZoneY;
  const maxY = 0.5 + halfZoneY;

  return (
    relX >= minX &&
    relX <= maxX &&
    relY >= minY &&
    relY <= maxY
  );
}

/**
 * Validates an array of face detections.
 * 
 * @param {Array} detections - Detections from face-api
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @returns {{ status: string, primaryFace: Object|null, message: string, validCount: number }}
 */
export function validateDetections(detections, frameWidth, frameHeight) {
  if (!detections || detections.length === 0) {
    return {
      status: 'NO_FACE',
      primaryFace: null,
      message: FaceConfig.guidance.noFace,
      validCount: 0,
    };
  }

  const frameArea = frameWidth * frameHeight;

  // 1. Filter out tiny background faces
  const significantFaces = detections.filter((d) => {
    const box = d.detection.box;
    const faceArea = box.width * box.height;
    const ratio = faceArea / frameArea;
    return ratio >= FaceConfig.authZone.faceMinAreaRatio;
  });

  if (significantFaces.length === 0) {
    return {
      status: 'NO_FACE',
      primaryFace: null,
      message: FaceConfig.guidance.faceTooSmall,
      validCount: 0,
    };
  }

  // 2. Filter faces inside the central authentication zone
  const facesInZone = significantFaces.filter((d) =>
    isInAuthZone(d.detection.box, frameWidth, frameHeight)
  );

  if (facesInZone.length === 0) {
    return {
      status: 'OUTSIDE_ZONE',
      primaryFace: significantFaces[0],
      message: FaceConfig.guidance.faceNotCentered,
      validCount: 0,
    };
  }

  // 3. Reject if multiple people are in the authentication zone
  if (facesInZone.length > 1) {
    // Sort by face area (largest first) to mark the main face box in red
    facesInZone.sort((a, b) => {
      const areaA = a.detection.box.width * a.detection.box.height;
      const areaB = b.detection.box.width * b.detection.box.height;
      return areaB - areaA;
    });

    return {
      status: 'MULTIPLE_FACES',
      primaryFace: facesInZone[0],
      message: FaceConfig.guidance.multipleFaces,
      validCount: facesInZone.length,
    };
  }

  // Exactly 1 valid face in zone
  return {
    status: 'VALID',
    primaryFace: facesInZone[0],
    message: '',
    validCount: 1,
  };
}

export default {
  validateDetections,
  isInAuthZone,
};
