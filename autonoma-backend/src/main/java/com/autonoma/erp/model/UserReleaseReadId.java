package com.autonoma.erp.model;

import java.io.Serializable;
import java.util.Objects;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserReleaseReadId implements Serializable {
    private String userId;
    private Long releaseId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserReleaseReadId that = (UserReleaseReadId) o;
        return Objects.equals(userId, that.userId) &&
               Objects.equals(releaseId, that.releaseId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, releaseId);
    }
}
