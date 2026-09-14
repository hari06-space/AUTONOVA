package com.autonoma.erp.modules.hr.employee.repository;

import com.autonoma.erp.modules.hr.employee.entity.EmployeeBirthdayWish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployeeBirthdayWishRepository extends JpaRepository<EmployeeBirthdayWish, Long> {
    
    List<EmployeeBirthdayWish> findByRecipientEmployeeIdAndWishYearOrderByCreatedDateDesc(Long recipientEmployeeId, Integer wishYear);
    
    boolean existsByRecipientEmployeeIdAndSenderEmployeeIdAndWishYear(Long recipientEmployeeId, Long senderEmployeeId, Integer wishYear);
}
