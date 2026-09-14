package com.autonoma.erp.dto.purchase.inspection;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MaterialInspectionDTO {
    private Long id;
    private Long qualityInspectionId;
    
    // Links back to the spec parameter
    private Long specParameterId;
    private String parameterName;
    private String uom;
    
    // From AQL or spec
    private Long aqlId;
    private BigDecimal minVal;
    private BigDecimal maxVal;
    
    // Process and Instrument for display
    private Long processId;
    private String processName;
    private Long instrumentId;
    private String instrumentName;
    private String parameterCondition;

    // JSON array of results based on sample size
    private String observation;
    
    // Final text result
    private String result;
    
    // Extra fields to help UI render
    private Integer sampleSize;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getQualityInspectionId() { return qualityInspectionId; }
    public void setQualityInspectionId(Long qualityInspectionId) { this.qualityInspectionId = qualityInspectionId; }
    public Long getSpecParameterId() { return specParameterId; }
    public void setSpecParameterId(Long specParameterId) { this.specParameterId = specParameterId; }
    public String getParameterName() { return parameterName; }
    public void setParameterName(String parameterName) { this.parameterName = parameterName; }
    public String getUom() { return uom; }
    public void setUom(String uom) { this.uom = uom; }
    public Long getAqlId() { return aqlId; }
    public void setAqlId(Long aqlId) { this.aqlId = aqlId; }
    public BigDecimal getMinVal() { return minVal; }
    public void setMinVal(BigDecimal minVal) { this.minVal = minVal; }
    public BigDecimal getMaxVal() { return maxVal; }
    public void setMaxVal(BigDecimal maxVal) { this.maxVal = maxVal; }
    public Long getProcessId() { return processId; }
    public void setProcessId(Long processId) { this.processId = processId; }
    public String getProcessName() { return processName; }
    public void setProcessName(String processName) { this.processName = processName; }
    public Long getInstrumentId() { return instrumentId; }
    public void setInstrumentId(Long instrumentId) { this.instrumentId = instrumentId; }
    public String getInstrumentName() { return instrumentName; }
    public void setInstrumentName(String instrumentName) { this.instrumentName = instrumentName; }
    public String getParameterCondition() { return parameterCondition; }
    public void setParameterCondition(String parameterCondition) { this.parameterCondition = parameterCondition; }
    public String getObservation() { return observation; }
    public void setObservation(String observation) { this.observation = observation; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public Integer getSampleSize() { return sampleSize; }
    public void setSampleSize(Integer sampleSize) { this.sampleSize = sampleSize; }
}
