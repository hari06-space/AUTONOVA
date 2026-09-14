package com.autonoma.erp.modules.master.admin.repository;

import com.autonoma.erp.modules.master.admin.entity.MstUom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MstUomRepository extends JpaRepository<MstUom, String> {
    List<MstUom> findByStatus(String status);
}
