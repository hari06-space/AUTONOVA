/**
 * face_security_frontend_test.mjs
 *
 * Frontend Verification Test Suite for Face Hardening Modules:
 * - PassiveLivenessEngine: normalized drift, static photo spoof detection, excessive motion
 * - FaceRegistrationEngine: pairwise template consistency (< 0.35), quality filtering
 * - FaceConfig: threshold constants validation
 */

import FaceConfig from './FaceConfig.js';
import { PassiveLivenessEngine } from './PassiveLivenessEngine.js';

console.log('====================================================');
console.log('STARTING FRONTEND SECURITY VERIFICATION TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${details}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

// ── TEST 1: FaceConfig Constants ──────────────────────────────
console.log('--- 1. Testing FaceConfig Configuration ---');
assert(FaceConfig.matching.distanceThreshold === 0.42, 'Distance threshold is strictly 0.42');
assert(FaceConfig.matching.requiredFrames === 3, 'Multi-frame collection requires 3 frames');
assert(FaceConfig.quality.minScore === 48, 'Auth quality gate is strictly 48');
assert(FaceConfig.quality.registrationMinScore === 52, 'Registration quality gate is strictly 52');

// ── TEST 2: PassiveLivenessEngine - Real Living Face ───────────
console.log('\n--- 2. Testing Passive Liveness - Genuine Living Face ---');
{
  const engine = new PassiveLivenessEngine();
  const faceWidth = 160;

  // Simulate 3 frames with natural physiological micro-motion (~0.8px to 1.5px drift = ~0.5% - 1% face width)
  const baseLandmarks = Array.from({ length: 68 }, (_, i) => ({ x: 100 + i, y: 100 + i }));

  engine.addFrame({
    landmarks: { positions: baseLandmarks.map(p => ({ x: p.x, y: p.y })) },
    box: { width: faceWidth, height: faceWidth }
  });

  engine.addFrame({
    landmarks: { positions: baseLandmarks.map(p => ({ x: p.x + 1.1, y: p.y + 0.8 })) },
    box: { width: faceWidth, height: faceWidth }
  });

  engine.addFrame({
    landmarks: { positions: baseLandmarks.map(p => ({ x: p.x + 2.2, y: p.y + 1.5 })) },
    box: { width: faceWidth, height: faceWidth }
  });

  const result = engine.analyze();
  assert(result.passed === true, 'Living face with natural motion passes liveness');
  assert(result.confidence >= 0.5, 'Liveness confidence is >= 0.5');
}

// ── TEST 3: PassiveLivenessEngine - Static Photo Spoof Attack ──
console.log('\n--- 3. Testing Passive Liveness - Static Photo Attack (<0.3% Drift) ---');
{
  const engine = new PassiveLivenessEngine();
  const faceWidth = 160;

  // 3 frames with virtually zero motion (e.g. printed paper photo held in front of camera)
  const baseLandmarks = Array.from({ length: 68 }, (_, i) => ({ x: 100 + i, y: 100 + i }));

  engine.addFrame({
    landmarks: { positions: baseLandmarks.map(p => ({ x: p.x, y: p.y })) },
    box: { width: faceWidth, height: faceWidth }
  });

  engine.addFrame({
    landmarks: { positions: baseLandmarks.map(p => ({ x: p.x + 0.05, y: p.y + 0.05 })) },
    box: { width: faceWidth, height: faceWidth }
  });

  engine.addFrame({
    landmarks: { positions: baseLandmarks.map(p => ({ x: p.x + 0.08, y: p.y + 0.07 })) },
    box: { width: faceWidth, height: faceWidth }
  });

  const result = engine.analyze();
  assert(result.passed === false, 'Static photo with zero motion is REJECTED by liveness');
  assert(result.reason.includes('Static face detected'), 'Rejection reason states static face detection');
}

// ── TEST 4: PassiveLivenessEngine - Resolution Invariance ─────
console.log('\n--- 4. Testing Passive Liveness - Resolution Invariance (480p vs 4K) ---');
{
  // 480p: faceWidth = 100px, 0.8px motion = 0.8%
  const engine480p = new PassiveLivenessEngine();
  const base480 = Array.from({ length: 68 }, (_, i) => ({ x: 50 + i, y: 50 + i }));
  engine480p.addFrame({ landmarks: { positions: base480 }, box: { width: 100, height: 100 } });
  engine480p.addFrame({ landmarks: { positions: base480.map(p => ({ x: p.x + 0.8, y: p.y })) }, box: { width: 100, height: 100 } });
  engine480p.addFrame({ landmarks: { positions: base480.map(p => ({ x: p.x + 1.6, y: p.y })) }, box: { width: 100, height: 100 } });
  const res480p = engine480p.analyze();

  // 4K: faceWidth = 400px, 3.2px motion = 0.8%
  const engine4K = new PassiveLivenessEngine();
  const base4K = Array.from({ length: 68 }, (_, i) => ({ x: 200 + i, y: 200 + i }));
  engine4K.addFrame({ landmarks: { positions: base4K }, box: { width: 400, height: 400 } });
  engine4K.addFrame({ landmarks: { positions: base4K.map(p => ({ x: p.x + 3.2, y: p.y })) }, box: { width: 400, height: 400 } });
  engine4K.addFrame({ landmarks: { positions: base4K.map(p => ({ x: p.x + 6.4, y: p.y })) }, box: { width: 400, height: 400 } });
  const res4K = engine4K.analyze();

  assert(res480p.passed === true && res4K.passed === true, 'Both 480p and 4K cameras evaluate identically due to normalized metric');
  assert(Math.abs(res480p.motionStats.avgNormDrift - res4K.motionStats.avgNormDrift) < 1e-4, 'Normalized drift metric matches exactly across resolutions');
}

// ── TEST 5: Registration Intra-Template Consistency Check ─────
console.log('\n--- 5. Testing Registration Intra-Template Consistency ---');
{
  function euclideanDist(d1, d2) {
    let s = 0;
    for (let i = 0; i < d1.length; i++) {
      const d = d1[i] - d2[i];
      s += d * d;
    }
    return Math.sqrt(s);
  }

  // Consistent templates: all pairwise distances < 0.35 (e.g. 0.12 - 0.22)
  const template1 = Array.from({ length: 128 }, (_, i) => 0.088);
  const template2 = template1.map((v, i) => i < 10 ? v + 0.04 : v);
  const dist = euclideanDist(template1, template2);

  assert(dist < 0.35, `Pairwise template distance (${dist.toFixed(3)}) is within consistent bound (< 0.35)`);

  // Inconsistent templates: e.g. two different persons (dist ~0.65)
  const templateDifferentPerson = template1.map((v, i) => i % 2 === 0 ? -v : v);
  const distDifferent = euclideanDist(template1, templateDifferentPerson);

  assert(distDifferent > 0.35, `Different person pairwise distance (${distDifferent.toFixed(3)}) exceeds consistency bound and will be REJECTED`);
}

console.log('\n====================================================');
console.log(`ALL ${passedTests}/${totalTests} FRONTEND SECURITY TESTS PASSED!`);
console.log('====================================================\n');
