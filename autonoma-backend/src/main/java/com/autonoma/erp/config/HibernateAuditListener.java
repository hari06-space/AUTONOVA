package com.autonoma.erp.config;

import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.*;
import org.hibernate.internal.SessionFactoryImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import com.autonoma.erp.util.SecurityUtils;

@Component
public class HibernateAuditListener implements PreInsertEventListener, PreUpdateEventListener {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @PostConstruct
    public void registerListeners() {
        try {
            SessionFactoryImpl sessionFactory = entityManagerFactory.unwrap(SessionFactoryImpl.class);
            EventListenerRegistry registry = sessionFactory.getServiceRegistry()
                    .getService(EventListenerRegistry.class);
            registry.getEventListenerGroup(EventType.PRE_INSERT).appendListener(this);
            registry.getEventListenerGroup(EventType.PRE_UPDATE).appendListener(this);
        } catch (Exception e) {
            System.err.println("Failed to register Hibernate dynamic audit event listeners: " + e.getMessage());
        }
    }

    @Override
    public boolean onPreInsert(PreInsertEvent event) {
        String entityName = event.getEntity().getClass().getSimpleName();
        if (entityName.equalsIgnoreCase("CommChannel") || entityName.equalsIgnoreCase("UserThemeSetting")
                || entityName.equalsIgnoreCase("UserColumnPreference")
                || entityName.equalsIgnoreCase("CliRemoteCommand")) {
            return false;
        }

        String currentUser = SecurityUtils.getCurrentUserId();
        if (currentUser == null || currentUser.trim().isEmpty() || "SYSTEM".equalsIgnoreCase(currentUser.trim())) {
            currentUser = "SUPER BOSS";
        }
        String[] propertyNames = event.getPersister().getPropertyNames();
        Object[] state = event.getState();

        setValue(propertyNames, state, "createdUser", currentUser, event.getEntity());
        setValue(propertyNames, state, "createdBy", currentUser, event.getEntity());

        return false; // do not veto insert
    }

    @Override
    public boolean onPreUpdate(PreUpdateEvent event) {
        String entityName = event.getEntity().getClass().getSimpleName();
        if (entityName.equalsIgnoreCase("CommChannel") || entityName.equalsIgnoreCase("UserThemeSetting")
                || entityName.equalsIgnoreCase("UserColumnPreference")
                || entityName.equalsIgnoreCase("CliRemoteCommand")) {
            return false;
        }

        String currentUser = SecurityUtils.getCurrentUserId();
        if (currentUser == null || currentUser.trim().isEmpty() || "SYSTEM".equalsIgnoreCase(currentUser.trim())) {
            currentUser = "SUPER BOSS";
        }
        String[] propertyNames = event.getPersister().getPropertyNames();
        Object[] state = event.getState();

        // Deep fix: Skip updating audit fields if the record was newly created within
        // the last 5 seconds
        java.util.Date createdDate = null;
        for (int i = 0; i < propertyNames.length; i++) {
            if (propertyNames[i].equalsIgnoreCase("createdDate") || propertyNames[i].equalsIgnoreCase("createdAt")) {
                if (state[i] instanceof java.util.Date) {
                    createdDate = (java.util.Date) state[i];
                } else if (state[i] instanceof java.time.LocalDateTime) {
                    createdDate = java.util.Date.from(
                            ((java.time.LocalDateTime) state[i]).atZone(java.time.ZoneId.systemDefault()).toInstant());
                }
                break;
            }
        }
        if (createdDate != null) {
            long diff = new java.util.Date().getTime() - createdDate.getTime();
            if (diff < 5000) { // Skip update for recently created entity (within 5 seconds)
                return false;
            }
        }

        setValue(propertyNames, state, "updatedUser", currentUser, event.getEntity());
        setValue(propertyNames, state, "updatedBy", currentUser, event.getEntity());

        java.util.Date now = new java.util.Date();
        setValue(propertyNames, state, "updatedDate", now, event.getEntity());
        setValue(propertyNames, state, "updatedAt", now, event.getEntity());

        return false; // do not veto update
    }

    private void setValue(String[] propertyNames, Object[] state, String propertyName, Object value, Object entity) {
        for (int i = 0; i < propertyNames.length; i++) {
            if (propertyNames[i].equalsIgnoreCase(propertyName)) {
                // Determine target type to handle conversions (e.g. java.util.Date ->
                // java.time.LocalDateTime)
                Object convertedValue = value;
                Class<?> targetType = null;
                try {
                    String setterName = "set" + propertyName.substring(0, 1).toUpperCase() + propertyName.substring(1);
                    for (java.lang.reflect.Method method : entity.getClass().getMethods()) {
                        if (method.getName().equalsIgnoreCase(setterName) && method.getParameterCount() == 1) {
                            targetType = method.getParameterTypes()[0];
                            break;
                        }
                    }
                    if (targetType == null) {
                        java.lang.reflect.Field field = null;
                        Class<?> current = entity.getClass();
                        while (current != null && field == null) {
                            try {
                                field = current.getDeclaredField(propertyName);
                            } catch (NoSuchFieldException e) {
                                current = current.getSuperclass();
                            }
                        }
                        if (field != null) {
                            targetType = field.getType();
                        }
                    }
                } catch (Exception e) {
                }

                if (targetType != null && value instanceof java.util.Date) {
                    if (targetType.equals(java.time.LocalDateTime.class)) {
                        convertedValue = java.time.LocalDateTime.ofInstant(((java.util.Date) value).toInstant(),
                                java.time.ZoneId.systemDefault());
                    } else if (targetType.equals(java.time.LocalDate.class)) {
                        convertedValue = java.time.LocalDate.ofInstant(((java.util.Date) value).toInstant(),
                                java.time.ZoneId.systemDefault());
                    }
                }

                // System.out.println("[AuditListener] Setting " + propertyName + " to " + convertedValue + " on "
                //         + entity.getClass().getSimpleName());
                state[i] = convertedValue;
                try {
                    // Try field directly first to bypass setter interception (avoiding bytecode
                    // dirty-tracking interceptors)
                    java.lang.reflect.Field field = null;
                    Class<?> current = entity.getClass();
                    while (current != null && field == null) {
                        try {
                            field = current.getDeclaredField(propertyName);
                        } catch (NoSuchFieldException e) {
                            current = current.getSuperclass();
                        }
                    }
                    if (field != null) {
                        field.setAccessible(true);
                        field.set(entity, convertedValue);
                    } else {
                        // Fallback to setter if field is not found
                        String setterName = "set" + propertyName.substring(0, 1).toUpperCase()
                                + propertyName.substring(1);
                        java.lang.reflect.Method setter = null;
                        for (java.lang.reflect.Method method : entity.getClass().getMethods()) {
                            if (method.getName().equalsIgnoreCase(setterName) && method.getParameterCount() == 1) {
                                setter = method;
                                break;
                            }
                        }
                        if (setter != null) {
                            setter.invoke(entity, convertedValue);
                        }
                    }
                } catch (Exception e) {
                    System.err.println(
                            "[AuditListener] Reflection error setting " + propertyName + ": " + e.getMessage());
                }
                break;
            }
        }
    }
}
