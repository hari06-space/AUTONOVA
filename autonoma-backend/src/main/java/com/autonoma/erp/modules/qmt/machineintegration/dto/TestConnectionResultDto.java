package com.autonoma.erp.modules.qmt.machineintegration.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TestConnectionResultDto {
    private boolean success;
    private String message;
}
