package com.autonoma.erp.modules.npd.packing.controller;

import com.autonoma.erp.modules.hr.asset.entity.AssetMaster;
import com.autonoma.erp.modules.hr.asset.repository.AssetMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository;
import com.autonoma.erp.modules.npd.packing.dto.PackingProcedureDetailsDto;
import com.autonoma.erp.modules.npd.packing.dto.PackingProcedureListDto;
import com.autonoma.erp.modules.npd.packing.dto.PackingProcedureSaveDto;
import com.autonoma.erp.modules.npd.packing.entity.*;
import com.autonoma.erp.modules.npd.packing.repository.PackingProcedureHeaderRepository;
import com.autonoma.erp.modules.npd.packing.repository.ProcessProductMappingRepository;
import com.autonoma.erp.modules.npd.product.entity.ProductMaster;
import com.autonoma.erp.modules.npd.product.entity.ProductProcess;
import com.autonoma.erp.modules.npd.product.repository.ProductMasterRepository;
import com.autonoma.erp.modules.npd.product.repository.ProductProcessRepository;
import com.autonoma.erp.security.RequirePagePermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dd/packing-procedures")
@CrossOrigin(origins = "*")
public class PackingProcedureController {

    @Autowired
    private PackingProcedureHeaderRepository headerRepository;

    @Autowired
    private ProcessProductMappingRepository mappingRepository;

    @Autowired
    private ProductProcessRepository processRepository;

    @Autowired
    private ProductMasterRepository productRepository;

    @Autowired
    private AssetMasterRepository assetRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DesignationRepository designationRepository;

    // --- PACKING PROCEDURES ---

    @GetMapping
    public List<PackingProcedureListDto> getAll() {
        return headerRepository.findAll().stream().map(h -> {
            PackingProcedureListDto dto = new PackingProcedureListDto();
            dto.setId(h.getId());
            dto.setProcessId(h.getProcess().getId());
            dto.setProcessName(h.getProcess().getProcessName());
            dto.setProductId(h.getProduct().getId());
            dto.setPartNo(h.getProduct().getItemNo());
            dto.setPartName(h.getProduct().getItemName());
            dto.setDocNo(h.getDocNo());
            dto.setRevNo(h.getRevNo());
            dto.setRevDate(h.getRevDate());
            dto.setApprovalStatus(h.getApprovalStatus());
            dto.setIsActive(h.getIsActive());
            dto.setCreatedBy(h.getCreatedBy());
            dto.setCreatedDate(h.getCreatedDate());
            dto.setUpdatedBy(h.getUpdatedBy());
            dto.setUpdatedDate(h.getUpdatedDate());
            return dto;
        }).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PackingProcedureDetailsDto> getById(@PathVariable Long id) {
        return headerRepository.findById(id).map(h -> ResponseEntity.ok(convertToDetailsDto(h)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    @RequirePagePermission(pageCode = "DD1113", action = "write")
    public ResponseEntity<?> create(@RequestBody PackingProcedureSaveDto saveDto) {
        // Validate unique active product + process procedure
        Optional<PackingProcedureHeader> existing = headerRepository
                .findByProductIdAndProcessIdAndIsActiveTrue(saveDto.getProductId(), saveDto.getProcessId());
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body("An active procedure already exists for this Part No and Process Type.");
        }

        ProductProcess process = processRepository.findById(saveDto.getProcessId())
                .orElseThrow(() -> new IllegalArgumentException("Process not found"));
        ProductMaster product = productRepository.findById(saveDto.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        PackingProcedureHeader header = new PackingProcedureHeader();
        header.setProcess(process);
        header.setProduct(product);
        header.setRevNo(0);
        header.setRevDate(new Date());
        header.setApprovalStatus("CREATED");
        header.setIsActive(true);
        header.setDivisionId(saveDto.getDivisionId());
        header.setCompanyId(saveDto.getCompanyId());

        // Generate DocNo sequentially if empty
        if (saveDto.getDocNo() == null || saveDto.getDocNo().trim().isEmpty()) {
            long count = headerRepository.countDistinctDocNos();
            header.setDocNo(String.format("PKP-%04d", count + 1));
        } else {
            header.setDocNo(saveDto.getDocNo().trim());
        }

        mapChildren(saveDto, header);

        PackingProcedureHeader saved = headerRepository.save(header);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToDetailsDto(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    @RequirePagePermission(pageCode = "DD1113", action = "write")
    public ResponseEntity<?> amend(@PathVariable Long id, @RequestBody PackingProcedureSaveDto saveDto) {
        PackingProcedureHeader existing = headerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Packing Procedure not found"));

        // Check if there is another active procedure (excluding the one being updated)
        Optional<PackingProcedureHeader> otherActive = headerRepository
                .findByProductIdAndProcessIdAndIsActiveTrue(existing.getProduct().getId(), existing.getProcess().getId());
        if (otherActive.isPresent() && !otherActive.get().getId().equals(existing.getId())) {
            return ResponseEntity.badRequest().body("Another active procedure revision (Doc: " + otherActive.get().getDocNo() 
                    + " Rev: " + otherActive.get().getRevNo() + ") already exists. You can only amend the latest active revision.");
        }

        // Deactivate old revision
        existing.setIsActive(false);
        headerRepository.save(existing);

        // Create new revision master
        PackingProcedureHeader header = new PackingProcedureHeader();
        header.setProcess(existing.getProcess());
        header.setProduct(existing.getProduct());
        header.setDocNo(existing.getDocNo());
        int currentRev = existing.getRevNo() != null ? existing.getRevNo() : 0;
        header.setRevNo(currentRev + 1);
        header.setRevDate(new Date());
        header.setApprovalStatus("CREATED");
        header.setIsActive(true);
        header.setDivisionId(saveDto.getDivisionId() != null ? saveDto.getDivisionId() : existing.getDivisionId());
        header.setCompanyId(saveDto.getCompanyId() != null ? saveDto.getCompanyId() : existing.getCompanyId());

        mapChildren(saveDto, header);

        PackingProcedureHeader saved = headerRepository.save(header);
        return ResponseEntity.ok(convertToDetailsDto(saved));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "DD1113", action = "delete")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!headerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        headerRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- PROCESS MAPPINGS ---

    @GetMapping("/process-mappings/{processId}")
    public List<ProductMaster> getMappedProducts(@PathVariable Long processId) {
        return mappingRepository.findByProcessId(processId).stream()
                .map(ProcessProductMapping::getProduct)
                .collect(Collectors.toList());
    }

    @PostMapping("/process-mappings")
    @Transactional
    public ResponseEntity<?> addMapping(@RequestParam Long processId, @RequestParam Long productId) {
        if (mappingRepository.existsByProcessIdAndProductId(processId, productId)) {
            return ResponseEntity.badRequest().body("Mapping already exists.");
        }

        ProductProcess process = processRepository.findById(processId)
                .orElseThrow(() -> new IllegalArgumentException("Process not found"));
        ProductMaster product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        ProcessProductMapping mapping = new ProcessProductMapping();
        mapping.setProcess(process);
        mapping.setProduct(product);

        mappingRepository.save(mapping);
        return ResponseEntity.ok("Mapping created successfully.");
    }

    @DeleteMapping("/process-mappings")
    @Transactional
    public ResponseEntity<?> removeMapping(@RequestParam Long processId, @RequestParam Long productId) {
        if (!mappingRepository.existsByProcessIdAndProductId(processId, productId)) {
            return ResponseEntity.notFound().build();
        }
        mappingRepository.deleteByProcessIdAndProductId(processId, productId);
        return ResponseEntity.ok("Mapping removed successfully.");
    }

    // --- HELPERS ---

    private void mapChildren(PackingProcedureSaveDto saveDto, PackingProcedureHeader header) {
        // Consumables
        if (saveDto.getConsumables() != null) {
            for (PackingProcedureSaveDto.ConsumableSaveDto cDto : saveDto.getConsumables()) {
                ProcedureConsumable consumable = new ProcedureConsumable();
                consumable.setProcedureHeader(header);
                consumable.setProduct(productRepository.findById(cDto.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("Consumable product not found")));
                consumable.setQty(cDto.getQty());
                header.getConsumables().add(consumable);
            }
        }

        // Tools
        if (saveDto.getTools() != null) {
            for (PackingProcedureSaveDto.ToolSaveDto tDto : saveDto.getTools()) {
                ProcedureTool tool = new ProcedureTool();
                tool.setProcedureHeader(header);
                tool.setAsset(assetRepository.findById(tDto.getAssetId())
                        .orElseThrow(() -> new IllegalArgumentException("Tool asset not found")));
                tool.setQty(tDto.getQty());
                header.getTools().add(tool);
            }
        }

        // Safety
        if (saveDto.getSafetyEquipment() != null) {
            for (PackingProcedureSaveDto.SafetyEquipSaveDto sDto : saveDto.getSafetyEquipment()) {
                ProcedureSafetyEquip safety = new ProcedureSafetyEquip();
                safety.setProcedureHeader(header);
                safety.setAsset(assetRepository.findById(sDto.getAssetId())
                        .orElseThrow(() -> new IllegalArgumentException("Safety asset not found")));
                safety.setQty(sDto.getQty());
                header.getSafetyEquipment().add(safety);
            }
        }

        // Manpower
        if (saveDto.getManpower() != null) {
            for (PackingProcedureSaveDto.ManpowerSaveDto mDto : saveDto.getManpower()) {
                ProcedureManpower manpower = new ProcedureManpower();
                manpower.setProcedureHeader(header);
                manpower.setDepartment(departmentRepository.findById(mDto.getDepartmentId())
                        .orElseThrow(() -> new IllegalArgumentException("Department not found")));
                manpower.setDesignation(designationRepository.findById(mDto.getDesignationId())
                        .orElseThrow(() -> new IllegalArgumentException("Designation not found")));
                manpower.setQty(mDto.getQty());
                header.getManpower().add(manpower);
            }
        }

        // Steps
        if (saveDto.getSteps() != null) {
            for (PackingProcedureSaveDto.StepSaveDto sDto : saveDto.getSteps()) {
                ProcedureStep step = new ProcedureStep();
                step.setProcedureHeader(header);
                step.setStepNo(sDto.getStepNo());
                step.setSpendingMinutes(sDto.getSpendingMinutes());
                step.setRequiredItems(sDto.getRequiredItems());
                step.setProcedureDescription(sDto.getProcedureDescription());
                header.getSteps().add(step);
            }
        }
    }

    private PackingProcedureDetailsDto convertToDetailsDto(PackingProcedureHeader h) {
        PackingProcedureDetailsDto dto = new PackingProcedureDetailsDto();
        dto.setId(h.getId());
        dto.setProcessId(h.getProcess().getId());
        dto.setProcessName(h.getProcess().getProcessName());
        dto.setProductId(h.getProduct().getId());
        dto.setPartNo(h.getProduct().getItemNo());
        dto.setPartName(h.getProduct().getItemName());
        dto.setDocNo(h.getDocNo());
        dto.setRevNo(h.getRevNo());
        dto.setRevDate(h.getRevDate());
        dto.setApprovalStatus(h.getApprovalStatus());
        dto.setIsActive(h.getIsActive());
        dto.setDivisionId(h.getDivisionId());
        dto.setCompanyId(h.getCompanyId());

        dto.setConsumables(h.getConsumables().stream().map(c -> {
            PackingProcedureDetailsDto.ConsumableDto cDto = new PackingProcedureDetailsDto.ConsumableDto();
            cDto.setId(c.getId());
            cDto.setProductId(c.getProduct().getId());
            cDto.setItemNo(c.getProduct().getItemNo());
            cDto.setItemName(c.getProduct().getItemName());
            cDto.setUom(c.getProduct().getUom());
            cDto.setQty(c.getQty());
            return cDto;
        }).collect(Collectors.toList()));

        dto.setTools(h.getTools().stream().map(t -> {
            PackingProcedureDetailsDto.ToolDto tDto = new PackingProcedureDetailsDto.ToolDto();
            tDto.setId(t.getId());
            tDto.setAssetId(t.getAsset().getId());
            tDto.setAssetNo(t.getAsset().getAssetNo());
            tDto.setAssetName(t.getAsset().getAssetName());
            tDto.setUom(t.getAsset().getAssetSubtype()); // Use subtype or descriptive uom
            tDto.setQty(t.getQty());
            return tDto;
        }).collect(Collectors.toList()));

        dto.setSafetyEquipment(h.getSafetyEquipment().stream().map(s -> {
            PackingProcedureDetailsDto.SafetyEquipDto sDto = new PackingProcedureDetailsDto.SafetyEquipDto();
            sDto.setId(s.getId());
            sDto.setAssetId(s.getAsset().getId());
            sDto.setAssetNo(s.getAsset().getAssetNo());
            sDto.setAssetName(s.getAsset().getAssetName());
            sDto.setUom(s.getAsset().getAssetSubtype());
            sDto.setQty(s.getQty());
            return sDto;
        }).collect(Collectors.toList()));

        dto.setManpower(h.getManpower().stream().map(m -> {
            PackingProcedureDetailsDto.ManpowerDto mDto = new PackingProcedureDetailsDto.ManpowerDto();
            mDto.setId(m.getId());
            mDto.setDepartmentId(m.getDepartment().getId());
            mDto.setDepartmentName(m.getDepartment().getDepartmentName());
            mDto.setDesignationId(m.getDesignation().getId());
            mDto.setDesignationName(m.getDesignation().getDesignationName());
            mDto.setQty(m.getQty());
            return mDto;
        }).collect(Collectors.toList()));

        dto.setSteps(h.getSteps().stream().map(s -> {
            PackingProcedureDetailsDto.StepDto sDto = new PackingProcedureDetailsDto.StepDto();
            sDto.setId(s.getId());
            sDto.setStepNo(s.getStepNo());
            sDto.setSpendingMinutes(s.getSpendingMinutes());
            sDto.setRequiredItems(s.getRequiredItems());
            sDto.setProcedureDescription(s.getProcedureDescription());
            return sDto;
        }).collect(Collectors.toList()));

        return dto;
    }
}
