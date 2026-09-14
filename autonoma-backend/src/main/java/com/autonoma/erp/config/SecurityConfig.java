package com.autonoma.erp.config;

import com.autonoma.erp.util.AESUtil;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public TenantContextFilter tenantContextFilter() {
        return new TenantContextFilter();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder(12);

            @Override
            public String encode(CharSequence rawPassword) {
                return bcrypt.encode(rawPassword);
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (encodedPassword == null) {
                    return false;
                }
                // Check if it's a BCrypt hash
                if (encodedPassword.startsWith("$2a$") || encodedPassword.startsWith("$2b$")
                        || encodedPassword.startsWith("$2y$")) {
                    return bcrypt.matches(rawPassword, encodedPassword);
                }
                // Fallback to legacy AES decryption match
                try {
                    String decrypted = AESUtil.decrypt(encodedPassword);
                    return rawPassword.toString().equals(decrypted);
                } catch (Exception e) {
                    return false;
                }
            }
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        System.out.println("=================================================");
        System.out.println("  SECURITY CONFIG FILTER CHAIN HARDENED  ");
        System.out.println("=================================================");
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/candidate/**",
                                "/api/account/login",
                                "/api/account/check-credentials",
                                "/api/account/verify-company-code",
                                "/api/account/verify-client-code",
                                "/api/account/company-by-code/**",
                                "/api/account/client-by-code/**",
                                "/api/account/face-login",
                                "/api/health",
                                "/api/account/license-status",
                                "/api/company-profile/all",
                                "/api/company-profile/image/**",
                                "/api/company-profile/image",
                                "/api/users/image/**",
                                "/api/users/image",
                                "/api/files/**",
                                "/api/document-search/document/*/view",
                                "/api/hra/applicants/portal/**",
                                "/api/hra/applicants/verification/**",
                                "/api/qms/audit/external/**",
                                "/api/public/**",
                                "/api/ocr/notify-mutation",
                                "/api/ocr/create-customer",
                                "/api/ocr/inbox/**",
                                "/api/ocr/processing-requests/**",
                                "/api/v1/internal-licensing/**",
                                "/api/master/hr/employees/active-office-mails",
                                "/api/sm/customers",
                                "/api/sm/public-email-providers",
                                "/ws/**",
                                "/ws/signaling/**")
                        .permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            if (!response.isCommitted()) {
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                            }
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            if (!response.isCommitted()) {
                                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied");
                            }
                        }))
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(tenantContextFilter(), JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public org.springframework.boot.web.servlet.FilterRegistrationBean<TenantContextFilter> tenantContextFilterRegistration(
            TenantContextFilter filter) {
        org.springframework.boot.web.servlet.FilterRegistrationBean<TenantContextFilter> registration = new org.springframework.boot.web.servlet.FilterRegistrationBean<>(
                filter);
        registration.setEnabled(false);
        return registration;
    }
}
