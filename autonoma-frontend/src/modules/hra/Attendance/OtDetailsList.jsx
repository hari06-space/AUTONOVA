import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Button,
  Tooltip,
  IconButton,
  Box,
  useTheme,
  Chip,
  Avatar,
  Grid
} from '@mui/material';
import { IconPlus, IconRefresh, IconEdit } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSTextField,
  BOSTableToolbar,
  BOSFormSection,
  BOSEmployeeAutocomplete,
  BOSDatePicker,
  BOSStatusChip,
  btnNew,
  getCommonDateFilters,
  matchCommonDateFilters,
  getPhotoUrl
} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import useConfig from 'hooks/useConfig';
import { formatDate } from 'utils/BOSTimeUtils';

const INITIAL_STATE = {
  id: null,
  employeeId: null,
  otDate: new Date().toISOString().substring(0, 10),
  hours: 1,
  minutes: 0,
  remarks: '',
  fromWhere: 'HRA OT Details'
};

const VALIDATION_RULES = [
  { field: 'employeeId', label: 'Employee Name', required: true },
  { field: 'otDate', label: 'Overtime Date', required: true }
];

export default function OtDetailsList() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { dateFormat } = useConfig();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('This Month');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [scope, setScope] = useState('All');

  // Form Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);

  const { errors, validate, clearErrors } = useBOSValidation();

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/hra/ot-master/list');
      if (Array.isArray(res.data)) {
        setRows(res.data);
      }
    } catch (err) {
      console.error('Error fetching OT details:', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to fetch OT records', variant: 'alert', alert: { color: 'error' } }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleOpenNew = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    const totalMins = row.durationMinutes || 0;
    setFormData({
      id: row.id,
      employeeId: row.employeeId,
      otDate: row.otDate ? row.otDate.split('T')[0] : new Date().toISOString().substring(0, 10),
      hours: Math.floor(totalMins / 60),
      minutes: totalMins % 60,
      remarks: row.remarks || '',
      fromWhere: row.fromWhere || 'HRA OT Details'
    });
    clearErrors();
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    const totalMinutes = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
    if (totalMinutes <= 0) {
      dispatch(openSnackbar({ open: true, message: 'Duration must be greater than 0 minutes', variant: 'alert', alert: { color: 'error' } }));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: formData.id || null,
        employeeId: formData.employeeId,
        otDate: formData.otDate,
        durationMinutes: totalMinutes,
        remarks: formData.remarks,
        fromWhere: formData.fromWhere
      };

      await axios.post('/api/hra/ot-master/save', payload);
      dispatch(openSnackbar({ open: true, message: `OT entry ${formData.id ? 'updated' : 'created'} successfully`, variant: 'alert', alert: { color: 'success' } }));
      setDialogOpen(false);
      fetchRows();
    } catch (err) {
      console.error('Error saving OT entry:', err);
      dispatch(openSnackbar({ open: true, message: err.response?.data?.message || 'Failed to save OT entry', variant: 'alert', alert: { color: 'error' } }));
    } finally {
      setSaving(false);
    }
  };

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // 1. Text Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const empName = (row.employeeName || '').toLowerCase();
        const empCode = (row.employeeCode || '').toLowerCase();
        const remarks = (row.remarks || '').toLowerCase();
        if (!empName.includes(q) && !empCode.includes(q) && !remarks.includes(q)) {
          return false;
        }
      }

      // 2. Date Filter
      if (!matchCommonDateFilters(row.otDate, dateFilter, customFromDate, customToDate)) {
        return false;
      }

      return true;
    });
  }, [rows, searchQuery, dateFilter, customFromDate, customToDate]);

  // Column Definitions
  const columns = [
    {
      id: 'actions',
      label: 'ACTIONS',
      minWidth: 90,
      frozen: true,
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Tooltip title="Edit Entry">
            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
              <IconEdit size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    },
    { id: 'index', label: 'NO', minWidth: 55, frozen: true, align: 'center' },
    { id: 'employeeCode', label: 'EMP CODE', minWidth: 110, align: 'center', render: (row) => row.employeeCode || row.empCode || '-' },
    {
      id: 'employeeName',
      label: 'EMPLOYEE NAME',
      bold: true,
      minWidth: 200,
      render: (row) => {
        const name = row.employeeName || 'N/A';
        const photo = row.employee?.employeePhotoUpload || row.employeePhotoUpload;
        const photoUrl = photo ? getPhotoUrl(photo) : null;
        return (
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Tooltip
              placement="right"
              arrow
              title={
                photoUrl ? (
                  <Box
                    component="img"
                    src={photoUrl}
                    alt={name}
                    sx={{ width: 120, height: 130, objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo</Typography>
                )
              }
            >
              <Avatar
                src={photoUrl}
                alt={name}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  border: '1.5px solid',
                  borderColor: 'primary.main'
                }}
              >
                {name.charAt(0)}
              </Avatar>
            </Tooltip>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {name}
            </Typography>
          </Stack>
        );
      }
    },
    {
      id: 'otDate',
      label: 'OT DATE',
      minWidth: 120,
      align: 'center',
      render: (row) => (row.otDate ? formatDate(row.otDate, dateFormat) : '-')
    },
    {
      id: 'durationFormatted',
      label: 'DURATION',
      minWidth: 110,
      align: 'center',
      render: (row) => {
        const mins = row.durationMinutes || 0;
        const hrs = Math.floor(mins / 60);
        const m = mins % 60;
        const text = `${String(hrs).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
        return <BOSStatusChip status={text} toneOverride="info" width={100} />;
      }
    },
    {
      id: 'durationMinutes',
      label: 'TOTAL MINUTES',
      minWidth: 130,
      align: 'center',
      render: (row) => `${row.durationMinutes || 0} Mins`
    },
    {
      id: 'verificationStatus',
      label: 'STATUS',
      minWidth: 150,
      align: 'center',
      render: (row) => <BOSStatusChip status={row.verificationStatus || row.statusName} width={140} />
    },
    { id: 'remarks', label: 'REMARKS', minWidth: 220, align: 'left', render: (row) => row.remarks || '-' }
  ];

  const totalMinutesCalc = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);

  return (
    <MainCard
      title="Overtime (OT) Details"
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            sx={btnNew}
            startIcon={<IconPlus size={16} />}
            onClick={handleOpenNew}
          >
            Add OT Entry
          </Button>
        </Stack>
      }
    >
      {/* Table Toolbar */}
      <BOSTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search Employee Name, Code, Remarks..."
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        dateFilterOptions={getCommonDateFilters()}
        customFromDate={customFromDate}
        onCustomFromDateChange={setCustomFromDate}
        customToDate={customToDate}
        onCustomToDateChange={setCustomToDate}
        scope={scope}
        onScopeChange={setScope}
        scopeOptions={['All', 'Mine', 'My Team']}
        onRefresh={fetchRows}
      />

      {/* Data Table */}
      <BOSDataTable
        id="ot_details_table"
        columns={columns}
        rows={filteredRows}
        loading={loading}
        onDoubleClickRow={handleOpenEdit}
        emptyMessage="No Overtime (OT) records found."
      />

      {/* Entry/Edit Form Dialog */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={formData.id ? 'Edit Overtime (OT) Entry' : 'Create Overtime (OT) Entry'}
        onSave={handleSave}
        saving={saving}
        maxWidth="sm"
      >
        <Stack spacing={2.5}>
          <BOSFormSection title="Employee Selection">
            <BOSEmployeeAutocomplete
              label="Select Employee *"
              value={formData.employeeId}
              onChange={(emp) => {
                setFormData((p) => ({ ...p, employeeId: emp ? emp.id || emp.employeeId : null }));
                if (errors.employeeId) clearErrors('employeeId');
              }}
              error={!!errors.employeeId}
              helperText={errors.employeeId}
            />
          </BOSFormSection>

          <BOSFormSection title="Overtime Details">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <BOSDatePicker
                  label="Overtime Date *"
                  value={formData.otDate}
                  onChange={(val) => {
                    setFormData((p) => ({ ...p, otDate: val }));
                    if (errors.otDate) clearErrors('otDate');
                  }}
                  error={!!errors.otDate}
                  helperText={errors.otDate}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BOSTextField
                    label="Hours"
                    type="number"
                    value={formData.hours}
                    onChange={(e) => setFormData((p) => ({ ...p, hours: Math.max(0, parseInt(e.target.value) || 0) }))}
                  />
                  <Typography variant="h4" sx={{ pt: 1 }}>:</Typography>
                  <BOSTextField
                    label="Mins"
                    type="number"
                    value={formData.minutes}
                    onChange={(e) => setFormData((p) => ({ ...p, minutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ p: 1.5, bgcolor: 'background.neutral', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Calculated Overtime Duration:
                  </Typography>
                  <Chip
                    label={`${String(formData.hours || 0).padStart(2, '0')}h ${String(formData.minutes || 0).padStart(2, '0')}m (${totalMinutesCalc} Minutes)`}
                    color={totalMinutesCalc > 0 ? 'primary' : 'default'}
                    sx={{ fontWeight: 700, fontSize: '13px' }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <BOSTextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Remarks / Work Details"
                  placeholder="Provide work reason or details..."
                  value={formData.remarks}
                  onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                />
              </Grid>
            </Grid>
          </BOSFormSection>
        </Stack>
      </BOSFormDialog>
    </MainCard>
  );
}
