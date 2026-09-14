package com.autonoma.erp.modules.qms.meeting.repository;

import com.autonoma.erp.modules.qms.meeting.entity.QmsMeetingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import java.util.Optional;

@Repository
@Transactional(readOnly = true, isolation = Isolation.READ_UNCOMMITTED)
public interface QmsMeetingScheduleRepository extends JpaRepository<QmsMeetingSchedule, Long> {
       @Query("SELECT MAX(s.id) FROM QmsMeetingSchedule s")
       Optional<Long> findMaxId();

       boolean existsByMeetingType_Id(Integer meetingTypeId);

       Optional<QmsMeetingSchedule> findByScheduleNo(String scheduleNo);

       java.util.List<QmsMeetingSchedule> findByConfigIdOrderByMeetingDateDesc(Long configId);

       java.util.List<QmsMeetingSchedule> findByConfigIdOrderByIdDesc(Long configId);

       java.util.List<QmsMeetingSchedule> findByMeetingDate(java.time.LocalDate meetingDate);

       @Query("SELECT s.scheduleNo FROM QmsMeetingSchedule s")
       java.util.List<String> findAllScheduleNos();

       @Query("SELECT s FROM QmsMeetingSchedule s WHERE s.isActive = true")
       java.util.List<QmsMeetingSchedule> findOpenSchedules();

       @Query("SELECT s FROM QmsMeetingSchedule s " +
                     "WHERE s.isActive = true " +
                     "AND (s.statusObj IS NULL OR s.statusObj.name IN ('OPEN', 'RESCHEDULE')) " +
                     "AND (s.meetingDate < :today OR (s.meetingDate = :today AND s.startTime <= :cutoffTime))")
       java.util.List<QmsMeetingSchedule> findOpenSchedulesPastGracePeriod(
                     @org.springframework.data.repository.query.Param("today") java.time.LocalDate today,
                     @org.springframework.data.repository.query.Param("cutoffTime") java.time.LocalTime cutoffTime);

       @Query("SELECT s FROM QmsMeetingSchedule s " +
                     "WHERE s.isActive = true " +
                     "AND (s.statusObj IS NULL OR s.statusObj.name IN ('OPEN', 'RESCHEDULE')) " +
                     "AND (s.meetingDate < :today OR (s.meetingDate = :today AND s.endTime IS NOT NULL AND s.endTime < :now))")
       java.util.List<QmsMeetingSchedule> findExpiredSchedules(
                     @org.springframework.data.repository.query.Param("today") java.time.LocalDate today,
                     @org.springframework.data.repository.query.Param("now") java.time.LocalTime now);

       java.util.List<QmsMeetingSchedule> findByScheduleNoStartingWith(String prefix);

       @Query("SELECT s.scheduleNo FROM QmsMeetingSchedule s WHERE s.scheduleNo LIKE CONCAT(:prefix, '%')")
       java.util.List<String> findScheduleNosStartingWith(
                     @org.springframework.data.repository.query.Param("prefix") String prefix);

       @Query("SELECT DISTINCT s FROM QmsMeetingSchedule s " +
                     "LEFT JOIN s.participants p " +
                     "WHERE s.isActive = true " +
                     "AND (s.statusObj IS NULL OR s.statusObj.name IN ('OPEN', 'RESCHEDULE')) " +
                     "AND s.meetingDate >= :date " +
                     "AND NOT EXISTS (SELECT 1 FROM QmsMomMaster m WHERE m.schedule.id = s.id) " +
                     "AND NOT EXISTS (SELECT 1 FROM QmsMeetingUserAttendance a WHERE a.schedule.id = s.id AND a.employee.id = :employeeId) "
                     +
                     "AND (s.chairedBy.id = :employeeId OR s.hostBy.id = :employeeId OR p.employee.id = :employeeId)")
       java.util.List<QmsMeetingSchedule> findMeetingsForUserAndDate(
                     @org.springframework.data.repository.query.Param("employeeId") Long employeeId,
                     @org.springframework.data.repository.query.Param("date") java.time.LocalDate date);

       @Query("SELECT DISTINCT s FROM QmsMeetingSchedule s " +
                     "LEFT JOIN FETCH s.participants p " +
                     "LEFT JOIN FETCH p.employee e " +
                     "WHERE s.isActive = true " +
                     "AND s.meetingDate BETWEEN :fromDate AND :toDate " +
                     "ORDER BY s.meetingDate DESC")
       java.util.List<QmsMeetingSchedule> findActiveSchedulesWithParticipantsInRange(
                     @org.springframework.data.repository.query.Param("fromDate") java.time.LocalDate fromDate,
                     @org.springframework.data.repository.query.Param("toDate") java.time.LocalDate toDate);

       @Query("SELECT DISTINCT s FROM QmsMeetingSchedule s " +
                     "LEFT JOIN FETCH s.participants p " +
                     "LEFT JOIN FETCH p.employee e " +
                     "WHERE s.isActive = true " +
                     "AND (s.chairedBy.id IN :empIds OR s.hostBy.id IN :empIds OR p.employee.id IN :empIds) " +
                     "AND s.meetingDate BETWEEN :fromDate AND :toDate " +
                     "ORDER BY s.meetingDate DESC")
       java.util.List<QmsMeetingSchedule> findActiveSchedulesForEmpIdsInRange(
                     @org.springframework.data.repository.query.Param("fromDate") java.time.LocalDate fromDate,
                     @org.springframework.data.repository.query.Param("toDate") java.time.LocalDate toDate,
                     @org.springframework.data.repository.query.Param("empIds") java.util.Collection<Long> empIds);

       @Query("SELECT DISTINCT s FROM QmsMeetingSchedule s " +
                     "LEFT JOIN FETCH s.participants p " +
                     "LEFT JOIN FETCH p.employee e " +
                     "WHERE s.isActive = true " +
                     "ORDER BY s.meetingDate DESC")
       java.util.List<QmsMeetingSchedule> findAllActiveSchedulesWithParticipants();

       @Query("SELECT DISTINCT s FROM QmsMeetingSchedule s " +
                     "LEFT JOIN FETCH s.participants p " +
                     "LEFT JOIN FETCH p.employee e " +
                     "WHERE s.isActive = true " +
                     "AND (s.chairedBy.id IN :empIds OR s.hostBy.id IN :empIds OR p.employee.id IN :empIds) " +
                     "ORDER BY s.meetingDate DESC")
       java.util.List<QmsMeetingSchedule> findAllActiveSchedulesForEmpIds(
                     @org.springframework.data.repository.query.Param("empIds") java.util.Collection<Long> empIds);

       @Query("SELECT DISTINCT s FROM QmsMeetingSchedule s " +
                     "LEFT JOIN FETCH s.participants p " +
                     "LEFT JOIN FETCH p.employee e " +
                     "WHERE s.id IN :ids")
       java.util.List<QmsMeetingSchedule> findActiveSchedulesWithParticipantsByIds(
                     @org.springframework.data.repository.query.Param("ids") java.util.List<Long> ids);

       @Query("SELECT DISTINCT s FROM QmsMeetingSchedule s " +
                     "LEFT JOIN FETCH s.participants p " +
                     "LEFT JOIN FETCH p.employee e " +
                     "WHERE (s.isActive IS NULL OR s.isActive = true) " +
                     "AND (s.statusObj IS NULL OR UPPER(s.statusObj.name) NOT IN ('DRAFT', 'CLOSED', 'CANCELLED')) " +
                     "AND s.meetingDate >= :today " +
                     "ORDER BY s.meetingDate ASC")
       java.util.List<QmsMeetingSchedule> findUpcomingSchedulesForReminders(
                     @org.springframework.data.repository.query.Param("today") java.time.LocalDate today);

       @Query("SELECT s FROM QmsMeetingSchedule s " +
                     "WHERE (s.isActive IS NULL OR s.isActive = true) " +
                     "AND (s.statusObj IS NOT NULL AND UPPER(s.statusObj.name) = 'DRAFT') " +
                     "AND s.meetingDate <= :today")
       java.util.List<QmsMeetingSchedule> findDraftSchedulesForPromotion(
                     @org.springframework.data.repository.query.Param("today") java.time.LocalDate today);

       java.util.List<QmsMeetingSchedule> findByIsActiveTrueAndMeetingDateBetweenOrderByMeetingDateDesc(
                     java.time.LocalDate fromDate, java.time.LocalDate toDate);

       java.util.List<QmsMeetingSchedule> findByIsActiveTrueOrderByMeetingDateDesc();

       @Query(value = "SELECT m.* FROM QMS_MEETING_SCHEDULE m LEFT JOIN AD_STATUS_MASTER sm ON sm.ID = m.STATUS WHERE 1 = 1 "
                     +
                     "AND (:status IS NULL OR UPPER(sm.NAME) = UPPER(:status)) " +
                     "AND (:search IS NULL OR m.SCHEDULE_NO LIKE '%' + :search + '%' OR m.COMMENTS LIKE '%' + :search + '%') "
                     +
                     "ORDER BY m.id DESC", nativeQuery = true)
       org.springframework.data.domain.Slice<QmsMeetingSchedule> findByFiltersFts(
                     @org.springframework.data.repository.query.Param("status") String status,
                     @org.springframework.data.repository.query.Param("search") String search,
                     org.springframework.data.domain.Pageable pageable);

       @Query(value = "SELECT m.* FROM QMS_MEETING_SCHEDULE m LEFT JOIN AD_STATUS_MASTER sm ON sm.ID = m.STATUS WHERE 1 = 1 "
                     +
                     "AND (:status IS NULL OR UPPER(sm.NAME) = UPPER(:status)) " +
                     "AND (:search IS NULL OR m.SCHEDULE_NO LIKE '%' + :search + '%' OR m.COMMENTS LIKE '%' + :search + '%') "
                     +
                     "ORDER BY m.id DESC", nativeQuery = true)
       org.springframework.data.domain.Slice<QmsMeetingSchedule> findByFiltersLike(
                     @org.springframework.data.repository.query.Param("status") String status,
                     @org.springframework.data.repository.query.Param("search") String search,
                     org.springframework.data.domain.Pageable pageable);

       @Query(value = "SELECT m.* FROM QMS_MEETING_SCHEDULE m LEFT JOIN AD_STATUS_MASTER sm ON sm.ID = m.STATUS WHERE 1 = 1 "
                     +
                     "AND (:status IS NULL OR UPPER(sm.NAME) = UPPER(:status)) " +
                     "AND (:search IS NULL OR m.SCHEDULE_NO LIKE '%' + :search + '%' OR m.COMMENTS LIKE '%' + :search + '%') "
                     +
                     "ORDER BY m.id DESC", nativeQuery = true)
       java.util.List<QmsMeetingSchedule> findByFiltersFtsList(
                     @org.springframework.data.repository.query.Param("status") String status,
                     @org.springframework.data.repository.query.Param("search") String search);

       @Query(value = "SELECT m.* FROM QMS_MEETING_SCHEDULE m LEFT JOIN AD_STATUS_MASTER sm ON sm.ID = m.STATUS WHERE 1 = 1 "
                     +
                     "AND (:status IS NULL OR UPPER(sm.NAME) = UPPER(:status)) " +
                     "AND (:search IS NULL OR m.SCHEDULE_NO LIKE '%' + :search + '%' OR m.COMMENTS LIKE '%' + :search + '%') "
                     +
                     "ORDER BY m.id DESC", nativeQuery = true)
       java.util.List<QmsMeetingSchedule> findByFiltersLikeList(
                     @org.springframework.data.repository.query.Param("status") String status,
                     @org.springframework.data.repository.query.Param("search") String search);

       @Query(value = "SELECT m.* FROM QMS_MEETING_SCHEDULE m LEFT JOIN AD_STATUS_MASTER sm ON sm.ID = m.STATUS WHERE 1 = 1 "
                     +
                     "AND UPPER(sm.NAME) IN :statusList " +
                     "AND (:search IS NULL OR m.SCHEDULE_NO LIKE '%' + :search + '%' OR m.COMMENTS LIKE '%' + :search + '%') "
                     +
                     "ORDER BY m.id DESC", nativeQuery = true)
       java.util.List<QmsMeetingSchedule> findByStatusListAndSearch(
                     @org.springframework.data.repository.query.Param("statusList") java.util.List<String> statusList,
                     @org.springframework.data.repository.query.Param("search") String search);

       @Query(value = "SELECT m.* FROM QMS_MEETING_SCHEDULE m WHERE 1 = 1 " +
                     "AND (:search IS NULL OR m.SCHEDULE_NO LIKE '%' + :search + '%' OR m.COMMENTS LIKE '%' + :search + '%') "
                     +
                     "ORDER BY m.id DESC", nativeQuery = true)
       java.util.List<QmsMeetingSchedule> findBySearch(
                     @org.springframework.data.repository.query.Param("search") String search);

       @Query("SELECT DISTINCT s FROM QmsMeetingSchedule s " +
                     "LEFT JOIN s.hostBy hb " +
                     "LEFT JOIN s.secondaryHost sh " +
                     "LEFT JOIN s.tertiaryHost th " +
                     "LEFT JOIN s.participants p " +
                     "LEFT JOIN p.employee pe " +
                     "LEFT JOIN s.statusObj st " +
                     "WHERE (st IS NULL OR UPPER(st.name) IN ('OPEN', 'RESCHEDULE', 'SCHEDULED')) " +
                     "AND (hb.id = :hostId OR (sh IS NOT NULL AND sh.id = :hostId) OR (th IS NOT NULL AND th.id = :hostId) OR (pe IS NOT NULL AND pe.id = :hostId)) " +
                     "AND s.meetingDate <= :targetDate")
       java.util.List<QmsMeetingSchedule> findEligibleSchedulesForMOM(
                     @org.springframework.data.repository.query.Param("hostId") Long hostId,
                     @org.springframework.data.repository.query.Param("targetDate") java.time.LocalDate targetDate);
}
