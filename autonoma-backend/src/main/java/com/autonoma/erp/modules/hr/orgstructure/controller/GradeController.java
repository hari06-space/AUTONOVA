package com.autonoma.erp.modules.hr.orgstructure.controller;

import java.util.List;
import org.springframework.cache.annotation.CacheEvict;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.autonoma.erp.modules.hr.orgstructure.entity.Gradedetails;
import com.autonoma.erp.modules.hr.orgstructure.service.EmpGradeService;
import com.autonoma.erp.security.RequirePagePermission;

@RestController
@RequestMapping("/api/master/hr/grades")
@CrossOrigin(origins = "*")
public class GradeController {

    @Autowired
    private EmpGradeService gradeDetailsService;

    @GetMapping
    public List<Gradedetails> getAllGradeDetails() {
        return gradeDetailsService.getAllGradeDetails();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Gradedetails> getGradeDetailById(@PathVariable Long id) {
        Gradedetails gradeDetail = gradeDetailsService.getGradeDetailById(id);
        if (gradeDetail != null) {
            return ResponseEntity.ok(gradeDetail);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @RequirePagePermission(pageCode = "M2260", action = "write")
    @CacheEvict(value = "masterCache", key = "'GRADES'")
    public Gradedetails createGradeDetail(@RequestBody Gradedetails gradeDetail) {
        return gradeDetailsService.createGradeDetail(gradeDetail);
    }

    @PutMapping("/{id}")
    @RequirePagePermission(pageCode = "M2260", action = "write")
    @CacheEvict(value = "masterCache", key = "'GRADES'")
    public ResponseEntity<Gradedetails> updateGradeDetail(@PathVariable Long id,
            @RequestBody Gradedetails gradeDetailDetails) {
        Gradedetails updatedGradeDetail = gradeDetailsService.updateGradeDetail(id, gradeDetailDetails);
        if (updatedGradeDetail != null) {
            return ResponseEntity.ok(updatedGradeDetail);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/next-no")
    public String getNextNo() {
        return gradeDetailsService.getNextGradeNo();
    }

    @DeleteMapping("/{id}")
    @RequirePagePermission(pageCode = "M2260", action = "delete")
    @CacheEvict(value = "masterCache", key = "'GRADES'")
    public ResponseEntity<Void> deleteGradeDetail(@PathVariable Long id) {
        gradeDetailsService.deleteGradeDetail(id);
        return ResponseEntity.ok().build();
    }
}
