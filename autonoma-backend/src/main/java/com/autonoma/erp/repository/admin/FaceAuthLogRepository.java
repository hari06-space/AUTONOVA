package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.FaceAuthLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FaceAuthLogRepository extends JpaRepository<FaceAuthLog, Long> {
}
