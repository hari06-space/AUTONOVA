package com.autonoma.erp.service;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DatabaseFeatureService {
    @Autowired
    private EntityManager entityManager;

    private boolean ftsInstalled = false;

    @PostConstruct
    public void detectFeatures() {
        try {
            Integer result = (Integer) entityManager
                .createNativeQuery("SELECT FULLTEXTSERVICEPROPERTY('IsFullTextInstalled')")
                .getSingleResult();
            this.ftsInstalled = (result != null && result == 1);
        } catch (Exception e) {
            this.ftsInstalled = false;
        }
    }

    public boolean isFtsInstalled() {
        return this.ftsInstalled;
    }
}
