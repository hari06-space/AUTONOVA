import axios from 'utils/axios';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import TextField from 'ui-component/CustomTextField';
import { BOSTextField, BOSDatePicker, BOSDataTable, BOSTableToolbar, btnNew, BOSFormSection, btnSave, btnCancel } from 'ui-component/bos';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ClientMasterList from './ClientMasterList';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { exportToExcel } from 'utils/excelExport';
import { Box, Grid, Typography, Button, Divider, Snackbar, Alert, CircularProgress, Avatar, Tooltip, MenuItem, Select, FormControl, InputLabel, FormHelperText, Paper, Chip, Stack, Autocomplete, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItemIcon, ListItemText, ListItemButton, Tabs, Tab, Switch, FormControlLabel, Checkbox } from '@mui/material';
import {
  IconBuilding, IconUpload, IconDeviceFloppy, IconRefresh,
  IconPhoto, IconLogin, IconCheck, IconAlertCircle, IconFolderOpen,
  IconChevronRight, IconArrowLeft, IconFolder, IconDeviceFloppy as IconDrive,
  IconUser, IconCalendar,
  IconSettings2,
  IconLicense,
  IconBrandUnity,
  IconMapPin,
  IconExternalLink,
  IconCurrentLocation,
  IconEye,
  IconEyeOff,
  IconMail,
  IconSend,
  IconCloudDownload,
  IconShieldLock,
  IconBuildingSkyscraper,
  IconPlus,
  IconServer,
  IconFingerprint,
  IconDatabase,
  IconCertificate,
  IconPlugConnected,
  IconLock,
  IconKey,
  IconCopy,
  IconActivity,
  IconChecklist
} from '@tabler/icons-react';
import LoginSecurityTab from './components/LoginSecurityTab';

import { useTheme, alpha, styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { RMap, RMarker } from 'maplibre-react-components';
// maplibre CSS is loaded here (lazy) instead of the global index.jsx so it only
// downloads when this page is visited — saves ~600 KB on every other page.
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-react-components/style.css';
import osm_bright from './osm_bright.json';
import useAuth from 'hooks/useAuth';
import { errorStyle } from 'ui-component/bos';
import { fetchMasterDataCached } from 'utils/masterDataCache';
import useConfig from 'hooks/useConfig';

const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: theme.palette.primary.main,
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color:
        theme.palette.mode === 'light'
          ? theme.palette.grey[100]
          : theme.palette.grey[600],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === 'dark' ? '#39393D' : '#E9E9EA',
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border'], {
      duration: 500,
    }),
  },
}));

const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_API_URL || window.location.origin).replace(/\/+$/, '');

// ─── Static Geo Data ────────────────────────────────────────────────────────
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE'];

const STATES_BY_COUNTRY = {
  India: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
  ],
  'United States': ['California', 'Texas', 'New York', 'Florida', 'Washington', 'Illinois', 'Pennsylvania', 'Ohio'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  Canada: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan'],
  Australia: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania'],
  Germany: ['Bavaria', 'Berlin', 'Hamburg', 'Hesse', 'North Rhine-Westphalia', 'Saxony'],
  France: ['Île-de-France', 'Provence', 'Normandy', 'Brittany', 'Alsace'],
  Singapore: ['Central Region', 'East Region', 'North Region', 'North-East Region', 'West Region'],
  UAE: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
};

const STATE_CODES = {
  'Andhra Pradesh': 37, 'Arunachal Pradesh': 12, 'Assam': 18, 'Bihar': 10,
  'Chhattisgarh': 22, 'Goa': 30, 'Gujarat': 24, 'Haryana': 6, 'Himachal Pradesh': 2,
  'Jharkhand': 20, 'Karnataka': 29, 'Kerala': 32, 'Madhya Pradesh': 23,
  'Maharashtra': 27, 'Manipur': 14, 'Meghalaya': 17, 'Mizoram': 15, 'Nagaland': 13,
  'Odisha': 21, 'Punjab': 3, 'Rajasthan': 8, 'Sikkim': 11, 'Tamil Nadu': 33,
  'Telangana': 36, 'Tripura': 16, 'Uttar Pradesh': 9, 'Uttarakhand': 5,
  'West Bengal': 19, 'Delhi': 7, 'Jammu & Kashmir': 1, 'Ladakh': 38,
};

const CITIES_BY_STATE = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Dharwad'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  'Punjab': ['Chandigarh', 'Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala'],
};

const DEFAULT_CITIES = ['City 1', 'City 2', 'City 3', 'City 4'];

const emptyForm = {
  companyName: '', shortName: '', address: '',
  city: '', state: '', stateCode: '', country: 'India', pincode: '',
  gstIn: '', clientCode: '', dbSourceName: 'AUTONOMA', licRenewalDate: '', licExpiryDate: '',
  logoFileName: '', logInBgFileName: '', directoryPath: 'BOS_DOCUMENTS',
  licExpRemainderDays: 0,
  restoreEnableDays: 7,
  inputCaseStyle: 'CUSTOM',
  registrationNo: '', panNo: '', cinNo: '', phoneNo: '', mobileNo: '', fax: '', emailId: '', website: '', gmaplink: '',
  bankName: '', bankBranch: '', accountNumber: '', ifscCode: '', swiftCode: '', termsAndConditions: '',
  decimalPlaces: 2, currencyCode: 'INR',
  smtpHost: '', smtpPort: 587, smtpUsername: '', smtpPassword: '', smtpSslEnabled: false,
  supportEmail: '', supportPhone: '', auditLogEnabled: false,
  createdBy: '', createdDate: '', updatedBy: '', updatedDate: '',
  defaultRowsPerPage: 50,
  defaultMaxRecords: 100,
  autoLogoutSeconds: 30,
  allowDuplicateScreens: false,
  allowRightClick: true,
  singleActiveSession: false,
  isActive: true,
  // Date & Time Settings
  timeFormat: 'H24',        // 'H24' | 'H12'
  dateFormat: 'DD/MM/YYYY', // 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  weekStartsOn: 'MONDAY',   // 'MONDAY' | 'SUNDAY' | 'SATURDAY'
  appTimezone: 'Asia/Kolkata',
  ocrTenantId: '', ocrClientId: '', ocrClientSecret: '', ocrSharedMailbox: '', ocrProcessedFolder: '',
  esslConnectionType: 'DATABASE',
  esslDatabaseType: 'SQL Server',
  esslServerIp: '',
  esslPort: 1433,
  esslDbName: '',
  esslUsername: '',
  esslPassword: '',
  // License & Subscription Quotas
  licenseKey: '',
  implementedDate: new Date().toISOString().split('T')[0],
  licenseExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  maxUsers: 5,
  maxBranches: 1,
  maxCompanies: 1,
  maxConcurrentLogin: 5,
  maxStorageMb: 1024,
  apiAccess: false,
  mobileAppAccess: false,
  backupEnabled: true,
  // Database Connection Config
  dbType: 'Microsoft SQL Server',
  dbHost: '',
  dbPort: 1433,
  dbName: '',
  dbUsername: '',
  dbPassword: '',
  // Server Host Health Config
  healthMonitoringEnabled: false,
  serverName: '',
  serverIp: '',
  serverPort: '',
  windowsUsername: '',
  windowsPassword: ''
};

// ─── Image Upload Card ───────────────────────────────────────────────────────
function ImageUploadCard({ label, icon: Icon, field, preview, onUpload, uploading, onView }) {
  const theme = useTheme();
  const inputRef = useRef();
  return (
    <Paper
      elevation={0}
      component={motion.div}
      whileHover={{ y: -1, boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.12)}` }}
      whileTap={{ scale: 0.99 }}
      sx={{
        border: '1px dashed',
        borderColor: preview ? theme.palette.primary.light : theme.palette.divider,
        borderRadius: '8px',
        p: 0.7,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
        background: preview
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`
          : 'background.paper',
        '&:hover': { borderColor: theme.palette.primary.main, background: alpha(theme.palette.primary.main, 0.02) }
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { if (e.target.files[0]) onUpload(field, e.target.files[0]); }}
      />
      {preview ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
          <Chip
            label={preview.length > 25 ? preview.slice(0, 25) + '…' : preview}
            size="small" sx={{ height: 22, fontSize: '0.72rem', bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.dark, fontWeight: 600, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2) }}
            icon={<IconCheck size={12} color={theme.palette.primary.main} />}
          />
          <IconButton onClick={(e) => { e.stopPropagation(); onView(preview); }} size="small" sx={{ color: theme.palette.primary.main, p: 0.4 }}>
            <IconEye size={15} />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ py: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          {uploading
            ? <CircularProgress size={18} sx={{ color: theme.palette.primary.main }} />
            : <Icon size={18} stroke={1.5} style={{ color: 'text.secondary' }} />}
          <Typography variant="caption" color="text.primary" fontWeight={600} fontSize="0.75rem">
            {uploading ? 'Uploading…' : `Upload ${label}`}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ClientMaster = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { user } = useAuth();
  const { updateDateTimeSettings } = useConfig();

  const isLevel5Admin = Boolean(user?.userLevel >= 5 || user?.role === 'SUPER_ADMIN' || user?.username === 'admin');
  const perms = {
    loading: false,
    enabled: isLevel5Admin,
    read: isLevel5Admin,
    write: isLevel5Admin,
    delete: isLevel5Admin,
    export: isLevel5Admin
  };
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const isAddRoute = window.location.pathname.includes('/add');
  const isEditRoute = Boolean(routeId);
  const [viewMode, setViewMode] = useState(isAddRoute || isEditRoute ? 'form' : 'list');
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState(0);
  const [originalCaseStyle, setOriginalCaseStyle] = useState('UPPER_CASE');
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [casePromptOpen, setCasePromptOpen] = useState(false);
  const [databaseUpdating, setDatabaseUpdating] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, bg: false });
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserData, setBrowserData] = useState({ currentPath: '', folders: [], roots: [], parentPath: null });
  const [browserLoading, setBrowserLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Map Picker State
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [mapMarker, setMapMarker] = useState({ latitude: 13.0827, longitude: 80.2707 });

  // Test SMTP State
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  // eSSL States
  const [testEsslLoading, setTestEsslLoading] = useState(false);
  const [testEsslResult, setTestEsslResult] = useState(null);
  const [syncEsslLoading, setSyncEsslLoading] = useState(false);
  const [syncEsslResult, setSyncEsslResult] = useState(null);
  const [listDbLoading, setListDbLoading] = useState(false);
  const [dbList, setDbList] = useState([]);
  const [esslConnected, setEsslConnected] = useState(false);

  // Database Connection Test States
  const [isTestingDbConnection, setIsTestingDbConnection] = useState(false);
  const [testDbConnectionSuccessful, setTestDbConnectionSuccessful] = useState(false);
  const [testDbConnectionMessage, setTestDbConnectionMessage] = useState('');
  const [testDbConnectionError, setTestDbConnectionError] = useState('');
  const [availableDatabases, setAvailableDatabases] = useState([]);
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [showEsslPassword, setShowEsslPassword] = useState(false);
  const [showWindowsPassword, setShowWindowsPassword] = useState(false);

  // Client Database Sync States
  const [isSyncingClientDb, setIsSyncingClientDb] = useState(false);
  const [clientDbSyncStatus, setClientDbSyncStatus] = useState(null);
  const dirtyFieldsRef = useRef(new Set());

  // Load country master for phone fields
  useEffect(() => {
    fetchMasterDataCached('/api/admin/countries')
      .then((data) => setCountries(data || []))
      .catch(() => { });
  }, []);

  const handleTestSmtp = async () => {
    if (!testEmailRecipient.trim()) return;
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const token = sessionStorage.getItem('serviceToken') || '';
      const response = await fetch(`${API_BASE}/api/company-profile/test-smtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail: testEmailRecipient.trim(),
          smtpHost: form.smtpHost,
          smtpPort: form.smtpPort ? parseInt(form.smtpPort, 10) : 587,
          smtpUsername: form.smtpUsername,
          smtpPassword: form.smtpPassword,
          smtpSslEnabled: form.smtpSslEnabled
        })
      });
      const data = await response.json();
      setTestEmailResult(data);
      if (data.success) {
        showSnack('Test email sent successfully!', 'success');
      } else {
        showSnack(data.message || 'Failed to send test email', 'error');
      }
    } catch (err) {
      const errMsg = err?.message || 'Error occurred while testing email configuration';
      setTestEmailResult({ success: false, message: errMsg });
      showSnack(errMsg, 'error');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleTestDbConnection = async () => {
    if (!form.dbHost) {
      showSnack('Server / Host is required for database test connection', 'error');
      return;
    }
    setIsTestingDbConnection(true);
    setTestDbConnectionMessage('');
    setTestDbConnectionError('');

    try {
      const payload = {
        dbType: 'Microsoft SQL Server',
        dbHost: String(form.dbHost || '').trim(),
        dbPort: Number(form.dbPort || 1433),
        dbUsername: String(form.dbUsername || '').trim(),
        dbPassword: String(form.dbPassword || '')
      };

      const response = await axios.post('/api/v1/database/test-connection', payload);
      const result = response.data;

      if (result && result.success) {
        setTestDbConnectionSuccessful(true);
        setTestDbConnectionMessage(result.message || '✔ Connection Successful');
        setTestDbConnectionError('');
        const dbs = result.databases || [];
        setAvailableDatabases(dbs);
        if (dbs.length === 0) {
          showSnack('Connection successful, but no databases found on server', 'warning');
        } else {
          showSnack(`✔ Connection Successful! ${dbs.length} database(s) found. Select target database.`, 'success');
        }
      } else {
        const errMsg = result?.message || 'Unable to connect to database server.';
        setTestDbConnectionSuccessful(false);
        setTestDbConnectionMessage('');
        setTestDbConnectionError(errMsg);
        setAvailableDatabases([]);
        showSnack(errMsg, 'error');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Unable to connect to database server.';
      setTestDbConnectionSuccessful(false);
      setTestDbConnectionMessage('');
      setTestDbConnectionError(errMsg);
      showSnack(errMsg, 'error');
    } finally {
      setIsTestingDbConnection(false);
    }
  };

  const handleSyncClientDb = async () => {
    if (!recordId) {
      showSnack('Please save the client profile first before syncing database', 'warning');
      return;
    }
    if (!form.dbHost || !form.dbName) {
      showSnack('Database Server / Host and Database Name are required', 'error');
      return;
    }
    setIsSyncingClientDb(true);
    setClientDbSyncStatus(null);
    try {
      const modifiedFieldsList = Array.from(dirtyFieldsRef.current || []);

      // First save extended config so latest DB credentials are saved in backend
      await axios.put(`/api/company-profile/${recordId}/extended-config`, {
        dbType: form.dbType,
        dbHost: form.dbHost,
        dbPort: form.dbPort,
        dbName: form.dbName,
        dbUsername: form.dbUsername,
        dbPassword: form.dbPassword,
        implementedDate: form.implementedDate,
        expiryDate: form.licenseExpiryDate,
        maxUsers: form.maxUsers,
        maxBranches: form.maxBranches,
        maxCompanies: form.maxCompanies,
        maxConcurrentLogin: form.maxConcurrentLogin,
        maxStorageMb: form.maxStorageMb,
        apiAccess: form.apiAccess,
        mobileAppAccess: form.mobileAppAccess,
        backupEnabled: form.backupEnabled,
        healthMonitoringEnabled: form.healthMonitoringEnabled,
        serverName: form.serverName,
        serverIp: form.serverIp,
        serverPort: form.serverPort,
        windowsUsername: form.windowsUsername,
        windowsPassword: form.windowsPassword,
        modifiedFields: modifiedFieldsList
      });

      const res = await axios.post(`/api/company-profile/${recordId}/sync-client-db`, {
        modifiedFields: modifiedFieldsList
      });
      const sync = res.data;
      setClientDbSyncStatus(sync);
      if (sync && sync.success) {
        if (sync.pulledFields && sync.pulledFields.length > 0) {
          await reloadClientData(recordId);
          showSnack(`✔ Client DB synchronized! (${sync.pulledFields.length} field(s) reverse-synced from Client DB to Main)`, 'success');
        } else {
          dirtyFieldsRef.current.clear();
          showSnack(sync.message || 'Client database synchronized successfully!', 'success');
        }
      } else {
        showSnack(sync?.message || 'Client database synchronization failed.', 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to sync client database';
      setClientDbSyncStatus({ success: false, message: msg });
      showSnack(msg, 'error');
    } finally {
      setIsSyncingClientDb(false);
    }
  };

  const executeSilentSave = async (updatedForm = {}) => {
    if (!recordId) return;
    try {
      const token = sessionStorage.getItem('serviceToken') || '';
      const payload = {
        ...form,
        ...updatedForm,
        dbSourceName: updatedForm.dbName || form.dbName || form.dbSourceName || 'AUTONOMA',
        stateCode: form.stateCode ? parseInt(form.stateCode) : null,
        licExpRemainderDays: form.licExpRemainderDays ? parseInt(form.licExpRemainderDays) : 0,
        restoreEnableDays: form.restoreEnableDays ? parseInt(form.restoreEnableDays) : 0,
        decimalPlaces: form.decimalPlaces ? parseInt(form.decimalPlaces) : 2,
        smtpPort: form.smtpPort ? parseInt(form.smtpPort) : 587,
        licRenewalDate: form.licRenewalDate ? new Date(form.licRenewalDate).toISOString() : null,
        licExpiryDate: form.licExpiryDate ? new Date(form.licExpiryDate).toISOString() : null,
        updatedBy: user?.id || 'SYSTEM',
        defaultRowsPerPage: form.defaultRowsPerPage ? parseInt(form.defaultRowsPerPage, 10) : 50,
        defaultMaxRecords: form.defaultMaxRecords ? parseInt(form.defaultMaxRecords, 10) : 100,
        autoLogoutSeconds: form.autoLogoutSeconds ? parseInt(form.autoLogoutSeconds, 10) : 30,
        allowDuplicateScreens: Boolean(form.allowDuplicateScreens),
        allowRightClick: form.allowRightClick != null ? Boolean(form.allowRightClick) : true,
        singleActiveSession: Boolean(form.singleActiveSession),
        timeFormat: form.timeFormat || 'H24',
        dateFormat: form.dateFormat || 'DD/MM/YYYY',
        weekStartsOn: form.weekStartsOn || 'MONDAY',
        appTimezone: form.appTimezone || 'Asia/Kolkata'
      };
      await fetch(`${API_BASE}/api/company-profile/update/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (recordId && (updatedForm.dbName || form.dbName || form.dbHost)) {
        await axios.put(`/api/company-profile/${recordId}/extended-config`, {
          dbType: updatedForm.dbType || form.dbType,
          dbHost: updatedForm.dbHost || form.dbHost,
          dbPort: updatedForm.dbPort || form.dbPort,
          dbName: updatedForm.dbName || form.dbName,
          dbUsername: updatedForm.dbUsername || form.dbUsername,
          dbPassword: updatedForm.dbPassword || form.dbPassword
        });
      }
    } catch (err) {
      console.warn('Auto-save failed:', err);
    }
  };

  const handleConnect = async () => {
    if (!form.esslServerIp) {
      showSnack('Server IP is required', 'warning');
      return;
    }
    setTestEsslLoading(true);
    setTestEsslResult(null);
    try {
      // Auto-save the currently entered connection credentials first
      await executeSilentSave(form);

      const token = sessionStorage.getItem('serviceToken') || '';
      // 1. Fetch Databases first
      const dbRes = await fetch(`${API_BASE}/api/company-profile/list-databases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          esslServerIp: form.esslServerIp,
          esslPort: form.esslPort ? parseInt(form.esslPort, 10) : 1433,
          esslUsername: form.esslUsername,
          esslPassword: form.esslPassword
        })
      });
      const dbData = await dbRes.json();
      if (dbData.success && Array.isArray(dbData.databases)) {
        setDbList(dbData.databases);

        // 2. If a database name is selected or default is available, test the connection to that database
        const activeDb = form.esslDbName || (dbData.databases.includes('NT_ESSL') ? 'NT_ESSL' : dbData.databases[0]);
        if (activeDb) {
          const testRes = await fetch(`${API_BASE}/api/company-profile/test-essl-connection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              esslConnectionType: 'DATABASE',
              esslDatabaseType: 'SQL Server',
              esslServerIp: form.esslServerIp,
              esslPort: form.esslPort ? parseInt(form.esslPort, 10) : 1433,
              esslDbName: activeDb,
              esslUsername: form.esslUsername,
              esslPassword: form.esslPassword
            })
          });
          const testData = await testRes.json();
          setTestEsslResult(testData);
          if (testData.success) {
            showSnack('Connection successful', 'success');
            setEsslConnected(true);
            const nextForm = { ...form };
            if (!form.esslDbName) {
              nextForm.esslDbName = activeDb;
              setForm(prev => ({ ...prev, esslDbName: activeDb }));
            }
            // Auto-save the selected database name too
            await executeSilentSave(nextForm);
          } else {
            showSnack(testData.message || 'Connection failed', 'error');
            setEsslConnected(false);
          }
        } else {
          showSnack('Databases retrieved. Please select a database.', 'success');
          setTestEsslResult({ success: true, message: 'Databases retrieved successfully.' });
          setEsslConnected(true);
        }
      } else {
        showSnack(dbData.message || 'Failed to connect/list databases', 'error');
        setTestEsslResult({ success: false, message: dbData.message || 'Failed to retrieve databases.' });
        setEsslConnected(false);
      }
    } catch (err) {
      showSnack('Connection error: ' + err.message, 'error');
      setTestEsslResult({ success: false, message: 'Connection error: ' + err.message });
      setEsslConnected(false);
    } finally {
      setTestEsslLoading(false);
    }
  };

  const handleSyncEsslData = async () => {
    if (!form.esslServerIp || !form.esslDbName) {
      showSnack('Server IP and Database Name are required', 'warning');
      return;
    }
    setSyncEsslLoading(true);
    setSyncEsslResult(null);
    try {
      const token = sessionStorage.getItem('serviceToken') || '';
      const res = await fetch(`${API_BASE}/api/company-profile/sync-essl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          esslConnectionType: 'DATABASE',
          esslDatabaseType: 'SQL Server',
          esslServerIp: form.esslServerIp,
          esslPort: form.esslPort ? parseInt(form.esslPort, 10) : 1433,
          esslDbName: form.esslDbName,
          esslUsername: form.esslUsername,
          esslPassword: form.esslPassword
        })
      });
      const data = await res.json();
      setSyncEsslResult(data);
    } catch (err) {
      setSyncEsslResult({ success: false, message: 'Network error: ' + err.message });
    } finally {
      setSyncEsslLoading(false);
    }
  };

  const handleConnectOutlookClick = () => {
    console.log('[handleConnectOutlookClick] Button clicked.');
    const redirectUri = window.location.origin + '/oauth/callback';
    let authUrl = '';

    console.log('[handleConnectOutlookClick] Opening popup synchronously...');
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open('about:blank', 'MicrosoftOAuthPopup', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`);

    if (!popup) {
      console.error('[handleConnectOutlookClick] Popup was blocked by the browser.');
      showSnack('Popup blocked! Please allow popups for this site.', 'error');
      return;
    }

    console.log('[handleConnectOutlookClick] Saving credentials to localStorage.');
    localStorage.setItem('ocr_tenant_id', form.ocrTenantId || '');
    localStorage.setItem('ocr_client_id', form.ocrClientId || '');
    localStorage.setItem('ocr_client_secret', form.ocrClientSecret || '');
    localStorage.setItem('ocr_shared_mailbox', form.ocrSharedMailbox || '');
    localStorage.setItem('ocr_record_id', recordId || '');

    if (form.ocrTenantId && form.ocrClientId) {
      console.log('[handleConnectOutlookClick] Generating auth URL from form inputs.');
      const scope = encodeURIComponent('https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access');
      authUrl = `https://login.microsoftonline.com/${form.ocrTenantId}/oauth2/v2.0/authorize?client_id=${form.ocrClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&prompt=select_account`;
      console.log('[handleConnectOutlookClick] Redirecting popup to:', authUrl);
      popup.location.href = authUrl;
    } else {
      console.log('[handleConnectOutlookClick] Fetching auth URL from backend...');
      const token = sessionStorage.getItem('serviceToken') || '';
      fetch(`${API_BASE}/api/ocr/auth/url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(async (res) => {
          const resData = await res.json();
          if (res.ok && resData.auth_url) {
            authUrl = resData.auth_url + (resData.auth_url.includes('?') ? '&prompt=select_account' : '?prompt=select_account');
            console.log('[handleConnectOutlookClick] Redirecting popup to fetched URL:', authUrl);
            popup.location.href = authUrl;
          } else {
            console.error('[handleConnectOutlookClick] No auth URL in response.');
            popup.close();
            showSnack('Unable to generate authentication URL. Please verify Azure credentials.', 'error');
          }
        })
        .catch((err) => {
          console.error('[handleConnectOutlookClick] Failed to fetch auth URL:', err);
          popup.close();
          showSnack('Failed to fetch auth URL.', 'error');
        });
    }
  };

  const citiesForState = CITIES_BY_STATE[form.state] || DEFAULT_CITIES;
  const statesForCountry = STATES_BY_COUNTRY[form.country] || [];

  // ── Populate form from company record ──
  const populateFormFromData = useCallback((rec) => {
    if (!rec) return;
    if (dirtyFieldsRef.current) {
      dirtyFieldsRef.current.clear();
    }
    setRecordId(rec.id || null);
    setForm({
      companyName: rec.companyName || '',
      shortName: rec.shortName || '',
      address: rec.address || '',
      city: rec.city || '',
      state: rec.state || '',
      stateCode: rec.stateCode != null ? String(rec.stateCode) : '',
      country: rec.country || 'India',
      pincode: rec.pincode || '',
      gstIn: rec.gstIn || '',
      clientCode: rec.clientCode || '',
      dbSourceName: rec.dbSourceName || 'AUTONOMA',
      licRenewalDate: rec.licRenewalDate ? rec.licRenewalDate.slice(0, 10) : '',
      licExpiryDate: rec.licExpiryDate ? rec.licExpiryDate.slice(0, 10) : '',
      logoFileName: rec.logoFileName || '',
      logInBgFileName: rec.logInBgFileName || '',
      directoryPath: rec.directoryPath || 'BOS_DOCUMENTS',
      licExpRemainderDays: rec.licExpRemainderDays || 0,
      restoreEnableDays: rec.restoreEnableDays || 0,
      inputCaseStyle: rec.inputCaseStyle || 'UPPER_CASE',
      decimalPlaces: rec.decimalPlaces != null ? rec.decimalPlaces : 2,
      currencyCode: rec.currencyCode || 'INR',
      registrationNo: rec.registrationNo || '',
      panNo: rec.panNo || '',
      cinNo: rec.cinNo || '',
      phoneNo: rec.phoneNo || '',
      mobileNo: rec.mobileNo || '',
      fax: rec.fax || '',
      emailId: rec.emailId || '',
      website: rec.website || '',
      gmaplink: rec.gmaplink || '',
      bankName: rec.bankName || '',
      bankBranch: rec.bankBranch || '',
      accountNumber: rec.accountNumber || '',
      ifscCode: rec.ifscCode || '',
      swiftCode: rec.swiftCode || '',
      termsAndConditions: rec.termsAndConditions || '',
      smtpHost: rec.smtpHost || '',
      smtpPort: rec.smtpPort != null ? rec.smtpPort : 587,
      smtpUsername: rec.smtpUsername || '',
      smtpPassword: rec.smtpPassword || '',
      smtpSslEnabled: rec.smtpSslEnabled || false,
      supportEmail: rec.supportEmail || '',
      supportPhone: rec.supportPhone || '',
      auditLogEnabled: rec.auditLogEnabled || false,
      createdBy: rec.createdBy || '',
      createdDate: rec.createdDate || '',
      updatedBy: rec.updatedBy || '',
      updatedDate: rec.updatedDate || '',
      defaultRowsPerPage: rec.defaultRowsPerPage != null ? rec.defaultRowsPerPage : 50,
      defaultMaxRecords: rec.defaultMaxRecords != null ? rec.defaultMaxRecords : 100,
      autoLogoutSeconds: rec.autoLogoutSeconds != null ? rec.autoLogoutSeconds : 30,
      allowDuplicateScreens: rec.allowDuplicateScreens || false,
      allowRightClick: rec.allowRightClick != null ? rec.allowRightClick : true,
      singleActiveSession: rec.singleActiveSession || false,
      isActive: rec.isActive !== false,
      timeFormat: rec.timeFormat || 'H24',
      dateFormat: rec.dateFormat || 'DD/MM/YYYY',
      weekStartsOn: rec.weekStartsOn || 'MONDAY',
      appTimezone: rec.appTimezone || 'Asia/Kolkata',
      ocrTenantId: rec.ocrTenantId || rec.ocrConfig?.ocrTenantId || '',
      ocrClientId: rec.ocrClientId || rec.ocrConfig?.ocrClientId || '',
      ocrClientSecret: rec.ocrClientSecret || rec.ocrConfig?.ocrClientSecret || '',
      ocrSharedMailbox: rec.ocrSharedMailbox || rec.ocrConfig?.ocrSharedMailbox || '',
      ocrProcessedFolder: rec.ocrProcessedFolder || rec.ocrConfig?.ocrProcessedFolder || '',
      esslConnectionType: rec.esslConnectionType || 'DATABASE',
      esslDatabaseType: rec.esslDatabaseType || 'SQL Server',
      esslServerIp: rec.esslServerIp || '',
      esslPort: rec.esslPort || 1433,
      esslDbName: rec.esslDbName || '',
      esslUsername: rec.esslUsername || '',
      esslPassword: rec.esslPassword || '',
      // Extended fields
      implementedDate: rec.implementedDate || (rec.licRenewalDate ? rec.licRenewalDate.slice(0, 10) : new Date().toISOString().split('T')[0]),
      licenseExpiryDate: rec.licenseExpiryDate || (rec.licExpiryDate ? rec.licExpiryDate.slice(0, 10) : new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]),
      maxUsers: rec.maxUsers != null ? rec.maxUsers : 5,
      maxBranches: rec.maxBranches != null ? rec.maxBranches : 1,
      maxCompanies: rec.maxCompanies != null ? rec.maxCompanies : 1,
      maxConcurrentLogin: rec.maxConcurrentLogin != null ? rec.maxConcurrentLogin : 5,
      maxStorageMb: rec.maxStorageMb != null ? rec.maxStorageMb : 1024,
      apiAccess: Boolean(rec.apiAccess),
      mobileAppAccess: Boolean(rec.mobileAppAccess),
      backupEnabled: rec.backupEnabled !== false,
      dbType: rec.dbType || 'Microsoft SQL Server',
      dbHost: rec.dbHost || '',
      dbPort: rec.dbPort || 1433,
      dbName: rec.dbName || '',
      dbUsername: rec.dbUsername || '',
      dbPassword: rec.dbPassword || '',
      healthMonitoringEnabled: Boolean(rec.healthMonitoringEnabled),
      serverName: rec.serverName || '',
      serverIp: rec.serverIp || '',
      serverPort: rec.serverPort || '',
      windowsUsername: rec.windowsUsername || '',
      windowsPassword: rec.windowsPassword || ''
    });
    setOriginalCaseStyle(rec.inputCaseStyle || 'UPPER_CASE');
    if (rec.esslDbName) {
      setDbList([rec.esslDbName]);
      setEsslConnected(true);
    }
    if (rec.dbName) {
      setAvailableDatabases(prev => Array.from(new Set([...prev, rec.dbName])));
      setTestDbConnectionSuccessful(true);
    }

    // Also fetch extended config if record has id
    if (rec.id) {
      axios.get(`/api/company-profile/${rec.id}/extended-config`)
        .then(extRes => {
          if (extRes.data && Object.keys(extRes.data).length > 0) {
            const ext = extRes.data;
            setForm(prev => ({
              ...prev,
              licenseKey: ext.licenseKey || prev.licenseKey,
              implementedDate: ext.implementedDate ? ext.implementedDate.slice(0, 10) : prev.implementedDate,
              licenseExpiryDate: ext.expiryDate ? ext.expiryDate.slice(0, 10) : prev.licenseExpiryDate,
              maxUsers: ext.maxUsers != null ? ext.maxUsers : prev.maxUsers,
              maxBranches: ext.maxBranches != null ? ext.maxBranches : prev.maxBranches,
              maxCompanies: ext.maxCompanies != null ? ext.maxCompanies : prev.maxCompanies,
              maxConcurrentLogin: ext.maxConcurrentLogin != null ? ext.maxConcurrentLogin : prev.maxConcurrentLogin,
              maxStorageMb: ext.maxStorageMb != null ? ext.maxStorageMb : prev.maxStorageMb,
              apiAccess: ext.apiAccess != null ? Boolean(ext.apiAccess) : prev.apiAccess,
              mobileAppAccess: ext.mobileAppAccess != null ? Boolean(ext.mobileAppAccess) : prev.mobileAppAccess,
              backupEnabled: ext.backupEnabled != null ? Boolean(ext.backupEnabled) : prev.backupEnabled,
              dbType: ext.dbType || prev.dbType,
              dbHost: ext.dbHost || prev.dbHost,
              dbPort: ext.dbPort || prev.dbPort,
              dbName: ext.dbName || prev.dbName,
              dbUsername: ext.dbUsername || prev.dbUsername,
              dbPassword: ext.dbPassword || prev.dbPassword,
              healthMonitoringEnabled: ext.healthMonitoringEnabled != null ? Boolean(ext.healthMonitoringEnabled) : prev.healthMonitoringEnabled,
              serverName: ext.serverName || prev.serverName,
              serverIp: ext.serverIp || prev.serverIp,
              serverPort: ext.serverPort || prev.serverPort,
              windowsUsername: ext.windowsUsername || prev.windowsUsername,
              windowsPassword: ext.windowsPassword || prev.windowsPassword
            }));
            if (ext.dbName) {
              setAvailableDatabases(prev => Array.from(new Set([...prev, ext.dbName])));
              setTestDbConnectionSuccessful(true);
            }
          }
        })
        .catch(err => {
          console.warn('Extended config fetch skipped/not found:', err);
        });
    }
  }, []);

  const reloadClientData = useCallback(async (targetId) => {
    const idToLoad = targetId || recordId || routeId;
    if (!idToLoad) return;
    try {
      const res = await axios.get(`/api/company-profile/${idToLoad}`);
      if (res.data) {
        populateFormFromData(res.data);
      }
    } catch (err) {
      console.warn('Failed to reload company data:', err);
    }
  }, [recordId, routeId, populateFormFromData]);

  // ── Fetch all companies for Overview Datatable ──
  const fetchAllCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const token = sessionStorage.getItem('serviceToken') || '';
      const res = await fetch(`${API_BASE}/api/company-profile/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCompanies(data);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  // ── Auto-load record if route has ID or is Add route ──
  useEffect(() => {
    if (routeId) {
      setViewMode('form');
      setLoading(true);
      axios.get(`/api/company-profile/${routeId}`)
        .then((res) => {
          if (res.data) populateFormFromData(res.data);
        })
        .catch((err) => {
          console.error('Failed to load company by routeId:', err);
          axios.get('/api/company-profile/all').then((allRes) => {
            const list = Array.isArray(allRes.data) ? allRes.data : [];
            const found = list.find((c) => String(c.id) === String(routeId));
            if (found) populateFormFromData(found);
          });
        })
        .finally(() => setLoading(false));
    } else if (isAddRoute) {
      handleOpenAdd();
    }
  }, [routeId, isAddRoute, populateFormFromData]);

  // ── Open Add New Form ──
  const handleOpenAdd = () => {
    setErrors({});
    setRecordId(null);
    setForm({
      ...emptyForm,
      isActive: true
    });
    setActiveTab(0);
    setViewMode('form');
  };

  // ── Open Edit Form ──
  const handleOpenEdit = async (row) => {
    if (!row) return;
    setErrors({});
    populateFormFromData(row);
    setActiveTab(0);
    setViewMode('form');
    // Fetch latest fresh record from server via axios
    try {
      const res = await axios.get(`/api/company-profile/${row.id}`);
      if (res.data) {
        populateFormFromData(res.data);
      }
    } catch (e) {
      console.warn('Failed to load full company record:', e);
    }
  };

  const handleBackToOverview = () => {
    setViewMode('list');
    navigate('/client-management/client-master');
  };

  // ── Keyboard shortcuts ──
  useKeyboardShortcuts({
    'ctrl+n': () => {
      if (perms.write && viewMode === 'list') {
        handleOpenAdd();
      }
    },
    'escape': () => {
      if (viewMode === 'form') {
        handleBackToOverview();
      }
    },
    'ctrl+s': (e) => {
      if (e) e.preventDefault();
      if (viewMode === 'form' && perms.write && !loading && !databaseUpdating) {
        handleSaveClick();
      }
    }
  });

  // ── Table Columns ──
  const columns = useMemo(() => [
    { id: 'index', label: '#', minWidth: 50 },
    { id: 'clientCode', label: 'Client Code', minWidth: 120, bold: true },
    { id: 'companyName', label: 'Company Name', minWidth: 220 },
    { id: 'shortName', label: 'Short Name', minWidth: 120 },
    { id: 'gstIn', label: 'GST No', minWidth: 150 },
    { id: 'panNo', label: 'PAN No', minWidth: 130 },
    { id: 'emailId', label: 'Primary Email', minWidth: 180 },
    { id: 'mobileNo', label: 'Mobile No', minWidth: 130 },
    { id: 'city', label: 'City', minWidth: 120 },
    { id: 'state', label: 'State', minWidth: 130 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 110,
      format: (val, row) => (
        <Chip
          label={row.isActive !== false ? 'Active' : 'Inactive'}
          size="small"
          color={row.isActive !== false ? 'success' : 'default'}
          sx={{ fontWeight: 600, height: 24 }}
        />
      )
    }
  ], []);

  // ── Overview Data Rows ──
  const overviewRows = useMemo(() => {
    return companies.map((c, i) => ({
      ...c,
      index: i + 1,
      clientCode: c.clientCode || '-',
      companyName: c.companyName || '-',
      shortName: c.shortName || '-',
      gstIn: c.gstIn || '-',
      panNo: c.panNo || '-',
      emailId: c.emailId || '-',
      mobileNo: c.mobileNo || '-',
      city: c.city || '-',
      state: c.state || '-',
      status: c.isActive !== false ? 'Active' : 'Inactive'
    }));
  }, [companies]);

  // ── Search & Filter Config ──
  useEffect(() => {
    if (viewMode === 'list') {
      const config = [
        { id: 'clientCode', label: 'Client Code', type: 'text', isStarred: true },
        { id: 'companyName', label: 'Company Name', type: 'text', isStarred: true },
        { id: 'gstIn', label: 'GST No', type: 'text' },
        { id: 'panNo', label: 'PAN No', type: 'text' },
        { id: 'city', label: 'City', type: 'text' },
        { id: 'state', label: 'State', type: 'text' },
        {
          id: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'All', value: 'ALL' },
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' }
          ]
        }
      ];
      dispatch(setFilterConfig(config));
    } else {
      dispatch(setFilterConfig(null));
    }
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, viewMode]);

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data && event.data.type === 'MS_OAUTH_SUCCESS') {
        if (recordId) {
          fetch(`${API_BASE}/api/company-profile/${recordId}`, {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('serviceToken') || ''}` }
          })
            .then(r => r.json())
            .then(data => populateFormFromData(data))
            .catch(() => {});
        }
        setSnack({ open: true, msg: 'Outlook Account connected successfully!', severity: 'success' });
      } else if (event.data && event.data.type === 'MS_OAUTH_ERROR') {
        setSnack({ open: true, msg: `Authentication failed: ${event.data.error || 'Unknown error'}`, severity: 'error' });
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [recordId, populateFormFromData]);

  const isLowerField = (fieldName) => {
    if (!fieldName) return false;
    const f = fieldName.toLowerCase();
    return f.includes('email') || f.includes('mail') || f.includes('smtp') || f.includes('website') || f.includes('gmap') || f.includes('url') || f.includes('host') || f.includes('path') || f.includes('dir') || f.includes('ip') || f.includes('server');
  };

  // ── Field change ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (dirtyFieldsRef.current) {
      dirtyFieldsRef.current.add(name);
      if (name === 'dbName') {
        dirtyFieldsRef.current.add('dbSourceName');
      }
    }
    let finalValue = value;
    if (name === 'clientCode') {
      finalValue = String(value || '').replace(/\D/g, '').slice(0, 6);
    }
    if (isLowerField(name) && typeof value === 'string' && !name.toLowerCase().includes('password') && name !== 'ocrClientSecret') {
      finalValue = value.toLowerCase();
    }
    setForm(prev => {
      const updated = { ...prev, [name]: finalValue };
      if (name === 'dbName') {
        updated.dbSourceName = finalValue;
      }
      if (name === 'state' && STATE_CODES[value] !== undefined) {
        updated.stateCode = String(STATE_CODES[value]);
      }
      if (name === 'country') { updated.state = ''; updated.city = ''; updated.stateCode = ''; }
      if (name === 'state') { updated.city = ''; }
      if (name === 'licExpiryDate' || name === 'licenseExpiryDate') {
        updated.licExpiryDate = finalValue;
        updated.licenseExpiryDate = finalValue;
        if (!updated.licRenewalDate && !updated.implementedDate) {
          updated.licRenewalDate = new Date().toISOString().split('T')[0];
        }
      }
      if (name === 'implementedDate') {
        updated.licRenewalDate = finalValue;
      }
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleMarkerDrag = (e) => {
    const lngLat = e.target.getLngLat();
    setMapMarker({ latitude: lngLat.lat, longitude: lngLat.lng });
  };

  const openMapDialog = () => {
    let lat = 13.0827, lng = 80.2707;
    if (form.gmaplink) {
      const match = form.gmaplink.match(/q=([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }
    setMapMarker({ latitude: lat, longitude: lng });
    setMapDialogOpen(true);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapMarker({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          showSnack('Location updated to current position!', 'success');
        },
        (error) => {
          showSnack('Unable to retrieve your location.', 'error');
        }
      );
    } else {
      showSnack('Geolocation is not supported by this browser.', 'error');
    }
  };

  const handleMapSave = () => {
    handleChange({
      target: { name: 'gmaplink', value: `https://maps.google.com/?q=${mapMarker.latitude},${mapMarker.longitude}` }
    });
    setMapDialogOpen(false);
  };

  // ── Validation ──
  const validate = () => {
    const e = {};
    let firstErrorTab = null;

    // Tab 0: Client Details
    if (!form.companyName || !form.companyName.trim()) {
      e.companyName = 'Company Name is required';
      if (firstErrorTab === null) firstErrorTab = 0;
    }
    if (!form.clientCode || !String(form.clientCode).trim()) {
      e.clientCode = 'Client Code is mandatory (6 digits)';
      if (firstErrorTab === null) firstErrorTab = 0;
    } else if (!/^\d{6}$/.test(String(form.clientCode).trim())) {
      e.clientCode = 'Client Code must be exactly 6 numeric digits (e.g. 688324)';
      if (firstErrorTab === null) firstErrorTab = 0;
    }
    if (!form.country) {
      e.country = 'Country is required';
      if (firstErrorTab === null) firstErrorTab = 0;
    }
    if (!form.state) {
      e.state = 'State is required';
      if (firstErrorTab === null) firstErrorTab = 0;
    }
    if (!form.city) {
      e.city = 'City is required';
      if (firstErrorTab === null) firstErrorTab = 0;
    }

    // Tab 1: License Validations
    if (!form.implementedDate) {
      e.implementedDate = 'Implemented Date is required';
      if (firstErrorTab === null) firstErrorTab = 1;
    }
    if (!form.licenseExpiryDate) {
      e.licenseExpiryDate = 'License Expiry Date is required';
      if (firstErrorTab === null) firstErrorTab = 1;
    } else if (form.implementedDate && new Date(form.licenseExpiryDate) < new Date(form.implementedDate)) {
      e.licenseExpiryDate = 'Expiry Date cannot be before Implemented Date';
      if (firstErrorTab === null) firstErrorTab = 1;
    }
    if (form.maxUsers == null || form.maxUsers === '' || isNaN(form.maxUsers) || parseInt(form.maxUsers, 10) < 1) {
      e.maxUsers = 'Max Users must be at least 1';
      if (firstErrorTab === null) firstErrorTab = 1;
    }
    if (form.maxBranches == null || form.maxBranches === '' || isNaN(form.maxBranches) || parseInt(form.maxBranches, 10) < 1) {
      e.maxBranches = 'Max Branches must be at least 1';
      if (firstErrorTab === null) firstErrorTab = 1;
    }
    if (form.maxCompanies == null || form.maxCompanies === '' || isNaN(form.maxCompanies) || parseInt(form.maxCompanies, 10) < 1) {
      e.maxCompanies = 'Max Companies must be at least 1';
      if (firstErrorTab === null) firstErrorTab = 1;
    }
    if (form.maxConcurrentLogin == null || form.maxConcurrentLogin === '' || isNaN(form.maxConcurrentLogin) || parseInt(form.maxConcurrentLogin, 10) < 1) {
      e.maxConcurrentLogin = 'Max Concurrent Login must be at least 1';
      if (firstErrorTab === null) firstErrorTab = 1;
    }
    if (form.maxStorageMb == null || form.maxStorageMb === '' || isNaN(form.maxStorageMb) || parseInt(form.maxStorageMb, 10) < 50) {
      e.maxStorageMb = 'Max Storage must be at least 50 MB';
      if (firstErrorTab === null) firstErrorTab = 1;
    }

    setErrors(e);

    if (firstErrorTab !== null) {
      setActiveTab(firstErrorTab);
      const firstKey = Object.keys(e)[0];
      showSnack(e[firstKey] || 'Please resolve validation errors', 'error');
      return false;
    }
    return true;
  };

  // ── Image Upload ──
  const handleImageUpload = async (field, file) => {
    const isLogo = field === 'logoFileName';
    const endpoint = isLogo ? 'upload-logo' : 'upload-bg';
    setUploading(prev => ({ ...prev, [isLogo ? 'logo' : 'bg']: true }));
    try {
      const token = sessionStorage.getItem('serviceToken') || '';
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/api/company-profile/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const updatedFileName = data.fileName;

      setForm(prev => ({ ...prev, [field]: updatedFileName }));
      showSnack(data.message || 'File uploaded!', 'success');

      if (recordId) {
        const payload = {
          ...form,
          [field]: updatedFileName,
          stateCode: form.stateCode ? parseInt(form.stateCode) : null,
          licExpRemainderDays: form.licExpRemainderDays ? parseInt(form.licExpRemainderDays) : 0,
          restoreEnableDays: form.restoreEnableDays ? parseInt(form.restoreEnableDays) : 0,
          licRenewalDate: form.licRenewalDate ? new Date(form.licRenewalDate).toISOString() : null,
          licExpiryDate: form.licExpiryDate ? new Date(form.licExpiryDate).toISOString() : null,
          updatedBy: user?.id || 'SYSTEM'
        };

        await fetch(`${API_BASE}/api/company-profile/update/${recordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (isLogo) {
          window.dispatchEvent(new CustomEvent('companyLogoUpdated', { detail: { fileName: updatedFileName } }));
        }
      }
    } catch (err) {
      showSnack('Upload failed: ' + err.message, 'error');
    } finally {
      setUploading(prev => ({ ...prev, [isLogo ? 'logo' : 'bg']: false }));
    }
  };

  // ── Directory Browser Logic ──
  const fetchDirectory = async (path) => {
    setBrowserLoading(true);
    try {
      const token = sessionStorage.getItem('serviceToken') || '';
      const url = path
        ? `${API_BASE}/api/directory/list?path=${encodeURIComponent(path)}`
        : `${API_BASE}/api/directory/roots`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        showSnack(data.error || 'Could not access this path', 'error');
        if (path) fetchDirectory(null);
        return;
      }

      if (path) {
        setBrowserData(prev => ({
          ...prev,
          currentPath: data.currentPath,
          folders: data.folders || [],
          parentPath: data.parentPath
        }));
      } else {
        setBrowserData({ currentPath: '', folders: [], roots: Array.isArray(data) ? data : [], parentPath: null });
      }
    } catch (err) {
      showSnack('Failed to load directories', 'error');
    } finally {
      setBrowserLoading(false);
    }
  };

  const handleOpenBrowser = () => {
    setBrowserOpen(true);
    fetchDirectory(form.directoryPath || null);
  };

  // ── Save / Update ──
  const handleSaveClick = () => {
    if (!validate()) {
      showSnack('Please fill the mandatory field', 'error');
      return;
    }
    if (form.inputCaseStyle !== originalCaseStyle && form.inputCaseStyle !== 'CUSTOM') {
      setCasePromptOpen(true);
    } else {
      executeSave(false);
    }
  };

  const executeSave = async (updateExistingDb) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('serviceToken') || '';
      const payload = {
        ...form,
        dbSourceName: form.dbName || form.dbSourceName || 'AUTONOMA',
        isActive: form.isActive !== false,
        stateCode: form.stateCode ? parseInt(form.stateCode) : null,
        licExpRemainderDays: form.licExpRemainderDays ? parseInt(form.licExpRemainderDays) : 0,
        restoreEnableDays: form.restoreEnableDays ? parseInt(form.restoreEnableDays) : 0,
        decimalPlaces: form.decimalPlaces ? parseInt(form.decimalPlaces) : 2,
        smtpPort: form.smtpPort ? parseInt(form.smtpPort) : 587,
        licRenewalDate: form.licRenewalDate ? new Date(form.licRenewalDate).toISOString() : null,
        licExpiryDate: form.licExpiryDate ? new Date(form.licExpiryDate).toISOString() : null,
        updatedBy: user?.id || 'SYSTEM',
        defaultRowsPerPage: form.defaultRowsPerPage ? parseInt(form.defaultRowsPerPage, 10) : 50,
        defaultMaxRecords: form.defaultMaxRecords ? parseInt(form.defaultMaxRecords, 10) : 100,
        autoLogoutSeconds: form.autoLogoutSeconds ? parseInt(form.autoLogoutSeconds, 10) : 30,
        allowDuplicateScreens: Boolean(form.allowDuplicateScreens),
        allowRightClick: form.allowRightClick != null ? Boolean(form.allowRightClick) : true,
        singleActiveSession: Boolean(form.singleActiveSession),
        timeFormat: form.timeFormat || 'H24',
        dateFormat: form.dateFormat || 'DD/MM/YYYY',
        weekStartsOn: form.weekStartsOn || 'MONDAY',
        appTimezone: form.appTimezone || 'Asia/Kolkata'
      };

      if (!recordId) {
        payload.createdBy = user?.id || 'SYSTEM';
      }

      let url, method;
      const res = recordId
        ? await axios.put(`/api/company-profile/update/${recordId}`, payload)
        : await axios.post('/api/company-profile/create', payload);
      const saved = res.data;
      setRecordId(saved.id);

      // Save extended config (License, DB, Server)
      let extSync = null;
      try {
        const extRes = await axios.put(`/api/company-profile/${saved.id}/extended-config`, {
          implementedDate: form.implementedDate,
          expiryDate: form.licenseExpiryDate,
          maxUsers: form.maxUsers,
          maxBranches: form.maxBranches,
          maxCompanies: form.maxCompanies,
          maxConcurrentLogin: form.maxConcurrentLogin,
          maxStorageMb: form.maxStorageMb,
          apiAccess: form.apiAccess,
          mobileAppAccess: form.mobileAppAccess,
          backupEnabled: form.backupEnabled,
          dbType: form.dbType,
          dbHost: form.dbHost,
          dbPort: form.dbPort,
          dbName: form.dbName,
          dbUsername: form.dbUsername,
          dbPassword: form.dbPassword,
          healthMonitoringEnabled: form.healthMonitoringEnabled,
          serverName: form.serverName,
          serverIp: form.serverIp,
          serverPort: form.serverPort,
          windowsUsername: form.windowsUsername,
          windowsPassword: form.windowsPassword,
          modifiedFields: Array.from(dirtyFieldsRef.current || [])
        });
        extSync = extRes?.data?.clientDbSync;
        if (dirtyFieldsRef.current) {
          dirtyFieldsRef.current.clear();
        }
      } catch (extErr) {
        console.warn('Extended config save failed:', extErr);
      }

      setOriginalCaseStyle(form.inputCaseStyle);
      window.localStorage.setItem('inputCaseStyle', form.inputCaseStyle);
      window.localStorage.setItem('defaultRowsPerPage', form.defaultRowsPerPage ? String(form.defaultRowsPerPage) : '50');
      window.localStorage.setItem('defaultMaxRecords', form.defaultMaxRecords ? String(form.defaultMaxRecords) : '100');
      window.localStorage.setItem('autoLogoutSeconds', form.autoLogoutSeconds ? String(form.autoLogoutSeconds) : '30');
      // Update Date & Time Settings in ConfigContext (reactive) + localStorage cache
      updateDateTimeSettings({
        timeFormat: form.timeFormat || 'H24',
        dateFormat: form.dateFormat || 'DD/MM/YYYY',
        weekStartsOn: form.weekStartsOn || 'MONDAY',
        timezone: form.appTimezone || 'Asia/Kolkata'
      });

      if (saved.logoFileName || form.logoFileName) {
        window.dispatchEvent(new CustomEvent('companyLogoUpdated', { detail: { fileName: saved.logoFileName || form.logoFileName } }));
      }

      fetchAllCompanies();

      if (updateExistingDb) {
        setDatabaseUpdating(true);
        try {
          await axios.post(`/api/company-profile/update-database-case-style?style=${form.inputCaseStyle}`);
          showSnack('Saved successfully and all existing database records have been transformed!', 'success');
        } catch (e) {
          showSnack('Profile saved, but failed to update existing database records.', 'warning');
        } finally {
          setDatabaseUpdating(false);
        }
      } else {
        if (extSync && !extSync.skipped) {
          if (extSync.success) {
            const actionLabel = extSync.action === 'OVERWRITTEN_DEFAULT'
              ? 'Default company overwritten'
              : extSync.action === 'UPDATED'
                ? 'Existing client record updated'
                : 'New client record inserted';
            showSnack(`✔ Profile saved! Client Database synced (${actionLabel}).`, 'success');
          } else {
            showSnack(`Profile saved centrally. Client DB Sync Warning: ${extSync.message}`, 'warning');
          }
        } else {
          showSnack(recordId ? 'Company updated successfully!' : 'Company created successfully!', 'success');
        }
      }

      setTimeout(() => {
        navigate('/client-management/client-master');
      }, 700);
    } catch (err) {
      showSnack(err.message || 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });


  const fieldProps = (name, label, extra = {}) => {
    const isLower = isLowerField(name);
    let finalLabel = label;
    if (typeof label === 'string' && label.includes('*')) {
      const base = label.replace(/\*/g, '').trim();
      finalLabel = (
        <span>
          {base} <span style={{ color: theme.palette.error.main, fontWeight: 'bold' }}>*</span>
        </span>
      );
    }
    return {
      name, label: finalLabel, value: form[name] || '',
      onChange: handleChange,
      error: !!errors[name],
      helperText: errors[name] || '',
      size: 'small', fullWidth: true,
      ...extra,
      inputProps: {
        ...(isLower ? { style: { textTransform: 'lowercase' } } : {}),
        ...extra.inputProps
      },
      InputProps: {
        style: { color: 'text.primary', fontWeight: 500, ...(isLower ? { textTransform: 'lowercase' } : {}) },
        ...extra.InputProps
      },
      InputLabelProps: {
        shrink: true,
        style: { color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.85rem' },
        ...extra.InputLabelProps
      },
      sx: {
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          bgcolor: extra.InputProps?.readOnly ? alpha(theme.palette.grey[500], 0.05) : theme.palette.background.paper,
          transition: 'all 0.15s',
          '& fieldset': { borderColor: theme.palette.divider },
          '&:hover fieldset': { borderColor: theme.palette.primary.main },
          '&.Mui-focused': {
            bgcolor: 'background.paper',
            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
          },
          '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1.5px' },
          '& input': { py: 0.8, px: 1, fontSize: '0.82rem', width: '100% !important', ...(isLower ? { textTransform: 'lowercase !important' } : {}) },
          '& textarea': { py: 0.8, px: 1, fontSize: '0.82rem' }
        },
        width: '100%',
        ...errorStyle(!!errors[name]),
        ...(extra.sx || {})
      }
    };
  };

  const dropdownProps = (name, label, options, extra = {}) => ({
    name, label, value: form[name], onChange: handleChange,
    error: !!errors[name], helperText: errors[name],
    options, size: 'small', fullWidth: true, ...extra
  });

  const DropdownField = ({ name, label, options, disabled }) => {
    let finalLabel = label;
    if (typeof label === 'string' && label.includes('*')) {
      const baseLabel = label.replace(/\*/g, '').trim();
      finalLabel = (
        <span>
          {baseLabel} <span style={{ color: theme.palette.error.main, fontWeight: 'bold' }}>*</span>
        </span>
      );
    }
    return (
      <Autocomplete
        fullWidth
        size="small"
        disabled={disabled}
        options={options}
        value={form[name] || null}
        onChange={(event, newValue) => {
          handleChange({ target: { name, value: newValue || '' } });
        }}
        isOptionEqualToValue={(option, value) => option === value || value === ""}
        renderInput={(params) => (
          <TextField
            {...params}
            label={finalLabel}
            required={false}
            error={!!errors[name]}
            helperText={errors[name]}
            InputLabelProps={{ shrink: true, style: { color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.85rem' } }}
            placeholder={disabled ? 'Select State first' : `Select ${typeof label === 'string' ? label.replace(/\*/g, '').trim() : label}`}
            sx={[{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                bgcolor: disabled ? alpha(theme.palette.grey[500], 0.06) : theme.palette.background.paper,
                transition: 'all 0.2s',
                '& fieldset': { borderColor: theme.palette.divider },
                '&:hover fieldset': { borderColor: disabled ? theme.palette.divider : theme.palette.primary.main },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                },
                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1.5px' },
                '& input': { py: 0.8, px: 1, fontSize: '0.82rem' }
              }
            }, errorStyle(!!errors[name])]}
          />
        )}
      />
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
  };

  const tabs = [
    { label: 'Client Details', icon: IconBuildingSkyscraper, index: 0, desc: 'Profile, Legal, Address, Communications & Branding' },
    { label: 'License Details', icon: IconCertificate, index: 1, desc: 'License Duration, Quotas, Permissions & Expiry Tracking' },
    { label: 'Database Details', icon: IconDatabase, index: 2, desc: 'Primary SQL Server & eSSL Biometric Database Connections' },
    { label: 'Server Details', icon: IconServer, index: 3, desc: 'Host Machine & Outbound SMTP Mail Relay' },
    { label: 'Client App Config', icon: IconSettings2, index: 4, desc: 'Document Storage, Timezone, Localization & Security Whitelist' },
    { label: 'OCR & Mailbox', icon: IconMail, index: 5, desc: 'Microsoft Outlook SSO & AI Invoice OCR' }
  ];

  if (!user || (!isLevel5Admin && user.userLevel < 5)) {
    return <Navigate to="/access-denied" replace />;
  }

  if (viewMode === 'list') {
    return (
      <ClientMasterList
        onNew={() => {
          handleOpenAdd();
          navigate('/client-management/client-master/add');
        }}
        onEdit={(row) => {
          handleOpenEdit(row);
          navigate(`/client-management/client-master/edit/${row.id}`);
        }}
      />
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 1.5 }, background: 'background.default', height: 'calc(100vh - 75px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top Header Bar ── */}
      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          px: 2,
          py: 0.8,
          mb: 1,
          borderRadius: '10px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        {/* Left: Brand Identity & Active Toggle */}
        <Box display="flex" alignItems="center" gap={1.2}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              color: '#fff',
              width: 38,
              height: 38,
              borderRadius: '9px',
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.35)}`
            }}
          >
            <IconBuildingSkyscraper size={22} />
          </Avatar>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h4" fontWeight="800" sx={{
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
                fontSize: '1.15rem'
              }}>
                Client Master
              </Typography>
              <Chip
                label={recordId ? 'Edit Client' : 'New Client'}
                size="small"
                color={recordId ? 'primary' : 'success'}
                sx={{ height: 20, fontWeight: 700, fontSize: '0.7rem' }}
              />
              {/* Sleek Active / Inactive Quick Toggle */}
              <Tooltip title="Click to toggle Client Active / Inactive status" arrow>
                <Chip
                  label={form.isActive !== false ? 'Active' : 'Inactive'}
                  size="small"
                  onClick={() => setForm(p => ({ ...p, isActive: p.isActive === false }))}
                  sx={{
                    height: 20,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    bgcolor: form.isActive !== false ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
                    color: form.isActive !== false ? 'success.dark' : 'text.secondary',
                    border: '1px solid',
                    borderColor: form.isActive !== false ? alpha(theme.palette.success.main, 0.3) : 'divider',
                    '&:hover': {
                      bgcolor: form.isActive !== false ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.grey[500], 0.2)
                    }
                  }}
                  icon={
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: form.isActive !== false ? 'success.main' : 'grey.400',
                        boxShadow: form.isActive !== false ? `0 0 5px ${theme.palette.success.main}` : 'none'
                      }}
                    />
                  }
                />
              </Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', lineHeight: 1.2, mt: 0.2 }}>
              {form.companyName ? `${form.companyName} (${form.clientCode || 'No Code'})` : 'Configure client organization identity & integrations'}
            </Typography>
          </Box>
        </Box>

        {/* Right: Actions */}
        <Box display="flex" alignItems="center" gap={1.2}>
          <Tooltip title={shortcutTooltip('Back', 'Esc')}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<IconArrowLeft size={18} />}
              onClick={handleBackToOverview}
              sx={btnCancel}
            >
              Back
            </Button>
          </Tooltip>

          {perms.write && (
            <Tooltip title={shortcutTooltip('Save', 'Ctrl + S')}>
              <Button
                variant="contained"
                color="success"
                startIcon={loading || databaseUpdating ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={18} />}
                onClick={handleSaveClick}
                disabled={loading || databaseUpdating || !perms.write}
                sx={btnSave}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </Tooltip>
          )}
        </Box>
      </Paper>

      {/* ── Modern Dedicated 5-Tab Bar ── */}
      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          px: 1.5,
          py: 0.5,
          mb: 1,
          borderRadius: '10px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 38,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              bgcolor: theme.palette.primary.main
            }
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.index;
            return (
              <Tab
                key={tab.index}
                value={tab.index}
                icon={<Icon size={17} />}
                iconPosition="start"
                label={tab.label}
                sx={{
                  minHeight: 36,
                  py: 0.5,
                  px: 2.2,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: isSel ? 700 : 500,
                  fontSize: '0.82rem',
                  color: isSel ? `${theme.palette.primary.main} !important` : 'text.secondary',
                  bgcolor: isSel ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                  transition: 'all 0.15s',
                  mr: 0.8,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    color: theme.palette.primary.main
                  }
                }}
              />
            );
          })}
        </Tabs>
      </Paper>

      {/* ── Tab Content Area ── */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ height: '100%' }}
          >
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '10px',
                p: { xs: 1.5, md: 2 },
                bgcolor: 'background.paper',
                boxShadow: 'none',
                height: '100%',
                overflowY: 'auto',
                pr: 1.5,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: '6px'
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: alpha(theme.palette.primary.main, 0.4)
                }
              }}
            >
              <Box component={motion.div} variants={containerVariants} initial="hidden" animate="show">

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB 0: CLIENT DETAILS                                           */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 0 && (
                  <Stack spacing={1.5}>
                    {/* Card 1: Company Profile & Legal Identity */}
                    <BOSFormSection
                      icon={<IconBuildingSkyscraper size={20} color={theme.palette.primary.main} />}
                      title="Primary Company Profile & Legal Identity"
                      defaultOpen={true}
                    >
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6} md={2}>
                          <TextField
                            {...fieldProps('clientCode', 'Client Code *')}
                            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
                            placeholder="6 digits (e.g. 688324)"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <TextField {...fieldProps('companyName', 'Legal Company Name *')} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField {...fieldProps('shortName', 'Short Name')} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField {...fieldProps('registrationNo', 'Reg No')} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField {...fieldProps('gstIn', 'GST IN')} inputProps={{ maxLength: 15 }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField {...fieldProps('panNo', 'PAN No')} inputProps={{ maxLength: 10 }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField {...fieldProps('cinNo', 'CIN No')} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField {...fieldProps('msmeNo', 'MSME / Udyam No')} />
                        </Grid>
                      </Grid>
                    </BOSFormSection>

                    {/* Middle Section: Registered Address & Communications Side-by-Side (Zero Wasted Space) */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5, alignItems: 'start' }}>
                      {/* Left Column: Registered Address */}
                      <BOSFormSection
                        icon={<IconMapPin size={20} color={theme.palette.primary.main} />}
                        title="Registered Official Address"
                        defaultOpen={true}
                      >
                        <Stack spacing={1.2}>
                          <TextField {...fieldProps('address', 'Full Street Address')} multiline rows={2} fullWidth inputProps={{ maxLength: 500 }} />
                          <Grid container spacing={1.2}>
                            <Grid item xs={12} sm={6}>
                              <DropdownField name="country" label="Country *" options={COUNTRIES} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <DropdownField name="state" label="State/Province *" options={statesForCountry} disabled={!form.country} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <DropdownField name="city" label="City *" options={citiesForState} disabled={!form.state} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField {...fieldProps('pincode', 'Postal Code')} inputProps={{ maxLength: 6 }} />
                            </Grid>
                          </Grid>
                          <TextField
                            name="gmaplink"
                            value={form.gmaplink || ''}
                            onChange={handleChange}
                            placeholder="Google Maps link or latitude, longitude"
                            size="small"
                            label="Location Map Link"
                            InputLabelProps={{ shrink: true, style: { color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.85rem' } }}
                            InputProps={{
                              style: { color: 'text.primary', fontWeight: 500 },
                              endAdornment: (
                                <InputAdornment position="end">
                                  {form.gmaplink && (
                                    <Tooltip title="View on Google Maps">
                                      <IconButton sx={{ color: theme.palette.info.main, p: 0.3 }} onClick={() => window.open(form.gmaplink, '_blank')} size="small">
                                        <IconExternalLink size={16} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Pick Location on Interactive Map">
                                    <IconButton sx={{ color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1), p: 0.3 }} onClick={openMapDialog} size="small">
                                      <IconMapPin size={16} />
                                    </IconButton>
                                  </Tooltip>
                                </InputAdornment>
                              )
                            }}
                          />
                        </Stack>
                      </BOSFormSection>

                      {/* Right Column: Corporate Communications & Contacts */}
                      <BOSFormSection
                        icon={<IconMail size={20} color={theme.palette.primary.main} />}
                        title="Corporate Communications & Contacts"
                        defaultOpen={true}
                      >
                        <Grid container spacing={1.2}>
                          <Grid item xs={12} sm={6}>
                            <TextField {...fieldProps('emailId', 'Primary Email Address')} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField {...fieldProps('website', 'Company Official Website')} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField {...fieldProps('mobileNo', 'Mobile Number')} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField {...fieldProps('phoneNo', 'Landline Number')} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField {...fieldProps('supportEmail', 'Customer Support Email')} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField {...fieldProps('supportPhone', 'Support Helpline Phone')} />
                          </Grid>
                        </Grid>
                      </BOSFormSection>
                    </Box>

                    {/* Card 3: Branding & Visual Identity */}
                    <BOSFormSection
                      icon={<IconPhoto size={20} color={theme.palette.primary.main} />}
                      title="Branding & Visual Identity"
                      defaultOpen={true}
                    >
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" sx={{ mb: 0.8, display: 'block', color: 'text.primary', fontWeight: 700, fontSize: '0.78rem' }}>
                            Primary Organization Logo (Header & Reports)
                          </Typography>
                          <ImageUploadCard label="Company Logo" icon={IconPhoto} field="logoFileName" preview={form.logoFileName} onUpload={handleImageUpload} uploading={uploading.logo} onView={setPreviewImage} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ mb: 0.8, display: 'block', color: 'text.primary', fontWeight: 700, fontSize: '0.78rem' }}>
                            Login Background Wallpaper (Sign-in Backdrop)
                          </Typography>
                          <ImageUploadCard label="Login Background" icon={IconLogin} field="logInBgFileName" preview={form.logInBgFileName} onUpload={handleImageUpload} uploading={uploading.bg} onView={setPreviewImage} />
                        </Box>
                      </Box>
                    </BOSFormSection>
                  </Stack>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB 1: LICENSE DETAILS                                          */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 1 && (
                  <Stack spacing={2}>
                    {/* Live License Expiry Status Banner */}
                    {(() => {
                      const expVal = form.licenseExpiryDate || form.licExpiryDate;
                      const expiry = expVal ? new Date(expVal) : null;
                      const today = new Date();
                      const daysLeft = expiry ? Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)) : 0;
                      const warnDays = form.licExpRemainderDays ? parseInt(form.licExpRemainderDays, 10) : 30;

                      if (daysLeft <= 0) {
                        return (
                          <Alert
                            severity="error"
                            icon={<IconAlertCircle size={20} />}
                            sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem' }}
                          >
                            License Expired! The client license expired on {expVal || 'N/A'}. Platform access is restricted or subject to the grace period ({form.restoreEnableDays || 7} days).
                          </Alert>
                        );
                      }
                      if (daysLeft <= warnDays) {
                        return (
                          <Alert
                            severity="warning"
                            icon={<IconAlertCircle size={20} />}
                            sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem' }}
                          >
                            License Expiry Notice: Only {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining until license expiration on {expVal}. Please renew or extend the license.
                          </Alert>
                        );
                      }
                      return (
                        <Alert
                          severity="success"
                          icon={<IconCheck size={20} />}
                          sx={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem' }}
                        >
                          License is Active & Valid. {daysLeft} days remaining (expires on {expVal}). All system entitlements and quotas are fully unlocked.
                        </Alert>
                      );
                    })()}

                    {/* Card 1: License Duration & Expiry Tracking */}
                    <BOSFormSection
                      icon={<IconCertificate size={20} color={theme.palette.primary.main} />}
                      title="License Duration & Expiry Tracking"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs={12} md={4}>
                          <BOSDatePicker
                            label="Implemented Date *"
                            name="implementedDate"
                            value={form.implementedDate || ''}
                            onChange={handleChange}
                            highlightHolidays={false}
                            blockHolidays={false}
                            error={!!errors.implementedDate}
                            helperText={errors.implementedDate}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <BOSDatePicker
                            label="License Expiry Date *"
                            name="licenseExpiryDate"
                            value={form.licenseExpiryDate || ''}
                            onChange={handleChange}
                            highlightHolidays={false}
                            blockHolidays={false}
                            error={!!errors.licenseExpiryDate}
                            helperText={errors.licenseExpiryDate}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          {(() => {
                            const expVal = form.licenseExpiryDate || form.licExpiryDate;
                            const expiry = expVal ? new Date(expVal) : null;
                            const today = new Date();
                            const daysLeft = expiry ? Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)) : 0;
                            const isExpired = daysLeft <= 0;
                            const isWarning = daysLeft > 0 && daysLeft <= (form.licExpRemainderDays ? parseInt(form.licExpRemainderDays, 10) : 30);

                            return (
                              <Box
                                sx={{
                                  p: 1.2,
                                  borderRadius: '10px',
                                  border: '1px solid',
                                  borderColor: isExpired ? theme.palette.error.light : isWarning ? theme.palette.warning.light : theme.palette.success.light,
                                  bgcolor: isExpired ? alpha(theme.palette.error.main, 0.08) : isWarning ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.success.main, 0.08),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  px: 2
                                }}
                              >
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={700} fontSize="0.68rem" sx={{ letterSpacing: '0.04em' }}>
                                    DAYS REMAINING
                                  </Typography>
                                  <Typography
                                    variant="h5"
                                    fontWeight={800}
                                    sx={{ color: isExpired ? 'error.main' : isWarning ? 'warning.dark' : 'success.dark', lineHeight: 1.2 }}
                                  >
                                    {isNaN(daysLeft) ? 0 : daysLeft} {daysLeft === 1 ? 'Day' : 'Days'}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={isExpired ? 'EXPIRED' : isWarning ? 'EXPIRING SOON' : 'ACTIVE'}
                                  size="small"
                                  sx={{
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    color: isExpired ? '#dc2626' : isWarning ? '#b45309' : '#15803d',
                                    bgcolor: isExpired ? '#fee2e2' : isWarning ? '#fef3c7' : '#dcfce7',
                                    border: `1px solid ${isExpired ? '#fca5a5' : isWarning ? '#fde68a' : '#86efac'}`
                                  }}
                                />
                              </Box>
                            );
                          })()}
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Enterprise License Key / Security Token"
                            value={form.licenseKey || (recordId ? 'AUTONOMA-LIC-' + String(form.clientCode || 'DEV').toUpperCase() + '-' + String(recordId).padStart(4, '0') : 'AUTO-GENERATED ON SAVE')}
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <IconKey size={18} color={theme.palette.primary.main} />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Tooltip title="Copy License Key">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        const keyToCopy = form.licenseKey || ('AUTONOMA-LIC-' + String(form.clientCode || 'DEV').toUpperCase() + '-' + String(recordId || '0001').padStart(4, '0'));
                                        navigator.clipboard.writeText(keyToCopy);
                                        showSnack('License Key copied to clipboard!', 'success');
                                      }}
                                    >
                                      <IconCopy size={16} />
                                    </IconButton>
                                  </Tooltip>
                                </InputAdornment>
                              )
                            }}
                            InputLabelProps={{ shrink: true, style: { color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.85rem' } }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                bgcolor: alpha(theme.palette.grey[500], 0.04),
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                fontSize: '0.82rem'
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </BOSFormSection>

                    {/* Card 2: Resource Quotas & System Limits */}
                    <BOSFormSection
                      icon={<IconServer size={20} color={theme.palette.primary.main} />}
                      title="Resource Quotas & System Limits"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <TextField {...fieldProps('maxUsers', 'Max Users *')} type="number" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <TextField {...fieldProps('maxBranches', 'Max Branches *')} type="number" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <TextField {...fieldProps('maxCompanies', 'Max Companies *')} type="number" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <TextField {...fieldProps('maxConcurrentLogin', 'Max Concurrent Logins *')} type="number" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <TextField {...fieldProps('maxStorageMb', 'Max Storage (MB) *')} type="number" />
                        </Grid>
                      </Grid>
                    </BOSFormSection>

                    {/* Card 3: Feature Permissions & Access Controls */}
                    <BOSFormSection
                      icon={<IconShieldLock size={20} color={theme.palette.primary.main} />}
                      title="Feature Permissions & Access Controls"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} fontSize="0.82rem">API Access</Typography>
                              <Typography variant="caption" color="text.secondary">REST API integration access</Typography>
                            </Box>
                            <IOSSwitch
                              checked={Boolean(form.apiAccess)}
                              onChange={(e) => handleChange({ target: { name: 'apiAccess', value: e.target.checked } })}
                            />
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} fontSize="0.82rem">Mobile App Access</Typography>
                              <Typography variant="caption" color="text.secondary">iOS & Android mobile logins</Typography>
                            </Box>
                            <IOSSwitch
                              checked={Boolean(form.mobileAppAccess)}
                              onChange={(e) => handleChange({ target: { name: 'mobileAppAccess', value: e.target.checked } })}
                            />
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} fontSize="0.82rem">Automatic Backup</Typography>
                              <Typography variant="caption" color="text.secondary">Daily scheduled DB dumps</Typography>
                            </Box>
                            <IOSSwitch
                              checked={form.backupEnabled !== false}
                              onChange={(e) => handleChange({ target: { name: 'backupEnabled', value: e.target.checked } })}
                            />
                          </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} fontSize="0.82rem">Global Audit Logs</Typography>
                              <Typography variant="caption" color="text.secondary">Audit history tracking</Typography>
                            </Box>
                            <IOSSwitch
                              checked={Boolean(form.auditLogEnabled)}
                              onChange={(e) => handleChange({ target: { name: 'auditLogEnabled', value: e.target.checked } })}
                            />
                          </Paper>
                        </Grid>
                      </Grid>
                    </BOSFormSection>

                    {/* Card 4: Expiry Notice & Grace Policies */}
                    <BOSFormSection
                      icon={<IconCertificate size={20} color={theme.palette.primary.main} />}
                      title="License Expiry Alerts & Grace Period Policies"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={6}>
                          <TextField {...fieldProps('licExpRemainderDays', 'License Expiry Warning (Days)')} type="number" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                          <TextField {...fieldProps('restoreEnableDays', 'Grace Period / Restore Limit (Days)')} type="number" />
                        </Grid>
                      </Grid>
                    </BOSFormSection>
                  </Stack>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB 2: DATABASE DETAILS (SQL Server & eSSL Biometric)           */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 2 && (
                  <Stack spacing={2}>
                    {/* Panel 1: Primary ERP SQL Server Database Connection */}
                    <BOSFormSection
                      icon={<IconDatabase size={20} color={theme.palette.primary.main} />}
                      title="Primary SQL Server Database Connection & Live Verification"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2} sx={{ mb: 1 }}>
                        {/* Row 1: Credentials (Exact 12-col layout) */}
                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Database Type *</InputLabel>
                            <Select
                              name="dbType"
                              value={form.dbType || 'Microsoft SQL Server'}
                              label="Database Type *"
                              onChange={handleChange}
                              sx={{ borderRadius: '8px' }}
                            >
                              <MenuItem value="Microsoft SQL Server">Microsoft SQL Server</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            {...fieldProps('dbHost', 'Server / Host *')}
                            placeholder="e.g. boss.autonomasys.com"
                            onChange={(e) => {
                              handleChange(e);
                              setTestDbConnectionSuccessful(false);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                          <TextField
                            {...fieldProps('dbPort', 'Port *')}
                            type="number"
                            placeholder="1433"
                            onChange={(e) => {
                              handleChange(e);
                              setTestDbConnectionSuccessful(false);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                          <TextField
                            {...fieldProps('dbUsername', 'Username *')}
                            placeholder="e.g. sa"
                            onChange={(e) => {
                              handleChange(e);
                              setTestDbConnectionSuccessful(false);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                          <TextField
                            {...fieldProps('dbPassword', 'Password *')}
                            type={showDbPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            onChange={(e) => {
                              handleChange(e);
                              setTestDbConnectionSuccessful(false);
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={() => setShowDbPassword(!showDbPassword)} edge="end" sx={{ color: 'text.secondary', p: 0.4 }}>
                                    {showDbPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>

                        {/* Row 2: Test Button + Database Selector + Sync to Client DB + Status Alert */}
                        <Grid item xs={12} sm={6} md={2}>
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={isTestingDbConnection}
                            onClick={handleTestDbConnection}
                            startIcon={isTestingDbConnection ? <CircularProgress size={14} color="inherit" /> : <IconPlugConnected size={16} />}
                            sx={{ height: 38, textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: '0.82rem' }}
                          >
                            {isTestingDbConnection ? 'Testing...' : 'Test Connection'}
                          </Button>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Database Name *</InputLabel>
                            <Select
                              name="dbName"
                              value={form.dbName || ''}
                              label="Database Name *"
                              onChange={(e) => {
                                handleChange(e);
                                executeSilentSave({ dbName: e.target.value, dbSourceName: e.target.value });
                              }}
                              sx={{ borderRadius: '8px' }}
                            >
                              <MenuItem value=""><em>None</em></MenuItem>
                              {form.dbName && !availableDatabases.includes(form.dbName) && (
                                <MenuItem value={form.dbName}>{form.dbName}</MenuItem>
                              )}
                              {availableDatabases.map((db) => (
                                <MenuItem key={db} value={db}>{db}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={2.5}>
                          <Button
                            variant="contained"
                            color="secondary"
                            fullWidth
                            disabled={isSyncingClientDb || !form.dbHost || !form.dbName}
                            onClick={handleSyncClientDb}
                            startIcon={isSyncingClientDb ? <CircularProgress size={14} color="inherit" /> : <IconRefresh size={16} />}
                            sx={{ height: 38, textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: '0.82rem' }}
                          >
                            {isSyncingClientDb ? 'Syncing...' : 'Sync to Client DB'}
                          </Button>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4.5}>
                          {testDbConnectionSuccessful ? (
                            <Alert severity="success" sx={{ borderRadius: '8px', py: 0.3, px: 1.5, fontSize: '0.82rem', height: 38, display: 'flex', alignItems: 'center' }}>
                              {testDbConnectionMessage || '✔ Database connection verified successfully.'}
                            </Alert>
                          ) : testDbConnectionError ? (
                            <Alert severity="error" sx={{ borderRadius: '8px', py: 0.3, px: 1.5, fontSize: '0.82rem', height: 38, display: 'flex', alignItems: 'center' }}>
                              {testDbConnectionError}
                            </Alert>
                          ) : (
                            <Alert severity="info" sx={{ borderRadius: '8px', py: 0.3, px: 1.5, fontSize: '0.82rem', height: 38, display: 'flex', alignItems: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                              {form.dbName ? `Active Database: ${form.dbName}` : 'Click "Test Connection" to fetch databases'}
                            </Alert>
                          )}
                        </Grid>

                        {clientDbSyncStatus && (
                          <Grid item xs={12}>
                            <Alert
                              severity={clientDbSyncStatus.success ? 'success' : 'error'}
                              onClose={() => setClientDbSyncStatus(null)}
                              sx={{ borderRadius: '8px', py: 0.5, px: 2, fontSize: '0.82rem' }}
                            >
                              <strong>{clientDbSyncStatus.success ? '✔ Client Database Synced:' : '❌ Client Database Sync Error:'}</strong>{' '}
                              {clientDbSyncStatus.message}
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </BOSFormSection>

                    {/* Panel 2: eSSL Biometric Attendance Database Connection (Identical UI Layout) */}
                    <BOSFormSection
                      icon={<IconFingerprint size={20} color={theme.palette.primary.main} />}
                      title="eSSL Biometric Attendance Database Configuration"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2} sx={{ mb: 1 }}>
                        {/* Row 1: Credentials (Exact same 12-col layout) */}
                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Database Type *</InputLabel>
                            <Select
                              name="esslDatabaseType"
                              value={form.esslDatabaseType || 'SQL Server'}
                              label="Database Type *"
                              onChange={handleChange}
                              sx={{ borderRadius: '8px' }}
                            >
                              <MenuItem value="SQL Server">Microsoft SQL Server</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            {...fieldProps('esslServerIp', 'Server / Host *')}
                            placeholder="e.g. 192.168.1.150"
                            onChange={(e) => {
                              handleChange(e);
                              setTestEsslResult(null);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                          <TextField
                            {...fieldProps('esslPort', 'Port *')}
                            type="number"
                            placeholder="1433"
                            onChange={(e) => {
                              handleChange(e);
                              setTestEsslResult(null);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                          <TextField
                            {...fieldProps('esslUsername', 'Username *')}
                            placeholder="e.g. sa"
                            onChange={(e) => {
                              handleChange(e);
                              setTestEsslResult(null);
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4} md={2}>
                          <TextField
                            {...fieldProps('esslPassword', 'Password *')}
                            type={showEsslPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            onChange={(e) => {
                              handleChange(e);
                              setTestEsslResult(null);
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={() => setShowEsslPassword(!showEsslPassword)} edge="end" sx={{ color: 'text.secondary', p: 0.4 }}>
                                    {showEsslPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>

                        {/* Row 2: Test Button + Database Selector + Status Alert */}
                        <Grid item xs={12} sm={4} md={2.5}>
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleConnect}
                            disabled={testEsslLoading}
                            startIcon={testEsslLoading ? <CircularProgress size={14} color="inherit" /> : <IconPlugConnected size={16} />}
                            sx={{ height: 38, textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: '0.82rem' }}
                          >
                            {testEsslLoading ? 'Testing Connection...' : 'Test Connection'}
                          </Button>
                        </Grid>

                        <Grid item xs={12} sm={8} md={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Database Name *</InputLabel>
                            <Select
                              name="esslDbName"
                              value={form.esslDbName || ''}
                              label="Database Name *"
                              onChange={handleChange}
                              sx={{ borderRadius: '8px' }}
                            >
                              <MenuItem value=""><em>None</em></MenuItem>
                              {form.esslDbName && !dbList.includes(form.esslDbName) && (
                                <MenuItem value={form.esslDbName}>{form.esslDbName}</MenuItem>
                              )}
                              {dbList.map((dbName) => (
                                <MenuItem key={dbName} value={dbName}>{dbName}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} md={5.5}>
                          {testEsslResult ? (
                            <Alert severity={testEsslResult.success ? 'success' : 'error'} sx={{ borderRadius: '8px', py: 0.3, px: 1.5, fontSize: '0.82rem', height: 38, display: 'flex', alignItems: 'center' }}>
                              {testEsslResult.message || (testEsslResult.success ? '✔ eSSL database connection verified successfully.' : 'Connection failed')}
                            </Alert>
                          ) : (
                            <Alert severity="info" sx={{ borderRadius: '8px', py: 0.3, px: 1.5, fontSize: '0.82rem', height: 38, display: 'flex', alignItems: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                              {form.esslDbName ? `Active Database: ${form.esslDbName}` : 'Click "Test Connection" to fetch databases'}
                            </Alert>
                          )}
                        </Grid>
                      </Grid>
                    </BOSFormSection>

                    {/* Panel 3: Biometric Sync Guidelines */}
                    <BOSFormSection
                      icon={<IconFingerprint size={20} color={theme.palette.info.main} />}
                      title="Biometric Punch Synchronization Notes"
                      defaultOpen={false}
                    >
                      <Typography variant="body2" color="text.secondary" fontSize="0.82rem" sx={{ lineHeight: 1.6 }}>
                        When connected, the BOS Attendance Sync worker queries this eSSL SQL database at 15-minute intervals. Ensure TCP port <strong>1433</strong> is whitelisted in your local firewall and SQL Server Browser service is running.
                      </Typography>
                    </BOSFormSection>
                  </Stack>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB 3: SERVER DETAILS                                           */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 3 && (
                  <Stack spacing={2}>
                    {/* Card 1: Server Host Configuration & Health Monitoring */}
                    <BOSFormSection
                      icon={<IconActivity size={20} color={theme.palette.primary.main} />}
                      title="Server Host Configuration & Health Monitoring"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Health Monitoring</InputLabel>
                            <Select
                              name="healthMonitoringEnabled"
                              value={form.healthMonitoringEnabled ? 'YES' : 'NO'}
                              label="Health Monitoring"
                              onChange={(e) => handleChange({ target: { name: 'healthMonitoringEnabled', value: e.target.value === 'YES' } })}
                              sx={{ borderRadius: '8px' }}
                            >
                              <MenuItem value="NO">Disabled</MenuItem>
                              <MenuItem value="YES">Enabled</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField {...fieldProps('serverName', 'Server Host Name')} placeholder="e.g. SRV-APP-01" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField {...fieldProps('serverIp', 'Server IP Address')} placeholder="e.g. 192.168.1.100" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField {...fieldProps('serverPort', 'Server Port')} type="number" placeholder="8081" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                          <TextField {...fieldProps('windowsUsername', 'Windows Username')} placeholder="e.g. Administrator" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                          <TextField
                            {...fieldProps('windowsPassword', 'Windows Password')}
                            type={showWindowsPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={() => setShowWindowsPassword(!showWindowsPassword)} edge="end" sx={{ color: 'text.secondary', p: 0.4 }}>
                                    {showWindowsPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                      </Grid>
                    </BOSFormSection>

                    {/* Card 2: Outbound Mail Server (SMTP) Configuration */}
                    <BOSFormSection
                      icon={<IconSend size={20} color={theme.palette.primary.main} />}
                      title="Outbound Mail Server (SMTP) Configuration"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6} md={5}>
                          <TextField {...fieldProps('smtpHost', 'SMTP Host Server')} placeholder="e.g. smtp.gmail.com" />
                        </Grid>
                        <Grid item xs={12} sm={3} md={3}>
                          <TextField {...fieldProps('smtpPort', 'Port')} type="number" placeholder="587" />
                        </Grid>
                        <Grid item xs={12} sm={3} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                name="smtpSslEnabled"
                                checked={Boolean(form.smtpSslEnabled)}
                                onChange={(e) => handleChange({ target: { name: 'smtpSslEnabled', value: e.target.checked } })}
                                sx={{ color: theme.palette.primary.main, '&.Mui-checked': { color: theme.palette.primary.main } }}
                              />
                            }
                            label={<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>Require SSL / TLS Encryption</Typography>}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                          <TextField {...fieldProps('smtpUsername', 'SMTP Authentication Username')} placeholder="mailer@company.com" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                          <TextField {...fieldProps('smtpPassword', 'SMTP Password')} type="password" placeholder="••••••••••••" />
                        </Grid>
                      </Grid>

                      {/* Live Test Email Tool */}
                      <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: alpha(theme.palette.primary.main, 0.03), border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}` }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Verify SMTP Configuration
                        </Typography>
                        <Grid container spacing={1.5} alignItems="center">
                          <Grid item xs={12} sm={8} md={9}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Test Recipient Email"
                              value={testEmailRecipient}
                              onChange={(e) => setTestEmailRecipient(e.target.value)}
                              placeholder="receiver@company.com"
                              InputLabelProps={{ shrink: true, style: { fontWeight: 600, fontSize: '0.85rem' } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4} md={3}>
                            <Button
                              variant="contained"
                              color="primary"
                              fullWidth
                              onClick={handleTestSmtp}
                              disabled={testEmailLoading || !testEmailRecipient.trim()}
                              startIcon={testEmailLoading ? <CircularProgress size={14} color="inherit" /> : <IconSend size={15} />}
                              sx={{ height: 38, textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: '0.82rem' }}
                            >
                              {testEmailLoading ? 'Sending...' : 'Send Test Mail'}
                            </Button>
                          </Grid>
                          {testEmailResult && (
                            <Grid item xs={12}>
                              <Alert severity={testEmailResult.success ? 'success' : 'error'} sx={{ borderRadius: '8px', py: 0.5, fontSize: '0.82rem' }}>
                                {testEmailResult.message}
                              </Alert>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </BOSFormSection>
                  </Stack>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB 4: CLIENT APP CONFIG (Storage, Preferences & Security)      */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 4 && (
                  <Stack spacing={2}>
                    {/* Panel 1: Central Document Storage Configuration */}
                    <BOSFormSection
                      icon={<IconFolder size={20} color={theme.palette.primary.main} />}
                      title="Central Document Storage Configuration"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            name="directoryPath"
                            label="Central Document Storage Path"
                            value={form.directoryPath || ''}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true, style: { color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.85rem' } }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={handleOpenBrowser} size="small" edge="end" sx={{ p: 0.5 }}>
                                    <IconFolderOpen size={18} />
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                      </Grid>
                    </BOSFormSection>

                    {/* Panel 2: Regional & System Preferences */}
                    <BOSFormSection
                      icon={<IconSettings2 size={20} color={theme.palette.primary.main} />}
                      title="Regional & System Localization Preferences"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <motion.div variants={itemVariants}>
                            <DropdownField name="currencyCode" label="Currency Symbol" options={CURRENCIES} />
                          </motion.div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <motion.div variants={itemVariants}>
                            <TextField {...fieldProps('decimalPlaces', 'Decimal Precision')} type="number" inputProps={{ min: 0, max: 6 }} />
                          </motion.div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <motion.div variants={itemVariants}>
                            <FormControl fullWidth size="small">
                              <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Date Format</InputLabel>
                              <Select name="dateFormat" value={form.dateFormat || 'DD/MM/YYYY'} label="Date Format" onChange={handleChange} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/08/2026)</MenuItem>
                                <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/25/2026)</MenuItem>
                                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-25)</MenuItem>
                              </Select>
                            </FormControl>
                          </motion.div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <motion.div variants={itemVariants}>
                            <FormControl fullWidth size="small">
                              <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Time Format</InputLabel>
                              <Select name="timeFormat" value={form.timeFormat || 'H24'} label="Time Format" onChange={handleChange} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="H24">24-Hour (e.g. 14:30:00)</MenuItem>
                                <MenuItem value="H12">12-Hour AM/PM (e.g. 02:30:00 PM)</MenuItem>
                              </Select>
                            </FormControl>
                          </motion.div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                          <motion.div variants={itemVariants}>
                            <FormControl fullWidth size="small">
                              <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Timezone</InputLabel>
                              <Select name="appTimezone" value={form.appTimezone || 'Asia/Kolkata'} label="Timezone" onChange={handleChange} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</MenuItem>
                                <MenuItem value="Asia/Dubai">Asia/Dubai (GST +4:00)</MenuItem>
                                <MenuItem value="Asia/Singapore">Asia/Singapore (SGT +8:00)</MenuItem>
                                <MenuItem value="Europe/London">Europe/London (GMT ±0:00)</MenuItem>
                                <MenuItem value="Europe/Berlin">Europe/Berlin (CET +1:00)</MenuItem>
                                <MenuItem value="America/New_York">America/New_York (EST -5:00)</MenuItem>
                                <MenuItem value="America/Los_Angeles">America/Los_Angeles (PST -8:00)</MenuItem>
                                <MenuItem value="UTC">UTC (±0:00)</MenuItem>
                              </Select>
                            </FormControl>
                          </motion.div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                          <motion.div variants={itemVariants}>
                            <FormControl fullWidth size="small">
                              <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Week Starts On</InputLabel>
                              <Select name="weekStartsOn" value={form.weekStartsOn || 'MONDAY'} label="Week Starts On" onChange={handleChange} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="MONDAY">Monday</MenuItem>
                                <MenuItem value="SUNDAY">Sunday</MenuItem>
                                <MenuItem value="SATURDAY">Saturday</MenuItem>
                              </Select>
                            </FormControl>
                          </motion.div>
                        </Grid>
                      </Grid>
                    </BOSFormSection>

                    {/* Panel 3: Session & Table Formatting Rules */}
                    <BOSFormSection
                      icon={<IconSettings2 size={20} color={theme.palette.primary.main} />}
                      title="Session & Table Formatting Rules"
                      defaultOpen={true}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                          <motion.div variants={itemVariants}>
                            <FormControl fullWidth size="small">
                              <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Default Input Case Style</InputLabel>
                              <Select name="inputCaseStyle" value={form.inputCaseStyle || 'UPPER_CASE'} label="Default Input Case Style" onChange={handleChange} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="UPPER_CASE">UPPERCASE (e.g. JOHN DOE)</MenuItem>
                                <MenuItem value="LOWER_CASE">lowercase (e.g. john doe)</MenuItem>
                                <MenuItem value="CUSTOM">Normal / Mixed Case (As Entered)</MenuItem>
                              </Select>
                            </FormControl>
                          </motion.div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <motion.div variants={itemVariants}>
                            <TextField {...fieldProps('autoLogoutSeconds', 'Session Inactive Timeout (Minutes)')} type="number" />
                          </motion.div>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <motion.div variants={itemVariants}>
                            <FormControl fullWidth size="small">
                              <InputLabel shrink sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Default Table Page Size</InputLabel>
                              <Select name="defaultRowsPerPage" value={form.defaultRowsPerPage || 50} label="Default Table Page Size" onChange={handleChange} sx={{ borderRadius: '8px' }}>
                                {[10, 25, 50, 100, 200].map(val => (
                                  <MenuItem key={val} value={val}>{val} Records / Page</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </motion.div>
                        </Grid>
                      </Grid>
                    </BOSFormSection>

                    {/* Panel 4: Login Security Whitelist (Single Canonical Placement) */}
                    <BOSFormSection
                      icon={<IconShieldLock size={20} color={theme.palette.primary.main} />}
                      title="Login Security IP & Host Whitelist"
                      defaultOpen={true}
                    >
                      <LoginSecurityTab companyId={recordId || 1} />
                    </BOSFormSection>
                  </Stack>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB 5: OCR & MAILBOX INTEGRATION                                 */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 5 && (
                  <Stack spacing={2}>
                    {(() => {
                      const statusInfo = (() => {
                        if (!form.ocrSharedMailbox) {
                          return {
                            status: 'not_connected',
                            label: 'Not Connected',
                            severity: 'info',
                            chipColor: 'default',
                            text: 'No Outlook account connected. Enter your Outlook Email Address below and click "Connect Outlook Account".'
                          };
                        }
                        if (!form.ocrClientSecret) {
                          return {
                            status: 'not_connected',
                            label: 'Not Connected',
                            severity: 'warning',
                            chipColor: 'warning',
                            text: 'No active Azure Client Secret entered. Click "Connect Outlook Account" after entering credentials.'
                          };
                        }
                        return {
                          status: 'connected',
                          label: 'Connected',
                          severity: 'success',
                          chipColor: 'success',
                          text: `Connected to ${form.ocrSharedMailbox}`
                        };
                      })();

                      return (
                        <BOSFormSection
                          icon={<IconMail size={20} color={theme.palette.primary.main} />}
                          title="Microsoft Outlook & AI Invoice OCR Integration"
                          defaultOpen={true}
                        >
                          <Box sx={{ p: 1.5, mb: 2, borderRadius: '10px', border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.info.main, 0.02) }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.84rem' }}>
                                Outlook Mailbox Connection Status
                              </Typography>
                              <Chip label={statusInfo.label} color={statusInfo.chipColor} size="small" variant="filled" sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }} />
                            </Box>
                            <Alert severity={statusInfo.severity} variant="outlined" sx={{ borderRadius: '8px', py: 0.5, fontSize: '0.82rem' }}>
                              {statusInfo.text}
                            </Alert>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <TextField {...fieldProps('ocrTenantId', 'Azure Tenant ID')} placeholder="e.g. 00000000-0000-0000-0000-000000000000" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField {...fieldProps('ocrClientId', 'Azure Client ID')} placeholder="e.g. 00000000-0000-0000-0000-000000000000" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                {...fieldProps('ocrClientSecret', 'Azure Client Secret')}
                                type={showClientSecret ? 'text' : 'password'}
                                placeholder="••••••••••••••••"
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton onClick={() => setShowClientSecret(!showClientSecret)} edge="end" sx={{ color: 'text.secondary', p: 0.4 }}>
                                        {showClientSecret ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                      </IconButton>
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField {...fieldProps('ocrSharedMailbox', 'Outlook Shared Mailbox')} placeholder="e.g. invoices@company.com" />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField {...fieldProps('ocrProcessedFolder', 'Processed Archive Folder')} placeholder="e.g. Processed" />
                            </Grid>
                            <Grid item xs={12}>
                              <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                startIcon={<IconExternalLink size={16} />}
                                onClick={handleConnectOutlookClick}
                                disabled={!form.ocrSharedMailbox}
                                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 3, py: 0.8, fontSize: '0.82rem' }}
                              >
                                Connect Outlook Account (SSO)
                              </Button>
                            </Grid>
                          </Grid>
                        </BOSFormSection>
                      );
                    })()}
                  </Stack>
                )}

              </Box>
            </Paper>
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Database Case Style Update Confirmation Dialog */}
      <Dialog open={casePromptOpen} onClose={() => !databaseUpdating && setCasePromptOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', bgcolor: 'background.paper' } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', pb: 1, color: 'text.primary' }}>Global Case Style Change</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" mb={1} color="text.secondary">
            You changed the <strong>Default Input Case Style</strong> from <span style={{ color: 'text.primary', fontWeight: 700 }}>{originalCaseStyle}</span> to <span style={{ color: 'text.primary', fontWeight: 700 }}>{form.inputCaseStyle}</span>.
          </Typography>
          <Box mt={2} p={1.5} borderRadius="8px" border="1px solid" borderColor={theme.palette.warning.light} bgcolor={alpha(theme.palette.warning.main, 0.1)}>
            <Typography variant="caption" fontWeight={700} color={theme.palette.warning.dark} mb={0.5} display="block">How should this be applied?</Typography>
            <Typography variant="caption" mb={1} color={theme.palette.warning.dark} display="block">
              <strong>Future Data Only:</strong> New inputs will follow this style. Existing records remain unchanged.
            </Typography>
            <Typography variant="caption" color="error.main" display="block">
              <strong>Retroactive Update:</strong> This will update ALL existing text across the database. Heavy operation.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCasePromptOpen(false)} size="small" disabled={databaseUpdating || loading} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button variant="outlined" size="small" onClick={() => { setCasePromptOpen(false); executeSave(false); }} disabled={databaseUpdating || loading} sx={{ borderRadius: '8px', fontWeight: 600 }}>Future Data Only</Button>
          <Button variant="contained" size="small" color="error" onClick={() => { setCasePromptOpen(false); executeSave(true); }} disabled={databaseUpdating || loading} startIcon={databaseUpdating || loading ? <CircularProgress size={14} color="inherit" /> : null} sx={{ borderRadius: '8px', fontWeight: 700, boxShadow: `0 4px 10px ${alpha(theme.palette.error.main, 0.3)}` }}>
            {databaseUpdating ? 'Updating Database...' : 'Update Everything'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map Picker Dialog */}
      <Dialog open={mapDialogOpen} onClose={() => setMapDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', bgcolor: 'background.paper' } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", bgcolor: 'background.default', color: 'text.primary' }}>Pin Location</DialogTitle>
        <DialogContent sx={{ p: 0, height: 400 }}>
          <RMap initialCenter={[mapMarker.longitude, mapMarker.latitude]} initialZoom={12} mapStyle={osm_bright}>
            <RMarker longitude={mapMarker.longitude} latitude={mapMarker.latitude} draggable={true} initialAnchor="bottom" onDrag={handleMarkerDrag} />
          </RMap>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, bgcolor: 'background.default' }}>
          <Button onClick={handleGetCurrentLocation} color="primary" size="small" startIcon={<IconCurrentLocation size={16} />} sx={{ mr: 'auto', fontWeight: 600 }}>Live Location</Button>
          <Button onClick={() => setMapDialogOpen(false)} size="small" sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" size="small" onClick={handleMapSave} startIcon={<IconMapPin size={16} />} sx={{ borderRadius: '8px', fontWeight: 600, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` }}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Directory Browser Dialog */}
      <Dialog
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', bgcolor: 'background.paper' } }}
      >
        <DialogTitle component="div" sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`, color: '#fff', py: 1.5, px: 2.5
        }}>
          <IconFolderOpen size={20} stroke={2} />
          <Typography variant="subtitle1" color="inherit" fontWeight={700} fontFamily="'Outfit', sans-serif">
            Select Directory
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: 350, maxHeight: 500, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <IconButton
              size="small"
              disabled={!browserData.currentPath}
              onClick={() => fetchDirectory(browserData.parentPath || null)}
              sx={{ bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}`, '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1) } }}
            >
              <IconArrowLeft size={16} />
            </IconButton>
            <Paper variant="outlined" sx={{ flex: 1, py: 0.5, px: 1.5, bgcolor: 'background.paper', borderRadius: '8px', display: 'flex', alignItems: 'center', overflow: 'hidden', borderColor: theme.palette.divider }}>
              <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                {browserData.currentPath || 'This PC'}
              </Typography>
            </Paper>
          </Box>
          <List sx={{ py: 0, overflowY: 'auto', flex: 1, bgcolor: 'background.paper' }}>
            {browserLoading && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={30} thickness={4} sx={{ color: theme.palette.primary.main }} />
              </Box>
            )}
            {!browserLoading && !browserData.currentPath && browserData.roots.map(root => (
              <ListItemButton key={root} onClick={() => fetchDirectory(root)} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, py: 1, px: 2 }}>
                <ListItemIcon sx={{ minWidth: 40 }}><IconServer color={theme.palette.primary.main} size={22} /></ListItemIcon>
                <ListItemText primary={`Local Disk (${root.replace('\\', '')})`} primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary' }} />
                <IconChevronRight size={16} color={theme.palette.divider} />
              </ListItemButton>
            ))}
            {!browserLoading && browserData.folders.map(f => (
              <ListItemButton
                key={f.path}
                onClick={() => {
                  fetchDirectory(f.path);
                  setForm(prev => ({ ...prev, directoryPath: f.path }));
                }}
                sx={{ borderBottom: `1px solid ${theme.palette.divider}`, py: 1, px: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}><IconFolder color={theme.palette.warning.main} size={22} fill={alpha(theme.palette.warning.main, 0.2)} /></ListItemIcon>
                <ListItemText primary={f.name} primaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: 'text.primary' }} />
                <IconChevronRight size={14} color={theme.palette.divider} />
              </ListItemButton>
            ))}
            {!browserLoading && browserData.currentPath && browserData.folders.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center', color: theme.palette.text.disabled }}>
                <IconFolder size={48} stroke={0.5} style={{ opacity: 0.5 }} />
                <Typography variant="body2" mt={1}>Empty</Typography>
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 1.5, bgcolor: 'background.default', borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button
            onClick={() => setBrowserOpen(false)}
            variant="contained"
            color="primary"
            sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', bgcolor: 'transparent', boxShadow: 'none' } }}>
        <DialogContent sx={{ p: 0, position: 'relative', textAlign: 'center' }}>
          {previewImage && (
            <img
              src={`${API_BASE}/api/company-profile/image/${previewImage}`}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '16px', boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.5)}` }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientMaster;
