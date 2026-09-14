package com.autonoma.erp.modules.qmt.repository;

import com.autonoma.erp.modules.qmt.entity.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import com.autonoma.erp.modules.qmt.dto.MachineListDTO;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

@Repository
public interface MachineRepository extends JpaRepository<Machine, Long> {
    Optional<Machine> findByAssetIdIgnoreCase(String assetId);
    Optional<Machine> findByAssetNameIgnoreCase(String assetName);
    boolean existsByAssetIdIgnoreCase(String assetId);
    boolean existsByAssetNameIgnoreCase(String assetName);
    
    // For update validation where we exclude the current machine's ID
    boolean existsByAssetIdIgnoreCaseAndIdNot(String assetId, Long id);
    boolean existsByAssetNameIgnoreCaseAndIdNot(String assetName, Long id);

    @Query("SELECT new com.autonoma.erp.modules.qmt.dto.MachineListDTO(" +
           "m.id, m.assetId, m.assetName, " +
           "g.id, g.groupName, " +
           "t.id, t.type, " +
           "m.make, m.modelNo, m.status, m.createdDate, m.updatedDate) " +
           "FROM Machine m " +
           "LEFT JOIN m.assetGroup g " +
           "LEFT JOIN m.assetType t " +
           "ORDER BY m.id DESC")
    List<MachineListDTO> findAllProjected();
}
