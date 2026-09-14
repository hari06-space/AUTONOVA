package com.autonoma.erp.modules.npd.bom.controller;

import com.autonoma.erp.modules.npd.bom.entity.BomMaster;
import com.autonoma.erp.modules.npd.bom.repository.BomMasterRepository;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/master/npd/bom")
@CrossOrigin(origins = "*")
@Tag(name = "NPD - BOM Master", description = "Endpoints for managing Bill of Materials")
public class BomController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BomController.class);

    @Autowired
    private BomMasterRepository repository;

    @GetMapping
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Operation(summary = "Get All BOMs")
    public List<Map<String, Object>> getAll() {
        return repository.findAllBomListSummary().stream().map(row -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", row.getId());
            map.put("bomNo", row.getBomNo());
            map.put("revNo", row.getRevNo());
            map.put("revDate", row.getRevDate());
            map.put("isActive", row.getIsActive());
            map.put("baseQuantity", row.getBaseQuantity());
            map.put("bomUsage", row.getBomUsage());
            map.put("remarks", row.getRemarks());
            map.put("processCount", row.getProcessCount() != null ? row.getProcessCount() : 0);
            map.put("materialCount", row.getMaterialCount() != null ? row.getMaterialCount() : 0);
            map.put("machineCount", row.getMachineCount() != null ? row.getMachineCount() : 0);
            map.put("toolCount", row.getToolCount() != null ? row.getToolCount() : 0);

            Map<String, Object> prod = new java.util.HashMap<>();
            prod.put("id", row.getProductId());
            prod.put("itemNo", row.getProductItemNo());
            prod.put("itemName", row.getProductItemName());
            map.put("product", prod);
            return map;
        }).toList();
    }

    @GetMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @Operation(summary = "Get BOM by ID")
    public ResponseEntity<BomMaster> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(bom -> {
                    if (bom.getProcesses() != null) {
                        for (com.autonoma.erp.modules.npd.bom.entity.BomProcess p : bom.getProcesses()) {
                            if (p.getMaterials() != null) p.getMaterials().size();
                            if (p.getMachines() != null) p.getMachines().size();
                            if (p.getTools() != null) p.getTools().size();
                        }
                    }
                    return ResponseEntity.ok(bom);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get Active BOM by Product ID")
    public ResponseEntity<BomMaster> getActiveByProductId(@PathVariable Long productId) {
        List<BomMaster> boms = repository.findByProductId(productId);
        return boms.stream()
                .filter(b -> Boolean.TRUE.equals(b.getIsActive()))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePagePermission(pageCode = "DD1110", action = "write") 
    @Operation(summary = "Create BOM")
    public ResponseEntity<?> create(@RequestBody BomMaster bom) {
        if (bom.getProduct() != null) {
            List<BomMaster> existing = repository.findByProductId(bom.getProduct().getId());
            if (!existing.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "A BOM configuration already exists for this parent product. Multiple BOMs per product are not allowed."));
            }
        }

        long count = repository.countDistinctBomNos();
        bom.setBomNo(String.format("BOM-%04d", count + 1));
        bom.setRevNo("R0");
        bom.setRevDate(LocalDate.now());

        if (bom.getProcesses() != null) {
            bom.getProcesses().forEach(process -> {
                process.setBomMaster(bom);
                if (process.getMaterials() != null) {
                    process.getMaterials().forEach(m -> m.setBomProcess(process));
                }
                if (process.getMachines() != null) {
                    process.getMachines().forEach(m -> m.setBomProcess(process));
                }
                if (process.getTools() != null) {
                    process.getTools().forEach(t -> t.setBomProcess(process));
                }

            });
        }
        return ResponseEntity.ok(repository.save(bom));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "DD1110", action = "write")
    @Operation(summary = "Update BOM")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody BomMaster details) {
        return repository.findById(id)
                .map(existingBom -> {
                    // Increment Revision
                    int currentRev = 0;
                    if (existingBom.getRevNo() != null && existingBom.getRevNo().startsWith("R")) {
                        try {
                            currentRev = Integer.parseInt(existingBom.getRevNo().substring(1));
                        } catch (Exception ignored) {}
                    }
                    existingBom.setRevNo("R" + (currentRev + 1));
                    existingBom.setRevDate(LocalDate.now());
                    
                    existingBom.setProduct(details.getProduct());
                    existingBom.setIsActive(details.getIsActive());
                    existingBom.setBaseQuantity(details.getBaseQuantity());
                    existingBom.setBomUsage(details.getBomUsage());
                    existingBom.setValidFrom(details.getValidFrom());
                    existingBom.setValidTo(details.getValidTo());
                    existingBom.setRemarks(details.getRemarks());

                    existingBom.getProcesses().clear();
                    if (details.getProcesses() != null) {
                        details.getProcesses().forEach(process -> {
                            process.setId(null);
                            process.setBomMaster(existingBom);
                            
                            if (process.getMaterials() != null) {
                                process.getMaterials().forEach(m -> {
                                    m.setId(null);
                                    m.setBomProcess(process);
                                });
                            }
                            if (process.getMachines() != null) {
                                process.getMachines().forEach(m -> {
                                    m.setId(null);
                                    m.setBomProcess(process);
                                });
                            }
                            if (process.getTools() != null) {
                                process.getTools().forEach(t -> {
                                    t.setId(null);
                                    t.setBomProcess(process);
                                });
                            }
                            
                            existingBom.getProcesses().add(process);
                        });
                    }

                    return ResponseEntity.ok(repository.save(existingBom));
                }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/history/{bomNo}")
    @Operation(summary = "Get BOM History by BOM No")
    public ResponseEntity<List<BomMaster>> getHistory(@PathVariable String bomNo) {
        List<BomMaster> all = repository.findAll();
        List<BomMaster> history = all.stream().filter(b -> bomNo.equals(b.getBomNo())).toList();
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "DD1110", action = "delete")
    @Operation(summary = "Delete BOM")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
