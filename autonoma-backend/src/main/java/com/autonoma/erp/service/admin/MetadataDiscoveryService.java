package com.autonoma.erp.service.admin;

import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.Attribute;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.Metamodel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class MetadataDiscoveryService {

    @Autowired
    private EntityManager entityManager;

    public List<Map<String, Object>> getDiscoverableEntities() {
        List<Map<String, Object>> list = new ArrayList<>();
        Metamodel metamodel = entityManager.getMetamodel();
        Set<EntityType<?>> entities = metamodel.getEntities();

        for (EntityType<?> entityType : entities) {
            Map<String, Object> map = new HashMap<>();
            String name = entityType.getName();
            Class<?> javaType = entityType.getJavaType();
            String tableName = getTableName(javaType);
            
            map.put("entityName", name);
            map.put("className", javaType.getName());
            map.put("tableName", tableName);
            
            List<Map<String, String>> fields = new ArrayList<>();
            for (Attribute<?, ?> attribute : entityType.getAttributes()) {
                Map<String, String> f = new HashMap<>();
                f.put("fieldName", attribute.getName());
                f.put("fieldType", attribute.getJavaType().getSimpleName());
                fields.add(f);
            }
            // Sort fields alphabetically for easier configuration in wizard
            fields.sort(Comparator.comparing(f -> f.get("fieldName")));
            map.put("fields", fields);
            list.add(map);
        }
        list.sort(Comparator.comparing(m -> (String) m.get("entityName")));
        return list;
    }

    private String getTableName(Class<?> clazz) {
        if (clazz.isAnnotationPresent(jakarta.persistence.Table.class)) {
            return clazz.getAnnotation(jakarta.persistence.Table.class).name();
        }
        return clazz.getSimpleName();
    }
}
