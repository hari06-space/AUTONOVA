package com.autonoma.erp.modules.npd.product.entity;

import com.autonoma.erp.model.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "NPD_WIND_FARM")
@Getter
@Setter
public class ProductWindFarm extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "WIND_FARM_NAME", nullable = false, unique = true, length = 100)
    private String windFarmName;

    @Column(name = "CITY", nullable = false, length = 100)
    private String city;

    @Column(name = "STATE", nullable = false, length = 100)
    private String state;

    @Column(name = "COUNTRY", nullable = false, length = 100)
    private String country;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getWindFarmName() { return windFarmName; }
    public void setWindFarmName(String windFarmName) { this.windFarmName = windFarmName; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
}
