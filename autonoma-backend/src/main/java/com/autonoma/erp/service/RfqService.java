package com.autonoma.erp.service;

import com.autonoma.erp.dto.purchase.RfqHeadDTO;
import com.autonoma.erp.dto.purchase.RfqListDTO;

import java.util.List;

public interface RfqService {
    List<RfqListDTO> getAllRfqs(Long divisionId);
    RfqHeadDTO getRfqById(Long id);
    RfqHeadDTO createRfq(RfqHeadDTO rfqDTO);
    RfqHeadDTO updateRfq(Long id, RfqHeadDTO rfqDTO);
    void sendRfqEmails(Long rfqId, com.autonoma.erp.dto.purchase.SendRfqEmailDTO dto);
    com.autonoma.erp.dto.purchase.RfqEmailHistoryDTO getLatestEmail(Long rfqId);
    List<com.autonoma.erp.dto.purchase.RfqEmailHistoryDTO> getEmailHistory(Long rfqId);
    void updateStatus(Long rfqId, String statusName);
    void generatePoFromRfq(Long rfqId);
    void deleteRfq(Long id);
    
    // Attachment Methods
    List<com.autonoma.erp.dto.purchase.RfqAttachmentDTO> getAttachments(Long rfqId);
    List<com.autonoma.erp.dto.purchase.RfqAttachmentDTO> uploadAttachments(Long rfqId, org.springframework.web.multipart.MultipartFile[] files, String username);
    void deleteAttachment(Long attachmentId);
}
