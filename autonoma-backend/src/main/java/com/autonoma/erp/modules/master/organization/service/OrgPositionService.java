package com.autonoma.erp.modules.master.organization.service;

import com.autonoma.erp.dto.OrgPositionDTO;
import com.autonoma.erp.modules.hr.orgstructure.entity.Department;
import com.autonoma.erp.modules.hr.orgstructure.entity.Designation;
import com.autonoma.erp.modules.hr.employee.entity.EmployeeMaster;
import com.autonoma.erp.modules.master.organization.entity.OrgPosition;
import com.autonoma.erp.modules.hr.orgstructure.repository.DepartmentRepository;
import com.autonoma.erp.modules.hr.orgstructure.repository.DesignationRepository;
import com.autonoma.erp.modules.hr.employee.repository.EmployeeMasterRepository;
import com.autonoma.erp.modules.master.organization.repository.OrgPositionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class OrgPositionService {

    @Autowired
    private OrgPositionRepository positionRepository;

    @Autowired
    private EmployeeMasterRepository employeeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DesignationRepository designationRepository;

    public OrgPosition createPosition(OrgPosition position) {
        return positionRepository.save(position);
    }

    public OrgPosition updatePosition(Long id, OrgPosition positionDetails) {
        OrgPosition position = positionRepository.findById(id).orElseThrow(() -> new RuntimeException("Position not found"));
        
        if (positionDetails.getPositionTitle() != null) position.setPositionTitle(positionDetails.getPositionTitle());
        if (positionDetails.getDepartmentId() != null) position.setDepartmentId(positionDetails.getDepartmentId());
        position.setParentPositionId(positionDetails.getParentPositionId());
        position.setSecondaryParentIds(positionDetails.getSecondaryParentIds());
        if (positionDetails.getStatus() != null) position.setStatus(positionDetails.getStatus());
        
        return positionRepository.save(position);
    }

    public OrgPosition assignEmployee(Long positionId, Long employeeId) {
        // If employee is already assigned to another active position, unassign them first so they move seamlessly
        List<OrgPosition> allActive = positionRepository.findByStatus("Active");
        for (OrgPosition p : allActive) {
            if (employeeId.equals(p.getAssignedEmployeeId()) && !p.getId().equals(positionId)) {
                p.setAssignedEmployeeId(null);
                positionRepository.save(p);
            }
        }

        OrgPosition position = positionRepository.findById(positionId).orElseThrow(() -> new RuntimeException("Position not found"));
        position.setAssignedEmployeeId(employeeId);
        return positionRepository.save(position);
    }

    public OrgPosition unassignEmployee(Long positionId) {
        OrgPosition position = positionRepository.findById(positionId).orElseThrow(() -> new RuntimeException("Position not found"));
        position.setAssignedEmployeeId(null);
        return positionRepository.save(position);
    }

    public void deletePosition(Long id) {
        OrgPosition position = positionRepository.findById(id).orElseThrow(() -> new RuntimeException("Position not found"));
        // Check if it has children
        boolean hasChildren = false;
        List<OrgPosition> all = positionRepository.findByStatus("Active");
        for (OrgPosition p : all) {
            if (id.equals(p.getParentPositionId())) {
                hasChildren = true;
                break;
            }
        }
        if (hasChildren) {
            throw new RuntimeException("Cannot delete position because it has child positions.");
        }
        positionRepository.delete(position);
    }

    public List<OrgPositionDTO> getPositionTree() {
        List<OrgPosition> allPositions = positionRepository.findByStatus("Active");
        List<EmployeeMaster> allEmployees = employeeRepository.findAll();
        List<Department> allDepartments = departmentRepository.findAll();
        List<Designation> allDesignations = designationRepository.findAll();

        Map<Long, EmployeeMaster> empMap = new HashMap<>();
        for (EmployeeMaster emp : allEmployees) {
            empMap.put(emp.getId(), emp);
        }

        Map<Long, String> deptMap = new HashMap<>();
        for (Department dept : allDepartments) {
            deptMap.put(dept.getId(), dept.getDepartmentName());
        }

        Map<Long, String> desigMap = new HashMap<>();
        for (Designation desig : allDesignations) {
            desigMap.put(desig.getId(), desig.getDesignationName());
        }

        Map<Long, OrgPositionDTO> dtoMap = new HashMap<>();
        List<OrgPositionDTO> roots = new ArrayList<>();

        // Create DTOs for all active positions
        for (OrgPosition pos : allPositions) {
            OrgPositionDTO dto = new OrgPositionDTO();
            dto.setId(pos.getId());
            dto.setPositionTitle(pos.getPositionTitle());
            dto.setDepartmentId(pos.getDepartmentId());
            dto.setParentPositionId(pos.getParentPositionId());
            dto.setSecondaryParentIds(pos.getSecondaryParentIds());
            dto.setAssignedEmployeeId(pos.getAssignedEmployeeId());
            dto.setStatus(pos.getStatus());

            if (pos.getAssignedEmployeeId() != null) {
                EmployeeMaster emp = empMap.get(pos.getAssignedEmployeeId());
                boolean hasExited = (emp != null && emp.getExitDate() != null);
                if (emp != null && emp.getStatus() != null) {
                    try {
                        hasExited = hasExited || "Inactive".equalsIgnoreCase(emp.getStatus().getName()) || (emp.getStatus().getId() != null && emp.getStatus().getId() == 13L);
                    } catch (Exception ignored) {
                    }
                }
                
                if (emp != null) {
                    dto.setFirstName(emp.getEmployeeName()); 
                    dto.setLastName(""); 
                    dto.setEmployeeName(emp.getEmployeeName());
                    dto.setEmpCode(emp.getEmpCode() != null ? emp.getEmpCode() : emp.getOldEmpCode());
                    dto.setPhoto(emp.getEmployeePhotoUpload());
                    dto.setIsExited(hasExited);

                    if (emp.getDesignationId() != null) {
                        dto.setDesignationId(desigMap.getOrDefault(emp.getDesignationId(), String.valueOf(emp.getDesignationId())));
                    }
                    if (emp.getDepartmentId() != null) {
                        dto.setDepartmentName(deptMap.getOrDefault(emp.getDepartmentId(), String.valueOf(emp.getDepartmentId())));
                    }
                } else {
                    dto.setIsExited(true);
                    dto.setFirstName("Vacant");
                    dto.setLastName(pos.getPositionTitle());
                    dto.setEmployeeName("Vacant");
                    dto.setDesignationId(pos.getPositionTitle());
                    if (pos.getDepartmentId() != null) {
                        dto.setDepartmentName(deptMap.getOrDefault(pos.getDepartmentId(), String.valueOf(pos.getDepartmentId())));
                    }
                }
            } else {
                dto.setIsExited(false); // It's just an empty position, not an exited employee
                dto.setFirstName("Vacant");
                dto.setLastName(pos.getPositionTitle());
                dto.setEmployeeName("Vacant");
                dto.setDesignationId(pos.getPositionTitle());
                if (pos.getDepartmentId() != null) {
                    dto.setDepartmentName(deptMap.getOrDefault(pos.getDepartmentId(), String.valueOf(pos.getDepartmentId())));
                }
            }

            dtoMap.put(pos.getId(), dto);
        }

        // Populate secondaryParentTitles for Matrix / Dotted-Line Reporting
        for (OrgPositionDTO dto : dtoMap.values()) {
            if (dto.getSecondaryParentIds() != null && !dto.getSecondaryParentIds().trim().isEmpty()) {
                String[] pIds = dto.getSecondaryParentIds().split(",");
                for (String pidStr : pIds) {
                    try {
                        Long pid = Long.parseLong(pidStr.trim());
                        OrgPositionDTO parentDto = dtoMap.get(pid);
                        if (parentDto != null) {
                            String pTitle = parentDto.getEmployeeName() != null && !parentDto.getEmployeeName().isEmpty() && !"Vacant".equalsIgnoreCase(parentDto.getEmployeeName())
                                    ? parentDto.getEmployeeName() + " (" + parentDto.getPositionTitle() + ")"
                                    : parentDto.getPositionTitle();
                            dto.getSecondaryParentTitles().add(pTitle);
                        }
                    } catch (Exception ignored) {}
                }
            }
        }

        // Build tree
        for (OrgPositionDTO dto : dtoMap.values()) {
            if (dto.getParentPositionId() != null && dtoMap.containsKey(dto.getParentPositionId())) {
                dtoMap.get(dto.getParentPositionId()).getChildren().add(dto);
            } else {
                roots.add(dto);
            }
        }

        return roots;
    }
}
