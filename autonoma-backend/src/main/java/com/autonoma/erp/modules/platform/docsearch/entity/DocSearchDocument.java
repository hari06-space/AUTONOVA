/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: Entity representing document search metadata and queue tracking.
 */
package com.autonoma.erp.modules.platform.docsearch.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "DOC_SEARCH_DOCUMENT")
@Data
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocSearchDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "MODULE_CODE", nullable = false, length = 50)
    private String moduleCode;

    @Column(name = "PAGE_CODE", length = 50)
    private String pageCode;

    @Column(name = "SOURCE_TABLE", nullable = false, length = 100)
    private String sourceTable;

    @Column(name = "SOURCE_PK_VALUE", nullable = false, length = 100)
    private String sourcePkValue;

    @Column(name = "REF_ID", length = 100)
    private String refId;

    @Column(name = "FILE_NAME", nullable = false, length = 255)
    private String fileName;

    @Column(name = "FILE_TYPE", nullable = false, length = 50)
    private String fileType;

    @Column(name = "STORAGE_PATH", nullable = false, length = 1000)
    private String storagePath;

    @Column(name = "FILE_HASH", nullable = false, length = 64)
    private String fileHash;

    @Column(name = "FILE_SIZE")
    private Long fileSize;

    @Column(name = "TOTAL_PAGES")
    private Integer totalPages;

    @Column(name = "INDEX_STATUS", nullable = false, length = 50)
    private String indexStatus; // PENDING, PROCESSING, INDEXED, FAILED

    @Column(name = "INDEX_ATTEMPTS")
    private Integer indexAttempts;

    @Column(name = "LAST_ATTEMPT_DATE")
    private LocalDateTime lastAttemptDate;

    @Column(name = "INDEX_ERROR", columnDefinition = "NVARCHAR(MAX)")
    private String indexError;

    @Column(name = "CREATED_DATE")
    private LocalDateTime createdDate;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;

    @Column(name = "MODIFIED_DATE")
    private LocalDateTime modifiedDate;

    @Column(name = "MODIFIED_BY", length = 50)
    private String modifiedBy;

    @PrePersist
    public void prePersist() {
        if (this.createdDate == null) {
            this.createdDate = LocalDateTime.now();
        }
        if (this.modifiedDate == null) {
            this.modifiedDate = LocalDateTime.now();
        }
        if (this.indexStatus == null) {
            this.indexStatus = "PENDING";
        }
        if (this.indexAttempts == null) {
            this.indexAttempts = 0;
        }
        if (this.totalPages == null) {
            this.totalPages = 1;
        }
        if (this.createdBy == null) {
            this.createdBy = "SYSTEM";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.modifiedDate = LocalDateTime.now();
    }
}
