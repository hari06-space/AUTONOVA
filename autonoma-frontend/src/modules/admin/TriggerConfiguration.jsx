import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Box, MenuItem, IconButton, Tooltip, CircularProgress, Alert, AlertTitle, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Checkbox, Chip } from '@mui/material';
import { IconSettings, IconPlayerPlay } from '@tabler/icons-react';
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';

import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSFormDialog, BOSTextField, BOSTimePicker, BOSStatusChip, BOSDatePicker } from 'ui-component/bos';
import PageGuard from 'ui-component/bos/PageGuard';

const FREQUENCY_OPTIONS = [
  'DAILY',
  'WEEKLY',
  'FORTNIGHTLY',
  'MONTHLY',
  'QUARTERLY',
  'HALF YEARLY',
  'YEARLY',
  'CUSTOM'
];

const SCHEDULER_METADATA = {
  CHECKLIST: {
    description: 'Generates standard daily checklist task assignments for active employees.',
    frequency: 'Daily (Morning 4:00 AM)'
  },
  CHECKLIST_RENEWAL: {
    description: 'Triggers renewal cycle and schedules tasks for templates when reminder date is reached.',
    frequency: 'Daily Check (Morning 4:00 AM)'
  },
  AUDIT: {
    description: 'Sends daily audit reminder notifications and handles expiration cleanup.',
    frequency: 'Daily (Night 11:59 PM)'
  },
  MEETING: {
    description: 'Maintains recurring meeting schedules, attendance lists, and updates logs.',
    frequency: 'Every Minute (Continuous)'
  },
  CHECKLIST_REASSIGN_1: {
    description: 'First reassignment check: Automatically shifts unstarted daily tasks to backup employees.',
    frequency: 'Daily (Morning 10:00 AM)'
  },
  CHECKLIST_REASSIGN_2: {
    description: 'Second reassignment check: Automatically shifts unstarted daily tasks to backup employees.',
    frequency: 'Daily (Afternoon 2:00 PM)'
  },
  CHECKLIST_REASSIGN_3: {
    description: 'Third reassignment check: Automatically shifts unstarted daily tasks to backup employees.',
    frequency: 'Daily (Evening 4:00 PM)'
  },
  CHECKLIST_EOD: {
    description: 'Process uncompleted checklists at the end of the day (marking them as Not Completed).',
    frequency: 'Daily (Night 11:59 PM)'
  },
  CHECKLIST_DYNAMIC: {
    description: 'System trigger scheduler task for dynamic checklists generation.',
    frequency: 'Daily (Morning 4:00 AM)'
  }
};

const TriggerButton = ({ row, onTriggerSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const isSpecialTrigger =
    row.schedularName === 'CHECKLIST' ||
    row.schedularName === 'CHECKLIST_RENEWAL' ||
    row.schedularName === 'CHECKLIST_EOD' ||
    row.schedularName === 'CHECKLIST_DYNAMIC' ||
    row.schedularName === 'MEETING' ||
    row.schedularName === 'AUDIT';

  const getInitialDate = () => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const now = new Date(Date.now() - tzOffset);
    if (row.schedularName === 'CHECKLIST' || row.schedularName === 'CHECKLIST_RENEWAL' || row.schedularName === 'CHECKLIST_DYNAMIC') {
      now.setDate(now.getDate() + 1);
    }
    return now.toISOString().split('T')[0];
  };

  const [targetDate, setTargetDate] = useState(getInitialDate());
  const [closePast, setClosePast] = useState(true);

  const handleTrigger = async (dateParam, closePastParam) => {
    setLoading(true);
    setOpen(false);
    try {
      let url = `/api/admin/schedule-config/${row.id}/trigger`;
      const params = [];
      if (dateParam) {
        params.push(`targetDate=${dateParam}`);
      }
      if (typeof closePastParam === 'boolean') {
        params.push(`closePast=${closePastParam}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await axios.post(url);
      if (res.status === 200) {
        dispatch(openSnackbar({
          open: true,
          message: `${row.schedularName} Schedule Triggered Successfully`,
          variant: 'alert',
          alert: { color: 'success' },
          severity: 'success'
        }));
        if (onTriggerSuccess) onTriggerSuccess();
      }
    } catch (err) {
      console.error('Failed to trigger manually', err);
      const errMsg = err.response?.data?.message || err.message || `Failed to trigger ${row.schedularName}`;
      dispatch(openSnackbar({
        open: true,
        message: errMsg,
        variant: 'alert',
        alert: { color: 'error' },
        severity: 'error'
      }));
    } finally {
      setLoading(false);
      if (onTriggerSuccess) onTriggerSuccess();
    }
  };

  const getPreviousDateStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isExecuting = loading || row.isRunning;

  return (
    <>
      <Tooltip title={isExecuting ? `${row.schedularName} is currently running in background...` : "Run Trigger"}>
        <span>
          <IconButton
            color="primary"
            disabled={isExecuting}
            onClick={(e) => {
              e.stopPropagation();
              if (isSpecialTrigger) {
                setTargetDate(getInitialDate());
                setOpen(true);
              } else {
                handleTrigger();
              }
            }}
          >
            {isExecuting ? (
              <CircularProgress size={20} color="primary" />
            ) : (
              <IconPlayerPlay size={20} />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <BOSFormDialog
        open={open}
        onClose={() => setOpen(false)}
        onSave={() => handleTrigger(targetDate, row.schedularName === 'CHECKLIST_EOD' ? true : closePast)}
        title={`Run Trigger: ${row.schedularName}`}
        saveButtonLabel="Execute Trigger"
        saveButtonDisabled={isExecuting}
        maxWidth="xs"
        hideCollapse
        secondaryActions={
          <Button onClick={() => setOpen(false)} color="secondary">
            Cancel
          </Button>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <BOSDatePicker
            label="Target Execution Date"
            name="targetDate"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            presets={false}
            disablePast={true}
            disableSundays={true}
            disableHolidays={true}
            highlightHolidays={true}
          />
          {row.schedularName !== 'CHECKLIST_EOD' && row.schedularName !== 'MEETING' && row.schedularName !== 'AUDIT' && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={closePast}
                  onChange={(e) => setClosePast(e.target.checked)}
                  color="primary"
                />
              }
              label="Close uncompleted checklists from previous days"
            />
          )}

          {closePast && row.schedularName !== 'CHECKLIST_EOD' && row.schedularName !== 'MEETING' && row.schedularName !== 'AUDIT' && (
            <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
              All uncompleted tasks on or before <strong>{getPreviousDateStr(targetDate)}</strong> will be automatically marked as <strong>Unresolved</strong> or carried forward.
            </Alert>
          )}
          {row.schedularName === 'CHECKLIST_EOD' && (
            <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
              Running End-of-Day logic will process and close all uncompleted tasks up to and including <strong>{new Date(targetDate).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>.
            </Alert>
          )}
          {(row.schedularName === 'MEETING' || row.schedularName === 'AUDIT') && (
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              Executing <strong>{row.schedularName}</strong> schedule trigger for selected target date <strong>{new Date(targetDate).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>.
            </Alert>
          )}
        </Box>
      </BOSFormDialog>
    </>
  );
};

const TriggerConfiguration = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await axios.get('/api/admin/schedule-config');
      if (Array.isArray(res.data)) {
        setData(res.data);
      } else if (res.data?.success) {
        setData(res.data.data || []);
      } else {
        setData(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch schedule configurations', err);
      if (showLoader) {
        dispatch(openSnackbar({
          open: true,
          message: 'Failed to fetch schedule configurations',
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error'
        }));
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRowDoubleClick = (row) => {
    let timeObj = null;
    if (row.schedularTime) {
      timeObj = new Date(row.schedularTime);
    } else {
      timeObj = new Date();
      timeObj.setHours(0, 0, 0, 0);
    }

    setEditData({
      ...row,
      parsedTime: timeObj,
      statusValue: row.status === true || row.status === 1 ? 1 : 0
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editData) return;
    setSaving(true);
    try {
      let finalTimeStr = null;
      if (editData.parsedTime) {
        const d = new Date();
        if (typeof editData.parsedTime === 'string') {
          const match = editData.parsedTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (match) {
            let h = parseInt(match[1], 10);
            let m = parseInt(match[2], 10);
            if (match[3] && match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
            if (match[3] && match[3].toUpperCase() === 'AM' && h === 12) h = 0;
            d.setHours(h, m, 0, 0);
          }
        } else {
          d.setTime(new Date(editData.parsedTime).getTime());
        }
        const pad = (n) => String(n).padStart(2, '0');
        finalTimeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      }

      const payload = {
        ...editData,
        schedularTime: finalTimeStr,
        status: editData.statusValue === 1 ? 1 : 0
      };

      const res = await axios.put(`/api/admin/schedule-config/${editData.id}`, payload);
      if (res.data && (res.data.id || res.status === 200)) {
        dispatch(openSnackbar({
          open: true,
          message: 'Trigger configuration updated successfully',
          variant: 'alert',
          alert: { color: 'success' },
          severity: 'success'
        }));
        setDialogOpen(false);
        fetchData(false);
      }
    } catch (err) {
      console.error('Failed to update schedule config', err);
      dispatch(openSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to update trigger configuration',
        variant: 'alert',
        alert: { color: 'error' },
        severity: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      id: 'index',
      label: 'S.NO',
      minWidth: 60,
      align: 'center',
      render: (row, idx) => idx + 1
    },
    {
      id: 'schedularName',
      label: 'SCHEDULAR NAME',
      flex: 1,
      minWidth: 180,
      align: 'left'
    },
    {
      id: 'description',
      label: 'PURPOSE / DESCRIPTION',
      flex: 2,
      minWidth: 320,
      align: 'left',
      render: (row) => SCHEDULER_METADATA[row.schedularName]?.description || 'System trigger scheduler task.'
    },
    {
      id: 'schedularTime',
      label: 'SCHEDULAR TIME',
      flex: 1,
      minWidth: 140,
      align: 'center',
      render: (row) => {
        if (!row.schedularTime) return '-';
        const d = new Date(row.schedularTime);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    },
    {
      id: 'frequency',
      label: 'OPERATIONAL FREQUENCY',
      flex: 1,
      minWidth: 180,
      align: 'center',
      render: (row) => row.frequency || SCHEDULER_METADATA[row.schedularName]?.frequency || 'Daily'
    },
    {
      id: 'status',
      label: 'STATUS',
      flex: 0.8,
      minWidth: 110,
      align: 'center',
      render: (row) => {
        if (row.isRunning) {
          return (
            <Chip
              label="Running"
              color="warning"
              size="small"
              icon={<CircularProgress size={12} color="inherit" />}
              sx={{ fontWeight: 600, px: 0.5 }}
            />
          );
        }
        const isActive = row.status === true || row.status === 1;
        return <BOSStatusChip status={isActive ? 'Active' : 'Inactive'} />;
      }
    },
    {
      id: 'trigger',
      label: 'TRIGGER',
      minWidth: 100,
      align: 'center',
      valueGetter: () => '',
      render: (row) => <TriggerButton row={row} onTriggerSuccess={() => fetchData(false)} />
    }
  ];

  return (
    <PageGuard pageCode="AD1300">
      <MainCard title="Trigger Configuration (AD1300)" content={false}>
        <BOSDataTable
          id="ad-trigger-configuration-table"
          rows={data}
          columns={columns}
          loading={loading}
          onDoubleClickRow={handleRowDoubleClick}
        />
      </MainCard>

      {editData && (
        <BOSFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
          title="Edit Trigger Configuration"
          isSaving={saving}
          maxWidth="sm"
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <BOSTextField
              label="Schedular Name"
              value={editData.schedularName || ''}
              disabled
            />
            <BOSTimePicker
              label="Schedular Time"
              value={editData.parsedTime}
              onChange={(e) => setEditData(prev => ({ ...prev, parsedTime: e.target.value }))}
              required
            />
            <BOSTextField
              label="Purpose / Description"
              value={SCHEDULER_METADATA[editData.schedularName]?.description || 'System trigger scheduler task.'}
              disabled
              multiline
              rows={2.5}
            />
            <BOSTextField
              select
              label="Operational Frequency"
              value={editData.frequency || 'DAILY'}
              onChange={(e) => setEditData(prev => ({ ...prev, frequency: e.target.value }))}
              required
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <MenuItem key={f} value={f}>{f}</MenuItem>
              ))}
            </BOSTextField>
            <BOSTextField
              select
              label="Status"
              value={editData.statusValue}
              onChange={(e) => setEditData(prev => ({ ...prev, statusValue: e.target.value }))}
              required
            >
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={0}>Inactive</MenuItem>
            </BOSTextField>
          </Box>
        </BOSFormDialog>
      )}
    </PageGuard>
  );
};

export default TriggerConfiguration;
