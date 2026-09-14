package com.autonoma.erp.repository.admin;

import com.autonoma.erp.model.admin.PrefixCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrefixCredentialRepository extends JpaRepository<PrefixCredential, String> {
}
