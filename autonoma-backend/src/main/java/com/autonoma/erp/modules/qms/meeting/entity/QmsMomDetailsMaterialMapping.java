package com.autonoma.erp.modules.qms.meeting.entity;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "QMS_MOM_DETAILS_MATERIAL_MAPPING")
public class QmsMomDetailsMaterialMapping extends BaseAuditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "MOM_DETAIL_ID", insertable = false, updatable = false)
    private Long momDetailId;

    @Column(name = "MATERIAL_ID", length = 500)
    private String materialId;

    public String getMaterialId() {
        return materialId;
    }

    public void setMaterialId(String materialId) {
        this.materialId = materialId;
    }

    public Long getMomDetailId() {
        return momDetailId;
    }

    public void setMomDetailId(Long momDetailId) {
        this.momDetailId = momDetailId;
    }
}
