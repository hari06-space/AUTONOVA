package com.autonoma.erp.modules.hra.recruitment.service;

import com.autonoma.erp.modules.induction.entity.HrAttachmentPath;
import com.autonoma.erp.modules.induction.repository.HrAttachmentPathRepository;
import com.autonoma.erp.modules.platform.files.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AtsAttachmentService {

    @Autowired
    private HrAttachmentPathRepository hrAttachmentRepository;

    @Autowired
    private FileService fileService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Transactional
    public void syncOnboardingFiles(Long candidateId,
                                    List<Map<String, Object>> eduList,
                                    List<Map<String, Object>> expList,
                                    List<Map<String, Object>> kycList,
                                    List<Map<String, Object>> skillList,
                                    String currentUser) {
        String createdUser = (currentUser != null && !currentUser.trim().isEmpty()) ? currentUser : "SYSTEM";

        // 1. Sync Education attachments
        if (eduList != null) {
            hrAttachmentRepository.deleteByPageCodeAndRefIdAndDocType("HA1110", candidateId, "EDUCATION");
            for (Map<String, Object> eduMap : eduList) {
                String filePath = getStringValue(eduMap, "filePath");
                String education = getStringValue(eduMap, "education");
                if (filePath != null && !filePath.isEmpty()) {
                    for (String path : filePath.split(",")) {
                        String trimmedPath = path.trim();
                        if (!trimmedPath.isEmpty()) {
                            saveHrAttachment(candidateId, "EDUCATION", education, trimmedPath, createdUser);
                        }
                    }
                }
            }
        }

        // 2. Sync Experience attachments
        if (expList != null) {
            hrAttachmentRepository.deleteByPageCodeAndRefIdAndDocType("HA1110", candidateId, "EXPERIENCE");
            for (Map<String, Object> expMap : expList) {
                String filePath = getStringValue(expMap, "filePath");
                String companyName = getStringValue(expMap, "companyName");
                if (filePath != null && !filePath.isEmpty()) {
                    for (String path : filePath.split(",")) {
                        String trimmedPath = path.trim();
                        if (!trimmedPath.isEmpty()) {
                            saveHrAttachment(candidateId, "EXPERIENCE", companyName, trimmedPath, createdUser);
                        }
                    }
                }
            }
        }

        // 3. Sync KYC attachments
        if (kycList != null) {
            hrAttachmentRepository.deleteByPageCodeAndRefIdAndDocType("HA1110", candidateId, "KYC");
            for (Map<String, Object> kycMap : kycList) {
                String filePath = getStringValue(kycMap, "filePath");
                String docName = getStringValue(kycMap, "docName");
                if (filePath != null && !filePath.isEmpty()) {
                    for (String path : filePath.split(",")) {
                        String trimmedPath = path.trim();
                        if (!trimmedPath.isEmpty()) {
                            saveHrAttachment(candidateId, "KYC", docName, trimmedPath, createdUser);
                        }
                    }
                }
            }
        }

        // 4. Sync Skills attachments
        if (skillList != null) {
            hrAttachmentRepository.deleteByPageCodeAndRefIdAndDocType("HA1110", candidateId, "SKILLS");
            for (Map<String, Object> skillMap : skillList) {
                String filePath = getStringValue(skillMap, "filePath");
                String skillName = getStringValue(skillMap, "activityDetails");
                if (filePath != null && !filePath.isEmpty()) {
                    for (String path : filePath.split(",")) {
                        String trimmedPath = path.trim();
                        if (!trimmedPath.isEmpty()) {
                            saveHrAttachment(candidateId, "SKILLS", skillName, trimmedPath, createdUser);
                        }
                    }
                }
            }
        }
    }

    @Transactional
    public void syncInterviewFile(Long interviewId, String path, String currentUser) {
        String createdUser = (currentUser != null && !currentUser.trim().isEmpty()) ? currentUser : "SYSTEM";
        hrAttachmentRepository.deleteByPageCodeAndRefIdAndDocType("HA1120", interviewId, "INTERVIEW_ATTACHMENT");

        if (path != null && !path.trim().isEmpty()) {
            saveHrAttachmentForInterview(interviewId, path.trim(), createdUser);
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOfferDocuments(Long candidateId) {
        List<HrAttachmentPath> hrAttachments = hrAttachmentRepository.findByPageCodeAndRefId("HA1110", candidateId);
        List<Map<String, Object>> result = new ArrayList<>();

        if (hrAttachments != null && !hrAttachments.isEmpty()) {
            for (HrAttachmentPath att : hrAttachments) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", att.getId());
                map.put("PATH", att.getPath());
                map.put("FILE_NAME", att.getFileName());

                // Map classification back to the legacy DOC_TYPE format
                String legacyDocType = "Offer Document";
                String docType = att.getDocType();
                String refStr = att.getReferenceIdString() != null ? att.getReferenceIdString().trim() : "Unknown";
                if ("EDUCATION".equalsIgnoreCase(docType)) {
                    legacyDocType = "EDUCATION_" + refStr;
                } else if ("EXPERIENCE".equalsIgnoreCase(docType)) {
                    legacyDocType = "EXPERIENCE_" + refStr;
                } else if ("KYC".equalsIgnoreCase(docType)) {
                    legacyDocType = refStr;
                } else if ("SKILLS".equalsIgnoreCase(docType)) {
                    legacyDocType = "SKILL_" + refStr;
                }
                map.put("DOC_TYPE", legacyDocType);
                map.put("FROMWHERE", att.getFromWhere() != null ? att.getFromWhere() : "ATS");
                map.put("fromWhere", att.getFromWhere() != null ? att.getFromWhere() : "ATS");

                result.add(map);
            }
        } else {
            // Fallback to reading from legacy ATS_ATTACHMENT_PATH to avoid breaking history
            String sql = "SELECT id, DOC_TYPE, PATH, FILE_NAME, 'ATS' as FROMWHERE, 'ATS' as fromWhere FROM ATS_ATTACHMENT_PATH WHERE REF_ID = ? AND PAGE_CODE = 'OFFER_DOCS'";
            result = jdbcTemplate.queryForList(sql, candidateId);
        }

        return result;
    }

    private void saveHrAttachment(Long candidateId, String docType, String referenceIdString, String path, String createdUser) {
        HrAttachmentPath att = new HrAttachmentPath();
        att.setPageCode("HA1110");
        att.setRefId(candidateId);
        att.setDocType(docType);
        att.setReferenceIdString(referenceIdString != null ? referenceIdString : "Unknown");
        att.setPath(path);
        att.setFromWhere("ATS");

        String fileName = fileService.getOriginalFileNameForPath(path);
        if (fileName == null || fileName.isEmpty()) {
            fileName = path.substring(path.lastIndexOf('/') + 1);
        }
        if (fileName.length() > 255) {
            fileName = fileName.substring(fileName.length() - 255);
        }
        att.setFileName(fileName);
        att.setCreatedBy(createdUser);
        att.setCreatedDate(new Date());

        hrAttachmentRepository.save(att);
    }

    private void saveHrAttachmentForInterview(Long interviewId, String path, String createdUser) {
        HrAttachmentPath att = new HrAttachmentPath();
        att.setPageCode("HA1120");
        att.setRefId(interviewId);
        att.setDocType("INTERVIEW_ATTACHMENT");
        att.setPath(path);
        att.setFromWhere("ATS");

        String fileName = fileService.getOriginalFileNameForPath(path);
        if (fileName == null || fileName.isEmpty()) {
            fileName = path.substring(path.lastIndexOf('/') + 1);
        }
        if (fileName.length() > 255) {
            fileName = fileName.substring(fileName.length() - 255);
        }
        att.setFileName(fileName);
        att.setCreatedBy(createdUser);
        att.setCreatedDate(new Date());

        hrAttachmentRepository.save(att);
    }

    @Transactional(readOnly = true)
    public String getInterviewAttachmentPath(Long interviewId) {
        List<HrAttachmentPath> list = hrAttachmentRepository.findAllByPageCodeAndRefIdAndDocType("HA1120", interviewId, "INTERVIEW_ATTACHMENT");
        if (list != null && !list.isEmpty()) {
            return list.get(0).getPath();
        }
        return null;
    }

    private String getStringValue(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key) || map.get(key) == null) {
            return "";
        }
        return map.get(key).toString().trim();
    }
}
