package com.autonoma.erp.modules.sm.sales.specification;

import com.autonoma.erp.modules.sm.sales.entity.SalesPriceMaster;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class SalesPriceMasterSpecification {

    public static Specification<SalesPriceMaster> getSpecification(
            String priceListType,
            Long customerId,
            String status,
            String verifyStatus,
            Date effectiveDate,
            String priceListNo,
            String globalSearch) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (priceListType != null && !priceListType.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("priceListType"), priceListType));
            }

            if (customerId != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (verifyStatus != null && !verifyStatus.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("verifyStatus").get("name")), verifyStatus.trim().toLowerCase()));
            }

            if (effectiveDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("effectiveFrom"), effectiveDate));
                predicates.add(cb.or(
                    cb.isNull(root.get("effectiveTo")),
                    cb.greaterThanOrEqualTo(root.get("effectiveTo"), effectiveDate)
                ));
            }

            if (priceListNo != null && !priceListNo.trim().isEmpty()) {
                predicates.add(cb.like(root.get("priceListNo"), "%" + priceListNo + "%"));
            }

            if (globalSearch != null && !globalSearch.trim().isEmpty()) {
                String searchPattern = "%" + globalSearch.toLowerCase() + "%";
                Predicate noPredicate = cb.like(cb.lower(root.get("priceListNo")), searchPattern);
                Predicate refPredicate = cb.like(cb.lower(root.get("referenceNo")), searchPattern);
                Predicate custPredicate = cb.like(cb.lower(root.get("customer").get("ledgerName")), searchPattern);
                predicates.add(cb.or(noPredicate, refPredicate, custPredicate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
