package com.autonoma.erp.modules.platform.files.repository;

import com.autonoma.erp.modules.platform.files.entity.FileTraceabilityManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FileTraceabilityManagementRepository extends JpaRepository<FileTraceabilityManagement, Integer> {
    List<FileTraceabilityManagement> findAllByOrderByCreatedAtDesc();
}

