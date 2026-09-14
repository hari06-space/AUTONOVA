package com.autonoma.erp.model.purchase.gateentry;

import com.autonoma.erp.model.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "PP_GATE_ENTRY_VISITOR")
@Data
@EqualsAndHashCode(callSuper = true, exclude = {"gateEntryHead"})
@NoArgsConstructor
@AllArgsConstructor
public class GateEntryVisitor extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GATE_ENTRY_HEAD_ID", nullable = false)
    private GateEntryHead gateEntryHead;

    @Column(name = "VEHICLE_NO", nullable = false, length = 50)
    private String vehicleNo;

    @Column(name = "VEHICLE_TYPE", length = 50)
    private String vehicleType;

    @Column(name = "TRUCK_SIZE", length = 50)
    private String truckSize;

    @Column(name = "TRAILER_NO", length = 50)
    private String trailerNo;

    @Column(name = "CONTAINER_NO", length = 100)
    private String containerNo;

    @Column(name = "SEAL_NO", length = 100)
    private String sealNo;

    @Column(name = "SEAL_CONDITION", length = 50)
    private String sealCondition;

    @Column(name = "PARKING_LOCATION", length = 100)
    private String parkingLocation;

    @Column(name = "GROSS_WEIGHT", precision = 18, scale = 4)
    private BigDecimal grossWeight;

    @Column(name = "TARE_WEIGHT", precision = 18, scale = 4)
    private BigDecimal tareWeight;

    @Column(name = "NET_WEIGHT", precision = 18, scale = 4)
    private BigDecimal netWeight;

    @Column(name = "WEIGHBRIDGE_SLIP_NO", length = 100)
    private String weighbridgeSlipNo;

    @Column(name = "DRIVER_NAME", nullable = false, length = 100)
    private String driverName;

    @Column(name = "DRIVER_MOBILE", nullable = false, length = 20)
    private String driverMobile;

    @Column(name = "DRIVER_LICENSE_NO", length = 50)
    private String driverLicenseNo;

    @Column(name = "LICENSE_EXPIRY")
    private LocalDate licenseExpiry;

    @Column(name = "HELPER_NAME", length = 100)
    private String helperName;

    @Column(name = "TRANSPORT_COMPANY", length = 100)
    private String transportCompany;

    @Column(name = "EMERGENCY_CONTACT", length = 20)
    private String emergencyContact;

    @Column(name = "ACTIVE_STATUS", nullable = false)
    private Integer activeStatus = 1;
}
