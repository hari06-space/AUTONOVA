import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Stack,
  MenuItem,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project imports
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import useAuth from 'hooks/useAuth';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSTextField,
  BOSDataTable,
  BOSAutocomplete,
  BOSTableToolbar,
  BOSFormDialog,
  BOSFormSection,
  BOSRowActions,
  errorStyle,
  getPhotoUrl,
  btnSave,
  btnWarning,
  btnDelete,
  btnEdit,
  btnCancel,
  BOSStatusChip,
  BOSEmployeeAutocomplete,
  BOSToggleSwitch
} from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

// assets
import { IconNotebook, IconEye, IconTrash, IconMail, IconX, IconAlertTriangle, IconDownload, IconFileText } from '@tabler/icons-react';
import html2pdf from 'html2pdf.js';

// Helper to safely extract department name (handles string or Department object)
const getDepartmentName = (dept) => {
  if (!dept) return 'Operations / General';
  if (typeof dept === 'string') return dept;
  if (typeof dept === 'object') {
    return dept.departmentName || dept.name || dept.deptName || 'Operations / General';
  }
  return 'Operations / General';
};

// Printable PDF Document Template Component (Matching user provided screenshot design & Rule #33)
const PdfMemoTemplate = ({ memo, companyProfile, companyLogoUrl, companyLocation }) => {
  if (!memo) return null;

  const createdDateStr = memo.createdDate
    ? new Date(memo.createdDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const isPositive = memo.memoType === 'Positive Memo';
  const statusText = (memo.status || 'DRAFT').toUpperCase();

  const memoNumberFormatted = memo.memoNumber
    ? memo.memoNumber
    : (memo.id ? `MEMO-${new Date().getFullYear()}-${String(memo.id).padStart(4, '0')}` : '-');

  const empCode = memo.employee?.oldEmpCode || memo.employee?.empCode || memo.employeeCode || '-';
  const empName = memo.employee?.employeeName || memo.employeeName || '-';
  const deptName = getDepartmentName(memo.employee?.department);
  const desgName = typeof memo.employee?.designation === 'object'
    ? memo.employee?.designation?.designationName
    : (memo.employee?.designation || memo.employee?.organization?.designation?.designationName || '-');

  // Use backend-resolved names from HR_EMPLOYEE_MANAGER_MAPPING (populated server-side as @Transient fields)
  const reportingMgrName = memo.reportingManagerName
    || memo.employee?.organization?.verticalHead
    || '-';

  const dojRaw = memo.employee?.doj || memo.employee?.dateOfJoining || memo.employee?.organization?.doj;
  const dojStr = dojRaw
    ? new Date(dojRaw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

  // HR Representative: backend-resolved from HR_EMPLOYEE_MANAGER_MAPPING.HR_ID
  const hrRepName = memo.hrRepresentativeName
    || memo.employee?.organization?.hrManager
    || '-';

  const reportingMgrSigPath = memo.reportingManagerSignatureUpload || memo.reportingManagerSignature;
  const hrRepSigPath = memo.hrRepresentativeSignatureUpload || memo.hrRepresentativeSignature;

  const reportingMgrSigUrl = (reportingMgrSigPath && reportingMgrSigPath !== '-' && reportingMgrSigPath !== 'null' && reportingMgrSigPath !== 'undefined')
    ? getPhotoUrl(reportingMgrSigPath)
    : null;

  const hrRepSigUrl = (hrRepSigPath && hrRepSigPath !== '-' && hrRepSigPath !== 'null' && hrRepSigPath !== 'undefined')
    ? getPhotoUrl(hrRepSigPath)
    : null;

  const cleanBody = memo.body ? memo.body.replace(/<[^>]+>/g, '') : '-';
  const locationStr = companyLocation || memo.location || memo.employee?.workLocation || memo.employee?.location || '-';

  // Company Profile Details (Rule #33)
  const compName = companyProfile?.companyName || localStorage.getItem('companyName') || 'AUTONOVA';
  const compAddress = [companyProfile?.address, companyProfile?.city, companyProfile?.state, companyProfile?.pincode].filter(Boolean).join(', ') || locationStr || 'Chennai, Tamil Nadu';
  const compGstin = companyProfile?.gstIn || companyProfile?.gstin || '-';
  const compMob = companyProfile?.mobileNo || companyProfile?.phoneNo || companyProfile?.supportPhone || '-';
  const compEmail = companyProfile?.emailId || companyProfile?.supportEmail || '-';
  const compWeb = companyProfile?.website || 'www.autonova.com';

  return (
    <Box
      id="printable-memo-pdf-document"
      sx={{
        bgcolor: '#ffffff',
        color: '#0f172a',
        p: { xs: 2.5, sm: 3.5 },
        pb: { xs: 3, sm: 4 },
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        border: '1.5px solid #cbd5e1',
        borderRadius: '8px',
        position: 'relative',
        maxWidth: 820,
        width: '100%',
        mx: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        boxSizing: 'border-box'
      }}
    >
      {/* Watermark */}
      <Box
        sx={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-30deg)',
          fontSize: { xs: '3rem', sm: '4.5rem' },
          fontWeight: 900,
          color: 'rgba(203, 213, 225, 0.3)',
          textTransform: 'uppercase',
          letterSpacing: '8px',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1
        }}
      >
        {statusText}
      </Box>

      {/* Top Company Header Block (Rule #33) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #0f172a',
          pb: 1.5,
          mb: 0.5,
          position: 'relative',
          zIndex: 2
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt="Company Logo"
              style={{ maxHeight: 60, maxWidth: 160, objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          ) : null}
          <Box sx={{ fontSize: '0.75rem', color: '#1e293b', lineHeight: 1.45 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', fontSize: '1.05rem', mb: 0.2 }}>
              {compName}
            </Typography>
            <Box>{compAddress}</Box>
            <Box sx={{ mt: 0.3 }}><strong>GSTIN:</strong> {compGstin}</Box>
            <Box sx={{ mt: 0.2, fontWeight: 500, color: '#475569' }}>
              Mob: {compMob} &nbsp;|&nbsp; Email: {compEmail} &nbsp;|&nbsp; Web: {compWeb}
            </Box>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'right', fontSize: '0.72rem', color: '#1e293b', pl: 2 }}>
          <Box><strong>DOC. No :</strong> &nbsp;<span style={{ color: '#1e3a8a', fontWeight: 800 }}>{memoNumberFormatted}</span></Box>
          <Box><strong>Date :</strong> &nbsp;{createdDateStr}</Box>
          <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="flex-end" sx={{ mt: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>Type :</Typography>
            {isPositive ? (
              <Chip label="POSITIVE" size="small" sx={{ fontWeight: 900, fontSize: '0.65rem', bgcolor: '#16a34a', color: '#ffffff', height: 20, px: 0.5 }} />
            ) : (
              <Chip label="NEGATIVE" size="small" sx={{ fontWeight: 900, fontSize: '0.65rem', bgcolor: '#dc2626', color: '#ffffff', height: 20, px: 0.5 }} />
            )}
          </Stack>
        </Box>
      </Box>

      {/* Main Document Name (Rule #33: centered, uppercase, bold, underlined, snug under border) */}
      <Box sx={{ textAlign: 'center', mt: 0.8, mb: 2, position: 'relative', zIndex: 2 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            color: '#0f172a',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
            fontSize: '1.2rem'
          }}
        >
          EMPLOYEE MEMO
        </Typography>
      </Box>

      {/* SECTION 1: EMPLOYEE INFORMATION */}
      <Box sx={{ mb: 2.5, position: 'relative', zIndex: 2 }}>
        <Box sx={{ bgcolor: '#0f172a', color: '#ffffff', px: 1.5, py: 0.6, fontSize: '0.75rem', fontWeight: 800, borderRadius: '4px', display: 'inline-block', letterSpacing: 0.5, mb: 1.2 }}>
          1 &nbsp;&nbsp; EMPLOYEE INFORMATION
        </Box>
        <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '6px', p: 1.5, bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, fontSize: '0.75rem' }}>
            <Box><strong>Employee ID &nbsp;&nbsp;:</strong> &nbsp;{empCode}</Box>
            <Box><strong>Employee Name &nbsp;:</strong> &nbsp;{empName}</Box>
            <Box><strong>Department &nbsp;&nbsp;:</strong> &nbsp;{deptName}</Box>
            <Box><strong>Designation &nbsp;&nbsp;:</strong> &nbsp;{desgName}</Box>
            <Box><strong>Reporting Mgr &nbsp;:</strong> &nbsp;{reportingMgrName}</Box>
            <Box><strong>Date of Joining :</strong> &nbsp;{dojStr}</Box>
          </Box>
        </Box>
      </Box>

      {/* SECTION 2: MEMO DETAILS */}
      <Box sx={{ mb: 2.5, position: 'relative', zIndex: 2 }}>
        <Box sx={{ bgcolor: '#0f172a', color: '#ffffff', px: 1.5, py: 0.6, fontSize: '0.75rem', fontWeight: 800, borderRadius: '4px', display: 'inline-block', letterSpacing: 0.5, mb: 1.2 }}>
          2 &nbsp;&nbsp; MEMO DETAILS
        </Box>
        <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
            <Box sx={{ p: 1.2, fontWeight: 700, bgcolor: '#f8fafc', color: '#1e293b' }}>Subject / Reason</Box>
            <Box sx={{ p: 1.2, fontWeight: 700, color: '#0f172a' }}>{memo.subject || '-'}</Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
            <Box sx={{ p: 1.2, fontWeight: 700, bgcolor: '#f8fafc', color: '#1e293b' }}>Detailed Description</Box>
            <Box sx={{ p: 1.2, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{cleanBody}</Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
            <Box sx={{ p: 1.2, fontWeight: 700, bgcolor: '#f8fafc', color: '#1e293b' }}>Achievement / Incident Date</Box>
            <Box sx={{ p: 1.2, color: '#334155' }}>{createdDateStr}</Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', fontSize: '0.75rem' }}>
            <Box sx={{ p: 1.2, fontWeight: 700, bgcolor: '#f8fafc', color: '#1e293b' }}>Location / Project</Box>
            <Box sx={{ p: 1.2, color: '#334155', fontWeight: 600 }}>{locationStr}</Box>
          </Box>
        </Box>
      </Box>

      {/* SECTION 3: EMPLOYEE COMMENTS */}
      <Box sx={{ mb: 2.5, position: 'relative', zIndex: 2 }}>
        <Box sx={{ bgcolor: '#0f172a', color: '#ffffff', px: 1.5, py: 0.6, fontSize: '0.75rem', fontWeight: 800, borderRadius: '4px', display: 'inline-block', letterSpacing: 0.5, mb: 1.2 }}>
          3 &nbsp;&nbsp; EMPLOYEE COMMENTS
        </Box>
        <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '6px', p: 1.5, bgcolor: '#ffffff' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
            Employee Comments / Response :
          </Typography>
          {/* Instruction 3: Leave blank */}
          <Box sx={{ minHeight: 35 }} />
        </Box>
      </Box>

      {/* SECTION 4: ACKNOWLEDGEMENT & SIGNATURES */}
      <Box sx={{ mb: 2, position: 'relative', zIndex: 2 }}>
        <Box sx={{ bgcolor: '#0f172a', color: '#ffffff', px: 1.5, py: 0.6, fontSize: '0.75rem', fontWeight: 800, borderRadius: '4px', display: 'inline-block', letterSpacing: 0.5, mb: 1.2 }}>
          4 &nbsp;&nbsp; ACKNOWLEDGEMENT & SIGNATURES
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
          {/* Card 1: Employee (Instruction 6: dont fill signature) */}
          <Box sx={{ border: '1.5px solid #38bdf8', borderRadius: '8px', overflow: 'hidden', bgcolor: '#ffffff' }}>
            <Box sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 800, fontSize: '0.75rem', py: 0.6, px: 1.5, textAlign: 'center' }}>
              Employee
            </Box>
            <Box sx={{ p: 1.5, fontSize: '0.72rem', lineHeight: 1.6 }}>
              <Box sx={{ height: 35, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', mb: 0.5 }}>
                {/* Blank signature per instruction #6 */}
              </Box>
              <Box><strong>Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;{empName}</Box>
              <Box><strong>Signature &nbsp;:</strong> &nbsp;___________________</Box>
              <Box><strong>Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;{createdDateStr}</Box>
            </Box>
          </Box>

          {/* Card 2: Reporting Manager */}
          <Box sx={{ border: '1.5px solid #4ade80', borderRadius: '8px', overflow: 'hidden', bgcolor: '#ffffff' }}>
            <Box sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 800, fontSize: '0.75rem', py: 0.6, px: 1.5, textAlign: 'center' }}>
              Reporting Manager
            </Box>
            <Box sx={{ p: 1.5, fontSize: '0.72rem', lineHeight: 1.6 }}>
              <Box sx={{ height: 35, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                {reportingMgrSigUrl ? (
                  <img
                    src={reportingMgrSigUrl}
                    alt="Reporting Manager Signature"
                    style={{ maxHeight: 35, maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.65rem', textAlign: 'center' }}>
                    no signature in employee master
                  </Typography>
                )}
              </Box>
              <Box><strong>Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;{reportingMgrName}</Box>
              <Box><strong>Signature &nbsp;:</strong> &nbsp;___________________</Box>
              <Box><strong>Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;{createdDateStr}</Box>
            </Box>
          </Box>

          {/* Card 3: HR Representative */}
          <Box sx={{ border: '1.5px solid #c084fc', borderRadius: '8px', overflow: 'hidden', bgcolor: '#ffffff' }}>
            <Box sx={{ bgcolor: '#f3e8ff', color: '#9333ea', fontWeight: 800, fontSize: '0.75rem', py: 0.6, px: 1.5, textAlign: 'center' }}>
              HR Representative
            </Box>
            <Box sx={{ p: 1.5, fontSize: '0.72rem', lineHeight: 1.6 }}>
              <Box sx={{ height: 35, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                {hrRepSigUrl ? (
                  <img
                    src={hrRepSigUrl}
                    alt="HR Representative Signature"
                    style={{ maxHeight: 35, maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.65rem', textAlign: 'center' }}>
                    no signature in employee master
                  </Typography>
                )}
              </Box>
              <Box><strong>Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;{hrRepName}</Box>
              <Box><strong>Signature &nbsp;:</strong> &nbsp;___________________</Box>
              <Box><strong>Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;{createdDateStr}</Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer Notes */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 200px' }, gap: 1.5, mt: 1.5, mb: 1, position: 'relative', zIndex: 2 }}>
        <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '6px', p: 1, fontSize: '0.65rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc' }}>
          <span>This memo is an official communication and will be maintained in the employee's official HR record.</span>
        </Box>
        <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '6px', p: 1, fontSize: '0.65rem', color: '#0f172a', fontWeight: 800, textAlign: 'center', bgcolor: '#f8fafc' }}>
          CONFIDENTIAL<br />
          <span style={{ fontSize: '0.6rem', fontWeight: 500, color: '#64748b' }}>For Internal Use Only</span>
        </Box>
      </Box>

      {/* Bottom Bar */}
      <Typography variant="caption" sx={{ textAlign: 'center', borderTop: '2px solid #0f172a', pt: 0.8, fontSize: '0.65rem', fontWeight: 800, color: '#0f172a', display: 'block', letterSpacing: 0.5, position: 'relative', zIndex: 2 }}>
        Autonova &nbsp;|&nbsp; www.autonova.com
      </Typography>
    </Box>
  );
};

const buildFilterConfig = (employeeOptions) => [
  {
    id: 'employeeId',
    label: 'Employee',
    type: 'select',
    isStarred: true,
    defaultValue: 'All',
    options: [
      { value: 'All', label: 'All' },
      ...employeeOptions
    ]
  },
  {
    id: 'memoType',
    label: 'Memo Type',
    type: 'select',
    isStarred: true,
    defaultValue: 'All',
    options: [
      { value: 'All', label: 'All' },
      { value: 'Positive Memo', label: 'Positive Memo' },
      { value: 'Negative Memo', label: 'Negative Memo' }
    ]
  }
];

const DEFAULT_FILTERS = {
  employeeId: 'All',
  memoType: 'All'
};

const EmployeeMemoList = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const perms = usePagePermissions(PAGE_CODES.HRA_EMPLOYEE_MEMO_LIST);

  // Redux search & filters state
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const searchQuery = useSelector((state) => state.search.query);

  const [employees, setEmployees] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [memos, setMemos] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingMemos, setLoadingMemos] = useState(false);

  // Local Filter state synced from Redux
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Pagination State
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Preview Dialog State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMemo, setPreviewMemo] = useState(null);

  // PDF Preview Dialog State (Screenshot Template)
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfMemo, setPdfMemo] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(null);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const { data } = await axios.get('/api/company-profile/all', { skipGlobalAlert: true });
        const profiles = Array.isArray(data) ? data : data ? [data] : [];
        if (profiles.length > 0) {
          const activeName = localStorage.getItem('companyName') || sessionStorage.getItem('companyName');
          const activeProf = profiles.find((c) => c.companyName === activeName) || profiles[0];
          setCompanyProfile(activeProf);

          const logoName = activeProf?.logoFileName || activeProf?.logoUrl || activeProf?.companyLogo;
          if (logoName) {
            if (logoName.startsWith('http') || logoName.startsWith('data:')) {
              setCompanyLogoUrl(logoName);
            } else {
              const API_BASE = (import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
              setCompanyLogoUrl(`${API_BASE}/api/company-profile/image/${logoName}`);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch company profile:', err);
      }
    };

    fetchCompanyProfile();
  }, []);

  const handleOpenPdfPreview = (memo) => {
    setPdfMemo(memo);
    setPdfPreviewOpen(true);
  };

  // Delete Confirmation Dialog State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [memoToDelete, setMemoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Add Memo Dialog State
  const { user: authUser } = useAuth();
  const reduxUser = useSelector((state) => state.auth?.user || state.admin?.user);
  const user = authUser || reduxUser;

  const [addOpen, setAddOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [memoType, setMemoType] = useState('Positive Memo');
  const [useCompanyMail, setUseCompanyMail] = useState(false);
  const [companyMail, setCompanyMail] = useState('');
  const [mailWarning, setMailWarning] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [closingRemarks, setClosingRemarks] = useState('Thanks & Regards,\nHR Department');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [companyLocation, setCompanyLocation] = useState('');

  // Fetch Company Profile Location
  useEffect(() => {
    const fetchCompanyLocation = async () => {
      try {
        const { data } = await axios.get('/api/company-profile/all', { skipGlobalAlert: true });
        const credentials = Array.isArray(data) ? data : data ? [data] : [];
        if (credentials.length > 0) {
          const activeName = localStorage.getItem('companyName') || sessionStorage.getItem('companyName');
          const activeProf = credentials.find((c) => c.companyName === activeName) || credentials[0];

          let parts = [];
          if (activeProf.address) parts.push(activeProf.address.trim());
          if (activeProf.city) parts.push(activeProf.city.trim());
          if (activeProf.state) parts.push(activeProf.state.trim());

          const fullLoc = parts.length > 0 ? parts.join(', ') : (activeProf.location || activeProf.companyName || '');
          if (fullLoc) {
            setCompanyLocation(fullLoc);
          }
        }
      } catch (err) {
        console.warn('Failed to load company profile location:', err);
      }
    };
    fetchCompanyLocation();
  }, []);

  // Resend Mail State (item 45)
  const [sendingId, setSendingId] = useState(null);

  const [loggedUserMail, setLoggedUserMail] = useState('');

  // Fetch logged-in user's office mail ID from Employee Master (reactively handles switched users)
  useEffect(() => {
    const fetchLoggedUserOfficeMail = async () => {
      if (!user) return;

      // 1. Direct property check on user object
      const directMail = user.officeMail || user.officeEmail || user.email;
      if (directMail && directMail.trim()) {
        setLoggedUserMail(directMail.trim());
      }

      // 2. Search in loaded employees list by empId / empCode / userId / id
      const empId = user.empId || user.employeeId || user.id;
      const userKey = String(user.empCode || user.userId || user.username || user.userCode || '').trim().toLowerCase();

      let matchedEmp = employees.find((e) => {
        if (!e) return false;
        if (empId && (String(e.id) === String(empId) || String(e.employeeId) === String(empId))) return true;
        const eCode = String(e.empCode || e.oldEmpCode || e.employeeCode || '').trim().toLowerCase();
        if (userKey && eCode && (eCode === userKey || userKey.includes(eCode) || eCode.includes(userKey))) return true;
        return false;
      });

      if (matchedEmp) {
        const mail = matchedEmp.officeMail || matchedEmp.officeEmail || matchedEmp.organization?.officeMail;
        if (mail && mail.trim()) {
          setLoggedUserMail(mail.trim());
          return;
        }
      }

      // 3. Fetch from API if empId exists
      if (empId) {
        try {
          const { data } = await axios.get(`/api/master/hr/employees/${empId}`, { skipGlobalAlert: true });
          if (data) {
            const mail = data.officeMail || data.officeEmail || data.organization?.officeMail;
            if (mail && mail.trim()) {
              setLoggedUserMail(mail.trim());
              return;
            }
          }
        } catch (err) {
          console.warn('Failed to load logged-in user employee profile:', err);
        }
      }
    };

    fetchLoggedUserOfficeMail();
  }, [user, employees]);

  const fetchCompanyMail = async () => {
    try {
      const profRes = await axios.get('/api/company-profile/all', { skipGlobalAlert: true });
      const credentials = Array.isArray(profRes.data) ? profRes.data : profRes.data ? [profRes.data] : [];

      if (credentials.length > 0) {
        const activeName = localStorage.getItem('companyName') || sessionStorage.getItem('companyName');
        const activeProf = credentials.find((c) => c.companyName === activeName) || credentials[0];
        const mail = activeProf?.smtpUsername || activeProf?.emailId || activeProf?.email || activeProf?.supportEmail || activeProf?.companyEmail;
        if (mail && mail.trim()) {
          setCompanyMail(mail.trim());
          return mail.trim();
        }
      }
    } catch (err) {
      console.warn('Failed to fetch company mail from AD_COMPANY_CREDENTIAL:', err);
    }
    setCompanyMail('');
    return '';
  };

  const resolveFromEmail = useCallback(async (isCompany) => {
    if (isCompany) {
      const cMail = companyMail || (await fetchCompanyMail());
      if (cMail && cMail.trim()) {
        setFromEmail(cMail.trim());
        setMailWarning('');
        setErrors((prev) => ({ ...prev, fromEmail: '' }));
      } else {
        setFromEmail('');
        setMailWarning('Company Mail is not configured in Company Profile / AD_COMPANY_CREDENTIAL (/admin/company-profile).');
        setErrors((prev) => ({ ...prev, fromEmail: 'Company Mail missing in AD_COMPANY_CREDENTIAL' }));
      }
    } else {
      let officeMail = loggedUserMail;

      if (!officeMail && user) {
        officeMail = user.officeMail || user.officeEmail || user.email || '';

        const empId = user.empId || user.employeeId || user.id;
        const userKey = String(user.empCode || user.userId || user.username || '').trim().toLowerCase();

        let matchedEmp = employees.find((e) => {
          if (!e) return false;
          if (empId && (String(e.id) === String(empId) || String(e.employeeId) === String(empId))) return true;
          const eCode = String(e.empCode || e.oldEmpCode || e.employeeCode || '').trim().toLowerCase();
          if (userKey && eCode && (eCode === userKey || userKey.includes(eCode) || eCode.includes(userKey))) return true;
          return false;
        });

        if (matchedEmp) {
          officeMail = matchedEmp.officeMail || matchedEmp.officeEmail || matchedEmp.organization?.officeMail || officeMail;
        }
      }

      const isSuperUser = String(user?.userId || user?.username || '').toUpperCase().includes('SUPER') ||
                          String(user?.userId || user?.username || '').toUpperCase() === 'ADMIN';

      if (!officeMail && isSuperUser) {
        const cMail = companyMail || (await fetchCompanyMail());
        if (cMail && cMail.trim()) {
          officeMail = cMail.trim();
        }
      }

      if (officeMail && officeMail.trim()) {
        setFromEmail(officeMail.trim());
        setMailWarning('');
        setErrors((prev) => ({ ...prev, fromEmail: '' }));
      } else {
        setFromEmail('');
        setMailWarning('Current logged-in user does not have an Office Mail ID configured in Employee Master.');
        setErrors((prev) => ({ ...prev, fromEmail: 'Office Mail ID missing in Employee Master' }));
      }
    }
  }, [companyMail, loggedUserMail, user, employees]);

  const handleOpenAdd = () => {
    setAddOpen(true);
    setMemoType('Positive Memo');
    setSelectedEmployee('');
    setUseCompanyMail(false);
    setFromEmail('');
    setToEmail('');
    setCcEmail('');
    setSubject('');
    setBody('');
    setClosingRemarks('Thanks & Regards,\nHR Department');
    setMailWarning('');
    setErrors({});
    resolveFromEmail(false);
  };

  const handleCloseAdd = () => {
    if (!submitting) {
      setAddOpen(false);
      setErrors({});
    }
  };

  const handleClear = () => {
    setSelectedEmployee('');
    setUseCompanyMail(false);
    setFromEmail('');
    setToEmail('');
    setCcEmail('');
    setSubject('');
    setBody('');
    setClosingRemarks('Thanks & Regards,\nHR Department');
    setMailWarning('');
    setErrors({});
  };

  const handleDeleteClick = (memo) => {
    setMemoToDelete(memo);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memoToDelete) return;
    try {
      setDeleting(true);
      await axios.delete(`/api/hr/employee/memo/${memoToDelete.id}`);
      dispatch(openSnackbar({
        open: true,
        message: 'Employee Memo deleted successfully!',
        variant: 'alert',
        severity: 'success'
      }));
      setDeleteOpen(false);
      fetchMemos();
    } catch (err) {
      console.error('Failed to delete memo:', err);
      dispatch(openSnackbar({
        open: true,
        message: err?.message || 'Failed to delete Employee Memo',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setDeleting(false);
      setMemoToDelete(null);
    }
  };

  // Send / Resend memo mail
  const handleResend = async (memo) => {
    if (sendingId || !memo) return;
    const isResend = memo.status === 'SENT';
    try {
      setSendingId(memo.id);
      const res = await axios.post(`/api/hr/employee/memo/${memo.id}/send`);

      if (res?.data?.mailSent === false) {
        dispatch(openSnackbar({
          open: true,
          message: res.data?.message || `Failed to send memo email to ${memo.toEmail || 'recipient'}. Please check SMTP configuration in Company Profile (/admin/company-profile).`,
          variant: 'alert',
          severity: 'error'
        }));
        return;
      }

      dispatch(openSnackbar({
        open: true,
        message: res?.data?.message || (isResend
          ? `Memo re-sent to ${memo.toEmail || 'recipient'} successfully!`
          : `Memo sent to ${memo.toEmail || 'recipient'} successfully!`),
        variant: 'alert',
        severity: 'success'
      }));
      fetchMemos(); // Dynamically update status to SENT in table
    } catch (err) {
      console.error('Failed to send memo:', err);
      dispatch(openSnackbar({
        open: true,
        message: err?.response?.data?.message || err?.message || 'Failed to send memo email. Please verify SMTP settings in Company Profile (/admin/company-profile).',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setSendingId(null);
    }
  };

  // Download Memo as PDF
  const handleDownloadPDF = (memo) => {
    if (!memo) return;

    // Resolve all variables used in the template literal
    const isPositive = memo.memoType === 'Positive Memo';
    const statusText = (memo.status || 'DRAFT').toUpperCase();
    const memoNumberFormatted = memo.memoNumber || '-';
    const createdDateStr = memo.createdDate
      ? new Date(memo.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-';
    const empCode = memo.employee?.oldEmpCode || memo.employee?.empCode || '-';
    const empName = memo.employee?.employeeName || '-';
    const deptName = (() => {
      const dept = memo.employee?.department;
      if (!dept) return '-';
      if (typeof dept === 'string') return dept;
      return dept.departmentName || dept.name || dept.deptName || '-';
    })();
    const desgName = typeof memo.employee?.designation === 'object'
      ? (memo.employee?.designation?.designationName || '-')
      : (memo.employee?.designation || '-');
    const dojRaw = memo.employee?.doj || memo.employee?.dateOfJoining;
    const dojStr = dojRaw
      ? new Date(dojRaw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-';
    // Use backend-resolved names from HR_EMPLOYEE_MANAGER_MAPPING
    const reportingMgrName = memo.reportingManagerName
      || memo.employee?.organization?.verticalHead
      || '-';
    const hrRepName = memo.hrRepresentativeName
      || memo.employee?.organization?.hrManager
      || '-';
    const cleanBody = memo.body ? memo.body.replace(/<[^>]+>/g, '') : '-';
    const locationStr = companyLocation || memo.location || memo.employee?.workLocation || '-';

    // Company Profile Details (Rule #33)
    const compName = companyProfile?.companyName || localStorage.getItem('companyName') || 'AUTONOVA';
    const compAddress = [companyProfile?.address, companyProfile?.city, companyProfile?.state, companyProfile?.pincode].filter(Boolean).join(', ') || locationStr || 'Chennai, Tamil Nadu';
    const compGstin = companyProfile?.gstIn || companyProfile?.gstin || '-';
    const compMob = companyProfile?.mobileNo || companyProfile?.phoneNo || companyProfile?.supportPhone || '-';
    const compEmail = companyProfile?.emailId || companyProfile?.supportEmail || '-';
    const compWeb = companyProfile?.website || 'www.autonova.com';

    let elementToRender = document.getElementById('printable-memo-pdf-document');
    let containerCreated = false;

    if (!elementToRender) {
      containerCreated = true;
      elementToRender = document.createElement('div');
      elementToRender.id = 'temp-pdf-download-container';
      elementToRender.style.position = 'absolute';
      elementToRender.style.left = '-9999px';
      elementToRender.style.top = '-9999px';
      elementToRender.style.width = '790px';
      elementToRender.style.padding = '25px';
      elementToRender.style.backgroundColor = '#ffffff';
      elementToRender.style.color = '#0f172a';
      elementToRender.style.fontFamily = 'sans-serif';

      elementToRender.innerHTML = `
        <div style="border: 1.5px solid #cbd5e1; padding: 25px; border-radius: 8px; position: relative;">
          <!-- Watermark -->
          <div style="position: absolute; top: 48%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 70px; font-weight: 900; color: rgba(203, 213, 225, 0.3); text-transform: uppercase; letter-spacing: 8px; pointer-events: none; z-index: 1;">
            ${statusText}
          </div>

          <!-- Top Company Header (Rule #33) -->
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 6px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top;">
                  <div style="display: flex; gap: 15px; align-items: flex-start;">
                    ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="Logo" style="max-height:60px;max-width:160px;object-fit:contain;margin-right:15px;" />` : ''}
                    <div style="font-size: 11px; color: #1e293b; line-height: 1.45;">
                      <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">${compName}</div>
                      <div>${compAddress}</div>
                      <div style="margin-top: 3px;"><strong>GSTIN:</strong> ${compGstin}</div>
                      <div style="margin-top: 2px; color: #475569;">Mob: ${compMob} | Email: ${compEmail} | Web: ${compWeb}</div>
                    </div>
                  </div>
                </td>
                <td style="width: 220px; text-align: right; vertical-align: top; font-size: 11px; line-height: 1.6;">
                  <div><strong>DOC. No :</strong> <span style="color: #1e3a8a; font-weight: 800;">${memoNumberFormatted}</span></div>
                  <div><strong>Date :</strong> ${createdDateStr}</div>
                  <div style="margin-top: 4px;">
                    <strong>Type :</strong>
                    <span style="background-color: ${isPositive ? '#16a34a' : '#dc2626'}; color: #ffffff; font-weight: 900; font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block;">
                      ${isPositive ? 'POSITIVE' : 'NEGATIVE'}
                    </span>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Report Name (Rule #33) -->
          <div style="text-align: center; margin-top: 6px; margin-bottom: 16px;">
            <span style="font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; text-decoration: underline; letter-spacing: 1.5px;">
              EMPLOYEE MEMO
            </span>
          </div>
                <div><strong>Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> &nbsp;${createdDateStr}</div>
                <div style="margin-top: 4px;">
                  <strong>Memo Type :</strong> &nbsp;
                  ${isPositive ? '<span style="padding: 2px 6px; font-size: 9px; font-weight: 800; border-radius: 4px; background-color: #16a34a; color: #ffffff;">POSITIVE</span>' : '<span style="padding: 2px 6px; font-size: 9px; font-weight: 800; border-radius: 4px; background-color: #dc2626; color: #ffffff;">NEGATIVE</span>'}
                </div>
              </td>
            </tr>
          </table>

          <!-- Section 1 -->
          <div style="margin-bottom: 20px;">
            <div style="background-color: #0f172a; color: #ffffff; padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 4px; display: inline-block; margin-bottom: 10px;">
              1 &nbsp;&nbsp; EMPLOYEE INFORMATION
            </div>
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 11px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px; width: 33%;"><strong>Employee ID :</strong> ${empCode}</td>
                  <td style="padding: 4px; width: 33%;"><strong>Employee Name :</strong> ${empName}</td>
                  <td style="padding: 4px; width: 34%;"><strong>Department :</strong> ${deptName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px;"><strong>Designation :</strong> ${desgName}</td>
                  <td style="padding: 4px;"><strong>Reporting Mgr :</strong> ${reportingMgrName}</td>
                  <td style="padding: 4px;"><strong>Date of Joining :</strong> ${dojStr}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Section 2 -->
          <div style="margin-bottom: 20px;">
            <div style="background-color: #0f172a; color: #ffffff; padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 4px; display: inline-block; margin-bottom: 10px;">
              2 &nbsp;&nbsp; MEMO DETAILS
            </div>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 11px;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="width: 25%; padding: 8px 12px; font-weight: 700; background-color: #f8fafc;">Subject / Reason</td>
                <td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${memo.subject || '-'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: 700; background-color: #f8fafc; vertical-align: top;">Detailed Description</td>
                <td style="padding: 8px 12px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${cleanBody}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: 700; background-color: #f8fafc;">Achievement / Incident Date</td>
                <td style="padding: 8px 12px; color: #334155;">${createdDateStr}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: 700; background-color: #f8fafc;">Location / Project</td>
                <td style="padding: 8px 12px; color: #334155; font-weight: 600;">${locationStr}</td>
              </tr>
            </table>
          </div>

          <!-- Section 3 -->
          <div style="margin-bottom: 20px;">
            <div style="background-color: #0f172a; color: #ffffff; padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 4px; display: inline-block; margin-bottom: 10px;">
              3 &nbsp;&nbsp; EMPLOYEE COMMENTS
            </div>
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 11px; min-height: 45px;">
              <strong>Employee Comments / Response :</strong>
              <div style="height: 30px;"></div>
            </div>
          </div>

          <!-- Section 4 -->
          <div style="margin-bottom: 15px;">
            <div style="background-color: #0f172a; color: #ffffff; padding: 5px 10px; font-size: 11px; font-weight: 800; border-radius: 4px; display: inline-block; margin-bottom: 10px;">
              4 &nbsp;&nbsp; ACKNOWLEDGEMENT & SIGNATURES
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
              <tr>
                <td style="width: 32%; padding: 4px;">
                  <div style="border: 1.5px solid #38bdf8; border-radius: 6px; overflow: hidden;">
                    <div style="background-color: #e0f2fe; color: #0284c7; font-weight: 800; padding: 5px; text-align: center;">Employee</div>
                    <div style="padding: 10px;">
                      <div style="height: 30px;"></div>
                      <div><strong>Name :</strong> ${empName}</div>
                      <div><strong>Signature :</strong> ___________________</div>
                      <div><strong>Date :</strong> ${createdDateStr}</div>
                    </div>
                  </div>
                </td>
                <td style="width: 32%; padding: 4px;">
                  <div style="border: 1.5px solid #4ade80; border-radius: 6px; overflow: hidden;">
                    <div style="background-color: #dcfce7; color: #16a34a; font-weight: 800; padding: 5px; text-align: center;">Reporting Manager</div>
                    <div style="padding: 10px;">
                      <div style="height: 30px; display: flex; align-items: center; justify-content: center; text-align: center;">
                        ${(memo.reportingManagerSignatureUpload && memo.reportingManagerSignatureUpload !== '-' && memo.reportingManagerSignatureUpload !== 'null' && memo.reportingManagerSignatureUpload !== 'undefined')
                          ? `<img src="${getPhotoUrl(memo.reportingManagerSignatureUpload)}" alt="Signature" style="max-height:30px;max-width:100%;object-fit:contain;" />`
                          : `<span style="color:#94a3b8;font-style:italic;font-size:10px;">no signature in employee master</span>`}
                      </div>
                      <div><strong>Name :</strong> ${reportingMgrName}</div>
                      <div><strong>Signature :</strong> ___________________</div>
                      <div><strong>Date :</strong> ${createdDateStr}</div>
                    </div>
                  </div>
                </td>
                <td style="width: 32%; padding: 4px;">
                  <div style="border: 1.5px solid #c084fc; border-radius: 6px; overflow: hidden;">
                    <div style="background-color: #f3e8ff; color: #9333ea; font-weight: 800; padding: 5px; text-align: center;">HR Representative</div>
                    <div style="padding: 10px;">
                      <div style="height: 30px; display: flex; align-items: center; justify-content: center; text-align: center;">
                        ${(memo.hrRepresentativeSignatureUpload && memo.hrRepresentativeSignatureUpload !== '-' && memo.hrRepresentativeSignatureUpload !== 'null' && memo.hrRepresentativeSignatureUpload !== 'undefined')
                          ? `<img src="${getPhotoUrl(memo.hrRepresentativeSignatureUpload)}" alt="Signature" style="max-height:30px;max-width:100%;object-fit:contain;" />`
                          : `<span style="color:#94a3b8;font-style:italic;font-size:10px;">no signature in employee master</span>`}
                      </div>
                      <div><strong>Name :</strong> ${hrRepName}</div>
                      <div><strong>Signature :</strong> ___________________</div>
                      <div><strong>Date :</strong> ${createdDateStr}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Bottom bar -->
          <div style="text-align: center; border-top: 2px solid #0f172a; padding-top: 6px; font-size: 10px; font-weight: 800; color: #0f172a;">
            Autonova &nbsp;|&nbsp; www.autonova.com
          </div>
        </div>
      `;
      document.body.appendChild(elementToRender);
    }

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Memo_${memo.memoNumber || memo.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(elementToRender).save().then(() => {
      if (containerCreated && elementToRender && elementToRender.parentNode) {
        elementToRender.parentNode.removeChild(elementToRender);
      }
      dispatch(openSnackbar({
        open: true,
        message: 'Memo PDF downloaded successfully!',
        variant: 'alert',
        severity: 'success'
      }));
    }).catch((err) => {
      if (containerCreated && elementToRender && elementToRender.parentNode) {
        elementToRender.parentNode.removeChild(elementToRender);
      }
      console.error('PDF Generation error:', err);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to generate PDF',
        variant: 'alert',
        severity: 'error'
      }));
    });
  };

  const handleSaveMemo = async () => {
    const newErrors = {};
    if (!selectedEmployee) newErrors.selectedEmployee = 'Employee is required';
    if (!fromEmail || !fromEmail.trim()) {
      newErrors.fromEmail = useCompanyMail
        ? 'Company Mail is not configured in Company Profile (AD_COMPANY_CREDENTIAL)'
        : 'Selected Employee does not have an Office Mail ID in Employee Master';
    }
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!body.trim()) newErrors.body = 'Description/Content is required';

    // To Email Validation
    if (!toEmail.trim()) {
      newErrors.toEmail = 'To Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(toEmail.trim())) {
        newErrors.toEmail = 'Please enter a valid email address';
      }
    }

    // CC Email Validation
    if (ccEmail.trim()) {
      const emails = ccEmail.split(/[\s,;]+/).filter(Boolean);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(email => !emailRegex.test(email.trim()));
      if (invalidEmails.length > 0) {
        newErrors.ccEmail = 'Please enter valid CC email address(es)';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      dispatch(openSnackbar({
        open: true,
        message: 'Please resolve all validation errors',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
      return;
    }

    try {
      setSubmitting(true);
      
      // Generate unique memo number on save
      const numberResponse = await axios.get('/api/hr/employee/memo/generate-number');
      const generatedMemoNo = numberResponse.data?.memoNumber || 'MEM0001';

      const payload = {
        employee: { id: selectedEmployee },
        memoNumber: generatedMemoNo,
        memoType,
        fromEmail,
        toEmail,
        ccEmail,
        subject,
        body,
        closingRemarks
      };

      await axios.post('/api/hr/employee/memo', payload);

      dispatch(openSnackbar({
        open: true,
        message: 'Employee Memo saved successfully! Click "Send Mail" to send email.',
        variant: 'alert',
        severity: 'success'
      }));

      setAddOpen(false);
      fetchMemos(); // Reactive refresh
    } catch (err) {
      console.error('Failed to save memo:', err);
      const errMsg = err?.message || err?.error || 'Failed to save Employee Memo';
      dispatch(openSnackbar({
        open: true,
        message: errMsg,
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch active employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const response = await axios.get('/api/master/hr/employees/filter/active');
        setEmployees(response.data || []);
        const opts = (response.data || []).map((emp) => ({
          value: emp.id,
          label: `${emp.employeeName} (${emp.empCode})`
        }));
        setEmployeeOptions(opts);
      } catch (err) {
        console.error('Failed to fetch active employees:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Register global filter bar config
  useEffect(() => {
    dispatch(setFilterConfig(buildFilterConfig(employeeOptions)));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, employeeOptions]);

  // Sync global search bar filters → local filters state
  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(DEFAULT_FILTERS).forEach((key) => {
        const globalValue = globalFilters[key];
        if (globalValue !== undefined && globalValue !== prev[key]) {
          next[key] = globalValue;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    setPage(0);
  }, [globalFilters]);

  // Fetch memos based on filters & search query
  const fetchMemos = async () => {
    try {
      setLoadingMemos(true);
      const params = {};
      if (filters.employeeId !== 'All') {
        params.employeeId = filters.employeeId;
      }
      if (filters.memoType !== 'All') {
        params.memoType = filters.memoType;
      }

      const response = await axios.get('/api/hr/employee/memo', { params });
      let data = response.data || [];

      // Perform client-side search query match if searchQuery is active
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        data = data.filter((m) => {
          const empName = (m.employee?.employeeName || '').toLowerCase();
          const empCode = (m.employee?.empCode || '').toLowerCase();
          const memoNo = (m.memoNumber || '').toLowerCase();
          const subject = (m.subject || '').toLowerCase();
          return (
            empName.includes(query) ||
            empCode.includes(query) ||
            memoNo.includes(query) ||
            subject.includes(query)
          );
        });
      }

      setMemos(data);
      setPage(0);
    } catch (err) {
      console.error('Failed to fetch memos:', err);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to load memos list',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setLoadingMemos(false);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, [filters, searchQuery]);

  const handlePreview = (memo) => {
    setPreviewMemo(memo);
    setPreviewOpen(true);
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => {
      if (addOpen) handleCloseAdd();
      if (previewOpen) setPreviewOpen(false);
      if (deleteOpen) setDeleteOpen(false);
    }
  });

  // ── Column Definitions for BOSDataTable ──
  const columns = [
    { id: 'index', label: 'No', minWidth: 55, align: 'center' },
    { id: 'memoNumber', label: 'Memo Number', minWidth: 120, align: 'center', bold: true },
    {
      id: 'memoType',
      label: 'Memo Type',
      minWidth: 130,
      align: 'center',
      render: (row) => (
        <Chip
          label={row.memoType}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.7rem',
            bgcolor: row.memoType === 'Positive Memo' ? '#e8f5e9' : '#ffebe5',
            color: row.memoType === 'Positive Memo' ? '#2e7d32' : '#c62828',
            border: 'none',
            borderRadius: '4px',
            textTransform: 'uppercase'
          }}
        />
      )
    },
    {
      id: 'employee',
      label: 'Employee',
      minWidth: 220,
      align: 'left',
      render: (row) => {
        const photoPath = row.employee?.employeePhotoUpload || row.employee?.photoUpload || row.employee?.photo;
        const photoUrl = photoPath ? getPhotoUrl(photoPath) : null;
        const displayCode = row.employee?.oldEmpCode || row.employee?.empCode || '-';
        return (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={photoUrl}
              alt={row.employee?.employeeName}
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: '1.5px solid',
                borderColor: 'primary.light',
                flexShrink: 0
              }}
            >
              {!photoUrl && (row.employee?.employeeName ? row.employee.employeeName.charAt(0).toUpperCase() : '?')}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {row.employee?.employeeName || '-'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {displayCode}
              </Typography>
            </Box>
          </Stack>
        );
      }
    },
    {
      id: 'createdByName',
      label: 'Raised By',
      minWidth: 160,
      align: 'left',
      render: (row) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {row.createdByName?.split(' (')[0] || row.createdBy || 'Admin'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {row.createdBy ? `ID: ${row.createdBy}` : 'ID: Admin'}
          </Typography>
        </Box>
      )
    },
    { 
      id: 'subject', 
      label: 'Subject', 
      minWidth: 250, 
      align: 'left',
      render: (row) => (
        <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {row.subject}
        </Typography>
      )
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 110,
      align: 'center',
      bold: true,
      render: (row) => <BOSStatusChip status={row.status || 'DRAFT'} showIcon />
    },
    {
      id: 'createdDate',
      label: 'Sent Date',
      minWidth: 120,
      align: 'center',
      render: (row) => (row.createdDate ? new Date(row.createdDate).toLocaleDateString('en-GB') : '-')
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 70,
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
          {perms.delete !== false && (
            <Tooltip title={row.status === 'DRAFT' ? 'Delete Draft Memo' : 'Delete Memo'}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(row);
                }}
              >
                <IconTrash size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    }
  ];

  // Selection state for sending mail from toolbar
  const [selectedRowId, setSelectedRowId] = useState(null);

  const handleRowClick = (row) => {
    setSelectedRowId((prev) => (prev === row.id ? null : row.id));
  };

  const selectedMemo = useMemo(() => {
    return memos.find((m) => m.id === selectedRowId) || null;
  }, [memos, selectedRowId]);

  // Client-side pagination calculations
  const resolvedRows = useMemo(() => {
    return memos.map((row, idx) => ({
      ...row,
      index: idx + 1
    }));
  }, [memos]);

  return (
    <MainCard
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconNotebook size={24} color={theme.palette.primary.main} />
          <Typography variant="h3">Employee Memo</Typography>
        </Box>
      }
      secondary={
        <BOSTableToolbar
          onRefresh={fetchMemos}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Memo', 'Ctrl + N')}
          newLabel="+ Add"
          hasWritePermission={perms.write !== false}
          exportData={resolvedRows}
          exportFilename="Employee_Memos"
          hasExportPermission={perms.export}
          columns={columns}
          extraActions={[
            {
              label: 'Preview PDF',
              icon: <IconFileText size={18} />,
              color: 'info',
              variant: 'outlined',
              disabled: !selectedMemo,
              tooltip: selectedMemo
                ? `Preview PDF Template for Memo #${selectedMemo.memoNumber}`
                : 'Select a row to preview PDF',
              onClick: () => {
                if (selectedMemo) {
                  handleOpenPdfPreview(selectedMemo);
                }
              }
            },
            {
              label: selectedMemo?.status === 'SENT' ? 'Resend Mail' : 'Send Mail',
              icon: <IconMail size={18} />,
              color: 'primary',
              variant: 'contained',
              disabled: !selectedMemo || sendingId === selectedMemo?.id,
              tooltip: selectedMemo
                ? `${selectedMemo.status === 'SENT' ? 'Resend' : 'Send'} mail for Memo #${selectedMemo.memoNumber} to ${selectedMemo.toEmail || selectedMemo.employee?.employeeName}`
                : 'Select a row to send mail',
              onClick: () => {
                if (selectedMemo) {
                  handleResend(selectedMemo);
                }
              }
            },
            {
              label: 'Download PDF',
              icon: <IconDownload size={18} />,
              color: 'secondary',
              variant: 'outlined',
              disabled: !selectedMemo,
              tooltip: selectedMemo
                ? `Download PDF for Memo #${selectedMemo.memoNumber}`
                : 'Select a row to download PDF',
              onClick: () => {
                if (selectedMemo) {
                  handleDownloadPDF(selectedMemo);
                }
              }
            }
          ]}
        />
      }
    >
      {/* ── MEMOS DATA TABLE ── */}
      <BOSDataTable
        id="employee-memo-list-table"
        columns={columns}
        rows={resolvedRows}
        page={page}
        size={size}
        loading={loadingMemos}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onClickRow={handleRowClick}
        onDoubleClickRow={(row) => handlePreview(row)}
        selectedRowId={selectedRowId}
        showActions={false}
      />

      {/* ── MEMO PREVIEW DIALOG (BOS TEMPLATE) ── */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        {previewMemo && (
          <>
            {/* BOS Dialog Title Header */}
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
                py: 2,
                bgcolor: 'primary.lighter',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <IconNotebook size={24} color={theme.palette.primary.main} />
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  Memo Preview — DOC. No : {previewMemo.memoNumber}
                </Typography>
              </Stack>
              <IconButton
                size="small"
                onClick={() => setPreviewOpen(false)}
                sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <IconX size={20} />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Employee & Type Status Header Banner */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={getPhotoUrl(previewMemo.employee?.employeePhotoUpload || previewMemo.employee?.photoUpload)}
                    alt={previewMemo.employee?.employeeName}
                    sx={{ width: 42, height: 42, bgcolor: 'primary.lighter', color: 'primary.main', fontWeight: 800 }}
                  >
                    {previewMemo.employee?.employeeName?.charAt(0).toUpperCase() || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {previewMemo.employee?.employeeName || '-'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Emp Code: {previewMemo.employee?.oldEmpCode || previewMemo.employee?.empCode || '-'}
                    </Typography>
                  </Box>
                </Stack>

                <Chip
                  label={previewMemo.memoType}
                  size="medium"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    bgcolor: previewMemo.memoType === 'Positive Memo' ? '#e8f5e9' : '#ffebe5',
                    color: previewMemo.memoType === 'Positive Memo' ? '#2e7d32' : '#c62828',
                    border: 'none',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    px: 1
                  }}
                />
              </Box>

              {/* BOS Grey Document Details Block */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '12px',
                  bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block', mb: 0.3 }}>
                    DOC. No
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    DOC. No : {previewMemo.memoNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block', mb: 0.3 }}>
                    Sent Date &amp; Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {previewMemo.createdDate ? new Date(previewMemo.createdDate).toLocaleString('en-GB') : '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block', mb: 0.3 }}>
                    From Email
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {previewMemo.fromEmail || 'hr@autonova.com'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block', mb: 0.3 }}>
                    To Email
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {previewMemo.toEmail}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block', mb: 0.3 }}>
                    CC Email
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {previewMemo.ccEmail || '-'}
                  </Typography>
                </Box>
                <Box sx={{ gridColumn: 'span 2' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block', mb: 0.3 }}>
                    Subject
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {previewMemo.subject}
                  </Typography>
                </Box>
              </Box>

              {/* Memo Body / Content */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                  Description / Content
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '10px',
                    bgcolor: 'background.paper',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    minHeight: 120,
                    lineHeight: 1.6,
                    '& p': { m: 0 }
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(previewMemo.body) }}
                />
              </Box>

              {/* Closing Remarks */}
              {previewMemo.closingRemarks && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.8, color: 'text.primary' }}>
                    Closing Remarks
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '10px',
                      bgcolor: 'background.paper',
                      fontWeight: 600,
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {previewMemo.closingRemarks}
                  </Typography>
                </Box>
              )}
            </DialogContent>

            {/* BOS Dialog Actions Footer */}
            <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between', gap: 1.5 }}>
              <Box>
                {previewMemo && perms.delete !== false && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<IconTrash size={16} />}
                    onClick={() => {
                      const m = previewMemo;
                      setPreviewOpen(false);
                      handleDeleteClick(m);
                    }}
                    sx={btnDelete}
                  >
                    {previewMemo.status === 'DRAFT' ? 'Delete Draft' : 'Delete'}
                  </Button>
                )}
              </Box>
              <Stack direction="row" spacing={1.5}>
                <Button
                  onClick={() => handleDownloadPDF(previewMemo)}
                  variant="outlined"
                  color="secondary"
                  startIcon={<IconDownload size={16} />}
                >
                  Download PDF
                </Button>
                <Button
                  onClick={() => setPreviewOpen(false)}
                  sx={btnCancel}
                >
                  Close
                </Button>
                <Button
                  disabled={sendingId === previewMemo.id}
                  onClick={() => handleResend(previewMemo)}
                  sx={btnEdit(theme)}
                  startIcon={<IconMail size={16} />}
                >
                  {sendingId === previewMemo.id ? 'Sending...' : previewMemo.status === 'SENT' ? 'Resend Mail' : 'Send Mail'}
                </Button>
              </Stack>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── PDF PREVIEW DIALOG (SCREENSHOT TEMPLATE) ── */}
      <Dialog
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        {pdfMemo && (
          <>
            {/* BOS Dialog Title Header */}
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 3,
                py: 2,
                bgcolor: 'primary.lighter',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <IconFileText size={24} color={theme.palette.primary.main} />
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  PDF Preview — DOC. No : {pdfMemo.memoNumber}
                </Typography>
              </Stack>
              <IconButton
                size="small"
                onClick={() => setPdfPreviewOpen(false)}
                sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
              >
                <IconX size={20} />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#f8fafc', display: 'flex', justifyContent: 'center', overflowY: 'auto', maxHeight: '78vh' }}>
              <PdfMemoTemplate memo={pdfMemo} companyProfile={companyProfile} companyLogoUrl={companyLogoUrl} companyLocation={companyLocation} />
            </DialogContent>

            {/* BOS Dialog Actions Footer using Standard BOS Button Templates */}
            <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between', gap: 1.5 }}>
              <Button
                onClick={() => setPdfPreviewOpen(false)}
                sx={btnCancel}
              >
                Close
              </Button>
              <Stack direction="row" spacing={1.5}>
                <Button
                  onClick={() => handleDownloadPDF(pdfMemo)}
                  sx={btnSave}
                  startIcon={<IconDownload size={16} />}
                >
                  Download PDF
                </Button>
                <Button
                  disabled={sendingId === pdfMemo.id}
                  onClick={() => handleResend(pdfMemo)}
                  sx={btnWarning}
                  startIcon={<IconMail size={16} />}
                >
                  {sendingId === pdfMemo.id ? 'Sending...' : pdfMemo.status === 'SENT' ? 'Resend Mail' : 'Send Mail'}
                </Button>
              </Stack>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── CREATE MEMO DIALOG ── */}
      <BOSFormDialog
        open={addOpen}
        onClose={handleCloseAdd}
        onSave={handleSaveMemo}
        onClear={handleClear}
        title="Create New Employee Memo"
        maxWidth="md"
        hasId={false}
      >
        <BOSFormSection icon={<IconNotebook size={22} />} title="Memo Details">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            <BOSEmployeeAutocomplete
              label="Select Employee *"
              options={employees}
              value={employees.find((x) => String(x.id) === String(selectedEmployee)) || null}
              onChange={(newValue) => {
                const empId = newValue ? newValue.id : '';
                setSelectedEmployee(empId);
                if (newValue) {
                  setToEmail(newValue.officeMail || newValue.personalEmail || newValue.email || '');
                } else {
                  setToEmail('');
                }
                if (errors.selectedEmployee) {
                  setErrors((prev) => ({ ...prev, selectedEmployee: '' }));
                }
                resolveFromEmail(useCompanyMail);
              }}
              placeholder="Select Employee..."
              error={!!errors.selectedEmployee}
              helperText={errors.selectedEmployee}
              sx={errorStyle(!!errors.selectedEmployee)}
            />

            <BOSTextField
              select
              fullWidth
              label="Memo Type *"
              value={memoType}
              onChange={(e) => setMemoType(e.target.value)}
            >
              <MenuItem value="Positive Memo">Positive Memo</MenuItem>
              <MenuItem value="Negative Memo">Negative Memo</MenuItem>
            </BOSTextField>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3, alignItems: 'flex-start' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    From Email *
                  </Typography>
                  <BOSToggleSwitch
                    name="useCompanyMail"
                    value={useCompanyMail}
                    onChange={(e) => {
                      const checked = e.target.value === true || e.target.value === 'true' || e.target.checked === true;
                      setUseCompanyMail(checked);
                      resolveFromEmail(checked);
                    }}
                    checkedLabel="Yes"
                    uncheckedLabel="No"
                    checkedValue={true}
                    uncheckedValue={false}
                    label="Use Company Mail"
                    size="small"
                  />
                </Box>
                <BOSTextField
                  fullWidth
                  disabled
                  required
                  value={fromEmail}
                  placeholder={
                    useCompanyMail
                      ? 'Fetching Company Mail from Company Profile (AD_COMPANY_CREDENTIAL)...'
                      : 'Select an employee with Office Mail ID'
                  }
                  error={!!errors.fromEmail}
                  helperText={errors.fromEmail}
                  sx={errorStyle(!!errors.fromEmail)}
                />
                {mailWarning && (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                      mt: 1,
                      p: 1.2,
                      px: 1.5,
                      borderRadius: '8px',
                      bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'),
                      color: '#dc2626',
                      border: '1px solid #fecaca'
                    }}
                  >
                    <IconAlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '11px', color: '#dc2626', lineHeight: 1.3 }}>
                      {mailWarning}
                    </Typography>
                  </Stack>
                )}
              </Box>

              <BOSTextField
                fullWidth
                label="To Email *"
                required
                value={toEmail}
                onChange={(e) => {
                  setToEmail(e.target.value);
                  if (errors.toEmail) setErrors((prev) => ({ ...prev, toEmail: '' }));
                }}
                error={!!errors.toEmail}
                helperText={errors.toEmail}
                sx={{ mt: 3.5, ...errorStyle(!!errors.toEmail) }}
              />

              <BOSTextField
                fullWidth
                label="CC Email"
                value={ccEmail}
                onChange={(e) => {
                  setCcEmail(e.target.value);
                  if (errors.ccEmail) setErrors((prev) => ({ ...prev, ccEmail: '' }));
                }}
                error={!!errors.ccEmail}
                helperText={errors.ccEmail}
                sx={{ mt: 3.5, ...errorStyle(!!errors.ccEmail) }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mt: 3 }}>
            <BOSTextField
              fullWidth
              label="Subject *"
              required
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors((prev) => ({ ...prev, subject: '' }));
              }}
              error={!!errors.subject}
              helperText={errors.subject}
              sx={errorStyle(!!errors.subject)}
            />

            <BOSTextField
              fullWidth
              label="Description / Content *"
              placeholder="Enter memo details here..."
              required
              multiline
              rows={5}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.body) setErrors((prev) => ({ ...prev, body: '' }));
              }}
              error={!!errors.body}
              helperText={errors.body}
              sx={errorStyle(!!errors.body)}
            />

            <BOSTextField
              fullWidth
              label="Thanks & Regards (Closing Remarks)"
              multiline
              rows={3}
              value={closingRemarks}
              onChange={(e) => setClosingRemarks(e.target.value)}
            />
          </Box>
        </BOSFormSection>
      </BOSFormDialog>

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Employee Memo"
        message="Are you sure you want to delete this memo? This action cannot be undone."
        itemName={memoToDelete?.memoNumber}
      />
    </MainCard>
  );
};

export default EmployeeMemoList;
