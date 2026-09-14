package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsCloseMomAndVerify;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QmsCloseMomAndVerifyRepository extends JpaRepository<QmsCloseMomAndVerify, Long> {
    List<QmsCloseMomAndVerify> findByActionItemId(Long actionItemId);
    List<QmsCloseMomAndVerify> findByActionItemIdIn(List<Long> actionItemIds);
}
