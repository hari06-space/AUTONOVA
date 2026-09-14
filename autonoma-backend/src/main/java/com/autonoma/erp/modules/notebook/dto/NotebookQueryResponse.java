package com.autonoma.erp.modules.notebook.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotebookQueryResponse {
    private String answer;
    private List<String> citations;
    private String model;
    private AiExecutionTrace trace;

    public NotebookQueryResponse(String answer, List<String> citations, String model) {
        this.answer = answer;
        this.citations = citations;
        this.model = model;
    }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public List<String> getCitations() { return citations; }
    public void setCitations(List<String> citations) { this.citations = citations; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public AiExecutionTrace getTrace() { return trace; }
    public void setTrace(AiExecutionTrace trace) { this.trace = trace; }
}
