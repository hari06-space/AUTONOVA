package com.autonoma.erp.modules.npd.hsn.service;

import com.autonoma.erp.modules.npd.hsn.entity.HsnCodeMaster;
import com.autonoma.erp.modules.npd.hsn.repository.HsnCodeMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class HsnCodeMasterService {

    @Autowired
    private HsnCodeMasterRepository repository;

    public List<HsnCodeMaster> getAll() {
        return repository.findAll();
    }

    public Optional<HsnCodeMaster> getByCode(String hsnCode) {
        return repository.findById(hsnCode);
    }

    public HsnCodeMaster create(HsnCodeMaster hsnCodeMaster) {
        if (repository.existsById(hsnCodeMaster.getHsnCode())) {
            throw new IllegalArgumentException("HSN Code already exists");
        }
        return repository.save(hsnCodeMaster);
    }

    public HsnCodeMaster update(String hsnCode, HsnCodeMaster hsnCodeMaster) {
        return repository.findById(hsnCode)
                .map(existing -> {
                    existing.setDescription(hsnCodeMaster.getDescription());
                    existing.setCgstPer(hsnCodeMaster.getCgstPer());
                    existing.setSgstPer(hsnCodeMaster.getSgstPer());
                    existing.setIgstPer(hsnCodeMaster.getIgstPer());
                    existing.setStatus(hsnCodeMaster.getStatus() != null ? hsnCodeMaster.getStatus() : existing.getStatus());
                    return repository.save(existing);
                })
                .orElseThrow(() -> new IllegalArgumentException("HSN Code not found: " + hsnCode));
    }

    public void delete(String hsnCode) {
        if (!repository.existsById(hsnCode)) {
            throw new IllegalArgumentException("HSN Code not found: " + hsnCode);
        }
        repository.deleteById(hsnCode);
    }
}
