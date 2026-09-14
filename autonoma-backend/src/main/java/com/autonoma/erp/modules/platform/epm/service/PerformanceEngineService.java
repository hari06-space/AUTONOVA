package com.autonoma.erp.modules.platform.epm.service;

import com.autonoma.erp.modules.platform.epm.entity.EpmEmployeeScoreSummary;
import com.autonoma.erp.modules.platform.epm.entity.EpmScoreTransaction;
import com.autonoma.erp.modules.platform.epm.repository.EpmEmployeeScoreSummaryRepository;
import com.autonoma.erp.modules.platform.epm.repository.EpmScoreTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class PerformanceEngineService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PerformanceEngineService.class);

    private final EpmScoreTransactionRepository transactionRepository;
    private final EpmEmployeeScoreSummaryRepository summaryRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public PerformanceEngineService(
            EpmScoreTransactionRepository transactionRepository,
            EpmEmployeeScoreSummaryRepository summaryRepository) {
        this.transactionRepository = transactionRepository;
        this.summaryRepository = summaryRepository;
    }

    /**
     * Records a performance transaction (adds or deducts points) and updates the employee's summary.
     * This is the core engine ledger function.
     */
    @Transactional
    public void recordTransaction(Long userId, String transactionType, String referenceId, Long ruleId, Long points, String reason) {
        log.info("EPM: Recording transaction for user {}: {} points for {}", userId, points, reason);

        // 1. Insert into immutable ledger
        EpmScoreTransaction tx = new EpmScoreTransaction();
        tx.setUserId(userId);
        tx.setTransactionType(transactionType);
        tx.setReferenceId(referenceId);
        tx.setRuleId(ruleId);
        tx.setPoints(points);
        tx.setReason(reason);
        transactionRepository.save(tx);

        // 2. Update summary table
        EpmEmployeeScoreSummary summary = summaryRepository.findByUserId(userId)
                .orElseGet(() -> {
                    EpmEmployeeScoreSummary s = new EpmEmployeeScoreSummary();
                    s.setUserId(userId);
                    s.setTotalScore(0L);
                    s.setMonthlyScore(0L);
                    s.setYearlyScore(0L);
                    return s;
                });

        summary.setTotalScore(summary.getTotalScore() + points);
        summary.setMonthlyScore(summary.getMonthlyScore() + points);
        summary.setYearlyScore(summary.getYearlyScore() + points);

        // Calculate basic leveling (just a simple example, a real system would query EpmLevelMaster)
        summary.setLevelId(calculateLevel(summary.getTotalScore()));

        summaryRepository.save(summary);
    }

    private Long calculateLevel(Long totalScore) {
        if (totalScore <= 500) return 1L; // Beginner
        if (totalScore <= 1500) return 2L; // Contributor
        if (totalScore <= 3000) return 3L; // Performer
        if (totalScore <= 6000) return 4L; // Expert
        return 5L; // Champion
    }
}
