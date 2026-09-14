package com.autonoma.erp.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/**
 * CacheConfig — in-memory Caffeine cache for static/rarely-changing data.
 *
 * Why: Every page navigation triggers multiple DB calls for data that almost
 * never changes (designations, departments, company config, BOS pages).
 * Caching these eliminates the most repetitive DB round-trips.
 *
 * Cache names must match the value in @Cacheable("name") annotations.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(Arrays.asList(

            // Designations — almost never change during a workday
            buildCache("designations", 5, 500),

            // Departments — rarely change
            buildCache("departments", 5, 200),

            // User page permissions — per user, moderate churn
            buildCache("userPermissions", 2, 1000),

            // Company credentials / profile
            buildCache("companyCredentials", 10, 50),

            // BOS page definitions
            buildCache("bosPages", 10, 200),

            // Holiday list — changes at most annually
            buildCache("holidays", 60, 100),

            // Employee satisfaction pending check result per user (short TTL)
            buildCache("satisfactionCheck", 5, 500),

            // User column preferences
            buildCache("columnPreferences", 10, 500),

            // Generic master data lookup cache
            buildCache("masterCache", 60, 2000)
        ));
        return manager;
    }

    /**
     * Build a Caffeine cache with expireAfterWrite TTL and max size.
     *
     * @param name        cache name (matches @Cacheable value)
     * @param ttlMinutes  time-to-live in minutes after last write
     * @param maxSize     maximum number of entries
     */
    private CaffeineCache buildCache(String name, int ttlMinutes, int maxSize) {
        return new CaffeineCache(name,
            Caffeine.newBuilder()
                .expireAfterWrite(ttlMinutes, TimeUnit.MINUTES)
                .maximumSize(maxSize)
                .recordStats()           // enables cache hit/miss metrics via /actuator
                .build()
        );
    }
}
