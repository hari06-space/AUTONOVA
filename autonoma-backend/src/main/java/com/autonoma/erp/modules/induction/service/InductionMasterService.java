package com.autonoma.erp.modules.induction.service;

import com.autonoma.erp.modules.induction.repository.InductionTrainingDetailRepository;
import com.autonoma.erp.modules.induction.entity.InductionMaster;
import com.autonoma.erp.modules.induction.entity.InductionDepartmentMapping;
import com.autonoma.erp.modules.induction.entity.InductionLevelMapping;
import com.autonoma.erp.modules.induction.entity.HrAttachmentPath;
import com.autonoma.erp.modules.induction.entity.InductionRoundMaster;
import com.autonoma.erp.modules.induction.repository.InductionMasterRepository;
import com.autonoma.erp.modules.induction.repository.InductionDepartmentMappingRepository;
import com.autonoma.erp.modules.induction.repository.InductionLevelMappingRepository;
import com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository;
import com.autonoma.erp.modules.induction.repository.InductionRoundMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.LevelMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Arrays;
import java.util.Objects;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InductionMasterService {

    @Autowired
    private InductionMasterRepository repository;

    @Autowired
    private InductionTrainingDetailRepository trainingDetailRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private LevelMasterRepository levelMasterRepository;

    @Autowired
    private InductionDepartmentMappingRepository deptMappingRepo;

    @Autowired
    private InductionLevelMappingRepository levelMappingRepo;

    @Autowired
    private HrAttachmentPathRepository attachmentRepo;

    @Autowired
    private InductionRoundMasterRepository roundRepo;

    public List<InductionMaster> getAll() {
        List<InductionMaster> list = repository.findAll();
        if (list.isEmpty()) {
            return list;
        }

        List<Long> inductionIds = list.stream().map(InductionMaster::getId).collect(Collectors.toList());

        // Batch fetch master lookups
        List<Department> allDepts = departmentRepository.findAll();
        Map<Long, String> deptIdToNoMap = allDepts.stream()
                .filter(d -> d.getId() != null)
                .collect(Collectors.toMap(Department::getId, Department::getDepartmentNo, (v1, v2) -> v1));

        List<LevelMaster> allLevels = levelMasterRepository.findAll();
        Map<Long, String> levelIdToNameMap = allLevels.stream()
                .filter(l -> l.getId() != null)
                .collect(Collectors.toMap(LevelMaster::getId, LevelMaster::getLevelName, (v1, v2) -> v1));

        // Batch fetch mappings
        List<InductionDepartmentMapping> allDeptMappings = deptMappingRepo.findByInductionIdIn(inductionIds);
        Map<Long, List<InductionDepartmentMapping>> deptMappingsGrouped = allDeptMappings.stream()
                .collect(Collectors.groupingBy(InductionDepartmentMapping::getInductionId));

        List<InductionLevelMapping> allLevelMappings = levelMappingRepo.findByInductionIdIn(inductionIds);
        Map<Long, List<InductionLevelMapping>> levelMappingsGrouped = allLevelMappings.stream()
                .collect(Collectors.groupingBy(InductionLevelMapping::getInductionId));

        List<HrAttachmentPath> allAttachments = attachmentRepo.findByPageCodeAndRefIdInAndDocType("M2140", inductionIds, "INDUCTION_ATTACHMENT");
        Map<Long, String> attachmentMap = allAttachments.stream()
                .filter(a -> a.getPath() != null && !a.getPath().trim().isEmpty())
                .collect(Collectors.groupingBy(
                        HrAttachmentPath::getRefId,
                        Collectors.collectingAndThen(
                                Collectors.mapping(a -> a.getPath().trim(),
                                        Collectors.toCollection(java.util.LinkedHashSet::new)),
                                paths -> String.join(",", paths)
                        )
                ));

        // Perform in-memory mapping to solve N+1 query overhead
        for (InductionMaster m : list) {
            List<InductionDepartmentMapping> deptMappings = deptMappingsGrouped.getOrDefault(m.getId(), List.of());
            String deptCodes = deptMappings.stream()
                    .map(mapping -> {
                        String dno = deptIdToNoMap.get(mapping.getDepartmentId());
                        // If departmentNo is empty/null, fall back to the ID string
                        if (dno != null && !dno.trim().isEmpty()) return dno;
                        return mapping.getDepartmentId() != null ? mapping.getDepartmentId().toString() : null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining(","));
            m.setDepartmentCodes(deptCodes);

            List<InductionLevelMapping> lvlMappings = levelMappingsGrouped.getOrDefault(m.getId(), List.of());
            String lvlCodes = lvlMappings.stream()
                    .map(mapping -> levelIdToNameMap.get(mapping.getLevelId()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining(","));
            m.setLevelCodes(lvlCodes);

            String paths = attachmentMap.get(m.getId());
            m.setInductionAttachment(paths != null ? paths : "");
        }

        return list;
    }

    public Optional<InductionMaster> getById(Long id) {
        Optional<InductionMaster> opt = repository.findById(id);
        opt.ifPresent(this::populateTransientFields);
        return opt;
    }

    private void populateTransientFields(InductionMaster m) {
        // Load department codes
        List<InductionDepartmentMapping> deptMappings = deptMappingRepo.findByInductionId(m.getId());
        String deptCodes = deptMappings.stream()
                .map(mapping -> departmentRepository.findById(mapping.getDepartmentId()))
                .filter(Optional::isPresent)
                .map(opt -> {
                    String dno = opt.get().getDepartmentNo();
                    // If departmentNo is empty/null, fall back to the ID string
                    if (dno != null && !dno.trim().isEmpty()) return dno;
                    return opt.get().getId() != null ? opt.get().getId().toString() : null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.joining(","));
        m.setDepartmentCodes(deptCodes);

        // Load level codes
        List<InductionLevelMapping> lvlMappings = levelMappingRepo.findByInductionId(m.getId());
        String lvlCodes = lvlMappings.stream()
                .map(mapping -> levelMasterRepository.findById(mapping.getLevelId()))
                .filter(Optional::isPresent)
                .map(opt -> opt.get().getLevelName())
                .collect(Collectors.joining(","));
        m.setLevelCodes(lvlCodes);

        // Load attachment
        List<HrAttachmentPath> attachments = attachmentRepo.findAllByPageCodeAndRefIdAndDocType("M2140", m.getId(), "INDUCTION_ATTACHMENT");
        if (!attachments.isEmpty()) {
            String paths = attachments.stream()
                    .map(HrAttachmentPath::getPath)
                    .collect(Collectors.joining(","));
            m.setInductionAttachment(paths);
        } else {
            m.setInductionAttachment("");
        }
    }

    @Transactional
    public InductionMaster save(InductionMaster entity, String currentUser) {
        // Resolve InductionRoundMaster from inductionRound string
        if (entity.getInductionRound() != null && !entity.getInductionRound().trim().isEmpty()) {
            Optional<InductionRoundMaster> roundOpt = roundRepo.findByRoundName(entity.getInductionRound());
            if (roundOpt.isPresent()) {
                entity.setInductionRoundMaster(roundOpt.get());
            } else {
                throw new RuntimeException("Invalid Induction Round: " + entity.getInductionRound());
            }
        } else {
            entity.setInductionRoundMaster(null);
        }

        // Basic Validations
        if (entity.getInductionDetails() == null || entity.getInductionDetails().trim().isEmpty()) {
            throw new RuntimeException("Induction Details are mandatory.");
        }
        // Note: departmentCodes validation is deferred to after mapping resolution below
        if (entity.getLevelCodes() == null || entity.getLevelCodes().trim().isEmpty()) {
            throw new RuntimeException("At least one Level must be selected.");
        }

        // Level selection rules validation
        List<String> selectedLevels = Arrays.stream(entity.getLevelCodes().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        if (selectedLevels.contains("L1") && selectedLevels.size() < 2) {
            throw new RuntimeException("Minimum 2 levels must be selected when Level L1 is chosen.");
        }
        if ((selectedLevels.contains("L6") || selectedLevels.contains("L7")) && selectedLevels.size() < 3) {
            throw new RuntimeException("Minimum 3 levels must be selected when Level L6 or L7 is chosen.");
        }

        // Duplicate Check (Same Details + Same Dept + Same Level)
        List<InductionMaster> all = repository.findByInductionDetailsIgnoreCaseAndIsActive(entity.getInductionDetails(), true);
        for (InductionMaster existing : all) {
            java.util.function.Function<String, String> normalize = (s) -> {
                if (s == null) return "";
                return Arrays.stream(s.split(","))
                        .map(String::trim)
                        .filter(str -> !str.isEmpty())
                        .sorted()
                        .collect(Collectors.joining(","));
            };

            if (normalize.apply(existing.getDepartmentCodes()).equals(normalize.apply(entity.getDepartmentCodes())) &&
                normalize.apply(existing.getLevelCodes()).equals(normalize.apply(entity.getLevelCodes()))) {
                
                if (entity.getId() == null || !entity.getId().equals(existing.getId())) {
                    throw new RuntimeException("An active Induction Criteria with these details already exists for the selected Department and Level.");
                }
            }
        }

        if (entity.getId() == null) {
            entity.setCreatedAt(new Date());
            entity.setCreatedBy(currentUser);
            if (entity.getIsActive() == null) {
                entity.setIsActive(true);
            }
        } else {
            InductionMaster existing = repository.findById(entity.getId())
                    .orElseThrow(() -> new RuntimeException("Induction Criteria not found."));
            entity.setCreatedAt(existing.getCreatedAt());
            entity.setCreatedBy(existing.getCreatedBy());
            entity.setUpdatedAt(new Date());
            entity.setUpdatedBy(currentUser);
            if (entity.getIsActive() == null) {
                entity.setIsActive(existing.getIsActive() != null ? existing.getIsActive() : true);
            }
        }

        // Save Induction Master Entity
        InductionMaster saved = repository.save(entity);

        // Update Department Mappings
        deptMappingRepo.deleteByInductionId(saved.getId());
        deptMappingRepo.flush();
        List<String> deptNos = Arrays.stream(entity.getDepartmentCodes().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        int mappedDeptsCount = 0;
        java.util.Set<Long> mappedDeptIds = new java.util.HashSet<>();
        for (String deptCode : deptNos) {
            // Try lookup by departmentNo first; if not found, try by ID (when departmentNo is empty)
            Optional<Department> deptOpt = departmentRepository.findAll().stream()
                    .filter(d -> d.getDepartmentNo() != null && d.getDepartmentNo().equalsIgnoreCase(deptCode))
                    .findFirst();
            if (!deptOpt.isPresent()) {
                // fallback: treat deptCode as a numeric ID string
                try {
                    Long deptId = Long.parseLong(deptCode);
                    deptOpt = departmentRepository.findById(deptId);
                } catch (NumberFormatException ignored) {}
            }
            if (deptOpt.isPresent()) {
                Long deptId = deptOpt.get().getId();
                if (mappedDeptIds.add(deptId)) {
                    InductionDepartmentMapping mapping = new InductionDepartmentMapping();
                    mapping.setInductionId(saved.getId());
                    mapping.setDepartmentId(deptId);
                    mapping.setCreatedBy(currentUser);
                    mapping.setCreatedDate(new Date());
                    deptMappingRepo.save(mapping);
                    mappedDeptsCount++;
                }
            }
        }
        if (mappedDeptsCount == 0) {
            throw new RuntimeException("At least one Department must be selected.");
        }

        // Update Level Mappings
        levelMappingRepo.deleteByInductionId(saved.getId());
        levelMappingRepo.flush();
        List<String> lvlNames = Arrays.stream(entity.getLevelCodes().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        java.util.Set<Long> mappedLevelIds = new java.util.HashSet<>();
        for (String lvlName : lvlNames) {
            Optional<LevelMaster> lvlOpt = levelMasterRepository.findAll().stream()
                    .filter(l -> l.getLevelName().equalsIgnoreCase(lvlName))
                    .findFirst();
            if (lvlOpt.isPresent()) {
                Long lvlId = lvlOpt.get().getId();
                if (mappedLevelIds.add(lvlId)) {
                    InductionLevelMapping mapping = new InductionLevelMapping();
                    mapping.setInductionId(saved.getId());
                    mapping.setLevelId(lvlId);
                    mapping.setCreatedBy(currentUser);
                    mapping.setCreatedDate(new Date());
                    levelMappingRepo.save(mapping);
                }
            }
        }

        // Update Attachment
        attachmentRepo.deleteByPageCodeAndRefIdAndDocType("M2140", saved.getId(), "INDUCTION_ATTACHMENT");
        if (entity.getInductionAttachment() != null && !entity.getInductionAttachment().trim().isEmpty()) {
            String[] filePaths = entity.getInductionAttachment().split(",");
            for (String filePath : filePaths) {
                if (filePath.trim().isEmpty()) continue;
                HrAttachmentPath path = new HrAttachmentPath();
                path.setPageCode("M2140");
                path.setRefId(saved.getId());
                path.setDocType("INDUCTION_ATTACHMENT");
                path.setPath(filePath.trim());
                String fileName = filePath.trim();
                if (fileName.contains("/")) {
                    fileName = fileName.substring(fileName.lastIndexOf("/") + 1);
                }
                path.setFileName(fileName);
                path.setCreatedBy(currentUser);
                path.setCreatedDate(new Date());
                attachmentRepo.save(path);
            }
        }

        populateTransientFields(saved);
        return saved;
    }

    public Long getNextSequence() {
        Long maxId = repository.findMaxId();
        return (maxId == null ? 0L : maxId) + 1;
    }

    @Transactional
    public void delete(Long id) {
        InductionMaster existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Induction Criteria not found."));
        
        // Restrict deletion if induction already assigned/used in responses
        if (trainingDetailRepository.existsByInductionMasterId(id)) {
            throw new RuntimeException("Cannot delete this induction criteria because it is already assigned to trainees.");
        }
        
        deptMappingRepo.deleteByInductionId(id);
        levelMappingRepo.deleteByInductionId(id);
        attachmentRepo.deleteByPageCodeAndRefIdAndDocType("M2140", id, "INDUCTION_ATTACHMENT");
        repository.delete(existing);
    }
}
