package com.autonoma.erp.service.admin;

// Organization: Nutech
// Owner: Nutech
// Created At: 2026-07-03
// Updated By: Nutech
// Updated At: 2026-08-29
// Description: Enterprise in-memory face descriptor cache.
//              Security hardened: user-level Top-1/Top-2 margin analysis,
//              multi-frame median aggregate matching, configurable thresholds.

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.repository.admin.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * FaceDescriptorCacheService
 *
 * Enterprise in-memory face descriptor cache for banking-grade authentication speed.
 *
 * Design:
 * - Loads all enrolled face descriptors at application startup (@PostConstruct).
 * - Parses descriptor JSON only ONCE per user, not on every login attempt.
 * - Stores parsed double[][] embeddings in a ConcurrentHashMap for thread-safe access.
 *
 * Security:
 * - User-level Top-1/Top-2 margin analysis: the winning user's score must be
 *   clearly separated from the second-best user's score by at least MIN_MARGIN.
 * - Multi-frame median aggregate: computes per-user aggregate distance from
 *   multiple probe frames, then applies margin check on aggregated scores.
 * - Ambiguous matches are always rejected (WHEN IN DOUBT, DENY).
 *
 * Thresholds (starting values — calibrate against actual enrolled users):
 *   MATCH_THRESHOLD  = 0.42   (face-api.js SSD MobileNet, enterprise-grade)
 *   MIN_MARGIN       = 0.10   (minimum gap between Top-1 and Top-2 user scores)
 */
@Service
public class FaceDescriptorCacheService {

    private static final Logger log = LoggerFactory.getLogger(FaceDescriptorCacheService.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    /**
     * Starting match threshold. Reduce for higher security, increase for more tolerance.
     * Calibrate against your actual enrolled users and camera environment.
     */
    public static final double MATCH_THRESHOLD = 0.42;

    /**
     * Minimum required gap between the Top-1 user score and the Top-2 user score.
     * If the gap is smaller than this, the match is ambiguous → REJECT.
     */
    public static final double MIN_MARGIN = 0.10;

    public static class CacheEntry {
        public final String userId;
        public final double[][] embeddings;

        public CacheEntry(String userId, double[][] embeddings) {
            this.userId = userId;
            this.embeddings = embeddings;
        }
    }

    /** Result of a secure match attempt. */
    public static class MatchResult {
        public final String userId;       // null if no confident match
        public final double bestDistance;
        public final double margin;       // top2 - top1 (positive = clear winner)
        public final boolean rejected;    // true if ambiguous or above threshold
        public final String rejectReason;

        private MatchResult(String userId, double bestDistance, double margin, boolean rejected, String rejectReason) {
            this.userId = userId;
            this.bestDistance = bestDistance;
            this.margin = margin;
            this.rejected = rejected;
            this.rejectReason = rejectReason;
        }

        public static MatchResult accept(String userId, double bestDistance, double margin) {
            return new MatchResult(userId, bestDistance, margin, false, null);
        }

        public static MatchResult reject(double bestDistance, double margin, String reason) {
            return new MatchResult(null, bestDistance, margin, true, reason);
        }
    }

    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void buildCache() {
        log.info("[FaceCache] Building face descriptor cache at startup...");
        long start = System.currentTimeMillis();
        int loaded = 0;
        int skipped = 0;

        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            List<UserCredential> allUsers = userRepository.findAll();

            for (UserCredential user : allUsers) {
                if (user.getStatus() != null && user.getStatus() == 0) continue;
                if (!hasFaceData(user)) {
                    skipped++;
                    continue;
                }

                double[][] parsed = parseUserEmbeddings(user);
                if (parsed != null && parsed.length > 0) {
                    cache.put(user.getUserId(), new CacheEntry(user.getUserId(), parsed));
                    loaded++;
                } else {
                    skipped++;
                }
            }
        } catch (Exception e) {
            log.error("[FaceCache] Error building face descriptor cache: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[FaceCache] Cache built: {} users loaded, {} skipped, took {}ms", loaded, skipped, elapsed);
    }

    public void refreshUser(String userId) {
        if (userId == null || userId.isBlank()) return;

        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            Optional<UserCredential> userOpt = userRepository.findByUserId(userId);
            if (userOpt.isEmpty()) {
                cache.remove(userId);
                log.info("[FaceCache] Evicted user '{}' from cache (user not found)", userId);
                return;
            }

            UserCredential user = userOpt.get();
            if ((user.getStatus() != null && user.getStatus() == 0) || !hasFaceData(user)) {
                cache.remove(userId);
                log.info("[FaceCache] Evicted inactive/unenrolled user '{}' from cache", userId);
                return;
            }

            double[][] parsed = parseUserEmbeddings(user);
            if (parsed != null && parsed.length > 0) {
                cache.put(userId, new CacheEntry(userId, parsed));
                log.info("[FaceCache] Refreshed cache for user '{}' ({} templates)", userId, parsed.length);
            } else {
                cache.remove(userId);
                log.info("[FaceCache] Evicted user '{}' from cache (no parseable embeddings)", userId);
            }
        } catch (Exception e) {
            log.error("[FaceCache] Error refreshing cache for user '{}': {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Secure single-probe match with user-level Top-1/Top-2 margin analysis.
     *
     * Algorithm:
     * 1. For each user, compute the MINIMUM distance between the probe and ALL
     *    of that user's stored templates → userScore.
     * 2. Rank all users by userScore ascending.
     * 3. Gate 1: top1.userScore <= MATCH_THRESHOLD
     * 4. Gate 2: top2.userScore - top1.userScore >= MIN_MARGIN
     *    (if top2 doesn't exist, use Double.MAX_VALUE as its distance)
     * 5. Both gates must pass. Otherwise: REJECT.
     *
     * @deprecated Prefer {@link #findMatchSecure(double[], double, double)} for new callers.
     */
    @Deprecated
    public String findMatch(double[] incoming, double threshold) {
        MatchResult result = findMatchSecure(incoming, threshold, MIN_MARGIN);
        return result.rejected ? null : result.userId;
    }

    /**
     * Secure single-probe match with configurable threshold and margin.
     */
    public MatchResult findMatchSecure(double[] incoming, double threshold, double minMargin) {
        if (incoming == null || incoming.length == 0) {
            return MatchResult.reject(Double.MAX_VALUE, 0, "Empty probe descriptor");
        }

        if (cache.isEmpty()) {
            log.warn("[FaceCache] Cache is empty! Triggering buildCache()...");
            buildCache();
        }

        // Collect per-user best distances
        List<double[]> userScores = new ArrayList<>(); // [0]=distance, [1]=userId(index)
        List<String> userIds = new ArrayList<>();

        for (CacheEntry entry : cache.values()) {
            double userBest = bestDistanceForUser(incoming, entry.embeddings);
            userScores.add(new double[]{ userBest, userIds.size() });
            userIds.add(entry.userId);
        }

        // Fallback: scan DB for recently enrolled users not yet in cache
        if (userScores.isEmpty()) {
            return tryDbFallback(incoming, threshold, minMargin);
        }

        // Sort by distance ascending
        userScores.sort(Comparator.comparingDouble(a -> a[0]));

        double top1Dist = userScores.get(0)[0];
        String top1UserId = userIds.get((int) userScores.get(0)[1]);
        double top2Dist = userScores.size() > 1 ? userScores.get(1)[0] : Double.MAX_VALUE;
        double margin = top2Dist - top1Dist;

        log.info("[FaceCache] Top-1: user='{}' dist={} | Top-2 dist={} | margin={} (threshold={}, minMargin={})",
                top1UserId,
                String.format("%.4f", top1Dist),
                String.format("%.4f", top2Dist),
                String.format("%.4f", margin),
                threshold, minMargin);

        // Gate 1: threshold
        if (top1Dist > threshold) {
            return MatchResult.reject(top1Dist, margin,
                    String.format("Best distance %.4f exceeds threshold %.4f", top1Dist, threshold));
        }

        // Gate 2: margin
        if (margin < minMargin) {
            log.warn("[FaceCache] AMBIGUOUS match rejected: Top-1='{}' dist={} vs Top-2 dist={} margin={} < minMargin={}",
                    top1UserId,
                    String.format("%.4f", top1Dist),
                    String.format("%.4f", top2Dist),
                    String.format("%.4f", margin),
                    minMargin);
            return MatchResult.reject(top1Dist, margin,
                    String.format("Ambiguous match: margin %.4f is below required %.4f", margin, minMargin));
        }

        return MatchResult.accept(top1UserId, top1Dist, margin);
    }

    /**
     * Secure multi-frame match.
     *
     * Each element in {@code frames} is one 128-D probe descriptor from a different
     * video frame. The algorithm:
     * 1. For each user, compute per-frame best distances → median → userAggScore.
     * 2. Apply user-level Top-1/Top-2 margin analysis on aggregate scores.
     * 3. Additionally require that every frame individually agrees on the same user
     *    (temporal consistency: all frames must vote for the top-1 user as their
     *    personal best match, within threshold).
     *
     * @param frames     Array of probe descriptors (one per captured frame).
     * @param threshold  Match acceptance threshold (euclidean distance).
     * @param minMargin  Minimum required gap between Top-1 and Top-2 aggregate scores.
     * @return MatchResult — inspect {@code rejected} and {@code userId}.
     */
    public MatchResult findMatchMultiFrame(double[][] frames, double threshold, double minMargin) {
        if (frames == null || frames.length == 0) {
            return MatchResult.reject(Double.MAX_VALUE, 0, "No probe frames supplied");
        }

        if (cache.isEmpty()) {
            log.warn("[FaceCache] Cache is empty! Triggering buildCache()...");
            buildCache();
        }

        List<String> userIds = new ArrayList<>(cache.keySet());
        int numUsers = userIds.size();

        if (numUsers == 0) {
            return MatchResult.reject(Double.MAX_VALUE, 0, "No enrolled users in cache");
        }

        // For each user, compute per-frame best distances then median
        double[] aggregateScores = new double[numUsers];
        for (int u = 0; u < numUsers; u++) {
            CacheEntry entry = cache.get(userIds.get(u));
            if (entry == null) {
                aggregateScores[u] = Double.MAX_VALUE;
                continue;
            }
            double[] perFrameDists = new double[frames.length];
            for (int f = 0; f < frames.length; f++) {
                perFrameDists[f] = bestDistanceForUser(frames[f], entry.embeddings);
            }
            aggregateScores[u] = median(perFrameDists);
        }

        // Find Top-1 and Top-2 by aggregate score
        int top1Idx = -1;
        int top2Idx = -1;
        double top1Score = Double.MAX_VALUE;
        double top2Score = Double.MAX_VALUE;

        for (int u = 0; u < numUsers; u++) {
            if (aggregateScores[u] < top1Score) {
                top2Score = top1Score;
                top2Idx = top1Idx;
                top1Score = aggregateScores[u];
                top1Idx = u;
            } else if (aggregateScores[u] < top2Score) {
                top2Score = aggregateScores[u];
                top2Idx = u;
            }
        }

        if (top1Idx < 0) {
            return MatchResult.reject(Double.MAX_VALUE, 0, "No users scored");
        }

        String top1UserId = userIds.get(top1Idx);
        double margin = top2Score - top1Score;

        log.info("[FaceCache][MultiFrame] frames={} Top-1='{}' aggScore={} | Top-2 aggScore={} | margin={} (threshold={}, minMargin={})",
                frames.length, top1UserId,
                String.format("%.4f", top1Score),
                String.format("%.4f", top2Score),
                String.format("%.4f", margin),
                threshold, minMargin);

        // Gate 1: threshold
        if (top1Score > threshold) {
            return MatchResult.reject(top1Score, margin,
                    String.format("Aggregate distance %.4f exceeds threshold %.4f", top1Score, threshold));
        }

        // Gate 2: margin
        if (margin < minMargin) {
            log.warn("[FaceCache][MultiFrame] AMBIGUOUS — margin {} < minMargin {}", margin, minMargin);
            return MatchResult.reject(top1Score, margin,
                    String.format("Ambiguous multi-frame match: margin %.4f < required %.4f", margin, minMargin));
        }

        // Gate 3: temporal consistency — ALL captured frames must individually prefer the same user
        // and be within the match threshold. If frames disagree (e.g. A, A, B or A, B, C) → REJECT.
        CacheEntry top1Entry = cache.get(top1UserId);
        if (top1Entry != null) {
            int agreedFrames = 0;
            for (double[] frame : frames) {
                // Find which user this frame votes for
                double frameBestDist = Double.MAX_VALUE;
                String frameVote = null;
                for (int u = 0; u < numUsers; u++) {
                    CacheEntry e = cache.get(userIds.get(u));
                    if (e == null) continue;
                    double d = bestDistanceForUser(frame, e.embeddings);
                    if (d < frameBestDist) {
                        frameBestDist = d;
                        frameVote = userIds.get(u);
                    }
                }
                // Frame must vote for top1 AND be within threshold
                if (top1UserId.equals(frameVote) && frameBestDist <= threshold) {
                    agreedFrames++;
                }
            }

            // Zero-tolerance temporal consensus: all frames must agree
            int requiredAgreement = frames.length;
            log.info("[FaceCache][MultiFrame] Temporal consistency: {}/{} frames agree on user '{}'",
                    agreedFrames, frames.length, top1UserId);

            if (agreedFrames < requiredAgreement) {
                log.warn("[FaceCache][MultiFrame] REJECT: Temporal inconsistency ({}/{} agreed on user '{}')",
                        agreedFrames, frames.length, top1UserId);
                return MatchResult.reject(top1Score, margin,
                        String.format("Temporal inconsistency: only %d/%d frames agreed on user identity (all %d required)",
                                agreedFrames, frames.length, requiredAgreement));
            }
        }

        return MatchResult.accept(top1UserId, top1Score, margin);
    }

    /**
     * Secure 1:1 verification for the known-username path.
     * Compares probe against the specified user's stored templates only,
     * then checks the margin against the overall cache to detect impersonation.
     */
    public MatchResult verifyUser(String userId, double[] incoming, double threshold, double minMargin) {
        if (userId == null || incoming == null) {
            return MatchResult.reject(Double.MAX_VALUE, 0, "Null userId or descriptor");
        }

        CacheEntry target = cache.get(userId);
        if (target == null) {
            refreshUser(userId);
            target = cache.get(userId);
        }

        if (target == null) {
            return MatchResult.reject(Double.MAX_VALUE, 0, "User not in cache — not enrolled");
        }

        double userDist = bestDistanceForUser(incoming, target.embeddings);

        // Gate 1: threshold
        if (userDist > threshold) {
            log.info("[FaceCache][Verify] User '{}' dist={} > threshold={} → REJECT", userId,
                    String.format("%.4f", userDist), threshold);
            return MatchResult.reject(userDist, 0,
                    String.format("Verification failed: distance %.4f > threshold %.4f", userDist, threshold));
        }

        // Gate 2: margin — find the closest OTHER user
        double secondBestDist = Double.MAX_VALUE;
        for (Map.Entry<String, CacheEntry> e : cache.entrySet()) {
            if (e.getKey().equals(userId)) continue;
            double d = bestDistanceForUser(incoming, e.getValue().embeddings);
            if (d < secondBestDist) secondBestDist = d;
        }

        double margin = secondBestDist - userDist;
        log.info("[FaceCache][Verify] User='{}' dist={} | closest-other dist={} | margin={} (threshold={}, minMargin={})",
                userId,
                String.format("%.4f", userDist),
                String.format("%.4f", secondBestDist),
                String.format("%.4f", margin),
                threshold, minMargin);

        if (margin < minMargin) {
            log.warn("[FaceCache][Verify] AMBIGUOUS — margin {} < minMargin {} for user '{}'", margin, minMargin, userId);
            return MatchResult.reject(userDist, margin,
                    String.format("Ambiguous: margin %.4f < required %.4f — could be impersonation", margin, minMargin));
        }

        return MatchResult.accept(userId, userDist, margin);
    }

    /** Multi-frame 1:1 verification. */
    public MatchResult verifyUserMultiFrame(String userId, double[][] frames, double threshold, double minMargin) {
        if (userId == null || frames == null || frames.length == 0) {
            return MatchResult.reject(Double.MAX_VALUE, 0, "Null userId or empty frames");
        }

        CacheEntry target = cache.get(userId);
        if (target == null) {
            refreshUser(userId);
            target = cache.get(userId);
        }

        if (target == null) {
            return MatchResult.reject(Double.MAX_VALUE, 0, "User not enrolled");
        }

        double[] perFrameDists = new double[frames.length];
        for (int f = 0; f < frames.length; f++) {
            perFrameDists[f] = bestDistanceForUser(frames[f], target.embeddings);
        }
        double aggDist = median(perFrameDists);

        if (aggDist > threshold) {
            return MatchResult.reject(aggDist, 0,
                    String.format("Multi-frame aggregate distance %.4f > threshold %.4f", aggDist, threshold));
        }

        // Margin check against closest other user
        double secondBestAgg = Double.MAX_VALUE;
        for (Map.Entry<String, CacheEntry> e : cache.entrySet()) {
            if (e.getKey().equals(userId)) continue;
            double[] otherPerFrame = new double[frames.length];
            for (int f = 0; f < frames.length; f++) {
                otherPerFrame[f] = bestDistanceForUser(frames[f], e.getValue().embeddings);
            }
            double otherAgg = median(otherPerFrame);
            if (otherAgg < secondBestAgg) secondBestAgg = otherAgg;
        }

        double margin = secondBestAgg - aggDist;
        log.info("[FaceCache][VerifyMulti] User='{}' aggDist={} | margin={}",
                userId, String.format("%.4f", aggDist), String.format("%.4f", margin));

        if (margin < minMargin) {
            return MatchResult.reject(aggDist, margin,
                    String.format("Ambiguous multi-frame verification: margin %.4f < %.4f", margin, minMargin));
        }

        return MatchResult.accept(userId, aggDist, margin);
    }

    public CacheEntry get(String userId) {
        CacheEntry entry = cache.get(userId);
        if (entry == null) {
            refreshUser(userId);
            entry = cache.get(userId);
        }
        return entry;
    }

    public int size() {
        return cache.size();
    }

    // ── Private Helpers ──────────────────────────────────────────────────────────

    /**
     * Best (minimum) euclidean distance between {@code probe} and ALL templates of a user.
     */
    private double bestDistanceForUser(double[] probe, double[][] templates) {
        double best = Double.MAX_VALUE;
        for (double[] template : templates) {
            double d = euclideanDistance(probe, template);
            if (d < best) best = d;
        }
        return best;
    }

    /**
     * Median of a double array. Returns MAX_VALUE for empty input.
     */
    private double median(double[] values) {
        if (values == null || values.length == 0) return Double.MAX_VALUE;
        double[] sorted = Arrays.copyOf(values, values.length);
        Arrays.sort(sorted);
        int mid = sorted.length / 2;
        return (sorted.length % 2 == 0)
                ? (sorted[mid - 1] + sorted[mid]) / 2.0
                : sorted[mid];
    }

    /**
     * DB fallback: scan DB directly for recently enrolled users not yet in cache.
     * Should rarely be needed in practice.
     */
    private MatchResult tryDbFallback(double[] incoming, double threshold, double minMargin) {
        try {
            com.autonoma.erp.config.TenantContextHolder.setTenantId("AUTONOMA");
            List<UserCredential> allUsers = userRepository.findActiveUsersWithFaceData();
            for (UserCredential user : allUsers) {
                if (!hasFaceData(user)) continue;
                double[][] parsed = parseUserEmbeddings(user);
                if (parsed == null) continue;
                cache.put(user.getUserId(), new CacheEntry(user.getUserId(), parsed));
            }
            log.info("[FaceCache] DB fallback loaded {} users into cache", allUsers.size());
            if (cache.isEmpty()) {
                return MatchResult.reject(Double.MAX_VALUE, 0, "No enrolled users found in DB");
            }
            return findMatchSecure(incoming, threshold, minMargin);
        } catch (Exception e) {
            log.error("[FaceCache] DB fallback scan error: {}", e.getMessage());
            return MatchResult.reject(Double.MAX_VALUE, 0, "DB fallback error: " + e.getMessage());
        }
    }

    private boolean hasFaceData(UserCredential user) {
        return (user.getFaceEmbeddings() != null && !user.getFaceEmbeddings().isBlank())
                || (user.getFaceDescriptor() != null && !user.getFaceDescriptor().isBlank());
    }

    public String findDuplicateUser(double[][] frames, String currentUserId) {
        if (frames == null || frames.length == 0) return null;
        if (cache.isEmpty()) {
            buildCache();
        }

        for (CacheEntry entry : cache.values()) {
            if (entry.userId.equals(currentUserId)) continue;

            double[] perFrameDists = new double[frames.length];
            for (int f = 0; f < frames.length; f++) {
                perFrameDists[f] = bestDistanceForUser(frames[f], entry.embeddings);
            }
            double aggScore = median(perFrameDists);
            if (aggScore < 0.50) { // Threshold for duplication
                return entry.userId;
            }
        }
        return null;
    }

    public double[][] parseUserEmbeddings(UserCredential user) {
        List<double[]> embeddings = new ArrayList<>();

        if (user.getFaceEmbeddings() != null && !user.getFaceEmbeddings().isBlank()) {
            try {
                List<?> list = OBJECT_MAPPER.readValue(user.getFaceEmbeddings(), List.class);
                for (Object item : list) {
                    if (item instanceof Map) {
                        Map<?, ?> map = (Map<?, ?>) item;
                        if (map.containsKey("descriptor") && map.get("descriptor") instanceof List) {
                            List<?> nums = (List<?>) map.get("descriptor");
                            double[] arr = new double[nums.size()];
                            for (int i = 0; i < nums.size(); i++) {
                                arr[i] = ((Number) nums.get(i)).doubleValue();
                            }
                            embeddings.add(arr);
                        }
                    } else if (item instanceof List) {
                        List<?> nums = (List<?>) item;
                        double[] arr = new double[nums.size()];
                        for (int i = 0; i < nums.size(); i++) {
                            arr[i] = ((Number) nums.get(i)).doubleValue();
                        }
                        embeddings.add(arr);
                    }
                }
            } catch (Exception e) {
                log.warn("[FaceCache] Failed to parse faceEmbeddings for user '{}': {}", user.getUserId(), e.getMessage());
            }
        }

        if (user.getFaceDescriptor() != null && !user.getFaceDescriptor().isBlank()) {
            try {
                double[] single = OBJECT_MAPPER.readValue(user.getFaceDescriptor(), double[].class);
                if (single != null && single.length > 0) {
                    embeddings.add(single);
                }
            } catch (Exception e) {
                log.warn("[FaceCache] Failed to parse faceDescriptor for user '{}': {}", user.getUserId(), e.getMessage());
            }
        }

        return embeddings.isEmpty() ? null : embeddings.toArray(new double[0][]);
    }

    private double euclideanDistance(double[] d1, double[] d2) {
        if (d1 == null || d2 == null || d1.length != d2.length) return Double.MAX_VALUE;
        double sum = 0;
        for (int i = 0; i < d1.length; i++) {
            double diff = d1[i] - d2[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }
}
