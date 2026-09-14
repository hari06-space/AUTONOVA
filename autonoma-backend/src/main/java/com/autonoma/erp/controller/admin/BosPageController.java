package com.autonoma.erp.controller.admin;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.model.admin.BosPage;
import com.autonoma.erp.service.admin.BosPageService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bos-pages")
@CrossOrigin
public class BosPageController {

    @Autowired
    private BosPageService pageService;

    @GetMapping
    public ResponseEntity<List<BosPage>> getAllPages() {
        return ResponseEntity.ok(pageService.getAllPages());
    }

    @PostMapping("/save-all")


    @RequirePagePermission(pageCode = "AD1210", action = "write")
    public ResponseEntity<String> saveAll(@RequestBody List<BosPage> pages) {
        pageService.saveAll(pages);
        return ResponseEntity.ok("Pages updated successfully");
    }
}
