package com.autonoma.erp.modules.master.admin.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "MST_UOM")
@Getter
@Setter
public class MstUom extends BaseAuditEntity {

    @Id
    @Column(name = "UOM_CODE", nullable = false, unique = true, length = 50)
    private String uomCode; // e.g. KW, MW

    @Column(name = "UOM_DESCRIPTION", length = 255)
    private String uomDescription;

    @Column(name = "STATUS", nullable = false, length = 20)
    private String status = "ACTIVE";

    public String getUomCode() {
        return uomCode;
    }

    public void setUomCode(String uomCode) {
        this.uomCode = uomCode;
    }

    public String getUomDescription() {
        return uomDescription;
    }

    public void setUomDescription(String uomDescription) {
        this.uomDescription = uomDescription;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }


}
