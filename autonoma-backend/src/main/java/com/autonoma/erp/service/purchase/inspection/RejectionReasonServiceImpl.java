package com.autonoma.erp.service.purchase.inspection;

import com.autonoma.erp.model.purchase.inspection.RejectionReason;
import com.autonoma.erp.repository.purchase.inspection.RejectionReasonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RejectionReasonServiceImpl implements RejectionReasonService {

    @Autowired
    private RejectionReasonRepository repository;

    @Override
    public List<RejectionReason> getAllActiveReasons() {
        return repository.findByStatusTrue();
    }

    @Override
    @Transactional
    public RejectionReason createReason(String reason, String userId) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection reason cannot be empty");
        }
        
        String trimmedReason = reason.trim();
        
        java.util.Optional<RejectionReason> existing = repository.findFirstByRejectionReasonIgnoreCase(trimmedReason);
        if (existing.isPresent()) {
            return existing.get();
        }

        RejectionReason newReason = new RejectionReason();
        newReason.setRejectionReason(trimmedReason);
        newReason.setStatus(true);
        newReason.setCreatedBy(userId);
        
        return repository.save(newReason);
    }
}
