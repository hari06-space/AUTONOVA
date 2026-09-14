package com.autonoma.erp.model.purchase.grn;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "PP_GOODS_RECEIPT_ATTACHMENT")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"goodsReceiptHead"})
@ToString(exclude = {"goodsReceiptHead"})
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptAttachment extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GOODS_RECEIPT_HEAD_ID", nullable = false)
    private GoodsReceiptHead goodsReceiptHead;

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
