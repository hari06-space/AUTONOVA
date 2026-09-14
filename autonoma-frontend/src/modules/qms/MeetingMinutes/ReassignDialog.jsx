import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Stack, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { BOSFormDialog, BOSEmployeeAutocomplete, BOSDatePicker, BOSTextField } from 'ui-component/bos';
import useLookups from 'hooks/useLookups';
import useAuth from 'hooks/useAuth';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { sanitizeHTML } from 'utils/sanitize';

const ReassignDialog = ({ open, onClose, item, onConfirm }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { employees = [] } = useLookups(['EMPLOYEES']);
  const [selectedRows, setSelectedRows] = useState([]);
  const [assignBy, setAssignBy] = useState(null);
  const [assignTo, setAssignTo] = useState(null);
  const [targetDate, setTargetDate] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hrEmployees, setHrEmployees] = useState([]);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const fetchHrEmployees = async () => {
      try {
        const res = await axios.get('/api/master/hr/employees');
        const list = Array.isArray(res.data) ? res.data : [];
        const activeOnly = list.filter(emp => {
          if (!emp) return false;
          const statusStr = String(emp.status || emp.empStatus || emp.workingStatus || '').toUpperCase().trim();
          const isLeft = emp.isLeft === true ||
            emp.isLeft === 1 ||
            String(emp.isLeft).toLowerCase() === 'true' ||
            Boolean(emp.leftDate) ||
            statusStr.includes('LEFT') ||
            statusStr.includes('RESIGN') ||
            statusStr.includes('RELIEV');
          if (isLeft) return false;
          const isActive = statusStr === '' || statusStr === 'ACTIVE' || statusStr === '1' || statusStr === 'TRUE';
          return isActive;
        });
        setHrEmployees(activeOnly);
      } catch (err) {
        const activeFallback = (employees || []).filter(emp => {
          const statusStr = String(emp.status || emp.empStatus || emp.workingStatus || '').toUpperCase().trim();
          return !statusStr.includes('LEFT') && (statusStr === '' || statusStr === 'ACTIVE');
        });
        setHrEmployees(activeFallback);
      }
    };
    fetchHrEmployees();
  }, [employees]);

  useEffect(() => {
    if (open && !wasOpenRef.current && item) {
      wasOpenRef.current = true;
      const mom = item._mom;
      let loadedDetails = [];
      if (mom && mom.details) {
        loadedDetails = mom.details.filter(d => d.processType === 'ACTION' && d.status !== 'CLOSED' && d.status !== 'CANCELLED');
      } else if (item.discussedPoint || item.id) {
        loadedDetails = [item];
      }

      const hasSelectedIds = Array.isArray(item.selectedIds) && item.selectedIds.length > 0;
      if (hasSelectedIds) {
        loadedDetails = loadedDetails.filter(d => item.selectedIds.includes(d.id));
        setSelectedRows(item.selectedIds);
      } else {
        setSelectedRows([]);
      }

      setDetails(loadedDetails);
      setAssignBy(null);
      setAssignTo(item.assignedTo || null);
      setTargetDate(item.targetDate || '');
      setReason('');
      setIsSubmitting(false);
    } else if (!open) {
      wasOpenRef.current = false;
    }
  }, [open, item]);

  const handleConfirm = async () => {
    if (!selectedRows || selectedRows.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'Please select at least one action item to reassign.', variant: 'alert', severity: 'warning' }));
      return;
    }

    // At least one change (Assign By OR Assign To) is required
    if (!assignBy && !assignTo) {
      dispatch(openSnackbar({ open: true, message: 'Please select Assign By or Assign To to update', variant: 'alert', severity: 'warning' }));
      return;
    }

    // If Assign To is selected, Target Date is mandatory
    if (assignTo && !targetDate) {
      dispatch(openSnackbar({ open: true, message: 'Target Date is required when Assign To is selected', variant: 'alert', severity: 'warning' }));
      return;
    }

    // Reassign Reason is always mandatory
    if (!reason || !reason.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Please enter Reassign Reason', variant: 'alert', severity: 'warning' }));
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const assignByIdVal = assignBy ? (assignBy.id || assignBy.empId || assignBy.employeeId) : null;
      const assignByNameVal = assignBy ? (assignBy.employeeName || assignBy.name || '') : null;
      const assignToIdVal = assignTo ? (assignTo.id || assignTo.empId || assignTo.employeeId) : null;
      const assignToNameVal = assignTo ? (assignTo.employeeName || assignTo.name || '') : null;

      const payload = {
        detailIds: selectedRows,
        assignById: assignByIdVal,
        assignByName: assignByNameVal,
        assignToId: assignToIdVal,
        assignToName: assignToNameVal,
        targetDate: targetDate || null,
        reassignComments: reason.trim()
      };

      await axios.put(`${API_PATHS.QMS.MOMS}/reassign`, payload);

      dispatch(openSnackbar({
        open: true,
        message: 'Action point(s) reassigned successfully!',
        variant: 'alert',
        severity: 'success'
      }));

      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to reassign action points';
      dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onSave={handleConfirm}
      title={`Reassign Selected MOM Items (${selectedRows.length})`}
      saveLabel="Reassign"
      saveBtnProps={{ color: 'warning', sx: { fontWeight: 700 } }}
      isSubmitting={isSubmitting}
      maxWidth="md"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: '30vh', overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 800, width: '50px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>SL NO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, width: '120px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>MIN NO</TableCell>
                <TableCell align="left" sx={{ fontWeight: 800, minWidth: '220px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>DISCUSSED POINT</TableCell>
                <TableCell align="left" sx={{ fontWeight: 800, width: '130px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>ASSIGNED BY</TableCell>
                <TableCell align="left" sx={{ fontWeight: 800, width: '130px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>ASSIGNED TO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, width: '100px', bgcolor: 'grey.100', position: 'sticky', top: 0, zIndex: 1 }}>TARGET DATE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {details.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">No items selected</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                details.map((d, idx) => (
                  <TableRow key={d.id || idx} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' } }}>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>{d.minNo || d.meetNo || item?.minNo || item?.meetNo || item?._momNo || '-'}</TableCell>
                    <TableCell align="left">
                      <Typography
                        variant="body2"
                        sx={{ fontSize: '0.75rem', whiteSpace: 'normal', wordBreak: 'break-word' }}
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(d.discussedPoint || '-') }}
                      />
                    </TableCell>
                    <TableCell align="left" sx={{ fontSize: '0.75rem' }}>{d.assignedBy?.employeeName || '-'}</TableCell>
                    <TableCell align="left" sx={{ fontSize: '0.75rem' }}>{d.assignedTo?.employeeName || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.72rem' }}>
                      {d.targetDate ? d.targetDate.split('-').reverse().join('/') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" sx={{ mt: 1 }}>
          <BOSEmployeeAutocomplete
            options={hrEmployees.length > 0 ? hrEmployees : employees}
            value={assignBy}
            onChange={(val) => setAssignBy(val)}
            label="Assign By"
            placeholder="Select Assign By"
            sx={{ flex: 1 }}
          />
          <BOSEmployeeAutocomplete
            options={hrEmployees.length > 0 ? hrEmployees : employees}
            value={assignTo}
            onChange={(val) => setAssignTo(val)}
            label="Assign To"
            placeholder="Select Assignee"
            required={Boolean(assignTo)}
            sx={{ flex: 1 }}
          />
          <BOSDatePicker
            name="targetDate"
            label="Target Date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            minDate={new Date()}
            disablePast
            disableSundays
            blockHolidays
            required={Boolean(assignTo)}
            sx={{ flex: 1 }}
          />
        </Stack>

        <BOSTextField
          label="Reassign Reason"
          placeholder="Enter reason for reassignment (mandatory)..."
          multiline
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          fullWidth
          error={!reason || !reason.trim()}
          helperText={(!reason || !reason.trim()) ? "Reassign reason is mandatory" : ""}
        />
      </Stack>
    </BOSFormDialog>
  );
};

ReassignDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  item: PropTypes.object,
  onConfirm: PropTypes.func
};

export default ReassignDialog;
