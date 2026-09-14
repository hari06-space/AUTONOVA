package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "PP_RFQ_ACTIVITY")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RfqActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RFQ_REF_ID", nullable = false)
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private RfqHead rfqHead;

    @Column(name = "ACTIVITY_TYPE", length = 100, nullable = false)
    private String activityType;

    @Column(name = "DESCRIPTION", length = 500, nullable = false)
    private String description;

    @Column(name = "ACTOR_ID", length = 50, nullable = false)
    private String actorId;

    @Column(name = "ACTIVITY_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date activityDate;
}
