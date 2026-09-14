package com.autonoma.erp.modules.hr.onboarding.repository;

import com.autonoma.erp.modules.hr.onboarding.entity.HrOnboardOfferLetter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HrOnboardOfferLetterRepository extends JpaRepository<HrOnboardOfferLetter, Long> {
}
