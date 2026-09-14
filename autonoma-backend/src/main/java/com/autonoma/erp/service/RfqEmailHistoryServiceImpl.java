package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.RfqEmailHistoryDTO;
import com.autonoma.erp.model.RfqEmailHistory;
import com.autonoma.erp.model.RfqHead;
import com.autonoma.erp.modules.master.commercial.entity.AccountLedger;
import com.autonoma.erp.modules.master.commercial.repository.AccountLedgerRepository;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import com.autonoma.erp.modules.platform.common.repository.StatusMasterRepository;
import com.autonoma.erp.repository.RfqEmailHistoryRepository;
import com.autonoma.erp.repository.RfqHeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RfqEmailHistoryServiceImpl implements RfqEmailHistoryService {

    private final RfqEmailHistoryRepository rfqEmailHistoryRepository;
    private final RfqHeadRepository rfqHeadRepository;
    private final AccountLedgerRepository accountLedgerRepository;
    private final StatusMasterRepository statusMasterRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RfqEmailHistory logAttempt(Long rfqId, Long supplierId, String recipientEmail, 
                              String subject, String content, String ccEmail, 
                              boolean success, String failureReason, String userId) {
        log.info("[RFQ_EMAIL_HISTORY] Logging send attempt for RFQ ID: {}, Supplier ID: {}, Recipient: {}, Success: {}", 
                rfqId, supplierId, recipientEmail, success);

        RfqHead rfqHead = rfqHeadRepository.findById(rfqId).orElse(null);
        if (rfqHead == null) {
            log.warn("[RFQ_EMAIL_HISTORY] RFQ Head not found for ID: {}. Skipping history log.", rfqId);
            return null;
        }

        AccountLedger supplier = null;
        if (supplierId != null) {
            supplier = accountLedgerRepository.findById(supplierId).orElse(null);
        }

        Integer maxAttempt = rfqEmailHistoryRepository.findMaxAttempt(rfqId, supplierId, recipientEmail);
        int nextAttempt = (maxAttempt != null ? maxAttempt : 0) + 1;

        String targetStatusName = success ? "Sent" : "Failed";
        StatusMaster status = statusMasterRepository.findByNameIgnoreCase(targetStatusName)
                .orElseGet(() -> statusMasterRepository.findByNameIgnoreCase(success ? "SENT" : "FAIL").orElse(null));

        RfqEmailHistory history = new RfqEmailHistory();
        history.setRfqHead(rfqHead);
        history.setSupplier(supplier);
        history.setRecipientEmail(recipientEmail);
        history.setEmailTo(recipientEmail);
        history.setEmailCc(ccEmail);
        history.setEmailSubject(subject != null ? subject : "");
        history.setEmailContent(content != null ? content : "");
        history.setSentBy(userId != null ? userId : "SYSTEM");
        history.setSentDate(new Date());
        history.setStatus(status);
        history.setAttempt(nextAttempt);
        history.setFailureReason(failureReason);
        history.setCreatedBy(userId != null ? userId : "SYSTEM");
        history.setCreatedDate(new Date());

        return rfqEmailHistoryRepository.saveAndFlush(history);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RfqEmailHistoryDTO> getHistoryByRfqId(Long rfqId) {
        List<RfqEmailHistory> list = rfqEmailHistoryRepository.findByRfqHeadIdOrderBySentDateDesc(rfqId);
        List<RfqEmailHistoryDTO> dtos = new ArrayList<>();
        for (RfqEmailHistory h : list) {
            RfqEmailHistoryDTO dto = new RfqEmailHistoryDTO();
            dto.setId(h.getId());
            dto.setRfqId(h.getRfqHead() != null ? h.getRfqHead().getId() : null);
            dto.setSubject(h.getEmailSubject());
            dto.setContent(h.getEmailContent());
            dto.setToEmail(h.getEmailTo());
            dto.setCcEmail(h.getEmailCc());
            dto.setSentBy(h.getSentBy());
            dto.setSentDate(h.getSentDate());

            if (h.getSupplier() != null) {
                dto.setSupplierId(h.getSupplier().getId());
                dto.setSupplierName(h.getSupplier().getLedgerName());
            }

            dto.setRecipientEmail(h.getRecipientEmail() != null ? h.getRecipientEmail() : h.getEmailTo());

            if (h.getStatus() != null) {
                dto.setStatusId(h.getStatus().getId());
                dto.setStatusName(h.getStatus().getName());
                dto.setStatus(h.getStatus().getName());
            } else if (h.getLegacyStatus() != null) {
                dto.setStatus(h.getLegacyStatus());
                dto.setStatusName(h.getLegacyStatus());
            }

            dto.setAttempt(h.getAttempt() != null ? h.getAttempt() : 1);
            dto.setFailureReason(h.getFailureReason());
            dtos.add(dto);
        }
        return dtos;
    }
}
