package com.autonoma.erp.modules.notebook.dto;

import java.util.*;

/**
 * Structured runtime representation of a business object instance.
 * Holds scalar fields and nested child collections loaded from DB metadata.
 */
public class BusinessObject {

    private final String entityCode;
    private final Object id;
    private final Map<String, Object> fields = new LinkedHashMap<>();
    private final Map<String, List<BusinessObject>> expansions = new LinkedHashMap<>();

    public BusinessObject(String entityCode, Object id) {
        this.entityCode = entityCode;
        this.id = id;
    }

    public String getEntityCode() {
        return entityCode;
    }

    public Object getId() {
        return id;
    }

    public Map<String, Object> getFields() {
        return fields;
    }

    public void addField(String name, Object value) {
        this.fields.put(name, value);
    }

    public Map<String, List<BusinessObject>> getExpansions() {
        return expansions;
    }

    public void addExpansion(String name, List<BusinessObject> list) {
        this.expansions.put(name, list);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append(entityCode).append(" #").append(id).append(":\n");
        for (Map.Entry<String, Object> entry : fields.entrySet()) {
            sb.append("  ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
        }
        for (Map.Entry<String, List<BusinessObject>> entry : expansions.entrySet()) {
            sb.append("  Expand ").append(entry.getKey()).append(" [").append(entry.getValue().size()).append(" rows]:\n");
            for (BusinessObject child : entry.getValue()) {
                String childStr = child.toString().replaceAll("(?m)^", "    ");
                sb.append(childStr).append("\n");
            }
        }
        return sb.toString();
    }
}
