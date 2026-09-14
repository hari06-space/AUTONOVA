import { useState, useEffect } from 'react';
import { Grid, Box, Typography, Chip, Stack, Dialog, DialogTitle, DialogContent, IconButton, Table, TableHead, TableRow, TableCell, TableBody, TextField, InputAdornment, Select, MenuItem, Switch } from '@mui/material';
import { IconIdBadge2, IconX, IconSearch, IconCamera, IconLogin, IconLogout, IconCookie, IconMaximize } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import {
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  BOSAutocomplete,
  BOSEmployeeAutocomplete,
  BOSDatePicker,
  BOSTimePicker
} from 'ui-component/bos';
import { getPhotoUrl } from 'ui-component/bos/BOSUtils';
import { useTheme } from '@mui/material/styles';


// ── Visitor Type options ─────────────────────────────────────────────────────
const VISITOR_TYPES = [
  'CUSTOMER',
  'SUPPLIER',
  'SUBCONTRACTOR',
  'CONSULTANT',
  'BANKERS',
  'GOVERNMENT BODIES',
  'LOCAL PEOPLE',
  'AUDITORS',
  'INTERVIEW PERSON',
  "EMPLOYEE PERSONNEL ' S(FAMILY MEMBERS,FRIENDS,KNOWN PERSONS)",
  'OTHERS'
];

// ── Purpose options ──────────────────────────────────────────────────────────
const PURPOSE_OPTIONS = [
  'MATERIAL DELIVERY',
  'DISPATCH / PICKUP',
  'MACHINE SERVICE / MAINTENANCE',
  'CLIENT / BUSINESS MEETING',
  'QUALITY INSPECTION / AUDIT',
  'INSTALLATION / COMMISSIONING',
  'TRAINING / DEMO',
  'INTERVIEW / HR PURPOSE',
  'JOINING AS EMPLOYEE',
  'OFFICIAL / GOVERNMENT WORK',
  'OTHERS'
];

const WORK_PERMIT_PURPOSE_OPTIONS = [
  'HOT WORK (WELDING / CUTTING / GRINDING)',
  'HEIGHT WORK',
  'ELECTRICAL WORK',
  'MAINTENANCE WORK',
  'MACHINE INSTALLATION',
  'BREAKDOWN REPAIR',
  'CIVIL CONSTRUCTION WORK',
  'PAINTING WORK',
  'ROOF WORK',
  'PIPELINE WORK',
  'EXCAVATION WORK',
  'GENERAL CONTRACT WORK',
  'OTHERS'
];

const getPurposeForVisitorType = (vType) => {
  switch (vType) {
    case 'CUSTOMER': return 'CLIENT / BUSINESS MEETING';
    case 'SUPPLIER': return 'MATERIAL DELIVERY';
    case 'SUBCONTRACTOR': return 'MATERIAL DELIVERY';
    case 'CONSULTANT': return 'CLIENT / BUSINESS MEETING';
    case 'BANKERS': return 'OFFICIAL / GOVERNMENT WORK';
    case 'GOVERNMENT BODIES': return 'OFFICIAL / GOVERNMENT WORK';
    case 'LOCAL PEOPLE': return 'OTHERS';
    case 'AUDITORS': return 'QUALITY INSPECTION / AUDIT';
    case 'INTERVIEW PERSON': return 'INTERVIEW / HR PURPOSE';
    case "EMPLOYEE PERSONNEL ' S(FAMILY MEMBERS,FRIENDS,KNOWN PERSONS)": return 'OTHERS';
    case 'OTHERS': return 'OTHERS';
    default: return '';
  }
};

// ── Food category options ────────────────────────────────────────────────────
const FOOD_CATEGORY_OPTIONS = ['CANTEEN', 'SPECIAL'];

// ── Status chip ──────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => {
  const cfg =
    status === 'OPEN'
      ? { bg: '#E8F5E9', text: '#2E7D32' }
      : status === 'APPROVED'
        ? { bg: '#E3F2FD', text: '#1565C0' }
        : status === 'CANCELLED'
          ? { bg: '#EEEEEE', text: '#616161' }
          : { bg: '#FFF3E0', text: '#E65100' };
  return (
    <Chip
      label={status || 'OPEN'}
      size="small"
      sx={{
        height: 28,
        fontSize: '0.78rem',
        fontWeight: 700,
        bgcolor: cfg.bg,
        color: cfg.text,
        border: 'none',
        borderRadius: '6px',
        px: 0.5
      }}
    />
  );
};

// ── Header info bar ──────────────────────────────────────────────────────────
const InfoBar = ({ status, gatePassNo, gatePassDate, gatePassType, onChangeType, disabled }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      px: 2,
      py: 1.2,
      mb: 0,
      bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
      borderRadius: '10px',
      border: '1px solid',
      borderColor: 'divider'
    }}
  >
    {/* Left side: Status & Type */}
    <Stack direction="row" spacing={3} alignItems="center">
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          Status
        </Typography>
        <StatusChip status={status} />
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          Type
        </Typography>
        <Select
          value={gatePassType || 'GATE PASS'}
          onChange={(e) => onChangeType && onChangeType(e.target.value)}
          disabled={disabled}
          size="small"
          sx={{
            height: 26,
            fontSize: '0.75rem',
            fontWeight: 600,
            bgcolor: '#EDE7F6',
            color: '#4527A0',
            borderRadius: '6px',
            '& .MuiSelect-select': { py: 0, px: 1 },
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
          }}
        >
          <MenuItem value="GATE PASS" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>GATE PASS</MenuItem>
          <MenuItem value="WORK PERMIT" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>WORK PERMIT</MenuItem>
        </Select>
      </Stack>
    </Stack>

    {/* Right side: Gate Pass No. & Gate Pass Date */}
    <Stack direction="row" spacing={3} alignItems="center">
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          Gate Pass No.
        </Typography>
        <Typography variant="body2" fontWeight={700} color="primary.main">
          {gatePassNo || 'Auto Generated'}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          Gate Pass Date
        </Typography>
        <Typography variant="body2" fontWeight={700} color="primary.main">
          {gatePassDate ? new Date(gatePassDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
        </Typography>
      </Stack>
    </Stack>
  </Box>
);

// ── Time formatter ────────────────────────────────────────────────────────────
const formatTimeOnly = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return String(dateVal);
  }
};

const parseTimeToMinutes = (timeInput) => {
  if (!timeInput) return null;
  if (timeInput instanceof Date) {
    return timeInput.getHours() * 60 + timeInput.getMinutes();
  }
  const clean = String(timeInput).trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3];
  if (ampm) {
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
  }
  return h * 60 + m;
};

// ── Default form state ────────────────────────────────────────────────────────
const EMPTY = {
  isdCode: '',
  mobileNo: '',
  visitorName: '',
  visitorType: '',
  isNewVendor: false,
  partyName: '',
  emailId: '',
  address: '',
  visitorDate: '',
  inTime: '',
  outTime: '',
  personToMeet: '',
  noOfPersons: '1',
  foodAllowance: 'NO',
  foodCategory: '',
  normalFood: '',
  gadgets: '',
  purpose: '',
  purposeComments: '',
  comments: '',
  visitorTypeComments: '',
  vendorCode: '',
  gatePassType: 'GATE PASS',
  checkInImg: null,
  checkOutImg: null,
};

// ── Image Preview Card ────────────────────────────────────────────────────────
const formatDisplayTime = (val) => {
  if (!val) return null;
  if (typeof val === 'string' && (val.includes('AM') || val.includes('PM'))) return val;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return String(val);
  }
};

const ImagePreviewCard = ({ title, src, type, time, by }) => {
  const Icon = type === 'in' ? IconLogin : IconLogout;
  const formattedTime = formatDisplayTime(time);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fullPhotoUrl = getPhotoUrl(src);

  return (
    <>
      <Box sx={{
        width: 320,
        bgcolor: 'background.paper',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
      }}>
        {/* Image Area with Hover Zoom & Click Full View */}
        <Box sx={{ p: 1.5, pb: 0 }}>
          <Box
            onClick={() => setPreviewOpen(true)}
            sx={{
              width: '100%',
              height: 190,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: '#0f172a',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover img': {
                transform: 'scale(1.08)',
                filter: 'brightness(1.05)'
              },
              '&:hover .zoom-overlay': {
                opacity: 1
              }
            }}
          >
            <img
              src={fullPhotoUrl}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transition: 'all 0.3s ease-in-out'
              }}
            />
            <Box
              className="zoom-overlay"
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(15, 23, 42, 0.45)',
                opacity: 0,
                transition: 'opacity 0.25s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                color: '#ffffff'
              }}
            >
              <IconMaximize size={22} />
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                Click to View Full Photo
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer Area */}
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: (formattedTime || by) ? 1.5 : 0 }}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: type === 'in' ? '#eafff0' : '#fff0f0',
              color: type === 'in' ? '#2e7d32' : '#d32f2f',
              border: `1px solid ${type === 'in' ? '#c8e6c9' : '#ffcdd2'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={20} stroke={2} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: 0.5 }}>
              {title}
            </Typography>
          </Stack>

          {(formattedTime || by) && (
            <Stack spacing={0.8} sx={{ bgcolor: 'background.default', border: '1px solid #e2e8f0', p: 1.2, borderRadius: 1.5 }}>
              {formattedTime && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {type === 'in' ? 'IN Time:' : 'OUT Time:'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {formattedTime}
                  </Typography>
                </Stack>
              )}
              {by && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {type === 'in' ? 'Checked IN By:' : 'Checked OUT By:'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {by}
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Full Photo Lightbox Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: '#0f172a',
            color: '#ffffff',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#1e293b', color: '#ffffff' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconCamera size={22} color="#60a5fa" />
            <Typography variant="h5" color="inherit" sx={{ fontWeight: 700 }}>
              {title} - Full Photo View
            </Typography>
          </Stack>
          <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: '#ffffff' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#0f172a', minHeight: 400 }}>
          <img
            src={fullPhotoUrl}
            alt={title}
            style={{
              maxWidth: '100%',
              maxHeight: '75vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

// ==============================|| ADD VISITOR GATE PASS DIALOG ||============================== //

export default function AddVisitorGatePassDialog({ open, onClose, onSave, initialData }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [form, setForm] = useState({ ...EMPTY });
  const [isSaving, setIsSaving] = useState(false);
  const [employeeList, setEmployeeList] = useState([]);
  // countries/isdCodesList no longer needed — BOSTextField type="phone" loads from Country Master internally

  // Lookup state
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupData, setLookupData] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupSearch, setLookupSearch] = useState('');

  // Load employees for "Person to Meet"
  useEffect(() => {
    if (open) {
      axios
        .get('/api/master/hr/employees')
        .then((res) => {
          const rawData = Array.isArray(res.data) ? res.data : res.data?.content || [];
          const list = rawData.filter((e) => {
            if (!e) return false;
            const fw = String(e.fromWhere || e.FROMWHERE || '').trim().toUpperCase();
            if (fw === 'ATS' && !e.empCode && !e.oldEmpCode) return false;
            if (e.exitDate || e.exit_date) return false;
            if (e.isActive === false || e.active === false) return false;
            const st = String(e.status || e.employeeStatus || '').trim().toUpperCase();
            if (['INACTIVE', 'IN-ACTIVE', 'LEFT', 'RESIGNED', 'TERMINATED', 'RELIEVED'].includes(st)) return false;
            return true;
          });
          setEmployeeList(list);
        })
        .catch(() => setEmployeeList([]));
    }
  }, [open]);

  const [partyOptions, setPartyOptions] = useState([]);

  // Load ledger/party options based on visitorType
  useEffect(() => {
    if (open && ['CUSTOMER', 'SUPPLIER', 'SUBCONTRACTOR'].includes(form.visitorType)) {
      const url = form.visitorType === 'CUSTOMER' ? '/api/sm/customers' : '/api/sm/suppliers';
      axios.get(url)
        .then((res) => {
          const raw = res.data;
          const data = Array.isArray(raw) ? raw : (raw?.content || raw?.data || []);
          const normalized = data.map((item) => ({
            ...item,
            customerName: item.customerName || item.CUSTOMERNAME || item.customer_name || item.name || item.ledgerName || '',
            customerCode: item.customerCode || item.CUSTOMERCODE || item.customer_code || item.code || '',
            supplierName: item.supplierName || item.SUPPLIERNAME || item.supplier_name || item.name || item.ledgerName || '',
            supplierCode: item.supplierCode || item.SUPPLIERCODE || item.supplier_code || item.code || ''
          }));
          setPartyOptions(normalized);
        })
        .catch(() => setPartyOptions([]));
    } else {
      setPartyOptions([]);
    }
  }, [open, form.visitorType]);

  const [autoGatePassNo, setAutoGatePassNo] = useState('');

  // Fetch next gate pass number for new records
  useEffect(() => {
    if (open) {
      if (initialData?.gatePassNo) {
        setAutoGatePassNo(initialData.gatePassNo);
      } else {
        axios.get('/api/order/visitor-gate-pass/next-no')
          .then(res => {
            if (res.data && res.data.gatePassNo) {
              setAutoGatePassNo(res.data.gatePassNo);
            }
          })
          .catch(err => {
            console.warn('Could not preview next gate pass no:', err);
          });
      }
    }
  }, [open, initialData]);

  const formatDateOnly = (val) => {
    if (!val) return '';
    try {
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Populate / reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          // Store combined phone (countryCode + digits) in mobileNo field
          mobileNo: (() => {
            const code = initialData.isdCode || '';
            const num = initialData.mobileNo || '';
            return num.startsWith(code) ? num : (code + num);
          })(),
          isdCode: initialData.isdCode || '',
          localMobileNo: (() => {
            const code = initialData.isdCode || '';
            const num = initialData.mobileNo || '';
            return num.startsWith(code) ? num.substring(code.length) : num;
          })(),
          visitorName: initialData.visitorName || '',
          visitorType: initialData.visitorType || '',
          isNewVendor: initialData.newVendor === 'YES',
          partyName: initialData.personName || '',
          emailId: initialData.emailId || '',
          address: initialData.address || '',
          visitorDate: formatDateOnly(initialData.visitorDate) || '',
          inTime: formatTimeOnly(initialData.inTime) || '',
          outTime: formatTimeOnly(initialData.outTime) || '',
          personToMeet: initialData.personToMeet || '',
          noOfPersons: initialData.noOfPersons ? String(initialData.noOfPersons) : '1',
          foodAllowance: initialData.foodAllowance || 'NO',
          foodCategory: initialData.foodCategory || '',
          normalFood: initialData.normalFood || '',
          gadgets: initialData.kit || '',
          purpose: initialData.purpose || '',
          purposeComments: initialData.purposeComments || '',
          comments: initialData.comments || '',
          visitorTypeComments: '',
          checkInImg: initialData.checkInImg || null,
          checkOutImg: initialData.checkOutImg || null,
          checkInBy: initialData.checkInBy || null,
          checkOutBy: initialData.checkOutBy || null,
          checkInTime: initialData.checkInTime || initialData.inTime || null,
          checkOutTime: initialData.checkOutTime || initialData.outTime || null,
        });
      } else {
        setForm({ ...EMPTY });
      }
    }
  }, [open, initialData]);

  // Fetch last visitor details & photo by mobile number
  const handleFetchLastVisitor = async (mobileNum) => {
    if (!mobileNum) return;
    const digits = String(mobileNum).replace(/[^0-9]/g, '');
    if (digits.length < 10) return;

    try {
      const [res, photoRes] = await Promise.all([
        axios.get('/api/order/visitor-gate-pass/latest-by-mobile', { params: { mobileNo: digits } }),
        axios.get('/api/order/visitor-gate-pass/photo-info-by-mobile', { params: { mobileNo: digits } }).catch(() => ({ data: {} }))
      ]);
      const data = res.data;
      const photoInfo = photoRes.data || {};
      const autoPhoto = (photoInfo.photoUrl && !photoInfo.isPhotoMandatory) ? photoInfo.photoUrl : null;

      if (data && (data.id || data.visitorName)) {
        setForm((prev) => ({
          ...prev,
          visitorName: data.visitorName || prev.visitorName,
          visitorType: data.visitorType || prev.visitorType,
          isNewVendor: data.newVendor === 'YES',
          partyName: data.personName || prev.partyName,
          vendorCode: data.vendorCode || prev.vendorCode,
          emailId: data.emailId || prev.emailId,
          address: data.address || prev.address,
          foodAllowance: data.foodAllowance || prev.foodAllowance,
          foodCategory: data.foodCategory || prev.foodCategory,
          normalFood: data.normalFood || prev.normalFood,
          gadgets: data.kit || prev.gadgets,
          noOfPersons: '1',
          checkInImg: autoPhoto || prev.checkInImg
        }));
      }
    } catch (err) {
      console.error('Error fetching last visitor details:', err);
    }
  };

  // Auto-set Food Required if Planned Time overlaps with 12:00 PM - 2:00 PM
  // Auto-set Food Required if Planned Time overlaps with 12:30 PM - 1:30 PM
  useEffect(() => {
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') return null;
      const match = timeStr.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3];
      if (ampm) {
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
      }
      return h * 60 + m;
    };

    if (form.inTime && form.outTime) {
      try {
        const inMins = parseTimeToMinutes(form.inTime);
        const outMins = parseTimeToMinutes(form.outTime);
        if (inMins !== null && outMins !== null) {
          const inDecimal = inMins / 60;
          const outDecimal = outMins / 60;
          // Overlap check: start before 13:30 (13.5) AND end after 12:30 (12.5)
          if (inDecimal < 13.5 && outDecimal > 12.5) {
            setForm((prev) => ({
              ...prev,
              foodAllowance: 'YES',
              foodCategory: prev.foodCategory || 'CANTEEN'
            }));
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [form.inTime, form.outTime]);

  const setField = (key) => (val) => {
    let value = typeof val === 'object' && val?.target ? val.target.value : val;

    // Restrict numbers and special characters for names (allow multi-language letters, marks and spaces)
    if (key === 'visitorName' || key === 'partyName') {
      if (typeof value === 'string') {
        value = value.replace(/[^\p{L}\p{M}\s]/gu, '');
      }
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Party Lookup ─────────────────────────────────────────────────────────────
  const handleOpenLookup = () => {
    if (form.isNewVendor || !['CUSTOMER', 'SUPPLIER', 'SUBCONTRACTOR'].includes(form.visitorType)) return;
    setLookupOpen(true);
    setLookupLoading(true);
    setLookupSearch('');

    let url = '';
    if (form.visitorType === 'CUSTOMER') url = '/api/sm/customers';
    else url = '/api/sm/suppliers'; // fallback for Supplier & Subcontractor

    axios.get(url).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      setLookupData(data.filter(d => d.isActive !== false));
    }).catch(err => console.error("Error fetching lookup data:", err))
      .finally(() => setLookupLoading(false));
  };

  const handleSelectParty = (record) => {
    const pName = form.visitorType === 'CUSTOMER' ? (record.customerName || record.ledgerName) : (record.supplierName || record.ledgerName);
    const vCode = form.visitorType === 'CUSTOMER' ? record.customerCode : record.supplierCode;
    const pEmail = record.emailId || record.mailId || record.email || '';
    const pAddress = record.address || record.ADDRESS || '';
    const pMobile = record.mobileNo || record.mobile || record.phone || '';

    setForm((prev) => {
      const next = {
        ...prev,
        partyName: pName || prev.partyName,
        vendorCode: vCode || prev.vendorCode
      };
      if (pEmail) next.emailId = pEmail;
      if (pAddress) next.address = pAddress;
      if (pMobile) {
        next.mobileNo = pMobile;
        next.localMobileNo = pMobile;
      }
      return next;
    });
    setLookupOpen(false);
  };

  // ── Validation & Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving) return;
    const missing = [];
    const isPartyRequired = ['CUSTOMER', 'SUPPLIER', 'SUBCONTRACTOR'].includes(form.visitorType);
    if (!form.mobileNo) missing.push('Mobile No');
    if (!form.visitorName) missing.push('Visitor Name');
    if (!form.visitorType) missing.push('Visitor Type');
    if (isPartyRequired && !form.partyName) missing.push('Party Name');
    if (!form.emailId) missing.push('Email');
    if (!form.address) missing.push('Address');
    if (!form.visitorDate) missing.push('Visitor Date');
    if (!form.inTime) missing.push('In Time');
    if (!form.outTime) missing.push('Out Time');
    if (!form.personToMeet) missing.push('Person to Meet');
    if (!form.noOfPersons) missing.push('No. of Persons');
    if (!form.purpose) missing.push('Purpose');

    if (missing.length > 0) {
      dispatch(openSnackbar({
        open: true,
        message: `Please fill in required fields: ${missing.join(', ')}`,
        variant: 'alert',
        alert: { color: 'warning' },
        severity: 'warning'
      }));
      return;
    }

    if (form.mobileNo) {
      // BOSTextField type="phone" stores value as countryCode+digits
      // We just do a basic non-empty check here; BOSTextField shows inline errors
      const digitsOnly = form.mobileNo.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 4) {
        dispatch(openSnackbar({
          open: true,
          message: 'Please enter a valid Mobile No',
          variant: 'alert',
          alert: { color: 'warning' },
          severity: 'warning'
        }));
        return;
      }
    }

    if (form.purpose === 'OTHERS' && !form.purposeComments?.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Purpose Comments is required when Purpose is OTHERS', variant: 'alert', alert: { color: 'warning' }, severity: 'warning' }));
      return;
    }

    if (form.visitorType === 'OTHERS' && !form.visitorTypeComments?.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Comments is required when Visitor Type is OTHERS', variant: 'alert', alert: { color: 'warning' }, severity: 'warning' }));
      return;
    }

    // ── Date Validation (Visitor Date cannot be in the past) ─────────────────
    if (form.visitorDate) {
      const selectedDate = new Date(form.visitorDate);
      const today = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        dispatch(openSnackbar({
          open: true,
          message: 'Visitor Date cannot be in the past.',
          variant: 'alert',
          alert: { color: 'warning' },
          severity: 'warning'
        }));
        return;
      }
    }

    // ── Time Validation (Out Time must be strictly after In Time) ────────────
    if (form.inTime && form.outTime) {
      const inMins = parseTimeToMinutes(form.inTime);
      const outMins = parseTimeToMinutes(form.outTime);
      if (inMins !== null && outMins !== null && outMins <= inMins) {
        dispatch(openSnackbar({
          open: true,
          message: 'Out Time must be later than In Time.',
          variant: 'alert',
          alert: { color: 'warning' },
          severity: 'warning'
        }));
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id || null,
        // Split combined phone value (countryCode+digits) into separate fields for backend
        isdCode: form.isdCode || '+91',
        mobileNo: form.localMobileNo || form.mobileNo,
        visitorName: form.visitorName,
        visitorType: form.visitorType,
        newVendor: form.isNewVendor ? 'YES' : 'NO',
        personName: isPartyRequired ? (form.partyName || null) : null,
        vendorCode: isPartyRequired ? (form.vendorCode || null) : null,
        emailId: form.emailId,
        address: form.address,
        visitorDate: form.visitorDate || null,
        inTime: form.inTime || null,
        outTime: form.outTime || null,
        personToMeet: form.personToMeet,
        noOfPersons: form.noOfPersons ? Number(form.noOfPersons) : null,
        foodAllowance: form.foodAllowance,
        foodCategory: form.foodCategory || null,
        normalFood: form.normalFood || null,
        kit: form.gadgets || null,
        purpose: form.purpose,
        purposeComments: form.purposeComments,
        comments: form.visitorType === 'OTHERS'
          ? (form.visitorTypeComments + (form.comments ? '\n' + form.comments : ''))
          : (form.comments || null),
        gatePassType: form.gatePassType || 'GATE PASS',
        status: 'OPEN',
      });
      onClose();
    } catch (err) {
      dispatch(openSnackbar({
        open: true,
        message: err?.response?.data?.message || err?.message || 'Failed to save gate pass.',
        variant: 'alert',
        alert: { color: 'error' },
        severity: 'error'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const currentStatus = String(initialData?.statusLabel || initialData?.status || 'OPEN').toUpperCase();
  const isReadOnly = !!initialData?.id && currentStatus !== 'OPEN';

  const handleClear = () => setForm({ ...EMPTY });

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onSave={isReadOnly || isSaving ? undefined : handleSave}
      onClear={isReadOnly ? undefined : handleClear}
      isViewOnly={isReadOnly}
      title={isReadOnly ? 'View Visitor Gate Pass' : (initialData ? 'Edit Visitor Gate Pass' : 'New Visitor Gate Pass')}
      hasId={!!initialData?.id}
      maxWidth="md"
    >
      {/* ── Header Info Bar ─────────────────────────────────────────────── */}
      <InfoBar
        status={initialData?.statusLabel || initialData?.status || 'OPEN'}
        gatePassNo={initialData?.gatePassNo || autoGatePassNo}
        gatePassDate={initialData?.gatePassDate}
        gatePassType={form.gatePassType}
        onChangeType={setField('gatePassType')}
        disabled={isReadOnly}
      />

      {/* ── Section 1: Visitor Info ──────────────────────────────────────── */}
      <BOSFormSection icon={<IconIdBadge2 size={22} color={theme.palette.primary.main} />} title="Visitor Information">
        {/* Mobile No & Visitor Type in same row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <BOSTextField
            label="Mobile No *"
            name="mobileNo"
            type="phone"
            value={form.mobileNo}
            disabled={isReadOnly}
            onChange={(e) => {
              const val = e?.target ? e.target.value : e;
              const code = e?.target?.code || form.isdCode || '+91';
              const local = e?.target?.local || form.localMobileNo || val;
              setForm(prev => ({
                ...prev,
                mobileNo: val,
                isdCode: code,
                localMobileNo: local
              }));
              const digits = (local || val || '').replace(/[^0-9]/g, '');
              if (digits.length >= 10) {
                handleFetchLastVisitor(local || val);
              }
            }}
            onBlur={() => {
              if (form.mobileNo || form.localMobileNo) {
                handleFetchLastVisitor(form.localMobileNo || form.mobileNo);
              }
            }}
            required
            placeholder="Enter Mobile No..."
          />

          <BOSAutocomplete
            label="Visitor Type"
            value={form.visitorType}
            options={VISITOR_TYPES}
            disabled={isReadOnly}
            onChange={(e) => {
              const val = typeof e === 'object' && e?.target ? e.target.value : e;
              const newPurpose = val ? getPurposeForVisitorType(val) : '';
              setForm((prev) => ({
                ...prev,
                visitorType: val,
                partyName: '',
                vendorCode: '',
                emailId: '',
                address: '',
                ...(newPurpose ? { purpose: newPurpose, purposeComments: newPurpose === 'OTHERS' ? prev.purposeComments : '' } : {})
              }));
            }}
            required
          />
        </Box>

        {form.visitorType === 'OTHERS' && (
          <Box sx={{ mt: 1 }}>
            <BOSTextField
              label="Comments"
              value={form.visitorTypeComments}
              disabled={isReadOnly}
              onChange={setField('visitorTypeComments')}
              required
              placeholder="Enter details for OTHERS..."
            />
          </Box>
        )}

        {/* Party Name + Visitor Name in same row if Party Name is present, else Visitor Name full width */}
        {['CUSTOMER', 'SUPPLIER', 'SUBCONTRACTOR'].includes(form.visitorType) ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <BOSAutocomplete
              label="Party Name"
              value={form.partyName}
              disabled={isReadOnly}
              options={partyOptions.map((item) => {
                const name = form.visitorType === 'CUSTOMER'
                  ? (item.customerName || item.ledgerName || item.name || '')
                  : (item.supplierName || item.ledgerName || item.name || '');
                const code = form.visitorType === 'CUSTOMER'
                  ? (item.customerCode || item.code || '')
                  : (item.supplierCode || item.code || '');
                const email = item.emailId || item.mailId || item.email || item.MAIL_ID || item.EMAIL_ID || '';
                const address = item.address || item.ADDRESS || (item.city ? [item.address, item.city, item.state, item.country].filter(Boolean).join(', ') : '') || '';
                const mobileNo = item.mobileNo || item.mobile || item.MOBILE_NO || item.phone || '';
                return {
                  label: `${name}${code ? ' (' + code + ')' : ''}`.trim(),
                  name: name,
                  code: code,
                  email: email,
                  address: address,
                  mobileNo: mobileNo,
                  record: item
                };
              })}
              getOptionLabel={(opt) => {
                if (typeof opt === 'string') return opt;
                return opt?.name || opt?.label || '';
              }}
              filterOptions={(optionsList, params) => {
                const { inputValue } = params;
                const cleanInput = (inputValue || '').trim();
                if (!cleanInput) return optionsList;

                const filtered = optionsList.filter((opt) => {
                  const label = opt.label || opt.name || '';
                  const code = opt.code || '';
                  return label.toLowerCase().includes(cleanInput.toLowerCase()) || code.toLowerCase().includes(cleanInput.toLowerCase());
                });

                const isExactMatch = optionsList.some((opt) => {
                  return (opt.name || '').toLowerCase() === cleanInput.toLowerCase() || (opt.label || '').toLowerCase() === cleanInput.toLowerCase();
                });

                if (!isExactMatch) {
                  filtered.unshift({
                    isCustomAddress: true,
                    value: cleanInput,
                    name: cleanInput,
                    label: cleanInput
                  });
                }
                return filtered;
              }}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                if (option && option.isCustomAddress) {
                  const typeTitle = form.visitorType.charAt(0).toUpperCase() + form.visitorType.slice(1).toLowerCase();
                  return (
                    <li
                      key={key || 'custom-party-' + option.value}
                      {...otherProps}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#e3f2fd',
                        color: '#1565c0',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        margin: '4px 6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: '1px solid #90caf9'
                      }}
                    >
                      <span>New {typeTitle}: <strong style={{ textDecoration: 'underline' }}>{option.value}</strong></span>
                    </li>
                  );
                }
                return (
                  <li key={key || option.code || option.name || option.label} {...otherProps}>
                    {option.label || option.name}
                  </li>
                );
              }}
              onChange={(val) => {
                if (typeof val === 'object' && val !== null) {
                  const pName = val.name || val.value || val.label || '';
                  const pEmail = val.email || val.record?.emailId || val.record?.mailId || '';
                  const pAddress = val.address || val.record?.address || '';
                  const pMobile = val.mobileNo || val.record?.mobileNo || val.record?.mobile || '';

                  setForm((prev) => {
                    const next = {
                      ...prev,
                      partyName: pName,
                      vendorCode: val.code || prev.vendorCode
                    };
                    if (pEmail) next.emailId = pEmail;
                    if (pAddress) next.address = pAddress;
                    if (pMobile) {
                      next.mobileNo = pMobile;
                      next.localMobileNo = pMobile;
                    }
                    return next;
                  });
                } else {
                  setForm((prev) => ({
                    ...prev,
                    partyName: val || ''
                  }));
                }
              }}
              onInputChange={(e, newInputValue) => {
                setForm((prev) => ({
                  ...prev,
                  partyName: newInputValue
                }));
              }}
              freeSolo
              required
              placeholder="Select or enter Party Name..."
            />
            <BOSTextField
              label="Visitor Name"
              value={form.visitorName}
              disabled={isReadOnly}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^\p{L}\p{M}\s]/gu, '');
                setField('visitorName')(e);
              }}
              onKeyDown={(e) => {
                if (/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              required
              placeholder="Enter Visitor Name..."
            />
          </Box>
        ) : (
          <BOSTextField
            label="Visitor Name"
            value={form.visitorName}
            disabled={isReadOnly}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/[^\p{L}\p{M}\s]/gu, '');
              setField('visitorName')(e);
            }}
            onKeyDown={(e) => {
              if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            required
            placeholder="Enter Visitor Name..."
          />
        )}

        {/* Email */}
        <BOSTextField
          label="Email"
          value={form.emailId}
          disabled={isReadOnly}
          onChange={setField('emailId')}
          required
          type="email"
          placeholder="Enter Visitor Email..."
        />

        {/* Address */}
        <BOSTextField
          label="Address"
          value={form.address}
          disabled={isReadOnly}
          onChange={setField('address')}
          required
          multiline
          minRows={2}
          placeholder="Enter Visitor Address..."
        />

        {/* Visitor Date, In Time & Out Time in same row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
          <BOSDatePicker
            label="Visitor Date"
            value={form.visitorDate}
            disabled={isReadOnly}
            onChange={setField('visitorDate')}
            minDate={new Date()}
            disablePast
            required
          />
          <BOSTimePicker
            label="In Time"
            value={form.inTime}
            disabled={isReadOnly}
            onChange={setField('inTime')}
            required
          />
          <BOSTimePicker
            label="Out Time"
            value={form.outTime}
            disabled={isReadOnly}
            onChange={setField('outTime')}
            minTime={form.inTime || undefined}
            minTimeMessage="Out Time must be later than In Time."
            required
          />
        </Box>
      </BOSFormSection>

      {/* ── Section 2: Visit Details ─────────────────────────────────────── */}
      <BOSFormSection icon={<IconIdBadge2 size={22} color={theme.palette.secondary.main} />} title="Visit Details">
        {/* Person to Meet & Purpose in same row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: form.purpose === 'OTHERS' ? '1fr 1fr 1fr' : '1fr 1fr' }, gap: 2 }}>
          <BOSEmployeeAutocomplete
            label="Person to Meet"
            value={form.personToMeet}
            options={employeeList}
            disabled={isReadOnly}
            onChange={(val) => {
              const name = typeof val === 'object' && val !== null ? (val.employeeName || val.name || val.label) : val;
              setForm(prev => ({ ...prev, personToMeet: name || '' }));
            }}
            required
            freeSolo
            placeholder="Search Employee..."
          />
          <BOSAutocomplete
            label="Purpose"
            value={form.purpose}
            disabled={isReadOnly}
            options={form.gatePassType === 'WORK PERMIT' ? WORK_PERMIT_PURPOSE_OPTIONS : PURPOSE_OPTIONS}
            onChange={(e) => {
              const val = typeof e === 'object' && e?.target ? e.target.value : e;
              setForm(prev => ({ ...prev, purpose: val, purposeComments: val === 'OTHERS' ? prev.purposeComments : '' }));
            }}
            required
          />
          {form.purpose === 'OTHERS' && (
            <BOSTextField
              label="Purpose Comments"
              value={form.purposeComments}
              disabled={isReadOnly}
              onChange={setField('purposeComments')}
              required
              placeholder="Enter Purpose Comments..."
            />
          )}
        </Box>

        {/* No. of Persons, Provided Food, and Gadgets in same row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
          <BOSTextField
            label="No. of Persons"
            value={form.noOfPersons}
            disabled={isReadOnly}
            onChange={setField('noOfPersons')}
            required
            type="number"
            inputProps={{ min: 1 }}
            placeholder="0"
          />
          {/* Custom Styled Toggle Card for Provided Food */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.25,
              px: 2,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
              height: 48,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f1f5f9'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary'
                }}
              >
                <IconCookie size={18} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.2, color: 'text.primary' }}>
                  Provided Food
                </Typography>
                <Typography variant="caption" sx={{ color: form.foodAllowance === 'YES' ? 'success.main' : 'text.secondary', fontWeight: 600, fontSize: '0.72rem' }}>
                  {form.foodAllowance === 'YES' ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>
            </Box>
            <Switch
              size="small"
              checked={form.foodAllowance === 'YES'}
              disabled={isReadOnly}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, foodAllowance: e.target.checked ? 'YES' : 'NO' }));
              }}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#fff',
                  '& + .MuiSwitch-track': {
                    backgroundColor: theme.palette.primary.main,
                    opacity: 1
                  }
                }
              }}
            />
          </Box>
          <BOSAutocomplete
            label="Gadgets"
            value={form.gadgets}
            disabled={isReadOnly}
            options={['ALLOWED', 'NOT ALLOWED', 'WILL PROVIDE']}
            onChange={setField('gadgets')}
          />
        </Box>

        {/* Food Category (only when food is YES) */}
        {form.foodAllowance === 'YES' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <BOSAutocomplete
              label="Food Category"
              value={form.foodCategory}
              disabled={isReadOnly}
              options={FOOD_CATEGORY_OPTIONS}
              onChange={setField('foodCategory')}
            />
            <BOSAutocomplete
              label="Food Type"
              value={form.normalFood}
              disabled={isReadOnly}
              onChange={setField('normalFood')}
              options={['VEGETARIAN', 'NON-VEGETARIAN']}
            />
          </Box>
        )}
      </BOSFormSection>

      {/* ── Section 3: Captured Images ─────────────────────────────────────── */}
      {!!initialData?.id && (form.checkInImg || form.checkOutImg) && (
        <BOSFormSection icon={<IconCamera size={22} color={theme.palette.success.main} />} title="Captured Photos">
          <Box sx={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', py: 2 }}>
            {form.checkInImg && (
              <ImagePreviewCard
                title="CHECK-IN PHOTO"
                src={form.checkInImg}
                type="in"
                time={form.checkInTime || form.inTime}
                by={form.checkInBy}
              />
            )}
            {form.checkOutImg && (
              <ImagePreviewCard
                title="CHECK-OUT PHOTO"
                src={form.checkOutImg}
                type="out"
                time={form.checkOutTime || form.outTime}
                by={form.checkOutBy}
              />
            )}
          </Box>
        </BOSFormSection>
      )}

      {/* ── Party Lookup Dialog ─────────────────────────────────────────── */}
      <Dialog open={lookupOpen} onClose={() => setLookupOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
          <Typography variant="h6">{form.visitorType} Details</Typography>
          <IconButton onClick={() => setLookupOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid #e0e0e0' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={lookupSearch}
              onChange={(e) => setLookupSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment>,
              }}
            />
          </Box>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lookupLoading ? (
                  <TableRow><TableCell colSpan={3} align="center">Loading...</TableCell></TableRow>
                ) : (
                  lookupData
                    .filter(row => {
                      const name = form.visitorType === 'CUSTOMER' ? row.customerName : row.supplierName;
                      const code = form.visitorType === 'CUSTOMER' ? row.customerCode : row.supplierCode;
                      const q = lookupSearch.toLowerCase();
                      return (name && name.toLowerCase().includes(q)) || (code && code.toLowerCase().includes(q));
                    })
                    .map((row, i) => (
                      <TableRow
                        key={i}
                        hover
                        onClick={() => handleSelectParty(row)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{form.visitorType === 'CUSTOMER' ? row.customerCode : row.supplierCode}</TableCell>
                        <TableCell>{form.visitorType === 'CUSTOMER' ? row.customerName : row.supplierName}</TableCell>
                        <TableCell>{row.emailId || '-'}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
      </Dialog>
    </BOSFormDialog>
  );
}
