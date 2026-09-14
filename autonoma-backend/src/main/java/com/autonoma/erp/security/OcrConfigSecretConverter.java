package com.autonoma.erp.security;

import com.autonoma.erp.util.SpringContext;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter
public class OcrConfigSecretConverter implements AttributeConverter<String, String> {

    private static final Logger log = LoggerFactory.getLogger(OcrConfigSecretConverter.class);

    private EncryptionService getEncryptionService() {
        EncryptionService service = SpringContext.getBean(EncryptionService.class);
        if (service == null) {
            log.warn("SpringContext is not fully initialized yet. Cannot obtain EncryptionService.");
        }
        return service;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.trim().isEmpty()) {
            return attribute;
        }
        EncryptionService service = getEncryptionService();
        if (service == null) {
            return attribute;
        }
        return service.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return dbData;
        }
        EncryptionService service = getEncryptionService();
        if (service == null) {
            return dbData;
        }
        return service.decrypt(dbData);
    }
}
