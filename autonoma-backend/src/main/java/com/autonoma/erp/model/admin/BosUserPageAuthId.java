package com.autonoma.erp.model.admin;

import java.io.Serializable;
import java.util.Objects;

public class BosUserPageAuthId implements Serializable {
    private String userId;
    private Integer pageId;

    public BosUserPageAuthId() {
    }

    public BosUserPageAuthId(String userId, Integer pageId) {
        this.userId = userId;
        this.pageId = pageId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Integer getPageId() {
        return pageId;
    }

    public void setPageId(Integer pageId) {
        this.pageId = pageId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        BosUserPageAuthId that = (BosUserPageAuthId) o;
        return Objects.equals(userId, that.userId) && Objects.equals(pageId, that.pageId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, pageId);
    }
}
