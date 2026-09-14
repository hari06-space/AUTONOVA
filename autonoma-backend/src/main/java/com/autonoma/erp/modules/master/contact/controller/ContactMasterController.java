package com.autonoma.erp.modules.master.contact.controller;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.master.contact.entity.ContactMaster;
import com.autonoma.erp.modules.master.contact.service.ContactMasterService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sm/contacts")
@Tag(name = "Contact Master", description = "Contact Master Management APIs")
public class ContactMasterController {

    private final ContactMasterService service;

    @org.springframework.beans.factory.annotation.Autowired
    public ContactMasterController(ContactMasterService service) {
        this.service = service;
    }

    @GetMapping
    public List<ContactMaster> getAllContacts() {
        return service.getAllContacts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactMaster> getContactById(@PathVariable Long id) {
        return service.getContactById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping


    @RequirePagePermission(pageCode = "M5120", action = "write")
    public ContactMaster createContact(@RequestBody ContactMaster contact) {
        return service.saveContact(contact);
    }

    @PutMapping("/{id}")


    @RequirePagePermission(pageCode = "M5120", action = "write")
    public ResponseEntity<ContactMaster> updateContact(@PathVariable Long id, @RequestBody ContactMaster contactDetails) {
        return service.getContactById(id)
                .map(contact -> {
                    contact.setGroupName(contactDetails.getGroupName());
                    contact.setTitle(contactDetails.getTitle());
                    contact.setContactName(contactDetails.getContactName());
                    contact.setDesignation(contactDetails.getDesignation());
                    contact.setDepartment(contactDetails.getDepartment());
                    contact.setEmailId(contactDetails.getEmailId());
                    contact.setLandlineNo(contactDetails.getLandlineNo());
                    contact.setMobileNo(contactDetails.getMobileNo());
                    contact.setWhatsAppNo(contactDetails.getWhatsAppNo());
                    contact.setType(contactDetails.getType());
                    contact.setContactType(contactDetails.getContactType());
                    contact.setFileUpload(contactDetails.getFileUpload());
                    contact.setStatus(contactDetails.getStatus());
                    contact.setUpdatedBy(contactDetails.getUpdatedBy());
                    return ResponseEntity.ok(service.saveContact(contact));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")


    @RequirePagePermission(pageCode = "M5120", action = "delete")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id) {
        service.deleteContact(id);
        return ResponseEntity.ok().build();
    }
}
