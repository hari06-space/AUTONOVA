package com.autonoma.erp.modules.sm.customer.controller;


import com.autonoma.erp.security.RequirePagePermission;
import com.autonoma.erp.modules.sm.customer.entity.CustomerAddress;
import com.autonoma.erp.modules.sm.customer.service.CustomerAddressService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sm/customer-details")
@Tag(name = "Customer Address", description = "Customer Address Management APIs")
public class CustomerAddressController {

    private final CustomerAddressService service;

    @org.springframework.beans.factory.annotation.Autowired
    public CustomerAddressController(CustomerAddressService service) {
        this.service = service;
    }

    @GetMapping
    public List<CustomerAddress> getAllAddresses(@RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return service.getAddressesByCustomerId(customerId);
        }
        return service.getAllAddresses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerAddress> getAddressById(@PathVariable Long id) {
        return service.getAddressById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping


    @RequirePagePermission(pageCode = "M5130", action = "write")
    public CustomerAddress createAddress(@RequestBody CustomerAddress address) {
        return service.saveAddress(address);
    }

    @PutMapping("/{id}")


    @RequirePagePermission(pageCode = "M5130", action = "write")
    public ResponseEntity<CustomerAddress> updateAddress(@PathVariable Long id, @RequestBody CustomerAddress details) {
        return service.getAddressById(id)
                .map(address -> {
                    address.setCustomerName(details.getCustomerName());
                    address.setInvoiceName(details.getInvoiceName());
                    address.setShipment(details.getShipment());
                    address.setAddress(details.getAddress());
                    address.setCity(details.getCity());
                    address.setDistrict(details.getDistrict());
                    address.setState(details.getState());
                    address.setCountry(details.getCountry());
                    address.setPincode(details.getPincode());
                    address.setDistance(details.getDistance());
                    address.setContactName(details.getContactName());
                    address.setContactNo(details.getContactNo());
                    address.setStatus(details.getStatus());
                    return ResponseEntity.ok(service.saveAddress(address));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")


    @RequirePagePermission(pageCode = "M5130", action = "delete")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        service.deleteAddress(id);
        return ResponseEntity.ok().build();
    }
}
