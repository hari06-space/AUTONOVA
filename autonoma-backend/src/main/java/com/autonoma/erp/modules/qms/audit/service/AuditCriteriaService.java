package com.autonoma.erp.modules.qms.audit.service;

import com.autonoma.erp.modules.qms.audit.entity.AuditCriteria;
import com.autonoma.erp.modules.qms.audit.repository.AuditCriteriaRepository;
import com.autonoma.erp.modules.qms.audit.entity.AuditDepartment;
import com.autonoma.erp.modules.qms.audit.repository.AuditDepartmentRepository;
import com.autonoma.erp.modules.qms.meeting.entity.QmsAttachmentPath;
import com.autonoma.erp.modules.qms.meeting.repository.QmsAttachmentPathRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class AuditCriteriaService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuditCriteriaService.class);

    @Autowired
    private AuditCriteriaRepository auditCriteriaRepository;

    @Autowired
    private QmsAttachmentPathRepository attachmentRepository;

    @Autowired
    private AuditDepartmentRepository auditDepartmentRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<AuditCriteria> getAll() {
        List<AuditCriteria> list = auditCriteriaRepository.findAll();
        if (list == null || list.isEmpty()) {
            return list;
        }

        List<Long> ids = list.stream()
                .map(AuditCriteria::getId)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toList());

        if (ids.isEmpty()) {
            return list;
        }

        // Batch load all departments
        List<AuditDepartment> allDepts = auditDepartmentRepository.findByRefIds(ids);
        java.util.Map<Long, List<AuditDepartment>> deptsMap = allDepts == null ? new java.util.HashMap<>() : allDepts.stream()
                .filter(d -> d.getRefId() != null)
                .collect(java.util.stream.Collectors.groupingBy(AuditDepartment::getRefId));

        // Batch load all attachments
        List<QmsAttachmentPath> allAttachments = attachmentRepository.findByPageCodeAndRefIdsAndDocType("M1130", ids, "AUDIT CRITERIA");
        java.util.Map<Long, List<QmsAttachmentPath>> attachmentsMap = allAttachments == null ? new java.util.HashMap<>() : allAttachments.stream()
                .filter(a -> a.getRefId() != null)
                .collect(java.util.stream.Collectors.groupingBy(QmsAttachmentPath::getRefId));

        for (AuditCriteria criteria : list) {
            Long refId = criteria.getId();
            if (refId == null) continue;

            // Populate departments
            List<AuditDepartment> depts = deptsMap.getOrDefault(refId, java.util.Collections.emptyList());
            criteria.setDepartments(depts);
            criteria.setDepartmentIds(depts.stream()
                    .map(AuditDepartment::getDeptId)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList()));

            // Populate attachments
            List<QmsAttachmentPath> paths = attachmentsMap.getOrDefault(refId, java.util.Collections.emptyList());
            try {
                if (!paths.isEmpty()) {
                    criteria.setAttachmentInfo(objectMapper.writeValueAsString(paths));
                } else {
                    criteria.setAttachmentInfo("[]");
                }
            } catch (Exception e) {
                criteria.setAttachmentInfo("[]");
            }
        }
        return list;
    }

    public Optional<AuditCriteria> getById(Long id) {
        Optional<AuditCriteria> criteriaOpt = auditCriteriaRepository.findById(id);
        criteriaOpt.ifPresent(criteria -> {
            populateAttachments(criteria);
            populateDepartments(criteria);
        });
        return criteriaOpt;
    }

    private void populateAttachments(AuditCriteria criteria) {
        if (criteria.getId() != null) {
            try {
                List<QmsAttachmentPath> paths = attachmentRepository.findByPageCodeAndRefIdAndDocType("M1130",
                        criteria.getId(), "AUDIT CRITERIA");
                if (paths != null && !paths.isEmpty()) {
                    criteria.setAttachmentInfo(objectMapper.writeValueAsString(paths));
                } else {
                    criteria.setAttachmentInfo("[]");
                }
            } catch (Exception e) {
                log.error("Error populating attachments: ", e);
                criteria.setAttachmentInfo("[]");
            }
        }
    }

    private void populateDepartments(AuditCriteria criteria) {
        if (criteria.getId() != null) {
            List<AuditDepartment> depts = auditDepartmentRepository.findByRefId(criteria.getId());
            criteria.setDepartments(depts);
            criteria.setDepartmentIds(
                    depts.stream().map(AuditDepartment::getDeptId).collect(java.util.stream.Collectors.toList()));
        }
    }

    @Transactional
    public AuditCriteria save(AuditCriteria criteria) {
        // SOP: Audit Criteria value should automatically convert to uppercase
        if (criteria.getCriteriaText() != null) {
            criteria.setCriteriaText(criteria.getCriteriaText().toUpperCase().trim());
        }

        if (criteria.getId() != null) {
            criteria.setUpdatedDate(new Date());
        } else {
            criteria.setCreatedDate(new Date());
        }

        String attachmentInfo = criteria.getAttachmentInfo();
        List<Long> departmentIds = criteria.getDepartmentIds();

        AuditCriteria saved = auditCriteriaRepository.save(criteria);

        // Sync Departments
        auditDepartmentRepository.deleteByRefId(saved.getId());
        if (departmentIds != null) {
            String currentUser = null;
            try {
                currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
            }

            for (Long deptId : departmentIds) {
                AuditDepartment ad = new AuditDepartment();
                ad.setPageCode("M1130");
                ad.setRefId(saved.getId());
                ad.setDeptId(deptId);
                ad.setCreatedDate(new Date());
                ad.setCreatedUser(currentUser);
                auditDepartmentRepository.save(ad);
            }
        }

        // Attachments are managed independently via QmsAttachmentPathController, so no
        // sync is needed here.

        populateAttachments(saved);
        populateDepartments(saved);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        auditDepartmentRepository.deleteByRefId(id);
        attachmentRepository.deleteByPageCodeAndRefIdAndDocType("M1130", id, "AUDIT CRITERIA");
        auditCriteriaRepository.deleteById(id);
    }

    public String generateNextSeqNo() {
        List<String> allSeqNos = auditCriteriaRepository.findAllSeqNos();
        int maxNum = 0;
        for (String seq : allSeqNos) {
            if (seq != null) {
                String s = seq.trim();
                if (s.startsWith("AC-")) {
                    s = s.substring(3).trim();
                } else if (s.startsWith("AC")) {
                    s = s.substring(2).trim();
                }
                try {
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\d+$");
                    java.util.regex.Matcher matcher = pattern.matcher(s);
                    if (matcher.find()) {
                        int num = Integer.parseInt(matcher.group());
                        if (num > maxNum) {
                            maxNum = num;
                        }
                    }
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return String.valueOf(maxNum + 1);
    }

    @Transactional(readOnly = true)
    public List<AuditCriteria> getCriteriaByFilters(String auditType, String department) {
        List<AuditCriteria> list = auditCriteriaRepository.findByAuditTypeAndDepartmentName(auditType, department);
        if (list == null || list.isEmpty()) {
            return list;
        }

        List<Long> ids = list.stream()
                .map(AuditCriteria::getId)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toList());

        if (ids.isEmpty()) {
            return list;
        }

        // Batch load all departments
        List<AuditDepartment> allDepts = auditDepartmentRepository.findByRefIds(ids);
        java.util.Map<Long, List<AuditDepartment>> deptsMap = allDepts == null ? new java.util.HashMap<>() : allDepts.stream()
                .filter(d -> d.getRefId() != null)
                .collect(java.util.stream.Collectors.groupingBy(AuditDepartment::getRefId));

        // Batch load all attachments
        List<QmsAttachmentPath> allAttachments = attachmentRepository.findByPageCodeAndRefIdsAndDocType("M1130", ids, "AUDIT CRITERIA");
        java.util.Map<Long, List<QmsAttachmentPath>> attachmentsMap = allAttachments == null ? new java.util.HashMap<>() : allAttachments.stream()
                .filter(a -> a.getRefId() != null)
                .collect(java.util.stream.Collectors.groupingBy(QmsAttachmentPath::getRefId));

        for (AuditCriteria criteria : list) {
            Long refId = criteria.getId();
            if (refId == null) continue;

            // Populate departments
            List<AuditDepartment> depts = deptsMap.getOrDefault(refId, java.util.Collections.emptyList());
            criteria.setDepartments(depts);
            criteria.setDepartmentIds(depts.stream()
                    .map(AuditDepartment::getDeptId)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList()));

            // Populate attachments
            List<QmsAttachmentPath> paths = attachmentsMap.getOrDefault(refId, java.util.Collections.emptyList());
            try {
                if (!paths.isEmpty()) {
                    criteria.setAttachmentInfo(objectMapper.writeValueAsString(paths));
                } else {
                    criteria.setAttachmentInfo("[]");
                }
            } catch (Exception e) {
                criteria.setAttachmentInfo("[]");
            }
        }
        return list;
    }
}