import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  useTheme,
  Autocomplete,
  InputAdornment,
  Avatar,
  alpha,
  ToggleButton,
  ToggleButtonGroup,
  Badge
} from '@mui/material';
import {
  IconShieldLock,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDeviceDesktop,
  IconNetwork,
  IconHistory,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconInfoCircle,
  IconCopy,
  IconShieldCheck,
  IconShieldX,
  IconDeviceLaptop,
  IconWorld
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { showAppAlert } from 'utils/alert';
import { getOrCreateDeviceIdentifier, getDeviceName, getAgentProvidedMac } from 'utils/deviceHelper';

const LoginSecurityTab = ({ companyId, readOnly }) => {
  const theme = useTheme();
  const globalQuery = useSelector((state) => state.search.query) || '';

  // State: Configuration
  const [config, setConfig] = useState({
    securityEnabled: false,
    accessControlMethod: 'IP',
    status: 'ACTIVE',
    activeIpCount: 0,
    activeDeviceCount: 0,
    recentBlockedCount: 0
  });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Sub-tabs: 0 = IPs, 1 = Devices, 2 = Logs, 3 = Audits
  const [subTab, setSubTab] = useState(0);

  // Client Info for Current Machine
  const [clientInfo, setClientInfo] = useState(null);

  // Allowed IPs State
  const [ips, setIps] = useState([]);
  const [loadingIps, setLoadingIps] = useState(false);
  const [ipModalOpen, setIpModalOpen] = useState(false);
  const [editingIp, setEditingIp] = useState(null);
  const [ipFormData, setIpFormData] = useState({
    ipAddress: '',
    description: '',
    status: 'ACTIVE',
    validFrom: '',
    validTo: '',
    remarks: ''
  });

  // Registered Devices State
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceFormData, setDeviceFormData] = useState({
    deviceCode: '',
    deviceName: '',
    deviceIdentifier: '',
    macAddress: '',
    ipAddress: '',
    userId: '',
    status: 'ACTIVE',
    validFrom: '',
    validTo: '',
    remarks: ''
  });

  // Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Audits State
  const [audits, setAudits] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  // Lockout Warning Dialog
  const [lockoutDialogOpen, setLockoutDialogOpen] = useState(false);
  const [pendingMethod, setPendingMethod] = useState(null);

  // Users List State for Dropdown Selection
  const [usersList, setUsersList] = useState([]);

  // Formatted User Options for Autocomplete with Robust Search Filtering
  const userDropdownOptions = useMemo(() => {
    return [
      { userId: '', label: 'All Users (Any Authorized User Can Log In)', name: 'All Users', roleName: 'Global Access' },
      ...usersList.map((u) => {
        const uId = String(u.userId || u.id || '').trim();
        const uName = String(u.name || u.userName || u.fullName || '').trim();
        const uRole = String(u.roleName || u.userType || '').trim();
        return {
          userId: uId,
          name: uName,
          roleName: uRole,
          label: `${uId}${uName ? ` - ${uName}` : ''}${uRole ? ` (${uRole})` : ''}`
        };
      })
    ];
  }, [usersList]);

  const isItemActive = (item) => {
    if (!item) return false;
    const s = item.status;
    return s === true || s === 1 || s === '1' || String(s).toUpperCase() === 'ACTIVE' || String(s).toUpperCase() === 'TRUE';
  };

  // Load Active Users List
  const fetchUsersList = useCallback(async () => {
    try {
      const res = await axios.get('/api/users/all');
      if (Array.isArray(res.data)) {
        setUsersList(res.data);
      }
    } catch (e) {
      console.warn('Could not fetch users list:', e);
    }
  }, []);

  // Load Client Info
  const fetchClientInfo = useCallback(async () => {
    try {
      const res = await axios.get('/api/company-profile/login-security/current-client-info');
      setClientInfo(res.data);
    } catch (e) {
      console.warn('Could not fetch client info:', e);
    }
  }, []);

  // Load Config
  const fetchConfig = useCallback(async () => {
    if (!companyId) return;
    setLoadingConfig(true);
    try {
      const res = await axios.get(`/api/company-profile/login-security/${companyId}`);
      if (res.data) {
        setConfig(res.data);
      }
    } catch (e) {
      console.error('Failed to load login security config:', e);
    } finally {
      setLoadingConfig(false);
    }
  }, [companyId]);

  // Load IPs
  const fetchIps = useCallback(async () => {
    if (!companyId) return;
    setLoadingIps(true);
    try {
      const res = await axios.get(`/api/company-profile/login-security/${companyId}/ips`);
      setIps(res.data || []);
    } catch (e) {
      console.error('Failed to load allowed IPs:', e);
    } finally {
      setLoadingIps(false);
    }
  }, [companyId]);

  // Load Devices
  const fetchDevices = useCallback(async () => {
    if (!companyId) return;
    setLoadingDevices(true);
    try {
      const res = await axios.get(`/api/company-profile/login-security/${companyId}/devices`);
      setDevices(res.data || []);
    } catch (e) {
      console.error('Failed to load registered devices:', e);
    } finally {
      setLoadingDevices(false);
    }
  }, [companyId]);

  // Load Logs
  const fetchLogs = useCallback(async () => {
    if (!companyId) return;
    setLoadingLogs(true);
    try {
      const res = await axios.get(`/api/company-profile/login-security/${companyId}/logs?size=100`);
      setLogs(res.data?.content || res.data || []);
    } catch (e) {
      console.error('Failed to load login logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  }, [companyId]);

  // Load Audits
  const fetchAudits = useCallback(async () => {
    if (!companyId) return;
    setLoadingAudits(true);
    try {
      const res = await axios.get(`/api/company-profile/login-security/${companyId}/audits`);
      setAudits(res.data || []);
    } catch (e) {
      console.error('Failed to load security audits:', e);
    } finally {
      setLoadingAudits(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchClientInfo();
    fetchConfig();
    fetchIps();
    fetchDevices();
    fetchUsersList();
  }, [fetchClientInfo, fetchConfig, fetchIps, fetchDevices, fetchUsersList]);

  useEffect(() => {
    if (subTab === 2) fetchLogs();
    if (subTab === 3) fetchAudits();
  }, [subTab, fetchLogs, fetchAudits]);

  // Handle Security ON/OFF Toggle
  const handleToggleSecurity = async (newEnabled) => {
    if (readOnly) return;
    const targetMethod = config.accessControlMethod || 'IP';

    // Lockout Warning Guard: If turning ON, check if current IP/Device exists in allowed list
    if (newEnabled) {
      const currentIp = clientInfo?.clientIp || '127.0.0.1';
      const currentDeviceId = getOrCreateDeviceIdentifier();

      const ipMatch = ips.some((i) => isItemActive(i) && (i.ipAddress === currentIp || currentIp === '127.0.0.1'));
      const devMatch = devices.some((d) => isItemActive(d) && d.deviceIdentifier === currentDeviceId);

      const requiresIp = targetMethod === 'IP' || targetMethod === 'IP_DEVICE';
      const requiresDev = targetMethod === 'DEVICE' || targetMethod === 'IP_DEVICE';

      const ipMissing = requiresIp && !ipMatch;
      const devMissing = requiresDev && !devMatch;

      if (ipMissing || devMissing) {
        setPendingMethod(targetMethod);
        setLockoutDialogOpen(true);
        return;
      }
    }

    applySecurityUpdate({ ...config, securityEnabled: newEnabled });
  };

  const handleMethodChange = async (e) => {
    if (readOnly) return;
    const newMethod = e.target.value;
    if (config.securityEnabled) {
      const currentIp = clientInfo?.clientIp || '127.0.0.1';
      const currentDeviceId = getOrCreateDeviceIdentifier();

      const ipMatch = ips.some((i) => isItemActive(i) && (i.ipAddress === currentIp || currentIp === '127.0.0.1'));
      const devMatch = devices.some((d) => isItemActive(d) && d.deviceIdentifier === currentDeviceId);

      const requiresIp = newMethod === 'IP' || newMethod === 'IP_DEVICE';
      const requiresDev = newMethod === 'DEVICE' || newMethod === 'IP_DEVICE';

      if ((requiresIp && !ipMatch) || (requiresDev && !devMatch)) {
        setPendingMethod(newMethod);
        setLockoutDialogOpen(true);
        return;
      }
    }
    applySecurityUpdate({ ...config, accessControlMethod: newMethod });
  };

  const applySecurityUpdate = async (updatedConfig) => {
    setSavingConfig(true);
    try {
      const res = await axios.put(`/api/company-profile/login-security/${companyId}`, updatedConfig);
      setConfig(res.data);
      showAppAlert(
        updatedConfig.securityEnabled ? 'Login Access Security ENABLED' : 'Login Access Security DISABLED',
        'success'
      );
      fetchConfig();
      fetchAudits();
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update Login Security configuration';
      showAppAlert(msg, 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // 1-Click Authorize Current IP & Device Safeguard
  const handleAuthorizeCurrentMachineAndEnable = async () => {
    try {
      const currentIp = clientInfo?.clientIp || '127.0.0.1';
      const currentDeviceId = getOrCreateDeviceIdentifier();
      const currentDeviceName = getDeviceName();
      const agentMac = getAgentProvidedMac();

      // 1. Save Allowed IP if needed
      const method = pendingMethod || config.accessControlMethod || 'IP';
      if (method === 'IP' || method === 'IP_DEVICE') {
        const ipExists = ips.some((i) => i.ipAddress === currentIp);
        if (!ipExists) {
          await axios.post(`/api/company-profile/login-security/${companyId}/ips`, {
            ipAddress: currentIp,
            description: 'Administrator Workstation IP (Auto-Authorized)',
            status: true
          });
        }
      }

      // 2. Register Device if needed
      if (method === 'DEVICE' || method === 'IP_DEVICE') {
        const devExists = devices.some((d) => d.deviceIdentifier === currentDeviceId);
        if (!devExists) {
          await axios.post(`/api/company-profile/login-security/${companyId}/devices`, {
            deviceName: currentDeviceName,
            deviceIdentifier: currentDeviceId,
            macAddress: agentMac || null,
            ipAddress: currentIp,
            status: true,
            remarks: 'Administrator Workstation (Auto-Authorized)'
          });
        }
      }

      setLockoutDialogOpen(false);
      await fetchIps();
      await fetchDevices();

      // Enable security
      await applySecurityUpdate({
        ...config,
        securityEnabled: true,
        accessControlMethod: method
      });
    } catch (e) {
      showAppAlert(e.response?.data?.message || 'Failed to auto-authorize current machine', 'error');
    }
  };

  // Allowed IP Handlers
  const handleOpenAddIp = () => {
    setEditingIp(null);
    setIpFormData({
      ipAddress: clientInfo?.clientIp || '',
      description: '',
      status: true,
      validFrom: '',
      validTo: '',
      remarks: ''
    });
    setIpModalOpen(true);
  };

  const handleOpenEditIp = (ip) => {
    setEditingIp(ip);
    setIpFormData({
      ipAddress: ip.ipAddress || '',
      description: ip.description || '',
      status: isItemActive(ip),
      validFrom: ip.validFrom ? ip.validFrom.substring(0, 10) : '',
      validTo: ip.validTo ? ip.validTo.substring(0, 10) : '',
      remarks: ip.remarks || ''
    });
    setIpModalOpen(true);
  };

  const handleSaveIp = async () => {
    if (!ipFormData.ipAddress || !ipFormData.ipAddress.trim()) {
      showAppAlert('IP Address is required', 'error');
      return;
    }
    try {
      const payload = {
        ...ipFormData,
        validFrom: ipFormData.validFrom ? ipFormData.validFrom : null,
        validTo: ipFormData.validTo ? ipFormData.validTo : null,
        status: isItemActive(ipFormData),
        id: editingIp ? editingIp.id : null,
        companyId
      };
      await axios.post(`/api/company-profile/login-security/${companyId}/ips`, payload);
      showAppAlert(editingIp ? 'IP address updated' : 'Allowed IP added successfully', 'success');
      setIpModalOpen(false);
      fetchIps();
      fetchConfig();
    } catch (e) {
      showAppAlert(e.response?.data?.message || 'Failed to save IP address', 'error');
    }
  };

  const handleToggleIpStatus = async (ip) => {
    if (readOnly) return;
    const newStatus = !isItemActive(ip);
    try {
      await axios.put(`/api/company-profile/login-security/${companyId}/ips/${ip.id}/toggle?active=${newStatus}`);
      showAppAlert(`IP ${newStatus ? 'activated' : 'deactivated'}`, 'success');
      fetchIps();
      fetchConfig();
    } catch (e) {
      showAppAlert(e.response?.data?.message || 'Failed to update IP status', 'error');
    }
  };

  const handleDeleteIp = async (ip) => {
    if (readOnly) return;
    if (!window.confirm(`Are you sure you want to delete allowed IP: ${ip.ipAddress}?`)) return;
    try {
      await axios.delete(`/api/company-profile/login-security/${companyId}/ips/${ip.id}`);
      showAppAlert('Allowed IP deleted', 'success');
      fetchIps();
      fetchConfig();
    } catch (e) {
      showAppAlert(e.response?.data?.message || 'Failed to delete IP', 'error');
    }
  };

  // Registered Device Handlers
  const handleRegisterCurrentDevice = async () => {
    const currentDeviceId = getOrCreateDeviceIdentifier();
    const currentDeviceName = getDeviceName();
    const currentIp = clientInfo?.clientIp || '';
    const agentMac = getAgentProvidedMac();

    setEditingDevice(null);
    setDeviceFormData({
      deviceCode: clientInfo?.suggestedDeviceCode || 'DEV-ADMIN',
      deviceName: currentDeviceName,
      deviceIdentifier: currentDeviceId,
      macAddress: agentMac || '',
      ipAddress: currentIp,
      userId: '',
      status: true,
      validFrom: '',
      validTo: '',
      remarks: 'Current Administrator Workstation'
    });
    setDeviceModalOpen(true);
  };

  const handleOpenAddDevice = () => {
    setEditingDevice(null);
    setDeviceFormData({
      deviceCode: '',
      deviceName: '',
      deviceIdentifier: '',
      macAddress: '',
      ipAddress: clientInfo?.clientIp || '',
      userId: '',
      status: true,
      validFrom: '',
      validTo: '',
      remarks: ''
    });
    setDeviceModalOpen(true);
  };

  const handleOpenEditDevice = (dev) => {
    setEditingDevice(dev);
    setDeviceFormData({
      deviceCode: dev.deviceCode || '',
      deviceName: dev.deviceName || '',
      deviceIdentifier: dev.deviceIdentifier || '',
      macAddress: dev.macAddress || '',
      ipAddress: dev.ipAddress || '',
      userId: dev.userId || '',
      status: isItemActive(dev),
      validFrom: dev.validFrom ? dev.validFrom.substring(0, 10) : '',
      validTo: dev.validTo ? dev.validTo.substring(0, 10) : '',
      remarks: dev.remarks || ''
    });
    setDeviceModalOpen(true);
  };

  const handleSaveDevice = async () => {
    if (!deviceFormData.deviceName || !deviceFormData.deviceName.trim()) {
      showAppAlert('Device Name is required', 'error');
      return;
    }
    if (!deviceFormData.deviceIdentifier || !deviceFormData.deviceIdentifier.trim()) {
      showAppAlert('Device Identifier is required', 'error');
      return;
    }
    try {
      const payload = {
        ...deviceFormData,
        validFrom: deviceFormData.validFrom ? deviceFormData.validFrom : null,
        validTo: deviceFormData.validTo ? deviceFormData.validTo : null,
        status: isItemActive(deviceFormData),
        id: editingDevice ? editingDevice.id : null,
        companyId
      };
      await axios.post(`/api/company-profile/login-security/${companyId}/devices`, payload);
      showAppAlert(editingDevice ? 'Device details updated' : 'Device registered successfully', 'success');
      setDeviceModalOpen(false);
      fetchDevices();
      fetchConfig();
    } catch (e) {
      showAppAlert(e.response?.data?.message || 'Failed to save device', 'error');
    }
  };

  const handleToggleDeviceStatus = async (dev) => {
    if (readOnly) return;
    const newStatus = !isItemActive(dev);
    try {
      await axios.put(`/api/company-profile/login-security/${companyId}/devices/${dev.id}/toggle?active=${newStatus}`);
      showAppAlert(`Device ${newStatus ? 'activated' : 'deactivated'}`, 'success');
      fetchDevices();
      fetchConfig();
    } catch (e) {
      showAppAlert(e.response?.data?.message || 'Failed to update device status', 'error');
    }
  };

  const handleDeleteDevice = async (dev) => {
    if (readOnly) return;
    if (!window.confirm(`Are you sure you want to delete registered device: ${dev.deviceName}?`)) return;
    try {
      await axios.delete(`/api/company-profile/login-security/${companyId}/devices/${dev.id}`);
      showAppAlert('Device deleted', 'success');
      fetchDevices();
      fetchConfig();
    } catch (e) {
      showAppAlert(e.response?.data?.message || 'Failed to delete device', 'error');
    }
  };

  // Filtered lists connected to Global Search Filter
  const filteredIps = useMemo(() => {
    const q = (globalQuery || '').trim().toLowerCase();
    if (!q) return ips;
    return ips.filter(
      (i) =>
        (i.ipAddress && i.ipAddress.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.createdBy && i.createdBy.toLowerCase().includes(q)) ||
        (i.remarks && i.remarks.toLowerCase().includes(q))
    );
  }, [ips, globalQuery]);

  const filteredDevices = useMemo(() => {
    const q = (globalQuery || '').trim().toLowerCase();
    if (!q) return devices;
    return devices.filter(
      (d) =>
        (d.deviceName && d.deviceName.toLowerCase().includes(q)) ||
        (d.deviceCode && d.deviceCode.toLowerCase().includes(q)) ||
        (d.deviceIdentifier && d.deviceIdentifier.toLowerCase().includes(q)) ||
        (d.macAddress && d.macAddress.toLowerCase().includes(q)) ||
        (d.ipAddress && d.ipAddress.toLowerCase().includes(q)) ||
        (d.userId && d.userId.toLowerCase().includes(q)) ||
        (d.userFullName && d.userFullName.toLowerCase().includes(q)) ||
        (d.remarks && d.remarks.toLowerCase().includes(q))
    );
  }, [devices, globalQuery]);

  const filteredLogs = useMemo(() => {
    const q = (globalQuery || '').trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      return (
        (l.userId && l.userId.toLowerCase().includes(q)) ||
        (l.sourceIp && l.sourceIp.toLowerCase().includes(q)) ||
        (l.deviceIdentifier && l.deviceIdentifier.toLowerCase().includes(q)) ||
        (l.macAddress && l.macAddress.toLowerCase().includes(q)) ||
        (l.policyMethod && l.policyMethod.toLowerCase().includes(q)) ||
        (l.loginStatus && l.loginStatus.toLowerCase().includes(q)) ||
        (l.failureReason && l.failureReason.toLowerCase().includes(q))
      );
    });
  }, [logs, globalQuery]);

  const filteredAudits = useMemo(() => {
    const q = (globalQuery || '').trim().toLowerCase();
    if (!q) return audits;
    return audits.filter(
      (a) =>
        (a.action && a.action.toLowerCase().includes(q)) ||
        (a.remarks && a.remarks.toLowerCase().includes(q)) ||
        (a.changedBy && a.changedBy.toLowerCase().includes(q))
    );
  }, [audits, globalQuery]);

  const formatValidity = (validFrom, validTo) => {
    if (!validFrom && !validTo) {
      return (
        <Chip
          size="small"
          label="Permanent"
          sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}
        />
      );
    }
    return (
      <Chip
        size="small"
        variant="outlined"
        label={`${validFrom ? validFrom.substring(0, 10) : 'Any'} → ${validTo ? validTo.substring(0, 10) : 'Any'}`}
        sx={{ fontSize: '0.75rem', fontWeight: 600 }}
      />
    );
  };

  const dynamicTableContainerSx = {
    maxHeight: 'calc(100vh - 355px)',
    minHeight: 260,
    overflowY: 'auto',
    overflowX: 'auto',
    isolation: 'isolate',
    '&::-webkit-scrollbar': { width: 6, height: 6 },
    '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'grey.300',
      borderRadius: 10,
      '&:hover': { backgroundColor: 'grey.400' }
    }
  };

  const tableHeaderCellSx = {
    backgroundColor: 'background.paper !important',
    bgcolor: 'background.paper !important',
    color: 'text.primary !important',
    fontWeight: 700,
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    py: 1.2,
    borderBottom: '1px solid',
    borderColor: 'divider'
  };

  const dynamicTableHeadSx = {
    position: 'sticky',
    top: 0,
    zIndex: 3,
    bgcolor: 'background.paper',
    '& th, & .MuiTableCell-root': {
      backgroundColor: 'background.paper !important',
      bgcolor: 'background.paper !important',
      color: 'text.primary !important',
      borderBottom: '1px solid',
      borderColor: 'divider'
    }
  };

  return (
    <Box>
      {/* ── TOP BANNER & EXECUTIVE SECURITY CONTROL PANEL ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2.5,
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.04)'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Col 1: Security Status & Toggle Switch */}
          <Grid item xs={12} md={4.5} lg={4}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: config.securityEnabled ? alpha(theme.palette.success.main, 0.12) : alpha(theme.palette.grey[500], 0.12),
                  color: config.securityEnabled ? 'success.main' : 'text.secondary',
                  border: `2px solid ${config.securityEnabled ? theme.palette.success.main : theme.palette.divider}`,
                  boxShadow: config.securityEnabled ? `0 0 16px ${alpha(theme.palette.success.main, 0.25)}` : 'none'
                }}
              >
                <IconShieldLock size={28} />
              </Avatar>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
                    Login Access Security
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={config.securityEnabled ? 'PROTECTION ACTIVE' : 'PROTECTION OFF'}
                    color={config.securityEnabled ? 'success' : 'default'}
                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {config.securityEnabled
                      ? `Enforcing ${config.accessControlMethod || 'IP'} policy`
                      : 'Unrestricted login access'}
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            <Box sx={{ mt: 2, pl: 0.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(config.securityEnabled)}
                    onChange={(e) => handleToggleSecurity(e.target.checked)}
                    disabled={readOnly || savingConfig}
                    color="success"
                    sx={{ mr: 1 }}
                  />
                }
                label={
                  <Typography variant="subtitle2" fontWeight={600} color={config.securityEnabled ? 'success.main' : 'text.secondary'}>
                    {config.securityEnabled ? 'Master Security Enabled' : 'Master Security Disabled'}
                  </Typography>
                }
              />
            </Box>
          </Grid>

          {/* Col 2: Segmented Access Control Method */}
          <Grid item xs={12} md={4.5} lg={4.5}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                Access Enforcement Method
              </Typography>
              <ToggleButtonGroup
                value={config.accessControlMethod || 'IP'}
                exclusive
                onChange={(_, val) => {
                  if (val && !readOnly && !savingConfig) {
                    handleMethodChange({ target: { value: val } });
                  }
                }}
                disabled={readOnly || savingConfig}
                fullWidth
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    py: 0.75,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px !important',
                    mx: 0.25,
                    color: 'text.secondary',
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }
                  }
                }}
              >
                <ToggleButton value="IP">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <IconNetwork size={16} />
                    <span>IP Address</span>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="DEVICE">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <IconDeviceDesktop size={16} />
                    <span>Device / MAC</span>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="IP_DEVICE">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <IconShieldCheck size={16} />
                    <span>IP + Device</span>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>

          {/* Col 3: KPI Metrics Cards */}
          <Grid item xs={12} md={3} lg={3.5}>
            <Stack direction="row" spacing={1.5} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Paper
                elevation={0}
                onClick={() => setSubTab(0)}
                sx={{
                  flex: 1,
                  p: 1.25,
                  textAlign: 'center',
                  borderRadius: '12px',
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 2 }
                }}
              >
                <Typography variant="h4" color="primary.main" fontWeight={700}>
                  {config.activeIpCount || ips.filter((i) => isItemActive(i)).length}
                </Typography>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Active IPs
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                onClick={() => setSubTab(1)}
                sx={{
                  flex: 1,
                  p: 1.25,
                  textAlign: 'center',
                  borderRadius: '12px',
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'secondary.main', transform: 'translateY(-2px)', boxShadow: 2 }
                }}
              >
                <Typography variant="h4" color="secondary.main" fontWeight={700}>
                  {config.activeDeviceCount || devices.filter((d) => isItemActive(d)).length}
                </Typography>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Active Devices
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                onClick={() => {
                  setSubTab(2);
                  setLogFilterStatus('BLOCKED');
                }}
                sx={{
                  flex: 1,
                  p: 1.25,
                  textAlign: 'center',
                  borderRadius: '12px',
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.error.main, 0.3),
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'error.main', transform: 'translateY(-2px)', boxShadow: 2 }
                }}
              >
                <Typography variant="h4" color="error.main" fontWeight={700}>
                  {config.recentBlockedCount || 0}
                </Typography>
                <Typography variant="caption" fontWeight={700} color="error.main">
                  Blocked
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* ── SUB-TABS NAVIGATION WITH CLEAN BADGES ── */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2.5 }}>
        <Tabs
          value={subTab}
          onChange={(e, v) => setSubTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              mr: 2
            }
          }}
        >
          <Tab
            icon={<IconNetwork size={18} />}
            iconPosition="start"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Allowed IPs</span>
                <Chip size="small" label={ips.length} sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }} />
              </Stack>
            }
          />
          <Tab
            icon={<IconDeviceDesktop size={18} />}
            iconPosition="start"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Registered Devices</span>
                <Chip size="small" label={devices.length} sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }} />
              </Stack>
            }
          />
          <Tab
            icon={<IconHistory size={18} />}
            iconPosition="start"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Login Security History</span>
                {(config.recentBlockedCount || 0) > 0 && (
                  <Chip
                    size="small"
                    color="error"
                    label={`${config.recentBlockedCount} Blocked`}
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                  />
                )}
              </Stack>
            }
          />
          <Tab icon={<IconShieldCheck size={18} />} iconPosition="start" label="Configuration Audit" />
        </Tabs>
      </Box>

      {/* ── TAB 0: ALLOWED IP ADDRESSES ── */}
      {subTab === 0 && (
        <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
          {!readOnly && (
            <Box sx={{ p: 1.5, px: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="flex-end" alignItems="center">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<IconPlus size={16} />}
                  onClick={handleOpenAddIp}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 2 }}
                >
                  Add Allowed IP
                </Button>
              </Stack>
            </Box>
          )}

          <TableContainer sx={dynamicTableContainerSx}>
            <Table stickyHeader size="small">
              <TableHead sx={dynamicTableHeadSx}>
                <TableRow>
                  <TableCell sx={{ ...tableHeaderCellSx, pl: 2.5 }}>IP Address</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Description</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Validity Range</TableCell>
                  <TableCell sx={tableHeaderCellSx} align="center">Status</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Created By</TableCell>
                  <TableCell sx={{ ...tableHeaderCellSx, pr: 2.5 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingIps ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filteredIps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No allowed IP addresses configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIps.map((ip) => (
                    <TableRow
                      key={ip.id}
                      hover
                      onDoubleClick={() => !readOnly && handleOpenEditIp(ip)}
                      sx={{
                        cursor: readOnly ? 'default' : 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell sx={{ pl: 2.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconNetwork size={18} color={theme.palette.primary.main} />
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                              {ip.ipAddress}
                            </Typography>
                            {ip.remarks && (
                              <Typography variant="caption" color="text.secondary">
                                {ip.remarks}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.primary">{ip.description || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        {formatValidity(ip.validFrom, ip.validTo)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={isItemActive(ip) ? 'Active' : 'Expired / Inactive'}
                          color={isItemActive(ip) ? 'success' : 'default'}
                          sx={{ fontWeight: 600, fontSize: '0.75rem', cursor: readOnly ? 'default' : 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!readOnly) handleToggleIpStatus(ip);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{ip.createdBy || 'SYSTEM'}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 2.5 }}>
                        {!readOnly && (
                          <Tooltip title="Delete IP">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteIp(ip);
                              }}
                            >
                              <IconTrash size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── TAB 1: REGISTERED DEVICES ── */}
      {subTab === 1 && (
        <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
          {!readOnly && (
            <Box sx={{ p: 1.5, px: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<IconDeviceLaptop size={16} />}
                  onClick={handleRegisterCurrentDevice}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                >
                  Register Current Device
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<IconPlus size={16} />}
                  onClick={handleOpenAddDevice}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 2 }}
                >
                  Register Device
                </Button>
              </Stack>
            </Box>
          )}

          <TableContainer sx={dynamicTableContainerSx}>
            <Table stickyHeader size="small">
              <TableHead sx={dynamicTableHeadSx}>
                <TableRow>
                  <TableCell sx={{ ...tableHeaderCellSx, pl: 2.5 }}>Device Code & Name</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Device Identifier Token</TableCell>
                  <TableCell sx={tableHeaderCellSx}>MAC / Last IP</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Assigned User</TableCell>
                  <TableCell sx={tableHeaderCellSx} align="center">Status</TableCell>
                  <TableCell sx={{ ...tableHeaderCellSx, pr: 2.5 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingDevices ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No registered devices configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((dev) => (
                    <TableRow
                      key={dev.id}
                      hover
                      onDoubleClick={() => !readOnly && handleOpenEditDevice(dev)}
                      sx={{
                        cursor: readOnly ? 'default' : 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell sx={{ pl: 2.5 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}>
                            <IconDeviceDesktop size={18} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {dev.deviceName || 'Unnamed Device'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Code: {dev.deviceCode}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'monospace',
                              bgcolor: 'action.hover',
                              px: 0.75,
                              py: 0.25,
                              borderRadius: '4px',
                              border: '1px solid',
                              borderColor: 'divider',
                              display: 'inline-block'
                            }}
                          >
                            {dev.deviceIdentifier ? `${dev.deviceIdentifier.substring(0, 18)}...` : '—'}
                          </Typography>
                          {dev.deviceIdentifier && (
                            <Tooltip title="Copy Token">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(dev.deviceIdentifier);
                                  showAppAlert('Copied Device Token', 'success');
                                }}
                                sx={{ p: 0.25 }}
                              >
                                <IconCopy size={12} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block" color="text.secondary">
                          MAC: {dev.macAddress || '—'}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          IP: {dev.ipAddress || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {dev.userFullName || dev.userId ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={dev.userFullName || dev.userId}
                            sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">Global / Any User</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={isItemActive(dev) ? 'Active' : 'Inactive'}
                          color={isItemActive(dev) ? 'success' : 'default'}
                          sx={{ fontWeight: 600, fontSize: '0.75rem', cursor: readOnly ? 'default' : 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!readOnly) handleToggleDeviceStatus(dev);
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 2.5 }}>
                        {!readOnly && (
                          <Tooltip title="Delete Device">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDevice(dev);
                              }}
                            >
                              <IconTrash size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── TAB 2: LOGIN HISTORY & AUDIT LOGS ── */}
      {subTab === 2 && (
        <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
          <TableContainer sx={dynamicTableContainerSx}>
            <Table stickyHeader size="small">
              <TableHead sx={dynamicTableHeadSx}>
                <TableRow>
                  <TableCell sx={{ ...tableHeaderCellSx, pl: 2.5 }}>Date & Time</TableCell>
                  <TableCell sx={tableHeaderCellSx}>User ID</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Source IP</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Device ID / MAC</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Policy Method</TableCell>
                  <TableCell sx={tableHeaderCellSx} align="center">Result</TableCell>
                  <TableCell sx={{ ...tableHeaderCellSx, pr: 2.5 }}>Reason / Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingLogs ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No login attempt logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell sx={{ pl: 2.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {log.loginDateTime ? new Date(log.loginDateTime).toLocaleString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>{log.userId || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {log.sourceIp || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.deviceIdentifier || log.macAddress ? (
                          <Stack spacing={0.25}>
                            {log.deviceIdentifier && (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.72rem',
                                    bgcolor: 'action.hover',
                                    px: 0.75,
                                    py: 0.25,
                                    borderRadius: '4px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    display: 'inline-block'
                                  }}
                                >
                                  {log.deviceIdentifier.length > 20
                                    ? log.deviceIdentifier.substring(0, 20) + '...'
                                    : log.deviceIdentifier}
                                </Typography>
                                <Tooltip title="Copy Device Token">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      navigator.clipboard.writeText(log.deviceIdentifier);
                                      showAppAlert('Copied Device Token', 'success');
                                    }}
                                    sx={{ p: 0.25 }}
                                  >
                                    <IconCopy size={12} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}
                            {log.macAddress && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                MAC: {log.macAddress}
                              </Typography>
                            )}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" label={log.accessControlMethod || 'NONE'} sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={log.loginStatus}
                          color={log.loginStatus === 'ALLOWED' ? 'success' : 'error'}
                          sx={{ fontWeight: 700, minWidth: 80 }}
                        />
                      </TableCell>
                      <TableCell sx={{ pr: 2.5 }}>
                        <Typography variant="caption" fontWeight={600} color={log.loginStatus === 'BLOCKED' ? 'error.main' : 'text.secondary'}>
                          {log.failureReason || 'SUCCESS'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── TAB 3: CONFIGURATION AUDIT TRAIL ── */}
      {subTab === 3 && (
        <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, px: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Administrative Security Changes
            </Typography>
          </Box>

          <TableContainer sx={dynamicTableContainerSx}>
            <Table stickyHeader size="small">
              <TableHead sx={dynamicTableHeadSx}>
                <TableRow>
                  <TableCell sx={{ ...tableHeaderCellSx, pl: 2.5 }}>Date & Time</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Action</TableCell>
                  <TableCell sx={tableHeaderCellSx}>Changed By</TableCell>
                  <TableCell sx={{ ...tableHeaderCellSx, pr: 2.5 }}>Details / Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingAudits ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filteredAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No audit records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAudits.map((a) => (
                    <TableRow key={a.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell sx={{ pl: 2.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {a.changedDate ? new Date(a.changedDate).toLocaleString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={a.action} color="primary" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>{a.changedBy}</Typography>
                      </TableCell>
                      <TableCell sx={{ pr: 2.5 }}>
                        <Typography variant="body2">{a.remarks || '—'}</Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── MODAL: ADD / EDIT ALLOWED IP ── */}
      <Dialog
        open={ipModalOpen}
        onClose={() => setIpModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.6)}, ${alpha(theme.palette.primary.main, 0.2)})`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.25)}, ${alpha(theme.palette.background.paper, 0.95)})`,
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Avatar sx={{ bgcolor: theme.palette.primary.main, color: '#fff', width: 40, height: 40 }}>
            <IconWorld size={22} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight={700}>
              {editingIp ? 'Edit Allowed IP' : 'Add Allowed IP Address'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Authorize trusted static IPv4 / IPv6 network address for access.
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setIpModalOpen(false)}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="IP Address (IPv4 / IPv6)"
              placeholder="e.g. 192.168.1.100 or 10.0.0.1"
              value={ipFormData.ipAddress}
              onChange={(e) => setIpFormData({ ...ipFormData, ipAddress: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description / Workstation Name"
              placeholder="e.g. Head Office Primary Gateway / VPN"
              value={ipFormData.description}
              onChange={(e) => setIpFormData({ ...ipFormData, description: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Valid From (Optional)"
                  InputLabelProps={{ shrink: true }}
                  value={ipFormData.validFrom}
                  onChange={(e) => setIpFormData({ ...ipFormData, validFrom: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Valid To (Optional)"
                  InputLabelProps={{ shrink: true }}
                  value={ipFormData.validTo}
                  onChange={(e) => setIpFormData({ ...ipFormData, validTo: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Remarks / Notes"
              placeholder="e.g. Static lease for Accounts Department network"
              multiline
              rows={2}
              value={ipFormData.remarks}
              onChange={(e) => setIpFormData({ ...ipFormData, remarks: e.target.value })}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.grey[500] || '#9e9e9e', 0.04) }}>
          <Button onClick={() => setIpModalOpen(false)} sx={{ borderRadius: 2, px: 3 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSaveIp}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 700,
              boxShadow: `0 8px 16px ${alpha(theme.palette.warning.main, 0.3)}`
            }}
          >
            {editingIp ? 'Update IP' : 'Save IP'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL: ADD / EDIT REGISTERED DEVICE ── */}
      <Dialog
        open={deviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.6)}, ${alpha(theme.palette.primary.main, 0.2)})`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.25)}, ${alpha(theme.palette.background.paper, 0.95)})`,
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Avatar sx={{ bgcolor: theme.palette.primary.main, color: '#fff', width: 40, height: 40 }}>
            <IconDeviceLaptop size={22} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight={700}>
              {editingDevice ? 'Edit Registered Device' : 'Register Authorized Device'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Configure machine identity token, hardware parameters, and user account mapping.
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setDeviceModalOpen(false)}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Row 1: Device Code & Device Name */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Device Code"
                  placeholder="e.g. DEV-0001"
                  value={deviceFormData.deviceCode}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, deviceCode: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconDeviceLaptop size={18} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Device Name"
                  placeholder="e.g. Finance Desktop - Dell OptiPlex"
                  value={deviceFormData.deviceName}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, deviceName: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            {/* Row 2: Device Identifier Token (Full Width) */}
            <Box>
              <TextField
                fullWidth
                label="Device Identifier Token"
                placeholder="Persistent Browser / Machine Identifier Token"
                value={deviceFormData.deviceIdentifier}
                onChange={(e) => setDeviceFormData({ ...deviceFormData, deviceIdentifier: e.target.value })}
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.85rem' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Copy Token">
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(deviceFormData.deviceIdentifier);
                            showAppAlert('Copied Device Token', 'success');
                          }}
                        >
                          <IconCopy size={16} />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
                helperText="Persistent identifier token uniquely generated for this machine."
                required
              />
            </Box>

            {/* Row 3: Assigned User Dropdown (Full Width for crystal-clear readability & robust search) */}
            <Box>
              <Autocomplete
                fullWidth
                autoHighlight
                selectOnFocus
                openOnFocus
                options={userDropdownOptions}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  if (typeof option === 'string') return option;
                  return option.label || option.userId || '';
                }}
                value={
                  userDropdownOptions.find((o) => (o.userId || '') === (deviceFormData.userId || '')) || {
                    userId: deviceFormData.userId || '',
                    label: deviceFormData.userId ? deviceFormData.userId : 'All Users (Any Authorized User Can Log In)'
                  }
                }
                onChange={(_, newVal) => {
                  setDeviceFormData({
                    ...deviceFormData,
                    userId: newVal ? newVal.userId : ''
                  });
                }}
                filterOptions={(options, state) => {
                  const q = (state.inputValue || '').trim().toLowerCase();
                  if (!q) return options;
                  return options.filter((opt) => {
                    const matchText = `${opt.userId || ''} ${opt.name || ''} ${opt.roleName || ''} ${opt.label || ''}`.toLowerCase();
                    return matchText.includes(q);
                  });
                }}
                isOptionEqualToValue={(option, val) => (option.userId || '') === (val?.userId || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assigned Machine User (Optional)"
                    placeholder="Type to search by User ID, Name, or Role..."
                    helperText="Leave as 'All Users' or restrict this machine exclusively to the selected user."
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.userId || 'all'} sx={{ py: 1, px: 1.5 }}>
                    <Stack spacing={0.25} sx={{ width: '100%' }}>
                      <Typography variant="subtitle2" fontWeight={option.userId ? 600 : 700} color={option.userId ? 'text.primary' : 'primary.main'}>
                        {option.label}
                      </Typography>
                      {option.userId ? (
                        <Typography variant="caption" color="text.secondary">
                          User ID: <strong>{option.userId}</strong> {option.roleName ? ` • Role: ${option.roleName}` : ''}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No restriction — Any active employee can log in from this device
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}
              />
            </Box>

            {/* Row 4: Physical MAC Address */}
            <Box>
              <TextField
                fullWidth
                label="Physical MAC Address (Optional)"
                placeholder="e.g. 00:1A:2B:3C:4D:5E"
                value={deviceFormData.macAddress}
                onChange={(e) => setDeviceFormData({ ...deviceFormData, macAddress: e.target.value })}
                helperText="Provided automatically when accessing via BOS Desktop Agent / App."
              />
            </Box>

            {/* Row 5: Valid From & Valid To */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Valid From (Optional)"
                  InputLabelProps={{ shrink: true }}
                  value={deviceFormData.validFrom}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, validFrom: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Valid To (Optional)"
                  InputLabelProps={{ shrink: true }}
                  value={deviceFormData.validTo}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, validTo: e.target.value })}
                />
              </Grid>
            </Grid>

            {/* Row 5: Remarks */}
            <Box>
              <TextField
                fullWidth
                label="Remarks / Notes"
                placeholder="e.g. Workstation allocated for Production Plant Manager"
                multiline
                rows={2}
                value={deviceFormData.remarks}
                onChange={(e) => setDeviceFormData({ ...deviceFormData, remarks: e.target.value })}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.grey[500] || '#9e9e9e', 0.04) }}>
          <Button onClick={() => setDeviceModalOpen(false)} sx={{ borderRadius: 2, px: 3 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSaveDevice}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 700,
              boxShadow: `0 8px 16px ${alpha(theme.palette.warning.main, 0.3)}`
            }}
          >
            {editingDevice ? 'Update Device' : 'Save Device'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL: ADMIN LOCKOUT PREVENTION WARNING ── */}
      <Dialog
        open={lockoutDialogOpen}
        onClose={() => setLockoutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.light || '#ffa726', 0.25)}, ${alpha(theme.palette.background.paper, 0.95)})`,
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Avatar sx={{ bgcolor: 'warning.main', color: '#fff', width: 40, height: 40 }}>
            <IconAlertTriangle size={24} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight={700} color="warning.dark">
              Lockout Prevention Safeguard
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ensure administrator access before activating restrictions.
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setLockoutDialogOpen(false)}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 3.5 }}>
          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
            You are enabling <strong>Login Access Security</strong>. Your current administrator IP or device is
            not yet in the active allowed list.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 500 }}>
            To prevent accidental administrator lockout from BOSS ERP, please authorize your current machine
            before enabling restrictions:
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.light, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ display: 'flex', gap: 1 }}>
                <strong style={{ minWidth: 110 }}>Current IP:</strong> {clientInfo?.clientIp || '127.0.0.1'}
              </Typography>
              <Typography variant="subtitle2" sx={{ display: 'flex', gap: 1 }}>
                <strong style={{ minWidth: 110 }}>Current Device:</strong> {getDeviceName()}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', wordBreak: 'break-all' }}>
                <strong>Token:</strong> {getOrCreateDeviceIdentifier()}
              </Typography>
            </Stack>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.grey[500] || '#9e9e9e', 0.04) }}>
          <Button onClick={() => setLockoutDialogOpen(false)} sx={{ borderRadius: 2, px: 3 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<IconShieldCheck size={18} />}
            onClick={handleAuthorizeCurrentMachineAndEnable}
            sx={{
              borderRadius: 2,
              px: 3.5,
              fontWeight: 700,
              boxShadow: `0 8px 16px ${alpha(theme.palette.warning.main, 0.3)}`
            }}
          >
            Authorize Current IP & Device & Enable
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

LoginSecurityTab.propTypes = {
  companyId: PropTypes.number,
  readOnly: PropTypes.bool
};

export default LoginSecurityTab;
