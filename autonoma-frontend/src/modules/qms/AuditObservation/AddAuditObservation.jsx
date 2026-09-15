import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { debounce } from 'lodash-es';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Box, Button, MenuItem, Stack, useTheme, Chip, Card, CardContent, Avatar, IconButton, Autocomplete, TextField, ToggleButton, ToggleButtonGroup, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Paper, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Fade } from '@mui/material';
import {
  IconCheck,
  IconFileText,
  IconCalendarEvent,
  IconUsers,
  IconListCheck,
  IconReportAnalytics,
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconLayoutGrid,
  IconTable,
  IconInfoCircle,
  IconCalculator,
  IconX,
  IconMail,
  IconSend,
  IconAlertTriangle,
  IconEye,
  IconCode
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { useMasterDataStore } from 'store/useMasterDataStore';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  BOSAutocomplete,
  BOSDataTable,
  BOSFileUpload,
  BOSDatePicker,
  BOSTimePicker,
  BOSAnalogTimePicker,
  btnSave,
  btnCancel,
  btnWarning,
  BOSStatusChip,
  errorStyle,
  parseAttachmentFiles
} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';
import useBOSLiveClock from 'hooks/useBOSLiveClock';
import { format } from 'date-fns';
import { API_PATHS } from 'utils/api-constants';
import { useLookups } from 'hooks/useLookups';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';
import { formatTime } from 'utils/BOSTimeUtils';
import VideocamTwoToneIcon from '@mui/icons-material/VideocamTwoTone';
import { startUniversalCall } from 'utils/universalCallManager';
import { getFileViewUrl } from 'utils/upload-helper';

const VALIDATION_RULES = [
  { field: 'observationDate', label: 'Observation Date', required: true },
  { field: 'auditScheduleNo', label: 'Schedule No', required: true }
];

const OBS_STATUSES = ['COMPLIANCE', 'NCR', 'OFI', 'NO ENTRY'];

const formatTime12 = (hour, minute) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

const getSystemTime12h = () => {
  const now = new Date();
  return formatTime12(now.getHours(), now.getMinutes());
};

const parseTime12h = (timeStr) => {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const LocalCommentsInput = React.memo(({ value, onChange, placeholder, disabled, error, helperText }) => {
  const [localVal, setLocalVal] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!isFocused) {
      setLocalVal(value || '');
    }
  }, [value, isFocused]);

  const debouncedOnChange = useMemo(
    () =>
      debounce((newVal) => {
        if (onChangeRef.current) {
          onChangeRef.current(newVal);
        }
      }, 300),
    []
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setLocalVal(newVal);
    debouncedOnChange(newVal);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    debouncedOnChange.cancel();
    if (onChangeRef.current && localVal !== value) {
      onChangeRef.current(localVal);
    }
  };

  return (
    <TextField
      multiline
      minRows={2}
      maxRows={2}
      size="small"
      value={localVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      helperText={helperText}
      fullWidth
      variant="outlined"
      sx={{
        '& .MuiInputBase-root': {
          fontSize: '0.85rem',
          alignItems: 'flex-start',
          height: '52px !important',
          minHeight: '52px !important',
          maxHeight: '52px !important'
        },
        '& textarea': {
          maxHeight: '44px !important',
          overflowY: 'auto !important'
        }
      }}
    />
  );
});

export default function AddAuditObservation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { timeFormat } = useConfig();
  const isEditing = Boolean(id);
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_OBSERVATION);
  const { errors, validate } = useBOSValidation();
  const [showTableErrors, setShowTableErrors] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);

  const [formData, setFormData] = useState({
    observationNo: '',
    observationDate: new Date().toISOString().split('T')[0],
    auditScheduleNo: '',
    auditType: '',
    auditArea: '',
    departmentName: '',
    auditee: '',
    auditor: '',
    ncrApprovedBy: '',
    status: 'PENDING',
    auditScore: 0,
    ofiCount: 0,
    complianceCount: 0,
    ncrCount: 0
  });

  const isVariableCriteria = useMemo(() => {
    return formData.auditTypeEntity?.criteriaType?.toLowerCase() === 'variable';
  }, [formData.auditTypeEntity]);

  const [details, setDetails] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [loadedScheduleStatus, setLoadedScheduleStatus] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);

  const { employees = [], auditTypes = [] } = useLookups(['EMPLOYEES', 'AUDIT_TYPE']);
  const { companyProfile } = useMasterDataStore();

  const isExternalAudit = useMemo(() => {
    // 1. Check current schedule or find in loaded schedules
    const sch = currentSchedule || schedules.find((s) => s.scheduleNo === formData.auditScheduleNo);
    if (sch) {
      if (sch.externalName && sch.externalName.trim()) return true;
      if (sch.externalEmailId && sch.externalEmailId.trim()) return true;
      if (sch.isExternal === true || sch.isExternal === 'YES') return true;
      if (sch.customerAuditArea === 'YES') return true;
    }

    // 2. Check formData auditTypeEntity or match against auditTypes lookup
    const typeEntity =
      formData.auditTypeEntity ||
      sch?.auditTypeEntity ||
      auditTypes.find(
        (at) => (at.auditType && at.auditType === formData.auditType) || (at.name && at.name === formData.auditType) || at.id === formData.auditTypeId
      );

    if (typeEntity) {
      if (typeEntity.customerAuditArea === 'YES' || typeEntity.isExternal === true || typeEntity.isExternal === 'YES') {
        return true;
      }
    }

    // 3. Check auditType string
    const typeStr = (formData.auditType || sch?.auditType || '').toUpperCase();
    if (
      typeStr.includes('EXTERNAL') ||
      typeStr.includes('CUSTOMER') ||
      typeStr.includes('SUPPLIER') ||
      typeStr.includes('THIRD PARTY') ||
      typeStr.includes('CERTIFICATION')
    ) {
      return true;
    }

    // 4. Check if auditor name includes (External)
    if (formData.auditor && formData.auditor.toLowerCase().includes('(external)')) {
      return true;
    }

    return false;
  }, [currentSchedule, schedules, formData.auditScheduleNo, formData.auditType, formData.auditTypeId, formData.auditTypeEntity, formData.auditor, auditTypes]);

  // ── Send Attendance Link Email State & Template Generator ──
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailPreviewTab, setEmailPreviewTab] = useState('preview');
  const [companyProfileData, setCompanyProfileData] = useState(null);
  const [emailData, setEmailData] = useState({
    from: '',
    to: '',
    cc: '',
    subject: '',
    body: '',
    useCompanyMail: true
  });
  const [emailErrors, setEmailErrors] = useState({});

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const res = await axios.get('/api/company-profiles/all', { skipGlobalAlert: true });
        if (res.data && res.data.length > 0) {
          const activeProf = res.data.find((p) => p.status === 'ACTIVE') || res.data[0];
          setCompanyProfileData(activeProf);
        }
      } catch (err) {
        console.error('Failed to load company profile:', err);
      }
    };
    fetchCompanyProfile();
  }, []);

  const buildExternalAuditEmailHtml = useCallback(({
    scheduleNo,
    auditType,
    auditArea,
    department,
    auditee,
    auditor,
    auditDate,
    startTime,
    endTime,
    extName,
    extEmail,
    extMobile,
    attendanceLink,
    profile
  }) => {
    const comp = profile || companyProfileData || companyProfile || {};
    const compName = comp?.companyName || localStorage.getItem('companyName') || 'AUTONOVA';
    const compAddr = [comp?.address, comp?.city, comp?.state, comp?.pincode].filter(Boolean).join(', ') || '2/555 - A, BABU JEGA JEEVAN RAM STREET, GERUGAMBAKKAM, CHENNAI - 600128';
    const compPhone = comp?.mobileNo || comp?.phoneNo || comp?.supportPhone || '+91 98400 00000';
    const compGst = comp?.gstIn || comp?.gstin || comp?.gstNo || '';
    const compEmail = comp?.companyEmail || comp?.emailId || comp?.supportEmail || 'info@autonova.com';
    const compWebsite = comp?.website || 'WWW.AUTONOVA.COM';

    const recipientName = extName || 'Auditor / Contact';
    const dateFormatted = auditDate ? String(auditDate).split('T')[0] : new Date().toISOString().split('T')[0];

    const auditDetails = [
      { label: 'Schedule No', value: scheduleNo, color: '#2563eb', isBold: true },
      { label: 'Audit Type', value: auditType || 'External Audit' },
      { label: 'Audit Area / Scope', value: auditArea || 'All Applicable Areas' },
      { label: 'Department', value: department || '-' },
      { label: 'Auditee', value: auditee || '-' },
      { label: 'Lead Auditor', value: auditor || recipientName },
      { label: 'Audit Date', value: dateFormatted, color: '#16a34a', isBold: true },
      { label: 'Scheduled Time', value: `${startTime || 'As Scheduled'}${endTime ? ` - ${endTime}` : ''}` },
      { label: 'Contact Email', value: extEmail, show: Boolean(extEmail) },
      { label: 'Contact Mobile', value: extMobile, show: Boolean(extMobile) }
    ].filter(r => r.show !== false && r.value);

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        
        <!-- Header Banner (Deep Royal Blue - 100% Email Client Compatible) -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1e3a8a" style="background-color: #1e3a8a; width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" bgcolor="#1e3a8a" style="background-color: #1e3a8a; padding: 26px 22px; text-align: center;">
              <div style="font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #93c5fd; margin-bottom: 6px;">
                QUALITY MANAGEMENT SYSTEM (QMS)
              </div>
              <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
                ${compName}
              </h2>
              ${compAddr ? `<div style="font-size: 12px; color: #e2e8f0; margin-top: 6px; line-height: 1.4;">${compAddr}</div>` : ''}
              <div style="font-size: 11.5px; color: #cbd5e1; margin-top: 4px;">
                ${compPhone ? `Phone: ${compPhone}` : ''} 
                ${compGst ? `${compPhone ? ' | ' : ''}GSTIN: ${compGst}` : ''}
              </div>
              
              <div style="margin-top: 14px;">
                <span style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 6px 20px; border-radius: 20px; font-size: 13px; font-weight: bold; border: 1px solid #60a5fa;">
                  Audit Schedule: ${scheduleNo}
                </span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Main Body -->
        <div style="padding: 26px 24px 22px; color: #1e293b; font-size: 14px; line-height: 1.6; background-color: #ffffff;">
          <p style="margin-top: 0; font-size: 15px; color: #0f172a;">
            Dear <strong>${recipientName}</strong>,
          </p>
          <p style="color: #475569; margin-bottom: 22px; font-size: 14px;">
            You have been scheduled for the upcoming Quality Management System audit. Please find the audit schedule details below and use the direct attendance link to confirm your participation.
          </p>

          <!-- Attendance Action Card (Solid High Contrast Blue Box) -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eff6ff" style="background-color: #eff6ff; border: 1.5px solid #93c5fd; border-radius: 10px; margin-bottom: 24px; border-collapse: separate;">
            <tr>
              <td align="center" style="padding: 20px 16px; text-align: center;">
                <div style="font-size: 12px; font-weight: bold; color: #1d4ed8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                  DIGITAL ATTENDANCE CONFIRMATION
                </div>
                <div style="font-size: 13.5px; color: #334155; margin-bottom: 14px;">
                  Click the button below upon commencement to record your entry timestamp:
                </div>
                <!-- Bulletproof Email Button -->
                <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto; border-collapse: separate;">
                  <tr>
                    <td align="center" bgcolor="#2563eb" style="border-radius: 8px; background-color: #2563eb;">
                      <a href="${attendanceLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 30px; border-radius: 8px; border: 1px solid #1d4ed8; text-transform: none;">
                        Record Audit Attendance (IN) &#10140;
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="font-size: 11.5px; color: #64748b; margin-top: 12px;">
                  * Link is active for audit date: <strong style="color: #0f172a;">${dateFormatted}</strong>. No login required.
                </div>
              </td>
            </tr>
          </table>

          <!-- Audit Schedule Specifications Table -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px; border-collapse: collapse;">
            <tr>
              <td colspan="2" bgcolor="#f1f5f9" style="background-color: #f1f5f9; padding: 10px 16px; font-weight: bold; font-size: 12.5px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">
                Audit Session Details
              </td>
            </tr>
            ${auditDetails.map((r, i) => `
            <tr style="border-bottom: ${i === auditDetails.length - 1 ? 'none' : '1px solid #f1f5f9'};">
              <td bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 10px 16px; font-weight: bold; color: #475569; width: 38%; font-size: 13px;">${r.label}:</td>
              <td bgcolor="#ffffff" style="background-color: #ffffff; padding: 10px 16px; font-weight: ${r.isBold ? 'bold' : 'normal'}; color: ${r.color || '#0f172a'}; font-size: 13px;">${r.value}</td>
            </tr>
            `).join('')}
          </table>

          <!-- Audit Guidelines -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px; border-collapse: collapse; background-color: #ffffff;">
            <tr>
              <td bgcolor="#f1f5f9" style="background-color: #f1f5f9; padding: 10px 16px; font-weight: bold; font-size: 12.5px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">
                Audit Instructions & Guidelines
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">
                <strong style="color: #0f172a;">1. Attendance:</strong> Click the attendance link when initiating the audit session to log your attendance in the portal.
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">
                <strong style="color: #0f172a;">2. Scope & Criteria:</strong> Please ensure relevant audit clauses, procedures, and evidence documents are reviewed during the audit.
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">
                <strong style="color: #0f172a;">3. Findings:</strong> Observations and Non-Conformance Reports (NCR) will be documented under schedule <strong style="color: #2563eb;">${scheduleNo}</strong>.
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 16px; font-size: 13px; color: #475569;">
                <strong style="color: #0f172a;">4. Support:</strong> For schedule coordination or technical assistance, reply directly to this notification.
              </td>
            </tr>
          </table>

          <!-- Sign-off -->
          <p style="margin-bottom: 4px; color: #64748b; font-size: 13px;">Warm regards,</p>
          <p style="margin-top: 0; font-size: 14px; font-weight: bold; color: #0f172a; line-height: 1.4;">
            Quality Management Systems (QMS)<br/>
            <span style="font-size: 13px; font-weight: bold; color: #2563eb;">${compName}</span>
          </p>
          <div style="font-size: 11.5px; color: #64748b; margin-top: 6px;">
            ${compEmail ? `Email: ${compEmail}` : ''} ${compEmail && compWebsite ? ' | ' : ''} ${compWebsite ? `Website: ${compWebsite}` : ''}
          </div>
        </div>
      </div>
    `;
  }, [companyProfileData, companyProfile]);

  const [activeEmployeeList, setActiveEmployeeList] = useState([]);

  useEffect(() => {
    if (emailDialogOpen) {
      axios.get('/api/master/hr/employees/active-office-mails')
        .then(res => {
          if (Array.isArray(res.data)) {
            setActiveEmployeeList(res.data);
          }
        })
        .catch(err => {
          console.error('Error fetching active employee office mails:', err);
          axios.get('/api/master/hr/employees/filter/active')
            .then(res2 => {
              if (Array.isArray(res2.data)) {
                setActiveEmployeeList(res2.data);
              }
            })
            .catch(() => { });
        });
    }
  }, [emailDialogOpen]);

  const emailCcArray = useMemo(() => {
    if (!emailData.cc) return [];
    if (Array.isArray(emailData.cc)) return emailData.cc;
    return String(emailData.cc).split(',').map(s => s.trim()).filter(Boolean);
  }, [emailData.cc]);

  const activeEmployeeMailOptions = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    (activeEmployeeList || []).forEach(emp => {
      if (!emp) return;

      const orgMail = emp.organization?.officeMail;
      const mail = String(emp.officeMail || emp.officeEmail || orgMail || '').trim();
      if (!mail) return;

      const code = emp.oldEmpCode || emp.empCode || emp.employeeCode || '';
      const name = (emp.employeeName || [emp.firstName, emp.lastName].filter(Boolean).join(' ') || emp.firstName || '').trim();
      const label = name ? `${name}${code ? ` (${code})` : ''} - ${mail}` : (code ? `${code} - ${mail}` : mail);

      const uniqueKey = `${emp.id || code || name}_${mail}`.toLowerCase();
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        list.push({
          value: mail,
          label: label,
          mail: mail,
          name: name,
          code: code,
          photoPath: emp.photoPath || emp.employeePhotoUpload || emp.photo || null
        });
      }
    });

    return list;
  }, [activeEmployeeList]);

  const handleOpenSendMail = async () => {
    let sch = currentSchedule;
    const schNo = formData.auditScheduleNo || '';
    if (!sch && schNo) {
      try {
        const schRes = await axios.get(`/api/qms/audit/observation/schedule-details/${schNo}`);
        sch = schRes.data?.schedule;
        setCurrentSchedule(sch);
      } catch (e) {}
    }

    let extEmail = sch?.externalEmailId || '';
    let extName = sch?.externalName || sch?.contactName || 'External Auditor / Contact';
    if (!extEmail && sch?.auditeeDetails) {
      try {
        const parsed = JSON.parse(sch.auditeeDetails);
        extEmail = parsed.externalEmailId || parsed.fromEmailToCustomer || '';
        if (parsed.externalName || parsed.contactName) {
          extName = parsed.externalName || parsed.contactName;
        }
      } catch (e) {}
    }

    const link = `${window.location.origin}/public/external-audit-attendance?scheduleNo=${encodeURIComponent(schNo)}&email=${encodeURIComponent(extEmail)}`;
    const subject = `AUDIT SCHEDULE ATTENDANCE LINK: ${schNo}`;
    
    const renderedHtml = buildExternalAuditEmailHtml({
      scheduleNo: schNo,
      auditType: formData.auditType || sch?.auditType,
      auditArea: formData.auditArea || sch?.auditArea,
      department: formData.departmentName || sch?.department,
      auditee: formData.auditee || sch?.auditee,
      auditor: formData.auditor || sch?.auditor || extName,
      auditDate: sch?.auditDate || formData.observationDate,
      startTime: sch?.startTime,
      endTime: sch?.endTime,
      extName: extName,
      extEmail: extEmail,
      extMobile: sch?.externalMobileNo || '',
      attendanceLink: link,
      profile: companyProfileData || companyProfile
    });

    setEmailData({
      from: (companyProfileData || companyProfile)?.companyEmail || 'Company Email (Configured SMTP)',
      to: extEmail,
      cc: '',
      subject: subject,
      body: renderedHtml,
      useCompanyMail: true
    });
    setEmailPreviewTab('preview');
    setEmailErrors({});
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailData.to || !emailData.to.trim()) {
      setEmailErrors({ to: 'Recipient email is required' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailData.to.trim())) {
      setEmailErrors({ to: 'Invalid recipient email address' });
      return;
    }
    setEmailSending(true);
    try {
      await axios.post('/api/qms/audit-schedules/send-attendance-link', {
        scheduleNo: formData.auditScheduleNo,
        to: emailData.to.trim(),
        cc: emailData.cc ? emailData.cc.trim() : null,
        subject: emailData.subject,
        body: emailData.body,
        useCompanyMail: emailData.useCompanyMail
      });
      dispatch(openSnackbar({ open: true, message: 'Attendance link email sent successfully!', variant: 'alert', severity: 'success' }));
      setEmailDialogOpen(false);
    } catch (err) {
      console.error('Failed to send email:', err);
      let msg = 'Failed to send email';
      if (err.response?.data) {
        msg = typeof err.response.data === 'string' ? err.response.data : err.response.data.message || msg;
      }
      dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', severity: 'error' }));
    } finally {
      setEmailSending(false);
    }
  };

  // ── User Directory for Video Calling ──
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    // Pre-fetch directory users to map participant name/code to active user id
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/chat/search/users?query=');
        if (res.data && Array.isArray(res.data)) {
          setAllUsers(res.data);
        }
      } catch (e) {
        console.error('Failed to load user directory for video calling', e);
      }
    };
    fetchUsers();
  }, []);

  const handleStartVideoCall = async (row) => {
    let usersList = allUsers;
    if (!usersList || usersList.length === 0) {
      try {
        const res = await axios.get('/api/chat/search/users?query=');
        if (res.data && Array.isArray(res.data)) {
          usersList = res.data;
          setAllUsers(res.data);
        }
      } catch (e) {
        console.error('Failed to load users list:', e);
      }
    }

    const cleanRowName = (row.name || '').split(' - ')[0].trim().toLowerCase();
    const rawCode = (row.employeeCode || '').trim().toLowerCase();
    const rowEmpId = row.employeeId ? String(row.employeeId) : (row.empId ? String(row.empId) : '');

    let matchedUser = usersList.find((u) => {
      const uName = (u.employeeName || '').trim().toLowerCase();
      const uId = (u.userId || '').trim().toLowerCase();
      const uCode = (u.employeeCode || '').trim().toLowerCase();
      const uEmpId = u.empId ? String(u.empId) : '';

      return (
        (uCode && rawCode && uCode === rawCode) ||
        (uCode && cleanRowName && uCode === cleanRowName) ||
        (uEmpId && rowEmpId && uEmpId === rowEmpId) ||
        (uId && (uId === rawCode || uId === cleanRowName)) ||
        (uName && (uName === cleanRowName || cleanRowName.includes(uName) || uName.includes(cleanRowName)))
      );
    });

    if (!matchedUser) {
      matchedUser = {
        userId: row.employeeCode || cleanRowName || 'auditee',
        employeeName: row.name || 'Auditee',
        departmentName: formData.departmentName || '',
        designationName: 'Auditee / Participant'
      };
    }

    console.log('[Audit Video Call] Initiating centralized universal call to:', matchedUser);
    startUniversalCall({
      targetUser: matchedUser,
      callType: 'AUDIT',
      title: 'Audit Live Video Verification',
      subtitle: `Auditing: ${matchedUser.employeeName}`
    });
  };

  const { pausedRows, togglePauseClock, pauseRow, isRowPaused } = useBOSLiveClock(
    attendance,
    setAttendance,
    {
      timeField: 'outTime',
      keyField: 'id',
      shouldUpdate: (item) => !isSaved && item.attendanceStatus !== 'ABSENT'
    }
  );

  const handleAddCustomFinding = () => {
    const nextSeq = details.length > 0
      ? Math.max(...details.map(d => parseInt(d.seqNo, 10) || 0)) + 1
      : 1;
    setDetails((prev) => [
      ...prev,
      {
        id: `new-finding-${Date.now()}-${prev.length}`,
        seqNo: nextSeq,
        clause: '',
        criteriaDetails: '',
        attachmentReq: 'NO',
        observationStatus: '',
        approvalStatus: 'PENDING',
        comments: '',
        isManual: true
      }
    ]);
  };

  const fetchSchedules = useCallback(async () => {
    if (!user?.id) return;
    setSchedulesLoading(true);
    try {
      const res = await axios.get('/api/qms/audit/observation/open-schedules', {
        params: { currentUser: user.id },
        skipGlobalAlert: true
      });
      setSchedules(res.data || []);
    } catch (err) {
      console.error('Failed to fetch open schedules:', err);
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const availableSchedules = useMemo(() => {
    const list = [...schedules];
    if (isEditing && formData.auditScheduleNo && !list.some((s) => s.scheduleNo === formData.auditScheduleNo)) {
      list.push({
        id: 'selected-' + formData.auditScheduleNo,
        scheduleNo: formData.auditScheduleNo,
        auditType: formData.auditType || ''
      });
    }
    return list;
  }, [schedules, isEditing, formData.auditScheduleNo, formData.auditType]);

  const validDetailsCount = useMemo(() => {
    return details.filter(
      (d) =>
        d.observationStatus &&
        d.observationStatus !== 'NO ENTRY' &&
        d.observationStatus !== 'NO_ENTRY' &&
        d.observationStatus !== 'PENDING' &&
        d.observationStatus !== 'NOT APPLICABLE' &&
        d.observationStatus !== 'NOT_APPLICABLE'
    ).length;
  }, [details]);

  const isAuditorUser = useMemo(() => {
    if (!user) return false;
    if (!formData.auditor) return false;

    const auditorStr = formData.auditor.trim().toLowerCase();
    const userEmpCode = (user.employeeCode || user.empCode || '').trim().toLowerCase();
    const userUserId = (user.id || '').trim().toLowerCase();
    const userName = (user.name || '').trim().toLowerCase();

    // Split by comma in case there are multiple auditors
    const auditorParts = auditorStr.split(',').map((p) => p.trim());

    for (const part of auditorParts) {
      if (part.includes(' - ')) {
        const subParts = part.split(' - ');
        const namePart = subParts[0]?.trim();
        const codePart = subParts[1]?.trim();

        if (userEmpCode && codePart && userEmpCode === codePart) return true;
        if (userUserId && codePart && userUserId === codePart) return true;
        if (userName && namePart && userName === namePart) return true;
      } else {
        if (userEmpCode && part.includes(userEmpCode)) return true;
        if (userUserId && part.includes(userUserId)) return true;
        if (userName && part.includes(userName)) return true;
      }
    }

    return false;
  }, [user, formData.auditor]);

  const isRowAuditor = useCallback(
    (row) => {
      if (!formData.auditor || !row) return false;
      const auditorStr = formData.auditor.trim().toLowerCase();
      const rowEmpCode = (row.employeeCode || '').trim().toLowerCase();
      const rowName = (row.name || '').trim().toLowerCase();

      if (auditorStr.includes(' - ')) {
        const parts = auditorStr.split(' - ');
        const namePart = parts[0]?.trim();
        const codePart = parts[1]?.trim();
        if (rowEmpCode && codePart && rowEmpCode === codePart) return true;
        if (rowName && namePart && rowName === namePart) return true;
      } else {
        if (rowEmpCode && auditorStr === rowEmpCode) return true;
        if (rowName && auditorStr === rowName) return true;
      }
      return false;
    },
    [formData.auditor]
  );

  const attendanceColumns = useMemo(
    () => [
      { id: 'name', label: 'Name', minWidth: 150 },
      { id: 'inTime', label: 'In Time', minWidth: 100 },
      { id: 'outTime', label: 'Out Time', minWidth: 120 },
      { id: 'attendanceStatus', label: 'Status', minWidth: 170 }
    ],
    []
  );

  const checklistColumns = useMemo(
    () => {
      const cols = [
        { id: 'sNo', label: 'S.No', minWidth: 50 },
        { id: 'seqNo', label: 'Seq', minWidth: 50 },
        { id: 'clause', label: 'Clause', minWidth: 100 },
        { id: 'criteriaDetails', label: 'Criteria Details', minWidth: 250 },
        { id: 'attachmentReq', label: 'Req.', minWidth: 60 },
        { id: 'observationStatus', label: 'Status', minWidth: 150 },
        { id: 'approvalStatus', label: 'Approval', minWidth: 100 },
        { id: 'comments', label: 'Comments *', minWidth: 240 },
        { id: 'attachment', label: 'Evidence', minWidth: 350 }
      ];
      if (perms.write && isVariableCriteria) {
        cols.push({ id: 'actions', label: 'Actions', minWidth: 80 });
      }
      return cols;
    },
    [perms.write, isVariableCriteria]
  );

  useEffect(() => {
    if (isEditing) {
      fetchObservation();
    } else {
      generateObservationNo();
    }
  }, [id, isEditing]);

  // Remove manual fetch as useLookups handles it now

  const generateObservationNo = async () => {
    try {
      const res = await axios.get(`${API_PATHS.QMS.AUDIT_OBSERVATION}/next-no`, { skipGlobalAlert: true });
      const currentYear = new Date().getFullYear() % 100;
      setFormData((prev) => ({ ...prev, observationNo: res.data || `OB-${currentYear}-001` }));
    } catch {
      const currentYear = new Date().getFullYear() % 100;
      setFormData((prev) => ({ ...prev, observationNo: `OB-${currentYear}-001` }));
    }
  };

  const fetchObservation = async () => {
    try {
      const res = await axios.get(`${API_PATHS.QMS.AUDIT_OBSERVATION}/${id}`, { skipGlobalAlert: true });
      const cleanDate = res.data.observationDate ? res.data.observationDate.split('T')[0].split(' ')[0] : '';
      setFormData({
        ...res.data,
        observationDate: cleanDate
      });
      if (res.data.id) {
        setIsSaved(true);
      }
      const loadedDetails = (res.data.details || []).map((d) => {
        const mapped = {
          ...d,
          attachmentReq: d.attachmentReq === true || d.attachmentReq === 'YES' ? 'YES' : 'NO'
        };
        if (d.observationStatus === 'COMPLIANCE' || d.observationStatus === 'NOT APPLICABLE' || d.observationStatus === 'NOT_APPLICABLE' || d.observationStatus === 'NO ENTRY') {
          mapped.approvalStatus = 'APPROVED';
        }
        return mapped;
      });
      setDetails(loadedDetails);
      if (res.data.auditScheduleNo) {
        fetchAttendance(res.data.auditScheduleNo);
        axios.get(`/api/qms/audit/observation/schedule-details/${res.data.auditScheduleNo}`)
          .then(schRes => {
            if (schRes.data && schRes.data.schedule) {
              setCurrentSchedule(schRes.data.schedule);
              setLoadedScheduleStatus(schRes.data.schedule.status || '');
              setFormData((prev) => ({
                ...prev,
                auditArea: prev.auditArea || schRes.data.schedule.auditArea || ''
              }));
            }
          })
          .catch(() => { });
      }
    } catch {
      console.error('Failed to fetch observation');
    }
  };

  const sanitizeAttendanceList = (list) => {
    return (list || []).map((item) => {
      const hasInTime = Boolean(item.inTime && item.inTime !== 'undefined' && item.inTime !== 'null' && item.inTime.trim() !== '');
      const statusUpper = (item.attendanceStatus || '').toUpperCase().trim();
      let status = 'PRESENT';
      if (statusUpper === 'ABSENT' && !hasInTime) {
        status = 'ABSENT';
      }
      return {
        ...item,
        attendanceStatus: status
      };
    });
  };

  const fetchAttendance = async (scheduleNo) => {
    try {
      const res = await axios.get(`${API_PATHS.QMS.AUDIT_ATTENDANCE}/by-schedule/${scheduleNo}`);
      if (res.data && res.data.length > 0) {
        setAttendance(sanitizeAttendanceList(res.data));
      } else {
        const partRes = await axios.get(`${API_PATHS.QMS.AUDIT_ATTENDANCE}/participants/${scheduleNo}`);
        const initialAttendance = (partRes.data || []).map((part, idx) => ({
          id: `new-${idx}-${Date.now()}`,
          isManual: true,
          name: part.name,
          employeeCode: part.code !== '-' ? part.code : '',
          inTime: '',
          outTime: '',
          attendanceStatus: 'PRESENT'
        }));
        setAttendance(sanitizeAttendanceList(initialAttendance));
      }
    } catch {
      console.error('Failed to fetch attendance');
    }
  };

  const handleScheduleChange = async (e) => {
    const schNo = (e.target.value || '').trim();
    if (!schNo) return;
    try {
      const res = await axios.get(`/api/qms/audit/observation/schedule-details/${schNo}`);
      const { schedule: sch, criteria, attendance: att, existingObservation: obs } = res.data;
      setCurrentSchedule(sch || null);
      setLoadedScheduleStatus(sch?.status || '');

      if (obs) {
        // If an observation already exists, load it
        const cleanDate = obs.observationDate ? obs.observationDate.split('T')[0].split(' ')[0] : '';
        let loadedAuditor = obs.auditor;
        if ((!loadedAuditor || loadedAuditor === '-' || loadedAuditor.trim() === '') && sch?.externalName) {
          loadedAuditor = `${sch.externalName.trim()} (External)`;
        }
        setFormData({
          ...obs,
          auditArea: obs.auditArea || sch?.auditArea || '',
          auditor: loadedAuditor || obs.auditor,
          observationDate: cleanDate
        });
        const loadedDetails = (obs.details || []).map((d) => {
          const mapped = {
            ...d,
            attachmentReq: d.attachmentReq === true || d.attachmentReq === 'YES' ? 'YES' : 'NO'
          };
          if (d.observationStatus === 'COMPLIANCE' || d.observationStatus === 'NOT APPLICABLE' || d.observationStatus === 'NOT_APPLICABLE' || d.observationStatus === 'NO ENTRY') {
            mapped.approvalStatus = 'APPROVED';
          }
          return mapped;
        });
        setDetails(loadedDetails);

        if (obs && obs.id && obs.status && obs.status !== 'PENDING') {
          setIsSaved(true);
        } else {
          setIsSaved(false);
        }
        // Load attendance
        if (att && att.length > 0) {
          setAttendance(sanitizeAttendanceList(att));
        } else {
          fetchAttendance(schNo);
        }

        dispatch(
          openSnackbar({
            open: true,
            message: `Loaded existing Observation ${obs.observationNo} for Schedule ${schNo}`,
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'info',
            close: false
          })
        );
      } else {
        // No existing observation, initialize new one
        await generateObservationNo();
        setFormData((prev) => ({
          ...prev,
          id: null,
          auditScheduleNo: schNo,
          auditType: sch.auditType,
          auditTypeId: sch.auditTypeId || null,
          auditTypeEntity: sch.auditTypeEntity || null,
          auditArea: sch.auditArea || '',
          auditAreaId: sch.auditAreaId || null,
          departmentName: sch.department,
          departmentId: sch.departmentId || null,
          auditee: sch.auditee,
          auditeeId: sch.auditeeId || null,
          auditor: (sch.externalName && sch.externalName.trim()) ? `${sch.externalName.trim()} (External)` : (sch.auditor || ''),
          auditorId: sch.auditorId || null,
          ncrApprovedBy: sch.ncrApprovedBy,
          ncrApprovedById: sch.ncrApprovedById || null,
          status: 'PENDING',
          auditScore: 0,
          ofiCount: 0,
          complianceCount: 0,
          ncrCount: 0
        }));

        const initialDetails = (criteria || []).map((c) => ({
          seqNo: c.seqNo,
          clause: c.clause,
          criteriaDetails: c.criteriaDetails,
          attachmentReq: c.attachmentReq === true || c.attachmentReq === 'YES' ? 'YES' : 'NO',
          observationStatus: '',
          approvalStatus: '',
          comments: ''
        }));
        setDetails(initialDetails);

        if (att && att.length > 0) {
          setAttendance(sanitizeAttendanceList(att));
        } else {
          // Fallback to fetch participants
          try {
            const partRes = await axios.get(`${API_PATHS.QMS.AUDIT_ATTENDANCE}/participants/${schNo}`);
            const initialAttendance = (partRes.data || []).map((part, idx) => ({
              id: `new-${idx}-${Date.now()}`,
              isManual: true,
              name: part.name,
              employeeCode: part.code !== '-' ? part.code : '',
              inTime: '',
              outTime: '',
              attendanceStatus: 'PRESENT'
            }));
            setAttendance(sanitizeAttendanceList(initialAttendance));
          } catch {
            setAttendance([]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load schedule details:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load schedule details',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const updateDetail = useCallback((idx, field, value) => {
    setDetails((prevDetails) => {
      return prevDetails.map((d, i) => {
        if (i === idx) {
          const updated = { ...d, [field]: value };
          if (field === 'observationStatus') {
            if (value === 'COMPLIANCE' || value === 'NOT APPLICABLE' || value === 'NOT_APPLICABLE' || value === 'NO ENTRY') {
              updated.approvalStatus = 'APPROVED';
            } else {
              updated.approvalStatus = 'PENDING';
            }
          }
          return updated;
        }
        return d;
      });
    });
  }, []);

  useEffect(() => {
    let compliance = 0;
    let ofi = 0;
    let ncCount = 0;

    details.forEach((d) => {
      const status = d.observationStatus || '';
      if (status === 'COMPLIANCE') {
        compliance++;
      } else if (status === 'OFI') {
        ofi++;
      } else if (status === 'NCR') {
        ncCount++;
      }
    });

    const total = details.length;
    const calcScore = total > 0 ? Number(((compliance * 100) / total).toFixed(2)) : 0;

    setFormData((prev) => {
      if (prev.complianceCount === compliance && prev.ofiCount === ofi && prev.ncrCount === ncCount && prev.auditScore === calcScore) {
        return prev;
      }
      return {
        ...prev,
        complianceCount: compliance,
        ofiCount: ofi,
        ncrCount: ncCount,
        auditScore: calcScore
      };
    });
  }, [details]);

  const handleSave = async () => {
    const hasSummaryErrors = !validate(formData, VALIDATION_RULES);

    // SOP: Observation Transaction Validation (SOP 5.2.4) - comments mandatory for all findings
    const missingComments = details.some(
      (d) => !d.comments || d.comments.trim() === ''
    );

    // SOP: Mandatory Attachment Rule (SOP 5.1.4) - required for all non-empty findings if marked
    const missingAttachments = details.some((d) => (d.attachmentReq === 'YES' || d.attachmentReq === true) && !d.attachmentPath);

    if (hasSummaryErrors) {
      return;
    }

    const missingStatus = details.some((d) => !d.observationStatus || d.observationStatus.trim() === '');
    if (missingStatus) {
      setShowTableErrors(true);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please select a Status for all Audit Findings.',
          severity: 'error',
          variant: 'alert'
        })
      );
      return;
    }


    if (missingComments) {
      setShowTableErrors(true);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please enter comments for all audit findings.',
          severity: 'error',
          variant: 'alert'
        })
      );
      return;
    }

    if (missingAttachments) {
      setShowTableErrors(true);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please upload attachments where required (marked as YES).',
          severity: 'error',
          variant: 'alert'
        })
      );
      return;
    }

    const hasEmptyManualAttendee = attendance.some((item) => item.isManual && (!item.name || item.name.trim() === ''));
    if (hasEmptyManualAttendee) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please fill in names for all manually added attendees.',
          severity: 'error',
          variant: 'alert'
        })
      );
      return;
    }

    const hasEmptyManualChecklist = details.some(
      (d) => d.isManual && (!d.clause || d.clause.trim() === '' || !d.criteriaDetails || d.criteriaDetails.trim() === '')
    );
    if (hasEmptyManualChecklist) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please enter Clause and Criteria Details for all manually added checklist rows.',
          severity: 'error',
          variant: 'alert'
        })
      );
      return;
    }

    try {
      const sch = schedules.find((s) => s.scheduleNo === formData.auditScheduleNo);
      const hasNcrOrOfi = details.some(d => d.observationStatus === 'NCR' || d.observationStatus === 'NC' || d.observationStatus === 'OFI');
      let finalStatus = formData.status;
      if (!isEditing || finalStatus === 'PENDING') {
        finalStatus = hasNcrOrOfi ? 'OPEN' : 'CLOSED';
      }

      const sanitizedDetails = details.map(d => ({
        ...d,
        id: (typeof d.id === 'string' && !/^\d+$/.test(d.id)) ? null : d.id,
        attachmentReq: d.attachmentReq === 'YES' || d.attachmentReq === true,
        targetDate: d.targetDate === '' ? null : d.targetDate,
        closedDate: d.closedDate === '' ? null : d.closedDate
      }));

      const payload = {
        ...formData,
        status: finalStatus,
        auditTypeId: sch ? sch.auditTypeId : formData.auditTypeId,
        auditAreaId: sch ? sch.auditAreaId : formData.auditAreaId,
        departmentId: sch ? sch.departmentId : formData.departmentId,
        auditeeId: sch ? sch.auditeeId : formData.auditeeId,
        auditorId: sch ? sch.auditorId : formData.auditorId,
        ncrApprovedById: sch ? sch.ncrApprovedById : formData.ncrApprovedById,
        details: sanitizedDetails
      };
      // Save/update attendance records first, before the observation potentially closes the schedule
      try {
        const attendancePromises = attendance.map((item) => {
          const outTimeVal = (item.outTime && item.outTime.trim() !== '' && item.outTime !== 'null' && item.outTime !== 'undefined')
            ? item.outTime
            : (item.attendanceStatus === 'PRESENT' ? getSystemTime12h() : '');
          const finalData = {
            auditScheduleNo: formData.auditScheduleNo,
            name: item.name,
            employeeCode: item.employeeCode || '',
            inTime: item.inTime || '',
            outTime: outTimeVal,
            attendanceStatus: item.attendanceStatus || 'PRESENT'
          };
          const isNewItem = item.isManual || !item.id || (typeof item.id === 'string' && !/^\d+$/.test(String(item.id)));
          if (isNewItem) {
            return axios.post(API_PATHS.QMS.AUDIT_ATTENDANCE, finalData, { skipGlobalAlert: true });
          } else {
            return axios.put(`${API_PATHS.QMS.AUDIT_ATTENDANCE}/${item.id}`, { ...item, ...finalData }, { skipGlobalAlert: true })
              .catch((err) => {
                if (err.response?.status === 404) {
                  return axios.post(API_PATHS.QMS.AUDIT_ATTENDANCE, finalData, { skipGlobalAlert: true });
                }
                throw err;
              });
          }
        });
        await Promise.all(attendancePromises);
      } catch (attError) {
        console.error('Failed to save some attendance records:', attError);
      }

      console.debug('[SaveTrace] Posting observation payload:', payload);
      if (isEditing) {
        await axios.put(`${API_PATHS.QMS.AUDIT_OBSERVATION}/${id}`, payload, { skipGlobalAlert: true });
      } else {
        await axios.post(API_PATHS.QMS.AUDIT_OBSERVATION, payload, { skipGlobalAlert: true });
      }

      const scheduleStatus = sch?.status || loadedScheduleStatus || '';
      const isRescheduled = scheduleStatus.toUpperCase() === 'RESCHEDULE' || scheduleStatus.toUpperCase() === 'RESCHEDULED';

      const successMessage = isRescheduled
        ? 'Observation saved successfully for the rescheduled audit!'
        : 'Observation saved successfully!';

      setIsSaved(true);
      dispatch(openSnackbar({ open: true, message: successMessage, severity: 'success', variant: 'alert' }));
      navigate('/qms/audit/observation');
    } catch (err) {
      console.error('[SaveTrace] Observation save failed:', err);
      let errorMsg = 'Failed to save observation';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
      }
      dispatch(openSnackbar({ open: true, message: `[${err.config?.method?.toUpperCase()} ${err.config?.url}] ${errorMsg}`, severity: 'error', variant: 'alert' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+s': handleSave,
    escape: () => navigate('/qms/audit/observation')
  });

  return (
    <>
      <MainCard
      stretch={false}
      icon={IconFileText}
      title={<Typography variant="h3">Audit Observation {isEditing ? 'Edit' : 'Creation'}</Typography>}
      secondary={
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            sx={btnCancel}
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/qms/audit/observation')}
          >
            Back
          </Button>
          {formData.auditScheduleNo && isExternalAudit && (
            <Button
              variant="contained"
              sx={{
                ...btnWarning,
                bgcolor: '#f59e0b',
                color: '#1e293b',
                fontWeight: 700,
                '& .MuiSvgIcon-root, & svg': { color: '#1e293b' },
                '&:hover': {
                  bgcolor: '#d97706',
                  color: '#ffffff',
                  '& svg': { color: '#ffffff' }
                }
              }}
              startIcon={<IconMail size={20} />}
              onClick={handleOpenSendMail}
            >
              Send Attendance Link
            </Button>
          )}
          {perms.write && (
            <Button variant="contained" sx={btnSave} onClick={handleSave} disabled={isSaved} startIcon={<IconCheck size={20} />}>
              Save
            </Button>
          )}
        </Stack>
      }
    >
      <Stack spacing={3}>
        <BOSFormSection icon={<IconCalendarEvent size={20} color={theme.palette.primary.main} />} title="Observation Summary">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
            <BOSTextField label="Observation No" value={formData.observationNo || ''} inputProps={{ readOnly: true }} />
            <BOSDatePicker
              required
              label="Observation Date"
              name="observationDate"
              value={formData.observationDate || ''}
              onChange={(e) => {
                const newDate = e.target.value;
                setFormData((prev) => ({ ...prev, observationDate: newDate }));
              }}
              error={!!errors.observationDate}
              helperText={errors.observationDate}
              disabled={true}
              sx={errorStyle(!!errors.observationDate)}
            />
            <Autocomplete
              disabled={!perms.write || isEditing}
              loading={schedulesLoading}
              options={availableSchedules}
              getOptionLabel={(s) => s.scheduleNo || ''}
              isOptionEqualToValue={(opt, val) => opt.scheduleNo === val.scheduleNo}
              value={availableSchedules.find((s) => s.scheduleNo === formData.auditScheduleNo) || null}
              onChange={(_, selected) => {
                if (selected) {
                  handleScheduleChange({ target: { value: selected.scheduleNo } });
                } else {
                  setFormData((prev) => ({ ...prev, auditScheduleNo: '' }));
                }
              }}
              noOptionsText={schedulesLoading ? 'Loading…' : 'No open schedules found'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Schedule No"
                  size="small"
                  error={!!errors.auditScheduleNo}
                  helperText={errors.auditScheduleNo}
                  sx={{
                    ...errorStyle(!!errors.auditScheduleNo),
                    '& .MuiInputBase-root': { borderRadius: '8px', background: 'transparent' }
                  }}
                />
              )}
              sx={{ flex: '1 1 calc(33.33% - 12px)', minWidth: '200px' }}
            />
            <BOSTextField label="Audit Type" value={formData.auditType || ''} inputProps={{ readOnly: true }} />
            <BOSTextField label="Audit Area" value={formData.auditArea || ''} inputProps={{ readOnly: true }} />
            <BOSTextField label="Department" value={formData.departmentName || ''} inputProps={{ readOnly: true }} />
            <BOSTextField
              label="Auditee"
              value={
                formData.auditee && formData.auditee.includes(' - ') ? formData.auditee.split(' - ')[0].trim() : formData.auditee || ''
              }
              inputProps={{ readOnly: true }}
            />
            <BOSTextField
              label="Auditor"
              value={
                formData.auditor && formData.auditor.includes(' - ') ? formData.auditor.split(' - ')[0].trim() : formData.auditor || ''
              }
              inputProps={{ readOnly: true }}
            />
            <BOSTextField
              label="NC Approved By"
              value={
                formData.ncrApprovedBy && formData.ncrApprovedBy.includes(' - ')
                  ? formData.ncrApprovedBy.split(' - ')[0].trim()
                  : formData.ncrApprovedBy || ''
              }
              inputProps={{ readOnly: true }}
            />
          </Box>
        </BOSFormSection>

        {/* Section 2: Attendance & Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' }, gap: 3 }}>
          <BOSFormSection
            icon={<IconUsers size={20} color={theme.palette.secondary.main} />}
            title="Audit Attendance"
            sx={{ height: 'fit-content' }}
          >
            <BOSDataTable
              columns={attendanceColumns}
              rows={attendance}
              page={0}
              size={attendance.length || 5}
              loading={false}
              showActions={false}
              disableSearchFilter={true}
              sx={{ height: '250px' }}
              renderCell={(col, row) => {
                if (col.id === 'name') {
                  if (row.isManual && perms.write) {
                    return (
                      <BOSTextField
                        size="small"
                        value={row.name || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAttendance((prev) => prev.map((item) => (item.id === row.id ? { ...item, name: val } : item)));
                        }}
                        placeholder="Enter name..."
                        fullWidth
                      />
                    );
                  }
                  const isAud = isRowAuditor(row);
                  return (
                    <Typography sx={{ color: isAud ? 'error.main' : 'inherit', fontWeight: isAud ? 600 : 'inherit' }}>
                      {row.name || '-'}
                    </Typography>
                  );
                }
                if (col.id === 'attendanceStatus') {
                  const hasInTime = Boolean(row.inTime && row.inTime !== 'undefined' && row.inTime !== 'null' && row.inTime.trim() !== '');
                  const statusUpper = (row.attendanceStatus || '').toUpperCase().trim();
                  const isPresent = statusUpper === 'PRESENT' || (hasInTime && statusUpper !== 'ABSENT');

                  return (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {row.isManual && perms.write ? (
                        <BOSTextField
                          select
                          size="small"
                          value={row.attendanceStatus || 'PRESENT'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAttendance((prev) => prev.map((item) => (item.id === row.id ? { ...item, attendanceStatus: val } : item)));
                          }}
                          sx={{ minWidth: 100 }}
                        >
                          <MenuItem value="PRESENT">PRESENT</MenuItem>
                          <MenuItem value="ABSENT">ABSENT</MenuItem>
                        </BOSTextField>
                      ) : (
                        <BOSStatusChip status={isPresent ? 'PRESENT' : 'ABSENT'} showIcon={true} width={105} />
                      )}

                      {!isEditing && !isSaved && (
                        <Tooltip title={`Start Video Call with ${row.name || 'Participant'}`} arrow placement="top">
                          <IconButton
                            size="small"
                            onClick={() => handleStartVideoCall(row)}
                            sx={{
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.12)',
                              color: 'primary.main',
                              border: '1px solid',
                              borderColor: 'primary.main',
                              '&:hover': {
                                bgcolor: 'primary.main',
                                color: '#fff',
                                transform: 'scale(1.08)'
                              },
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              width: 32,
                              height: 32,
                              borderRadius: '8px'
                            }}
                          >
                            <VideocamTwoToneIcon sx={{ fontSize: '1.15rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  );
                }
                if (col.id === 'inTime') {
                  const cleanedInTime = !row.inTime || row.inTime === 'undefined' || row.inTime === 'null' ? '' : row.inTime;
                  const rawVal = cleanedInTime || getSystemTime12h();
                  return (
                    <Typography variant="body2" sx={{ px: 1 }}>
                      {formatTime(rawVal, timeFormat)}
                    </Typography>
                  );
                }
                if (col.id === 'outTime') {
                  const key = row.id;
                  const isPaused = isRowPaused(key);
                  const isDisabled = !perms.write || row.attendanceStatus === 'ABSENT' || isSaved;
                  const cleanedOutTime = !row.outTime || row.outTime === 'undefined' || row.outTime === 'null' ? '' : row.outTime;

                  if (isSaved) {
                    return (
                      <BOSTimePicker
                        size="small"
                        value={row.attendanceStatus === 'ABSENT' ? '' : cleanedOutTime}
                        disabled={true}
                      />
                    );
                  }

                  return (
                    <BOSAnalogTimePicker
                      size="small"
                      value={row.attendanceStatus === 'ABSENT' ? '' : (cleanedOutTime || getSystemTime12h())}
                      disabled={isDisabled}
                      disableFutureValidation
                      minTime={row.inTime}
                      minTimeMessage="Out time cannot be before in time."
                      isLiveClock={true}
                      isPaused={isPaused}
                      onTogglePause={!isDisabled ? () => togglePauseClock(key) : undefined}
                      onChange={(e) => {
                        pauseRow(key);
                        const val = e.target.value;
                        if (!val) return;

                        const outDate = parseTime12h(val);
                        const inTimeStr = row.inTime || formatTime12(new Date().getHours(), new Date().getMinutes());
                        const inDate = parseTime12h(inTimeStr);

                        if (inDate && outDate && outDate < inDate) {
                          dispatch(
                            openSnackbar({
                              open: true,
                              message: 'Out Time cannot be earlier than In Time.',
                              severity: 'error',
                              variant: 'alert'
                            })
                          );
                          return;
                        }

                        const updatedRow = { ...row, outTime: val };
                        setAttendance((prev) => prev.map((item) => (item.id === row.id ? updatedRow : item)));
                      }}
                    />
                  );
                }
                return row[col.id] || '-';
              }}
            />
          </BOSFormSection>

          <Card
            sx={{
              border: 'none',
              borderRadius: '20px',
              height: 'fit-content',
              background:
                theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, rgba(20, 24, 33, 0.95) 100%)`
                  : `linear-gradient(135deg, ${theme.palette.primary.light} 0%, #ffffff 100%)`,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 10px 30px rgba(98, 54, 255, 0.08)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.palette.mode === 'dark' ? '0 15px 35px rgba(0, 0, 0, 0.6)' : '0 15px 35px rgba(98, 54, 255, 0.15)'
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${theme.palette.primary.main} 0%, transparent 70%)`,
                opacity: 0.15,
                filter: 'blur(10px)',
                zIndex: 0
              }}
            />
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
              <Tooltip title="View Score Calculation Formula & Sample Data" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => setScoreInfoOpen(true)}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(98,54,255,0.08)',
                    color: 'primary.main',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    '&:hover': {
                      bgcolor: theme.palette.primary.main,
                      color: '#ffffff',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <IconInfoCircle size={20} />
                </IconButton>
              </Tooltip>

              <Stack spacing={2.5} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(98, 54, 255, 0.08)',
                    color: 'primary.main',
                    width: 56,
                    height: 56,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  <IconReportAnalytics size={30} />
                </Avatar>
                <Stack spacing={0.5} alignItems="center">
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontSize: '0.75rem'
                    }}
                  >
                    Audit Score
                  </Typography>
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: '3.5rem',
                      fontWeight: 900,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1.1
                    }}
                  >
                    {validDetailsCount > 0 ? `${((formData.complianceCount / validDetailsCount) * 100).toFixed(1).replace(/\.0$/, '')}%` : '0%'}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
                    {formData.complianceCount} / {validDetailsCount} Points
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    width: '100%',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderRadius: '14px',
                    p: 2,
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                          Compliance
                        </Typography>
                      </Stack>
                      <Chip
                        label={formData.complianceCount}
                        size="small"
                        color="success"
                        sx={{ fontWeight: 700, borderRadius: '6px', height: 20 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                          OFI
                        </Typography>
                      </Stack>
                      <Chip
                        label={formData.ofiCount}
                        size="small"
                        color="warning"
                        sx={{ fontWeight: 700, borderRadius: '6px', height: 20 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                          NC
                        </Typography>
                      </Stack>
                      <Chip
                        label={formData.ncrCount}
                        size="small"
                        color="error"
                        sx={{ fontWeight: 700, borderRadius: '6px', height: 20 }}
                      />
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Audit Score Calculation Breakdown Popup Dialog */}
          <Dialog
            open={scoreInfoOpen}
            onClose={() => setScoreInfoOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '20px',
                p: 1,
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                bgcolor: theme.palette.mode === 'dark' ? '#111936' : '#ffffff'
              }
            }}
          >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(98,54,255,0.2)' : 'primary.lighter', color: 'primary.main', width: 40, height: 40 }}>
                  <IconCalculator size={22} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  Audit Score Calculation Guide
                </Typography>
              </Stack>
              <IconButton onClick={() => setScoreInfoOpen(false)} size="small">
                <IconX size={20} />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ py: 2.5 }}>
              <Stack spacing={2.5}>
                {/* Score Formula Card */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: '14px',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(33,150,243,0.15) 0%, rgba(98,54,255,0.15) 100%)'
                      : 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(33,150,243,0.2)'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '1px', mb: 1 }}>
                    📐 Score Calculation Formula
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', textAlign: 'center', my: 1, fontSize: '1.25rem' }}>
                    Audit Score (%) = ( Compliance Count / Total Valid Points ) × 100
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', fontStyle: 'italic' }}>
                    * Points marked as "NO ENTRY" or skipped are excluded from Total Valid Points.
                  </Typography>
                </Box>

                {/* Status Weightages */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
                    📊 Status Point Weightage Breakdown
                  </Typography>
                  <Stack spacing={1}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: 'success.light' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip label="COMPLIANCE" color="success" size="small" sx={{ fontWeight: 800 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Full Requirement Satisfied</Typography>
                      </Stack>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>+1.0 Point</Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: 'warning.light' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip label="OFI" color="warning" size="small" sx={{ fontWeight: 800 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Opportunity for Improvement</Typography>
                      </Stack>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'warning.main' }}>0.0 Points</Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: 'error.light' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip label="NCR" color="error" size="small" sx={{ fontWeight: 800 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Non-Conformance Finding</Typography>
                      </Stack>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.main' }}>0.0 Points</Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: 'divider' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip label="NO ENTRY" size="small" sx={{ fontWeight: 800 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Skipped / Not Applicable</Typography>
                      </Stack>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.disabled' }}>Excluded (N/A)</Typography>
                    </Paper>
                  </Stack>
                </Box>

                {/* Sample Calculation Example */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                    🧮 Sample Arrived Score Example
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa' }}>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">8 Compliance Criteria:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>8.0 Points Earned</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">1 OFI Finding:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>0.0 Points</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">1 NC Finding:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>0.0 Points</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">2 NO ENTRY (Skipped):</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.disabled' }}>Excluded from Total</Typography>
                      </Box>
                      <Divider sx={{ my: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Sample Calculated Score:</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                          (8 / 10) × 100 = 80.0%
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>

                {/* Current Live Breakdown */}
                {validDetailsCount > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(98,54,255,0.15)' : '#f3e5f5',
                      border: '1px solid',
                      borderColor: 'primary.light'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase' }}>
                      ⚡ Your Live Current Audit Calculation
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.5 }}>
                      ({formData.complianceCount} Compliance / {validDetailsCount} Valid Points) × 100 = {((formData.complianceCount / validDetailsCount) * 100).toFixed(1).replace(/\.0$/, '')}%
                    </Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button variant="contained" color="primary" onClick={() => setScoreInfoOpen(false)} sx={{ borderRadius: '8px', px: 3, fontWeight: 700 }}>
                Got it!
              </Button>
            </DialogActions>
          </Dialog>
        </Box>

        {/* Section 3: Findings Checklist */}
        <BOSFormSection
          icon={<IconListCheck size={20} color={theme.palette.success.main} />}
          title="Audit Findings Checklist"
          action={
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, mode) => mode && setViewMode(mode)}
                size="small"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.100',
                  borderRadius: '10px',
                  p: 0.5,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: '8px !important',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      bgcolor: theme.palette.mode === 'dark' ? 'primary.main' : '#ffffff',
                      color: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  }
                }}
              >
                <ToggleButton value="card">
                  <IconLayoutGrid size={16} style={{ marginRight: 6 }} /> Cards
                </ToggleButton>
                <ToggleButton value="table">
                  <IconTable size={16} style={{ marginRight: 6 }} /> Table
                </ToggleButton>
              </ToggleButtonGroup>

              {perms.write && isVariableCriteria && (
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  startIcon={<IconPlus size={16} />}
                  onClick={handleAddCustomFinding}
                  sx={{ borderRadius: '8px', fontWeight: 700 }}
                >
                  Add Finding Row
                </Button>
              )}
            </Stack>
          }
        >
          {viewMode === 'card' ? (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {details.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    px: 2,
                    borderRadius: '12px',
                    border: '2px dashed',
                    borderColor: 'divider',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50'
                  }}
                >
                  <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    No audit criteria available for this schedule.
                  </Typography>
                </Box>
              ) : (
                details.map((row, idx) => {
                  const isCommentMissing = showTableErrors && (!row.comments || row.comments.trim() === '');
                  const isStatusMissing = showTableErrors && (!row.observationStatus || row.observationStatus.trim() === '');
                  const isAttachmentMissing = showTableErrors && row.attachmentReq === 'YES' && !row.attachmentPath;
                  const hasError = isCommentMissing || isStatusMissing || isAttachmentMissing;

                  const statusColor = row.observationStatus === 'COMPLIANCE'
                    ? theme.palette.success.main
                    : row.observationStatus === 'NCR'
                      ? theme.palette.error.main
                      : row.observationStatus === 'OFI'
                        ? theme.palette.warning.main
                        : theme.palette.primary.main;

                  return (
                    <Card
                      key={row.id || `card-${idx}`}
                      sx={{
                        p: 1.75,
                        borderRadius: '12px',
                        borderLeft: `6px solid ${hasError ? theme.palette.error.main : statusColor}`,
                        borderTop: '1px solid',
                        borderRight: '1px solid',
                        borderBottom: '1px solid',
                        borderColor: hasError
                          ? theme.palette.error.main
                          : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(98,54,255,0.12)'),
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)`
                          : `linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)`,
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 16px rgba(0,0,0,0.35)'
                          : '0 4px 16px rgba(98, 54, 255, 0.05)',
                        transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 24px rgba(0,0,0,0.5)'
                            : '0 8px 24px rgba(98, 54, 255, 0.12)'
                        }
                      }}
                    >
                      <Stack spacing={1.25}>
                        {/* Header Bar */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={`#${idx + 1}`}
                                size="small"
                                sx={{
                                  fontWeight: 900,
                                  borderRadius: '6px',
                                  height: 24,
                                  fontSize: '0.75rem',
                                  bgcolor: theme.palette.primary.main,
                                  color: '#ffffff'
                                }}
                              />
                              {row.seqNo && (
                                <Chip
                                  label={`Seq ${row.seqNo}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 700, borderRadius: '6px', height: 24, fontSize: '0.72rem' }}
                                />
                              )}
                              {row.isManual ? (
                                <TextField
                                  size="small"
                                  value={row.clause || ''}
                                  onChange={(e) => updateDetail(idx, 'clause', e.target.value)}
                                  placeholder="Clause..."
                                  disabled={!perms.write}
                                  sx={{ width: '130px', '& .MuiInputBase-root': { height: 26, fontSize: '0.8rem' } }}
                                />
                              ) : (
                                <Chip
                                  label={`Clause: ${row.clause || '-'}`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ fontWeight: 700, borderRadius: '6px', height: 24, fontSize: '0.75rem' }}
                                />
                              )}
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={row.attachmentReq === 'YES' ? 'Evidence: REQ' : 'Evidence: OPT'}
                                color={row.attachmentReq === 'YES' ? 'warning' : 'default'}
                                size="small"
                                sx={{ fontWeight: 800, borderRadius: '6px', height: 22, fontSize: '0.7rem' }}
                              />
                              {row.approvalStatus && (
                                <BOSStatusChip
                                  status={
                                    row.approvalStatus === 'CLOSED' || row.approvalStatus === 'APPROVED'
                                      ? 'ACTIVE'
                                      : (row.approvalStatus === 'WAITING_APPROVAL' || row.approvalStatus === 'PENDING' || row.approvalStatus === 'REWORK' ? 'PENDING' : 'INACTIVE')
                                  }
                                  showIcon={true}
                                  width={110}
                                />
                              )}
                              {row.isManual && perms.write && (
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => setDetails((prev) => prev.filter((_, i) => i !== idx))}
                                  sx={{ p: 0.5 }}
                                >
                                  <IconTrash size={16} />
                                </IconButton>
                              )}
                            </Stack>
                          </Box>

                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: 'text.primary',
                              fontSize: '0.875rem',
                              lineHeight: 1.45,
                              mt: 0.75,
                              mb: 0.5
                            }}
                          >
                            {row.criteriaDetails || 'No criteria details.'}
                          </Typography>
                        </Box>

                        {row.isManual && (
                          <TextField
                            multiline
                            minRows={1}
                            maxRows={2}
                            fullWidth
                            size="small"
                            value={row.criteriaDetails || ''}
                            onChange={(e) => updateDetail(idx, 'criteriaDetails', e.target.value)}
                            placeholder="Enter Criteria details..."
                            disabled={!perms.write}
                          />
                        )}

                        {/* Inline Fields Row Grid */}
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '200px 1fr 240px' },
                            gap: 1.5,
                            alignItems: 'center',
                            pt: 0.5
                          }}
                        >
                          {/* 1. Observation Status */}
                          <Box>
                            <BOSTextField
                              select
                              size="small"
                              label="Status *"
                              value={row.observationStatus || ''}
                              onChange={(e) => updateDetail(idx, 'observationStatus', e.target.value)}
                              disabled={!perms.write}
                              fullWidth
                              error={isStatusMissing}
                              helperText={isStatusMissing ? 'Required' : ''}
                            >
                              {OBS_STATUSES.map((s) => (
                                <MenuItem key={s} value={s}>
                                  {s}
                                </MenuItem>
                              ))}
                            </BOSTextField>
                          </Box>

                          {/* 2. Comments / Audit Findings */}
                          <Box>
                            <BOSTextField
                              size="small"
                              label="Comments / Findings *"
                              value={row.comments || ''}
                              onChange={(e) => updateDetail(idx, 'comments', e.target.value)}
                              placeholder="ENTER AUDIT FINDINGS..."
                              disabled={!perms.write}
                              error={isCommentMissing}
                              helperText={isCommentMissing ? 'Comments mandatory' : ''}
                              fullWidth
                            />
                          </Box>

                          {/* 3. Evidence File Attachment Upload Dropzone */}
                          <Box
                            sx={{
                              border: isAttachmentMissing ? '1.5px solid #f44336' : '1px dashed',
                              borderColor: isAttachmentMissing ? 'error.main' : 'divider',
                              borderRadius: '8px',
                              px: 1,
                              py: 0.5,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : '#fafafa'
                            }}
                          >
                            <BOSFileUpload
                              files={parseAttachmentFiles(row.attachmentPath, row.id || idx)}
                              onChange={(files) => {
                                const joinedPaths = files.map(f => f.serverFileName).filter(Boolean).join(',');
                                updateDetail(idx, 'attachmentPath', joinedPaths);
                              }}
                              module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION"
                              multiple={true}
                              compact={true}
                              hideDropzoneOnUpload={false}
                              hideFileList={true}
                              isEditing={perms.write}
                              disabled={!perms.write}
                              label="Upload Evidence"
                              helperText={isAttachmentMissing ? 'Evidence required' : 'Click to upload'}
                            />
                          </Box>
                        </Box>

                        {/* Attached Evidence Files Row Below Status & Comments */}
                        {parseAttachmentFiles(row.attachmentPath, row.id || idx).length > 0 && (
                          <Box
                            sx={{
                              mt: 1,
                              pt: 1,
                              borderTop: '1px dashed',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(98,54,255,0.12)',
                              width: '100%'
                            }}
                          >

                            <BOSFileUpload
                              files={parseAttachmentFiles(row.attachmentPath, row.id || idx)}
                              onChange={(files) => {
                                const joinedPaths = files.map(f => f.serverFileName).filter(Boolean).join(',');
                                updateDetail(idx, 'attachmentPath', joinedPaths);
                              }}
                              module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION"
                              multiple={true}
                              compact={true}
                              hideDropzone={true}
                              isEditing={perms.write}
                              disabled={!perms.write}
                            />
                          </Box>
                        )}
                      </Stack>
                    </Card>
                  );
                })
              )}
            </Stack>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: '14px',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(98,54,255,0.12)',
                boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(98,54,255,0.06)',
                overflow: 'hidden',
                background: theme.palette.mode === 'dark' ? '#111936' : '#ffffff'
              }}
            >
              <Table sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)'
                    }}
                  >
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, py: 1.5, fontSize: '0.8rem', width: '60px' }}>S.NO</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, py: 1.5, fontSize: '0.8rem', width: '70px' }}>SEQ</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, py: 1.5, fontSize: '0.8rem', width: '110px' }}>CLAUSE</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, py: 1.5, fontSize: '0.8rem', minWidth: '220px' }}>CRITERIA DETAILS</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, py: 1.5, fontSize: '0.8rem', width: '70px' }}>REQ.</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, py: 1.5, fontSize: '0.8rem', minWidth: '150px' }}>STATUS *</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, py: 1.5, fontSize: '0.8rem', width: '110px' }}>APPROVAL</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, py: 1.5, fontSize: '0.8rem', minWidth: '220px' }}>COMMENTS / FINDINGS *</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, py: 1.5, fontSize: '0.8rem', width: '200px' }}>EVIDENCE</TableCell>
                    {perms.write && isVariableCriteria && (
                      <TableCell sx={{ color: '#ffffff', fontWeight: 800, py: 1.5, fontSize: '0.8rem', width: '80px', textAlign: 'center' }}>ACTIONS</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={perms.write && isVariableCriteria ? 10 : 9} align="center" sx={{ py: 6 }}>
                        <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          No audit criteria available for this schedule.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    details.map((row, idx) => {
                      const isCommentMissing = showTableErrors && (!row.comments || row.comments.trim() === '');
                      const isStatusMissing = showTableErrors && (!row.observationStatus || row.observationStatus.trim() === '');
                      const isAttachmentMissing = showTableErrors && row.attachmentReq === 'YES' && !row.attachmentPath;
                      const hasError = isCommentMissing || isStatusMissing || isAttachmentMissing;
                      const attachmentFiles = parseAttachmentFiles(row.attachmentPath, row.id || idx);
                      const hasAttachments = attachmentFiles.length > 0;
                      const colSpanCount = perms.write && isVariableCriteria ? 10 : 9;

                      return (
                        <React.Fragment key={row.id || `row-${idx}`}>
                          {/* Main Fields Row */}
                          <TableRow
                            sx={{
                              bgcolor: hasError
                                ? (theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : '#fff5f5')
                                : (idx % 2 === 0
                                  ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff')
                                  : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc')),
                              transition: 'background-color 0.2s',
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f0f4fe'
                              },
                              borderLeft: `4px solid ${hasError
                                ? theme.palette.error.main
                                : row.observationStatus === 'COMPLIANCE'
                                  ? theme.palette.success.main
                                  : row.observationStatus === 'NCR'
                                    ? theme.palette.error.main
                                    : row.observationStatus === 'OFI'
                                      ? theme.palette.warning.main
                                      : 'transparent'
                                }`
                            }}
                          >
                            {/* 1. S.No */}
                            <TableCell sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.85rem' }}>
                              {idx + 1}
                            </TableCell>

                            {/* 2. Seq No */}
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                              {row.seqNo || '-'}
                            </TableCell>

                            {/* 3. Clause */}
                            <TableCell>
                              {row.isManual ? (
                                <TextField
                                  size="small"
                                  value={row.clause || ''}
                                  onChange={(e) => updateDetail(idx, 'clause', e.target.value)}
                                  placeholder="Clause..."
                                  disabled={!perms.write}
                                  sx={{ width: '100px', '& .MuiInputBase-root': { height: 32, fontSize: '0.8rem' } }}
                                />
                              ) : (
                                <Chip
                                  label={row.clause || '-'}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
                                />
                              )}
                            </TableCell>

                            {/* 4. Criteria Details */}
                            <TableCell sx={{ minWidth: '220px' }}>
                              {row.isManual ? (
                                <TextField
                                  multiline
                                  minRows={1}
                                  maxRows={2}
                                  fullWidth
                                  size="small"
                                  value={row.criteriaDetails || ''}
                                  onChange={(e) => updateDetail(idx, 'criteriaDetails', e.target.value)}
                                  placeholder="Enter Criteria details..."
                                  disabled={!perms.write}
                                  sx={{ '& .MuiInputBase-root': { fontSize: '0.82rem' } }}
                                />
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.82rem', lineHeight: 1.4 }}>
                                  {row.criteriaDetails || '-'}
                                </Typography>
                              )}
                            </TableCell>

                            {/* 5. Attachment Requirement */}
                            <TableCell>
                              {row.isManual && perms.write ? (
                                <BOSTextField
                                  select
                                  size="small"
                                  value={row.attachmentReq || 'NO'}
                                  onChange={(e) => updateDetail(idx, 'attachmentReq', e.target.value)}
                                  fullWidth
                                >
                                  <MenuItem value="YES">YES</MenuItem>
                                  <MenuItem value="NO">NO</MenuItem>
                                </BOSTextField>
                              ) : (
                                <Chip
                                  label={row.attachmentReq === 'YES' ? 'REQ' : 'OPT'}
                                  color={row.attachmentReq === 'YES' ? 'warning' : 'default'}
                                  size="small"
                                  sx={{ fontWeight: 800, borderRadius: '6px', height: 22, fontSize: '0.7rem' }}
                                />
                              )}
                            </TableCell>

                            {/* 6. Status */}
                            <TableCell sx={{ minWidth: '150px' }}>
                              <BOSTextField
                                select
                                size="small"
                                value={row.observationStatus || ''}
                                onChange={(e) => updateDetail(idx, 'observationStatus', e.target.value)}
                                disabled={!perms.write}
                                fullWidth
                                error={isStatusMissing}
                                helperText={isStatusMissing ? 'Required' : ''}
                              >
                                {OBS_STATUSES.map((s) => (
                                  <MenuItem key={s} value={s}>
                                    {s}
                                  </MenuItem>
                                ))}
                              </BOSTextField>
                            </TableCell>

                            {/* 7. Approval */}
                            <TableCell>
                              {row.approvalStatus ? (
                                <BOSStatusChip
                                  status={
                                    row.approvalStatus === 'CLOSED' || row.approvalStatus === 'APPROVED'
                                      ? 'ACTIVE'
                                      : (row.approvalStatus === 'WAITING_APPROVAL' || row.approvalStatus === 'PENDING' || row.approvalStatus === 'REWORK' ? 'PENDING' : 'INACTIVE')
                                  }
                                  showIcon={true}
                                  width={100}
                                />
                              ) : (
                                '-'
                              )}
                            </TableCell>

                            {/* 8. Comments / Findings */}
                            <TableCell sx={{ minWidth: '220px' }}>
                              <LocalCommentsInput
                                value={row.comments || ''}
                                onChange={(val) => updateDetail(idx, 'comments', val)}
                                placeholder="ENTER FINDINGS..."
                                disabled={!perms.write}
                                error={isCommentMissing}
                                helperText={isCommentMissing ? 'Comments mandatory' : ''}
                              />
                            </TableCell>

                            {/* 9. Evidence Dropzone Button */}
                            <TableCell sx={{ width: '200px' }}>
                              <Box
                                sx={{
                                  border: isAttachmentMissing ? '1.5px solid #f44336' : '1px dashed',
                                  borderColor: isAttachmentMissing ? 'error.main' : 'divider',
                                  borderRadius: '8px',
                                  p: 0.5,
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : '#fafafa'
                                }}
                              >
                                <BOSFileUpload
                                  files={attachmentFiles}
                                  onChange={(files) => {
                                    const joinedPaths = files.map(f => f.serverFileName).filter(Boolean).join(',');
                                    updateDetail(idx, 'attachmentPath', joinedPaths);
                                  }}
                                  module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION"
                                  multiple={true}
                                  compact={true}
                                  hideDropzoneOnUpload={false}
                                  hideFileList={true}
                                  isEditing={perms.write}
                                  disabled={!perms.write}
                                  label="Upload Evidence"
                                  helperText={isAttachmentMissing ? 'Evidence required' : 'Click to upload'}
                                />
                              </Box>
                            </TableCell>

                            {/* 10. Actions (Delete) */}
                            {perms.write && isVariableCriteria && (
                              <TableCell align="center">
                                {row.isManual ? (
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => setDetails((prev) => prev.filter((_, i) => i !== idx))}
                                  >
                                    <IconTrash size={18} />
                                  </IconButton>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            )}
                          </TableRow>

                          {/* Sub-row for Attached Files (Full Width across S.No to Comments/Evidence) */}
                          {hasAttachments && (
                            <TableRow
                              sx={{
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.75)',
                                borderLeft: `4px solid ${theme.palette.primary.main}`
                              }}
                            >
                              <TableCell colSpan={colSpanCount} sx={{ py: 1.25, px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%' }}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip
                                      label={`📎 Attached Evidence Files (${attachmentFiles.length})`}
                                      size="small"
                                      color="primary"
                                      sx={{ fontWeight: 800, borderRadius: '6px', fontSize: '0.72rem', height: 22 }}
                                    />
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                      Files attached for item #{idx + 1}
                                    </Typography>
                                  </Stack>
                                  <BOSFileUpload
                                    files={attachmentFiles}
                                    onChange={(files) => {
                                      const joinedPaths = files.map(f => f.serverFileName).filter(Boolean).join(',');
                                      updateDetail(idx, 'attachmentPath', joinedPaths);
                                    }}
                                    module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_OBSERVATION"
                                    multiple={true}
                                    compact={true}
                                    hideDropzone={true}
                                    isEditing={perms.write}
                                    disabled={!perms.write}
                                  />
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </BOSFormSection>
      </Stack>
    </MainCard>

    {/* ── SEND ATTENDANCE LINK EMAIL DIALOG (ATS CALL LETTER FORMAT) ── */}
    <BOSFormDialog
      open={emailDialogOpen}
      onClose={() => !emailSending && setEmailDialogOpen(false)}
      title="Send Attendance Link Email"
      maxWidth="md"
      isViewOnly={false}
      saveLabel={emailSending ? "Sending..." : "Send Email"}
      saveIcon={<IconSend size={20} />}
      saveButtonDisabled={emailSending}
      onSave={handleSendEmail}
      showCloseInFooter
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', pt: 1 }}>
        {/* FROM FIELD */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              From:
            </Typography>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                Use Company Email
              </span>
              <input
                type="checkbox"
                checked={emailData.useCompanyMail}
                onChange={(e) => setEmailData(prev => ({ ...prev, useCompanyMail: e.target.checked }))}
                style={{ display: 'none' }}
              />
              <span
                style={{
                  width: '28px',
                  height: '16px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  padding: '0 2px',
                  background: emailData.useCompanyMail ? '#22c55e' : '#cbd5e1'
                }}
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s',
                    transform: emailData.useCompanyMail ? 'translateX(12px)' : 'translateX(2px)'
                  }}
                />
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '20px' }}>
                {emailData.useCompanyMail ? 'Yes' : 'No'}
              </span>
            </label>
          </Box>
          <BOSTextField
            fullWidth
            value={emailData.useCompanyMail ? (companyProfile?.companyEmail || 'Company Email (Configured SMTP)') : (user?.email || 'Official Email')}
            disabled
          />
        </Box>

        {/* TO FIELD */}
        <BOSTextField
          required
          fullWidth
          label="To (Recipient External Email):"
          name="to"
          placeholder="e.g. auditor@client.com"
          value={emailData.to}
          onChange={(e) => {
            setEmailData(prev => ({ ...prev, to: e.target.value }));
            if (emailErrors.to) setEmailErrors(prev => ({ ...prev, to: null }));
          }}
          error={!!emailErrors.to}
          helperText={emailErrors.to}
          sx={errorStyle(!!emailErrors.to)}
        />

        {/* CC FIELD (ATS CALL LETTER FORMAT WITH DIRECT ADD OPTION) */}
        <BOSAutocomplete
          multiple
          freeSolo
          label="CC:"
          name="cc"
          options={activeEmployeeMailOptions}
          value={emailCcArray}
          onChange={(val) => {
            const selectedMails = (Array.isArray(val) ? val : [val])
              .map(item => {
                if (typeof item === 'object' && item !== null) {
                  return item.value || item.mail || item.label || '';
                }
                return String(item || '').trim();
              })
              .filter(Boolean)
              .map(m => m.toLowerCase());
            const commaString = selectedMails.join(', ');
            setEmailData(prev => ({ ...prev, cc: commaString }));
            if (emailErrors.cc) {
              setEmailErrors(prev => ({ ...prev, cc: '' }));
            }
          }}
          error={!!emailErrors.cc}
          helperText={emailErrors.cc}
          sx={errorStyle(!!emailErrors.cc)}
          placeholder={emailCcArray.length > 0 ? '' : "Select Employee Office Mail or type manually..."}
          filterOptions={(options, params) => {
            const { inputValue } = params;
            const search = (inputValue || '').trim().toLowerCase();

            const filtered = options.filter(opt => {
              if (!search) return true;
              const label = (opt.label || '').toLowerCase();
              const mail = (opt.mail || opt.value || '').toLowerCase();
              const name = (opt.name || '').toLowerCase();
              const code = (opt.code || '').toLowerCase();
              return label.includes(search) || mail.includes(search) || name.includes(search) || code.includes(search);
            });

            if (search) {
              const isExactMatch = options.some(opt => {
                const mail = String(opt.value || opt.mail || '').trim().toLowerCase();
                return mail === search;
              });

              if (!isExactMatch) {
                filtered.push({
                  isCustomAddress: true,
                  isAddOption: true,
                  value: search,
                  mail: search,
                  label: search
                });
              }
            }

            return filtered;
          }}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            const isCustom = typeof option === 'object' && (option.isCustomAddress || option.isAddOption);
            const mail = typeof option === 'object' ? (option.value || option.mail || option.label) : option;
            const label = typeof option === 'object' ? option.label : option;
            const photoPath = typeof option === 'object' ? (option.photoPath || option.employeePhotoUpload || option.photo) : null;

            if (isCustom) {
              return (
                <li
                  key={key || mail}
                  {...otherProps}
                  style={{
                    padding: '8px 12px',
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9',
                    cursor: 'pointer',
                    listStyle: 'none'
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" width="100%">
                    <Avatar
                      sx={{
                        width: 30,
                        height: 30,
                        bgcolor: '#10b981',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      <IconPlus size={16} />
                    </Avatar>
                    <Stack spacing={0.3} width="100%" sx={{ overflow: 'hidden' }}>
                      <Typography noWrap variant="body2" sx={{ fontWeight: 700, color: '#10b981', fontSize: '0.82rem', lineHeight: 1.25 }}>
                        Add &quot;{mail}&quot;
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ overflow: 'hidden' }}>
                        <IconMail size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
                        <Typography noWrap variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
                          Click to add custom email address
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </li>
              );
            }

            let namePart = label;
            let emailPart = mail;
            if (typeof label === 'string' && label.includes(' - ')) {
              const parts = label.split(' - ');
              namePart = parts[0];
              emailPart = parts.slice(1).join(' - ');
            }

            const firstLetter = namePart ? namePart.trim().charAt(0).toUpperCase() : 'E';

            return (
              <li
                key={key || mail}
                {...otherProps}
                style={{
                  padding: '8px 12px',
                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9',
                  cursor: 'pointer',
                  listStyle: 'none'
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" width="100%">
                  <Avatar
                    src={photoPath ? getFileViewUrl(photoPath) : undefined}
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: '#2196f3',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {firstLetter}
                  </Avatar>
                  <Stack spacing={0.3} width="100%" sx={{ overflow: 'hidden' }}>
                    <Typography noWrap variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.82rem', lineHeight: 1.25 }}>
                      {namePart}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ overflow: 'hidden' }}>
                      <IconMail size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
                      <Typography noWrap variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
                        {emailPart}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </li>
            );
          }}
        />

        {/* SUBJECT FIELD */}
        <BOSTextField
          required
          fullWidth
          label="Subject:"
          name="subject"
          value={emailData.subject}
          onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
        />

        {/* EMAIL PREVIEW / EDIT TABS */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Email Message Content:
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={emailPreviewTab}
              exclusive
              onChange={(e, nextView) => {
                if (nextView) setEmailPreviewTab(nextView);
              }}
              sx={{ height: 30 }}
            >
              <ToggleButton value="preview" sx={{ textTransform: 'none', px: 1.5, py: 0.25, fontSize: '0.75rem', fontWeight: 700, gap: 0.5 }}>
                <IconEye size={15} /> Live Preview
              </ToggleButton>
              <ToggleButton value="html" sx={{ textTransform: 'none', px: 1.5, py: 0.25, fontSize: '0.75rem', fontWeight: 700, gap: 0.5 }}>
                <IconCode size={15} /> Edit HTML
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {emailPreviewTab === 'preview' ? (
            <Box
              sx={{
                maxHeight: '440px',
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                bgcolor: '#f8fafc',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: emailData.body }} />
            </Box>
          ) : (
            <TextField
              multiline
              minRows={8}
              maxRows={14}
              fullWidth
              value={emailData.body}
              onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Enter HTML email content..."
              sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          )}
        </Box>
      </Box>
    </BOSFormDialog>
    </>
  );
}
