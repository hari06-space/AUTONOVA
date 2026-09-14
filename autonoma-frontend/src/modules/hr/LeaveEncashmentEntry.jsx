import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  MenuItem,
  Box,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputBase,
  Select,
  FormControl
} from '@mui/material';
import {
  IconPlus,
  IconSearch,
  IconX,
  IconSend,
  IconEraser,
  IconDeviceFloppy,
  IconChevronLeft
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import {
  BOSDataTable
} from 'ui-component/bos';
import { useLookups } from 'hooks/useLookups';
import usePagePermissions from 'hooks/usePagePermissions';

const INITIAL_FORM = {
  employeeId: '',
  fromDate: '',
  toDate: '',
  el: 0,
  cl: 0,
  prevYrsEl: 0,
  prevYrsCl: 0,
  totalEl: 0,
  totalCl: 0,
  encashEl: 0,
  encashCl: 0,
  totalLeaveEncash: 0,
  totalAmt: 0
};

const INITIAL_FILTER = {
  employeeName: '',
  employeeCode: '',
  fromDate: '',
  toDate: '',
  status: ''
};

// Shared input style matching the reference design
const filterInputSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '2px',
  px: 1,
  py: '3px',
  fontSize: '12px',
  bgcolor: 'background.paper',
  color: 'text.primary',
  height: 26,
  minWidth: 110
};

// Form field label style
const fieldLabel = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'text.primary',
  textAlign: 'right',
  pr: 1,
  whiteSpace: 'nowrap'
};

// Form input style
const formInputSx = {
  border: '1px solid',
  borderColor: 'primary.light',
  borderRadius: '2px',
  px: 1,
  py: '4px',
  fontSize: '13px',
  bgcolor: 'background.paper',
  color: 'text.primary',
  width: '100%'
};

export default function LeaveEncashmentEntry() {
  const dispatch = useDispatch();
  const perms = usePagePermissions('M2391');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState(INITIAL_FILTER);
  const [appliedFilter, setAppliedFilter] = useState(INITIAL_FILTER);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const lookups = useLookups(['EMPLOYEES']);

  // Auto-recalculate totals
  useEffect(() => {
    const el = parseFloat(formValues.el) || 0;
    const cl = parseFloat(formValues.cl) || 0;
    const prevEl = parseFloat(formValues.prevYrsEl) || 0;
    const prevCl = parseFloat(formValues.prevYrsCl) || 0;
    const encashEl = parseFloat(formValues.encashEl) || 0;
    const encashCl = parseFloat(formValues.encashCl) || 0;
    const totalEl = el + prevEl;
    const totalCl = cl + prevCl;
    const totalLeaveEncash = encashEl + encashCl;
    if (totalEl !== formValues.totalEl || totalCl !== formValues.totalCl || totalLeaveEncash !== formValues.totalLeaveEncash) {
      setFormValues(prev => ({ ...prev, totalEl, totalCl, totalLeaveEncash }));
    }
  }, [formValues.el, formValues.cl, formValues.prevYrsEl, formValues.prevYrsCl, formValues.encashEl, formValues.encashCl,
      formValues.totalEl, formValues.totalCl, formValues.totalLeaveEncash]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (appliedFilter.status && appliedFilter.status !== 'ALL') params.status = appliedFilter.status;
      if (appliedFilter.employeeName) params.employeeName = appliedFilter.employeeName;
      if (appliedFilter.employeeCode) params.employeeCode = appliedFilter.employeeCode;
      if (appliedFilter.fromDate) params.fromDate = appliedFilter.fromDate;
      if (appliedFilter.toDate) params.toDate = appliedFilter.toDate;
      const res = await axios.get('/api/hr/leave-encashment', { params });
      setData(Array.isArray(res.data) ? res.data : res.data?.content || []);
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({ open: true, message: 'Error fetching data', variant: 'alert', alert: { color: 'error' } }));
    } finally {
      setLoading(false);
    }
  }, [appliedFilter, dispatch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => setAppliedFilter({ ...filter });

  const handleFilterChange = (field, value) => setFilter(prev => ({ ...prev, [field]: value }));

  const handleOpenDialog = (row = null) => {
    setEditingData(row);
    setFormValues(row ? { ...row, employeeId: row.employeeId || '' } : INITIAL_FORM);
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingData(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formValues.employeeId) newErrors.employeeId = 'Employee is required';
    if (!formValues.fromDate) newErrors.fromDate = 'From Date is required';
    if (!formValues.toDate) newErrors.toDate = 'To Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      const payload = { ...formValues };
      if (editingData?.id) {
        await axios.put(`/api/hr/leave-encashment/${editingData.id}`, payload);
      } else {
        await axios.post('/api/hr/leave-encashment/save', payload);
      }
      dispatch(openSnackbar({ open: true, message: 'Saved successfully', variant: 'alert', alert: { color: 'success' } }));
      handleCloseDialog();
      fetchData();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'Error saving', variant: 'alert', alert: { color: 'error' } }));
    }
  };

  const handleSubmitApproval = async () => {
    if (!validate()) return;
    try {
      const payload = { ...formValues };
      let id = editingData?.id;
      if (!id) {
        const res = await axios.post('/api/hr/leave-encashment/save', payload);
        id = res.data?.data?.id || res.data?.id;
      }
      if (id) await axios.post(`/api/hr/leave-encashment/${id}/submit`);
      dispatch(openSnackbar({ open: true, message: 'Submitted for approval', variant: 'alert', alert: { color: 'success' } }));
      handleCloseDialog();
      fetchData();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'Error submitting', variant: 'alert', alert: { color: 'error' } }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await axios.delete(`/api/hr/leave-encashment/${deletingId}`);
      dispatch(openSnackbar({ open: true, message: 'Deleted successfully', variant: 'alert', alert: { color: 'success' } }));
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: 'Error deleting', variant: 'alert', alert: { color: 'error' } }));
    }
  };

  const selectedEmployee = useMemo(
    () => lookups.employees?.find(e => e.id === formValues.employeeId || String(e.id) === String(formValues.employeeId)),
    [lookups.employees, formValues.employeeId]
  );

  const columns = useMemo(() => [
    { field: 'id', headerName: 'Sl.No', width: 70 },
    {
      field: 'employeeName',
      headerName: 'Emp Name',
      flex: 1,
      renderCell: (params) => params.row?.employee?.employeeName || params.row?.employee?.firstName || '-'
    },
    { field: 'el', headerName: 'EL', width: 80 },
    { field: 'cl', headerName: 'CL', width: 80 },
    { field: 'prevYrsEl', headerName: 'Prev Yrs EL', width: 110 },
    { field: 'prevYrsCl', headerName: 'Prev Yrs CL', width: 110 },
    { field: 'totalEl', headerName: 'Tot.EL', width: 90 },
    { field: 'totalCl', headerName: 'Tot.CL', width: 90 },
    { field: 'encashEl', headerName: 'Encash.EL', width: 100 },
    { field: 'encashCl', headerName: 'Encash.CL', width: 100 },
    { field: 'totalLeaveEncash', headerName: 'Tot.Leave.Encash', width: 140 },
    { field: 'totalAmt', headerName: 'Tot.Amt', width: 100 },
    { field: 'status', headerName: 'Status', width: 120 }
  ], []);

  return (
    <MainCard
      content={false}
      title={
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            Leave Encashment Request
          </Typography>
          {perms.write && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<IconPlus size={16} />}
              onClick={() => handleOpenDialog(null)}
              sx={{ fontWeight: 600, px: 2, py: 0.8, fontSize: '13px' }}
            >
              Leave Encash Apply
            </Button>
          )}
        </Stack>
      }
    >
      {/* ── Inline Filter Row ─────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap'
        }}
      >
        {/* Employee Name */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography sx={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', color: 'text.primary' }}>Employee Name :</Typography>
          <InputBase
            value={filter.employeeName}
            onChange={e => handleFilterChange('employeeName', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            sx={{ ...filterInputSx, minWidth: 130 }}
            inputProps={{ style: { padding: 0, fontSize: '12px' } }}
          />
        </Stack>

        {/* Employee Code */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography sx={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', color: 'text.primary' }}>Employee Code :</Typography>
          <InputBase
            value={filter.employeeCode}
            onChange={e => handleFilterChange('employeeCode', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            sx={{ ...filterInputSx, minWidth: 100 }}
            inputProps={{ style: { padding: 0, fontSize: '12px' } }}
          />
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        {/* From Date */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography sx={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', color: 'text.primary' }}>From Date</Typography>
          <InputBase
            type="date"
            value={filter.fromDate}
            onChange={e => handleFilterChange('fromDate', e.target.value)}
            sx={{ ...filterInputSx, minWidth: 120 }}
            inputProps={{ style: { padding: 0, fontSize: '12px' } }}
          />
        </Stack>

        {/* To Date */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography sx={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', color: 'text.primary' }}>To Date</Typography>
          <InputBase
            type="date"
            value={filter.toDate}
            onChange={e => handleFilterChange('toDate', e.target.value)}
            sx={{ ...filterInputSx, minWidth: 120 }}
            inputProps={{ style: { padding: 0, fontSize: '12px' } }}
          />
        </Stack>

        {/* Status */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography sx={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', color: 'text.primary' }}>Status :</Typography>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select
              value={filter.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              displayEmpty
              sx={{
                fontSize: '12px',
                height: 26,
                '.MuiOutlinedInput-notchedOutline': { borderRadius: '2px', borderColor: 'divider' },
                '.MuiSelect-select': { py: '3px', px: 1, fontSize: '12px' }
              }}
            >
              <MenuItem value="" sx={{ fontSize: '12px' }}>-Select-</MenuItem>
              <MenuItem value="Pending" sx={{ fontSize: '12px' }}>Pending</MenuItem>
              <MenuItem value="Pending Approval" sx={{ fontSize: '12px' }}>Pending Approval</MenuItem>
              <MenuItem value="Approved" sx={{ fontSize: '12px' }}>Approved</MenuItem>
              <MenuItem value="Rejected" sx={{ fontSize: '12px' }}>Rejected</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Search button */}
        <IconButton
          onClick={handleSearch}
          size="small"
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            borderRadius: '4px',
            width: 28,
            height: 28,
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          <IconSearch size={16} />
        </IconButton>
      </Box>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <BOSDataTable
        id="hr_leave_encashment_table"
        columns={columns}
        rows={data}
        loading={loading}
        onEditRow={perms.write ? handleOpenDialog : null}
        onDeleteRow={perms.delete ? (row) => { setDeletingId(row.id); setDeleteDialogOpen(true); } : null}
      />

      {/* ── Leave Form Popup ─────────────────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '4px', overflow: 'hidden' }
        }}
      >
        {/* Dialog Header */}
        <DialogTitle
          sx={{
            bgcolor: '#546e7a',
            color: '#fff',
            py: 1.5,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 700,
            fontSize: '15px'
          }}
        >
          Leave Form
          <IconButton
            onClick={handleCloseDialog}
            size="small"
            sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            <IconX size={18} />
          </IconButton>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Row 1: Employee Name | Employee Code */}
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>Employee Name :</Typography>
                <select
                  name="employeeId"
                  value={formValues.employeeId}
                  onChange={handleFormChange}
                  style={{
                    ...formInputSx,
                    border: `1px solid ${errors.employeeId ? '#f44336' : '#90caf9'}`,
                    padding: '4px 8px',
                    background: 'inherit',
                    color: 'inherit',
                    borderRadius: '2px',
                    fontSize: '13px',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-Select-</option>
                  {lookups.employees?.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeName || emp.firstName}
                    </option>
                  ))}
                </select>
              </Stack>
              {errors.employeeId && <Typography sx={{ color: 'error.main', fontSize: '11px', mt: 0.3, ml: '120px' }}>{errors.employeeId}</Typography>}
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>Employee Code :</Typography>
                <InputBase
                  readOnly
                  value={selectedEmployee?.empCode || ''}
                  sx={{ ...formInputSx, bgcolor: 'action.hover' }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>

            {/* Row 2: From Date | To Date */}
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>From Date :</Typography>
                <InputBase
                  type="date"
                  name="fromDate"
                  value={formValues.fromDate}
                  onChange={handleFormChange}
                  sx={{ ...formInputSx, border: `1px solid ${errors.fromDate ? '#f44336' : '#90caf9'}` }}
                  inputProps={{ style: { padding: 0, fontSize: '13px' } }}
                />
              </Stack>
              {errors.fromDate && <Typography sx={{ color: 'error.main', fontSize: '11px', mt: 0.3, ml: '120px' }}>{errors.fromDate}</Typography>}
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>To Date :</Typography>
                <InputBase
                  type="date"
                  name="toDate"
                  value={formValues.toDate}
                  onChange={handleFormChange}
                  sx={{ ...formInputSx, border: `1px solid ${errors.toDate ? '#f44336' : '#90caf9'}` }}
                  inputProps={{ style: { padding: 0, fontSize: '13px' } }}
                />
              </Stack>
              {errors.toDate && <Typography sx={{ color: 'error.main', fontSize: '11px', mt: 0.3, ml: '120px' }}>{errors.toDate}</Typography>}
            </Grid>

            {/* Row 3: EL | Total EL */}
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>EL :</Typography>
                <InputBase
                  type="number"
                  name="el"
                  value={formValues.el}
                  onChange={handleFormChange}
                  sx={{ ...formInputSx }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>Total EL :</Typography>
                <InputBase
                  readOnly
                  value={formValues.totalEl}
                  sx={{ ...formInputSx, bgcolor: 'action.hover' }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>

            {/* Row 4: CL | Total CL */}
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>CL :</Typography>
                <InputBase
                  type="number"
                  name="cl"
                  value={formValues.cl}
                  onChange={handleFormChange}
                  sx={{ ...formInputSx }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>Total CL :</Typography>
                <InputBase
                  readOnly
                  value={formValues.totalCl}
                  sx={{ ...formInputSx, bgcolor: 'action.hover' }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>

            {/* Row 5: Pre Yrs EL | Encash EL */}
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>Pre Yrs EL :</Typography>
                <InputBase
                  type="number"
                  name="prevYrsEl"
                  value={formValues.prevYrsEl}
                  onChange={handleFormChange}
                  sx={{ ...formInputSx }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>Encash EL :</Typography>
                <InputBase
                  type="number"
                  name="encashEl"
                  value={formValues.encashEl}
                  onChange={handleFormChange}
                  sx={{ ...formInputSx }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>

            {/* Row 6: Prev Yrs CL | Encash CL */}
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>Prev Yrs CL :</Typography>
                <InputBase
                  type="number"
                  name="prevYrsCl"
                  value={formValues.prevYrsCl}
                  onChange={handleFormChange}
                  sx={{ ...formInputSx }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>Encash CL :</Typography>
                <InputBase
                  type="number"
                  name="encashCl"
                  value={formValues.encashCl}
                  onChange={handleFormChange}
                  sx={{ ...formInputSx }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>

            {/* Row 7: Total Leave Encash | Total Amt */}
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>Total Leave Encash :</Typography>
                <InputBase
                  readOnly
                  value={formValues.totalLeaveEncash}
                  sx={{ ...formInputSx, bgcolor: 'action.hover' }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center">
                <Typography sx={{ ...fieldLabel, minWidth: 120 }}>Total Amt :</Typography>
                <InputBase
                  type="number"
                  name="totalAmt"
                  value={formValues.totalAmt}
                  onChange={handleFormChange}
                  sx={{ ...formInputSx }}
                  inputProps={{ style: { padding: 0, fontSize: '13px', textAlign: 'center' } }}
                />
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            justifyContent: 'space-between',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          {/* Left: Back */}
          <Button
            variant="contained"
            startIcon={<IconChevronLeft size={16} />}
            onClick={handleCloseDialog}
            sx={{
              bgcolor: '#546e7a',
              color: '#fff',
              borderRadius: '3px',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'none',
              '&:hover': { bgcolor: '#455a64' }
            }}
          >
            Back
          </Button>

          {/* Right: Send For Approval + Clear + Save */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<IconSend size={16} />}
              onClick={handleSubmitApproval}
              sx={{
                bgcolor: '#546e7a',
                color: '#fff',
                borderRadius: '3px',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#455a64' }
              }}
            >
              Send For Approval
            </Button>
            <Button
              variant="contained"
              startIcon={<IconEraser size={16} />}
              onClick={() => { setFormValues(INITIAL_FORM); setErrors({}); }}
              sx={{
                bgcolor: '#546e7a',
                color: '#fff',
                borderRadius: '3px',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#455a64' }
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
              sx={{
                bgcolor: '#546e7a',
                color: '#fff',
                borderRadius: '3px',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#455a64' }
              }}
            >
              Save
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Leave Encashment"
        content="Are you sure you want to delete this leave encashment entry?"
      />
    </MainCard>
  );
}
