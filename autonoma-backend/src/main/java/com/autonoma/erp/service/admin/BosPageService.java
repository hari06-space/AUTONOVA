package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.BosPage;
import com.autonoma.erp.repository.admin.BosPageRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BosPageService {

    @Autowired
    private BosPageRepository pageRepository;

    public List<BosPage> getAllPages() {
        return pageRepository.findAll();
    }

    @Transactional
    public void saveAll(List<BosPage> pages) {
        pageRepository.saveAll(pages);
    }
}
