package com.nutech.email.controller;

import com.nutech.email.model.Customer;
import com.nutech.email.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerRepository customerRepository;

    @GetMapping
    public ResponseEntity<List<Customer>> getAll() {
        return ResponseEntity.ok(customerRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getById(@PathVariable Long id) {
        return customerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Customer> create(@RequestBody Customer customer) {
        if (customer.getName() == null || customer.getEmail() == null) {
            throw new IllegalArgumentException("Name and email are required");
        }
        return ResponseEntity.ok(customerRepository.save(customer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> update(@PathVariable Long id, @RequestBody Customer updated) {
        return customerRepository.findById(id).map(c -> {
            if (updated.getName() != null) c.setName(updated.getName());
            if (updated.getEmail() != null) c.setEmail(updated.getEmail());
            if (updated.getCompanyName() != null) c.setCompanyName(updated.getCompanyName());
            if (updated.getPhone() != null) c.setPhone(updated.getPhone());
            if (updated.getAddressLine1() != null) c.setAddressLine1(updated.getAddressLine1());
            if (updated.getAddressLine2() != null) c.setAddressLine2(updated.getAddressLine2());
            if (updated.getCity() != null) c.setCity(updated.getCity());
            if (updated.getState() != null) c.setState(updated.getState());
            if (updated.getZipCode() != null) c.setZipCode(updated.getZipCode());
            if (updated.getGstNumber() != null) c.setGstNumber(updated.getGstNumber());
            if (updated.getNotes() != null) c.setNotes(updated.getNotes());
            return ResponseEntity.ok(customerRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!customerRepository.existsById(id)) return ResponseEntity.notFound().build();
        customerRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
