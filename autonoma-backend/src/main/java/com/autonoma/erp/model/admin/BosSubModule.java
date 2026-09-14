package com.autonoma.erp.model.admin;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "BOS_SUB_MODULES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class BosSubModule {

    @Id
    @Column(name = "sub_mod_id")
    private Integer subModId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mod_id")
    private BosModule module;

    @Column(name = "sub_mod_code", columnDefinition = "NVARCHAR(10)")
    private String subModCode;

    @Column(name = "sub_mod_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String subModName;

    public Integer getSubModId() {
        return subModId;
    }

    public void setSubModId(Integer subModId) {
        this.subModId = subModId;
    }

    public BosModule getModule() {
        return module;
    }

    public void setModule(BosModule module) {
        this.module = module;
    }

    public String getSubModCode() {
        return subModCode;
    }

    public void setSubModCode(String subModCode) {
        this.subModCode = subModCode;
    }

    public String getSubModName() {
        return subModName;
    }

    public void setSubModName(String subModName) {
        this.subModName = subModName;
    }
}
