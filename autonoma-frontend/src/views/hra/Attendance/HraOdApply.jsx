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
  parseBOSFiles,
  getCommonDateFilters,
  matchDateRange
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
  employeeIds: [],
  odNumber: "",
  visitType: "",
  vehicleType: "",
  purposeOfOd: "",
  fromLocation: "",
  toLocation: "",
  distance: "",
  status: "Pending to Verify",
  whereFrom: "Employee Self Care"
};

const INITIAL_DATES = {
  fromDate: todayStr(),
  toDate: "",
  fromTime: "",
  toTime: ""
};

const VALIDATION_RULES = [
  { field: "visitType", label: "Visit Type", required: true },
  { field: "purposeOfOd", label: "Purpose of Duty", required: true }
];

export default function HraOdApply() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
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
  const perms = usePagePermissions(PAGE_CODES.SELF_CARE_OD_APPLY || PAGE_CODES.HRA_ATTENDANCE_OD_ENTRY);

  const [empProfile, setEmpProfile] = useState(null);

  useEffect(() => {
    if (user?.empId) {
      axios.get(`/api/master/hr/employees/${user.empId}`)
        .then((res) => {
          if (res.data) setEmpProfile(res.data);
        })
        .catch(() => {});
    }
  }, [user]);

  const currentLoggedInEmp = useMemo(() => {
    if (empProfile) {
      return {
        id: empProfile.id,
        empCode: empProfile.oldEmpCode || empProfile.empCode || String(empProfile.id),
        oldEmpCode: empProfile.oldEmpCode || empProfile.empCode || String(empProfile.id),
        employeeName: empProfile.employeeName || empProfile.name || "",
        employeePhotoUpload: empProfile.employeePhotoUpload || null,
        departmentName: getDepartmentString(empProfile),
        designationName: getDesignationString(empProfile)
      };
    }
    if (user) {
      return {
        id: user.empId || user.id,
        empCode: user.empCode || user.oldEmpCode || user.username || "",
        oldEmpCode: user.oldEmpCode || user.empCode || "",
        employeeName: user.employeeName || user.displayName || user.name || user.username || "",
        employeePhotoUpload: user.employeePhotoUpload || null,
        departmentName: user.departmentName || user.department || "",
        designationName: user.designationName || user.designation || ""
      };
    }
    return null;
  }, [empProfile, user]);

  const isEdit = !!formData.id;
  const isReadonly = formData.status === "Approved" || formData.status === "Verified" || formData.status === "Rejected" || formData.status === "Closed";

  const selectedEmp = currentLoggedInEmp;

  const formatEmpLabel = (emp) => {
    if (!emp) return "Loading...";
    const empId = emp.oldEmpCode || emp.empCode || (emp.id ? String(emp.id) : "");
    const name = emp.employeeName || emp.name || "";
    if (!empId && !name) return "Loading...";
    if (empId && name) return `${empId} - ${name}`;
    return name || empId || "Loading...";
  };

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
        const emp = row.employee || selectedEmp;
        return (
          <Box sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
            {emp?.empCode || emp?.oldEmpCode || ""}
          </Box>
        );
      }
    },
    {
      id: "employeeName", label: "Employee Name", bold: true, minWidth: 200,
      render: (row) => {
        const name = row.employeeName || 'N/A';
        const emp = row.employee || selectedEmp;
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
        const val = row.whereFrom || "Employee Self Care";
        return (
          <Chip
            label={val}
            size="small"
            sx={{
              fontWeight: "700",
              fontSize: "0.72rem",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: "rgba(30, 136, 229, 0.35)",
              color: "#1565c0",
              bgcolor: "rgba(30, 136, 229, 0.08)",
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
  ], [selectedEmp]);

  useEffect(() => {
    dispatch(setFilterConfig([
      {
        id: "status", label: "Status", type: "select",
        options: [
          { value: "ALL", label: "ALL" },
          { value: "Pending to Verify", label: "Pending to Verify" },
          { value: "Verified", label: "Verified" },
          { value: "Rejected", label: "Rejected" }
        ],
        defaultValue: "ALL", isStarred: true, required: true
      },
      ...getCommonDateFilters('createdAt')
    ]));
    return () => { dispatch(setFilterConfig(null)); };
  }, [dispatch]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/hra/od-entries?self=true");
      const allData = response.data || [];
      const userEmpId = user?.empId ? String(user.empId) : null;
      const userEmpCode = user?.empCode ? String(user.empCode).toLowerCase().trim() : null;

      const userRows = allData.filter((r) => {
        if (userEmpId && String(r.employeeId) === userEmpId) return true;
        if (userEmpCode && r.employee?.empCode && String(r.employee.empCode).toLowerCase().trim() === userEmpCode) return true;
        return false;
      });

      setRows(userRows);
    } catch {
      dispatch(openSnackbar({ open: true, message: "Failed to load OD Apply details.", variant: "alert", severity: "error" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, user]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const validateDates = (dates = formDates) => {
    const errs = {};
    const todayDate = new Date().toISOString().substring(0, 10);

    if (dates.fromDate && dates.fromDate < todayDate) {
      errs.fromDate = "Past dates are not allowed. Please select today or a future date.";
    }

    if (dates.toDate && dates.toDate < todayDate) {
      errs.toDate = "Past dates are not allowed. Please select today or a future date.";
    }

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

    const currentEmp = currentLoggedInEmp;

    setFormData({
      ...INITIAL_STATE,
      employeeIds: currentEmp ? [currentEmp] : [],
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

    const empObj = selectedEmp || { id: targetRow.employeeId, employeeName: targetRow.employeeName, empCode: "" };

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
      employeeIds: [empObj],
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
    const currentEmp = currentLoggedInEmp;
    setFormData((prev) => ({ ...INITIAL_STATE, id: prev.id || "", odNumber: prev.odNumber, employeeIds: currentEmp ? [currentEmp] : [] }));
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

    if (!formData.employeeIds || formData.employeeIds.length === 0) {
      setErrors((prev) => ({ ...prev, employeeIds: "Please select at least one employee." }));
      dispatch(openSnackbar({ open: true, message: "Please select at least one Employee.", variant: "alert", severity: "error" }));
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
        whereFrom: "Employee Self Care"
      };

      const getEmpId = (emp) => {
        if (emp === null || emp === undefined) return null;
        if (typeof emp === "number" || typeof emp === "string") {
          const parsed = parseInt(emp, 10);
          return isNaN(parsed) || parsed <= 0 ? null : parsed;
        }
        const raw = emp.id ?? emp.employeeId ?? emp.empId ?? emp.ID;
        const parsed = parseInt(raw, 10);
        if (isNaN(parsed) || parsed <= 0) {
          console.error("[OD Apply] Could not extract employeeId from:", JSON.stringify(emp));
          return null;
        }
        return parsed;
      };

      if (formData.id) {
        const empId = getEmpId(selectedEmp || currentLoggedInEmp || formData.employeeIds[0]);
        if (!empId) {
          dispatch(openSnackbar({ open: true, message: "Invalid employee selection.", variant: "alert", severity: "error" }));
          return;
        }
        await axios.put(`/api/hra/od-entries/${formData.id}`, { ...basePayload, employeeId: empId });
        dispatch(openSnackbar({ open: true, message: "OD Apply updated successfully.", variant: "alert", severity: "success" }));
      } else {
        const targetEmp = selectedEmp || currentLoggedInEmp;
        const employeeIds = targetEmp ? [getEmpId(targetEmp)].filter(id => id !== null) : [];

        if (employeeIds.length === 0) {
          dispatch(openSnackbar({ open: true, message: "Employee profile loading. Please try again.", variant: "alert", severity: "error" }));
          return;
        }

        const batchRes = await axios.post("/api/hra/od-entries/batch", {
          template: basePayload,
          employeeIds
        });

        const created = batchRes.data || [];
        const odNumbers = created.map(e => e.odNumber).join(", ");
        dispatch(openSnackbar({
          open: true,
          message: `${created.length} OD ${created.length === 1 ? "Entry" : "Entries"} created: ${odNumbers}`,
          variant: "alert", severity: "success"
        }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: error.response?.data?.message || "Failed to save OD apply entry.", variant: "alert", severity: "error" }));
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
      if (globalFilters.status && globalFilters.status !== "ALL") {
        const rowStat = (row.status || "").toUpperCase().trim();
        const filterStat = globalFilters.status.toUpperCase().trim();
        if (filterStat === "PENDING TO VERIFY" || filterStat === "PENDING FOR VERIFY") {
          if (!rowStat.includes("PENDING")) return false;
        } else if (filterStat === "VERIFIED") {
          if (!rowStat.includes("VERIFIED") && !rowStat.includes("APPROVED")) return false;
        } else if (filterStat === "REJECTED") {
          if (!rowStat.includes("REJECT")) return false;
        } else if (rowStat !== filterStat) {
          return false;
        }
      }
      if (!matchDateRange(row, globalFilters, 'createdAt')) return false;
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
            <Typography variant="h3" component="span">OD Apply</Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="hra_od_entry_table"
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newTooltip="New OD Apply"
          hasWritePermission={perms.write}
          columns={columns}
          exportData={resolvedRows}
          exportFilename="OD_Apply"
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
        id="hra_od_entry_table"
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onDoubleClickRow={handleDoubleClickRow}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setUploadedFiles([]); }}
        title={isReadonly ? "View OD Apply" : (isEdit ? "Edit OD Apply" : "OD Apply")}
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
        <Stack spacing={2.5}>
          {/* Employee Profile Header (Read-Only for Self Care) */}
          {currentLoggedInEmp && (
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1.5px solid ${theme.palette.primary.main}`,
                bgcolor: isDark ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)',
                boxShadow: '0 2px 10px rgba(33, 150, 243, 0.1)'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={currentLoggedInEmp.employeePhotoUpload ? getPhotoUrl(currentLoggedInEmp.employeePhotoUpload) : null}
                  alt={currentLoggedInEmp.employeeName}
                  sx={{
                    width: 52,
                    height: 52,
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  {currentLoggedInEmp.employeeName?.charAt(0) || <IconUser size={26} />}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {currentLoggedInEmp.employeeName}
                    </Typography>
                    <Chip
                      label={currentLoggedInEmp.oldEmpCode || currentLoggedInEmp.empCode ? `ID: ${currentLoggedInEmp.oldEmpCode || currentLoggedInEmp.empCode}` : 'Self Care'}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 800, height: '22px', fontSize: '0.72rem' }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mt: 0.3 }}>
                    {[currentLoggedInEmp.departmentName, currentLoggedInEmp.designationName].filter(Boolean).join(' • ') || 'Employee Self Care'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <BOSFormSection title="OD Apply Fields" icon={<IconCalendar size={22} color={theme.palette.primary.main} />}>
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

              {/* Row 2: Onduty From Date | Onduty To Date */}
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

              {/* Row 3: From Time | To Time */}
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

              {/* Row 4: Vehicle | Distance (Km) */}
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

              {/* Row 5: From Location | To Location */}
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

              {/* Row 6: Purpose of Duty (Full width) */}
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
        </Stack>
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
