package com.autonoma.erp.modules.sm.sales.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "SALES_ATTACHMENTS_PATH")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesAttachmentPath extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PAGE_CODE", length = 100, nullable = false)
    private String pageCode;

    @Column(name = "REF_ID", nullable = false)
    private Long refId;

    @Column(name = "DOC_TYPE", length = 50)
    private String docType;

    @Column(name = "PATH", length = 500, nullable = false)
    private String path;

    @Column(name = "FILE_NAME", length = 255, nullable = false)
    private String fileName;

    @PrePersist
    protected void onSalesAttachmentCreate() {
        if (this.getUpdatedDate() == null) {
            this.setUpdatedDate(this.getCreatedDate());
        }
        if (this.getUpdatedUser() == null) {
            this.setUpdatedUser(this.getCreatedUser());
        }
    }
}
