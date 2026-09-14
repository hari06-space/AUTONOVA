package com.autonoma.erp.model.purchase.gateentry;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "PP_GATE_ENTRY_ATTACHMENT")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"gateEntryHead"})
@NoArgsConstructor
@AllArgsConstructor
public class GateEntryAttachment extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GATE_ENTRY_HEAD_ID", nullable = false)
    private GateEntryHead gateEntryHead;

    @Column(name = "FILE_NAME", nullable = false, length = 255)
    private String fileName;

    @Column(name = "FILE_PATH", nullable = false, length = 1000)
    private String filePath;

    @Column(name = "FILE_SIZE")
    private Long fileSize;

    @Column(name = "MIME_TYPE", length = 100)
    private String mimeType;

    @Column(name = "ATTACHMENT_TYPE", length = 50)
    private String attachmentType;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;
}
