import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Typography,
  Stack,
  MenuItem,
  Box,
  Avatar,
  Divider,
  Chip,
  Badge,
  Tooltip
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconCalendar, IconUser, IconPaperclip } from "@tabler/icons-react";
import axios from "utils/axios";
import { useDispatch, useSelector } from "react-redux";
import { openSnackbar } from "store/slices/snackbar";
import MainCard from "ui-component/cards/MainCard";
import {
  BOSDataTable,
  BOSFormDialog,
  BOSTextField,
  BOSTableToolbar,
  BOSAutocomplete,
  BOSDatePicker,
  BOSTimePicker,
  BOSFormSection,
  BOSFileUpload,
  BOSStatusChip,
  getPhotoUrl,
  BOSFileGallery,
  parseBOSFiles
} from "ui-component/bos";
import useBOSValidation from "hooks/useBOSValidation";
import { setFilterConfig } from "store/slices/search";
import usePagePermissions, { PAGE_CODES } from "hooks/usePagePermissions";
import useBOSFilters from "hooks/useBOSFilters";
import useAuth from "hooks/useAuth";

const todayStr = () => new Date().toISOString().substring(0, 10);

const parseTimeToMinutes = (t) => {
  if (!t) return null;
  const clean = t.trim().toUpperCase();
  const m = clean.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3];
  if (ampm) {
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
  }
  return h * 60 + min;
};

const getDepartmentString = (emp) => {
  if (!emp) return "—";
  if (typeof emp.departmentName === "string" && emp.departmentName) return emp.departmentName;
  if (typeof emp.department === "string" && emp.department) return emp.department;
  if (emp.department && typeof emp.department === "object") {
    return emp.department.departmentName || emp.department.name || "—";
  }
  return "—";
};

const getDesignationString = (emp) => {
  if (!emp) return "—";
  if (typeof emp.designationName === "string" && emp.designationName) return emp.designationName;
  if (typeof emp.designation === "string" && emp.designation) return emp.designation;
  if (emp.designation && typeof emp.designation === "object") {
    return emp.designation.designationName || emp.designation.name || "—";
  }
  return "—";
};

const INITIAL_STATE = {
  id: null,
  employeeId: null,
  odNumber: "",
  visitType: "",
  vehicleType: "",
  purposeOfOd: "",
  fromLocation: "",
  toLocation: "",
  distance: "",
  status: "Pending to Verify",
  whereFrom: "HR OD Entry"
};

const INITIAL_DATES = {
  fromDate: todayStr(),
  toDate: "",
  fromTime: "",
  toTime: ""
};

const VALIDATION_RULES = [
  { field: "employeeId", label: "Employee Name", required: true },
  { field: "visitType", label: "Visit Type", required: true },
  { field: "purposeOfOd", label: "Purpose of Duty", required: true }
];

export default function HraOdDetailsList() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formDates, setFormDates] = useState(INITIAL_DATES);
  const [dateErrors, setDateErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentTitle, setAttachmentTitle] = useState('');

  const handleViewAttachments = (row) => {
    const files = row.uploadedFiles || row.supportingDocuments || row.files || row.attachment || row.attachments || [];
    const parsed = typeof files === 'string' ? parseBOSFiles(files) : (Array.isArray(files) ? files : []);
    setAttachmentFiles(parsed);
    setAttachmentTitle(`Attachments - ${row.odNumber || row.employeeName || ''}`);
    setAttachmentsDialogOpen(true);
  };

  const { errors, validate, clearErrors, setErrors } = useBOSValidation();
  const perms = usePagePermissions(PAGE_CODES.HRA_ATTENDANCE_OD_ENTRY);
  const { employees = [], myTeamEmployees = [], isVerticalHead, matchScope } = useBOSFilters(perms);

  const allowedEmployees = useMemo(() => {
    if (!employees || employees.length === 0) return [];

    const hasCompanyAccess = perms?.additional1 || perms?.company || perms?.all || (user?.userLevel && user.userLevel >= 5);
    if (hasCompanyAccess) {
      return employees;
    }

    const currentEmp = employees.find(
      (e) => String(e.id) === String(user?.empId) || (e.empCode && e.empCode === user?.empCode)
    );

    if (perms?.manager || isVerticalHead) {
      const map = new Map();
      if (currentEmp) map.set(String(currentEmp.id), currentEmp);
      (myTeamEmployees || []).forEach((e) => map.set(String(e.id), e));
      return Array.from(map.values());
    }

    return currentEmp ? [currentEmp] : [];
  }, [employees, myTeamEmployees, isVerticalHead, perms, user]);

  const handleEmployeeChange = (event, value) => {
    const val = value !== undefined ? value : event;
    setSelectedEmployee(val || null);
    if (val) {
      setFormData((prev) => ({ ...prev, employeeId: val.id }));
      if (errors.employeeId) clearErrors("employeeId");
    } else {
      setFormData((prev) => ({ ...prev, employeeId: null }));
    }
  };

  const isEdit = !!formData.id;
  const isReadonly = formData.status === "Approved" || formData.status === "Verified" || formData.status === "Rejected" || formData.status === "Closed";

  const columns = useMemo(() => [
    {
      id: 'attachment',
      label: 'Attachment',
      minWidth: 100,
      align: 'center',
      render: (row) => {
        const files = row.filePaths || row.documents || row.uploadedFiles || row.supportingDocuments || row.files || row.attachment || row.attachments || [];
        const parsed = typeof files === 'string' ? parseBOSFiles(files) : (Array.isArray(files) ? files : []);
        const count = parsed.length;
        const badgeLabel = count > 99 ? '99+' : String(count);

        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Box
              onClick={(e) => {
                e.stopPropagation();
                if (count > 0) handleViewAttachments(row);
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: count > 0 ? 'pointer' : 'default',
                p: 0.5,
                m: 0.5,
                borderRadius: '8px',
                transition: 'background 0.18s ease',
                '&:hover': { backgroundColor: count > 0 ? 'action.hover' : 'transparent' }
              }}
            >
              <Badge
                badgeContent={count > 0 ? badgeLabel : null}
                color="primary"
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                sx={{
                  '& .MuiBadge-badge': {
                    transform: 'scale(1) translate(-25%, -25%)',
                    fontSize: count > 99 ? '0.55rem' : '0.65rem',
                    fontWeight: 800,
                    minWidth: count > 9 ? '20px' : '17px',
                    height: count > 9 ? '20px' : '17px',
                    boxShadow: (theme) => `0 2px 6px 0 ${theme.palette.primary.main}80`
                  }
                }}
              >
                <IconPaperclip
                  size={20}
                  style={{
                    display: 'block',
                    color: count > 0 ? 'inherit' : '#9e9e9e',
                    opacity: count > 0 ? 1 : 0.4
                  }}
                />
              </Badge>
            </Box>
          </Box>
        );
      }
    },
    { id: "index", label: "No", minWidth: 55, frozen: true, align: "center" },
    {
      id: "odNumber", label: "OD Number", bold: true, minWidth: 160, align: "center",
      render: (row) => (
        <Box
          component="span"
          onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
          sx={{
            color: 'primary.main',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.82rem',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          {row.odNumber}
        </Box>
      )
    },
    {
      id: "employeeCode", label: "Employee Code", minWidth: 130, align: "center",
      render: (row) => {
        const emp = employees.find(e => e.id === row.employeeId) || row.employee;
        return (
          <Box sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
            {emp?.empCode || ""}
          </Box>
        );
      }
    },
    {
      id: "employeeName", label: "Employee Name", bold: true, minWidth: 200,
      render: (row) => {
        const name = row.employeeName || 'N/A';
        const emp = employees.find(e => e.id === row.employeeId) || row.employee;
        const photo = row.employeePhotoUpload || row.employeePhoto || emp?.employeePhotoUpload || emp?.profileUpload;
        const photoUrl = photo ? getPhotoUrl(photo) : null;
        return (
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Tooltip
              placement="right"
              arrow
              title={
                photoUrl ? (
                  <Box
                    component="img"
                    src={photoUrl}
                    alt={name}
                    sx={{ width: 140, height: 150, objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo Available</Typography>
                )
              }
            >
              <Avatar
                src={photoUrl}
                alt={name}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  border: '1.5px solid',
                  borderColor: 'primary.main',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.25)',
                    zIndex: 10
                  }
                }}
              >
                {name.charAt(0)}
              </Avatar>
            </Tooltip>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {name}
            </Typography>
          </Stack>
        );
      }
    },
    {
      id: "purposeOfOd", label: "Purpose", minWidth: 200, align: "center",
      render: (row) => (
        <Box sx={{ whiteSpace: "pre-line", lineHeight: 1.8, textAlign: "center" }}>
          {row.purposeOfOd || ""}
        </Box>
      )
    },
    {
      id: "odFromDateTime", label: "Onduty From", minWidth: 150, align: "center",
      render: (row) => {
        if (!row.odFromDateTime) return "";
        const d = new Date(row.odFromDateTime);
        const date = d.toLocaleDateString("en-GB");
        const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        return (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{date}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{time}</Typography>
          </Box>
        );
      }
    },
    {
      id: "odToDateTime", label: "Onduty To", minWidth: 150, align: "center",
      render: (row) => {
        if (!row.odToDateTime) return "";
        const d = new Date(row.odToDateTime);
        const date = d.toLocaleDateString("en-GB");
        const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        return (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{date}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{time}</Typography>
          </Box>
        );
      }
    },
    { id: "visitType", label: "Visit Type", minWidth: 110, align: "center" },
    { id: "vehicleType", label: "Vehicle", minWidth: 100, align: "center" },
    { id: "fromLocation", label: "From Location", minWidth: 130, align: "center" },
    { id: "toLocation", label: "To Location", minWidth: 130, align: "center" },
    {
      id: "distance", label: "Distance (Km)", minWidth: 110, align: "center",
      render: (row) => row.distance ? parseFloat(row.distance).toFixed(2) : "0.00"
    },
    {
      id: "whereFrom",
      label: "From Where",
      minWidth: 160,
      align: "center",
      render: (row) => {
        const val = row.whereFrom || "HR OD Entry";
        let bgColor = "rgba(156, 39, 176, 0.08)";
        let textColor = "#7b1fa2";
        let borderColor = "rgba(156, 39, 176, 0.35)";
        if (val.toLowerCase().includes("self care")) {
          bgColor = "rgba(30, 136, 229, 0.08)";
          textColor = "#1565c0";
          borderColor = "rgba(30, 136, 229, 0.35)";
        }
        return (
          <Chip
            label={val}
            size="small"
            sx={{
              fontWeight: "700",
              fontSize: "0.72rem",
              borderRadius: "6px",
              border: "1px solid",
              borderColor,
              color: textColor,
              bgcolor: bgColor,
              letterSpacing: "0.2px"
            }}
          />
        );
      }
    },
    {
      id: "status",
      label: "Status",
      minWidth: 150,
      align: "center",
      render: (row) => <BOSStatusChip status={row.status} />
    },
    {
      id: "createdUser", label: "Created By", minWidth: 120, align: "center",
      render: (row) => row.createdUser || ""
    },
    {
      id: "createdAt", label: "Created Date & Time", minWidth: 150, align: "center",
      render: (row) => {
        if (!row.createdAt) return "";
        const d = new Date(row.createdAt);
        const date = d.toLocaleDateString("en-GB");
        const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        return (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{date}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{time}</Typography>
          </Box>
        );
      }
    },
    {
      id: "verifiedBy", label: "Verified By", minWidth: 120, align: "center",
      render: (row) => row.verifiedBy || row.verified_by || "N/A"
    },
    {
      id: "verifiedDate", label: "Verified Date & Time", minWidth: 150, align: "center",
      render: (row) => {
        const vDate = row.verifiedDate || row.verified_date;
        if (!vDate) return "N/A";
        const d = new Date(vDate);
        const date = d.toLocaleDateString("en-GB");
        const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        return (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{date}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{time}</Typography>
          </Box>
        );
      }
    }
  ], [employees]);

  useEffect(() => {
    const scopeOptions = [{ value: "Mine", label: "Mine" }];
    if (perms?.manager || isVerticalHead) {
      scopeOptions.push({ value: "Team", label: "Team" });
    }
    if (perms?.additional1) {
      scopeOptions.push({ value: "Company", label: "Company" });
    }

    dispatch(setFilterConfig([
      {
        id: "scope", label: "Request Scope", type: "select",
        options: scopeOptions,
        defaultValue: "Mine", isStarred: true
      },
      { id: "employeeName", label: "Employee Name", type: "text", placeholder: "Search Employee Name...", isStarred: true },
      {
        id: "status", label: "Status", type: "select",
        options: [
          { value: "ALL", label: "ALL" },
          { value: "Pending to Verify", label: "Pending to Verify" },
          { value: "Verified", label: "Verified" },
          { value: "Rejected", label: "Rejected" }
        ],
        defaultValue: "ALL", isStarred: true
      }
    ]));
    return () => { dispatch(setFilterConfig(null)); };
  }, [dispatch, perms, isVerticalHead, myTeamEmployees]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/hra/od-entries");
      setRows(response.data || []);
    } catch {
      dispatch(openSnackbar({ open: true, message: "Failed to load OD Details.", variant: "alert", severity: "error" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const validateDates = (dates = formDates) => {
    const errs = {};

    if (dates.fromDate && dates.toDate) {
      if (new Date(dates.toDate) < new Date(dates.fromDate)) {
        errs.toDate = "To Date cannot be before From Date.";
      }
    }

    if (
      dates.fromDate && dates.toDate &&
      dates.fromDate === dates.toDate &&
      dates.fromTime && dates.toTime
    ) {
      const fromMins = parseTimeToMinutes(dates.fromTime);
      const toMins = parseTimeToMinutes(dates.toTime);
      if (fromMins !== null && toMins !== null && toMins <= fromMins) {
        errs.toTime = "To Time must be later than From Time.";
      }
    }

    setDateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) clearErrors(name);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formDates, [name]: value };
    setFormDates(updated);
    validateDates(updated);
  };

  const handleOpenAdd = async () => {
    clearErrors();
    setDateErrors({});
    setFormDates(INITIAL_DATES);
    setUploadedFiles([]);
    setDialogOpen(true);

    const currentEmp = allowedEmployees.find(e => String(e.id) === String(user?.empId) || e.empCode === user?.empCode) || (allowedEmployees.length > 0 ? allowedEmployees[0] : null);
    setSelectedEmployee(currentEmp || null);

    setFormData({
      ...INITIAL_STATE,
      employeeId: currentEmp ? currentEmp.id : null,
      odNumber: "Loading..."
    });

    try {
      const res = await axios.get("/api/hra/od-entries/next-code");
      setFormData((prev) => ({ ...prev, odNumber: res.data || "" }));
    } catch {
      setFormData((prev) => ({ ...prev, odNumber: "" }));
    }
  };

  const handleOpenEdit = (row) => {
    clearErrors();
    setDateErrors({});
    const targetRow = row._isBatch
      ? rows.find(r => r.id === row._groupIds[0]) || row
      : row;

    const files = targetRow.documents || (targetRow.filePaths ? targetRow.filePaths.split(',').map(path => {
      const parts = path.split('/');
      return {
        name: parts[parts.length - 1],
        fileName: parts[parts.length - 1],
        serverFileName: path,
        isServer: true
      };
    }) : []);
    setUploadedFiles(files);

    const empObj = employees.find(e => e.id === targetRow.employeeId) || targetRow.employee || { id: targetRow.employeeId, employeeName: targetRow.employeeName, empCode: "" };
    setSelectedEmployee(empObj || null);

    const parseDateTime = (dt) => {
      if (!dt) return { date: "", time: "" };
      const d = new Date(dt);
      const date = d.toISOString().substring(0, 10);
      const h = d.getHours() % 12 || 12;
      const min = String(d.getMinutes()).padStart(2, "0");
      const ampm = d.getHours() >= 12 ? "PM" : "AM";
      return { date, time: `${String(h).padStart(2, "0")}:${min} ${ampm}` };
    };

    const from = parseDateTime(targetRow.odFromDateTime);
    const to = parseDateTime(targetRow.odToDateTime);

    setFormData({
      id: targetRow.id,
      employeeId: targetRow.employeeId,
      odNumber: targetRow.odNumber,
      visitType: targetRow.visitType || "",
      vehicleType: targetRow.vehicleType || "",
      purposeOfOd: targetRow.purposeOfOd || "",
      fromLocation: targetRow.fromLocation || "",
      toLocation: targetRow.toLocation || "",
      distance: targetRow.distance != null ? String(targetRow.distance) : "",
      status: targetRow.status || "Pending for Verify"
    });
    setFormDates({ fromDate: from.date, toDate: to.date, fromTime: from.time, toTime: to.time });
    setDialogOpen(true);
  };

  const handleDoubleClickRow = (row) => {
    handleOpenEdit(row);
  };

  const handleClear = () => {
    const currentEmp = allowedEmployees.find(e => String(e.id) === String(user?.empId) || e.empCode === user?.empCode) || (allowedEmployees.length > 0 ? allowedEmployees[0] : null);
    setSelectedEmployee(currentEmp || null);
    setFormData((prev) => ({ ...INITIAL_STATE, id: prev.id || "", odNumber: prev.odNumber, employeeId: currentEmp ? currentEmp.id : null }));
    setFormDates(INITIAL_DATES);
    setUploadedFiles([]);
    clearErrors();
    setDateErrors({});
  };

  const handleSave = async () => {
    if (isReadonly) {
      dispatch(openSnackbar({ open: true, message: "This record is already processed and cannot be modified.", variant: "alert", severity: "warning" }));
      return;
    }

    if (!selectedEmployee || !formData.employeeId) {
      setErrors((prev) => ({ ...prev, employeeId: "Please select an employee." }));
      dispatch(openSnackbar({ open: true, message: "Please select an Employee.", variant: "alert", severity: "error" }));
      return;
    }

    if (!validate(formData, VALIDATION_RULES)) return;

    if (!validateDates()) {
      dispatch(openSnackbar({ open: true, message: "Please fix the date/time errors before saving.", variant: "alert", severity: "error" }));
      return;
    }

    if (!formDates.fromDate) {
      dispatch(openSnackbar({ open: true, message: "Onduty From Date is required.", variant: "alert", severity: "error" }));
      return;
    }

    const distanceVal = formData.distance !== "" && formData.distance !== null && formData.distance !== undefined
      ? parseFloat(formData.distance) : 0;
    if (isNaN(distanceVal) || distanceVal <= 0) {
      setErrors((prev) => ({ ...prev, distance: "Distance must be a positive number." }));
      dispatch(openSnackbar({ open: true, message: "Distance must be a positive number.", variant: "alert", severity: "error" }));
      return;
    }

    if ((formData.purposeOfOd || "").length > 500) {
      setErrors((prev) => ({ ...prev, purposeOfOd: "Purpose cannot exceed 500 characters." }));
      return;
    }

    const buildDateTime = (date, time) => {
      if (!date) return null;
      if (!time) return `${date}T00:00:00`;
      const mins = parseTimeToMinutes(time);
      if (mins === null) return `${date}T00:00:00`;
      const hh = String(Math.floor(mins / 60)).padStart(2, "0");
      const mm = String(mins % 60).padStart(2, "0");
      return `${date}T${hh}:${mm}:00`;
    };

    setSaving(true);
    try {
      const finalToDate = formDates.toDate || formDates.fromDate;
      const finalToTime = formDates.toTime || formDates.fromTime;

      const basePayload = {
        odFromDateTime: buildDateTime(formDates.fromDate, formDates.fromTime),
        odToDateTime: buildDateTime(finalToDate, finalToTime),
        visitType: formData.visitType || "",
        vehicleType: formData.vehicleType || "",
        purposeOfOd: formData.purposeOfOd || "",
        fromLocation: formData.fromLocation || "",
        toLocation: formData.toLocation || "",
        distance: distanceVal,
        status: formData.status,
        whereFrom: "HR OD Entry"
      };

      if (formData.id) {
        await axios.put(`/api/hra/od-entries/${formData.id}`, { ...basePayload, employeeId: formData.employeeId });
        dispatch(openSnackbar({ open: true, message: "OD Details updated successfully.", variant: "alert", severity: "success" }));
      } else {
        const batchRes = await axios.post("/api/hra/od-entries/batch", {
          template: basePayload,
          employeeIds: [formData.employeeId]
        });

        const created = batchRes.data || [];
        const odNumbers = created.map(e => e.odNumber).join(", ");
        dispatch(openSnackbar({
          open: true,
          message: `OD Details created successfully: ${odNumbers}`,
          variant: "alert", severity: "success"
        }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: error.response?.data?.message || "Failed to save OD details.", variant: "alert", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const globalFilters = useSelector((state) => state.search?.filters || {});
  const globalQuery = useSelector((state) => state.search?.query || "");

  const makeBatchKey = (row) => [
    row.odFromDateTime,
    row.odToDateTime,
    row.visitType,
    row.purposeOfOd,
    row.fromLocation,
    row.toLocation,
    row.kmStart,
    row.kmEnd
  ].join("||");

  const resolvedRows = useMemo(() => {
    const enriched = rows.map((r) => ({
      ...r,
      empCode: r.employee?.empCode || "",
      employeeName: r.employee?.employeeName || r.employeeName || "N/A"
    }));

    const filtered = enriched.filter((row) => {
      // Scope filter
      const scopeFilterVal = globalFilters.scope || 'Mine';
      if (!matchScope(scopeFilterVal, row.employeeId, row.employeeName)) return false;

      if (globalFilters.employeeName && !row.employeeName.toLowerCase().includes(globalFilters.employeeName.toLowerCase())) return false;
      if (globalFilters.status && globalFilters.status !== "ALL" && row.status !== globalFilters.status) return false;
      if (globalQuery) {
        const q = globalQuery.toLowerCase();
        return (
          row.employeeName.toLowerCase().includes(q) ||
          row.empCode.toLowerCase().includes(q) ||
          row.odNumber.toLowerCase().includes(q) ||
          (row.visitType && row.visitType.toLowerCase().includes(q)) ||
          (row.vehicleType && row.vehicleType.toLowerCase().includes(q)) ||
          (row.status && row.status.toLowerCase().includes(q))
        );
      }
      return true;
    });

    const groupMap = new Map();
    filtered.forEach((row) => {
      const key = makeBatchKey(row);
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key).push(row);
    });

    const merged = [];
    let idx = 1;
    groupMap.forEach((group) => {
      if (group.length === 1) {
        merged.push({ ...group[0], index: idx++ });
      } else {
        const primary = group[0];
        merged.push({
          ...primary,
          index: idx++,
          odNumber: group.map(r => r.odNumber).join(",\n"),
          employeeName: group.map(r => r.employeeName).join(",\n"),
          _groupIds: group.map(r => r.id),
          _isBatch: true,
          _batchCount: group.length
        });
      }
    });

    return merged;
  }, [rows, globalFilters, globalQuery]);

  const toTimeMinConstraint = useMemo(() => {
    if (formDates.fromDate && formDates.toDate && formDates.fromDate === formDates.toDate) {
      return formDates.fromTime || undefined;
    }
    return undefined;
  }, [formDates.fromDate, formDates.toDate, formDates.fromTime]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: "8px",
              bgcolor: isDark ? "primary.dark" : "primary.lighter",
              color: isDark ? "white" : "primary.dark"
            }}
          >
            <IconCalendar size={22} />
          </Box>
          <Box
            component="a"
            href="#"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { color: 'primary.main', textDecoration: 'underline' }
            }}
          >
            <Typography variant="h3" component="span">OD Details</Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="hra_od_details_table"
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newTooltip="New OD Details"
          hasWritePermission={perms.write}
          columns={columns}
          exportData={resolvedRows}
          exportFilename="OD_Details"
          hasExportPermission={perms.export}
          exportColumns={[
            { header: "OD Number", key: "odNumber" },
            { header: "Employee Code", key: "empCode" },
            { header: "Employee Name", key: "employeeName" },
            { header: "Purpose", key: "purposeOfOd" },
            { header: "Visit Type", key: "visitType" },
            { header: "Vehicle", key: "vehicleType" },
            { header: "From Location", key: "fromLocation" },
            { header: "To Location", key: "toLocation" },
            { header: "Distance", key: "distance" },
            { header: "Status", key: "status" }
          ]}
        />
      }
    >
      <BOSDataTable
        id="hra_od_details_table"
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onDoubleClickRow={handleDoubleClickRow}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setUploadedFiles([]); }}
        title={isReadonly ? "View OD Details" : (isEdit ? "Edit OD Details" : "OD Details")}
        fullWidth
        maxWidth="lg"
        contentSx={{ overflowY: "visible", p: "24px !important" }}
        onSave={isReadonly ? null : handleSave}
        saveButtonDisabled={saving}
        isViewOnly={isReadonly}
        onClear={isReadonly ? null : handleClear}
        sidebar={
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 0.8, fontSize: "0.68rem" }}>
              Supporting Documents
            </Typography>
            <BOSFileUpload
              files={uploadedFiles}
              onChange={(files) => {
                if (formData.id || isReadonly || isEdit) return;
                setUploadedFiles(files);
              }}
              module="HR_OD"
              multiple={true}
              compact={true}
              maxListHeight={180}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              label={formData.id || isReadonly || isEdit ? "Supporting Documents (Read Only)" : "Upload Supporting Documents"}
              disabled={!!(formData.id || isReadonly || isEdit)}
              hideDropzone={!!(formData.id || isReadonly || isEdit) && uploadedFiles.length > 0}
            />
          </Box>
        }
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "3.5fr 8.5fr" }, gap: 3.5 }}>
          {/* Left Panel: Employee Profile Card */}
          <Box sx={{
            border: "1.5px solid",
            borderColor: "divider",
            borderRadius: "16px",
            bgcolor: isDark ? "background.default" : "grey.50",
            p: 3.5,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            boxSizing: "border-box",
            minHeight: "380px",
            position: "sticky",
            top: "24px",
            alignSelf: "start",
            zIndex: 1
          }}>
            {!selectedEmployee ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, py: 2, color: "text.secondary", textAlign: "center", height: "100%" }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: isDark ? "rgba(255,255,255,0.05)" : "grey.100", color: "text.secondary" }}>
                  <IconUser size={24} />
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Select an employee to view details</Typography>
              </Box>
            ) : (
              <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textAlign: "center" }}>
                <Avatar
                  src={selectedEmployee.employeePhotoUpload ? getPhotoUrl(selectedEmployee.employeePhotoUpload) : null}
                  alt={selectedEmployee.employeeName}
                  sx={{
                    width: 80,
                    height: 80,
                    border: "3px solid",
                    borderColor: "primary.main",
                    boxShadow: 2
                  }}
                >
                  {selectedEmployee.employeeName?.charAt(0) || <IconUser size={40} />}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {selectedEmployee.employeeName || selectedEmployee.name || "—"}
                  </Typography>
                  <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Employee ID: {selectedEmployee.empCode || selectedEmployee.oldEmpCode || "—"}
                  </Typography>
                </Box>
                <Divider sx={{ width: "100%", my: 0.5 }} />
                <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1.5, textAlign: "left" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>Department</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>{getDepartmentString(selectedEmployee)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>Designation</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>{getDesignationString(selectedEmployee)}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          {/* Right Panel: OD Details Fields */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            <BOSFormSection title="OD Details Fields" icon={<IconCalendar size={22} color={theme.palette.primary.main} />}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                
                {/* Row 1: Onduty No | Visit Type */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, alignItems: "start" }}>
                  <BOSTextField
                    fullWidth
                    size="small"
                    label="Onduty No"
                    value={formData.odNumber}
                    disabled
                  />
                  <BOSTextField
                    select
                    fullWidth
                    size="small"
                    label="Visit Type"
                    required
                    name="visitType"
                    value={formData.visitType}
                    onChange={handleChange}
                    disabled={isReadonly}
                    error={!!errors.visitType}
                    helperText={errors.visitType}
                  >
                    <MenuItem value="Customer">Customer</MenuItem>
                    <MenuItem value="Vendor">Vendor</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                  </BOSTextField>
                </Box>

                {/* Row 2: Employee Name (Full width, single-select searchable Autocomplete matching Leave Details) */}
                <BOSAutocomplete
                  fullWidth
                  size="small"
                  name="employeeId"
                  label="Employee Name"
                  required
                  disabled={isReadonly || isEdit}
                  options={allowedEmployees}
                  getOptionLabel={(opt) => opt ? `${opt.oldEmpCode || opt.empCode || (opt.id ? String(opt.id) : "")} - ${opt.employeeName || opt.name || ""}` : ""}
                  isOptionEqualToValue={(option, val) => String(option?.id) === String(val?.id)}
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                  error={!!errors.employeeId}
                  helperText={errors.employeeId}
                />

                {/* Row 3: Onduty From Date | Onduty To Date */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, alignItems: "start" }}>
                  <BOSDatePicker
                    fullWidth
                    size="small"
                    label="Onduty From Date"
                    required
                    name="fromDate"
                    value={formDates.fromDate}
                    onChange={handleDateChange}
                    disabled={isReadonly}
                    minDate={todayStr()}
                    error={!!dateErrors.fromDate}
                    helperText={dateErrors.fromDate}
                    highlightHolidays={true}
                    disableSundays={!formData.id}
                    disableHolidays={!formData.id}
                  />
                  <BOSDatePicker
                    fullWidth
                    size="small"
                    label="Onduty To Date"
                    required
                    name="toDate"
                    value={formDates.toDate}
                    onChange={handleDateChange}
                    disabled={isReadonly}
                    minDate={formDates.fromDate || todayStr()}
                    error={!!dateErrors.toDate}
                    helperText={dateErrors.toDate}
                    highlightHolidays={true}
                    disableSundays={!formData.id}
                    disableHolidays={!formData.id}
                  />
                </Box>

                {/* Row 4: From Time | To Time */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, alignItems: "start" }}>
                  <BOSTimePicker
                    fullWidth
                    size="small"
                    label="From Time"
                    required
                    name="fromTime"
                    value={formDates.fromTime}
                    onChange={handleDateChange}
                    disabled={isReadonly}
                    format24h={false}
                    error={!!dateErrors.fromTime}
                    helperText={dateErrors.fromTime}
                  />
                  <BOSTimePicker
                    fullWidth
                    size="small"
                    label="To Time"
                    required
                    name="toTime"
                    value={formDates.toTime}
                    onChange={(e) => handleDateChange(e)}
                    disabled={isReadonly}
                    format24h={false}
                    minTime={toTimeMinConstraint}
                    minTimeMessage="To Time must be later than From Time."
                    error={!!dateErrors.toTime}
                    helperText={dateErrors.toTime}
                  />
                </Box>

                {/* Row 5: Vehicle | Distance (Km) */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, alignItems: "start" }}>
                  <BOSTextField
                    select
                    fullWidth
                    size="small"
                    label="Vehicle"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    disabled={isReadonly}
                  >
                    <MenuItem value="Bike">Bike</MenuItem>
                    <MenuItem value="Car">Car</MenuItem>
                  </BOSTextField>
                  <BOSTextField
                    fullWidth
                    size="small"
                    label="Distance (Km)"
                    required
                    name="distance"
                    type="number"
                    value={formData.distance}
                    onChange={(e) => {
                      handleChange(e);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val <= 0) {
                        setErrors((prev) => ({ ...prev, distance: "Distance must be a positive number." }));
                      } else {
                        clearErrors("distance");
                      }
                    }}
                    disabled={isReadonly}
                    placeholder="e.g. 10.5"
                    inputProps={{ min: 0, step: 0.1 }}
                    error={!!errors.distance}
                    helperText={errors.distance}
                  />
                </Box>

                {/* Row 6: From Location | To Location */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, alignItems: "start" }}>
                  <BOSTextField
                    fullWidth
                    size="small"
                    label="From Location"
                    name="fromLocation"
                    value={formData.fromLocation}
                    onChange={handleChange}
                    disabled={isReadonly}
                    placeholder="e.g. Office / Home"
                    error={!!errors.fromLocation}
                    helperText={errors.fromLocation}
                  />
                  <BOSTextField
                    fullWidth
                    size="small"
                    label="To Location"
                    name="toLocation"
                    value={formData.toLocation}
                    onChange={handleChange}
                    disabled={isReadonly}
                    placeholder="e.g. Customer Office"
                    error={!!errors.toLocation}
                    helperText={errors.toLocation}
                  />
                </Box>

                {/* Row 7: Purpose of Duty (Full width) */}
                <BOSTextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  name="purposeOfOd"
                  label="Purpose of Duty"
                  required
                  disabled={isReadonly}
                  placeholder="Enter details of official work..."
                  value={formData.purposeOfOd}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.purposeOfOd}
                  helperText={errors.purposeOfOd || `${(formData.purposeOfOd || "").length} / 500 characters`}
                />

              </Box>
            </BOSFormSection>
          </Box>
        </Box>
      </BOSFormDialog>
      <BOSFileGallery
        open={attachmentsDialogOpen}
        onClose={() => setAttachmentsDialogOpen(false)}
        files={attachmentFiles}
        title={attachmentTitle}
      />
    </MainCard>
  );
}
