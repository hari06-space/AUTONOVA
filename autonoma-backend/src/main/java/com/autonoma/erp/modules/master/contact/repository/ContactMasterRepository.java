package com.autonoma.erp.modules.master.contact.repository;

import com.autonoma.erp.modules.master.contact.entity.ContactMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactMasterRepository extends JpaRepository<ContactMaster, Long> {
    java.util.List<ContactMaster> findByGroupNameAndContactName(String groupName, String contactName);
    java.util.List<ContactMaster> findByGroupNameAndMobileNo(String groupName, String mobileNo);
    java.util.List<ContactMaster> findByGroupNameAndEmailId(String groupName, String emailId);
}
