package com.autonoma.erp.modules.master.classification.controller;

import com.autonoma.erp.modules.hr.common.entity.CategoryMaster;
import com.autonoma.erp.modules.hr.orgstructure.entity.LevelMaster;
import com.autonoma.erp.modules.hr.common.repository.CategoryMasterRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.LevelMasterRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/master/hr")
@CrossOrigin(origins = "*")
public class ClassificationController {

    @Autowired private CategoryMasterRepository categoryRepo;
    @Autowired private LevelMasterRepository levelRepo;


    @GetMapping("/categories")
    public List<CategoryMaster> getCategories() { return categoryRepo.findAll(); }

    @GetMapping("/levels")
    public List<LevelMaster> getLevels() { return levelRepo.findAll(); }


}
