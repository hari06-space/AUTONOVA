package com.autonoma.erp.modules.platform.epm.controller;

import com.autonoma.erp.modules.platform.epm.dto.EpmDashboardResponse;
import com.autonoma.erp.modules.platform.epm.entity.EpmEmployeeScoreSummary;
import com.autonoma.erp.modules.platform.epm.entity.EpmScoreTransaction;
import com.autonoma.erp.modules.platform.epm.repository.EpmEmployeeScoreSummaryRepository;
import com.autonoma.erp.modules.platform.epm.repository.EpmScoreTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/epm")
public class EpmDashboardController {

    private final EpmEmployeeScoreSummaryRepository summaryRepository;
    private final EpmScoreTransactionRepository transactionRepository;
    private final com.autonoma.erp.repository.admin.UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public EpmDashboardController(
            EpmEmployeeScoreSummaryRepository summaryRepository,
            EpmScoreTransactionRepository transactionRepository,
            com.autonoma.erp.repository.admin.UserRepository userRepository) {
        this.summaryRepository = summaryRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/me/dashboard")
    public ResponseEntity<EpmDashboardResponse> getMyDashboard() {
        String currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(401).build();
        }

        com.autonoma.erp.model.admin.UserCredential user = userRepository.findByUserId(currentUserId).orElse(null);
        Long empId = (user != null && user.getEmpId() != null) ? user.getEmpId() : 0L;

        EpmEmployeeScoreSummary summary = summaryRepository.findByUserId(empId).orElse(null);
        List<EpmScoreTransaction> recentTransactions = transactionRepository.findByUserIdOrderByTransactionDateDesc(empId);
        
        if (recentTransactions.size() > 10) {
            recentTransactions = recentTransactions.subList(0, 10);
        }

        EpmDashboardResponse response = new EpmDashboardResponse();
        response.setSummary(summary);
        response.setRecentTransactions(recentTransactions);
        
        if (summary != null) {
            // Mocking level details for now
            response.setLevelName(getLevelName(summary.getLevelId()));
            response.setLevelIcon(getLevelIcon(summary.getLevelId()));
            response.setPointsToNextLevel(500L); // Mock
        } else {
            response.setLevelName("Beginner");
            response.setLevelIcon("IconStar");
        }

        return ResponseEntity.ok(response);
    }

    private String getLevelName(Long levelId) {
        if (levelId == null) return "Beginner";
        switch (levelId.intValue()) {
            case 1: return "Beginner";
            case 2: return "Contributor";
            case 3: return "Performer";
            case 4: return "Expert";
            case 5: return "Champion";
            default: return "Beginner";
        }
    }

    private String getLevelIcon(Long levelId) {
        if (levelId == null) return "IconStar";
        switch (levelId.intValue()) {
            case 1: return "IconStar";
            case 2: return "IconTrendingUp";
            case 3: return "IconRocket";
            case 4: return "IconDiamond";
            case 5: return "IconCrown";
            default: return "IconStar";
        }
    }
}
