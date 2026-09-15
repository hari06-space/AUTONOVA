import axios from 'axios';
import TextField from 'ui-component/CustomTextField';
import { BOSTextField } from 'ui-component/bos';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  IconShieldLock
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
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import PageUserManual from 'ui-component/bos/PageUserManual';
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
  city: '', state: '', stateCode: '', country: '', pincode: '',
  gstIn: '', clientCode: '', dbSourceName: '', licRenewalDate: '', licExpiryDate: '',
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
  esslPassword: ''
};

// ─── Image Upload Card ───────────────────────────────────────────────────────
function ImageUploadCard({ label, icon: Icon, field, preview, onUpload, uploading, onView }) {
  const theme = useTheme();
  const inputRef = useRef();
  return (
    <Paper
      elevation={0}
      component={motion.div}
      whileHover={{ y: -2, boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}` }}
      whileTap={{ scale: 0.98 }}
      sx={{
        border: '1px dashed',
        borderColor: preview ? theme.palette.primary.light : theme.palette.divider,
        borderRadius: '12px',
        p: 1.5,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        background: preview
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`
          : 'background.paper',
        WebkitBackdropFilter: 'blur(10px)',
        backdropFilter: 'blur(10px)',
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Chip
            label={preview.length > 25 ? preview.slice(0, 25) + '…' : preview}
            size="small" sx={{ height: 24, fontSize: '0.75rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.dark, fontWeight: 600, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2) }}
            icon={<IconCheck size={14} color={theme.palette.primary.main} />}
          />
          <IconButton onClick={(e) => { e.stopPropagation(); onView(preview); }} size="small" sx={{ color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}>
            <IconEye size={16} />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ py: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          {uploading
            ? <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
            : <Icon size={24} stroke={1.5} style={{ color: 'text.secondary' }} />}
          <Typography variant="subtitle2" color="text.primary" fontWeight={600} fontSize="0.8rem">
            {uploading ? 'Uploading…' : `Upload ${label}`}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const CompanyProfile = () => {
  const theme = useTheme();

  const { user } = useAuth();
  const isSuperUser = user?.userLevel >= 5 || user?.userId === 'SUPER BOSS' || user?.userId === 'ADMIN' || (user?.roleName && user.roleName.toUpperCase().includes('SUPER ADMIN'));
  const { updateDateTimeSettings } = useConfig();

  const perms = usePagePermissions(PAGE_CODES.AD_COMPANY_PROFILE);

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
      const res = await fetch(`${API_BASE}/api/company-profile/test-smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient: testEmailRecipient.trim() })
      });
      const data = await res.json();
      setTestEmailResult(data);
      if (data.success) {
        showSnack('Test email sent successfully.', 'success');
      } else {
        showSnack(data.message || 'Failed to send test email.', 'error');
      }
    } catch (err) {
      const errMsg = 'Network error: ' + err.message;
      setTestEmailResult({ success: false, message: errMsg });
      showSnack(errMsg, 'error');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const executeSilentSave = async (updatedForm = {}) => {
    if (!recordId) return;
    try {
      const token = sessionStorage.getItem('serviceToken') || '';
      const payload = {
        ...form,
        ...updatedForm,
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

  // ── Load existing record on mount ──
  const fetchCompanyProfileData = useCallback(() => {
    const token = sessionStorage.getItem('serviceToken') || '';
    fetch(`${API_BASE}/api/company-profile/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const rec = data[0];
          setRecordId(rec.id);
          setForm({
            companyName: rec.companyName || '',
            shortName: rec.shortName || '',
            address: rec.address || '',
            city: rec.city || '',
            state: rec.state || '',
            stateCode: rec.stateCode != null ? String(rec.stateCode) : '',
            country: rec.country || '',
            pincode: rec.pincode || '',
            gstIn: rec.gstIn || '',
            clientCode: rec.clientCode || '',
            dbSourceName: rec.dbSourceName || 'AUTONOVA',
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
            panNo: rec.panNo || '',
            cinNo: rec.cinNo || '',
            phoneNo: rec.phoneNo || '',
            mobileNo: rec.mobileNo || '',
            fax: rec.fax || '',
            emailId: rec.emailId || '',
            website: rec.website || '',
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
            esslPassword: rec.esslPassword || ''
          });
          setOriginalCaseStyle(rec.inputCaseStyle || 'UPPER_CASE');
          if (rec.esslDbName) {
            setDbList([rec.esslDbName]);
            setEsslConnected(true);
          }
        }
      })
      .catch(() => {/* silently ignore on first load */ });
  }, []);

  useEffect(() => {
    fetchCompanyProfileData();
  }, [fetchCompanyProfileData]);

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data && event.data.type === 'MS_OAUTH_SUCCESS') {
        fetchCompanyProfileData();
        setSnack({ open: true, msg: 'Outlook Account connected successfully!', severity: 'success' });
      } else if (event.data && event.data.type === 'MS_OAUTH_ERROR') {
        setSnack({ open: true, msg: `Authentication failed: ${event.data.error || 'Unknown error'}`, severity: 'error' });
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [fetchCompanyProfileData]);

  useEffect(() => {
    if (!isSuperUser && activeTab > 2) {
      setActiveTab(0);
    }
  }, [activeTab, isSuperUser]);

  const isLowerField = (fieldName) => {
    if (!fieldName) return false;
    const f = fieldName.toLowerCase();
    return f.includes('email') || f.includes('mail') || f.includes('smtp') || f.includes('website') || f.includes('gmap') || f.includes('url') || f.includes('host') || f.includes('path') || f.includes('dir');
  };

  // ── Field change ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (isLowerField(name) && typeof value === 'string' && name !== 'smtpPassword' && name !== 'esslPassword') {
      finalValue = value.toLowerCase();
    }
    setForm(prev => {
      const updated = { ...prev, [name]: finalValue };
      if (name === 'state' && STATE_CODES[value] !== undefined) {
        updated.stateCode = String(STATE_CODES[value]);
      }
      if (name === 'country') { updated.state = ''; updated.city = ''; updated.stateCode = ''; }
      if (name === 'state') { updated.city = ''; }
      if (name === 'licExpiryDate') {
        updated.licRenewalDate = new Date().toISOString().split('T')[0];
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
    if (!form.companyName.trim()) e.companyName = 'Company Name is required';
    if (!form.clientCode || !form.clientCode.trim()) e.clientCode = 'Client Code is mandatory';
    if (!form.country) e.country = 'Country is required';
    if (!form.state) e.state = 'State is required';
    if (!form.city) e.city = 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
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
      if (recordId) {
        url = `${API_BASE}/api/company-profile/update/${recordId}`;
        method = 'PUT';
      } else {
        url = `${API_BASE}/api/company-profile/create`;
        method = 'POST';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      setRecordId(saved.id);
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

      if (updateExistingDb) {
        setDatabaseUpdating(true);
        try {
          const dbRes = await fetch(`${API_BASE}/api/company-profile/update-database-case-style?style=${form.inputCaseStyle}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!dbRes.ok) throw new Error('Failed to update existing database records');
          showSnack('Saved successfully and all existing database records have been transformed!', 'success');
        } catch (e) {
          showSnack('Profile saved, but failed to update existing database records.', 'warning');
        } finally {
          setDatabaseUpdating(false);
        }
      } else {
        showSnack('Saved successfully!', 'success');
      }
    } catch (err) {
      showSnack(err.message || 'Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  // ─── Styles ───
  const sectionTitle = (title, IconComponent) => (
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      <Box sx={{
        p: 0.5, borderRadius: '8px',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.15)})`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconComponent size={18} color={theme.palette.primary.main} stroke={2} />
      </Box>
      <Typography variant="subtitle1" fontWeight={700} color={theme.palette.text.primary} sx={{ letterSpacing: '-0.01em', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
        {title}
      </Typography>
    </Box>
  );

  const fieldProps = (name, label, extra = {}) => {
    const isLower = isLowerField(name);
    return {
      name, label, value: form[name] || '',
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
        style: { color: 'text.secondary', fontWeight: 500 },
        ...extra.InputLabelProps
      },
      sx: {
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          bgcolor: extra.InputProps?.readOnly ? alpha(theme.palette.action.hover, 0.5) : theme.palette.background.paper,
          transition: 'all 0.2s',
          '& fieldset': { borderColor: theme.palette.divider, borderWidth: '1px' },
          '&:hover fieldset': { borderColor: 'text.secondary' },
          '&.Mui-focused': {
            bgcolor: 'background.paper',
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
          },
          '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1.5px' },
          '& input': { py: 1, px: 1.5, width: '100% !important', ...(isLower ? { textTransform: 'lowercase !important' } : {}) },
          '& textarea': { py: 1, px: 1.5 }
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
    let isRequired = false;
    if (typeof label === 'string' && label.includes('*')) {
      isRequired = true;
      const baseLabel = label.replace('*', '').trim();
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
        sx={{
          minWidth: 150,
          '& .MuiOutlinedInput-root': { padding: '2px !important' },
          '& .MuiAutocomplete-input': { padding: '4px 8px !important', color: 'text.primary', fontWeight: 500 },
          '& .MuiInputLabel-root': { color: 'text.secondary', fontWeight: 500 },
          '& .MuiIconButton-root': { color: 'text.secondary' }
        }}
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
            required={isRequired}
            error={!!errors[name]}
            helperText={errors[name]}
            placeholder={`Select ${typeof label === 'string' ? label.replace('*', '').trim() : label}`}
            sx={[{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                bgcolor: disabled ? alpha(theme.palette.action.hover, 0.5) : theme.palette.background.paper,
                transition: 'all 0.2s',
                '& fieldset': { borderColor: theme.palette.divider, borderWidth: '1px' },
                '&:hover fieldset': { bordercolor: 'text.secondary' },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                },
                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1.5px' }
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
    { label: 'Contact & Web', icon: IconBuilding, index: 0, desc: 'Address & Web Info' },
    { label: 'Branding & Identity', icon: IconPhoto, index: 1, desc: 'Logos & Visuals' },
    { label: 'App Config', icon: IconSettings2, index: 2, desc: 'Preferences & Formats' },
    ...(isSuperUser ? [
      { label: 'Central Doc Storage', icon: IconFolder, index: 3, desc: 'File Storage Paths' },
      { label: 'OCR Settings', icon: IconMail, index: 4, desc: 'Auto Invoice Parsing' },
      { label: 'SMTP Settings', icon: IconSend, index: 5, desc: 'Email Service Setup' },
      { label: 'ESSL Settings', icon: IconUser, index: 6, desc: 'Biometric Attendance' },
      { label: 'Login Security', icon: IconShieldLock, index: 7, desc: 'IP & Device Whitelist' }
    ] : [])
  ];

  return (
    <Box sx={{ p: 1.5, background: 'background.default', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Premium Sticky Header Action Bar (PR Page Design) ── */}
      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          p: 1.5,
          mb: 1.5,
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.main,
              color: '#fff',
              width: 45,
              height: 45,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
            }}
          >
            <IconBuilding size={24} />
          </Avatar>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h3" fontWeight="800" sx={{
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.2
              }}>
                Company Profile
              </Typography>
              <PageUserManual pageCode={PAGE_CODES.AD_COMPANY_PROFILE || 'AD1110'} />
            </Stack>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
              {form.companyName ? `Managing identity for ${form.companyName}` : 'Configure your organization’s identity'}
            </Typography>
          </Box>
        </Box>

        {perms.write && (
          <Button
            variant="contained"
            color="warning"
            startIcon={loading || databaseUpdating ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={18} />}
            onClick={handleSaveClick}
            disabled={loading || databaseUpdating || !perms.write}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              fontWeight: '700',
              boxShadow: `0 8px 16px ${alpha(theme.palette.warning.main, 0.3)}`,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 10px 20px ${alpha(theme.palette.warning.main, 0.5)}`,
              }
            }}
          >
            {loading ? 'Saving...' : recordId ? 'Save Changes' : 'Create Profile'}
          </Button>
        )}
      </Paper>

      {/* ── Top Overview Cards ── */}
      <Box component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} sx={{ mb: 1.5, flexShrink: 0 }}>
        <Paper elevation={0} sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '16px',
          p: 1.5,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 12px -5px rgba(0, 0, 0, 0.02)'
        }}>
          <Grid container spacing={1.5} sx={{ width: '100%' }}>
            <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '23%' } }}>
              <TextField {...fieldProps('companyName', 'Legal Company Name', { required: true })} /></Grid>
            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '13%' } }}><TextField {...fieldProps('shortName', 'Short Name')} /></Grid>
            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '13%' } }}><TextField {...fieldProps('registrationNo', 'Registration No')} /></Grid>
            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '13%' } }}><TextField {...fieldProps('panNo', 'PAN No')} /></Grid>
            <Grid item xs={12} md={2} sx={{ width: { xs: '100%', md: '13%' } }}><TextField {...fieldProps('gstIn', 'GST IN')} inputProps={{ maxLength: 15 }} /></Grid>
          </Grid>
        </Paper>
      </Box>

      {/* ── Main Layout: Sidebar & Content ── */}
      <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Executive Sidebar Navigation */}
        <Box
          sx={{
            width: { xs: '100%', md: 245, lg: 255 },
            minWidth: { xs: '100%', md: 245, lg: 255 },
            height: '100%',
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.300', borderRadius: 4 }
          }}
          component={motion.div}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '16px',
              bgcolor: 'background.paper',
              p: 1.25,
              boxShadow: '0 4px 16px -4px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75
            }}
          >
            <Box sx={{ px: 1.25, py: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`, mb: 0.5 }}>
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '0.68rem' }}
              >
                Configuration
              </Typography>
              <Chip size="small" label={`${tabs.length} Tabs`} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
            </Box>

            {tabs.map((tab) => {
              const isActive = activeTab === tab.index;
              const Icon = tab.icon;
              return (
                <Box
                  key={tab.index}
                  component={motion.div}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.index)}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    py: 1,
                    px: 1.25,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? alpha(theme.palette.primary.main, 0.3) : 'transparent',
                    color: isActive ? theme.palette.primary.dark : theme.palette.text.primary,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    '&:hover': {
                      bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.action.hover, 0.7),
                      borderColor: isActive ? theme.palette.primary.main : alpha(theme.palette.divider, 0.8)
                    }
                  }}
                >
                  {/* Active Left Accent Strip */}
                  {isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: '18%',
                        bottom: '18%',
                        width: 3.5,
                        bgcolor: 'primary.main',
                        borderRadius: '0 4px 4px 0',
                        boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.6)}`
                      }}
                    />
                  )}

                  {/* Icon Avatar Box */}
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      bgcolor: isActive ? theme.palette.primary.main : alpha(theme.palette.grey[500], 0.1),
                      color: isActive ? '#fff' : theme.palette.text.secondary,
                      boxShadow: isActive ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.35)}` : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={17} />
                  </Avatar>

                  {/* Label & Description */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '0.84rem',
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? 'primary.main' : 'text.primary',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {tab.label}
                    </Typography>
                    {tab.desc && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.68rem',
                          color: 'text.secondary',
                          display: 'block',
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {tab.desc}
                      </Typography>
                    )}
                  </Box>

                  {/* Right Arrow Chevron */}
                  <IconChevronRight
                    size={14}
                    style={{
                      opacity: isActive ? 1 : 0.25,
                      color: isActive ? theme.palette.primary.main : 'inherit',
                      transform: isActive ? 'translateX(2px)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                </Box>
              );
            })}
          </Paper>
        </Box>

        {/* Tab Content Area (Only this area scrolls) */}
        <Box sx={{ flexGrow: 1, minWidth: 0, height: '100%', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ height: '100%' }}
            >
              <Paper elevation={0} sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px',
                p: { xs: 2, md: 3 },
                bgcolor: 'background.paper',
                boxShadow: '0 4px 16px -5px rgba(0, 0, 0, 0.02)',
                height: '100%',
                overflowY: 'auto',
                pr: 1.5,
                '&::-webkit-scrollbar': {
                  width: '6px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: '10px'
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: alpha(theme.palette.primary.main, 0.4)
                }
              }}>
                <Box component={motion.div} variants={containerVariants} initial="hidden" animate="show">

                  {/* Tab 0: Contact & Web */}
                  {activeTab === 0 && (
                    <Box>
                      {sectionTitle('Contact & Web Configuration', IconBuilding)}
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="caption" sx={{ mb: 1.5, display: 'block', color: 'text.primary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address Details</Typography>
                          <Stack spacing={2}>
                            <motion.div variants={itemVariants}><TextField {...fieldProps('address', 'Full Address')} multiline rows={2} fullWidth inputProps={{ maxLength: 500 }} /></motion.div>
                            <motion.div variants={itemVariants}><DropdownField name="country" label="Country *" options={COUNTRIES} /></motion.div>
                            <motion.div variants={itemVariants}><DropdownField name="state" label="State/Province *" options={statesForCountry} disabled={!form.country} /></motion.div>
                            <Grid container spacing={1.5}>
                              <Grid item xs={7}><motion.div variants={itemVariants}><DropdownField name="city" label="City *" options={citiesForState} disabled={!form.state} /></motion.div></Grid>
                              <Grid item xs={5}><motion.div variants={itemVariants}><TextField {...fieldProps('pincode', 'Postal Code')} inputProps={{ maxLength: 6 }} /></motion.div></Grid>
                            </Grid>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="caption" sx={{ mb: 1.5, display: 'block', color: 'text.primary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Digital Presence & Contact</Typography>
                          <Stack spacing={2}>
                            <motion.div variants={itemVariants}><TextField {...fieldProps('emailId', 'Primary Email Address')} /></motion.div>
                            <motion.div variants={itemVariants}><TextField {...fieldProps('website', 'Company Website')} /></motion.div>
                            <Grid container spacing={1.5}>
                              <Grid item xs={6}><motion.div variants={itemVariants}>
                                <BOSTextField
                                  name="mobileNo"
                                  label="Mobile Number"
                                  value={form.mobileNo || ''}
                                  onChange={handleChange}
                                  error={!!errors.mobileNo}
                                  helperText={errors.mobileNo}
                                /></motion.div></Grid>
                              <Grid item xs={6}><motion.div variants={itemVariants}>
                                <BOSTextField
                                  name="phoneNo"
                                  label="Landline Number"
                                  value={form.phoneNo || ''}
                                  onChange={handleChange}
                                  error={!!errors.phoneNo}
                                  helperText={errors.phoneNo}
                                /></motion.div></Grid>
                            </Grid>
                            <Grid container spacing={1.5}>
                              <Grid item xs={6}><motion.div variants={itemVariants}><TextField {...fieldProps('supportEmail', 'Support Email')} /></motion.div></Grid>
                              <Grid item xs={6}><motion.div variants={itemVariants}>
                                <BOSTextField
                                  name="supportPhone"
                                  label="Support Phone"
                                  value={form.supportPhone || ''}
                                  onChange={handleChange}
                                  error={!!errors.supportPhone}
                                  helperText={errors.supportPhone}
                                /></motion.div></Grid>
                            </Grid>
                            <motion.div variants={itemVariants}>
                              <TextField
                                name="gmaplink" value={form.gmaplink || ''} onChange={handleChange} placeholder="Google Maps Coordinates" size="small" label="Location Map Link"
                                InputProps={{
                                  style: { color: 'text.primary', fontWeight: 500 },
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      {form.gmaplink && (
                                        <Tooltip title="View Map"><IconButton sx={{ color: theme.palette.info.main }} onClick={() => window.open(form.gmaplink, '_blank')} size="small"><IconExternalLink size={16} /></IconButton></Tooltip>
                                      )}
                                      <Tooltip title="Pick Location"><IconButton sx={{ color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) }} onClick={openMapDialog} size="small"><IconMapPin size={16} /></IconButton></Tooltip>
                                    </InputAdornment>
                                  )
                                }}
                                sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: 'background.paper', '& fieldset': { borderColor: theme.palette.divider, borderWidth: '1px' }, '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main } } }}
                              />
                            </motion.div>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Tab 1: Branding & Identity */}
                  {activeTab === 1 && (
                    <Box>
                      {sectionTitle('Branding & Visual Identity', IconPhoto)}
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <motion.div variants={itemVariants}>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.primary', fontWeight: 700 }}>Primary Logo</Typography>
                            <ImageUploadCard label="Company Logo" icon={IconPhoto} field="logoFileName" preview={form.logoFileName} onUpload={handleImageUpload} uploading={uploading.logo} onView={setPreviewImage} />
                          </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <motion.div variants={itemVariants}>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.primary', fontWeight: 700 }}>Login Background</Typography>
                            <ImageUploadCard label="Login Background" icon={IconLogin} field="logInBgFileName" preview={form.logInBgFileName} onUpload={handleImageUpload} uploading={uploading.bg} onView={setPreviewImage} />
                          </motion.div>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Tab 2: App Config */}
                  {activeTab === 2 && (
                    <Box>
                      {sectionTitle('Application Preferences', IconSettings2)}
                      <Grid container spacing={2} sx={{ mb: 2, width: '100%' }} >
                        <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '30%' } }}>
                          <motion.div variants={itemVariants} style={{ width: '100%' }}><DropdownField name="inputCaseStyle" label="Global Text Input Case" options={['UPPER_CASE', 'PROPER_CASE', 'LOWER_CASE', 'CUSTOM']} fullWidth /></motion.div></Grid>
                        <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '30%' } }}>
                          <motion.div variants={itemVariants} style={{ width: '100%' }}><DropdownField name="currencyCode" label="Base Currency" options={CURRENCIES} fullWidth /></motion.div></Grid>
                        <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '30%' } }}>
                          <motion.div variants={itemVariants} style={{ width: '100%' }}><TextField {...fieldProps('decimalPlaces', 'Decimal Places')} type="number" inputProps={{ min: 0, max: 10 }} /></motion.div></Grid>
                      </Grid>
                      <Grid container spacing={2} sx={{ mb: 2, width: '100%' }} >
                        <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '30%' } }}><motion.div variants={itemVariants} style={{ width: '100%' }}><TextField {...fieldProps('defaultRowsPerPage', 'Rows Per Page')} type="number" inputProps={{ min: 5, max: 500 }} /></motion.div></Grid>
                        <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '30%' } }}><motion.div variants={itemVariants} style={{ width: '100%' }}><TextField {...fieldProps('defaultMaxRecords', 'Max Records')} type="number" inputProps={{ min: 10, max: 10000 }} /></motion.div></Grid>
                        <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '30%' } }}><motion.div variants={itemVariants} style={{ width: '100%' }}><TextField {...fieldProps('autoLogoutSeconds', 'Auto Logout (seconds)')} type="number" inputProps={{ min: 10, max: 3600 }} /></motion.div></Grid>
                        <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '30%' } }}>
                          <motion.div variants={itemVariants}>
                            <FormControlLabel
                              control={
                                <IOSSwitch
                                  checked={form.allowDuplicateScreens || false}
                                  onChange={(e) => setForm(prev => ({ ...prev, allowDuplicateScreens: e.target.checked }))}
                                  color="primary"
                                />
                              }
                              label={<Typography variant="body2" fontWeight={500}>Allow Duplicate Screens</Typography>}
                              sx={{ ml: 1, mt: 1 }}
                            />
                          </motion.div>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <motion.div variants={itemVariants}>
                            <FormControlLabel
                              control={
                                <IOSSwitch
                                  checked={form.allowRightClick !== false}
                                  onChange={(e) => setForm(prev => ({ ...prev, allowRightClick: e.target.checked }))}
                                  color="primary"
                                />
                              }
                              label={<Typography variant="body2" fontWeight={500}>Allow Right Click</Typography>}
                              sx={{ ml: 1, mt: 1 }}
                            />
                          </motion.div>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <motion.div variants={itemVariants}>
                            <FormControlLabel
                              control={
                                <IOSSwitch
                                  checked={form.singleActiveSession || false}
                                  onChange={(e) => setForm(prev => ({ ...prev, singleActiveSession: e.target.checked }))}
                                  color="primary"
                                />
                              }
                              label={<Typography variant="body2" fontWeight={500}>Single Active Session</Typography>}
                              sx={{ ml: 1, mt: 1 }}
                            />
                          </motion.div>
                        </Grid>
                      </Grid>

                      {/* ─── Date & Time Settings ─────────────────────────── */}
                      <Box sx={{ mt: 3, mb: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.primary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
                          Date &amp; Time Settings
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 2, width: '100%' }}>
                          {/* Time Format */}
                          <Grid item xs={12} md={3} sx={{ width: { xs: '100%', md: '30%' } }}>
                            <motion.div variants={itemVariants} style={{ width: '100%' }}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Time Format</InputLabel>
                                <Select
                                  name="timeFormat"
                                  value={form.timeFormat || 'H24'}
                                  label="Time Format"
                                  onChange={handleChange}
                                >
                                  <MenuItem value="H24">24-Hour (14:30)</MenuItem>
                                  <MenuItem value="H12">12-Hour (02:30 PM)</MenuItem>
                                </Select>
                              </FormControl>
                            </motion.div>
                          </Grid>
                          {/* Date Format */}
                          <Grid item xs={12} md={3} sx={{ width: { xs: '100%', md: '30%' } }}>
                            <motion.div variants={itemVariants} style={{ width: '100%' }}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Date Format</InputLabel>
                                <Select
                                  name="dateFormat"
                                  value={form.dateFormat || 'DD/MM/YYYY'}
                                  label="Date Format"
                                  onChange={handleChange}
                                >
                                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</MenuItem>
                                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</MenuItem>
                                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</MenuItem>
                                </Select>
                              </FormControl>
                            </motion.div>
                          </Grid>
                          {/* Week Starts On */}
                          <Grid item xs={12} md={3} sx={{ width: { xs: '100%', md: '30%' } }}>
                            <motion.div variants={itemVariants} style={{ width: '100%' }}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Week Starts On</InputLabel>
                                <Select
                                  name="weekStartsOn"
                                  value={form.weekStartsOn || 'MONDAY'}
                                  label="Week Starts On"
                                  onChange={handleChange}
                                >
                                  <MenuItem value="MONDAY">Monday</MenuItem>
                                  <MenuItem value="SUNDAY">Sunday</MenuItem>
                                  <MenuItem value="SATURDAY">Saturday</MenuItem>
                                </Select>
                              </FormControl>
                            </motion.div>
                          </Grid>
                          {/* Timezone */}
                          <Grid item xs={12} md={3} sx={{ width: { xs: '100%', md: '30%' } }}>
                            <motion.div variants={itemVariants} style={{ width: '100%' }}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Timezone</InputLabel>
                                <Select
                                  name="appTimezone"
                                  value={form.appTimezone || 'Asia/Kolkata'}
                                  label="Timezone"
                                  onChange={handleChange}
                                >
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
                        </Grid>
                      </Box>
                    </Box>
                  )}

                  {activeTab === 3 && isSuperUser && (
                    <Box>
                      {sectionTitle('Central Document Storage Path & Expiry Warnings', IconFolder)}
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            name="directoryPath"
                            label="Central Document Storage Path"
                            value={form.directoryPath || ''}
                            onChange={handleChange}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={handleOpenBrowser} size="small" edge="end">
                                    <IconFolderOpen size={18} />
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField {...fieldProps('licExpRemainderDays', 'License Expiry Warning (Days)')} type="number" />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField {...fieldProps('restoreEnableDays', 'Grace Period / Restore Limit (Days)')} type="number" />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {activeTab === 4 && isSuperUser && (() => {
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                          {sectionTitle('Microsoft Outlook Integration', IconMail)}
                          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                Outlook Connection Status
                              </Typography>
                              <Chip
                                label={statusInfo.label}
                                color={statusInfo.chipColor}
                                variant="filled"
                                sx={{ fontWeight: 700, px: 1 }}
                              />
                            </Box>
                            <Alert severity={statusInfo.severity} variant="outlined" sx={{ borderRadius: '8px', bgcolor: 'action.hover' }}>
                              {statusInfo.text}
                            </Alert>
                          </Paper>

                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1.5 }}>
                                🔒 Azure Active Directory Credentials
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField {...fieldProps('ocrTenantId', 'Tenant ID')} placeholder="e.g. 00000000-0000-0000-0000-000000000000" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField {...fieldProps('ocrClientId', 'Client ID')} placeholder="e.g. 00000000-0000-0000-0000-000000000000" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                {...fieldProps('ocrClientSecret', 'Client Secret')}
                                type={showClientSecret ? 'text' : 'password'}
                                placeholder="••••••••••••••••"
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton onClick={() => setShowClientSecret(!showClientSecret)} edge="end" sx={{ color: 'text.secondary' }}>
                                        {showClientSecret ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                      </IconButton>
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1.5 }}>
                                ✉️ Outlook Account Settings
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField {...fieldProps('ocrSharedMailbox', 'Outlook Email Address')} placeholder="e.g. employee@company.com" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField {...fieldProps('ocrProcessedFolder', 'Processed Folder')} placeholder="e.g. Processed" />
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 1 }}>
                              <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<IconExternalLink size={16} />}
                                onClick={handleConnectOutlookClick}
                                disabled={!form.ocrSharedMailbox}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 3, py: 1 }}
                              >
                                🔗 Connect Outlook Account (Microsoft SSO)
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    );
                  })()}

                  {activeTab === 5 && isSuperUser && (
                    <Box>
                      {sectionTitle('Mail Server (SMTP) Configuration', IconSettings2)}
                      <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={5}>
                          <TextField {...fieldProps('smtpHost', 'SMTP Host')} placeholder="e.g. smtp.gmail.com" />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField {...fieldProps('smtpPort', 'Port')} type="number" placeholder="587" />
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                name="smtpSslEnabled"
                                checked={Boolean(form.smtpSslEnabled)}
                                onChange={(e) => setForm(prev => ({ ...prev, smtpSslEnabled: e.target.checked }))}
                              />
                            }
                            label={<Typography variant="body2" fontWeight={500}>Enable SSL/TLS</Typography>}
                            sx={{ mt: 1 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField {...fieldProps('smtpUsername', 'Username')} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField {...fieldProps('smtpPassword', 'Password')} type="password" />
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 3 }} />

                      {sectionTitle('Send a Test Email', IconMail)}
                      <Box sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Enter an email address and click <strong>Send Test</strong> to verify your SMTP configuration is working.
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <TextField
                            size="small"
                            label="Recipient Email"
                            value={testEmailRecipient}
                            onChange={(e) => setTestEmailRecipient((e.target.value || '').toLowerCase())}
                            placeholder="e.g. admin@yourcompany.com"
                            disabled={testEmailLoading}
                            fullWidth
                            inputProps={{
                              style: { textTransform: 'lowercase' }
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                bgcolor: theme.palette.background.paper,
                                '& fieldset': { borderColor: theme.palette.divider },
                                '& input': { textTransform: 'lowercase !important' }
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleTestSmtp}
                            disabled={testEmailLoading || !testEmailRecipient.trim()}
                            startIcon={testEmailLoading ? <CircularProgress size={14} color="inherit" /> : <IconSend size={16} />}
                            sx={{ whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600, height: 40, borderRadius: '8px' }}
                          >
                            {testEmailLoading ? 'Sending...' : 'Send Test'}
                          </Button>
                        </Stack>
                        {testEmailResult && (
                          <Alert severity={testEmailResult.success ? 'success' : 'error'} sx={{ mt: 2, borderRadius: '8px' }}>
                            {testEmailResult.message}
                          </Alert>
                        )}
                      </Box>
                    </Box>
                  )}

                  {activeTab === 6 && isSuperUser && (
                    <Box>
                      {sectionTitle('ESSL Biometric Attendance Database Connection', IconSettings2)}
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <TextField {...fieldProps('esslServerIp', 'Server/IP Address')} placeholder="e.g. 192.168.1.2" />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField {...fieldProps('esslPort', 'Port')} type="number" placeholder="1433" />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField {...fieldProps('esslUsername', 'Username')} placeholder="e.g. sa" />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField {...fieldProps('esslPassword', 'Password')} type="password" placeholder="••••••••" />
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            onClick={handleConnect}
                            disabled={testEsslLoading}
                            startIcon={testEsslLoading ? <CircularProgress size={14} color="inherit" /> : null}
                            sx={{ height: 40, textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                          >
                            {testEsslLoading ? 'Connecting...' : 'Connect'}
                          </Button>
                        </Grid>

                        <Grid item xs={12} md={9}>
                          <FormControl fullWidth size="small" disabled={!esslConnected}>
                            <InputLabel>Database Name</InputLabel>
                            <Select
                              name="esslDbName"
                              value={form.esslDbName || ''}
                              label="Database Name"
                              onChange={handleChange}
                              sx={{ height: 40, borderRadius: '8px' }}
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

                        {testEsslResult && (
                          <Grid item xs={12}>
                            <Alert severity={testEsslResult.success ? 'success' : 'error'} sx={{ borderRadius: '8px' }}>
                              {testEsslResult.message}
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}

                  {/* ── TAB 7: LOGIN ACCESS SECURITY (SUPER USER ONLY) ── */}
                  {activeTab === 7 && isSuperUser && (
                    <Box component={motion.div} variants={containerVariants} initial="hidden" animate="show">
                      <LoginSecurityTab companyId={recordId || 1} readOnly={!isSuperUser && !perms?.write} />
                    </Box>
                  )}

                </Box>
              </Paper>
            </motion.div>
          </AnimatePresence>
        </Box>
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

export default CompanyProfile;
