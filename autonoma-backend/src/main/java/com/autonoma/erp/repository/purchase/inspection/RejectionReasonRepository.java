package com.autonoma.erp.repository.purchase.inspection;

import com.autonoma.erp.model.purchase.inspection.RejectionReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RejectionReasonRepository extends JpaRepository<RejectionReason, Long> {
    List<RejectionReason> findByStatusTrue();
    boolean existsByRejectionReasonIgnoreCase(String rejectionReason);
    java.util.Optional<RejectionReason> findFirstByRejectionReasonIgnoreCase(String rejectionReason);
}
