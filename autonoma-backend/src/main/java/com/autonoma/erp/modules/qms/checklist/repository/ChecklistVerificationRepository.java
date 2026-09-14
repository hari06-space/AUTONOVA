package com.autonoma.erp.modules.qms.checklist.repository;

import com.autonoma.erp.modules.qms.checklist.entity.ChecklistAssignment;
import com.autonoma.erp.modules.qms.checklist.entity.ChecklistVerification;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Stub repository – ChecklistVerification is no longer a JPA entity.
 * Verification data is persisted directly inside the QMS_CHECKLIST_CLOSED_* frequency tables.
 * All methods are intentional no-ops kept for source-level compatibility.
 */
@Component
public class ChecklistVerificationRepository {

    /** No-op: verification is now stored in frequency closed tables. */
    public void deleteByAssignment(ChecklistAssignment assignment) {
        // no-op – deprecated
    }

    /** No-op: verification is now stored in frequency closed tables. */
    public List<ChecklistVerification> saveAll(List<ChecklistVerification> verifications) {
        // no-op – deprecated
        return verifications;
    }

    /** No-op stub. */
    public ChecklistVerification save(ChecklistVerification verification) {
        // no-op – deprecated
        return verification;
    }
}
