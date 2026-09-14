package com.autonoma.erp.modules.platform.identity.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.UnknownHostException;

@Service
public class DnsResolverService {

    private static final Logger log = LoggerFactory.getLogger(DnsResolverService.class);

    /**
     * Resolves a domain hostname to its target IP address using DNS lookup.
     * Automatically attempts fallback domain if primary resolution fails.
     */
    public String resolveDomainToIp(String primaryDomain, String fallbackDomain) {
        if (primaryDomain == null || primaryDomain.trim().isEmpty()) {
            return null;
        }

        String cleanPrimary = cleanDomainHost(primaryDomain);
        
        // If host is already an IP address (IPv4 or IPv6), return directly without DNS lookup
        if (isIpAddress(cleanPrimary)) {
            log.info("[DNS-Resolver] Direct IP Address detected: '{}'. Using directly.", cleanPrimary);
            return cleanPrimary;
        }

        try {
            log.info("[DNS-Resolver] Resolving primary domain host via DNS: '{}'", cleanPrimary);
            InetAddress address = InetAddress.getByName(cleanPrimary);
            String resolvedIp = address.getHostAddress();
            log.info("[DNS-Resolver] Primary DNS Resolved '{}' -> IP '{}'", cleanPrimary, resolvedIp);
            return resolvedIp;
        } catch (UnknownHostException e) {
            log.warn("[DNS-Resolver] Primary DNS resolution failed for '{}': {}", cleanPrimary, e.getMessage());
            
            if (fallbackDomain != null && !fallbackDomain.trim().isEmpty()) {
                String cleanFallback = cleanDomainHost(fallbackDomain);
                if (isIpAddress(cleanFallback)) {
                    log.info("[DNS-Resolver] Fallback Direct IP Address detected: '{}'.", cleanFallback);
                    return cleanFallback;
                }
                try {
                    log.info("[DNS-Resolver] Attempting DNS resolution for fallback domain: '{}'", cleanFallback);
                    InetAddress fallbackAddress = InetAddress.getByName(cleanFallback);
                    String fallbackIp = fallbackAddress.getHostAddress();
                    log.info("[DNS-Resolver] Fallback DNS Resolved '{}' -> IP '{}'", cleanFallback, fallbackIp);
                    return fallbackIp;
                } catch (UnknownHostException ex) {
                    log.error("[DNS-Resolver] Fallback DNS resolution also failed for '{}': {}", cleanFallback, ex.getMessage());
                }
            }
        }
        return null;
    }

    /**
     * Replaces domain hostname in JDBC connection URL with resolved IP address.
     */
    public String getResolvedJdbcUrl(String jdbcUrl, String primaryDomain, String fallbackDomain) {
        if (jdbcUrl == null || jdbcUrl.trim().isEmpty()) {
            return jdbcUrl;
        }

        String targetDomain = primaryDomain;
        String resolvedIp = resolveDomainToIp(primaryDomain, fallbackDomain);

        if (resolvedIp != null && targetDomain != null && !targetDomain.trim().isEmpty()) {
            String cleanHost = cleanDomainHost(targetDomain);
            if (jdbcUrl.contains(cleanHost)) {
                String resolvedUrl = jdbcUrl.replace(cleanHost, resolvedIp);
                log.info("[DNS-Resolver] Dynamic JDBC URL resolved successfully: {}", maskJdbcUrl(resolvedUrl));
                return resolvedUrl;
            }
        }

        log.warn("[DNS-Resolver] DNS resolution unavailable. Proceeding with raw JDBC URL: {}", maskJdbcUrl(jdbcUrl));
        return jdbcUrl;
    }

    private String cleanDomainHost(String rawDomain) {
        String host = rawDomain.trim();
        if (host.startsWith("http://")) host = host.substring(7);
        if (host.startsWith("https://")) host = host.substring(8);
        int colonIdx = host.indexOf(':');
        if (colonIdx != -1) host = host.substring(0, colonIdx);
        int slashIdx = host.indexOf('/');
        if (slashIdx != -1) host = host.substring(0, slashIdx);
        return host;
    }

    private boolean isIpAddress(String host) {
        if (host == null || host.isEmpty()) return false;
        // Regex pattern to check IPv4 format (e.g. 192.168.1.1 or 203.0.113.50)
        String ipv4Pattern = "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$";
        return host.matches(ipv4Pattern) || host.contains(":");
    }

    private String maskJdbcUrl(String url) {
        if (url == null) return null;
        return url.replaceAll("password=[^;]*", "password=*****");
    }
}
