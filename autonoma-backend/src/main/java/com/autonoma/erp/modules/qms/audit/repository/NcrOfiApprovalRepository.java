package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.NcrOfiApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NcrOfiApprovalRepository extends JpaRepository<NcrOfiApproval, Integer> {
    List<NcrOfiApproval> findByNcrOfiId(Integer ncrOfiId);
}
