/*
 * Organization: Nutech
 * Owner: Logaraj S
 * Created At: 2026-08-30
 * Updated By: Logaraj S
 * Updated At: 2026-09-01
 * Description: Persistence repository for HRA_OFFER_LETTERS, including paginated list by type.
 */
package com.autonoma.erp.modules.hra.letters.repository;

import com.autonoma.erp.modules.hra.letters.entity.HraLetter;
import com.autonoma.erp.modules.platform.common.entity.StatusMaster;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HraLetterRepository extends JpaRepository<HraLetter, Long> {
    List<HraLetter> findByLetterType(String letterType);

    List<HraLetter> findByLetterTypeOrderByIdDesc(String letterType);

    Page<HraLetter> findByLetterType(String letterType, Pageable pageable);

    List<HraLetter> findByEmployeeCode(String employeeCode);

    List<HraLetter> findByApplicantId(Long applicantId);

    List<HraLetter> findByStatus_Id(Long statusId);

    List<HraLetter> findByStatus(StatusMaster status);

    Optional<HraLetter> findByRefNo(String refNo);
}
