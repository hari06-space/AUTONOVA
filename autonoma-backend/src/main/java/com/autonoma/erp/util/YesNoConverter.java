package com.autonoma.erp.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class YesNoConverter implements AttributeConverter<String, Boolean> {

    @Override
    public Boolean convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return false;
        }
        String val = attribute.trim().toUpperCase();
        return "YES".equals(val) || "1".equals(val) || "TRUE".equals(val);
    }

    @Override
    public String convertToEntityAttribute(Boolean dbData) {
        if (dbData == null) {
            return "NO";
        }
        return dbData ? "YES" : "NO";
    }
}
