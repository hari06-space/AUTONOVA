package com.autonoma.erp.repository.admin;

import org.springframework.data.jpa.repository.JpaRepository;

import com.autonoma.erp.model.admin.UserCredential;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserCredential, String> {
    Optional<UserCredential> findByUserId(String userId);
    Optional<UserCredential> findByUserIdIgnoreCase(String userId);
    Optional<UserCredential> findFirstByEmpId(Long empId);
    java.util.List<UserCredential> findByEmpId(Long empId);

    @org.springframework.data.jpa.repository.Query("SELECT u.userId FROM UserCredential u")
    java.util.List<String> findAllUserIds();
    boolean existsByEmpId(Long empId);
    void deleteByEmpId(Long empId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u.empId FROM UserCredential u WHERE u.empId IS NOT NULL")
    java.util.Set<Long> findAllEmpIdsWithCredentials();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u.empId FROM UserCredential u WHERE u.userLevel >= :level AND u.empId IS NOT NULL")
    java.util.List<Long> findEmpIdsByUserLevelGreaterThanEqual(@org.springframework.data.repository.query.Param("level") Integer level);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u.empId FROM UserCredential u WHERE u.userLevel = :level AND u.empId IS NOT NULL")
    java.util.List<Long> findEmpIdsByUserLevel(@org.springframework.data.repository.query.Param("level") Integer level);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM UserCredential u WHERE (u.status IS NULL OR u.status = 1) AND ((u.faceEmbeddings IS NOT NULL AND TRIM(u.faceEmbeddings) <> '') OR (u.faceDescriptor IS NOT NULL AND TRIM(u.faceDescriptor) <> ''))")
    java.util.List<UserCredential> findActiveUsersWithFaceData();

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM UserCredential u WHERE (u.status IS NULL OR u.status = 1) AND (u.isActive IS NULL OR u.isActive = true)")
    long countActiveUsers();

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM UserCredential u WHERE u.userLevel >= :level AND (u.status IS NULL OR u.status = 1)")
    long countActiveBossAdmins(@org.springframework.data.repository.query.Param("level") Integer level);
}
