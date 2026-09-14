package com.autonoma.erp.modules.hr.attendance.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceDailyLogDTO {
    private Long id;
    private Long empId;
    private String empCode;
    private String empName;
    private String department;
    private String designation;

    private Long shiftId;
    private String shiftCode;
    private String shiftName;
    private String shiftStartTime;  // "HH:mm" from ShiftMaster
    private String shiftEndTime;    // "HH:mm" from ShiftMaster
    private Integer graceMinutes;

    private LocalDate attendanceDate;
    private LocalTime inTime;
    private LocalTime outTime;

    private Integer earlyIn;
    private Integer earlyOut;
    private Integer duration;
    private Integer lom;
    private Integer ot;

    private String attType;
    private String remarks;
    private String fromWhere;
    private String otEligible;

    private Boolean isModified; // transient flag for frontend tracking

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmpId() { return empId; }
    public void setEmpId(Long empId) { this.empId = empId; }
    public String getEmpCode() { return empCode; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }
    public String getEmpName() { return empName; }
    public void setEmpName(String empName) { this.empName = empName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }
    public String getShiftCode() { return shiftCode; }
    public void setShiftCode(String shiftCode) { this.shiftCode = shiftCode; }
    public String getShiftName() { return shiftName; }
    public void setShiftName(String shiftName) { this.shiftName = shiftName; }
    public String getShiftStartTime() { return shiftStartTime; }
    public void setShiftStartTime(String shiftStartTime) { this.shiftStartTime = shiftStartTime; }
    public String getShiftEndTime() { return shiftEndTime; }
    public void setShiftEndTime(String shiftEndTime) { this.shiftEndTime = shiftEndTime; }
    public Integer getGraceMinutes() { return graceMinutes; }
    public void setGraceMinutes(Integer graceMinutes) { this.graceMinutes = graceMinutes; }
    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }
    public LocalTime getInTime() { return inTime; }
    public void setInTime(LocalTime inTime) { this.inTime = inTime; }
    public LocalTime getOutTime() { return outTime; }
    public void setOutTime(LocalTime outTime) { this.outTime = outTime; }
    public Integer getEarlyIn() { return earlyIn; }
    public void setEarlyIn(Integer earlyIn) { this.earlyIn = earlyIn; }
    public Integer getEarlyOut() { return earlyOut; }
    public void setEarlyOut(Integer earlyOut) { this.earlyOut = earlyOut; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public Integer getLom() { return lom; }
    public void setLom(Integer lom) { this.lom = lom; }
    public Integer getOt() { return ot; }
    public void setOt(Integer ot) { this.ot = ot; }
    public String getAttType() { return attType; }
    public void setAttType(String attType) { this.attType = attType; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getFromWhere() { return fromWhere; }
    public void setFromWhere(String fromWhere) { this.fromWhere = fromWhere; }
    public String getOtEligible() { return otEligible; }
    public void setOtEligible(String otEligible) { this.otEligible = otEligible; }
    public Boolean getIsModified() { return isModified; }
    public void setIsModified(Boolean isModified) { this.isModified = isModified; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id; private Long empId; private String empCode; private String empName;
        private String department; private String designation;
        private Long shiftId; private String shiftCode; private String shiftName;
        private String shiftStartTime; private String shiftEndTime; private Integer graceMinutes;
        private java.time.LocalDate attendanceDate; private java.time.LocalTime inTime; private java.time.LocalTime outTime;
        private Integer earlyIn; private Integer earlyOut; private Integer duration; private Integer lom; private Integer ot;
        private String attType; private String remarks; private String fromWhere; private String otEligible;
        private Boolean isModified;
        public Builder id(Long v) { this.id = v; return this; }
        public Builder empId(Long v) { this.empId = v; return this; }
        public Builder empCode(String v) { this.empCode = v; return this; }
        public Builder empName(String v) { this.empName = v; return this; }
        public Builder department(String v) { this.department = v; return this; }
        public Builder designation(String v) { this.designation = v; return this; }
        public Builder shiftId(Long v) { this.shiftId = v; return this; }
        public Builder shiftCode(String v) { this.shiftCode = v; return this; }
        public Builder shiftName(String v) { this.shiftName = v; return this; }
        public Builder shiftStartTime(String v) { this.shiftStartTime = v; return this; }
        public Builder shiftEndTime(String v) { this.shiftEndTime = v; return this; }
        public Builder graceMinutes(Integer v) { this.graceMinutes = v; return this; }
        public Builder attendanceDate(java.time.LocalDate v) { this.attendanceDate = v; return this; }
        public Builder inTime(java.time.LocalTime v) { this.inTime = v; return this; }
        public Builder outTime(java.time.LocalTime v) { this.outTime = v; return this; }
        public Builder earlyIn(Integer v) { this.earlyIn = v; return this; }
        public Builder earlyOut(Integer v) { this.earlyOut = v; return this; }
        public Builder duration(Integer v) { this.duration = v; return this; }
        public Builder lom(Integer v) { this.lom = v; return this; }
        public Builder ot(Integer v) { this.ot = v; return this; }
        public Builder attType(String v) { this.attType = v; return this; }
        public Builder remarks(String v) { this.remarks = v; return this; }
        public Builder fromWhere(String v) { this.fromWhere = v; return this; }
        public Builder otEligible(String v) { this.otEligible = v; return this; }
        public Builder isModified(Boolean v) { this.isModified = v; return this; }
        public AttendanceDailyLogDTO build() {
            AttendanceDailyLogDTO dto = new AttendanceDailyLogDTO();
            dto.id = this.id; dto.empId = this.empId; dto.empCode = this.empCode; dto.empName = this.empName;
            dto.department = this.department; dto.designation = this.designation;
            dto.shiftId = this.shiftId; dto.shiftCode = this.shiftCode; dto.shiftName = this.shiftName;
            dto.shiftStartTime = this.shiftStartTime; dto.shiftEndTime = this.shiftEndTime; dto.graceMinutes = this.graceMinutes;
            dto.attendanceDate = this.attendanceDate; dto.inTime = this.inTime; dto.outTime = this.outTime;
            dto.earlyIn = this.earlyIn; dto.earlyOut = this.earlyOut; dto.duration = this.duration;
            dto.lom = this.lom; dto.ot = this.ot;
            dto.attType = this.attType; dto.remarks = this.remarks; dto.fromWhere = this.fromWhere;
            dto.otEligible = this.otEligible; dto.isModified = this.isModified;
            return dto;
        }
    }
}
