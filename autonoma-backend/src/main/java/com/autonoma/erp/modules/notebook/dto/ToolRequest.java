package com.autonoma.erp.modules.notebook.dto;

import java.util.Map;

public record ToolRequest(
    String query,
    String intent,
    String targetEntity,
    OperationType operation,
    Map<String, Object> parameters,
    AiPermissionContext permissionContext
) {}
