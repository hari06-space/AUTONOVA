package com.autonoma.erp.modules.master.contact.service;

import com.autonoma.erp.modules.master.contact.entity.ContactMaster;
import com.autonoma.erp.modules.master.contact.repository.ContactMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ContactMasterService {

    private final ContactMasterRepository repository;

    @org.springframework.beans.factory.annotation.Autowired
    public ContactMasterService(ContactMasterRepository repository) {
        this.repository = repository;
    }

    public List<ContactMaster> getAllContacts() {
        return repository.findAll();
    }

    public Optional<ContactMaster> getContactById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public ContactMaster saveContact(ContactMaster contact) {
        return repository.save(contact);
    }

    @Transactional
    public void deleteContact(Long id) {
        repository.deleteById(id);
    }
}
