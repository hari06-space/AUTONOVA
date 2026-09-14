package com.autonoma.erp.modules.hr.orgstructure.entity;

public enum DepartmentCategory {
    QMS(1),
    HUMAN_RESOURCE(2),
    MANAGEMENT(3);

    private final int id;

    DepartmentCategory(int id) {
        this.id = id;
    }

    public int getId() {
        return id;
    }

    public static boolean isValid(Integer id) {
        if (id == null) return false;
        for (DepartmentCategory cat : values()) {
            if (cat.getId() == id) {
                return true;
            }
        }
        return false;
    }
}
