import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Stack, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Button, Tabs, Tab, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { IconShieldCheck, IconFileText } from '@tabler/icons-react';
import Autocomplete from '@mui/material/Autocomplete';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable, BOSFormDialog, BOSTextField, BOSTableToolbar, BOSStatusField, errorStyle, btnCancel } from 'ui-component/bos';
import BOSExportButton from 'ui-component/bos/BOSExportButton';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig, setFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// Import Dashboards
import EmployeeSatisfactionDashboard from '../../hra/satisfaction/EmployeeSatisfactionDashboard';
import VendorSatisfactionDashboard from '../../hra/satisfaction/VendorSatisfactionDashboard';
import CustomerSatisfactionDashboard from '../../hra/satisfaction/CustomerSatisfactionDashboard';
import InternalCustomerSatisfactionDashboard from '../../hra/satisfaction/InternalCustomerSatisfactionDashboard';

// ==============================|| SATISFACTION CRITERIA MASTER ||============================== //

const INITIAL_STATE = {
  id: null,
  satisfactionType: [],
  satisfactionCriteria: '',
  status: true // true = Active, false = Inactive
};

const TYPE_OPTIONS = ['Employee', 'Vendor', 'Customer', 'Internal Customer'];

// Set to true for client demo with Manual Mode switch; set to false for production-ready Automatic-only view
const ENABLE_MANUAL_DEMO_MODE = false;

export default function SatisfactionCriteriaMaster() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [outerTab, setOuterTab] = useState(0); // 0 = Config, 1 = Customer, 2 = Internal Customer
  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [remindersMode, setRemindersMode] = useState('automatic'); // 'automatic' | 'manual'
  const [mappings, setMappings] = useState([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [editedValues, setEditedValues] = useState({});

  const fetchMappings = useCallback(async () => {
    setMappingsLoading(true);
    try {
      const response = await axios.get('/api/hra/employee-satisfaction/mappings');
      setMappings(response.data || []);
    } catch (error) {
      console.error('Failed to fetch mappings:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load mappings', variant: 'alert', severity: 'error' }));
    } finally {
      setMappingsLoading(false);
    }
  }, [dispatch]);

  const handleSendManualReminder = async (mappingId) => {
    try {
      const overrides = editedValues[mappingId] || {};
      await axios.post(`/api/hra/employee-satisfaction/manual-reminder/${mappingId}`, {
        employeeId: overrides.employeeId || null,
        email: overrides.email || null
      });
      dispatch(openSnackbar({ open: true, message: 'Email reminder sent successfully!', variant: 'alert', severity: 'success' }));
    } catch (error) {
      console.error('Failed to send email reminder:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to send email reminder', variant: 'alert', severity: 'error' }));
    }
  };

  useEffect(() => {
    if (remindersMode === 'manual') {
      fetchMappings();
    }
  }, [remindersMode, fetchMappings]);

  const { errors, clearErrors, setErrors } = useBOSValidation();

  // Pick pageCode dynamically based on current path to check proper authorization
  const currentPath = window.location.pathname;
  const pageCode = currentPath.includes('/hr/') ? PAGE_CODES.EMP_SATISFACTION : PAGE_CODES.CRM_SATISFACTION;
  const perms = usePagePermissions(pageCode);

  const searchQuery = useSelector((state) => state.search?.query || '');
  const globalFilters = useSelector((state) => state.search?.filters || {});

  const columns = useMemo(
    () => [
      { id: 'index', label: 'No', minWidth: 60 },
      { id: 'satisfactionType', label: 'Satisfaction Type', bold: true, color: 'primary.main', minWidth: 180 },
      {
        id: 'satisfactionCriteria',
        label: 'Satisfaction Criteria',
        minWidth: 400,
        render: (row) => (
          <span dangerouslySetInnerHTML={{ __html: row?.satisfactionCriteria || '' }} />
        )
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 120,
        status: true
      },
      { id: 'createdUser', label: 'Created By', minWidth: 120 },
      {
        id: 'createdDate',
        label: 'Created Date',
        minWidth: 180,
        render: (row) => (row.createdDate ? new Date(row.createdDate).toLocaleString() : '-')
      },
      { id: 'updatedUser', label: 'Updated By', minWidth: 120 },
      {
        id: 'updatedDate',
        label: 'Updated Date',
        minWidth: 180,
        render: (row) => (row.updatedDate ? new Date(row.updatedDate).toLocaleString() : '-')
      }
    ],
    []
  );

  // Configure Starred search filters (Search By & Status)
  useEffect(() => {
    let config = [];
    let defaultFilters = {};

    if (outerTab === 0) {
      const defaultSatTypeValue = currentPath.includes('/hr/')
        ? 'Employee'
        : (currentPath.includes('/crm/') || currentPath.includes('/customer'))
          ? 'Customer'
          : currentPath.includes('/internal-customer')
            ? 'Internal Customer'
            : 'ALL';

      config = [
        {
          id: 'satisfactionType',
          label: 'Satisfaction Type',
          type: 'select',
          isStarred: true,
          defaultValue: defaultSatTypeValue,
          options: [
            { value: 'ALL', label: 'ALL' },
            { value: 'Employee', label: 'Employee' },
            { value: 'Vendor', label: 'Vendor' },
            { value: 'Customer', label: 'Customer' },
            { value: 'Internal Customer', label: 'Internal Customer' }
          ]
        },
        {
          id: 'createdDate',
          label: 'Created Date',
          type: 'date',
          isStarred: true,
          defaultValue: ''
        },
        {
          id: 'status',
          label: 'Active/Inactive',
          type: 'select',
          isStarred: true,
          defaultValue: 'ALL',
          options: [
            { value: 'ALL', label: 'ALL' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' }
          ]
        }
      ];
      defaultFilters = {
        satisfactionType: defaultSatTypeValue,
        status: 'ALL',
        createdDate: '',
        createdDateStart: '',
        createdDateEnd: '',
        createdDateConsider: 'No'
      };
    } else {
      config = [
        {
          id: 'feedbackCycle',
          label: 'Feedback Cycle',
          type: 'select',
          isStarred: true,
          defaultValue: 'ALL',
          options: [
            { value: 'ALL', label: 'ALL' },
            { value: '2026-06', label: '2026-06' }
          ]
        },
        {
          id: 'status',
          label: 'Status',
          type: 'select',
          isStarred: true,
          defaultValue: 'ALL',
          options: [
            { value: 'ALL', label: 'ALL' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Overdue', label: 'Overdue' },
            { value: 'Closed', label: 'Closed' }
          ]
        }
      ];
      defaultFilters = {
        feedbackCycle: 'ALL',
        status: 'ALL'
      };
    }

    dispatch(setFilterConfig(config));
    dispatch(setFilters(defaultFilters));

    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, outerTab, currentPath]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/qms/satisfaction-criteria');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch satisfaction criteria:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load satisfaction criteria', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleOpenAdd = () => {
    const defaultType = currentPath.includes('/hr/')
      ? ['Employee']
      : (currentPath.includes('/crm/') || currentPath.includes('/customer'))
        ? ['Customer']
        : currentPath.includes('/internal-customer')
          ? ['Internal Customer']
          : ['Vendor'];
    setFormData({
      ...INITIAL_STATE,
      satisfactionType: defaultType
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setFormData({
      ...row,
      satisfactionType: row.satisfactionType ? row.satisfactionType.split(', ') : []
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) clearErrors(name);
  };


  const handleSave = async () => {
    if (saving) return;

    if (!formData.satisfactionType || formData.satisfactionType.length === 0) {
      setErrors((prev) => ({ ...prev, satisfactionType: 'Satisfaction Type is required.' }));
      return;
    }
    if (!formData.satisfactionCriteria?.trim()) {
      setErrors((prev) => ({ ...prev, satisfactionCriteria: 'Satisfaction Criteria is required.' }));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        satisfactionType: formData.satisfactionType.join(', ')
      };

      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdBy;
      delete payload.updatedBy;
      delete payload.createdUser;
      delete payload.updatedUser;
      delete payload.createdDate;
      delete payload.updatedDate;
      delete payload.index;

      if (formData.id) {
        await axios.put(`/api/qms/satisfaction-criteria/${formData.id}`, payload, { skipGlobalAlert: true });
        dispatch(
          openSnackbar({
            open: true,
            message: 'Satisfaction Criteria Updated Successfully',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success'
          })
        );
      } else {
        await axios.post('/api/qms/satisfaction-criteria', payload, { skipGlobalAlert: true });
        dispatch(
          openSnackbar({
            open: true,
            message: 'Satisfaction Criteria Saved Successfully',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success'
          })
        );
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg =
          typeof error === 'string' ? error : error.response?.data?.message || error.response?.data || 'Failed to save satisfaction criteria';
      dispatch(
        openSnackbar({
          open: true,
          message: msg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/qms/satisfaction-criteria/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Satisfaction Criteria Deleted Successfully', variant: 'alert', severity: 'success' }));
      setDeleteDialogOpen(false);
      fetchRows();
    } catch (error) {
      console.error('Failed to delete satisfaction criteria:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete record', variant: 'alert', severity: 'error' }));
    }
  };

  const resolvedRows = useMemo(() => {
    const statusFilter = globalFilters.status || 'ALL';
    const satTypeFilter = globalFilters.satisfactionType || 'ALL';
    const createdDateFilter = globalFilters.createdDate || '';
    const query = searchQuery?.toLowerCase().trim();

    return rows
      .filter((row) => {
        if (statusFilter !== 'ALL') {
          const isActive = row.status === true || row.status === 1 || String(row.status).toLowerCase() === 'true';
          if (statusFilter === 'ACTIVE' && !isActive) return false;
          if (statusFilter === 'INACTIVE' && isActive) return false;
        }

        if (satTypeFilter !== 'ALL') {
          const rowTypes = String(row.satisfactionType || '').split(', ').map(t => t.trim());
          if (!rowTypes.includes(satTypeFilter)) return false;
        }

        if (createdDateFilter) {
          if (!row.createdDate) return false;
          const d = new Date(row.createdDate);
          const rDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (rDate !== createdDateFilter) return false;
        }



        if (query) {
          const cleanCriteria = String(row.satisfactionCriteria || '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .toLowerCase();
          return (
            String(row.satisfactionType || '')
              .toLowerCase()
              .includes(query) ||
            cleanCriteria.includes(query) ||
            String(row.createdUser || row.createdBy || '')
              .toLowerCase()
              .includes(query)
          );
        }
        return true;
      })
      .map((r, i) => ({
        ...r,
        index: i + 1,
        createdUser: r.createdUser || r.createdBy || '-',
        updatedUser: r.updatedUser || r.updatedBy || '-'
      }));
  }, [rows, searchQuery, globalFilters]);

  return (
    <Box sx={{ width: '100%' }}>


      {/* Tab Panels */}
      {outerTab === 0 && (
        <MainCard
          fullWidth
          title={
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconShieldCheck size={24} />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block', mb: 0.2 }}>
                  Home / HR Transactions / Performance Masters
                </Typography>
                <Typography variant="h3">Satisfaction Criteria</Typography>
              </Box>
            </Stack>
          }
          secondary={
            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Modern glassmorphic Manual / Automatic Toggle */}
              {ENABLE_MANUAL_DEMO_MODE && (
                <Box
                  onClick={() => setRemindersMode((prev) => (prev === 'automatic' ? 'manual' : 'automatic'))}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(15, 23, 42, 0.08)',
                    WebkitBackdropFilter: 'blur(8px)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '20px',
                    p: '3px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    position: 'relative',
                    height: 38,
                    width: 170,
                    cursor: 'pointer',
                    userSelect: 'none',
                    boxShadow: remindersMode === 'automatic'
                      ? '0 0 10px rgba(99, 102, 241, 0.15)'
                      : '0 0 10px rgba(245, 158, 11, 0.15)',
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 3,
                      bottom: 3,
                      left: remindersMode === 'automatic' ? 3 : '50%',
                      width: 'calc(50% - 3px)',
                      borderRadius: '17px',
                      bgcolor: remindersMode === 'automatic' ? '#6366f1' : '#f59e0b',
                      boxShadow: remindersMode === 'automatic'
                        ? '0 0 8px rgba(99, 102, 241, 0.5)'
                        : '0 0 8px rgba(245, 158, 11, 0.5)',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      zIndex: 1
                    }}
                  />
                  <Box
                    sx={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: remindersMode === 'automatic' ? '#fff' : 'text.secondary',
                      zIndex: 2,
                      transition: 'color 0.2s ease'
                    }}
                  >
                    Automatic
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: remindersMode === 'manual' ? '#fff' : 'text.secondary',
                      zIndex: 2,
                      transition: 'color 0.2s ease'
                    }}
                  >
                    Manual
                  </Box>
                </Box>
              )}

              <BOSExportButton
                data={resolvedRows}
                filename="Satisfaction_Criteria"
                columns={columns}
                variant="contained"
                color="primary"
                disabled={!resolvedRows || resolvedRows.length === 0}
                sx={{
                  borderRadius: '8px',
                  bgcolor: '#1976d2',
                  color: '#fff',
                  fontWeight: 700,
                  textTransform: 'none',
                  height: 38,
                  px: 2.5,
                  '&:hover': {
                    bgcolor: '#115293'
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#f1f5f9',
                    color: '#94a3b8',
                    border: '1px solid #cbd5e1'
                  }
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(currentPath.includes('/hr/') ? '/master/hr/satisfaction/feedback-entry' : '/master/sales/crm/satisfaction/feedback-entry')}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 700,
                  height: 38,
                  px: 2.5,
                  bgcolor: '#1976d2',
                  '&:hover': {
                    bgcolor: '#115293'
                  }
                }}
              >
                Feedback Entry
              </Button>
              <BOSTableToolbar
                onRefresh={fetchRows}
                onNew={handleOpenAdd}
                newLabel="+ New"
                hasWritePermission={perms.write}
                columns={columns}
              />
            </Stack>
          }
        >
          {ENABLE_MANUAL_DEMO_MODE && remindersMode === 'manual' ? (
            <TableContainer
              component={Box}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                mt: 1,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
              }}
            >
              {mappingsLoading ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>Loading mappings...</Box>
              ) : mappings.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>No mappings found.</Box>
              ) : (
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Employee ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Created By</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Updated By</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Updated Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mappings.map((row) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.01)' },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <TableCell>
                          <Stack spacing={0.5}>
                            <input
                              type="text"
                              value={editedValues[row.id]?.employeeId ?? row.employeeId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditedValues((prev) => ({
                                  ...prev,
                                  [row.id]: {
                                    ...prev[row.id],
                                    employeeId: val,
                                    email: prev[row.id]?.email ?? row.email
                                  }
                                }));
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                                outline: 'none',
                                fontSize: '0.875rem',
                                color: 'inherit',
                                width: '130px',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                transition: 'all 0.3s ease'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderBottom = '1px solid #f59e0b';
                                e.target.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.2)';
                                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderBottom = '1px solid rgba(0, 0, 0, 0.12)';
                                e.target.style.boxShadow = 'none';
                                e.target.style.backgroundColor = 'transparent';
                              }}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', pl: 0.75 }}>
                              {row.employeeName}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            value={editedValues[row.id]?.email ?? row.email}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedValues((prev) => ({
                                ...prev,
                                [row.id]: {
                                  ...prev[row.id],
                                  employeeId: prev[row.id]?.employeeId ?? row.employeeId,
                                  email: val
                                }
                              }));
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                              outline: 'none',
                              fontSize: '0.875rem',
                              color: 'inherit',
                              width: '220px',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderBottom = '1px solid #f59e0b';
                              e.target.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.2)';
                              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderBottom = '1px solid rgba(0, 0, 0, 0.12)';
                              e.target.style.boxShadow = 'none';
                              e.target.style.backgroundColor = 'transparent';
                            }}
                          />
                        </TableCell>
                        <TableCell>{row.createdBy || 'N/A'}</TableCell>
                        <TableCell>{row.createdDate || 'N/A'}</TableCell>
                        <TableCell>{row.updatedBy || 'N/A'}</TableCell>
                        <TableCell>{row.updatedDate || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            color={row.status === 'Completed' ? 'inherit' : 'primary'}
                            disabled={row.status === 'Completed'}
                            onClick={() => handleSendManualReminder(row.id)}
                            sx={{
                              textTransform: 'none',
                              borderRadius: '6px',
                              fontWeight: 650,
                              px: 2,
                              boxShadow: row.status === 'Completed' ? 'none' : '0 2px 8px rgba(33, 150, 243, 0.25)',
                              '&:hover': {
                                boxShadow: row.status === 'Completed' ? 'none' : '0 4px 12px rgba(33, 150, 243, 0.4)'
                              }
                            }}
                          >
                            {row.status === 'Completed' ? 'Completed' : 'Send'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          ) : (
            <BOSDataTable
              id="SatisfactionCriteriaTable"
              columns={columns}
              rows={resolvedRows}
              loading={loading}
              onEditRow={perms.write ? handleOpenEdit : undefined}
              onDeleteRow={handleDelete}
              onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
            />
          )}

          <BOSFormDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title="SATISFACTION CRITERIA"
            fullWidth
            maxWidth="sm"
            onSave={handleSave}
            onClear={() => {
              setFormData({
                ...INITIAL_STATE,
                satisfactionType: currentPath.includes('/hr/')
                  ? ['Employee']
                  : (currentPath.includes('/crm/') || currentPath.includes('/customer'))
                    ? ['Customer']
                    : currentPath.includes('/internal-customer')
                      ? ['Internal Customer']
                      : ['Vendor']
              });
              setErrors({});
            }}
            secondaryActions={
              <Button
                variant="contained"
                onClick={() => setDialogOpen(false)}
                sx={btnCancel}
              >
                Cancel
              </Button>
            }
            hasId={!!formData.id}
            onDelete={() => {
              setDeleteTarget(formData);
              setDeleteDialogOpen(true);
            }}
          >
            <Stack spacing={2.5} sx={{ mt: 1.5 }}>
              <Autocomplete
                multiple
                options={TYPE_OPTIONS}
                getOptionLabel={(option) => option}
                value={formData.satisfactionType || []}
                onChange={(event, newValue) => {
                  setFormData((prev) => ({ ...prev, satisfactionType: newValue }));
                  if (errors.satisfactionType) setErrors((prev) => ({ ...prev, satisfactionType: '' }));
                }}
                renderInput={(params) => (
                  <BOSTextField
                    {...params}
                    label="SATISFACTION TYPE"
                    required
                    error={!!errors.satisfactionType}
                    helperText={errors.satisfactionType || 'Select satisfaction type(s)'}
                   sx={errorStyle(!!errors.satisfactionType)} />
                )}
                sx={{ '& .MuiAutocomplete-tag': { bgcolor: 'primary.light', color: 'primary.main', fontWeight: 600, height: 24 } }}
              />

              <BOSTextField
                name="satisfactionCriteria"
                label="SATISFACTION CRITERIA"
                placeholder="Enter satisfaction criteria details..."
                value={formData.satisfactionCriteria}
                onChange={handleInputChange}
                multiline
                rows={5}
                required
                fullWidth
                preserveHtml
                error={!!errors.satisfactionCriteria}
                helperText={errors.satisfactionCriteria}
               sx={errorStyle(!!errors.satisfactionCriteria)} />

              <BOSStatusField
                isCreate={!formData.id}
                type="boolean"
                value={formData.status}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, status: e.target.value }));
                  if (errors.status) clearErrors('status');
                }}
                error={!!errors.status}
                helperText={errors.status}
               sx={errorStyle(!!errors.status)} />
            </Stack>
          </BOSFormDialog>

          <ConfirmDeleteDialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={confirmDelete}
            title="Delete Satisfaction Criteria"
            message="Are you sure you want to completely remove this satisfaction criteria?"
            itemName={deleteTarget?.satisfactionType}
          />
        </MainCard>
      )}

      {outerTab === 1 && <CustomerSatisfactionDashboard />}
      {outerTab === 2 && <InternalCustomerSatisfactionDashboard />}
    </Box>
  );
}