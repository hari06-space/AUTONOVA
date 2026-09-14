package com.autonoma.erp.modules.hr.orgstructure.entity;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.util.Date;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "HR_DESIGNATION_LEVEL")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DesignationLevel {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "ROW_ID")
	private Long rowId;

	@Column(name = "LEVEL", columnDefinition = "NVARCHAR(10)")
	private String level;

	@Column(name = "BASIC")
	private double basic;

	@Column(name = "DA")
	private double da;

	@Column(name = "HRA")
	private double hra;

	@Column(name = "SCREENING_LEVEL")
	private int screeningLevel;

	@Column(name = "MIN_LIMIT")
	private Double minLimit;

	@Column(name = "MAX_LIMIT")
	private Double maxLimit;

	@Column(name = "LTA_LIMIT")
	private Double ltaLimit;

	@Column(name = "CREATED_BY", nullable = false, length = 50)
	private String createdBy;

	@Column(name = "CREATED_DATE")
	@Temporal(TemporalType.TIMESTAMP)
	private Date createdDate;

	@Column(name = "UPDATED_BY", length = 50)
	private String updatedBy;

	@Column(name = "UPDATED_DATE")
	@Temporal(TemporalType.TIMESTAMP)
	private Date updatedDate;

	@Column(name = "IS_ACTIVE")
	private Boolean isActive = true;

	public String getLevel() {
		return level;
	}

	public void setLevel(String level) {
		this.level = level;
	}

	public double getBasic() {
		return basic;
	}

	public void setBasic(double basic) {
		this.basic = basic;
	}

	public double getDa() {
		return da;
	}

	public void setDa(double da) {
		this.da = da;
	}

	public double getHra() {
		return hra;
	}

	public void setHra(double hra) {
		this.hra = hra;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public void setCreatedBy(String createdBy) {
		this.createdBy = createdBy;
	}

	public Date getCreatedDate() {
		return createdDate;
	}

	public void setCreatedDate(Date createdDate) {
		this.createdDate = createdDate;
	}

	public String getUpdatedBy() {
		return updatedBy;
	}

	public void setUpdatedBy(String updatedBy) {
		this.updatedBy = updatedBy;
	}

	public Date getUpdatedDate() {
		return updatedDate;
	}

	public void setUpdatedDate(Date updatedDate) {
		this.updatedDate = updatedDate;
	}

	public int getScreeningLevel() {
		return screeningLevel;
	}

	public void setScreeningLevel(int screeningLevel) {
		this.screeningLevel = screeningLevel;
	}

	public Double getMinLimit() {
		return minLimit;
	}

	public void setMinLimit(Double minLimit) {
		this.minLimit = minLimit;
	}

	public Double getMaxLimit() {
		return maxLimit;
	}

	public void setMaxLimit(Double maxLimit) {
		this.maxLimit = maxLimit;
	}

	public Double getLtaLimit() {
		return ltaLimit;
	}

	public void setLtaLimit(Double ltaLimit) {
		this.ltaLimit = ltaLimit;
	}

	public Long getRowId() {
		return rowId;
	}

	public void setRowId(Long rowId) {
		this.rowId = rowId;
	}

	@PrePersist
	protected void onCreate() {
		String currentUserId = null;
		try {
			currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
		} catch (Exception e) {
		}
		if (currentUserId != null && !currentUserId.trim().isEmpty()) {
			this.createdBy = currentUserId;
		} else if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
			this.createdBy = "System";
		}
		this.updatedBy = null;
		createdDate = new Date();
	}

	@PreUpdate
	protected void onUpdate() {
		String currentUserId = null;
		try {
			currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
		} catch (Exception e) {
		}
		if (currentUserId != null && !currentUserId.trim().isEmpty()) {
			this.updatedBy = currentUserId;
		} else {
			this.updatedBy = "System";
		}
		if (this.createdBy == null || this.createdBy.trim().isEmpty()) {
			this.createdBy = "System";
		}
		updatedDate = new Date();
	}

	public Boolean getIsActive() { return isActive; }
	public void setIsActive(Boolean isActive) { this.isActive = isActive; }
	public Long getId() { return rowId; }
	public void setId(Long id) { this.rowId = id; }
}
