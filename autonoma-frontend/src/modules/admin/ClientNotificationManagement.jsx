import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  MenuItem,
  Checkbox,
  Typography,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Grid,
  Card,
  Autocomplete,
  Divider,
  TextField
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconBellRinging,
  IconEye,
  IconHistory,
  IconCopy,
  IconBan,
  IconEdit,
  IconTrash,
  IconInfoCircle,
  IconUsers,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconFlame,
  IconTools,
  IconRocket,
  IconHeartHandshake,
  IconCalendarEvent,
  IconClock,
  IconBuildingSkyscraper,
  IconChecklist,
  IconSearch
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { getUserStorageItem } from 'utils/userStorage';
import {
  BOSDataTable,
  BOSTableToolbar,
  BOSFormDialog,
  BOSTextField,
  BOSToggleSwitch,
  BOSDatePicker,
  BOSTimePicker,
  BOSStatusChip
} from 'ui-component/bos';
import { tableHeadCellSx, getTableRowSx } from 'ui-component/bos/BOSStyles';
import useConfig from 'hooks/useConfig';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import { formatDate, formatDateTime } from 'utils/BOSTimeUtils';

const NOTIFICATION_TYPES = [
  { value: 'INFORMATION', label: 'Information', icon: <IconInfoCircle size={18} />, defaultColor: '#3b82f6', bgLight: '#eff6ff' },
  { value: 'ALERT', label: 'Alert', icon: <IconAlertCircle size={18} />, defaultColor: '#f59e0b', bgLight: '#fffbeb' },
  { value: 'WARNING', label: 'Warning', icon: <IconAlertTriangle size={18} />, defaultColor: '#f97316', bgLight: '#fff7ed' },
  { value: 'CRITICAL', label: 'Critical', icon: <IconFlame size={18} />, defaultColor: '#ef4444', bgLight: '#fef2f2' },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: <IconTools size={18} />, defaultColor: '#8b5cf6', bgLight: '#f5f3ff' },
  { value: 'BUILD_UPDATE', label: 'Build Update', icon: <IconRocket size={18} />, defaultColor: '#10b981', bgLight: '#ecfdf5' },
  { value: 'WISHES', label: 'Wishes', icon: <IconHeartHandshake size={18} />, defaultColor: '#ec4899', bgLight: '#fdf2f8' }
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#6b7280', lightBg: '#f3f4f6' },
  { value: 'MEDIUM', label: 'Medium', color: '#0284c7', lightBg: '#e0f2fe' },
  { value: 'HIGH', label: 'High', color: '#d97706', lightBg: '#fef3c7' },
  { value: 'URGENT', label: 'Urgent', color: '#dc2626', lightBg: '#fee2e2' }
];

const COLOR_PRESETS = ['#3b82f6', '#0284c7', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#475569'];

export default function ClientNotificationManagement({ isCentralMode }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const location = useLocation();
  const { dateFormat, timeFormat } = useConfig();

  // Dual-mode resolution:
  // If route starts with /admin/notifications -> BOS Admin mode (client-scoped, page rights required)
  // If route is /client-management/notifications -> Central mode (all clients, no page rights restriction)
  const isCentral = isCentralMode !== undefined 
    ? isCentralMode 
    : !location.pathname.startsWith('/admin/notifications');

  // Page permissions for BOS Admin mode
  const permissions = usePagePermissions(PAGE_CODES.AD_CLIENT_NOTIFICATIONS);
  const canCreate = isCentral || Boolean(permissions?.canWrite);
  const canEdit = isCentral || Boolean(permissions?.canWrite);
  const canDelete = isCentral || Boolean(permissions?.canDelete);

  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);

  const [notifications, setNotifications] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Dialog & Action States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showLivePreviewInDialog, setShowLivePreviewInDialog] = useState(true);

  const [formData, setFormData] = useState({
    notificationId: null,
    title: '',
    message: '',
    type: 'INFORMATION',
    priority: 'MEDIUM',
    colorHex: '#3b82f6',
    iconName: 'Info',
    targetType: 'ALL_CLIENTS',
    selectedClients: [],
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    isMandatoryAck: false,
    status: 'ACTIVE'
  });
  const [errors, setErrors] = useState({});

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Live Preview State (Standalone Modal)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // History / Audit State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [selectedNotifForHistory, setSelectedNotifForHistory] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [historySize, setHistorySize] = useState(10);

  // Resolve current client for BOS Admin mode
  const currentClient = useMemo(() => {
    const tenantId = sessionStorage.getItem('tenantId') || getUserStorageItem('tenantId');
    if (!tenantId || clients.length === 0) return clients[0] || null;
    const match = clients.find(
      (c) =>
        (c.dbSourceName && c.dbSourceName.toLowerCase() === tenantId.toLowerCase()) ||
        (c.clientCode && c.clientCode.toLowerCase() === tenantId.toLowerCase())
    );
    return match || clients[0] || null;
  }, [clients]);

  // Helper to format client display name: "Company Name (Client Code)"
  const getClientDisplayName = useCallback((cli) => {
    if (!cli) return '';
    const name = cli.companyName || cli.shortName || cli.clientName || 'Client';
    const code = cli.clientCode || cli.id || 'N/A';
    return `${name} (${code})`;
  }, []);

  // Filter Bar Config for BOS Search
  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: [
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'DRAFT', label: 'DRAFT' },
          { value: 'SCHEDULED', label: 'SCHEDULED' },
          { value: 'EXPIRED', label: 'EXPIRED' },
          { value: 'CANCELLED', label: 'CANCELLED' }
        ],
        defaultValue: [],
        isStarred: true
      },
      {
        id: 'type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL TYPES' },
          ...NOTIFICATION_TYPES.map((t) => ({ value: t.value, label: t.label }))
        ],
        defaultValue: 'All',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchClientsList = async () => {
    try {
      const res = await axios.get('/api/company-profile/all');
      const clientContent = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setClients(clientContent);
    } catch (err) {
      console.error('Failed to load client master records for target picker', err);
    }
  };

  const fetchNotifications = useCallback(
    async (force = false, detail = null, isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        // In BOS Admin mode, filter by current client code
        const queryParams = !isCentral && currentClient?.clientCode 
          ? `?clientCode=${currentClient.clientCode}` 
          : '';
        const res = await axios.get(`/api/notifications/admin${queryParams}`);
        setNotifications(res.data || []);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Failed to load client notifications.',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'error',
            close: false
          })
        );
      } finally {
        setLoading(false);
      }
    },
    [dispatch, isCentral, currentClient]
  );

  useRealtimeRefresh(fetchNotifications, 'ClientNotification');

  const triggerRealtimeEvents = () => {
    window.dispatchEvent(new CustomEvent('bos-realtime-update', { detail: { entityName: 'ClientNotification' } }));
    window.dispatchEvent(new CustomEvent('bos-client-notification-update'));
  };

  useEffect(() => {
    setPage(0);
  }, [globalQuery, globalFilters]);

  useEffect(() => {
    fetchClientsList();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getDateFormatted = (daysToAdd = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  };

  // Calculate schedule duration in human-readable format
  const scheduleDurationText = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return null;
    try {
      const start = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);
      const end = new Date(`${formData.endDate}T${formData.endTime || '00:00'}`);
      const diffMs = end - start;
      if (diffMs <= 0) return 'Invalid: End time must be after start time';

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      const parts = [];
      if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
      if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
      if (minutes > 0 && days === 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);

      return parts.length > 0 ? `Active for ${parts.join(', ')}` : 'Active for < 1 minute';
    } catch {
      return null;
    }
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime]);

  const handleStartDateChange = useCallback((val) => {
    setFormData((prev) => {
      let nextEndDate = prev.endDate;
      if (val && (!prev.endDate || prev.endDate < val)) {
        nextEndDate = val;
      }
      return {
        ...prev,
        startDate: val,
        endDate: nextEndDate
      };
    });
    if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: null }));
    if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
  }, [errors]);

  const minValidTimeToday = useMemo(() => {
    const now = new Date();
    // 2-minute grace period
    now.setMinutes(now.getMinutes() - 2);
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, [formData.startDate, dialogOpen]);

  const handleOpenAdd = () => {
    if (!canCreate) {
      dispatch(openSnackbar({ open: true, message: 'Access Denied: Write permission required.', variant: 'alert', severity: 'error' }));
      return;
    }
    setIsEditing(false);
    setIsReadOnly(false);
    setErrors({});

    const defaultTargetType = isCentral ? 'ALL_CLIENTS' : 'SELECTED_CLIENTS';
    const defaultSelectedClients = isCentral
      ? []
      : currentClient?.clientCode
      ? [currentClient.clientCode]
      : [];

    const now = new Date();
    const nextFive = Math.ceil(now.getMinutes() / 5) * 5;
    now.setMinutes(nextFive);
    const defStartH = String(now.getHours()).padStart(2, '0');
    const defStartM = String(now.getMinutes() % 60).padStart(2, '0');
    const defaultStartTime = `${defStartH}:${defStartM}`;

    setFormData({
      notificationId: null,
      title: '',
      message: '',
      type: 'INFORMATION',
      priority: 'MEDIUM',
      colorHex: '#3b82f6',
      iconName: 'Info',
      targetType: defaultTargetType,
      selectedClients: defaultSelectedClients,
      startDate: getDateFormatted(0),
      startTime: defaultStartTime,
      endDate: getDateFormatted(2),
      endTime: '18:00',
      isMandatoryAck: false,
      status: 'ACTIVE'
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (notif) => {
    const isViewed = (notif.viewedCount || 0) > 0;
    const isEditable = (notif.status === 'ACTIVE' || notif.status === 'DRAFT') && !isViewed && canEdit;

    setIsEditing(true);
    setIsReadOnly(!isEditable);
    setErrors({});
    const targetClients = notif.targetClientCodes ? notif.targetClientCodes.split(',').map((s) => s.trim()) : [];

    let startDate = getDateFormatted(0);
    let startTime = '09:00';
    if (notif.startDateTime) {
      const sArr = notif.startDateTime.split('T');
      startDate = sArr[0];
      if (sArr[1]) startTime = sArr[1].substring(0, 5);
    }

    let endDate = getDateFormatted(2);
    let endTime = '18:00';
    if (notif.endDateTime) {
      const eArr = notif.endDateTime.split('T');
      endDate = eArr[0];
      if (eArr[1]) endTime = eArr[1].substring(0, 5);
    }

    setFormData({
      notificationId: notif.notificationId,
      title: notif.title || '',
      message: notif.message || '',
      type: notif.type || 'INFORMATION',
      priority: notif.priority || 'MEDIUM',
      colorHex: notif.colorHex || '#3b82f6',
      iconName: notif.iconName || 'Info',
      targetType: notif.targetType || 'ALL_CLIENTS',
      selectedClients: targetClients,
      startDate,
      startTime,
      endDate,
      endTime,
      isMandatoryAck: notif.isMandatoryAck || false,
      status: notif.status || 'ACTIVE'
    });
    setDialogOpen(true);
  };

  const handleTypeSelect = (selectedTypeVal) => {
    const typeObj = NOTIFICATION_TYPES.find((t) => t.value === selectedTypeVal);
    setFormData((prev) => ({
      ...prev,
      type: selectedTypeVal,
      colorHex: typeObj ? typeObj.defaultColor : prev.colorHex,
      iconName: typeObj ? typeObj.label : prev.iconName
    }));
  };

  const validateForm = () => {
    const errs = {};
    const todayStr = getDateFormatted(0);
    const now = new Date();
    // 2-minute grace period
    const graceTime = new Date(now.getTime() - 2 * 60 * 1000);
    const minValidTime = `${String(graceTime.getHours()).padStart(2, '0')}:${String(graceTime.getMinutes()).padStart(2, '0')}`;

    if (!formData.title.trim()) {
      errs.title = 'Title is required';
    }
    if (!formData.message.trim()) {
      errs.message = 'Message is required';
    }

    // Start Date & Time validations
    if (!formData.startDate) {
      errs.startDate = 'Start Date is required';
    } else if (!isEditing && formData.startDate < todayStr) {
      errs.startDate = 'Start Date cannot be in the past';
    }

    if (!formData.startTime) {
      errs.startTime = 'Start Time is required';
    } else if (!isEditing && formData.startDate === todayStr && formData.startTime < minValidTime) {
      errs.startTime = 'Start Time cannot be in the past for today';
    }

    // End Date & Time validations
    if (!formData.endDate) {
      errs.endDate = 'End Date is required';
    } else if (formData.endDate < todayStr) {
      errs.endDate = 'End Date cannot be in the past';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      errs.endDate = 'End Date cannot be earlier than Start Date';
    }

    if (!formData.endTime) {
      errs.endTime = 'End Time is required';
    }

    // Combined Date + Time validation
    if (formData.startDate && formData.endDate && formData.startTime && formData.endTime) {
      const startDT = new Date(`${formData.startDate}T${formData.startTime}:00`);
      const endDT = new Date(`${formData.endDate}T${formData.endTime}:00`);

      if (isNaN(startDT.getTime())) {
        errs.startTime = 'Invalid Start Time format';
      }
      if (isNaN(endDT.getTime())) {
        errs.endTime = 'Invalid End Time format';
      }

      if (startDT && endDT && endDT <= startDT) {
        if (formData.startDate === formData.endDate) {
          errs.endTime = 'End Time must be after Start Time';
        } else {
          errs.endDate = 'End Date & Time must be after Start Date & Time';
        }
      }
    }

    if (isCentral && formData.targetType === 'SELECTED_CLIENTS' && formData.selectedClients.length === 0) {
      errs.selectedClients = 'Please select at least one Client';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const startDT = `${formData.startDate}T${formData.startTime ? formData.startTime : '09:00'}:00`;
    const endDT = `${formData.endDate}T${formData.endTime ? formData.endTime : '18:00'}:00`;

    // Resolve tenant client code for BOS Admin internal mode
    const resolvedTenant = sessionStorage.getItem('tenantId') || getUserStorageItem('tenantId');
    const matchedClientByTenant = clients.find(
      (c) =>
        (c.dbSourceName && c.dbSourceName.toLowerCase() === resolvedTenant?.toLowerCase()) ||
        (c.clientCode && c.clientCode.toLowerCase() === resolvedTenant?.toLowerCase())
    );
    const resolvedClientCode = currentClient?.clientCode || matchedClientByTenant?.clientCode || resolvedTenant;

    const finalTargetType = isCentral ? formData.targetType : 'SELECTED_CLIENTS';
    const finalTargetClientCodes = isCentral
      ? (formData.targetType === 'SELECTED_CLIENTS' ? formData.selectedClients.join(',') : null)
      : (resolvedClientCode || 'CURRENT');

    const payload = {
      notificationId: formData.notificationId,
      title: formData.title,
      message: formData.message,
      type: formData.type,
      priority: formData.priority,
      colorHex: formData.colorHex,
      iconName: formData.iconName,
      targetType: finalTargetType,
      targetClientCodes: finalTargetClientCodes,
      startDateTime: startDT,
      endDateTime: endDT,
      isMandatoryAck: formData.isMandatoryAck,
      status: formData.status || 'ACTIVE'
    };

    try {
      if (isEditing) {
        await axios.put(`/api/notifications/admin/${formData.notificationId}`, payload);
      } else {
        await axios.post('/api/notifications/admin', payload);
      }
      dispatch(
        openSnackbar({
          open: true,
          message: `Client notification ${isEditing ? 'updated' : 'created'} successfully!`,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      setDialogOpen(false);
      fetchNotifications();
      triggerRealtimeEvents();
    } catch (err) {
      console.error(err);
      dispatch(
        openSnackbar({
          open: true,
          message: err.response?.data?.message || 'Error saving notification',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
    }
  };

  const handleDuplicate = async (id) => {
    if (!canCreate) {
      dispatch(openSnackbar({ open: true, message: 'Access Denied: Write permission required.', variant: 'alert', severity: 'error' }));
      return;
    }
    try {
      await axios.post(`/api/notifications/admin/${id}/duplicate`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Notification duplicated as draft successfully.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      fetchNotifications();
      triggerRealtimeEvents();
    } catch (err) {
      console.error('Error duplicating notification', err);
    }
  };

  const handleToggleStatus = async (row) => {
    if (!canEdit) {
      dispatch(openSnackbar({ open: true, message: 'Access Denied: Write permission required.', variant: 'alert', severity: 'error' }));
      return;
    }
    try {
      await axios.put(`/api/notifications/admin/${row.notificationId}/toggle-status`);
      dispatch(
        openSnackbar({
          open: true,
          message: `Notification ${row.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully!`,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      fetchNotifications();
      triggerRealtimeEvents();
    } catch (err) {
      console.error('Error toggling status', err);
    }
  };

  const handleDeleteClick = (notif) => {
    if (!canDelete) {
      dispatch(openSnackbar({ open: true, message: 'Access Denied: Delete permission required.', variant: 'alert', severity: 'error' }));
      return;
    }
    setDeleteTargetId(notif.notificationId);
    setDeleteTargetName(notif.title);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await axios.delete(`/api/notifications/admin/${deleteTargetId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Notification deleted successfully.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      setDeleteDialogOpen(false);
      fetchNotifications();
      triggerRealtimeEvents();
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  const handleOpenPreview = (notif) => {
    setPreviewData(notif);
    setPreviewOpen(true);
  };

  const handleOpenHistory = async (notif) => {
    setSelectedNotifForHistory(notif);
    setHistorySearch('');
    setHistoryPage(0);
    try {
      const res = await axios.get(`/api/notifications/admin/${notif.notificationId}/logs`);
      setHistoryLogs(res.data || []);
      setHistoryOpen(true);
    } catch (err) {
      console.error('Failed to load notification history', err);
    }
  };

  // Interactive KPI Filter State: 'ALL' | 'ACTIVE' | 'SCHEDULED' | 'EXPIRED'
  const [kpiFilter, setKpiFilter] = useState('ALL');

  // Clear stale cached filters from previous sessions
  useEffect(() => {
    try {
      sessionStorage.removeItem('page_filters_/client-management/notifications');
      sessionStorage.removeItem('page_filters_/admin/notifications');
    } catch (e) {}
  }, []);

  // Keyboard shortcut Ctrl+N for new notification
  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd
  });

  // Filtering Table Rows (matching existing standard)
  const formattedTableRows = useMemo(() => {
    let result = notifications.map((item, idx) => ({
      ...item,
      id: item.notificationId,
      index: idx + 1,
      startDateTimeFormatted: item.startDateTime ? formatDate(item.startDateTime, `${dateFormat} HH:mm`) : '-',
      endDateTimeFormatted: item.endDateTime ? formatDate(item.endDateTime, `${dateFormat} HH:mm`) : '-',
      statsLabel: `${item.viewedCount || 0} / ${item.acknowledgedCount || 0}`
    }));

    // Global BOS Search Query
    if (globalQuery && globalQuery.trim() !== '') {
      const q = globalQuery.toLowerCase().trim();
      result = result.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.message && n.message.toLowerCase().includes(q)) ||
          (n.type && n.type.toLowerCase().includes(q)) ||
          (n.targetClientCodes && n.targetClientCodes.toLowerCase().includes(q))
      );
    }

    // BOS Global Filter Bar
    if (globalFilters) {
      if (globalFilters.status && Array.isArray(globalFilters.status) && globalFilters.status.length > 0 && !globalFilters.status.includes('ALL')) {
        result = result.filter((n) => globalFilters.status.includes(n.status));
      }
      if (globalFilters.type && globalFilters.type !== 'All') {
        result = result.filter((n) => n.type === globalFilters.type);
      }
    }

    return [...result].sort((a, b) => (b.notificationId || 0) - (a.notificationId || 0));
  }, [notifications, globalQuery, globalFilters, dateFormat]);

  const paginatedRows = useMemo(() => {
    const start = page * size;
    return formattedTableRows.slice(start, start + size);
  }, [formattedTableRows, page, size]);

  // Existing Standard BOS DataTable Columns
  const columns = useMemo(
    () => [
      { id: 'index', label: '#', minWidth: 50, align: 'center' },
      {
        id: 'title',
        label: 'Title & Message',
        minWidth: 220,
        align: 'left',
        render: (row) => (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {row.title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {row.message}
            </Typography>
          </Box>
        )
      },
      {
        id: 'type',
        label: 'Type',
        minWidth: 120,
        align: 'center',
        render: (row) => (
          <Chip
            label={row.type}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.72rem',
              bgcolor: alpha(row.colorHex || '#3b82f6', 0.1),
              color: row.colorHex || '#3b82f6',
              border: `1px solid ${alpha(row.colorHex || '#3b82f6', 0.3)}`
            }}
          />
        )
      },
      {
        id: 'priority',
        label: 'Priority',
        minWidth: 100,
        align: 'center',
        render: (row) => {
          const priorityObj = PRIORITIES.find((p) => p.value === row.priority) || PRIORITIES[1];
          return (
            <Chip
              label={row.priority}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.68rem',
                height: 22,
                bgcolor: priorityObj.lightBg,
                color: priorityObj.color
              }}
            />
          );
        }
      },
      {
        id: 'targetType',
        label: 'Target Scope',
        minWidth: 140,
        align: 'center',
        render: (row) => {
          if (row.targetType === 'ALL_CLIENTS') {
            return (
              <Chip
                icon={<IconUsers size={14} />}
                label="All Clients"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            );
          }
          const codes = (row.targetClientCodes || '').split(',').map((c) => c.trim()).filter(Boolean);
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
              {codes.map((code) => {
                const matchedClient = clients.find(
                  (c) =>
                    (c.clientCode && c.clientCode.toLowerCase() === code.toLowerCase()) ||
                    (c.dbSourceName && c.dbSourceName.toLowerCase() === code.toLowerCase())
                );
                const label = matchedClient ? getClientDisplayName(matchedClient) : code;
                return (
                  <Chip
                    key={code}
                    label={label}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.72rem', height: 22, fontWeight: 600 }}
                  />
                );
              })}
            </Box>
          );
        }
      },
      {
        id: 'startDateTimeFormatted',
        label: 'Start Time',
        minWidth: 140,
        align: 'center'
      },
      {
        id: 'endDateTimeFormatted',
        label: 'End Time',
        minWidth: 140,
        align: 'center'
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 120,
        align: 'center',
        render: (row) => {
          const currentStatus = row.status || 'ACTIVE';
          return (
            <Chip
              icon={currentStatus === 'ACTIVE' ? <IconCheck size={14} /> : <IconBan size={14} />}
              label={currentStatus}
              color={
                currentStatus === 'ACTIVE'
                  ? 'success'
                  : currentStatus === 'SCHEDULED'
                    ? 'info'
                    : currentStatus === 'CANCELLED' || currentStatus === 'INACTIVE'
                      ? 'error'
                      : currentStatus === 'EXPIRED'
                        ? 'default'
                        : 'warning'
              }
              size="small"
              sx={{ fontWeight: 700 }}
            />
          );
        }
      },
      {
        id: 'statsLabel',
        label: 'View / Ack',
        minWidth: 110,
        align: 'center'
      },
      {
        id: 'actions',
        label: 'Actions',
        minWidth: 180,
        align: 'center',
        render: (row) => {
          const isViewed = (row.viewedCount || 0) > 0;
          const isEditable = (row.status === 'ACTIVE' || row.status === 'DRAFT') && !isViewed && canEdit;
          const isActive = row.status === 'ACTIVE';

          return (
            <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
              <Tooltip title="Preview">
                <IconButton size="small" color="info" onClick={() => handleOpenPreview(row)}>
                  <IconEye size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delivery History">
                <IconButton size="small" color="secondary" onClick={() => handleOpenHistory(row)}>
                  <IconHistory size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title={isEditable ? 'Edit Notification' : 'View Notification Details (Read-Only)'}>
                <IconButton size="small" color={isEditable ? 'primary' : 'default'} onClick={() => handleOpenEdit(row)}>
                  <IconEdit size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Duplicate">
                <IconButton size="small" onClick={() => handleDuplicate(row.notificationId)}>
                  <IconCopy size={18} />
                </IconButton>
              </Tooltip>
              {isActive && (
                <Tooltip title="Deactivate (Cancel Notification)">
                  <IconButton
                    size="small"
                    sx={{
                      color: '#d97706',
                      bgcolor: 'rgba(217, 119, 6, 0.12)',
                      '&:hover': {
                        bgcolor: 'rgba(217, 119, 6, 0.22)',
                        color: '#b45309'
                      }
                    }}
                    onClick={() => handleToggleStatus(row)}
                  >
                    <IconBan size={18} />
                  </IconButton>
                </Tooltip>
              )}
              {canDelete && (
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => handleDeleteClick(row)}>
                    <IconTrash size={18} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          );
        }
      }
    ],
    [clients, canEdit, canDelete, getClientDisplayName]
  );

  // Delivery / Audit Logs: Formatted rows with full client mapping and timestamps
  const formattedHistoryLogs = useMemo(() => {
    return (historyLogs || []).map((log, idx) => {
      const matchedClient = clients.find((c) => {
        if (!log.clientCode) return false;
        const target = log.clientCode.toLowerCase().replace(/_live$/, '').replace(/_test$/, '');
        const code = (c.clientCode || '').toLowerCase();
        const db = (c.dbSourceName || '').toLowerCase();
        const short = (c.shortName || '').toLowerCase();
        const name = (c.companyName || '').toLowerCase();

        return (
          code === log.clientCode.toLowerCase() ||
          db === log.clientCode.toLowerCase() ||
          short === log.clientCode.toLowerCase() ||
          code === target ||
          db === target ||
          short === target ||
          name.includes(target)
        );
      });

      const clientName = matchedClient ? getClientDisplayName(matchedClient) : log.clientCode || '-';

      return {
        ...log,
        id: log.logId || `log_${idx}`,
        clientName,
        viewedAtFormatted: log.viewedAt ? formatDateTime(log.viewedAt, timeFormat, dateFormat) : '-',
        acknowledgedAtFormatted: log.acknowledgedAt ? formatDateTime(log.acknowledgedAt, timeFormat, dateFormat) : '-'
      };
    });
  }, [historyLogs, clients, getClientDisplayName, dateFormat, timeFormat]);

  const filteredHistoryLogs = useMemo(() => {
    if (!historySearch.trim()) return formattedHistoryLogs;
    const q = historySearch.toLowerCase().trim();
    return formattedHistoryLogs.filter((item) =>
      (item.clientName && item.clientName.toLowerCase().includes(q)) ||
      (item.userId && item.userId.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q)) ||
      (item.clientCode && item.clientCode.toLowerCase().includes(q)) ||
      (item.viewedAtFormatted && item.viewedAtFormatted.toLowerCase().includes(q)) ||
      (item.acknowledgedAtFormatted && item.acknowledgedAtFormatted.toLowerCase().includes(q))
    );
  }, [formattedHistoryLogs, historySearch]);

  const paginatedHistoryLogs = useMemo(() => {
    const start = historyPage * historySize;
    return filteredHistoryLogs.slice(start, start + historySize);
  }, [filteredHistoryLogs, historyPage, historySize]);

  // Delivery / Audit Logs BOSDataTable Columns
  const historyColumns = useMemo(
    () => [
      { id: 'index', label: '#', minWidth: 50, align: 'center' },
      {
        id: 'clientName',
        label: 'Client Organization',
        minWidth: 240,
        align: 'left',
        render: (row) => (
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {row.clientName}
          </Typography>
        )
      },
      {
        id: 'userId',
        label: 'User ID',
        minWidth: 150,
        align: 'left',
        render: (row) => (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.userId || '-'}
          </Typography>
        )
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 140,
        align: 'center',
        render: (row) => (
          <BOSStatusChip
            status={row.status}
            showIcon
            width={140}
            toneOverride={row.status === 'ACKNOWLEDGED' ? 'success' : row.status === 'VIEWED' ? 'info' : undefined}
          />
        )
      },
      {
        id: 'viewedAtFormatted',
        label: 'Viewed At',
        minWidth: 160,
        align: 'center'
      },
      {
        id: 'acknowledgedAtFormatted',
        label: 'Acknowledged At',
        minWidth: 160,
        align: 'center'
      }
    ],
    []
  );

  return (
    <MainCard
      icon={IconBellRinging}
      title={isCentral ? 'Client Notification Center' : 'Organization Notifications'}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchNotifications}
          onNew={canCreate ? handleOpenAdd : undefined}
          newLabel="+ New"
          newTooltip={shortcutTooltip('Create Notification', 'Ctrl + N')}
          hasWritePermission={canCreate}
          exportData={formattedTableRows}
          exportColumns={[
            { header: 'Title', key: 'title' },
            { header: 'Message', key: 'message' },
            { header: 'Type', key: 'type' },
            { header: 'Priority', key: 'priority' },
            { header: 'Target Scope', key: 'targetType' },
            { header: 'Target Clients', key: 'targetClientCodes' },
            { header: 'Start Time', key: 'startDateTimeFormatted' },
            { header: 'End Time', key: 'endDateTimeFormatted' },
            { header: 'Status', key: 'status' },
            { header: 'View / Ack', key: 'statsLabel' }
          ]}
          exportFilename="Client_Notifications"
          hasExportPermission={true}
        />
      }
    >
      {/* Existing Standard BOS Data Table */}
      <BOSDataTable
        columns={columns}
        rows={paginatedRows}
        disableSearchFilter={true}
        page={page}
        size={size}
        totalCount={formattedTableRows.length}
        loading={loading}
        showActions={false}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onDoubleClickRow={handleOpenEdit}
      />

      {/* REDESIGNED UNIQUE FORM DIALOG */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: '8px',
                bgcolor: alpha(formData.colorHex || theme.palette.primary.main, 0.15),
                color: formData.colorHex || theme.palette.primary.main,
                display: 'flex'
              }}
            >
              <IconBellRinging size={22} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {isReadOnly ? 'View Notification Details' : isEditing ? 'Edit Notification' : 'Create Notification'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isCentral ? 'Broadcast to Client Organizations' : `Internal Broadcast for ${currentClient ? currentClient.companyName : 'Organization'}`}
              </Typography>
            </Box>
          </Box>
        }
        onSave={handleSave}
        showSaveButton={!isReadOnly}
        saveTooltip={shortcutTooltip(isEditing ? 'Save Changes' : 'Create Notification', 'Ctrl + S')}
        maxWidth="lg"
      >
        <Grid container spacing={3}>
          {/* Form Fields Left Column */}
          <Grid item xs={12} md={showLivePreviewInDialog ? 7 : 12}>
            <Stack spacing={2.5}>
              {/* Section 1: Content & Design */}
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  p: 2.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconInfoCircle size={18} color={formData.colorHex} /> NOTIFICATION CONTENT & BRANDING
                </Typography>

                <Stack spacing={2}>
                  <BOSTextField
                    required
                    label="Notification Title *"
                    placeholder="e.g. Scheduled System Maintenance Notice"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    error={Boolean(errors.title)}
                    helperText={errors.title}
                    disabled={isReadOnly}
                  />

                  <BOSTextField
                    required
                    label="Notification Message *"
                    placeholder="Write detailed notification message that will be presented to users..."
                    multiline
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    error={Boolean(errors.message)}
                    helperText={errors.message}
                    disabled={isReadOnly}
                  />

                  {/* Interactive Visual Type Picker */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                      NOTIFICATION CATEGORY / TYPE:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {NOTIFICATION_TYPES.map((typeObj) => {
                        const isSelected = formData.type === typeObj.value;
                        return (
                          <Chip
                            key={typeObj.value}
                            icon={typeObj.icon}
                            label={typeObj.label}
                            onClick={!isReadOnly ? () => handleTypeSelect(typeObj.value) : undefined}
                            variant={isSelected ? 'filled' : 'outlined'}
                            sx={{
                              fontWeight: 700,
                              px: 1,
                              py: 2,
                              cursor: !isReadOnly ? 'pointer' : 'default',
                              borderColor: isSelected ? typeObj.defaultColor : 'divider',
                              bgcolor: isSelected ? typeObj.defaultColor : 'transparent',
                              color: isSelected ? '#ffffff' : 'text.primary',
                              boxShadow: isSelected ? `0 4px 12px ${alpha(typeObj.defaultColor, 0.4)}` : 'none',
                              '&:hover': {
                                bgcolor: isSelected ? typeObj.defaultColor : alpha(typeObj.defaultColor, 0.08)
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Priority & Accent Color */}
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={7}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                        PRIORITY LEVEL:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {PRIORITIES.map((p) => {
                          const isSelected = formData.priority === p.value;
                          return (
                            <Chip
                              key={p.value}
                              label={p.label}
                              onClick={!isReadOnly ? () => setFormData({ ...formData, priority: p.value }) : undefined}
                              variant={isSelected ? 'filled' : 'outlined'}
                              sx={{
                                fontWeight: 700,
                                px: 1,
                                cursor: !isReadOnly ? 'pointer' : 'default',
                                bgcolor: isSelected ? p.color : 'transparent',
                                color: isSelected ? '#ffffff' : p.color,
                                borderColor: p.color,
                                '&:hover': { bgcolor: isSelected ? p.color : alpha(p.color, 0.1) }
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={5}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                        HEADER ACCENT COLOR:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <input
                          type="color"
                          disabled={isReadOnly}
                          value={formData.colorHex}
                          onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {COLOR_PRESETS.slice(0, 5).map((color) => (
                            <Box
                              key={color}
                              onClick={!isReadOnly ? () => setFormData({ ...formData, colorHex: color }) : undefined}
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                bgcolor: color,
                                cursor: 'pointer',
                                border: formData.colorHex === color ? '2px solid #000' : 'none'
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Stack>
              </Card>

              {/* Section 2: Target Scoping */}
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  p: 2.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconUsers size={18} color={theme.palette.primary.main} /> AUDIENCE & TARGET SCOPING
                  </Typography>
                  <Chip
                    label={isCentral ? 'GLOBAL BROADCAST ENGINE' : 'INTERNAL USE ONLY'}
                    size="small"
                    color={isCentral ? 'primary' : 'warning'}
                    variant={isCentral ? 'outlined' : 'filled'}
                    sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                  />
                </Box>

                {isCentral ? (
                  <Stack spacing={2}>
                    {/* Visual Scoping Toggle Cards for Central Management */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Card
                          elevation={0}
                          onClick={!isReadOnly ? () => setFormData({ ...formData, targetType: 'ALL_CLIENTS' }) : undefined}
                          sx={{
                            p: 1.5,
                            borderRadius: '10px',
                            cursor: !isReadOnly ? 'pointer' : 'default',
                            border: '2px solid',
                            borderColor: formData.targetType === 'ALL_CLIENTS' ? theme.palette.primary.main : 'divider',
                            bgcolor: formData.targetType === 'ALL_CLIENTS' ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconUsers size={16} /> All Clients (Global Broadcast)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Broadcast across all client organizations registered in the system
                          </Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={6}>
                        <Card
                          elevation={0}
                          onClick={!isReadOnly ? () => setFormData({ ...formData, targetType: 'SELECTED_CLIENTS' }) : undefined}
                          sx={{
                            p: 1.5,
                            borderRadius: '10px',
                            cursor: !isReadOnly ? 'pointer' : 'default',
                            border: '2px solid',
                            borderColor: formData.targetType === 'SELECTED_CLIENTS' ? theme.palette.primary.main : 'divider',
                            bgcolor: formData.targetType === 'SELECTED_CLIENTS' ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconBuildingSkyscraper size={16} /> Specific Clients
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Deliver strictly to selected organizations by company name and code
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Multi-Select Client Autocomplete */}
                    {formData.targetType === 'SELECTED_CLIENTS' && (
                      <Box sx={{ mt: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            SELECT TARGET CLIENTS ({formData.selectedClients.length} selected):
                          </Typography>
                          {!isReadOnly && (
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                onClick={() =>
                                   setFormData((p) => ({
                                     ...p,
                                     selectedClients: clients.map((c) => c.clientCode).filter(Boolean)
                                   }))
                                }
                                sx={{ fontSize: '0.72rem', py: 0.1 }}
                              >
                                Select All ({clients.length})
                              </Button>
                              <Button
                                size="small"
                                color="inherit"
                                onClick={() => setFormData((p) => ({ ...p, selectedClients: [] }))}
                                sx={{ fontSize: '0.72rem', py: 0.1 }}
                              >
                                Clear
                              </Button>
                            </Stack>
                          )}
                        </Stack>

                        <Autocomplete
                          multiple
                          disableCloseOnSelect
                          disabled={isReadOnly}
                          options={clients}
                          value={clients.filter((c) => formData.selectedClients.includes(c.clientCode))}
                          onChange={(e, newValues) => {
                            const codes = newValues.map((c) => c.clientCode).filter(Boolean);
                            setFormData((prev) => ({ ...prev, selectedClients: codes }));
                            if (errors.selectedClients) setErrors((prev) => ({ ...prev, selectedClients: null }));
                          }}
                          getOptionLabel={(option) => getClientDisplayName(option)}
                          filterOptions={(options, { inputValue }) => {
                            const search = (inputValue || '').toLowerCase().trim();
                            return options.filter(
                              (c) =>
                                (c.companyName || '').toLowerCase().includes(search) ||
                                (c.shortName || '').toLowerCase().includes(search) ||
                                (c.clientCode || '').toLowerCase().includes(search)
                            );
                          }}
                          renderOption={(props, option, { selected }) => (
                            <li {...props} key={option.clientCode || option.id}>
                              <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  {option.companyName || option.shortName || 'Client'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Client Code: <strong>{option.clientCode}</strong> {option.city ? `• ${option.city}` : ''}
                                </Typography>
                              </Box>
                            </li>
                          )}
                          renderTags={(tagValue, getTagProps) =>
                            tagValue.map((option, index) => (
                              <Chip
                                {...getTagProps({ index })}
                                key={option.clientCode}
                                label={`${option.shortName || option.companyName || 'Client'} (${option.clientCode})`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            ))
                          }
                          renderInput={(params) => (
                            <BOSTextField
                              {...params}
                              label="Target Clients *"
                              placeholder={formData.selectedClients.length === 0 ? 'Search by company name or code...' : ''}
                              error={Boolean(errors.selectedClients)}
                              helperText={errors.selectedClients}
                            />
                          )}
                        />
                      </Box>
                    )}
                  </Stack>
                ) : (
                  /* BOS Admin Mode: Locked Scoping for Current Client */
                  <Card
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '10px',
                      border: '1px dashed',
                      borderColor: theme.palette.warning.main,
                      bgcolor: alpha(theme.palette.warning.main, 0.05)
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <IconBuildingSkyscraper size={24} color={theme.palette.warning.dark} style={{ marginTop: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          Internal Target: {currentClient ? getClientDisplayName(currentClient) : 'Current Logged-in Company'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          This notification is for <strong>Internal Use</strong> only. It will strictly be delivered to users logged into this company (Client Code: <strong>{currentClient?.clientCode || 'Active Tenant'}</strong>) and will <strong>NOT</strong> be visible to any other client organization.
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                )}
              </Card>

              {/* Section 3: Schedule & Acknowledgment */}
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  p: 2.5,
                  bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fafafa'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconCalendarEvent size={18} color={theme.palette.primary.main} /> SCHEDULE & ACKNOWLEDGMENT
                  </Typography>
                  {scheduleDurationText && (
                    <Chip
                      label={scheduleDurationText}
                      size="small"
                      color="info"
                      variant="filled"
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <BOSDatePicker
                      required
                      label="Start Date *"
                      name="startDate"
                      value={formData.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      error={Boolean(errors.startDate)}
                      helperText={errors.startDate}
                      disabled={isReadOnly}
                      disablePast={!isEditing}
                      minDate={!isEditing ? new Date() : undefined}
                      highlightHolidays={false}
                      blockHolidays={false}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <BOSTimePicker
                      required
                      label="Start Time *"
                      name="startTime"
                      value={formData.startTime}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, startTime: e.target.value }));
                        if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: null }));
                      }}
                      error={Boolean(errors.startTime)}
                      helperText={errors.startTime}
                      disabled={isReadOnly}
                      minTime={!isEditing && formData.startDate === getDateFormatted(0) ? minValidTimeToday : undefined}
                      minTimeMessage="Start time cannot be in the past"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <BOSDatePicker
                      required
                      label="End Date *"
                      name="endDate"
                      value={formData.endDate}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, endDate: e.target.value }));
                        if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
                      }}
                      error={Boolean(errors.endDate)}
                      helperText={errors.endDate}
                      disabled={isReadOnly}
                      disablePast={true}
                      minDate={formData.startDate ? new Date(formData.startDate) : new Date()}
                      highlightHolidays={false}
                      blockHolidays={false}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <BOSTimePicker
                      required
                      label="End Time *"
                      name="endTime"
                      value={formData.endTime}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, endTime: e.target.value }));
                        if (errors.endTime) setErrors((prev) => ({ ...prev, endTime: null }));
                      }}
                      error={Boolean(errors.endTime)}
                      helperText={errors.endTime}
                      disabled={isReadOnly}
                      minTime={formData.startDate === formData.endDate ? formData.startTime : undefined}
                      minTimeMessage="End time must be after start time"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Require Mandatory Acknowledgment
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Forces the user to click "Acknowledge" before dismissing this notification
                        </Typography>
                      </Box>
                      <BOSToggleSwitch
                        name="isMandatoryAck"
                        value={formData.isMandatoryAck}
                        checkedValue={true}
                        uncheckedValue={false}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isMandatoryAck: e.target.value }))}
                        label=""
                        checkedLabel="Yes"
                        uncheckedLabel="No"
                        disabled={isReadOnly}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </Stack>
          </Grid>

          {/* Live Preview Right Column */}
          {showLivePreviewInDialog && (
            <Grid item xs={12} md={5}>
              <Box sx={{ position: 'sticky', top: 20 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconEye size={18} color={theme.palette.secondary.main} /> CLIENT-SIDE LIVE PREVIEW
                  </Typography>
                  <Chip label="Real-time Workstation Mockup" size="small" variant="outlined" sx={{ fontSize: '0.68rem', fontWeight: 600 }} />
                </Box>

                {/* WORKSTATION POPUP MOCKUP */}
                <Paper
                  elevation={6}
                  sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: `0 12px 32px ${alpha(formData.colorHex || '#3b82f6', 0.2)}`
                  }}
                >
                  {/* Mockup Header */}
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${formData.colorHex || '#3b82f6'} 0%, ${formData.colorHex || '#3b82f6'}dd 100%)`,
                      color: '#ffffff',
                      p: 2.5,
                      position: 'relative'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={formData.type}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.25)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.68rem'
                        }}
                      />
                      <Chip
                        label={formData.priority}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.25)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.68rem'
                        }}
                      />
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                      {formData.title || 'Notification Title Here'}
                    </Typography>
                  </Box>

                  {/* Mockup Body */}
                  <Box sx={{ p: 2.5, bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#ffffff' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        color: 'text.primary',
                        lineHeight: 1.6,
                        minHeight: 80
                      }}
                    >
                      {formData.message || 'The notification message body will appear here exactly as formatted.'}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    {/* Mockup Action Footer */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {!formData.isMandatoryAck && (
                        <Button size="small" variant="outlined" color="inherit" sx={{ borderRadius: '8px' }}>
                          Dismiss
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          borderRadius: '8px',
                          bgcolor: formData.colorHex || '#3b82f6',
                          '&:hover': { bgcolor: formData.colorHex || '#3b82f6' }
                        }}
                      >
                        {formData.isMandatoryAck ? 'Acknowledge & Close' : 'Got it'}
                      </Button>
                    </Box>
                  </Box>
                </Paper>

                {/* Target Audience Summary Badge */}
                <Card
                  elevation={0}
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.info.main, 0.04)
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'info.main', display: 'block' }}>
                    AUDIENCE REACH SUMMARY:
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formData.targetType === 'ALL_CLIENTS'
                      ? `Reaches all active users across ${clients.length} client organizations.`
                      : `Strictly visible to users inside ${formData.selectedClients.length} targeted client(s).`}
                  </Typography>
                </Card>
              </Box>
            </Grid>
          )}
        </Grid>
      </BOSFormDialog>

      {/* STANDALONE PREVIEW MODAL */}
      <BOSFormDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewData ? `Preview: ${previewData.title}` : 'Notification Preview'}
        icon={<IconEye size={22} color={theme.palette.info.main} />}
        maxWidth="sm"
        showSaveButton={false}
      >
        {previewData && (
          <Box sx={{ p: 1 }}>
            <Box
              sx={{
                background: `linear-gradient(135deg, ${previewData.colorHex || '#3b82f6'} 0%, ${previewData.colorHex || '#3b82f6'}dd 100%)`,
                color: '#ffffff',
                p: 2.5,
                borderRadius: 2,
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Chip label={previewData.type} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 800 }} />
                <Chip label={previewData.priority} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.25)', color: '#fff', fontWeight: 700 }} />
              </Box>
              <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 700 }}>
                {previewData.title}
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, mb: 2 }}>
              {previewData.message}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" sx={{ bgcolor: previewData.colorHex || '#3b82f6' }}>
                {previewData.isMandatoryAck ? 'Acknowledge' : 'Close'}
              </Button>
            </Box>
          </Box>
        )}
      </BOSFormDialog>

      {/* HISTORY / AUDIT DIALOG */}
      <BOSFormDialog
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setHistorySearch('');
          setHistoryPage(0);
        }}
        title={selectedNotifForHistory ? `Delivery Logs: ${selectedNotifForHistory.title}` : 'Delivery & Audit History'}
        icon={<IconHistory size={22} color={theme.palette.secondary.main} />}
        maxWidth="lg"
        showSaveButton={false}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
          {/* Dialog Toolbar & KPI Indicators */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Search user, client, status..."
              value={historySearch}
              onChange={(e) => {
                setHistorySearch(e.target.value);
                setHistoryPage(0);
              }}
              InputProps={{
                startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: '#9ca3af' }} />
              }}
              sx={{ width: { xs: '100%', sm: 280 } }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={`Total: ${formattedHistoryLogs.length}`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={`Acknowledged: ${formattedHistoryLogs.filter((l) => l.status === 'ACKNOWLEDGED').length}`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={`Viewed: ${formattedHistoryLogs.filter((l) => l.status === 'VIEWED').length}`}
                size="small"
                color="info"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 440, mt: 0.5 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...tableHeadCellSx, width: 60, textAlign: 'center' }}>#</TableCell>
                  <TableCell sx={{ ...tableHeadCellSx, textAlign: 'left' }}>Client Organization</TableCell>
                  <TableCell sx={{ ...tableHeadCellSx, textAlign: 'left' }}>User ID</TableCell>
                  <TableCell sx={{ ...tableHeadCellSx, textAlign: 'center', width: 140 }}>Status</TableCell>
                  <TableCell sx={{ ...tableHeadCellSx, textAlign: 'center' }}>Viewed At</TableCell>
                  <TableCell sx={{ ...tableHeadCellSx, textAlign: 'center' }}>Acknowledged At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedHistoryLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No delivery or engagement logs recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedHistoryLogs.map((row, idx) => (
                    <TableRow key={row.id || idx} hover sx={getTableRowSx(theme, theme.palette.mode === 'dark')}>
                      <TableCell align="center" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {historyPage * historySize + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {row.clientName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {row.userId || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <BOSStatusChip
                          status={row.status}
                          showIcon
                          width={140}
                          toneOverride={row.status === 'ACKNOWLEDGED' ? 'success' : row.status === 'VIEWED' ? 'info' : undefined}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">
                          {row.viewedAtFormatted}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">
                          {row.acknowledgedAtFormatted}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredHistoryLogs.length > 0 && (
            <TablePagination
              component="div"
              count={filteredHistoryLogs.length}
              page={historyPage}
              onPageChange={(e, p) => setHistoryPage(p)}
              rowsPerPage={historySize}
              onRowsPerPageChange={(e) => {
                setHistorySize(parseInt(e.target.value, 10));
                setHistoryPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 0.5 }}
            />
          )}
        </Box>
      </BOSFormDialog>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Client Notification"
        content={`Are you sure you want to delete notification "${deleteTargetName}"? This action cannot be undone and will permanently remove all delivery history.`}
      />
    </MainCard>
  );
}
