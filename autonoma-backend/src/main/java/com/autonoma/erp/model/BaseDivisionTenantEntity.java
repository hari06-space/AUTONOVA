package com.autonoma.erp.model;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@MappedSuperclass
@Getter
@Setter
@FilterDef(name = "divisionFilter", parameters = @ParamDef(name = "activeDivisionId", type = Long.class))
@Filter(name = "divisionFilter", condition = "division_id = :activeDivisionId")
public abstract class BaseDivisionTenantEntity {

    @Column(name = "division_id", nullable = false, updatable = false)
    private Long divisionId;
}
