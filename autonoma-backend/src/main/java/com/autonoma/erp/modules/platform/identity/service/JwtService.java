package com.autonoma.erp.modules.platform.identity.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.jackson.io.JacksonDeserializer;
import io.jsonwebtoken.jackson.io.JacksonSerializer;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret:AutonomaERPSecretKey2026SecureProductionSecretKeyForCandidateAssessmentPortalTokenValidation1234567890}")
    private String configuredSecret;

    private String secret;

    @jakarta.annotation.PostConstruct
    public void init() {
        if (configuredSecret != null && !configuredSecret.isBlank()) {
            this.secret = configuredSecret.trim();
        } else {
            this.secret = "AutonomaERPSecretKey2026SecureProductionSecretKeyForCandidateAssessmentPortalTokenValidation1234567890";
        }
        if (this.expiration == null) {
            this.expiration = 86400000L;
        }
    }

    @Value("${jwt.expiration:86400000}")
    private Long expiration;

    private <T> T withJjwtClassLoader(Function<Void, T> action) {
        ClassLoader originalClassLoader = Thread.currentThread().getContextClassLoader();
        try {
            Thread.currentThread().setContextClassLoader(Jwts.class.getClassLoader());
            return action.apply(null);
        } finally {
            Thread.currentThread().setContextClassLoader(originalClassLoader);
        }
    }

    public String generateToken(String email) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, email);
    }

    public String generateToken(String email, String sessionId) {
        Map<String, Object> claims = new HashMap<>();
        if (sessionId != null && !sessionId.isBlank()) {
            claims.put("sessionId", sessionId);
        }
        return createToken(claims, email);
    }

    public String extractUsername(String token) {
        return withJjwtClassLoader(v -> Jwts.parserBuilder()
                .deserializeJsonWith(new JacksonDeserializer<>())
                .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject());
    }

    public String extractSessionId(String token) {
        return withJjwtClassLoader(v -> {
            try {
                Claims claims = Jwts.parserBuilder()
                        .deserializeJsonWith(new JacksonDeserializer<>())
                        .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes()))
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
                return claims.get("sessionId", String.class);
            } catch (Exception e) {
                return null;
            }
        });
    }

    public boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }

    public boolean isTokenExpired(String token) {
        return withJjwtClassLoader(v -> Jwts.parserBuilder()
                .deserializeJsonWith(new JacksonDeserializer<>())
                .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration()
                .before(new Date()));
    }

    public String generateApplicantToken(String applicantCode) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "APPLICANT");
        Key key = Keys.hmacShaKeyFor(secret.getBytes());
        long twoDaysMillis = 172800000L; // 2 days in ms
        return withJjwtClassLoader(v -> Jwts.builder()
                .serializeToJsonWith(new JacksonSerializer<>())
                .setClaims(claims)
                .setSubject(applicantCode)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + twoDaysMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Key key = Keys.hmacShaKeyFor(secret.getBytes());
        return withJjwtClassLoader(v -> Jwts.builder()
                .serializeToJsonWith(new JacksonSerializer<>())
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact());
    }
}
