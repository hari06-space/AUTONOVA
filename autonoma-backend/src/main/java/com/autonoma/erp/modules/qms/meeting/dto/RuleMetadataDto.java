package com.autonoma.erp.modules.qms.meeting.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RuleMetadataDto {

    private List<FieldOption> fields;
    private List<OperatorOption> operators;
    private List<ActionOption> actions;
    private List<DateGeneratorOption> dateGenerators;
    private List<FallbackOption> fallbacks;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldOption {
        private String code;
        private String displayName;
        private String category; // DATE, OCCURRENCE, WORKING_DAY, HOLIDAY, FINANCIAL, SCHEDULE
        private String dataType; // TEXT, NUMBER, DATE, BOOLEAN, LIST
        private List<String> availableValues;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperatorOption {
        private String code;
        private String displayName;
        private List<String> supportedDataTypes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionOption {
        private String code;
        private String displayName;
        private String description;
        private List<String> parameterFields;
    }

    public List<DateGeneratorOption> getDateGenerators() { return dateGenerators; }
    public void setDateGenerators(List<DateGeneratorOption> dateGenerators) { this.dateGenerators = dateGenerators; }
    public List<FallbackOption> getFallbacks() { return fallbacks; }
    public void setFallbacks(List<FallbackOption> fallbacks) { this.fallbacks = fallbacks; }

    @Data
    @NoArgsConstructor
    public static class DateGeneratorOption {
        private String code;
        private String displayName;
        private String description;

        public DateGeneratorOption(String code, String displayName, String description) {
            this.code = code;
            this.displayName = displayName;
            this.description = description;
        }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    @Data
    @NoArgsConstructor
    public static class FallbackOption {
        private String code;
        private String displayName;
        private String description;

        public FallbackOption(String code, String displayName, String description) {
            this.code = code;
            this.displayName = displayName;
            this.description = description;
        }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
