package com.autonoma.erp.modules.qms.meeting.controller;

import com.autonoma.erp.dto.MomActionSummaryDTO;
import com.autonoma.erp.util.SecurityUtils;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMomMaster;
import com.autonoma.erp.modules.qms.meeting.service.QmsMomMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import com.autonoma.erp.security.RequirePagePermission;

import com.autonoma.erp.model.admin.UserCredential;
import com.autonoma.erp.repository.admin.UserRepository;
import com.autonoma.erp.repository.admin.UserCompanyMappingRepository;
import com.autonoma.erp.repository.admin.UserDivisionMappingRepository;
import com.autonoma.erp.repository.admin.CompanyCredentialRepository;
import com.autonoma.erp.modules.master.organization.service.DivisionService;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/qms/moms")
@CrossOrigin(origins = "*")
public class QmsMomMasterController {
    private final QmsMomMasterService service;

    @Autowired private UserRepository userRepo;
    @Autowired private UserCompanyMappingRepository compMapRepo;
    @Autowired private UserDivisionMappingRepository divMapRepo;
    @Autowired private DivisionService divService;

    @org.springframework.beans.factory.annotation.Autowired
    public QmsMomMasterController(QmsMomMasterService service) {
        this.service = service;
    }



    @GetMapping
    public List<QmsMomMaster> getAll(
            @RequestParam(required = false) String role,
            @RequestParam(name = "taskScope", required = false) String taskScope,
            @RequestParam(name = "currentUser", required = false) String currentUser,
            @RequestParam(name = "memberId", required = false) Long memberId) {
        return service.getAllMoms(role, taskScope, currentUser, memberId);
    }

    /**
     * Paginated lightweight list endpoint for the MOM list page.
     * Replaces the full-entity GET / call for list display.
     * Filters are applied at DB level — no client-side filtering needed.
     *
     * GET /api/qms/moms/list?page=0&size=20&startDate=2024-01-01&endDate=2024-12-31&status=All&momNo=
     */
    @GetMapping("/list")
    public org.springframework.http.ResponseEntity<org.springframework.data.domain.Page<com.autonoma.erp.modules.qms.meeting.dto.QmsMomListItemDTO>> getMomList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String momNo,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false, defaultValue = "All") String status) {
        return org.springframework.http.ResponseEntity.ok(
                service.getMomList(page, size, momNo, startDate, endDate, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QmsMomMaster> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getMomById(id));
    }

    @GetMapping("/actions")
    public ResponseEntity<List<com.autonoma.erp.dto.MomActionSummaryDTO>> getAllActions() {
        return ResponseEntity.ok(service.getAllActions());
    }

    @GetMapping("/actions/paged")
    public ResponseEntity<org.springframework.data.domain.Page<com.autonoma.erp.dto.MomActionSummaryDTO>> getActionsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "Mine") String scope,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String searchBy,
            @RequestParam(required = false) String searchText,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String considerDate,
            @RequestParam(required = false) String dashboardFilter,
            @RequestParam(required = false) String currentUser,
            @RequestParam(required = false) String pageCode) {
        return ResponseEntity.ok(service.getActionsPaged(
                page, size, scope, memberId, status, searchBy, searchText,
                startDate, endDate, considerDate, dashboardFilter, currentUser, pageCode));
    }


    @PostMapping
    @RequirePagePermission(pageCode = "QM1320", action = "write")
    public ResponseEntity<QmsMomMaster> create(@RequestBody QmsMomMaster mom) {
        return ResponseEntity.ok(service.saveMom(mom));
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1320", action = "write")
    public ResponseEntity<QmsMomMaster> update(@PathVariable Long id, @RequestBody QmsMomMaster mom) {
        mom.setId(id);
        return ResponseEntity.ok(service.saveMom(mom));
    }

    @PutMapping("/{id}/attendance-out-times")
    public ResponseEntity<?> updateAttendanceOutTimes(@PathVariable Long id, @RequestBody List<Map<String, Object>> outTimes) {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Authentication required"));
        }
        
        QmsMomMaster mom = service.getMomById(id);
        if (mom == null) {
            return ResponseEntity.notFound().build();
        }
        
        if (mom.getSchedule() != null && mom.getSchedule().getHostBy() != null) {
            Long hostEmpId = mom.getSchedule().getHostBy().getId();
            java.util.Optional<com.autonoma.erp.model.admin.UserCredential> userOpt = userRepo.findByUserId(userId);
            if (!userOpt.isPresent() || userOpt.get().getEmpId() == null || !userOpt.get().getEmpId().equals(hostEmpId)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only the host of this meeting is permitted to update attendance out times"));
            }
        } else {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                .body(Map.of("message", "No meeting schedule or host found for this MOM"));
        }
        
        service.updateAttendanceOutTimes(id, outTimes);
        return ResponseEntity.ok(Map.of("message", "Attendance out times updated successfully"));
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "QM1320", action = "delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteMom(id);
        return ResponseEntity.noContent().build();
    }

    // ===== Reassign endpoint =====
    @PutMapping("/reassign")
    @RequirePagePermission(pageCode = "QM1320", action = "write")
    public ResponseEntity<?> reassign(@RequestBody Map<String, Object> data) {
        try {
            service.reassignDetails(data);
            return ResponseEntity.ok(Map.of("message", "Reassigned successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ===== Cancel details endpoint =====
    @PutMapping("/cancel-details")
    @RequirePagePermission(pageCode = "QM1330", action = "write")
    public ResponseEntity<?> cancelDetails(@RequestBody Map<String, Object> data) {
        try {
            service.cancelDetails(data);
            return ResponseEntity.ok(Map.of("message", "Cancelled successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ===== Close MOM detail (submit for approval) =====
    @PutMapping("/{momId}/details/{detailId}/close")
    @RequirePagePermission(pageCode = "QM1340", action = "write")
    public ResponseEntity<?> closeDetail(@PathVariable Long momId, @PathVariable Long detailId,
                                          @RequestBody Map<String, Object> data) {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        java.util.Optional<UserCredential> userOpt = userRepo.findByUserId(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        
        if (!isAuthorizedToClose(momId, detailId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You are not authorized to close this action item. Only the assigned employee can submit for closure."));
        }
        
        UserCredential user = userOpt.get();
        try {
            service.closeDetail(momId, detailId, data, userId, user);
            return ResponseEntity.ok(Map.of("message", "Submitted for approval"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ===== Approve MOM detail =====
    @PutMapping("/{momId}/details/{detailId}/approve")
    @RequirePagePermission(pageCode = "QM1350", action = "approval")
    public ResponseEntity<?> approveDetail(@PathVariable Long momId, @PathVariable Long detailId,
                                            @RequestBody Map<String, Object> data) {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        java.util.Optional<UserCredential> userOpt = userRepo.findByUserId(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        
        if (!isAuthorizedToApproveOrReject(momId, detailId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You are not authorized to approve this action item. Only the assigner can approve."));
        }
        
        UserCredential user = userOpt.get();
        try {
            service.approveDetail(momId, detailId, userId, user);
            return ResponseEntity.ok(Map.of("message", "Approved successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ===== Reject MOM detail =====
    @PutMapping("/{momId}/details/{detailId}/reject")
    @RequirePagePermission(pageCode = "QM1350", action = "approval")
    public ResponseEntity<?> rejectDetail(@PathVariable Long momId, @PathVariable Long detailId,
                                           @RequestBody Map<String, Object> data) {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        java.util.Optional<UserCredential> userOpt = userRepo.findByUserId(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        
        if (!isAuthorizedToApproveOrReject(momId, detailId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You are not authorized to reject this action item. Only the assigner can reject."));
        }
        
        UserCredential user = userOpt.get();
        try {
            String comments = data.get("comments") != null ? data.get("comments").toString() : "";
            if (comments.trim().isEmpty() && data.containsKey("remarks")) {
                comments = data.get("remarks") != null ? data.get("remarks").toString() : "";
            }
            service.rejectDetail(momId, detailId, comments, userId, user);
            return ResponseEntity.ok(Map.of("message", "Rejected"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ===== Verify Action Item API (POST) =====
    @PostMapping("/action-items/{id}/verify")
    public ResponseEntity<?> verifyActionItem(@PathVariable Long id) {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        java.util.Optional<UserCredential> userOpt = userRepo.findByUserId(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        UserCredential user = userOpt.get();

        com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails detail = service.getDetailById(id);
        if (detail == null || detail.getMom() == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            service.approveDetail(detail.getMom().getId(), id, userId, user);
            return ResponseEntity.ok(service.getDetailById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ===== Reject Action Item API (POST) =====
    @PostMapping("/action-items/{id}/reject")
    public ResponseEntity<?> rejectActionItem(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        java.util.Optional<UserCredential> userOpt = userRepo.findByUserId(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        UserCredential user = userOpt.get();

        com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails detail = service.getDetailById(id);
        if (detail == null || detail.getMom() == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            String comments = data.get("remarks") != null ? data.get("remarks").toString() : "";
            if (comments.trim().isEmpty() && data.containsKey("comments")) {
                comments = data.get("comments") != null ? data.get("comments").toString() : "";
            }
            service.rejectDetail(detail.getMom().getId(), id, comments, userId, user);
            return ResponseEntity.ok(service.getDetailById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private boolean isAuthorizedToClose(Long momId, Long detailId) {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return false;
        }
        java.util.Optional<UserCredential> userOpt = userRepo.findByUserId(userId);
        if (!userOpt.isPresent()) {
            return false;
        }
        UserCredential user = userOpt.get();
        QmsMomMaster mom = service.getMomById(momId);
        if (mom == null || mom.getDetails() == null) {
            return false;
        }
        java.util.Optional<com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails> detailOpt = mom.getDetails().stream()
                .filter(d -> d.getId() != null && d.getId().longValue() == detailId.longValue())
                .findFirst();
        if (!detailOpt.isPresent()) {
            return false;
        }
        com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails detail = detailOpt.get();
        if (detail.getAssignedTo() == null) {
            return true;
        }
        return user.getEmpId() != null && user.getEmpId().equals(detail.getAssignedTo().getId());
    }

    private boolean isAuthorizedToApproveOrReject(Long momId, Long detailId) {
        String userId = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return false;
        }
        java.util.Optional<UserCredential> userOpt = userRepo.findByUserId(userId);
        if (!userOpt.isPresent()) {
            return false;
        }
        UserCredential user = userOpt.get();
        // Removed admin bypass to ensure only the assigned user can verify/reject
        QmsMomMaster mom = service.getMomById(momId);
        if (mom == null || mom.getDetails() == null) {
            return false;
        }
        java.util.Optional<com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails> detailOpt = mom.getDetails().stream()
                .filter(d -> d.getId() != null && d.getId().longValue() == detailId.longValue())
                .findFirst();
        if (!detailOpt.isPresent()) {
            return false;
        }
        com.autonoma.erp.modules.qms.meeting.entity.QmsMomDetails detail = detailOpt.get();
        if (detail.getAssignedBy() == null) {
            return true;
        }
        return user.getEmpId() != null && user.getEmpId().equals(detail.getAssignedBy().getId());
    }
}
