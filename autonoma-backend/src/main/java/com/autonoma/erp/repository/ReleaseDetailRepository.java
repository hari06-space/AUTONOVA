package com.autonoma.erp.repository;

import com.autonoma.erp.model.ReleaseDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReleaseDetailRepository extends JpaRepository<ReleaseDetail, Long> {
    List<ReleaseDetail> findByReleaseMasterIdOrderByDisplayOrderAscIdAsc(Long releaseId);
}
