package com.autonoma.erp.modules.qms.maintenance.service;

import com.autonoma.erp.modules.qms.maintenance.entity.EbSlab;
import com.autonoma.erp.modules.qms.maintenance.repository.EbSlabRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EbSlabService {

    private final EbSlabRepository repository;

    public EbSlabService(EbSlabRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void deactivateOtherSlabs(LocalDate currentEffectFrom) {
        List<EbSlab> activeSlabs = repository.findAllActive();
        for (EbSlab slab : activeSlabs) {
            if (currentEffectFrom == null || !slab.getEffectFrom().equals(currentEffectFrom)) {
                slab.setStatus("INACTIVE");
                slab.setIsActive(false);
                repository.save(slab);
            }
        }
    }

    @Transactional
    public void enforceSingleActiveSlab() {
        // No-op to allow multiple active slabs
    }

    @Transactional
    public List<EbSlab> saveSlabRows(List<EbSlab> rows) {
        return repository.saveAll(rows);
    }

    @Transactional
    public void deleteSlab(LocalDate effectFrom) {
        List<EbSlab> rows = repository.findByEffectFromOrderBySeqNo(effectFrom);
        repository.deleteAll(rows);
    }
}

