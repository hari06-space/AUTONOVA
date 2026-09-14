package com.autonoma.erp.modules.npd.product.entity;

import java.io.Serializable;
import java.util.Objects;

public class ProductCapacityId implements Serializable {

    private String model;
    private String uom;
    private Double capacityVal;

    public ProductCapacityId() {}

    public ProductCapacityId(String model, String uom, Double capacityVal) {
        this.model = model;
        this.uom = uom;
        this.capacityVal = capacityVal;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getUom() {
        return uom;
    }

    public void setUom(String uom) {
        this.uom = uom;
    }

    public Double getCapacityVal() {
        return capacityVal;
    }

    public void setCapacityVal(Double capacityVal) {
        this.capacityVal = capacityVal;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProductCapacityId that = (ProductCapacityId) o;
        return Objects.equals(model, that.model) &&
               Objects.equals(uom, that.uom) &&
               Objects.equals(capacityVal, that.capacityVal);
    }

    @Override
    public int hashCode() {
        return Objects.hash(model, uom, capacityVal);
    }
}
