package com.autonoma.erp.modules.sm.sales.service;

import com.autonoma.erp.modules.sm.sales.entity.SmQuotationFollowUp;
import com.autonoma.erp.modules.sm.sales.repository.SmQuotationFollowUpRepository;
import com.autonoma.erp.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class SmQuotationFollowUpService {

    @Autowired
    private SmQuotationFollowUpRepository followUpRepository;

    public List<SmQuotationFollowUp> getAllFollowUps() {
        return followUpRepository.findAll();
    }

    public List<SmQuotationFollowUp> getFollowUpsByQuotationId(Long quotationId) {
        return followUpRepository.findByQuotationId(quotationId);
    }

    public Optional<SmQuotationFollowUp> getFollowUpById(Long id) {
        return followUpRepository.findById(id);
    }

    public SmQuotationFollowUp saveFollowUp(SmQuotationFollowUp followUp) {
        if (followUp.getId() == null) {
            followUp.setCreatedBy(SecurityUtils.getCurrentUserId());
            followUp.setCreatedDate(new Date());
        } else {
            followUp.setUpdatedBy(SecurityUtils.getCurrentUserId());
            followUp.setUpdatedDate(new Date());
        }
        return followUpRepository.save(followUp);
    }

    public void deleteFollowUp(Long id) {
        followUpRepository.deleteById(id);
    }
}
