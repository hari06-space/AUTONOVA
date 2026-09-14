package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.FaceAuthLog;
import com.autonoma.erp.repository.admin.FaceAuthLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Date;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class FaceAuthService {

    @Autowired
    private FaceAuthLogRepository faceAuthLogRepository;

    public void logAuthAttempt(String userId, String status, String message, Double matchDistance, HttpServletRequest request) {
        FaceAuthLog log = new FaceAuthLog();
        log.setUserId(userId != null ? userId : "UNKNOWN");
        log.setStatus(status);
        log.setMessage(message);
        log.setMatchDistance(matchDistance);
        log.setIpAddress(request != null ? request.getRemoteAddr() : null);
        log.setUserAgent(request != null ? request.getHeader("User-Agent") : null);
        log.setCreatedDate(new Date());
        log.setCreatedBy("SYSTEM");
        log.setIsActive(true);
        faceAuthLogRepository.save(log);
    }
}
