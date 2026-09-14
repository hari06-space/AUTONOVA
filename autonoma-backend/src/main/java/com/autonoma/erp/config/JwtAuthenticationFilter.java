package com.autonoma.erp.config;

import com.autonoma.erp.service.admin.UserSessionService;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.platform.identity.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private com.autonoma.erp.service.admin.UserSessionService userSessionService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        if (path != null && (
            path.startsWith("/candidate/") ||
            path.startsWith("/api/hra/applicants/portal/") ||
            "/api/hra/applicants/verification/verify-token".equals(path) ||
            "/api/hra/applicants/verification/submit".equals(path)
        )) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        String jwt = null;
        final String username;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        }

        if (jwt == null || jwt.isBlank()) {
            String tokenParam = request.getParameter("token");
            if (tokenParam != null && !tokenParam.isBlank()) {
                jwt = tokenParam;
            }
        }

        if (jwt == null || jwt.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            username = jwtService.extractUsername(jwt);
            String sessionId = jwtService.extractSessionId(jwt);

            if (username != null) {
                if (jwtService.validateToken(jwt, username)) {
                    // Server-side session status check
                    UserSessionService.SessionValidationResult validationResult = userSessionService.validateSession(sessionId, username);
                    if (!validationResult.isValid()) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        response.getWriter().write(String.format("{\"status\":401,\"errorCode\":\"%s\",\"message\":\"%s\"}",
                                validationResult.getErrorCode() != null ? validationResult.getErrorCode() : "SESSION_REVOKED",
                                validationResult.getMessage() != null ? validationResult.getMessage() : "Session has been terminated."));
                        return;
                    }

                    // Update user last activity/seen time in UserSessionService
                    userSessionService.updateLastSeen(username);

                    // Pre-resolve and cache employee name to prevent ConcurrentModificationException inside Hibernate flush lifecycle
                    com.autonoma.erp.util.SecurityUtils.resolveAndCacheEmployeeName(username);
                    com.autonoma.erp.util.SecurityUtils.resolveAndCacheUsernameCasing(username);

                    if (SecurityContextHolder.getContext().getAuthentication() == null) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                new ArrayList<>() // Empty authorities for now
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
        } catch (Exception e) {
            // Token validation failed
        }
        
        filterChain.doFilter(request, response);
    }
}
