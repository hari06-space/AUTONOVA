package com.autonoma.erp.model;

import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "VENDOR_SATISFACTION_REMINDER_LOG")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class VendorSatisfactionReminderLog extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VENDOR_ID", nullable = false)
    private AccountLedger vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MAPPING_ID", nullable = false)
    private VendorSatisfactionMapping mapping;

    @Column(name = "REMINDER_NUMBER", nullable = false)
    private Integer reminderNumber;

    @Column(name = "REMINDER_DATE", nullable = false)
    private LocalDate reminderDate;

    @Column(name = "EMAIL_STATUS", nullable = false, length = 50)
    private String emailStatus; // Sent, Failed

    public AccountLedger getVendor() { return vendor; }
    public void setVendor(AccountLedger vendor) { this.vendor = vendor; }
    public void setMapping(VendorSatisfactionMapping mapping) { this.mapping = mapping; }
    public void setReminderNumber(Integer reminderNumber) { this.reminderNumber = reminderNumber; }
    public void setReminderDate(LocalDate reminderDate) { this.reminderDate = reminderDate; }
    public void setEmailStatus(String emailStatus) { this.emailStatus = emailStatus; }
}
