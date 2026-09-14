package com.autonoma.erp.modules.platform.common.entity;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.autonoma.erp.util.SpringContext;
import com.autonoma.erp.modules.hra.recruitment.service.AtsStatusResolver;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;

import java.io.IOException;

public class StatusMasterDeserializer extends JsonDeserializer<StatusMaster> {

    @Override
    public StatusMaster deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.readValueAsTree();
        if (node.isTextual()) {
            return resolveByName(node.asText());
        } else if (node.isNumber()) {
            return resolveById(node.asLong());
        } else if (node.isObject()) {
            JsonNode idNode = node.get("id");
            if (idNode != null && !idNode.isNull()) {
                return resolveById(idNode.asLong());
            }
            JsonNode nameNode = node.get("name");
            if (nameNode != null && !nameNode.isNull()) {
                return resolveByName(nameNode.asText());
            }
        }
        return null;
    }

    private StatusMaster resolveByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }
        try {
            AtsStatusResolver resolver = SpringContext.getBean(AtsStatusResolver.class);
            return resolver.get(name);
        } catch (Exception e) {
            try {
                StatusMasterRepository repo = SpringContext.getBean(StatusMasterRepository.class);
                return repo.findFirstByNameIgnoreCase(name).orElse(null);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    private StatusMaster resolveById(Long id) {
        if (id == null) {
            return null;
        }
        try {
            StatusMasterRepository repo = SpringContext.getBean(StatusMasterRepository.class);
            return repo.findById(id).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
