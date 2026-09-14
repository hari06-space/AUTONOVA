package com.autonoma.erp.modules.platform.files.repository;

import com.autonoma.erp.modules.platform.files.entity.FileAttachmentMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FileAttachmentMetadataRepository extends JpaRepository<FileAttachmentMetadata, Long> {
    Optional<FileAttachmentMetadata> findByStoragePath(String storagePath);
}
