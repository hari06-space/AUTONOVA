package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "ERP_RELEASE_MASTER")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReleaseMaster extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RELEASE_ID")
    private Long id;

    @Column(name = "VERSION_NO", nullable = false, unique = true, length = 50)
    private String versionNo;

    @Column(name = "RELEASE_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date releaseDate;

    @Column(name = "TITLE", nullable = false, length = 255)
    private String title;

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "IS_ACTIVE", nullable = false)
    private Boolean isActive = true;

    @Column(name = "IS_CRITICAL", nullable = false)
    private Boolean isCritical = false;

    @OneToMany(mappedBy = "releaseMaster", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC, id ASC")
    private List<ReleaseDetail> details;

    public Long getId() { return id; }
    public List<ReleaseDetail> getDetails() { return details; }
    public Date getReleaseDate() { return releaseDate; }
}
