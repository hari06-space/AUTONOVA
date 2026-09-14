package com.nutech.email.config;

import com.nutech.email.model.Customer;
import com.nutech.email.model.MasterPart;
import com.nutech.email.repository.CustomerRepository;
import com.nutech.email.repository.MasterPartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Slf4j
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final MasterPartRepository masterPartRepository;
    private final CustomerRepository customerRepository;

    @Override
    public void run(String... args) {
        if (masterPartRepository.count() == 0) {
            log.info("Seeding master parts...");
            masterPartRepository.save(MasterPart.builder()
                    .partCode("ABC-1234").partName("Steel Bolt M8")
                    .description("High-tensile steel bolt, 50mm").category("Fasteners")
                    .unitPrice(new BigDecimal("15.00")).uom("NOS").hsnCode("7318")
                    .gstRate(new BigDecimal("18.00")).leadTimeDays(3).build());
            masterPartRepository.save(MasterPart.builder()
                    .partCode("XYZ-9876").partName("Gasket Seal 4\"")
                    .description("Industrial grade rubber gasket").category("Seals")
                    .unitPrice(new BigDecimal("120.00")).uom("NOS").hsnCode("4016")
                    .gstRate(new BigDecimal("18.00")).leadTimeDays(5).build());
            masterPartRepository.save(MasterPart.builder()
                    .partCode("BRG-6205").partName("Ball Bearing 6205")
                    .description("Deep groove ball bearing, 25x52x15mm").category("Bearings")
                    .unitPrice(new BigDecimal("250.00")).uom("NOS").hsnCode("8482")
                    .gstRate(new BigDecimal("18.00")).leadTimeDays(7).build());
            masterPartRepository.save(MasterPart.builder()
                    .partCode("FLG-200").partName("Flange Coupling 200mm")
                    .description("Carbon steel flange coupling").category("Couplings")
                    .unitPrice(new BigDecimal("1500.00")).uom("NOS").hsnCode("7307")
                    .gstRate(new BigDecimal("18.00")).leadTimeDays(10).build());
            masterPartRepository.save(MasterPart.builder()
                    .partCode("NUT-M12").partName("Hex Nut M12")
                    .description("Stainless steel hex nut").category("Fasteners")
                    .unitPrice(new BigDecimal("8.50")).uom("NOS").hsnCode("7318")
                    .gstRate(new BigDecimal("18.00")).leadTimeDays(2).build());
            log.info("Seeded 5 master parts");
        }

        if (customerRepository.count() == 0) {
            log.info("Seeding customers...");
            customerRepository.save(Customer.builder()
                    .name("Rajesh Kumar").email("rajesh@globaltech.in")
                    .companyName("Global Tech Industries").phone("+91 98765 43210")
                    .city("Chennai").state("Tamil Nadu").gstNumber("33AABCU9603R1ZM").build());
            customerRepository.save(Customer.builder()
                    .name("Priya Sharma").email("priya@precisioneng.com")
                    .companyName("Precision Engineering Pvt Ltd").phone("+91 87654 32109")
                    .city("Bangalore").state("Karnataka").gstNumber("29AADCP1234R1Z5").build());
            log.info("Seeded 2 customers");
        }
    }
}
