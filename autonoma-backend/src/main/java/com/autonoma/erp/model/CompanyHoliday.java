package com.autonoma.erp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "COMPANY_HOLIDAYS")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyHoliday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "HOLIDAY_DATE", nullable = false, unique = true)
    private LocalDate holidayDate;

    @Column(name = "DESCRIPTION")
    private String description;

    @Column(name = "CREATED_BY", nullable = false)
    private String createdBy = "System";

    @Column(name = "CREATED_DATE", nullable = false)
    private java.util.Date createdDate = new java.util.Date();

    @Column(name = "UPDATED_BY")
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private java.util.Date updatedDate;
}
