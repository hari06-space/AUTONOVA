import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// material-ui
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Stack,
  Chip,
  Switch,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper,
  Divider,
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project imports
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useAuth from 'hooks/useAuth';
import { setFilterConfig, resetFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { BOSTextField, BOSStatusChip } from 'ui-component/bos';

// assets
import {
  IconSettings,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconIdBadge2,
  IconShoppingCart,
  IconTruckDelivery,
  IconBuildingStore,
  IconReceipt,
  IconFileInvoice,
  IconFileDescription,
  IconSend,
  IconFileText,
  IconChecklist,
  IconUsersGroup,
  IconUser,
  IconCalendar,
  IconAlertCircle
} from '@tabler/icons-react';

// ==============================|| SEARCH FILTER CONFIG ||============================== //

const searchConfig = [
  { id: 'accountYear', label: 'Account Year', type: 'text', placeholder: 'Filter Year...', isStarred: true },
  { id: 'moduleName', label: 'Module / Prefix', type: 'text', placeholder: 'Filter Module or Prefix...', isStarred: true }
];

// ==============================|| MODULE CATEGORIES CONFIG ||============================== //

const MODULE_CATEGORIES = [
  {
    id: 'visitorGatePass',
    label: 'Visitor Gate Pass',
    description: 'Gate pass sequence for visitor management',
    icon: IconIdBadge2,
    color: '#3f51b5',
    prefix: 'visitorGatePassPrefix',
    suffix: 'visitorGatePassSuffix',
    digit: 'visitorGatePassDigit',
    defaultPrefix: 'VGP/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'salesOrder',
    label: 'Sales Order',
    description: 'Sales Order document numbering',
    icon: IconShoppingCart,
    color: '#2196f3',
    prefix: 'salesOrderPrefix',
    suffix: 'salesOrderSuffix',
    digit: 'salesOrderDigit',
    defaultPrefix: 'SO/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'matPo',
    label: 'Material PO',
    description: 'Purchase Order number sequence',
    icon: IconTruckDelivery,
    color: '#4caf50',
    prefix: 'matPoPrefix',
    suffix: 'matPoSuffix',
    digit: 'matPoDigit',
    defaultPrefix: 'PO/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'gateEntry',
    label: 'Gate Entry',
    description: 'Inward material gate entry pass',
    icon: IconBuildingStore,
    color: '#ff9800',
    prefix: 'gateEntryPrefix',
    suffix: 'gateEntrySuffix',
    digit: 'gateEntryDigit',
    defaultPrefix: 'GE/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'grn',
    label: 'Goods Receipt (GRN)',
    description: 'Goods Receipt Note numbering',
    icon: IconReceipt,
    color: '#009688',
    prefix: 'grnPrefix',
    suffix: 'grnSuffix',
    digit: 'grnDigit',
    defaultPrefix: 'GRN/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'invoice',
    label: 'Sales Invoice',
    description: 'Sales invoice billing prefix & suffix',
    icon: IconFileInvoice,
    color: '#e91e63',
    prefix: 'invoicePrefix',
    suffix: 'invoiceSuffix',
    digit: 'invoiceDigit',
    defaultPrefix: 'INV/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'dc',
    label: 'Delivery Receipt (DC)',
    description: 'Delivery receipt document sequence & prefix',
    icon: IconTruckDelivery,
    color: '#0288d1',
    prefix: 'dcPrefix',
    suffix: 'dcSuffix',
    digit: 'dcDigit',
    defaultPrefix: 'DC-',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'qualityInspection',
    label: 'Quality Inspection (QI)',
    description: 'Quality Inspection document numbering',
    icon: IconChecklist,
    color: '#009688',
    prefix: 'qualityInspectionPrefix',
    suffix: 'qualityInspectionSuffix',
    digit: 'qualityInspectionDigit',
    defaultPrefix: 'QI/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'pr',
    label: 'Purchase Request',
    description: 'Internal purchase requisition sequence',
    icon: IconFileDescription,
    color: '#9c27b0',
    prefix: 'prPrefix',
    suffix: 'prSuffix',
    digit: 'prDigit',
    defaultPrefix: 'PR/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'rfq',
    label: 'Supplier RFQ',
    description: 'Request for Quotation sequence',
    icon: IconSend,
    color: '#673ab7',
    prefix: 'rfqPrefix',
    suffix: 'rfqSuffix',
    digit: 'rfqDigit',
    defaultPrefix: 'RFQ/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'quotation',
    label: 'Supplier Quote',
    description: 'Supplier quotation submission tracking',
    icon: IconFileText,
    color: '#00bcd4',
    prefix: 'quotationPrefix',
    suffix: 'quotationSuffix',
    digit: 'quotationDigit',
    defaultPrefix: 'QT/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'negotiation',
    label: 'Negotiation',
    description: 'Price negotiation document sequence',
    icon: IconChecklist,
    color: '#795548',
    prefix: 'negotiationPrefix',
    suffix: 'negotiationSuffix',
    digit: 'negotiationDigit',
    defaultPrefix: 'NEG/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'memo',
    label: 'Employee Memo',
    description: 'HR memo & policy letter sequence',
    icon: IconUsersGroup,
    color: '#607d8b',
    prefix: 'memoPrefix',
    suffix: 'memoSuffix',
    digit: 'memoDigit',
    defaultPrefix: 'MEMO/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'ats',
    label: 'ATS Applicant',
    description: 'Applicant tracking candidate code',
    icon: IconUser,
    color: '#ff5722',
    prefix: 'atsPrefix',
    suffix: 'atsSuffix',
    digit: 'atsDigit',
    defaultPrefix: 'ATS/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'offerLetter',
    label: 'Offer Letter Document No',
    description: 'Offer Letter document numbering sequence',
    icon: IconFileText,
    color: '#009688',
    prefix: 'offerLetterPrefix',
    suffix: 'offerLetterSuffix',
    digit: 'offerLetterDigit',
    defaultPrefix: 'OL/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'task',
    label: 'Task Management',
    description: 'Task document sequence',
    icon: IconChecklist,
    color: '#3f51b5',
    prefix: 'taskPrefix',
    suffix: 'taskSuffix',
    digit: 'taskDigit',
    defaultPrefix: 'TSK/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'ncr',
    label: 'Non-Conformance (NCR)',
    description: 'QMS Non-conformance report sequence',
    icon: IconAlertCircle,
    color: '#f44336',
    prefix: 'ncrPrefix',
    suffix: '',
    digit: 'ncrDigit',
    defaultPrefix: 'NCR/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'ofi',
    label: 'Opportunity For Improvement (OFI)',
    description: 'QMS OFI document sequence',
    icon: IconFileDescription,
    color: '#ffb300',
    prefix: 'ofiPrefix',
    suffix: '',
    digit: 'ofiDigit',
    defaultPrefix: 'OFI/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'observation',
    label: 'QMS Observation',
    description: 'QMS audit observation sequence',
    icon: IconFileText,
    color: '#00acc1',
    prefix: 'observationPrefix',
    suffix: '',
    digit: 'observationDigit',
    defaultPrefix: 'OBS/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'auditSchedule',
    label: 'Audit Schedule',
    description: 'QMS audit schedule document sequence',
    icon: IconCalendar,
    color: '#8e24aa',
    prefix: 'auditSchedulePrefix',
    suffix: 'auditScheduleSuffix',
    digit: 'auditScheduleDigit',
    defaultPrefix: 'AUD/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'auditObservation',
    label: 'Audit Finding / Observation',
    description: 'Audit finding and observation sequence',
    icon: IconFileText,
    color: '#d81b60',
    prefix: 'auditObservationPrefix',
    suffix: 'auditObservationSuffix',
    digit: 'auditObservationDigit',
    defaultPrefix: 'AFO/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'productBundle',
    label: 'Product Bundle',
    description: 'Product bundle document sequence',
    icon: IconBuildingStore,
    color: '#43a047',
    prefix: 'productBundlePrefix',
    suffix: 'productBundleSuffix',
    digit: 'productBundleDigit',
    defaultPrefix: 'BND/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'gpl',
    label: 'General Price List (GPL)',
    description: 'General price list document sequence',
    icon: IconReceipt,
    color: '#fb8c00',
    prefix: 'gplPrefix',
    suffix: '',
    digit: 'priceListDigit',
    defaultPrefix: 'GPL/',
    defaultSuffix: '',
    defaultDigit: 6
  },
  {
    id: 'cpc',
    label: 'Customer Price Code (CPC)',
    description: 'Customer price code document sequence',
    icon: IconFileInvoice,
    color: '#5e35b1',
    prefix: 'cpcPrefix',
    suffix: '',
    digit: 'priceListDigit',
    defaultPrefix: 'CPC/',
    defaultSuffix: '',
    defaultDigit: 6
  }
];

// Helper to convert camelCase to Title Case (e.g. "visitorGatePass" -> "Visitor Gate Pass")
const formatCamelCaseToTitle = (str) => {
  if (!str) return '';
  const result = str.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1).trim();
};

const DYNAMIC_COLORS = ['#3f51b5', '#009688', '#e91e63', '#9c27b0', '#ff9800', '#2196f3', '#4caf50', '#795548', '#607d8b'];

// Helper to format sample sequence e.g. VGP/000001/2026
const getSampleFormat = (prefix, suffix, digit) => {
  const p = prefix || '';
  const s = suffix || '';
  const d = Math.min(Math.max(parseInt(digit) || 6, 1), 10);
  const num = '1'.padStart(d, '0');
  return `${p}${num}${s}`;
};

// ==============================|| PREFIX CREDENTIALS CARD DESIGN ||============================== //

export default function PrefixCredentials() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const perms = usePagePermissions(PAGE_CODES.AD_PREFIX_CREDENTIALS);

  // Redux search states
  const searchQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};

  const [credentialsList, setCredentialsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [cardData, setCardData] = useState(null);
  const [originalCardData, setOriginalCardData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add New Account Year Dialog State
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetYearToDelete, setTargetYearToDelete] = useState(null);

  const getErrorMessage = (err) => {
    if (typeof err === 'string') return err;
    return err?.message || err?.error || err?.detail || 'An error occurred';
  };

  // Register Global Search Config
  useEffect(() => {
    dispatch(setFilterConfig(searchConfig));
    dispatch(resetFilters());
    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
    };
  }, [dispatch]);

  // Fetch all credentials
  const fetchCredentials = async (yearToSelect = null) => {
    try {
      setLoading(true);
      const res = await axios.get('/api/prefix-credentials/all');
      const list = res.data || [];
      setCredentialsList(list);

      if (list.length > 0) {
        const currentYear = new Date().getFullYear();
        const currentAccountYear = `${currentYear}-${currentYear + 1}`;

        // Default to current financial year (e.g. "2026-2027") if available
        const defaultItem = yearToSelect
          ? list.find((c) => c.accountYear === yearToSelect) || list[0]
          : list.find((c) => c.accountYear === currentAccountYear) ||
            list.find((c) => c.status === 1) ||
            list[0];

        setSelectedYear(defaultItem.accountYear);
        setCardData({ ...defaultItem });
        setOriginalCardData({ ...defaultItem });
      } else {
        setSelectedYear('');
        setCardData(null);
        setOriginalCardData(null);
      }
    } catch (err) {
      console.error('Fetch credentials error:', err);
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  // Dynamic Auto-Discovery of Prefix Fields from Backend Data
  const allCategories = useMemo(() => {
    const categoriesMap = new Map();
    MODULE_CATEGORIES.forEach((cat) => {
      categoriesMap.set(cat.prefix, cat);
    });

    const sampleObj = cardData || (credentialsList.length > 0 ? credentialsList[0] : null);
    if (sampleObj && typeof sampleObj === 'object') {
      Object.keys(sampleObj).forEach((key) => {
        if (key.endsWith('Prefix') && !categoriesMap.has(key)) {
          // Extract base name e.g. "dispatchNotePrefix" -> "dispatchNote"
          const baseName = key.slice(0, -6);
          const label = formatCamelCaseToTitle(baseName);

          const suffixKey = Object.keys(sampleObj).find(
            (k) => k.toLowerCase() === `${baseName.toLowerCase()}suffix`
          ) || `${baseName}Suffix`;

          const digitKey = Object.keys(sampleObj).find(
            (k) => k.toLowerCase() === `${baseName.toLowerCase()}digit`
          ) || `${baseName}Digit`;

          const colorIndex = categoriesMap.size % DYNAMIC_COLORS.length;

          const dynamicCategory = {
            id: baseName,
            label,
            description: `${label} document sequence (Auto-Discovered)`,
            icon: IconFileText,
            color: DYNAMIC_COLORS[colorIndex],
            prefix: key,
            suffix: suffixKey,
            digit: digitKey,
            defaultPrefix: `${baseName.substring(0, 3).toUpperCase()}/`,
            defaultSuffix: '',
            defaultDigit: 6
          };

          categoriesMap.set(key, dynamicCategory);
        }
      });
    }

    return Array.from(categoriesMap.values());
  }, [cardData, credentialsList]);

  // Filter credentials list by global search filter if user filters Account Year
  const filteredCredentialsList = useMemo(() => {
    const q = (globalFilters.accountYear || '').toLowerCase().trim();
    if (!q) return credentialsList;
    return credentialsList.filter((c) => c.accountYear.toLowerCase().includes(q));
  }, [credentialsList, globalFilters]);

  // Filter module cards by Redux global search bar query or filter
  const filteredModules = useMemo(() => {
    const q = (searchQuery || globalFilters.moduleName || '').toLowerCase().trim();
    if (!q) return allCategories;
    return allCategories.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (cardData && cardData[m.prefix] && cardData[m.prefix].toLowerCase().includes(q))
    );
  }, [searchQuery, globalFilters, cardData, allCategories]);

  // When selected financial year changes
  const handleSelectYear = (year) => {
    const found = credentialsList.find((c) => c.accountYear === year);
    if (found) {
      setSelectedYear(found.accountYear);
      setCardData({ ...found });
      setOriginalCardData({ ...found });
    }
  };

  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!cardData || !originalCardData) return false;
    return JSON.stringify(cardData) !== JSON.stringify(originalCardData);
  }, [cardData, originalCardData]);

  // Handle module input change
  const handleFieldChange = (field, value) => {
    if (!field) return;
    setCardData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle toggle status directly on Account Year card
  const handleToggleYearStatus = (yearItem, isChecked) => {
    const newStatus = isChecked ? 1 : 0;
    if (cardData && cardData.accountYear === yearItem.accountYear) {
      setCardData((prev) => ({ ...prev, status: newStatus }));
    }
    setCredentialsList((prev) =>
      prev.map((c) => (c.accountYear === yearItem.accountYear ? { ...c, status: newStatus } : c))
    );
  };

  // Save current Account Year credentials
  const handleSaveCurrentYear = async () => {
    if (!cardData || !cardData.accountYear) return;
    setIsSaving(true);

    try {
      const payload = {
        ...cardData,
        status: cardData.status ? 1 : 0,
        updatedBy: user?.id || 'System'
      };

      // Automatically convert any key ending with "Digit" to integer
      Object.keys(payload).forEach((key) => {
        if (key.endsWith('Digit') && payload[key] !== null && payload[key] !== undefined) {
          payload[key] = parseInt(payload[key]) || null;
        }
      });

      await axios.put(`/api/prefix-credentials/update/${cardData.accountYear}`, payload);
      dispatch(
        openSnackbar({
          open: true,
          message: `Prefix credentials for ${cardData.accountYear} updated successfully!`,
          variant: 'alert',
          severity: 'success'
        })
      );
      fetchCredentials(cardData.accountYear);
    } catch (err) {
      console.error('Save error:', err);
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    } finally {
      setIsSaving(false);
    }
  };

  // Open dialog to add new Account Year
  const handleOpenAddDialog = () => {
    const currentYear = new Date().getFullYear();
    const defaultAccountYear = `${currentYear}-${currentYear + 1}`;
    setNewYearInput(defaultAccountYear);
    setAddDialogOpen(true);
  };

  // Create new Account Year
  const handleCreateNewYear = async () => {
    const trimmed = newYearInput.trim();
    if (!trimmed) {
      dispatch(openSnackbar({ open: true, message: 'Account Year is required', variant: 'alert', severity: 'warning' }));
      return;
    }

    const yearRegex = /^\d{4}-\d{4}$/;
    if (!yearRegex.test(trimmed)) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Account Year must be in YYYY-YYYY format (e.g. 2026-2027)',
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    if (credentialsList.some((c) => c.accountYear === trimmed)) {
      dispatch(
        openSnackbar({
          open: true,
          message: `Account Year ${trimmed} already exists!`,
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    try {
      setIsSaving(true);
      const newCredObj = {
        accountYear: trimmed,
        status: 1,
        createdBy: user?.id || 'System'
      };

      // Populate default prefixes for quick setup
      allCategories.forEach((cat) => {
        if (cat.prefix) newCredObj[cat.prefix] = cat.defaultPrefix;
        if (cat.suffix) newCredObj[cat.suffix] = cat.defaultSuffix;
        if (cat.digit) newCredObj[cat.digit] = cat.defaultDigit;
      });

      await axios.post('/api/prefix-credentials/create', newCredObj);
      dispatch(
        openSnackbar({
          open: true,
          message: `Account Year ${trimmed} created successfully!`,
          variant: 'alert',
          severity: 'success'
        })
      );
      setAddDialogOpen(false);
      fetchCredentials(trimmed);
    } catch (err) {
      console.error('Create error:', err);
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Account Year
  const handleDeleteYearClick = (year, e) => {
    e.stopPropagation();
    setTargetYearToDelete(year);
    setDeleteDialogOpen(true);
  };

  const handleDeleteYearConfirm = async () => {
    if (!targetYearToDelete) return;
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/prefix-credentials/${targetYearToDelete}`);
      dispatch(
        openSnackbar({
          open: true,
          message: `Account Year ${targetYearToDelete} deleted successfully`,
          variant: 'alert',
          severity: 'success'
        })
      );
      fetchCredentials();
    } catch (err) {
      console.error('Delete error:', err);
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err), variant: 'alert', severity: 'error' }));
    } finally {
      setTargetYearToDelete(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 125px)', gap: 2, overflow: 'hidden' }}>
      {/* ── TOP HEADER & ACCOUNT YEAR CARD SELECTOR ── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: '16px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.6),
          flexShrink: 0,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.03)'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" spacing={2}>
          {/* Title Branding */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              <IconSettings size={26} />
            </Avatar>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a223f', letterSpacing: '-0.3px' }}>
                Prefix / Suffix Credentials
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                DOCUMENT SEQUENCING & FORMAT CONFIGURATION
              </Typography>
            </Box>
          </Stack>

          {/* Add Year & Save Action */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<IconPlus size={18} />}
              onClick={handleOpenAddDialog}
              disabled={!perms.write}
              sx={{
                height: 40,
                borderRadius: '10px',
                fontWeight: 700,
                textTransform: 'none',
                px: 2.5,
                borderWidth: '1.5px',
                '&:hover': { borderWidth: '1.5px' }
              }}
            >
              New Financial Year
            </Button>

            {selectedYear && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<IconDeviceFloppy size={18} />}
                onClick={handleSaveCurrentYear}
                disabled={!hasUnsavedChanges || isSaving || !perms.write}
                sx={{
                  height: 40,
                  borderRadius: '10px',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                  boxShadow: hasUnsavedChanges ? '0 4px 14px 0 rgba(33, 150, 243, 0.39)' : 'none'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Credentials'}
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Account Year Selector Cards - Horizontal Scrollable Row */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            width: '100%',
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.primary.main, 0.2), borderRadius: 3 }
          }}
        >
          {filteredCredentialsList.length === 0 ? (
            <Chip label="No Account Years configured" color="warning" variant="outlined" />
          ) : (
            filteredCredentialsList.map((item) => {
              const isSelected = selectedYear === item.accountYear;
              const isActiveStatus = item.status === 1;
              return (
                <Card
                  key={item.accountYear}
                  onClick={() => handleSelectYear(item.accountYear)}
                  sx={{
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    transition: 'all 0.25s ease',
                    border: '2px solid',
                    borderColor: isSelected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.6),
                    bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                    boxShadow: isSelected ? '0 4px 12px 0 rgba(33, 150, 243, 0.15)' : 'none',
                    '&:hover': {
                      borderColor: isSelected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.4),
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: '10px 16px !important' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                      {/* Year Icon & Label */}
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ whiteSpace: 'nowrap' }}>
                        <IconCalendar size={18} color={isSelected ? theme.palette.primary.main : '#757575'} />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 800,
                            color: isSelected ? theme.palette.primary.main : '#212121',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.accountYear}
                        </Typography>
                      </Stack>

                      {/* Show Active/Inactive Switch & Delete Button ONLY on the SELECTED / ACTIVE Panel */}
                      {isSelected ? (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Tooltip title={isActiveStatus ? 'Active' : 'Inactive'}>
                            <Switch
                              size="small"
                              checked={isActiveStatus}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleToggleYearStatus(item, e.target.checked)}
                              color="primary"
                            />
                          </Tooltip>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: isActiveStatus ? 'success.main' : 'error.main',
                              minWidth: 42
                            }}
                          >
                            {isActiveStatus ? 'Active' : 'Inactive'}
                          </Typography>

                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => handleDeleteYearClick(item.accountYear, e)}
                            disabled={!perms.delete}
                            title="Delete Financial Year"
                            sx={{ p: 0.5, ml: 0.5 }}
                          >
                            <IconTrash size={16} />
                          </IconButton>
                        </Stack>
                      ) : (
                        <BOSStatusChip status={isActiveStatus ? 'Active' : 'Inactive'} showIcon={false} size="small" />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Stack>
      </Paper>

      {/* ── MAIN CONTENT AREA (DIRECT MODULE CARDS GRID) ── */}
      {cardData ? (
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            pb: 2,
            pr: 0.5
          }}
        >
          {/* Unsaved Changes Banner if applicable */}
          {hasUnsavedChanges && (
            <Box
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                px: 2.5,
                py: 1,
                mb: 2,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: alpha(theme.palette.warning.main, 0.3)
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconAlertCircle size={16} color={theme.palette.warning.dark} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.warning.dark }}>
                  You have unsaved changes for Account Year {cardData.accountYear}. Click "Save Credentials" above to save.
                </Typography>
              </Stack>
            </Box>
          )}

          {/* Module Cards Grid Container */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              gap: 2
            }}
          >
            {filteredModules.map((module) => {
              const IconComp = module.icon;
              const pVal = cardData[module.prefix] || '';
              const sVal = cardData[module.suffix] || '';
              const dVal = cardData[module.digit] || 6;
              const sampleOutput = getSampleFormat(pVal, sVal, dVal);

              return (
                <Card
                  key={module.id}
                  elevation={0}
                  sx={{
                    borderRadius: '14px',
                    border: '1.5px solid',
                    borderColor: alpha(module.color, 0.25),
                    transition: 'all 0.2s ease-in-out',
                    bgcolor: 'background.paper',
                    boxShadow: '0 2px 10px 0 rgba(0,0,0,0.03)',
                    '&:hover': {
                      borderColor: module.color,
                      boxShadow: `0 6px 20px 0 ${alpha(module.color, 0.15)}`,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, pb: '16px !important' }}>
                    {/* Card Header */}
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: alpha(module.color, 0.12),
                          color: module.color,
                          borderRadius: '10px'
                        }}
                      >
                        <IconComp size={20} />
                      </Avatar>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a223f', fontSize: '0.9rem' }} noWrap>
                          {module.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }} noWrap>
                          {module.description}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />

                    {/* Input Fields */}
                    <Grid container spacing={1.5}>
                      <Grid item xs={5}>
                        <BOSTextField
                          fullWidth
                          size="small"
                          label="Prefix"
                          value={pVal}
                          onChange={(e) => handleFieldChange(module.prefix, e.target.value)}
                          placeholder="e.g. VGP/"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ style: { fontWeight: 700 } }}
                        />
                      </Grid>

                      <Grid item xs={4}>
                        <BOSTextField
                          fullWidth
                          size="small"
                          label="Suffix"
                          value={sVal}
                          onChange={(e) => handleFieldChange(module.suffix, e.target.value)}
                          placeholder="e.g. /26"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ style: { fontWeight: 700 } }}
                        />
                      </Grid>

                      <Grid item xs={3}>
                        <BOSTextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Digits"
                          value={dVal}
                          onChange={(e) => handleFieldChange(module.digit, e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: 1, max: 10, style: { fontWeight: 700, textAlign: 'center' } }}
                        />
                      </Grid>
                    </Grid>

                    {/* Live Sample Format Preview */}
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1,
                        borderRadius: '8px',
                        bgcolor: alpha(module.color, 0.06),
                        border: `1px dashed ${alpha(module.color, 0.3)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Live Preview:
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: module.color,
                          letterSpacing: '0.5px'
                        }}
                      >
                        {sampleOutput}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            borderRadius: '16px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.6)
          }}
        >
          <IconAlertCircle size={48} color={theme.palette.text.secondary} />
          <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
            No Account Year Selected
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Click "New Financial Year" above to create your first prefix credentials.
          </Typography>
          <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={handleOpenAddDialog}>
            Add Financial Year
          </Button>
        </Paper>
      )}

      {/* ── CREATE NEW ACCOUNT YEAR DIALOG ── */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#1a223f' }}>Create Financial Year Credential</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <BOSTextField
              fullWidth
              label="Account Year (YYYY-YYYY)"
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              placeholder="e.g. 2026-2027"
              helperText="Format must be YYYY-YYYY"
              inputProps={{ maxLength: 9 }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleCreateNewYear} disabled={isSaving}>
            {isSaving ? 'Creating...' : 'Create Credentials'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── CONFIRM DELETE DIALOG ── */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteYearConfirm}
        title="Delete Financial Year Credentials"
        content={`Are you sure you want to delete prefix credentials for Account Year "${targetYearToDelete}"?`}
      />
    </Box>
  );
}
