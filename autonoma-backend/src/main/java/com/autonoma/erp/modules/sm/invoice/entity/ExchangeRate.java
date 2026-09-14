package com.autonoma.erp.modules.sm.invoice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@Table(name = "EXCHANGE_RATE", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"FROM_CURRENCY", "TO_CURRENCY", "RATE_DATE"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "FROM_CURRENCY", nullable = false, length = 15)
    private String fromCurrency;

    @Column(name = "TO_CURRENCY", nullable = false, length = 15)
    private String toCurrency;

    @Column(name = "RATE", nullable = false, precision = 18, scale = 6)
    private BigDecimal rate;

    @Column(name = "RATE_DATE", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date rateDate;

    @Column(name = "SOURCE", length = 100)
    private String source;
}
