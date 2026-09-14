package com.autonoma.erp.modules.hra.recruitment.service;


import com.autonoma.erp.modules.hra.recruitment.entity.InterviewMaster;
import com.autonoma.erp.modules.hra.recruitment.entity.InterviewDepartmentMapping;
import com.autonoma.erp.modules.hra.recruitment.entity.InterviewLevelMapping;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.entity.DesignationLevel;
import com.autonoma.erp.modules.hra.recruitment.repository.InterviewMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationLevelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class InterviewMasterService {

    @Autowired
    private InterviewMasterRepository repository;

    @Autowired
    private DepartmentRepository departmentRepo;

    @Autowired
    private DesignationLevelRepository designationLevelRepo;

    public List<InterviewMaster> getAll() {
        return repository.findAll();
    }

    public Optional<InterviewMaster> getById(Long id) {
        if (id == null) return Optional.empty();
        return repository.findById(id);
    }

    @Transactional
    public InterviewMaster save(InterviewMaster entity, String currentUser) {
        // Basic Validations
        if (entity.getCriteriaDetails() == null || entity.getCriteriaDetails().trim().isEmpty()) {
            throw new RuntimeException("Criteria Details are mandatory.");
        }
        if (entity.getCriteriaDetails().length() > 300) {
            throw new RuntimeException("Criteria Details must not exceed 300 characters.");
        }
        if (entity.getAnswer() == null || entity.getAnswer().trim().isEmpty()) {
            throw new RuntimeException("Answer is mandatory.");
        }
        if (entity.getDepartmentCodes() == null || entity.getDepartmentCodes().trim().isEmpty()) {
            throw new RuntimeException("At least one Department must be selected.");
        }
        if (entity.getLevelCodes() == null || entity.getLevelCodes().trim().isEmpty()) {
            throw new RuntimeException("At least one Level must be selected.");
        }
        if (entity.getInterviewRound() == null || entity.getInterviewRound().trim().isEmpty()) {
            throw new RuntimeException("Interview Round is mandatory.");
        }

        // Duplicate Check (Same Details + Same Dept + Same Level + Same Round)
        List<InterviewMaster> all = repository.findByCriteriaDetailsIgnoreCaseAndInterviewRoundIgnoreCaseAndStatus(
                entity.getCriteriaDetails(), entity.getInterviewRound(), true);
        for (InterviewMaster existing : all) {
            // Only block if an ACTIVE duplicate exists (excluding the current record being edited)
            // Helper to normalize comma-separated strings for comparison
            java.util.function.Function<String, String> normalize = (s) -> {
                if (s == null) return "";
                return java.util.Arrays.stream(s.split(","))
                        .map(String::trim)
                        .filter(str -> !str.isEmpty())
                        .sorted()
                        .collect(java.util.stream.Collectors.joining(","));
            };

            if (normalize.apply(existing.getDepartmentCodes()).equals(normalize.apply(entity.getDepartmentCodes())) &&
                normalize.apply(existing.getLevelCodes()).equals(normalize.apply(entity.getLevelCodes()))) {
                
                if (entity.getId() == null || !entity.getId().equals(existing.getId())) {
                    throw new RuntimeException("An active Interview Criteria with these details already exists for the selected Department, Level, and Round.");
                }
            }
        }

        InterviewMaster target;
        if (entity.getId() == null) {
            target = entity;
            target.setCreatedAt(new Date());
            target.setCreatedBy(currentUser);
            if (target.getStatus() == null) {
                target.setStatus(true);
            }
        } else {
            Long entityId = entity.getId();
            target = repository.findById(entityId)
                    .orElseThrow(() -> new RuntimeException("Interview Criteria not found."));
            
            // Sync fields
            target.setCriteriaDetails(entity.getCriteriaDetails());
            target.setAnswer(entity.getAnswer());
            target.setInterviewRound(entity.getInterviewRound());
            target.setAttachmentRequired(entity.getAttachmentRequired());
            target.setInterviewAttachment(entity.getInterviewAttachment());
            target.setDepartmentCodes(entity.getDepartmentCodes());
            target.setLevelCodes(entity.getLevelCodes());
            
            target.setUpdatedAt(new Date());
            target.setUpdatedBy(currentUser);
            if (entity.getStatus() != null) {
                target.setStatus(entity.getStatus());
            }
        }

        // Rebuild department mappings (departmentCodes contains comma-separated department IDs)
        if (entity.getDepartmentCodes() != null) {
            java.util.Set<InterviewDepartmentMapping> mappings = new java.util.HashSet<>();
            for (String code : entity.getDepartmentCodes().split(",")) {
                String trimmed = code.trim();
                if (trimmed.isEmpty()) continue;
                try {
                    Long deptId = Long.parseLong(trimmed);
                    Optional<Department> deptOpt = departmentRepo.findById(deptId);
                    if (deptOpt.isPresent()) {
                        InterviewDepartmentMapping m = new InterviewDepartmentMapping();
                        m.setDepartmentId(deptOpt.get().getId());
                        m.setDepartment(deptOpt.get());
                        mappings.add(m);
                    }
                } catch (NumberFormatException e) {
                    // Fallback: try findByDepartmentNo for backward compatibility
                    Optional<Department> deptOpt = departmentRepo.findByDepartmentNo(trimmed);
                    if (deptOpt.isPresent()) {
                        InterviewDepartmentMapping m = new InterviewDepartmentMapping();
                        m.setDepartmentId(deptOpt.get().getId());
                        m.setDepartment(deptOpt.get());
                        mappings.add(m);
                    }
                }
            }
            if (target.getDepartmentMappings() == null) {
                target.setDepartmentMappings(mappings);
            } else {
                target.getDepartmentMappings().clear();
                target.getDepartmentMappings().addAll(mappings);
            }
        }

        // Rebuild level mappings
        if (entity.getLevelCodes() != null) {
            java.util.Set<InterviewLevelMapping> mappings = new java.util.HashSet<>();
            for (String code : entity.getLevelCodes().split(",")) {
                Optional<DesignationLevel> lvlOpt = designationLevelRepo.findByLevel(code.trim());
                if (lvlOpt.isPresent()) {
                    InterviewLevelMapping m = new InterviewLevelMapping();
                    m.setLevelId(lvlOpt.get().getRowId());
                    m.setDesignationLevel(lvlOpt.get());
                    mappings.add(m);
                }
            }
            if (target.getLevelMappings() == null) {
                target.setLevelMappings(mappings);
            } else {
                target.getLevelMappings().clear();
                target.getLevelMappings().addAll(mappings);
            }
        }

        return repository.save(target);
    }

    public Long getNextSequence() {
        Long maxId = repository.findMaxId();
        return (maxId == null ? 0L : maxId) + 1;
    }

    @Transactional
    public void delete(Long id) {
        if (id == null) {
            throw new RuntimeException("ID is mandatory for delete.");
        }
        repository.deleteById(id);
    }
}
