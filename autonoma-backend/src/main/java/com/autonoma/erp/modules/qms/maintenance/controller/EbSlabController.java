package com.autonoma.erp.modules.qms.maintenance.controller;

import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.qms.maintenance.entity.EbSlab;
import com.autonoma.erp.modules.qms.maintenance.repository.EbSlabRepository;
import com.autonoma.erp.modules.qms.maintenance.service.EbSlabService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/master/qms/eb-slab")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class EbSlabController {

    private final EbSlabRepository repository;
    private final EbSlabService slabService;

    public EbSlabController(EbSlabRepository repository, EbSlabService slabService) {
        this.repository = repository;
        this.slabService = slabService;
    }

    @GetMapping
    public ResponseEntity<List<EbSlabDto>> getAllSlabMasters() {
        try {
            List<EbSlab> allRows = repository.findAll();
            // Group by effectFrom
            Map<LocalDate, List<EbSlab>> grouped = allRows.stream()
                    .collect(Collectors.groupingBy(EbSlab::getEffectFrom));

            List<EbSlabDto> dtos = new ArrayList<>();
            for (Map.Entry<LocalDate, List<EbSlab>> entry : grouped.entrySet()) {
                List<EbSlab> groupRows = entry.getValue();
                groupRows.sort(Comparator.comparing(EbSlab::getSeqNo));
                
                EbSlab first = groupRows.get(0);
                EbSlabDto dto = new EbSlabDto();
                dto.setId(first.getId());
                dto.setEffectFrom(entry.getKey());
                dto.setStatus(first.getStatus());
                dto.setIsActive(first.getIsActive());
                dto.setCreatedUser(first.getCreatedUser());
                dto.setCreatedDate(first.getCreatedDate());
                dto.setUpdatedUser(first.getUpdatedUser());
                dto.setUpdatedDate(first.getUpdatedDate());
                
                dto.setDetails(groupRows.stream().map(row -> {
                    EbSlabDetailDto detailDto = new EbSlabDetailDto();
                    detailDto.setId(row.getId());
                    detailDto.setSeqNo(row.getSeqNo());
                    detailDto.setFromUnit(row.getFromUnit());
                    detailDto.setToUnit(row.getToUnit());
                    detailDto.setPrice(row.getPrice());
                    detailDto.setIsActive(row.getIsActive());
                    return detailDto;
                }).collect(Collectors.toList()));
                
                dtos.add(dto);
            }

            // Sort by effectFrom descending
            dtos.sort((a, b) -> b.getEffectFrom().compareTo(a.getEffectFrom()));
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<EbSlabDto> getSlabMasterById(@PathVariable Long id) {
        Optional<EbSlab> foundOpt = repository.findById(id);
        if (foundOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        EbSlab found = foundOpt.get();
        List<EbSlab> groupRows = repository.findByEffectFromOrderBySeqNo(found.getEffectFrom());
        if (groupRows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        EbSlab first = groupRows.get(0);
        EbSlabDto dto = new EbSlabDto();
        dto.setId(first.getId());
        dto.setEffectFrom(first.getEffectFrom());
        dto.setStatus(first.getStatus());
        dto.setIsActive(first.getIsActive());
        dto.setCreatedUser(first.getCreatedUser());
        dto.setCreatedDate(first.getCreatedDate());
        dto.setUpdatedUser(first.getUpdatedUser());
        dto.setUpdatedDate(first.getUpdatedDate());

        dto.setDetails(groupRows.stream().map(row -> {
            EbSlabDetailDto detailDto = new EbSlabDetailDto();
            detailDto.setId(row.getId());
            detailDto.setSeqNo(row.getSeqNo());
            detailDto.setFromUnit(row.getFromUnit());
            detailDto.setToUnit(row.getToUnit());
            detailDto.setPrice(row.getPrice());
            detailDto.setIsActive(row.getIsActive());
            return detailDto;
        }).collect(Collectors.toList()));

        return ResponseEntity.ok(dto);
    }

    private ResponseEntity<?> validateEbSlabMaster(EbSlabDto master) {
        if (master.getDetails() == null || master.getDetails().isEmpty()) {
            return ResponseEntity.badRequest().body("Please add at least one slab detail row.");
        }

        for (EbSlabDetailDto detail : master.getDetails()) {
            if (detail.getPrice() == null || detail.getPrice().doubleValue() <= 0) {
                return ResponseEntity.badRequest().body("Price must be greater than 0 in row " + detail.getSeqNo() + ".");
            }
            if (detail.getToUnit() == null || detail.getToUnit() <= 0) {
                return ResponseEntity.badRequest().body("To Unit must be greater than 0 in row " + detail.getSeqNo() + ".");
            }
            if (detail.getFromUnit() == null || detail.getToUnit() <= detail.getFromUnit()) {
                return ResponseEntity.badRequest().body("To Unit must be greater than From Unit in row " + detail.getSeqNo() + ".");
            }
        }
        return null;
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M1410", action = "write")
    public ResponseEntity<?> createSlabMaster(@RequestBody EbSlabDto master) {
        try {
            if (master.getEffectFrom() == null) {
                return ResponseEntity.badRequest().body("Effect From date is required.");
            }

            if (repository.existsByEffectFrom(master.getEffectFrom())) {
                return ResponseEntity.badRequest().body("Slab config for " + master.getEffectFrom() + " already exists.");
            }

            ResponseEntity<?> validationError = validateEbSlabMaster(master);
            if (validationError != null) {
                return validationError;
            }

            boolean isActive = master.getIsActive() != null ? master.getIsActive() : 
                               (master.getStatus() == null || "ACTIVE".equalsIgnoreCase(master.getStatus()));
            String status = master.getStatus() != null ? master.getStatus() : "ACTIVE";
            slabService.deactivateOtherSlabs(master.getEffectFrom());

            List<EbSlab> newRows = master.getDetails().stream().map(detailDto -> {
                EbSlab entity = new EbSlab();
                entity.setEffectFrom(master.getEffectFrom());
                entity.setStatus(status);
                entity.setIsActive(isActive);
                entity.setSeqNo(detailDto.getSeqNo());
                entity.setFromUnit(detailDto.getFromUnit());
                entity.setToUnit(detailDto.getToUnit());
                entity.setPrice(detailDto.getPrice());
                return entity;
            }).collect(Collectors.toList());

            List<EbSlab> savedRows = slabService.saveSlabRows(newRows);
            
            // Build response
            EbSlab first = savedRows.get(0);
            EbSlabDto responseDto = new EbSlabDto();
            responseDto.setId(first.getId());
            responseDto.setEffectFrom(first.getEffectFrom());
            responseDto.setStatus(first.getStatus());
            responseDto.setIsActive(first.getIsActive());
            responseDto.setCreatedUser(first.getCreatedUser());
            responseDto.setCreatedDate(first.getCreatedDate());
            responseDto.setUpdatedUser(null);
            responseDto.setUpdatedDate(null);
            responseDto.setDetails(savedRows.stream().map(row -> {
                EbSlabDetailDto d = new EbSlabDetailDto();
                d.setId(row.getId());
                d.setSeqNo(row.getSeqNo());
                d.setFromUnit(row.getFromUnit());
                d.setToUnit(row.getToUnit());
                d.setPrice(row.getPrice());
                d.setIsActive(row.getIsActive());
                return d;
            }).collect(Collectors.toList()));

            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create Slab: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M1410", action = "write")
    public ResponseEntity<?> updateSlabMaster(@PathVariable Long id, @RequestBody EbSlabDto master) {
        try {
            Optional<EbSlab> existingOpt = repository.findById(id);
            if (existingOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            EbSlab existing = existingOpt.get();
            LocalDate oldEffectFrom = existing.getEffectFrom();

            if (master.getEffectFrom() == null) {
                return ResponseEntity.badRequest().body("Effect From date is required.");
            }

            if (!master.getEffectFrom().equals(oldEffectFrom) && repository.existsByEffectFrom(master.getEffectFrom())) {
                return ResponseEntity.badRequest().body("Slab config for " + master.getEffectFrom() + " already exists.");
            }

            ResponseEntity<?> validationError = validateEbSlabMaster(master);
            if (validationError != null) {
                return validationError;
            }

            List<EbSlab> oldRows = repository.findByEffectFromOrderBySeqNo(oldEffectFrom);
            
            // Capture original creation info to preserve it
            String originalCreatedBy = oldRows.isEmpty() ? null : oldRows.get(0).getCreatedUser();
            Date originalCreatedDate = oldRows.isEmpty() ? null : oldRows.get(0).getCreatedDate();

            // Delete old rows
            repository.deleteAll(oldRows);

            boolean isActive = "ACTIVE".equalsIgnoreCase(master.getStatus());
            if (isActive) {
                slabService.deactivateOtherSlabs(master.getEffectFrom());
            }

            String currentUser = null;
            try {
                currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {}
            if (currentUser == null || currentUser.trim().isEmpty()) {
                currentUser = "Admin";
            }
            Date now = new Date();

            // Create new rows
            final String finalCurrentUser = currentUser;
            final Date finalNow = now;
            List<EbSlab> newRows = master.getDetails().stream().map(detailDto -> {
                EbSlab entity = new EbSlab();
                entity.setEffectFrom(master.getEffectFrom());
                entity.setStatus(isActive ? "ACTIVE" : "INACTIVE");
                entity.setIsActive(isActive);
                entity.setSeqNo(detailDto.getSeqNo());
                entity.setFromUnit(detailDto.getFromUnit());
                entity.setToUnit(detailDto.getToUnit());
                entity.setPrice(detailDto.getPrice());
                
                // Preserve original creation details
                entity.setCreatedUser(originalCreatedBy);
                entity.setCreatedDate(originalCreatedDate);

                // Set edit/update details since this is an updateSlabMaster operation
                entity.setUpdatedUser(finalCurrentUser);
                entity.setUpdatedDate(finalNow);
                entity.setPreserveUpdateAudit(true);
                return entity;
            }).collect(Collectors.toList());

            List<EbSlab> savedRows = slabService.saveSlabRows(newRows);

            // Build response
            EbSlab first = savedRows.get(0);
            EbSlabDto responseDto = new EbSlabDto();
            responseDto.setId(first.getId());
            responseDto.setEffectFrom(first.getEffectFrom());
            responseDto.setStatus(first.getStatus());
            responseDto.setIsActive(first.getIsActive());
            responseDto.setCreatedUser(first.getCreatedUser());
            responseDto.setCreatedDate(first.getCreatedDate());
            responseDto.setUpdatedUser(first.getUpdatedUser());
            responseDto.setUpdatedDate(first.getUpdatedDate());
            responseDto.setDetails(savedRows.stream().map(row -> {
                EbSlabDetailDto d = new EbSlabDetailDto();
                d.setId(row.getId());
                d.setSeqNo(row.getSeqNo());
                d.setFromUnit(row.getFromUnit());
                d.setToUnit(row.getToUnit());
                d.setPrice(row.getPrice());
                d.setIsActive(row.getIsActive());
                return d;
            }).collect(Collectors.toList()));

            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update Slab: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M1410", action = "delete")
    public ResponseEntity<?> deleteSlabMaster(@PathVariable Long id) {
        try {
            Optional<EbSlab> existingOpt = repository.findById(id);
            if (existingOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            EbSlab existing = existingOpt.get();
            slabService.deleteSlab(existing.getEffectFrom());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete Slab: " + e.getMessage());
        }
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EbSlabDto {
        private Long id;
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate effectFrom;
        private String status;
        private Boolean isActive;
        private String createdUser;
        private Date createdDate;
        private String updatedUser;
        private Date updatedDate;
        private List<EbSlabDetailDto> details;

        @com.fasterxml.jackson.annotation.JsonProperty("createdBy")
        public String getCreatedBy() {
            return createdUser;
        }

        public void setCreatedBy(String createdBy) {
            this.createdUser = createdBy;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("updatedBy")
        public String getUpdatedBy() {
            return updatedUser;
        }

        public void setUpdatedBy(String updatedBy) {
            this.updatedUser = updatedBy;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
        public Date getCreatedAt() {
            return createdDate;
        }

        public void setCreatedAt(Date createdAt) {
            this.createdDate = createdAt;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("updatedAt")
        public Date getUpdatedAt() {
            return updatedDate;
        }

        public void setUpdatedAt(Date updatedAt) {
            this.updatedDate = updatedAt;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public LocalDate getEffectFrom() { return effectFrom; }
        public void setEffectFrom(LocalDate effectFrom) { this.effectFrom = effectFrom; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
        public String getCreatedUser() { return createdUser; }
        public void setCreatedUser(String createdUser) { this.createdUser = createdUser; }
        public Date getCreatedDate() { return createdDate; }
        public void setCreatedDate(Date createdDate) { this.createdDate = createdDate; }
        public String getUpdatedUser() { return updatedUser; }
        public void setUpdatedUser(String updatedUser) { this.updatedUser = updatedUser; }
        public Date getUpdatedDate() { return updatedDate; }
        public void setUpdatedDate(Date updatedDate) { this.updatedDate = updatedDate; }
        public List<EbSlabDetailDto> getDetails() { return details; }
        public void setDetails(List<EbSlabDetailDto> details) { this.details = details; }
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EbSlabDetailDto {
        private Long id;
        private Integer seqNo;
        private Integer fromUnit;
        private Integer toUnit;
        private BigDecimal price;
        private Boolean isActive;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Integer getSeqNo() { return seqNo; }
        public void setSeqNo(Integer seqNo) { this.seqNo = seqNo; }
        public Integer getFromUnit() { return fromUnit; }
        public void setFromUnit(Integer fromUnit) { this.fromUnit = fromUnit; }
        public Integer getToUnit() { return toUnit; }
        public void setToUnit(Integer toUnit) { this.toUnit = toUnit; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    }
}
