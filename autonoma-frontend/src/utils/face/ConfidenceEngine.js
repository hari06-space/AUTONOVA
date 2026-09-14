/**
 * ConfidenceEngine.js
 * 
 * Calculates final authentication confidence by combining multiple factors:
 * - Embedding similarity (distance)
 * - Margin between top matches
 * - Quality score
 * - Liveness score
 * - Historical consistency
 */

const CONFIDENCE_CONFIG = {
  // Distance to Similarity mapping
  // distance 0.0 -> similarity 100
  // distance 0.4 -> similarity ~85 (threshold)
  // distance 0.6 -> similarity ~60
  MAX_DISTANCE: 0.65,
  
  // Margin
  MIN_MARGIN_RATIO: 0.85, // If distance2 / distance1 < 0.85, it's ambiguous
  
  // Weights (must sum to 1.0)
  WEIGHTS: {
    similarity: 0.55,
    margin: 0.15,
    quality: 0.10,
    liveness: 0.10,
    consistency: 0.10,
  },
  
  // Enterprise threshold
  AUTH_THRESHOLD_SCORE: 85,
};

/**
 * Converts a Euclidean distance to a 0-100 similarity score.
 */
function distanceToSimilarity(distance) {
  if (distance === null || distance === undefined) return 0;
  if (distance >= CONFIDENCE_CONFIG.MAX_DISTANCE) return 0;
  
  // Non-linear mapping: penalize higher distances more heavily
  const ratio = distance / CONFIDENCE_CONFIG.MAX_DISTANCE;
  return Math.max(0, Math.round(100 * (1 - Math.pow(ratio, 1.5))));
}

/**
 * Calculates a margin score based on the gap between the top match and second match.
 * Prevents wrong-person logins when two registered faces are similar.
 */
function calculateMarginScore(dist1, dist2) {
  if (dist1 == null) return 0;
  if (dist2 == null || dist2 > CONFIDENCE_CONFIG.MAX_DISTANCE) return 100; // No close second match = excellent margin
  
  const ratio = dist1 / dist2; // e.g. 0.3 / 0.5 = 0.6
  
  if (ratio > CONFIDENCE_CONFIG.MIN_MARGIN_RATIO) {
    // Too close! Margin is poor. (e.g. 0.38 / 0.40 = 0.95)
    return Math.max(0, Math.round(100 * (1 - ratio) / (1 - CONFIDENCE_CONFIG.MIN_MARGIN_RATIO)));
  }
  
  return 100; // Good margin
}

/**
 * Generates final confidence score.
 * 
 * @param {Object} metrics
 * @param {number} metrics.distance - Distance to best match
 * @param {number} metrics.secondDistance - Distance to second best match (different user)
 * @param {number} metrics.quality - 0-100 face quality score
 * @param {number} metrics.liveness - 0-100 liveness score
 * @param {number} metrics.consistency - 0-100 consistency score (how many of the user's embeddings matched well)
 */
export function calculateConfidence(metrics) {
  const cfg = CONFIDENCE_CONFIG;
  
  const simScore = distanceToSimilarity(metrics.distance);
  const marginScore = calculateMarginScore(metrics.distance, metrics.secondDistance);
  const qualScore = metrics.quality || 50;
  const liveScore = metrics.liveness || 50;
  const consScore = metrics.consistency || 50;
  
  let finalScore = Math.round(
    simScore * cfg.WEIGHTS.similarity +
    marginScore * cfg.WEIGHTS.margin +
    qualScore * cfg.WEIGHTS.quality +
    liveScore * cfg.WEIGHTS.liveness +
    consScore * cfg.WEIGHTS.consistency
  );
  
  // Hard vetoes
  if (simScore < 60) finalScore = Math.min(finalScore, 79); // Distance > 0.45 roughly
  if (marginScore < 20) finalScore = Math.min(finalScore, 80); // Too ambiguous
  if (liveScore < 65) finalScore = Math.min(finalScore, 60); // Failed liveness
  
  return {
    confidence: finalScore,
    isAccepted: finalScore >= cfg.AUTH_THRESHOLD_SCORE,
    breakdown: {
      similarity: simScore,
      margin: marginScore,
      quality: qualScore,
      liveness: liveScore,
      consistency: consScore
    }
  };
}

export default {
  calculateConfidence,
  CONFIDENCE_CONFIG,
};
