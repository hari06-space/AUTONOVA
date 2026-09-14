package com.autonoma.erp.modules.sm.customer.service;

import com.autonoma.erp.modules.sm.customer.entity.CustomerAddress;
import com.autonoma.erp.modules.sm.customer.repository.CustomerAddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerAddressService {

    private final CustomerAddressRepository repository;

    @org.springframework.beans.factory.annotation.Autowired
    public CustomerAddressService(CustomerAddressRepository repository) {
        this.repository = repository;
    }

    public List<CustomerAddress> getAllAddresses() {
        return repository.findAll();
    }

    public List<CustomerAddress> getAddressesByCustomerId(Long customerId) {
        return repository.findByCustomerId(customerId);
    }

    public Optional<CustomerAddress> getAddressById(Long id) {
        return repository.findById(id);
    }

    public CustomerAddress saveAddress(CustomerAddress address) {
        return repository.save(address);
    }

    public void deleteAddress(Long id) {
        repository.deleteById(id);
    }
}
