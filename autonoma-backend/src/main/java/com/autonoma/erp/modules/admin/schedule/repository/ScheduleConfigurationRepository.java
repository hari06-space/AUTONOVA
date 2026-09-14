package com.autonoma.erp.modules.admin.schedule.repository;

import com.autonoma.erp.modules.admin.schedule.entity.ScheduleConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScheduleConfigurationRepository extends JpaRepository<ScheduleConfiguration, Long> {
}
