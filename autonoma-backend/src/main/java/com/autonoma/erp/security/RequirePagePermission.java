package com.autonoma.erp.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation for securing API endpoints with BOS page-level permissions.
 * 
 * Usage:
 * <pre>
 * {@literal @}RequirePagePermission(pageCode = "M3110", action = "write")
 * {@literal @}PostMapping
 * public ResponseEntity<?> create(...) { ... }
 * </pre>
 * 
 * Actions: "read", "write", "delete", "export", "approval", "manager"
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePagePermission {
    /** The page code (e.g., "M3110") */
    String pageCode();
    
    /** The permission action to check */
    String action() default "write";
}
