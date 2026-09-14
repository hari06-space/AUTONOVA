/**
 * FaceRecognitionService.js
 * 
 * Enterprise Biometric Feature Recognition & Template Matching Service.
 * Implements Euclidean distance, Cosine similarity, multi-embedding template matching,
 * adaptive threshold adjustments, and multi-frame consecutive match tracking.
 */

import FaceConfig from './FaceConfig';

export class FaceRecognitionService {
  /**
   * Calculate Euclidean distance between two 128-D face descriptors.
   * Distance <= 0.45 indicates the same person (face-api.js model standard).
   * 
   * @param {number[]} d1 
   * @param {number[]} d2 
   * @returns {number} Distance (0.0 = identical, >0.45 = different)
   */
  static euclideanDistance(d1, d2) {
    if (!d1 || !d2 || d1.length !== d2.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < d1.length; i++) {
      const diff = d1[i] - d2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Calculate Cosine similarity between two descriptors.
   * Similarity >= 0.70 indicates high similarity.
   * 
   * @param {number[]} d1 
   * @param {number[]} d2 
   * @returns {number} Similarity (-1.0 to 1.0)
   */
  static cosineSimilarity(d1, d2) {
    if (!d1 || !d2 || d1.length !== d2.length) return -1;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < d1.length; i++) {
      dot += d1[i] * d2[i];
      normA += d1[i] * d1[i];
      normB += d2[i] * d2[i];
    }
    if (normA === 0 || normB === 0) return -1;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Compare an incoming descriptor against stored template embeddings.
   * Stored embeddings can be a single 128-D array or an array of template arrays/objects.
   * 
   * @param {number[]} incomingDescriptor 
   * @param {Array} storedEmbeddings 
   * @param {Object} [options] 
   * @returns {{ isMatch: boolean, minDistance: number, maxSimilarity: number, score: number }}
   */
  static matchDescriptor(incomingDescriptor, storedEmbeddings, options = {}) {
    if (!incomingDescriptor || !storedEmbeddings) {
      return { isMatch: false, minDistance: Infinity, maxSimilarity: -1, score: 0 };
    }

    const threshold = options.distanceThreshold || FaceConfig.matching.distanceThreshold;
    let templates = [];

    // Normalize storedEmbeddings into array of double arrays
    if (Array.isArray(storedEmbeddings)) {
      if (typeof storedEmbeddings[0] === 'number') {
        templates = [storedEmbeddings];
      } else {
        templates = storedEmbeddings.map((item) => {
          if (Array.isArray(item)) return item;
          if (item && item.descriptor && Array.isArray(item.descriptor)) return item.descriptor;
          return null;
        }).filter(Boolean);
      }
    }

    if (templates.length === 0) {
      return { isMatch: false, minDistance: Infinity, maxSimilarity: -1, score: 0 };
    }

    let minDistance = Infinity;
    let maxSimilarity = -1;

    for (const template of templates) {
      const dist = this.euclideanDistance(incomingDescriptor, template);
      const sim = this.cosineSimilarity(incomingDescriptor, template);

      if (dist < minDistance) minDistance = dist;
      if (sim > maxSimilarity) maxSimilarity = sim;
    }

    const isMatch = minDistance <= threshold;
    
    // Convert distance to 0-100 confidence score
    // dist 0.0 -> 100%, dist 0.45 -> 60%, dist > 0.6 -> 0%
    let score = 0;
    if (minDistance <= threshold) {
      score = Math.round(100 - (minDistance / threshold) * 40);
    } else if (minDistance < 0.65) {
      score = Math.round(60 * (0.65 - minDistance) / (0.65 - threshold));
    }

    return {
      isMatch,
      minDistance,
      maxSimilarity,
      score: Math.max(0, Math.min(100, score)),
    };
  }

  /**
   * Compute average/mean descriptor from multiple 128-D frame descriptors.
   * Used for synthesizing a single centroid descriptor during multi-frame enrollment.
   * 
   * @param {Array<number[]>} descriptors 
   * @returns {number[]|null}
   */
  static synthesizeCentroid(descriptors) {
    if (!descriptors || descriptors.length === 0) return null;
    const len = descriptors[0].length;
    const centroid = new Array(len).fill(0);

    for (const desc of descriptors) {
      for (let i = 0; i < len; i++) {
        centroid[i] += desc[i];
      }
    }

    const count = descriptors.length;
    for (let i = 0; i < len; i++) {
      centroid[i] /= count;
    }

    return centroid;
  }

  /**
   * Filter out duplicate or highly similar descriptors from a collection.
   * 
   * @param {Array<number[]>} descriptors 
   * @param {number} [minDistanceThreshold=0.08] 
   * @returns {Array<number[]>}
   */
  static deduplicateDescriptors(descriptors, minDistanceThreshold = FaceConfig.registration.duplicateDistanceThreshold) {
    if (!descriptors || descriptors.length <= 1) return descriptors;

    const unique = [descriptors[0]];

    for (let i = 1; i < descriptors.length; i++) {
      const candidate = descriptors[i];
      let isDuplicate = false;

      for (const existing of unique) {
        if (this.euclideanDistance(candidate, existing) < minDistanceThreshold) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(candidate);
      }
    }

    return unique;
  }
}

export default FaceRecognitionService;
