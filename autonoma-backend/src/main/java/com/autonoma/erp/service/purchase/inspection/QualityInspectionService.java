package com.autonoma.erp.service.purchase.inspection;

import com.autonoma.erp.dto.purchase.inspection.QualityInspectionPayloadDTO;
import com.autonoma.erp.dto.purchase.inspection.QualityInspectionListDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface QualityInspectionService {

    Page<QualityInspectionListDTO> search(Long divisionId, String qiNo, LocalDate startDate, LocalDate endDate, String grnNo, Pageable pageable);

    QualityInspectionPayloadDTO getById(String id);

    QualityInspectionPayloadDTO generateFromGrn(Long grnId, Long divisionId, String userId);

    QualityInspectionPayloadDTO save(QualityInspectionPayloadDTO dto, String userId);

    QualityInspectionPayloadDTO postInspection(String id, String userId);
}
