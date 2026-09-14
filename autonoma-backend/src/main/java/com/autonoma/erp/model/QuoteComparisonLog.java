package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "PP_QUOTE_COMPARISON_LOG")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
public class QuoteComparisonLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "COMPARISON_HEAD_ID", nullable = false)
    private QuoteComparisonHead comparisonHead;

    @Column(name = "EVENT_TYPE", nullable = false, length = 50)
    private String eventType;

    @Column(name = "EVENT_DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String eventDescription;

    @Column(name = "OLD_VALUE", columnDefinition = "NVARCHAR(MAX)")
    private String oldValue;

    @Column(name = "NEW_VALUE", columnDefinition = "NVARCHAR(MAX)")
    private String newValue;

    @Column(name = "USER_ID")
    private String userId;

    @Column(name = "EVENT_DATE", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date eventDate = new Date();

    @Column(name = "IP_ADDRESS", length = 50)
    private String ipAddress;

    @Column(name = "SESSION_ID", length = 100)
    private String sessionId;

    @Column(name = "MESSAGE", length = 1000)
    private String message;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;

}
