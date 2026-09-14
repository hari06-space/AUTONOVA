package com.autonoma.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "ERP_RELEASE_DETAILS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReleaseDetail extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DETAIL_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RELEASE_ID", nullable = false)
    @JsonIgnore
    private ReleaseMaster releaseMaster;

    @Column(name = "CATEGORY", nullable = false, length = 100)
    private String category;

    @Column(name = "TITLE", nullable = false, length = 255)
    private String title;

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "MEDIA_TYPE", length = 50)
    private String mediaType;

    @Column(name = "MEDIA_URL", length = 2000)
    private String mediaUrl;

    @Column(name = "BEFORE_MEDIA_URL", length = 2000)
    private String beforeMediaUrl;

    @Column(name = "AFTER_MEDIA_URL", length = 2000)
    private String afterMediaUrl;

    @Column(name = "DOC_URL", length = 2000)
    private String docUrl;

    @Column(name = "DISPLAY_ORDER")
    private Integer displayOrder = 0;

    public void setReleaseMaster(ReleaseMaster releaseMaster) { this.releaseMaster = releaseMaster; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public void setDescription(String description) { this.description = description; }
    public void setCategory(String category) { this.category = category; }
    public Long getId() { return id; }
    public String getCategory() { return category; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public String getMediaType() { return mediaType; }
    public String getMediaUrl() { return mediaUrl; }
    public String getBeforeMediaUrl() { return beforeMediaUrl; }
    public String getAfterMediaUrl() { return afterMediaUrl; }
    public String getDocUrl() { return docUrl; }
    public Integer getDisplayOrder() { return displayOrder; }
}
