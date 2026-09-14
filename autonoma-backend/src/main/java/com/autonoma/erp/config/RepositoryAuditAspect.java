package com.autonoma.erp.config;

import com.autonoma.erp.util.SecurityUtils;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class RepositoryAuditAspect {

    @Before("execution(* org.springframework.data.repository.CrudRepository+.save*(..)) && args(entity, ..)")
    public void beforeSave(JoinPoint joinPoint, Object entity) {
        if (entity == null)
            return;

        // This runs BEFORE repository.save(), meaning the entity is updated
        // BEFORE Hibernate does dirty-checking. This guarantees the audit fields are
        // saved!
        // We only set "updated" fields, "created" fields should remain as is,
        // since pre-persist handles creation perfectly.

        try {
            String currentUserId = null;
            try {
                currentUserId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }
            String finalUserId = (currentUserId != null && !currentUserId.trim().isEmpty() && !"SYSTEM".equalsIgnoreCase(currentUserId.trim())) ? currentUserId : "SUPER BOSS";
            java.util.Date now = new java.util.Date();

            if (entity instanceof Iterable) {
                for (Object item : (Iterable<?>) entity) {
                    if (item != null)
                        applyAuditFields(item, finalUserId, now);
                }
            } else {
                applyAuditFields(entity, finalUserId, now);
            }

        } catch (Exception e) {
            // Ignore reflection errors silently
        }
    }

    private void applyAuditFields(Object item, String userId, java.util.Date now) {
        if (isNewEntity(item)) {
            // It's an INSERT. Do not set updatedBy/updatedDate.
            return;
        }

        // Deep fix: Skip updating audit fields if the record was recently created
        // (within last 5 seconds)
        // to prevent post-creation updates (e.g. single-active-meter logic or wiring)
        // from dirtying update fields.
        Object createdDateVal = getField(item, "createdDate");
        if (createdDateVal == null) {
            createdDateVal = getField(item, "createdAt");
        }
        if (createdDateVal instanceof java.util.Date) {
            long diff = now.getTime() - ((java.util.Date) createdDateVal).getTime();
            if (diff < 5000) {
                return;
            }
        } else if (createdDateVal instanceof java.time.LocalDateTime) {
            java.util.Date createdDate = java.util.Date.from(
                    ((java.time.LocalDateTime) createdDateVal).atZone(java.time.ZoneId.systemDefault()).toInstant());
            long diff = now.getTime() - createdDate.getTime();
            if (diff < 5000) {
                return;
            }
        }

        setField(item, "updatedBy", userId);
        setField(item, "updatedUser", userId);
        setField(item, "updatedDate", now);
        setField(item, "updatedAt", now);
    }

    private boolean isNewEntity(Object entity) {
        try {
            // Check for @Id annotation first
            Class<?> current = entity.getClass();
            while (current != null) {
                for (java.lang.reflect.Field field : current.getDeclaredFields()) {
                    if (field.isAnnotationPresent(jakarta.persistence.Id.class) ||
                            field.isAnnotationPresent(org.springframework.data.annotation.Id.class)) {
                        field.setAccessible(true);
                        Object idValue = field.get(entity);
                        if (idValue == null)
                            return true;
                        if (idValue instanceof Number && ((Number) idValue).longValue() == 0)
                            return true;
                        if (idValue instanceof String && ((String) idValue).trim().isEmpty())
                            return true;
                        return false; // Found a non-empty @Id, so it's an UPDATE
                    }
                }
                current = current.getSuperclass();
            }

            // Fallback to common ID field names
            String[] idFields = { "id", "userId", "empId", "companyId", "divisionId" };
            for (String idField : idFields) {
                Object idValue = getField(entity, idField);
                if (idValue != null) {
                    if (idValue instanceof Number && ((Number) idValue).longValue() == 0)
                        return true;
                    if (idValue instanceof String && ((String) idValue).trim().isEmpty())
                        return true;
                    return false;
                }
            }
            return true; // No ID found, must be new
        } catch (Exception e) {
        }
        return false;
    }

    private Object getField(Object entity, String propertyName) {
        try {
            String getterName = "get" + propertyName.substring(0, 1).toUpperCase() + propertyName.substring(1);
            for (java.lang.reflect.Method method : entity.getClass().getMethods()) {
                if (method.getName().equalsIgnoreCase(getterName) && method.getParameterCount() == 0) {
                    return method.invoke(entity);
                }
            }
            Class<?> current = entity.getClass();
            while (current != null) {
                try {
                    java.lang.reflect.Field field = current.getDeclaredField(propertyName);
                    field.setAccessible(true);
                    return field.get(entity);
                } catch (NoSuchFieldException e) {
                    current = current.getSuperclass();
                }
            }
        } catch (Exception e) {
        }
        return null;
    }

    private void setField(Object entity, String propertyName, Object value) {
        try {
            String setterName = "set" + propertyName.substring(0, 1).toUpperCase() + propertyName.substring(1);
            for (java.lang.reflect.Method method : entity.getClass().getMethods()) {
                if (method.getName().equalsIgnoreCase(setterName) && method.getParameterCount() == 1) {
                    method.invoke(entity, value);
                    return;
                }
            }
            // Fallback to field
            Class<?> current = entity.getClass();
            while (current != null) {
                try {
                    java.lang.reflect.Field field = current.getDeclaredField(propertyName);
                    field.setAccessible(true);
                    field.set(entity, value);
                    return;
                } catch (NoSuchFieldException e) {
                    current = current.getSuperclass();
                }
            }
        } catch (Exception e) {
        }
    }
}
