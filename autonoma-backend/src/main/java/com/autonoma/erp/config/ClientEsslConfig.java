package com.autonoma.erp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "essl.datasource")
@Data
public class ClientEsslConfig {
    private String url;
    private String username;
    private String password;
}
