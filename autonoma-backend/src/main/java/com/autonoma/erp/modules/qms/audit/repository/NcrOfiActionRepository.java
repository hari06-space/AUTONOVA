package com.autonoma.erp.modules.qms.audit.repository;

import com.autonoma.erp.modules.qms.audit.entity.NcrOfiAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NcrOfiActionRepository extends JpaRepository<NcrOfiAction, Integer> {
    List<NcrOfiAction> findByNcrOfiId(Integer ncrOfiId);
}
