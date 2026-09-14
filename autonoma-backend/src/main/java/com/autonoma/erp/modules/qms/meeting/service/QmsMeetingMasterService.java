package com.autonoma.erp.modules.qms.meeting.service;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingMaster;
import com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;

import java.util.List;
import java.util.Optional;

import com.autonoma.erp.modules.qms.meeting.entity.QmsAttachmentPath;
import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingEmployeeMapping;
import com.autonoma.erp.modules.qms.meeting.repository.QmsAttachmentPathRepository;
import org.springframework.transaction.annotation.Transactional;
import com.autonoma.erp.util.AttachmentUtil;

@Service
public class QmsMeetingMasterService {

    @Autowired
    private QmsMeetingMasterRepository repository;

    @Autowired
    private StatusMasterRepository statusRepo;

    @Autowired
    private com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository employeeMasterRepo;

    @Autowired
    private QmsAttachmentPathRepository attachmentRepository;

    @Autowired
    private com.autonoma.erp.modules.qms.meeting.repository.QmsMeetingScheduleRepository scheduleRepository;

    public List<QmsMeetingMaster> getAllMeetings() {
        List<QmsMeetingMaster> meetings = repository.findAll();
        for (QmsMeetingMaster meeting : meetings) {
            populateAttachments(meeting);
        }
        return meetings;
    }

    public Optional<QmsMeetingMaster> getMeetingById(Integer id) {
        Optional<QmsMeetingMaster> meetingOpt = repository.findById(id);
        meetingOpt.ifPresent(this::populateAttachments);
        return meetingOpt;
    }

    private void populateAttachments(QmsMeetingMaster meeting) {
        if (meeting.getId() != null) {
            List<QmsAttachmentPath> paths = attachmentRepository.findByPageCodeAndRefId("M1310", Long.valueOf(meeting.getId()));
            meeting.setAttachments(paths);
        }
    }

    @Transactional
    public QmsMeetingMaster saveMeeting(QmsMeetingMaster meeting) {
        boolean exists;
        if (meeting.getId() != null) {
            exists = repository.existsByMeetingNameIgnoreCaseAndIdNot(meeting.getMeetingName(), meeting.getId());
        } else {
            exists = repository.existsByMeetingNameIgnoreCase(meeting.getMeetingName());
        }

        if (exists) {
            throw new IllegalArgumentException("A meeting with this name already exists");
        }

        QmsMeetingMaster meetingToSave;
        if (meeting.getId() != null) {
            meetingToSave = repository.findById(meeting.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Meeting not found with id: " + meeting.getId()));
        } else {
            meetingToSave = new QmsMeetingMaster();
        }

        meetingToSave.setMeetingName(meeting.getMeetingName());
        meetingToSave.setMeetingDescription(meeting.getMeetingDescription());
        meetingToSave.setMeetingPrefix(meeting.getMeetingPrefix());
        meetingToSave.setMeetingAgenda(meeting.getMeetingAgenda());
        meetingToSave.setIsActive(meeting.getIsActive());
        meetingToSave.setReminderDays(meeting.getReminderDays());

        if (meeting.getStatus() != null) {
            meetingToSave.setStatusObj(statusRepo.findByName(meeting.getStatus()).orElse(null));
        } else {
            meetingToSave.setStatusObj(statusRepo.findByName("ACTIVE").orElse(null));
        }

        String employeeIdStr = meeting.getEmployeeId();
        String attachmentNameStr = meeting.getAttachmentName();
        String attachmentUrlStr = meeting.getAttachmentUrl();

        // 1. Save and flush the parent entity first (generates ID for new records)
        final QmsMeetingMaster savedMeeting = repository.saveAndFlush(meetingToSave);

        // 2. Clear old mappings and flush to execute orphan removal delete statements
        if (savedMeeting.getEmployeeMappings() != null) {
            savedMeeting.getEmployeeMappings().clear();
        } else {
            savedMeeting.setEmployeeMappings(new java.util.ArrayList<>());
        }
        repository.saveAndFlush(savedMeeting);

        // 3. Map and save new employee associations
        if (employeeIdStr != null && !employeeIdStr.trim().isEmpty()) {
            String[] empIds = employeeIdStr.split(",");
            for (String empIdVal : empIds) {
                try {
                    Long empId = Long.parseLong(empIdVal.trim());
                    employeeMasterRepo.findById(empId).ifPresent(emp -> {
                        QmsMeetingEmployeeMapping mapping = new QmsMeetingEmployeeMapping();
                        mapping.setMeeting(savedMeeting);
                        mapping.setEmployee(emp);
                        savedMeeting.getEmployeeMappings().add(mapping);
                    });
                } catch (NumberFormatException e) {
                    // ignore invalid IDs
                }
            }
        }

        // 4. Save and flush the parent entity again to insert the new mapping rows
        final QmsMeetingMaster finalSaved = repository.saveAndFlush(savedMeeting);

        // Save/update attachments in QMS_ATTACHMENT_PATH
        if (finalSaved.getId() != null) {
            attachmentRepository.deleteByPageCodeAndRefId("M1310", Long.valueOf(finalSaved.getId()));
            attachmentRepository.flush();
        }

        if (attachmentUrlStr != null && !attachmentUrlStr.trim().isEmpty() &&
            attachmentNameStr != null && !attachmentNameStr.trim().isEmpty()) {

            List<String> urlsList = AttachmentUtil.parseFileList(attachmentUrlStr);
            List<String> namesList = AttachmentUtil.parseFileList(attachmentNameStr);
            int count = Math.min(urlsList.size(), namesList.size());
            for (int i = 0; i < count; i++) {
                String url = urlsList.get(i).trim();
                String name = namesList.get(i).trim();
                if (url.isEmpty() || name.isEmpty()) continue;

                String currentUser = null;
                try {
                    currentUser = com.autonoma.erp.util.SecurityUtils.getCurrentUserId();
                } catch (Exception e) {}
                if (currentUser == null || currentUser.trim().isEmpty()) {
                    currentUser = "Admin";
                }

                attachmentRepository.insertAttachmentNative(
                    "M1310",
                    Long.valueOf(finalSaved.getId()),
                    "MEETING MASTER",
                    url,
                    name,
                    currentUser
                );
            }
            finalSaved.setAttachments(attachmentRepository.findByPageCodeAndRefId("M1310", Long.valueOf(finalSaved.getId())));
        } else {
            finalSaved.setAttachments(new java.util.ArrayList<>());
        }

        return finalSaved;
    }

    @Transactional
    public void deleteMeeting(Integer id) {
        boolean isReferenced = scheduleRepository.existsByMeetingType_Id(id);
        if (isReferenced) {
            throw new IllegalArgumentException("Cannot delete meeting because it is referenced in a schedule");
        }

        // 1. Delete related employee mappings
        repository.deleteEmployeeMappingsByMeetingId(id);

        // 2. Delete related attachments from QMS_ATTACHMENT_PATH
        attachmentRepository.deleteByPageCodeAndRefId("M1310", Long.valueOf(id));

        // 3. Delete the meeting master record
        repository.deleteById(id);
    }
}
