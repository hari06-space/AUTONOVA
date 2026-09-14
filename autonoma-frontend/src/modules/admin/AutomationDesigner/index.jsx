import { useState, useEffect, useCallback } from 'react';
import {
  Grid, Box, Button, Typography, Stack, Card, CardContent,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, useTheme,
  Tabs, Tab, Switch, Chip, TextField
} from '@mui/material';
import {
  IconSettings, IconPlus, IconPlaylistAdd, IconPlayerPlay,
  IconCopy, IconTrash, IconClock, IconCircleCheck, IconCircleX,
  IconActivity, IconList, IconEye, IconUser, IconUsers, IconBuilding,
  IconCalendarEvent, IconNotes, IconVideo, IconX
} from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable, btnSave, btnCancel, btnNew, btnDelete,
  tableActionEditSx, tableActionDeleteSx, BOSStatusChip,
  BOSDatePicker, BOSFormDialog
} from 'ui-component/bos';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';

// Import child components
import ConfigEditor from './ConfigEditor';
import TemplateDesigner from './TemplateDesigner';
import AuditConfigEditor from './AuditConfigEditor';

export default function AutomationDesigner() {
  const theme = useTheme();
  const dispatch = useDispatch();

  // Navigation State
  const [view, setView] = useState('LIST'); // LIST, EDIT_CONFIG, EDIT_TEMPLATE, EDIT_AUDIT
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedAudit, setSelectedAudit] = useState(null);

  // Data States
  const [configs, setConfigs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [audits, setAudits] = useState([]);
  const [auditConfigs, setAuditConfigs] = useState([]);

  // Modals
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [currentConfigId, setCurrentConfigId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [meetingConfigs, setMeetingConfigs] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [auditEditorOpen, setAuditEditorOpen] = useState(false);
  const [runAuditDateDialogOpen, setRunAuditDateDialogOpen] = useState(false);
  const [runAllDateDialogOpen, setRunAllDateDialogOpen] = useState(false);
  const [targetRunAuditConfigId, setTargetRunAuditConfigId] = useState(null);
  const [targetRunDate, setTargetRunDate] = useState('');

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes, mRes, aRes] = await Promise.all([
        axios.get('/api/automation-configs'),
        axios.get('/api/automation-templates'),
        axios.get('/api/qms/meeting-configs'),
        axios.get('/api/qms/audit-configs')
      ]);
      setConfigs(cRes.data || []);
      setTemplates(tRes.data || []);
      setMeetingConfigs(mRes.data || []);
      setAuditConfigs(aRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Actions
  const handleSaveConfig = async (payload) => {
    try {
      await axios.post('/api/automation-configs', payload);
      dispatch(openSnackbar({ open: true, message: 'Automation configuration saved and scheduled!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      setView('LIST');
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to save configuration.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleSaveTemplate = async (payload) => {
    try {
      await axios.post('/api/automation-templates', payload);
      dispatch(openSnackbar({ open: true, message: 'Automation layout template saved!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      setView('LIST');
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to save template.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleSaveAuditConfig = async (payload) => {
    try {
      if (payload.id) {
        await axios.put(`/api/qms/audit-configs/${payload.id}`, payload);
      } else {
        await axios.post('/api/qms/audit-configs', payload);
      }
      dispatch(openSnackbar({ open: true, message: 'Audit configuration saved successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      setAuditEditorOpen(false);
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to save audit configuration.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const { data } = await axios.post(`/api/automation-configs/${id}/toggle-active`);
      const status = data.isActive ? 'scheduled & active' : 'deactivated';
      dispatch(openSnackbar({ open: true, message: `Configuration is now ${status}!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to toggle active state.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleRunNow = async (id) => {
    try {
      await axios.post(`/api/automation-configs/${id}/run-now`);
      dispatch(openSnackbar({ open: true, message: 'Automation job execution triggered!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to trigger automation job.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleToggleAuditActive = async (id) => {
    try {
      const { data } = await axios.post(`/api/qms/audit-configs/${id}/toggle-active`);
      const status = data.status ? 'activated' : 'deactivated';
      dispatch(openSnackbar({ open: true, message: `Audit configuration is now ${status}!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to toggle active state.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleRunAuditNow = async (id, dateStr) => {
    try {
      await axios.post(`/api/qms/audit-configs/${id}/run-now?date=${dateStr || ''}`);
      dispatch(openSnackbar({ open: true, message: 'Audit configuration generation triggered!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to trigger audit generation.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleRunAllAudits = async (dateStr) => {
    try {
      await axios.post(`/api/qms/audit-configs/run-all?date=${dateStr || ''}`);
      dispatch(openSnackbar({ open: true, message: 'All active audit configurations execution triggered!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to trigger executions.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleCloneConfig = async (id) => {
    try {
      await axios.post(`/api/automation-configs/${id}/clone`);
      dispatch(openSnackbar({ open: true, message: 'Automation configuration cloned!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to clone.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm("Are you sure you want to delete this configuration?")) return;
    try {
      await axios.delete(`/api/automation-configs/${id}`);
      dispatch(openSnackbar({ open: true, message: 'Configuration deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteAuditConfig = async (id) => {
    if (!window.confirm("Are you sure you want to delete this configuration?")) return;
    try {
      await axios.delete(`/api/qms/audit-configs/${id}`);
      dispatch(openSnackbar({ open: true, message: 'Audit configuration deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleViewLogs = async (id) => {
    setCurrentConfigId(id);
    try {
      const { data } = await axios.get(`/api/automation-configs/${id}/logs`);
      setLogs(data || []);
      setLogModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewAuditLogs = async (id) => {
    setCurrentConfigId(id);
    try {
      const { data } = await axios.get(`/api/qms/audit-configs/${id}/logs`);
      setLogs(data || []);
      setLogModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewAudits = async (id) => {
    setCurrentConfigId(id);
    try {
      const { data } = await axios.get(`/api/automation-configs/${id}/audits`);
      setAudits(data || []);
      setAuditModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMeetingConfigToggle = async (id, currentStatus) => {
    try {
      await axios.put(`/api/qms/meeting-configs/${id}/status`, { status: !currentStatus });
      dispatch(openSnackbar({ open: true, message: `Meeting configuration ${!currentStatus ? 'enabled' : 'disabled'} successfully!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to update meeting configuration status.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleMigrateSchedules = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/qms/meeting-configs/migrate-schedules');
      dispatch(openSnackbar({ open: true, message: response.data.message || 'Schedules migrated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to migrate meeting schedules.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
      setLoading(false);
    }
  };

  const handleDeleteAllMeetingConfigs = async () => {
    if (!window.confirm("Are you sure you want to delete all meeting configurations? This will reset the configurations for all previous schedules.")) return;
    try {
      setLoading(true);
      const response = await axios.delete('/api/qms/meeting-configs/delete-all');
      dispatch(openSnackbar({ open: true, message: response.data.message || 'All meeting configs deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchConfigs();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete meeting configs.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMeetingRowDoubleClick = (row) => {
    setSelectedMeeting(row);
    setMeetingModalOpen(true);
  };

  // Summaries Calculations
  const activeCount = configs.filter(c => c.isActive).length;
  const inactiveCount = configs.length - activeCount;

  // Render Table Columns
  const columns = [
    {
      field: 'configCode',
      headerName: 'Code',
      width: 120,
      renderCell: (params) => <Typography sx={{ fontWeight: 'bold' }}>{params.value}</Typography>
    },
    { field: 'configName', headerName: 'Automation Job Name', width: 220 },
    { field: 'category', headerName: 'Category', width: 120 },
    { field: 'sourceName', headerName: 'Source Module', width: 180 },
    { field: 'triggerType', headerName: 'Trigger Schedule', width: 140 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <BOSStatusChip
          status={params.value ? 'Active' : 'Inactive'}
          showIcon={true}
          width={100}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 320,
      sortable: false,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
            <Tooltip title="Edit Wizard"><IconButton onClick={() => { setSelectedConfig(row); setView('EDIT_CONFIG'); }} sx={tableActionEditSx}><IconSettings size={18} /></IconButton></Tooltip>
            <Tooltip title="Run Immediately"><IconButton onClick={() => handleRunNow(row.rowId)} sx={{ color: 'success.main' }}><IconPlayerPlay size={18} /></IconButton></Tooltip>
            <Tooltip title="Clone Job"><IconButton onClick={() => handleCloneConfig(row.rowId)} sx={{ color: 'secondary.main' }}><IconCopy size={18} /></IconButton></Tooltip>
            <Tooltip title="Toggle Schedule"><Button variant="text" size="small" onClick={() => handleToggleActive(row.rowId)} sx={{ fontSize: '11px', textTransform: 'none' }}>{row.isActive ? 'Pause' : 'Start'}</Button></Tooltip>
            <Tooltip title="Run Logs"><IconButton onClick={() => handleViewLogs(row.rowId)} sx={{ color: 'info.main' }}><IconActivity size={18} /></IconButton></Tooltip>
            <Tooltip title="Audits"><IconButton onClick={() => handleViewAudits(row.rowId)} sx={{ color: 'warning.main' }}><IconList size={18} /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton onClick={() => handleDeleteConfig(row.rowId)} sx={tableActionDeleteSx}><IconTrash size={18} /></IconButton></Tooltip>
          </Stack>
        );
      }
    }
  ];

  const auditColumns = [
    {
      id: 'configCode',
      label: 'Code',
      width: 120,
      render: (row) => <Typography sx={{ fontWeight: 'bold' }}>{row.configCode}</Typography>
    },
    { id: 'configName', label: 'Audit Config Name', width: 220 },
    {
      id: 'auditTypeEntity',
      label: 'Audit Type',
      width: 150,
      render: (row) => row.auditTypeEntity?.auditType || '-'
    },
    {
      id: 'departmentEntity',
      label: 'Department',
      width: 150,
      render: (row) => row.departmentEntity?.departmentName || '-'
    },
    { id: 'frequency', label: 'Frequency', width: 120 },
    { id: 'startTime', label: 'Start Time', width: 110 },
    {
      id: 'status',
      label: 'Status',
      width: 120,
      render: (row) => (
        <BOSStatusChip
          status={row.status ? 'Active' : 'Inactive'}
          showIcon={true}
          width={100}
        />
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      width: 280,
      sortable: false,
      render: (row) => {
        return (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
            <Tooltip title="Edit Config"><IconButton onClick={() => { setSelectedAudit(row); setAuditEditorOpen(true); }} sx={tableActionEditSx}><IconSettings size={18} /></IconButton></Tooltip>
            <Tooltip title="Run Immediately">
              <IconButton
                onClick={() => {
                  setTargetRunAuditConfigId(row.id);
                  setTargetRunDate(new Date().toLocaleDateString('sv-SE'));
                  setRunAuditDateDialogOpen(true);
                }}
                sx={{ color: 'success.main' }}
              >
                <IconPlayerPlay size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Status"><Button variant="text" size="small" onClick={() => handleToggleAuditActive(row.id)} sx={{ fontSize: '11px', textTransform: 'none' }}>{row.status ? 'Pause' : 'Start'}</Button></Tooltip>
            <Tooltip title="Run Logs"><IconButton onClick={() => handleViewAuditLogs(row.id)} sx={{ color: 'info.main' }}><IconActivity size={18} /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton onClick={() => handleDeleteAuditConfig(row.id)} sx={tableActionDeleteSx}><IconTrash size={18} /></IconButton></Tooltip>
          </Stack>
        );
      }
    }
  ];

  if (view === 'EDIT_CONFIG') {
    return <ConfigEditor config={selectedConfig} onSave={handleSaveConfig} onCancel={() => setView('LIST')} />;
  }

  if (view === 'EDIT_TEMPLATE') {
    return <TemplateDesigner template={selectedTemplate} onSave={handleSaveTemplate} onCancel={() => setView('LIST')} />;
  }

  // Removed conditional rendering for EDIT_AUDIT to render in dialog instead

  return (
    <MainCard
      icon={IconSettings}
      title={"Business Automation & Scheduler Designer"}
      secondary={
        <Stack direction="row" spacing={1.5}>
          {tabValue === 0 && (
            <>
              <Button variant="contained" startIcon={<IconPlaylistAdd size={18} />} sx={btnNew} onClick={() => { setSelectedTemplate(null); setView('EDIT_TEMPLATE'); }}>Layout Designer</Button>
              <Button variant="contained" startIcon={<IconPlus size={18} />} sx={btnSave} onClick={() => { setSelectedConfig(null); setView('EDIT_CONFIG'); }}>New Automation</Button>
            </>
          )}
          {tabValue === 1 && (
            <Button variant="contained" startIcon={<IconPlus size={18} />} sx={btnSave} onClick={() => { setSelectedTemplate(null); setView('EDIT_TEMPLATE'); }}>New Template</Button>
          )}
          {tabValue === 2 && (
            <Button variant="contained" color="error" startIcon={<IconTrash size={18} />} onClick={handleDeleteAllMeetingConfigs} disabled={loading}>Delete All Meeting Configs</Button>
          )}
          {tabValue === 3 && (
            <>
              <Button variant="contained" color="success" startIcon={<IconPlayerPlay size={18} />} onClick={() => { setTargetRunDate(new Date().toLocaleDateString('sv-SE')); setRunAllDateDialogOpen(true); }}>Run All Audits</Button>
              <Button variant="contained" startIcon={<IconPlus size={18} />} sx={btnSave} onClick={() => { setSelectedAudit(null); setAuditEditorOpen(true); }}>New Audit Config</Button>
            </>
          )}
        </Stack>
      }
    >
      <Stack spacing={4}>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="automation tabs">
            <Tab label="Automation Jobs" />
            <Tab label="Layout Templates" />
            <Tab label="Meeting Configs" />
            <Tab label="Audit Configuration" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Box>
            {loading ? (
              <Typography>Loading database records...</Typography>
            ) : (
              <BOSDataTable
                rows={configs}
                columns={columns}
                getRowId={(row) => row.rowId}
                id="automation-designer-table"
                onDoubleClickRow={(row) => { setSelectedConfig(row); setView('EDIT_CONFIG'); }}
                sx={{ height: 'calc(100vh - 280px)' }}
              />
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Grid container spacing={2}>
              {templates.map(t => (
                <Grid item xs={12} sm={6} md={4} key={t.rowId}>
                  <Card
                    sx={{ p: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                    onDoubleClick={() => { setSelectedTemplate(t); setView('EDIT_TEMPLATE'); }}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{t.templateName}</Typography>
                        <Chip label={t.templateType} size="small" color="primary" />
                      </Stack>
                      <Typography variant="body2" color="textSecondary">Subject: {t.subject || 'N/A'}</Typography>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button variant="outlined" size="small" startIcon={<IconEye size={14} />} onClick={() => { setSelectedTemplate(t); setView('EDIT_TEMPLATE'); }}>Edit Designer</Button>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>
              ))}
              {templates.length === 0 && (
                <Grid item xs={12}>
                  <Typography color="textSecondary" align="center" sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>No custom layouts defined yet. Click "Layout Designer" to create one.</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            {loading ? (
              <Typography>Loading database records...</Typography>
            ) : (
              <BOSDataTable
                rows={meetingConfigs}
                columns={[
                  { id: 'index', label: 'S.NO', width: 70 },
                  { id: 'scheduleId', label: 'Schedule Id', width: 180, render: (row) => row.scheduleId || '-' },
                  { id: 'meetingType', label: 'Meeting Type', width: 150 },
                  { id: 'host', label: 'Host', width: 160, render: (row) => row.host || '-' },
                  { id: 'head', label: 'Chaired By', width: 160, render: (row) => row.head || '-' },
                  { id: 'time', label: 'Time', width: 150, render: (row) => row.time || '-' },
                  { id: 'agenda', label: 'Agenda', width: 220 },
                  {
                    id: 'status',
                    label: 'Status',
                    width: 130,
                    render: (row) => (
                      <Stack direction="row" alignItems="center" spacing={1} onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={!!row.status}
                          onChange={() => handleMeetingConfigToggle(row.id, row.status)}
                          color="primary"
                        />
                        <Typography variant="body2">{row.status ? 'Enable' : 'Disable'}</Typography>
                      </Stack>
                    )
                  }
                ]}
                getRowId={(row) => row.id}
                id="meeting-configs-table"
                onDoubleClickRow={handleMeetingRowDoubleClick}
                sx={{ height: 'calc(100vh - 280px)' }}
              />
            )}
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            {loading ? (
              <Typography>Loading database records...</Typography>
            ) : (
              <BOSDataTable
                rows={auditConfigs}
                columns={auditColumns}
                getRowId={(row) => row.id}
                id="audit-configs-table"
                onDoubleClickRow={(row) => { setSelectedAudit(row); setAuditEditorOpen(true); }}
                sx={{ height: 'calc(100vh - 280px)' }}
              />
            )}
          </Box>
        )}

      </Stack>

      {/* Execution Monitoring Logs Dialog */}
      <Dialog open={logModalOpen} onClose={() => setLogModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h3">Execution Logs Dashboard</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {logs.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <table border="1" cellpadding="8" cellspacing="0" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
                <tr style={{ background: '#1a223f', color: '#fff' }}>
                  <th>Execution Date</th>
                  <th>Status</th>
                  <th>Success Count</th>
                  <th>Failure Count</th>
                  <th>Duration (ms)</th>
                  <th>Details</th>
                </tr>
                {logs.map((logRow, idx) => (
                  <tr key={logRow.id || logRow.rowId || idx}>
                    <td>{new Date(logRow.triggerTime).toLocaleString()}</td>
                    <td>
                      <Chip
                        label={logRow.status}
                        size="small"
                        color={logRow.status === 'COMPLETED' ? 'success' : logRow.status === 'RUNNING' ? 'info' : 'error'}
                      />
                    </td>
                    <td>{logRow.successCount}</td>
                    <td>{logRow.failureCount}</td>
                    <td>{logRow.durationMs} ms</td>
                    <td>{logRow.errorDetails || 'N/A'}</td>
                  </tr>
                ))}
              </table>
            </Box>
          ) : (
            <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No execution runs tracked for this configuration yet.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogModalOpen(false)} variant="contained" sx={btnNew}>Close Logs</Button>
        </DialogActions>
      </Dialog>

      {/* Audit Logs Dialog */}
      <Dialog open={auditModalOpen} onClose={() => setAuditModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h3">Configuration Audit Log Trail</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {audits.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <table border="1" cellpadding="8" cellspacing="0" style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
                <tr style={{ background: '#1a223f', color: '#fff' }}>
                  <th>Change Date</th>
                  <th>Event Action</th>
                  <th>User</th>
                  <th>Comments</th>
                </tr>
                {audits.map((a) => (
                  <tr key={a.rowId}>
                    <td>{new Date(a.changedDate).toLocaleString()}</td>
                    <td>
                      <Chip label={a.actionType} size="small" variant="outlined" color="primary" />
                    </td>
                    <td>{a.changedBy}</td>
                    <td>{a.comments}</td>
                  </tr>
                ))}
              </table>
            </Box>
          ) : (
            <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No modifications logged for this configuration.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditModalOpen(false)} variant="contained" sx={btnNew}>Close History</Button>
        </DialogActions>
      </Dialog>

      {/* Meeting Details Dialog */}
      <Dialog
        open={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.light', py: 2, px: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconVideo size={26} color={theme.palette.primary.main} />
            <Typography variant="h3" color="primary.dark" fontWeight={700}>Meeting Details</Typography>
          </Stack>
          <IconButton onClick={() => setMeetingModalOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: 'background.default' }}>
          {selectedMeeting ? (
            <Box>
              {/* Header Info */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box>
                  <Typography variant="h4" fontWeight={700} color="primary.main">{selectedMeeting.meetingType || 'Meeting Config'}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontWeight: 600 }}>
                    Schedule ID: {selectedMeeting.scheduleId || 'No Schedule ID'}
                  </Typography>
                </Box>
                <BOSStatusChip status={selectedMeeting.status ? 'Active' : 'Inactive'} showIcon={true} width={110} />
              </Stack>

              <Grid container spacing={2.5}>
                {/* Meeting Type & Agenda */}
                <Grid item xs={12}>
                  <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: 'primary.main' }}>
                        <IconNotes size={20} /> Agenda & Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Meeting Type</Typography>
                          <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>{selectedMeeting.meetingType || '-'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <Typography variant="caption" color="textSecondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agenda</Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.primary', lineHeight: 1.6 }}>{selectedMeeting.agenda || '-'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Organization Info */}
                <Grid item xs={12}>
                  <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: 'primary.main' }}>
                        <IconCalendarEvent size={20} /> Organization Info
                      </Typography>
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={4}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'primary.lighter', display: 'flex' }}>
                              <IconUser size={20} color={theme.palette.primary.main} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary" fontWeight={600}>Host</Typography>
                              <Typography variant="body2" fontWeight={700}>{selectedMeeting.host || '-'}</Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'secondary.lighter', display: 'flex' }}>
                              <IconUser size={20} color={theme.palette.secondary.main} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary" fontWeight={600}>Chaired By (Head)</Typography>
                              <Typography variant="body2" fontWeight={700}>{selectedMeeting.head || '-'}</Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'info.lighter', display: 'flex' }}>
                              <IconClock size={20} color={theme.palette.info.main} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary" fontWeight={600}>Time</Typography>
                              <Typography variant="body2" fontWeight={700}>{selectedMeeting.time || '-'}</Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'success.lighter', display: 'flex', mt: 0.5 }}>
                              <IconBuilding size={20} color={theme.palette.success.main} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary" fontWeight={600}>Department(s)</Typography>
                              <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary', mt: 0.25 }}>{selectedMeeting.department || '-'}</Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'warning.lighter', display: 'flex', mt: 0.5 }}>
                              <IconUsers size={20} color={theme.palette.warning.main} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary" fontWeight={600}>Participants</Typography>
                              <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary', mt: 0.25 }}>{selectedMeeting.participants || '-'}</Typography>
                            </Box>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography color="textSecondary">No details available</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setMeetingModalOpen(false)} variant="contained" sx={btnNew}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Audit Configuration Editor Dialog */}
      <BOSFormDialog
        open={auditEditorOpen}
        onClose={() => setAuditEditorOpen(false)}
        title={selectedAudit ? 'EDIT AUDIT CONFIGURATION' : 'NEW AUDIT CONFIGURATION'}
        maxWidth="md"
        onSave={() => {
          document.getElementById('audit-config-form')?.requestSubmit();
        }}
        saveButtonLabel="Save Config"
      >
        <AuditConfigEditor
          formId="audit-config-form"
          config={selectedAudit}
          onSave={handleSaveAuditConfig}
          onCancel={() => setAuditEditorOpen(false)}
          hideActions={true}
        />
      </BOSFormDialog>

      {/* Run Immediately Target Date Selector Dialog */}
      <Dialog open={runAuditDateDialogOpen} onClose={() => setRunAuditDateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.light', pb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconCalendarEvent size={28} color={theme.palette.primary.main} />
            <Typography variant="h3" color="primary.dark">Select Target Date</Typography>
          </Stack>
          <IconButton onClick={() => setRunAuditDateDialogOpen(false)} size="small" sx={{ color: 'grey.500' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: 'background.default', mt: 2 }}>
          <Stack spacing={3}>
            <Typography variant="body1">
              Select the target date for which you want to trigger this audit configuration generation:
            </Typography>
            <BOSDatePicker
              fullWidth
              label="Target Execution Date"
              value={targetRunDate}
              onChange={(e) => setTargetRunDate(e.target.value)}
              presets={false}
              disablePast={true}
              slotProps={{ popper: { disablePortal: false } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
          <Button variant="outlined" color="primary" onClick={() => setRunAuditDateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setRunAuditDateDialogOpen(false);
              handleRunAuditNow(targetRunAuditConfigId, targetRunDate);
            }}
          >
            Run
          </Button>
        </DialogActions>
      </Dialog>

      {/* Run All Target Date Selector Dialog */}
      <Dialog open={runAllDateDialogOpen} onClose={() => setRunAllDateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.light', pb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconCalendarEvent size={28} color={theme.palette.primary.main} />
            <Typography variant="h3" color="primary.dark">Select Target Date (All)</Typography>
          </Stack>
          <IconButton onClick={() => setRunAllDateDialogOpen(false)} size="small" sx={{ color: 'grey.500' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: 'background.default', mt: 2 }}>
          <Stack spacing={3}>
            <Typography variant="body1">
              Select the target execution date for all active configurations:
            </Typography>
            <BOSDatePicker
              fullWidth
              label="Target Execution Date"
              value={targetRunDate}
              onChange={(e) => setTargetRunDate(e.target.value)}
              presets={false}
              disablePast={true}
              slotProps={{ popper: { disablePortal: false } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'background.default' }}>
          <Button variant="outlined" color="primary" onClick={() => setRunAllDateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              setRunAllDateDialogOpen(false);
              handleRunAllAudits(targetRunDate);
            }}
          >
            Run All
          </Button>
        </DialogActions>
      </Dialog>

    </MainCard>
  );
}
