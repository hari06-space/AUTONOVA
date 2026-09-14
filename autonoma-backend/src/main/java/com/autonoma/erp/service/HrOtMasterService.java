package com.autonoma.erp.service;

import com.autonoma.erp.model.HrOtMaster;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.repository.HrOtMasterRepository;
import com.autonoma.erp.repository.admin.AppPreferenceRepository;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class HrOtMasterService {

    @Autowired
    private HrOtMasterRepository repository;

    @Autowired
    private EmployeeMasterRepository employeeRepository;

    @Autowired
    private StatusMasterRepository statusMasterRepository;

    @Autowired
    private AppPreferenceRepository preferencesRepository;

    @Autowired
    private UserRepository userRepository;

    public List<EmployeeMaster> getEligibleEmployees(Long companyId) {
        List<EmployeeMaster> all = employeeRepository.findAll();
        List<EmployeeMaster> eligible = new ArrayList<>();
        for (EmployeeMaster e : all) {
            if (e.getIsActive() == null || Boolean.TRUE.equals(e.getIsActive())) {
                eligible.add(e);
            }
        }
        return eligible;
    }

    public List<HrOtMaster> getOtRecords(Long companyId, Date fromDate, Date toDate, Long employeeId) {
        return repository.filterOtRecords(companyId, fromDate, toDate, employeeId);
    }

    public List<HrOtMaster> getPendingVerifications(Long companyId, Long verticalHeadId) {
        StatusMaster pendingStatus = getStatusByName("Pending to Verify");
        if (pendingStatus == null) return Collections.emptyList();
        return repository.findPendingVerifications(companyId, pendingStatus.getId().intValue(), verticalHeadId);
    }

    public HrOtMaster saveOtRecord(HrOtMaster entry) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null || "SYSTEM".equals(currentUserId)) {
            currentUserId = "1";
        }

        if (entry.getCompanyId() == null) {
            entry.setCompanyId(1L);
        }

        // Check HR Preference: HR_OT_VERIFICATION_REQUIRED
        String verificationReq = "YES";
        try {
            var pref = preferencesRepository.findByPrefName("HR_OT_VERIFICATION_REQUIRED");
            if (pref.isPresent() && pref.get().getPrefValue() != null) {
                verificationReq = pref.get().getPrefValue().trim().toUpperCase();
            }
        } catch (Exception ignored) {}

        boolean isVerificationRequired = "YES".equals(verificationReq) || "TRUE".equals(verificationReq);

        if (isVerificationRequired) {
            StatusMaster pendingStatus = getStatusByName("Pending to Verify");
            entry.setStatusId(pendingStatus != null ? pendingStatus.getId().intValue() : 1);
            entry.setVerificationStatus("PENDING_VERIFICATION");
        } else {
            StatusMaster verifiedStatus = getStatusByName("Verified");
            entry.setStatusId(verifiedStatus != null ? verifiedStatus.getId().intValue() : 2);
            entry.setVerificationStatus("APPROVED");
            entry.setVerifiedBy(currentUserId);
            entry.setVerifiedDate(new Date());
        }

        if (entry.getId() == null) {
            entry.setCreatedBy(currentUserId);
            entry.setCreatedDate(new Date());
            entry.setActiveStatus(true);
        } else {
            entry.setUpdatedBy(currentUserId);
            entry.setUpdatedDate(new Date());
        }

        return repository.save(entry);
    }

    public HrOtMaster verifyOtRecord(Long otId, String action, String rejectReason) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) currentUserId = "1";

        HrOtMaster entry = repository.findById(otId)
                .orElseThrow(() -> new IllegalArgumentException("OT Master Record not found for ID: " + otId));

        if ("REJECT".equalsIgnoreCase(action) || "REJECTED".equalsIgnoreCase(action)) {
            StatusMaster rejectedStatus = getStatusByName("Rejected");
            entry.setStatusId(rejectedStatus != null ? rejectedStatus.getId().intValue() : 3);
            entry.setVerificationStatus("REJECTED");
            entry.setRejectReason(rejectReason != null ? rejectReason : "Rejected by HOD");
        } else {
            StatusMaster verifiedStatus = getStatusByName("Verified");
            entry.setStatusId(verifiedStatus != null ? verifiedStatus.getId().intValue() : 2);
            entry.setVerificationStatus("APPROVED");
        }

        entry.setVerifiedBy(currentUserId);
        entry.setVerifiedDate(new Date());
        entry.setUpdatedBy(currentUserId);
        entry.setUpdatedDate(new Date());

        return repository.save(entry);
    }

    public Integer getApprovedOtMinutes(Long employeeId, Integer month, Integer year) {
        StatusMaster verifiedStatus = getStatusByName("Verified");
        if (verifiedStatus == null) return 0;
        return repository.findApprovedOtMinutesForMonthAndYear(employeeId, verifiedStatus.getId().intValue(), month, year);
    }

    private StatusMaster getStatusByName(String statusName) {
        List<StatusMaster> all = statusMasterRepository.findAll();
        for (StatusMaster s : all) {
            if (statusName.equalsIgnoreCase(s.getName())) {
                return s;
            }
        }
        StatusMaster newStatus = new StatusMaster();
        newStatus.setName(statusName);
        return statusMasterRepository.save(newStatus);
    }
}
