package com.autonoma.erp.model.admin;

import com.autonoma.erp.util.SecurityUtils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "AD_BACKEND_ERROR_LOG")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackendErrorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "module_name")
    private String moduleName;

    @Column(name = "api_endpoint")
    private String apiEndpoint;

    @Column(name = "exception_type")
    private String exceptionType;

    @Column(name = "error_message", columnDefinition = "NVARCHAR(MAX)")
    private String errorMessage;

    @Column(name = "error_stack", columnDefinition = "NVARCHAR(MAX)")
    private String errorStack;

    @Column(name = "username")
    private String username;

    @Column(name = "timestamp")
    @Temporal(TemporalType.TIMESTAMP)
    private Date timestamp;

    @Column(name = "sql_table_name")
    private String sqlTableName;

    @Column(name = "sql_field_name")
    private String sqlFieldName;

    @Column(name = "http_method")
    private String httpMethod;

    @Column(name = "request_path")
    private String requestPath;

    @Column(name = "server_response_status")
    private Integer serverResponseStatus;

    @PrePersist
    protected void onCreate() {
        String currentUserId = null;
        try {
            currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
        }

        if (timestamp == null) {
            timestamp = new Date();
        }
    }
}
