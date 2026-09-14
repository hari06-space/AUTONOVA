package com.autonoma.erp.security.license;

import java.time.LocalDate;

public record LicensePayload(String clientCode, String productCode, LocalDate expiryDate) {
}
