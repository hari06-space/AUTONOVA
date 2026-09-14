package com.autonoma.erp.modules.hr.orgstructure.service;

import com.autonoma.erp.util.SecurityUtils;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.autonoma.erp.modules.hr.orgstructure.entity.Gradedetails;
import com.autonoma.erp.modules.hr.orgstructure.repository.EmpGradeRepository;

@Service
public class EmpGradeService {

    @Autowired
    private EmpGradeRepository repository;

    public List<Gradedetails> getAllGradeDetails() {
        return repository.findByStatusIgnoreCase("active");
    }

    public Gradedetails getGradeDetailById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Gradedetails createGradeDetail(Gradedetails gradeDetail) {
        if (gradeDetail.getCreatedDate() == null) {
            gradeDetail.setCreatedDate(new Date());
        }
        if (gradeDetail.getCreatedBy() == null) {
            gradeDetail.setCreatedBy(com.autonoma.erp.util.SecurityUtils.getCurrentUserId());
        }
        if (gradeDetail.getStatus() == null) {
            gradeDetail.setStatus("Active");
        }
        return repository.save(gradeDetail);
    }

    public Gradedetails updateGradeDetail(Long id, Gradedetails gradeDetailDetails) {
        Gradedetails gradeDetail = repository.findById(id).orElse(null);
        if (gradeDetail != null) {
            gradeDetail.setGradeCode(gradeDetailDetails.getGradeCode());
            gradeDetail.setSequenceNo(gradeDetailDetails.getSequenceNo());
            gradeDetail.setGradeName(gradeDetailDetails.getGradeName());
            gradeDetail.setStatus(gradeDetailDetails.getStatus());
            gradeDetail.setUpdatedBy(gradeDetailDetails.getUpdatedBy() != null ? gradeDetailDetails.getUpdatedBy() : "Admin");
            return repository.save(gradeDetail);
        }
        return null;
    }

    public String getNextGradeNo() {
        long count = repository.count();
        return "GRD-" + String.format("%03d", count + 1);
    }

    public void deleteGradeDetail(Long id) {
        repository.deleteById(id);
    }
}

