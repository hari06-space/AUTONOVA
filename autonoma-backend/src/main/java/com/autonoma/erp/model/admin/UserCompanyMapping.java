package com.autonoma.erp.model.admin;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_USER_COMPANY_MAPPING")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCompanyMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private String userId;

    @Column(name = "COMPANY_ID", nullable = false)
    private Long companyId;

    public String getUserId() { return userId; }
    public Long getCompanyId() { return companyId; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
}
