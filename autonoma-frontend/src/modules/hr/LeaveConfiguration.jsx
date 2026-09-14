import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Box,
  Tabs,
  Tab,
  Switch,
  Divider,
  Card,
  CardContent,
  Paper
} from '@mui/material';
import {
  IconSettings,
  IconEdit,
  IconTrash,
  IconFileDescription,
  IconCalendarEvent,
  IconUserCheck,
  IconCurrencyDollar,
  IconShieldCheck
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSTableToolbar,
  BOSFormDialog,
  BOSStatusField,
  BOSDatePicker
} from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';

export const DYNAMIC_COMPONENTS = [];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leave-config-tabpanel-${index}`}
      aria-labelledby={`leave-config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2, pb: 1, width: '100%' }}>{children}</Box>}
    </div>
  );
}

export default function LeaveConfiguration() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.PAY_LEAVE_CONFIG);

  const [rows, setRows] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Form & Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    leaveType: '',
    leaveCode: '',
    leaveName: '',
    empType: '',
    condition: '',
    creditValue: 1.0,
    annualQuota: 12.0,
    monthlyCreditRate: 1.0,
    accrualFrequency: 'MONTHLY',
    allowCarryForward: false,
    maxCarryForwardDays: 0,
    carryForwardExpiryMonths: 12,
    allowEncashment: false,
    minBalanceToRetain: 0,
    maxEncashableDays: 0,
    genderEligibility: 'ALL',
    probationAllowed: true,
    minServiceMonths: 0,
    sandwichRuleApplies: false,
    includeWeekends: false,
    includeHolidays: false,
    maxConsecutiveDays: 30,
    allowHalfDay: true,
    allowHourly: false,
    approvalLevels: 1,
    documentRequired: false,
    documentThresholdDays: 3,
    autoCreditPolicy: 'WORKING_DAYS_20',
    allowNegativeBalance: false,
    effectiveFromDate: '',
    effectiveToDate: '',
    status: 'ACTIVE'
  });

  useKeyboardShortcuts({
    'ctrl+n': () => {
      if (perms.write) {
        handleOpenAdd();
      }
    },
    escape: () => {
      if (dialogOpen) {
        handleCloseDialog();
      }
    }
  });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/leave-configs');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch leave configurations:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Leave Configurations.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const fetchEmployeeTypes = useCallback(async () => {
    try {
      const response = await axios.get('/api/master/hr/employee-types');
      setEmployeeTypes(response.data || []);
    } catch (error) {
      console.error('Failed to fetch employee types:', error);
    }
  }, []);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const response = await axios.get('/api/master/hr/leaves/active');
      setLeaveTypes(response.data || []);
    } catch (error) {
      console.error('Failed to fetch leave types:', error);
    }
  }, []);

  useEffect(() => {
    fetchRows();
    fetchEmployeeTypes();
    fetchLeaveTypes();
  }, [fetchRows, fetchEmployeeTypes, fetchLeaveTypes]);

  const resetForm = () => {
    const defaultLT = leaveTypes[0]?.leaveCode || leaveTypes[0]?.leaveType || 'EL';
    const defaultET = employeeTypes[0]?.typeName || employeeTypes[0]?.empType || 'FULL_TIME';
    setFormData({
      leaveType: defaultLT,
      leaveCode: defaultLT,
      leaveName: leaveTypes[0]?.leaveName || 'Earned Leave',
      empType: defaultET,
      condition: '',
      creditValue: 1.0,
      annualQuota: 12.0,
      monthlyCreditRate: 1.0,
      accrualFrequency: 'MONTHLY',
      allowCarryForward: false,
      maxCarryForwardDays: 0,
      carryForwardExpiryMonths: 12,
      allowEncashment: false,
      minBalanceToRetain: 0,
      maxEncashableDays: 0,
      genderEligibility: 'ALL',
      probationAllowed: true,
      minServiceMonths: 0,
      sandwichRuleApplies: false,
      includeWeekends: false,
      includeHolidays: false,
      maxConsecutiveDays: 30,
      allowHalfDay: true,
      allowHourly: false,
      approvalLevels: 1,
      documentRequired: false,
      documentThresholdDays: 3,
      autoCreditPolicy: 'WORKING_DAYS_20',
      allowNegativeBalance: false,
      effectiveFromDate: '',
      effectiveToDate: '',
      status: 'ACTIVE'
    });
    setTabValue(0);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditId(row.id);
    setFormData({
      leaveType: row.leaveType || '',
      leaveCode: row.leaveCode || row.leaveType || '',
      leaveName: row.leaveName || row.leaveType || '',
      empType: row.empType || '',
      condition: row.condition || '',
      creditValue: row.creditValue !== undefined ? row.creditValue : 1.0,
      annualQuota: row.annualQuota !== undefined ? row.annualQuota : 0.0,
      monthlyCreditRate: row.monthlyCreditRate !== undefined ? row.monthlyCreditRate : 0.0,
      accrualFrequency: row.accrualFrequency || 'MONTHLY',
      allowCarryForward: !!row.allowCarryForward,
      maxCarryForwardDays: row.maxCarryForwardDays || 0,
      carryForwardExpiryMonths: row.carryForwardExpiryMonths || 12,
      allowEncashment: !!row.allowEncashment,
      minBalanceToRetain: row.minBalanceToRetain || 0,
      maxEncashableDays: row.maxEncashableDays || 0,
      genderEligibility: row.genderEligibility || 'ALL',
      probationAllowed: row.probationAllowed !== false,
      minServiceMonths: row.minServiceMonths || 0,
      sandwichRuleApplies: !!row.sandwichRuleApplies,
      includeWeekends: !!row.includeWeekends,
      includeHolidays: !!row.includeHolidays,
      maxConsecutiveDays: row.maxConsecutiveDays || 30,
      allowHalfDay: row.allowHalfDay !== false,
      allowHourly: !!row.allowHourly,
      approvalLevels: row.approvalLevels || 1,
      documentRequired: !!row.documentRequired,
      documentThresholdDays: row.documentThresholdDays || 3,
      autoCreditPolicy: row.autoCreditPolicy || 'WORKING_DAYS_20',
      allowNegativeBalance: !!row.allowNegativeBalance,
      effectiveFromDate: row.effectiveFromDate ? row.effectiveFromDate.substring(0, 10) : '',
      effectiveToDate: row.effectiveToDate ? row.effectiveToDate.substring(0, 10) : '',
      status: row.status || 'ACTIVE'
    });
    setTabValue(0);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditId(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave configuration?')) return;
    try {
      await axios.delete(`/api/hr/leave-configs/${id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave configuration deleted successfully.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        })
      );
      fetchRows();
    } catch {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete leave configuration.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const handleSubmit = async () => {
    if (!formData.leaveType || !formData.empType) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please fill in mandatory fields (Leave Type, Emp Type).',
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    try {
      const payload = {
        ...formData,
        creditValue: parseFloat(formData.creditValue) || 1.0,
        annualQuota: parseFloat(formData.annualQuota) || 0.0,
        monthlyCreditRate: parseFloat(formData.monthlyCreditRate) || 0.0,
        maxCarryForwardDays: parseFloat(formData.maxCarryForwardDays) || 0.0,
        carryForwardExpiryMonths: parseInt(formData.carryForwardExpiryMonths, 10) || 12,
        minBalanceToRetain: parseFloat(formData.minBalanceToRetain) || 0.0,
        maxEncashableDays: parseFloat(formData.maxEncashableDays) || 0.0,
        minServiceMonths: parseInt(formData.minServiceMonths, 10) || 0,
        maxConsecutiveDays: parseInt(formData.maxConsecutiveDays, 10) || 30,
        approvalLevels: parseInt(formData.approvalLevels, 10) || 1,
        documentThresholdDays: parseInt(formData.documentThresholdDays, 10) || 3
      };

      if (editId) {
        await axios.put(`/api/hr/leave-configs/${editId}`, payload);
      } else {
        await axios.post('/api/hr/leave-configs', payload);
      }

      dispatch(
        openSnackbar({
          open: true,
          message: `Leave configuration ${editId ? 'updated' : 'created'} successfully.`,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        })
      );
      setDialogOpen(false);
      setEditId(null);
      resetForm();
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save leave configuration.';
      dispatch(
        openSnackbar({
          open: true,
          message: msg,
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const columns = useMemo(() => [
    {
      id: 'leaveCode',
      label: 'Leave Type / Code',
      bold: true,
      minWidth: 180,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" fontWeight={700}>
            {row.leaveName || row.leaveType} ({row.leaveCode || row.leaveType})
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Type: {row.leaveType}
          </Typography>
        </Stack>
      )
    },
    { id: 'empType', label: 'Emp Type', bold: true, minWidth: 140 },
    {
      id: 'annualQuota',
      label: 'Annual Quota',
      minWidth: 120,
      align: 'center',
      render: (row) => (
        <Chip
          label={`${(row.annualQuota || 0).toFixed(1)} Days`}
          size="small"
          variant="outlined"
          color="primary"
          sx={{ fontWeight: 600 }}
        />
      )
    },
    {
      id: 'monthlyCreditRate',
      label: 'Monthly Rate',
      minWidth: 120,
      align: 'center',
      render: (row) => `${(row.monthlyCreditRate || 0).toFixed(2)} / mo`
    },
    {
      id: 'carryForward',
      label: 'Carryover',
      minWidth: 120,
      align: 'center',
      render: (row) =>
        row.allowCarryForward ? (
          <Chip label={`Max ${row.maxCarryForwardDays || 0} Days`} size="small" color="success" sx={{ fontSize: '0.7rem' }} />
        ) : (
          <Typography variant="caption" color="textSecondary">No</Typography>
        )
    },
    {
      id: 'encashment',
      label: 'Encashment',
      minWidth: 120,
      align: 'center',
      render: (row) =>
        row.allowEncashment ? (
          <Chip label={`Max ${row.maxEncashableDays || 0} Days`} size="small" color="secondary" sx={{ fontSize: '0.7rem' }} />
        ) : (
          <Typography variant="caption" color="textSecondary">No</Typography>
        )
    },
    {
      id: 'genderEligibility',
      label: 'Gender',
      minWidth: 100,
      align: 'center',
      render: (row) => row.genderEligibility || 'ALL'
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 110,
      align: 'center',
      render: (row) => {
        const isAct = row.status === 'ACTIVE';
        return (
          <Chip
            label={row.status}
            size="small"
            sx={{
              background: isAct ? 'rgba(76, 175, 80, 0.12)' : 'rgba(244, 67, 54, 0.12)',
              color: isAct ? '#1b5e20' : '#b71c1c',
              border: '1px solid',
              borderColor: isAct ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
              fontWeight: '800',
              fontSize: '0.75rem',
              borderRadius: '6px'
            }}
          />
        );
      }
    }
  ], []);

  // Standard switch wrapper with full width and 40px height matching standard inputs
  const renderSwitchBox = (label, checked, onChange) => (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        px: 2,
        height: '40px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '8px',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
        {label}
      </Typography>
      <Switch checked={checked} onChange={onChange} size="small" color="primary" />
    </Paper>
  );

  return (
    <MainCard
      contentSX={{ p: 0 }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconSettings size={24} style={{ color: '#1e88e5' }} />
          <Typography variant="h3">Leave Configuration Page</Typography>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          onNew={handleOpenAdd}
          newLabel="+ New"
          hasWritePermission={perms.write}
          onRefresh={fetchRows}
          exportData={rows}
          exportFilename="Leave_Configurations"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      {DYNAMIC_COMPONENTS.map((comp) => comp.render({ rows, loading, perms }))}

      <BOSDataTable
        id="LeaveConfiguration"
        columns={columns}
        rows={rows}
        loading={loading}
        onEditRow={handleOpenEdit}
        onDoubleClickRow={handleOpenEdit}
        onDeleteRow={perms.delete ? (row) => handleDelete(row.id) : undefined}
      />

      {/* Tabbed Enterprise BOS Pop-up Dialog to eliminate long vertical scrolling */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={editId ? 'Edit Leave Configuration' : 'Add New Leave Configuration'}
        maxWidth="md"
        onSave={handleSubmit}
        onClear={resetForm}
        hasId={!!editId}
        onDelete={editId ? () => handleDelete(editId) : undefined}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 0.5, mb: 1, width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            indicatorColor="primary"
            textColor="primary"
            sx={{
              minHeight: '44px',
              '& .MuiTab-root': {
                minHeight: '44px',
                py: 1,
                px: 2,
                fontWeight: 600,
                fontSize: '0.875rem'
              }
            }}
          >
            <Tab label="1. Basic Details" icon={<IconFileDescription size={18} />} iconPosition="start" />
            <Tab label="2. Quota & Accrual" icon={<IconCalendarEvent size={18} />} iconPosition="start" />
            <Tab label="3. Carryover & Encashment" icon={<IconCurrencyDollar size={18} />} iconPosition="start" />
            <Tab label="4. Eligibility & Tenure" icon={<IconUserCheck size={18} />} iconPosition="start" />
            <Tab label="5. Policy & Inclusion" icon={<IconShieldCheck size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab 1: Basic & Target Configuration */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2.5} sx={{ width: '100%', m: 0 }}>
            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <FormControl fullWidth size="small">
                <InputLabel id="leave-type-label">Leave Type *</InputLabel>
                <Select
                  labelId="leave-type-label"
                  label="Leave Type *"
                  value={formData.leaveType}
                  onChange={(e) => {
                    const selectedLT = leaveTypes.find((l) => (l.leaveCode || l.leaveType) === e.target.value);
                    setFormData({
                      ...formData,
                      leaveType: e.target.value,
                      leaveCode: e.target.value,
                      leaveName: selectedLT?.leaveName || e.target.value
                    });
                  }}
                >
                  {leaveTypes.map((lt) => {
                    const val = lt.leaveCode || lt.leaveType;
                    const label = lt.leaveName ? `${lt.leaveName} (${val})` : val;
                    return (
                      <MenuItem key={lt.leaveTypeId || lt.id || val} value={val}>
                        {label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <FormControl fullWidth size="small">
                <InputLabel id="emp-type-label">Employee Type *</InputLabel>
                <Select
                  labelId="emp-type-label"
                  label="Employee Type *"
                  value={formData.empType}
                  onChange={(e) => setFormData({ ...formData, empType: e.target.value })}
                >
                  {employeeTypes.map((et) => {
                    const val = et.typeName || et.empType || et.name || String(et.id);
                    const displayLabel = et.typeName || et.empType || et.name || `Type ${et.id}`;
                    return (
                      <MenuItem key={et.id || val} value={val}>
                        {displayLabel}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Leave Display Name"
                size="small"
                value={formData.leaveName}
                onChange={(e) => setFormData({ ...formData, leaveName: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <FormControl fullWidth size="small">
                <InputLabel id="gender-select-label">Gender Eligibility</InputLabel>
                <Select
                  labelId="gender-select-label"
                  label="Gender Eligibility"
                  value={formData.genderEligibility}
                  onChange={(e) => setFormData({ ...formData, genderEligibility: e.target.value })}
                >
                  <MenuItem value="ALL">All Genders</MenuItem>
                  <MenuItem value="MALE">Male Only</MenuItem>
                  <MenuItem value="FEMALE">Female Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <BOSStatusField
                isCreate={!editId}
                type="string-upper-in-active"
                name="status"
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={!perms.write}
                size="small"
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Description"
                placeholder="Enter description (e.g., 12 days per calendar year)..."
                size="small"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Quota & Accrual Rules */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2.5} sx={{ width: '100%', m: 0 }}>
            <Grid item xs={12} sm={4} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Annual Quota (Days)"
                type="number"
                size="small"
                inputProps={{ step: '0.5' }}
                value={formData.annualQuota}
                onChange={(e) => setFormData({ ...formData, annualQuota: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Monthly Credit Rate"
                type="number"
                size="small"
                inputProps={{ step: '0.25' }}
                value={formData.monthlyCreditRate}
                onChange={(e) => setFormData({ ...formData, monthlyCreditRate: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Default Credit Value"
                type="number"
                size="small"
                inputProps={{ step: '0.1' }}
                value={formData.creditValue}
                onChange={(e) => setFormData({ ...formData, creditValue: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <FormControl fullWidth size="small">
                <InputLabel id="accrual-freq-label">Accrual Frequency</InputLabel>
                <Select
                  labelId="accrual-freq-label"
                  label="Accrual Frequency"
                  value={formData.accrualFrequency}
                  onChange={(e) => setFormData({ ...formData, accrualFrequency: e.target.value })}
                >
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                  <MenuItem value="YEARLY">Yearly / Upfront</MenuItem>
                  <MenuItem value="WORKING_DAYS">Working Days Based</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <FormControl fullWidth size="small">
                <InputLabel id="auto-credit-policy-label">Auto Credit Policy</InputLabel>
                <Select
                  labelId="auto-credit-policy-label"
                  label="Auto Credit Policy"
                  value={formData.autoCreditPolicy}
                  onChange={(e) => setFormData({ ...formData, autoCreditPolicy: e.target.value })}
                >
                  <MenuItem value="ACCRUAL_MONTHLY">Monthly Fixed Accrual</MenuItem>
                  <MenuItem value="WORKING_DAYS">Working Days Based Accrual</MenuItem>
                  <MenuItem value="PRO_RATA">Pro-Rata Joining Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Carryover & Encashment Rules */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2.5} sx={{ width: '100%', m: 0 }}>
            <Grid item xs={12} md={6} sx={{ width: '100%' }}>
              <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
                <CardContent>
                  <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                    Carry-Forward Rules
                  </Typography>
                  <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
                    <Grid item xs={12} sx={{ width: '100%' }}>
                      {renderSwitchBox('Allow Carry-Forward to Next Year', formData.allowCarryForward, (e) =>
                        setFormData({ ...formData, allowCarryForward: e.target.checked })
                      )}
                    </Grid>
                    {formData.allowCarryForward && (
                      <>
                        <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
                          <TextField
                            fullWidth
                            label="Max Carry-Forward Days"
                            type="number"
                            size="small"
                            value={formData.maxCarryForwardDays}
                            onChange={(e) => setFormData({ ...formData, maxCarryForwardDays: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
                          <TextField
                            fullWidth
                            label="Expiry (Months)"
                            type="number"
                            size="small"
                            value={formData.carryForwardExpiryMonths}
                            onChange={(e) => setFormData({ ...formData, carryForwardExpiryMonths: e.target.value })}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} sx={{ width: '100%' }}>
              <Card variant="outlined" sx={{ height: '100%', width: '100%' }}>
                <CardContent>
                  <Typography variant="h5" color="secondary" sx={{ mb: 2 }}>
                    Encashment Rules
                  </Typography>
                  <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
                    <Grid item xs={12} sx={{ width: '100%' }}>
                      {renderSwitchBox('Allow Leave Encashment', formData.allowEncashment, (e) =>
                        setFormData({ ...formData, allowEncashment: e.target.checked })
                      )}
                    </Grid>
                    {formData.allowEncashment && (
                      <>
                        <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
                          <TextField
                            fullWidth
                            label="Min Retain Balance"
                            type="number"
                            size="small"
                            value={formData.minBalanceToRetain}
                            onChange={(e) => setFormData({ ...formData, minBalanceToRetain: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
                          <TextField
                            fullWidth
                            label="Max Encashable Days"
                            type="number"
                            size="small"
                            value={formData.maxEncashableDays}
                            onChange={(e) => setFormData({ ...formData, maxEncashableDays: e.target.value })}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Eligibility & Service Tenure */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2.5} sx={{ width: '100%', m: 0 }}>
            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              {renderSwitchBox('Allowed During Probation', formData.probationAllowed, (e) =>
                setFormData({ ...formData, probationAllowed: e.target.checked })
              )}
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Min Service Tenure (Months)"
                type="number"
                size="small"
                value={formData.minServiceMonths}
                onChange={(e) => setFormData({ ...formData, minServiceMonths: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Max Consecutive Days"
                type="number"
                size="small"
                value={formData.maxConsecutiveDays}
                onChange={(e) => setFormData({ ...formData, maxConsecutiveDays: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <BOSDatePicker
                name="effectiveFromDate"
                label="Effective From Date"
                value={formData.effectiveFromDate}
                onChange={(e) => setFormData({ ...formData, effectiveFromDate: e.target.value })}
                disablePast={false}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <BOSDatePicker
                name="effectiveToDate"
                label="Effective To Date"
                value={formData.effectiveToDate}
                onChange={(e) => setFormData({ ...formData, effectiveToDate: e.target.value })}
                disablePast={false}
                fullWidth
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 5: Attendance & Inclusion Policies */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              {renderSwitchBox('Sandwich Leave Policy', formData.sandwichRuleApplies, (e) =>
                setFormData({ ...formData, sandwichRuleApplies: e.target.checked })
              )}
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              {renderSwitchBox('Include Weekends', formData.includeWeekends, (e) =>
                setFormData({ ...formData, includeWeekends: e.target.checked })
              )}
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              {renderSwitchBox('Include Holidays', formData.includeHolidays, (e) =>
                setFormData({ ...formData, includeHolidays: e.target.checked })
              )}
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              {renderSwitchBox('Allow Half-Day', formData.allowHalfDay, (e) =>
                setFormData({ ...formData, allowHalfDay: e.target.checked })
              )}
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              {renderSwitchBox('Allow Hourly / Short Leave', formData.allowHourly, (e) =>
                setFormData({ ...formData, allowHourly: e.target.checked })
              )}
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              {renderSwitchBox('Allow LOP / Negative Balance', formData.allowNegativeBalance, (e) =>
                setFormData({ ...formData, allowNegativeBalance: e.target.checked })
              )}
            </Grid>

            <Grid item xs={12} sx={{ width: '100%' }}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Approval Levels Required"
                type="number"
                size="small"
                value={formData.approvalLevels}
                onChange={(e) => setFormData({ ...formData, approvalLevels: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              {renderSwitchBox('Document Mandatory', formData.documentRequired, (e) =>
                setFormData({ ...formData, documentRequired: e.target.checked })
              )}
            </Grid>

            {formData.documentRequired && (
              <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  label="Doc Required If Days >="
                  type="number"
                  size="small"
                  value={formData.documentThresholdDays}
                  onChange={(e) => setFormData({ ...formData, documentThresholdDays: e.target.value })}
                />
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </BOSFormDialog>
    </MainCard>
  );
}
