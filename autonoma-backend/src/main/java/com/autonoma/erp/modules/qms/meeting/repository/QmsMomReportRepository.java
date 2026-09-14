package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMomReportHd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface QmsMomReportRepository extends JpaRepository<QmsMomReportHd, Long>, JpaSpecificationExecutor<QmsMomReportHd> {
}
