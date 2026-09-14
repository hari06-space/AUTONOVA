package com.autonoma.erp.service.payroll;

import com.autonoma.erp.util.PayrollFormulaEvaluator;

import com.autonoma.erp.model.payroll.HrPayrollComponent;
import com.autonoma.erp.model.payroll.HrPayrollComponentDependency;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DependencyResolver {

    public List<HrPayrollComponent> resolveAndSort(List<HrPayrollComponent> components, List<HrPayrollComponentDependency> dependencies) {
        // Map to quickly find component by code
        Map<String, HrPayrollComponent> componentMap = new HashMap<>();
        for (HrPayrollComponent comp : components) {
            componentMap.put(comp.getComponentCode().toUpperCase(), comp);
        }

        // Build adjacency list (Dependency Graph)
        // Adjacency list: B -> List of A (Meaning B must be calculated before A, i.e., A depends on B)
        Map<String, Set<String>> adjList = new HashMap<>();
        Map<String, Integer> inDegree = new HashMap<>();

        // Initialize indegrees and adjacency list keys
        for (HrPayrollComponent comp : components) {
            String code = comp.getComponentCode().toUpperCase();
            adjList.put(code, new HashSet<>());
            inDegree.put(code, 0);
        }

        // Add edges from dependencies table
        for (HrPayrollComponentDependency dep : dependencies) {
            String u = dep.getDependsOnComponentCode().toUpperCase(); // B (independent)
            String v = dep.getComponentCode().toUpperCase();          // A (dependent)

            // Make sure both components are in the active components list
            if (componentMap.containsKey(u) && componentMap.containsKey(v)) {
                if (adjList.get(u).add(v)) {
                    inDegree.put(v, inDegree.get(v) + 1);
                }
            }
        }

        // Add implicit dependencies from formula text
        for (HrPayrollComponent comp : components) {
            String v = comp.getComponentCode().toUpperCase();
            if ("FORMULA".equalsIgnoreCase(comp.getCalculationType()) && comp.getFormulaExpression() != null) {
                Set<String> referenced = extractReferencedVariables(comp.getFormulaExpression(), componentMap.keySet());
                for (String u : referenced) {
                    if (!u.equals(v)) { // Prevent self-loops
                        if (adjList.get(u).add(v)) {
                            inDegree.put(v, inDegree.get(v) + 1);
                        }
                    }
                }
            }
        }

        // Queue for components with 0 in-degree (no dependencies left)
        Queue<String> queue = new LinkedList<>();
        for (Map.Entry<String, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.add(entry.getKey());
            }
        }

        List<HrPayrollComponent> sortedList = new ArrayList<>();
        while (!queue.isEmpty()) {
            String u = queue.poll();
            sortedList.add(componentMap.get(u));

            for (String v : adjList.get(u)) {
                inDegree.put(v, inDegree.get(v) - 1);
                if (inDegree.get(v) == 0) {
                    queue.add(v);
                }
            }
        }

        // If sorted list is smaller than the components list, there's a cycle!
        if (sortedList.size() < components.size()) {
            // Find cycle path for debugging
            List<String> remaining = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : inDegree.entrySet()) {
                if (entry.getValue() > 0) {
                    remaining.add(entry.getKey());
                }
            }
            throw new IllegalStateException("Cyclic dependency detected among components: " + remaining);
        }

        return sortedList;
    }

    private Set<String> extractReferencedVariables(String formula, Set<String> validCodes) {
        Set<String> refs = new HashSet<>();
        try {
            List<com.autonoma.erp.util.PayrollFormulaEvaluator.Token> tokens = 
                com.autonoma.erp.util.PayrollFormulaEvaluator.tokenize(formula);
            for (com.autonoma.erp.util.PayrollFormulaEvaluator.Token t : tokens) {
                if (t.type == com.autonoma.erp.util.PayrollFormulaEvaluator.Token.Type.IDENTIFIER) {
                    String code = t.value.toUpperCase();
                    if (validCodes.contains(code)) {
                        refs.add(code);
                    }
                }
            }
        } catch (Exception e) {
            // Ignore tokenization errors during dependency scan (will be caught in validator)
        }
        return refs;
    }
}
