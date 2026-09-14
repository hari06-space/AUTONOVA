package com.autonoma.erp.service.purchase.gateentry.strategy;

import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class GateEntrySourceResolver {

    private final Map<String, GateEntrySourceStrategy> strategyMap;

    public GateEntrySourceResolver(List<GateEntrySourceStrategy> strategies) {
        this.strategyMap = strategies.stream()
                .collect(Collectors.toMap(GateEntrySourceStrategy::getSourceType, Function.identity()));
    }

    public GateEntrySourceStrategy getStrategy(String sourceType) {
        GateEntrySourceStrategy strategy = strategyMap.get(sourceType);
        if (strategy == null) {
            throw new IllegalArgumentException("No Strategy found for source type: " + sourceType);
        }
        return strategy;
    }
}
