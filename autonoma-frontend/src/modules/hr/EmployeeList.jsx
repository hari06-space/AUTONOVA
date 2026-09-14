import TextField from 'ui-component/CustomTextField';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Stack, Tooltip, IconButton, Grid, Autocomplete, Box, Avatar, MenuItem, Checkbox } from '@mui/material';
import { IconFileDownload, IconRefresh, IconUsers, IconUser, IconUserCheck, IconShieldCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { formatDateTime, formatDate } from 'utils/BOSTimeUtils';
import MainCard from 'ui-component/cards/MainCard';
import { exportToExcel } from 'utils/excelExport';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSPageHeader, BOSDataTable, BOSFormSection, BOSFormDialog, getPhotoUrl, btnSave, btnCancel, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import { useLookups } from 'hooks/useLookups';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';

// ==============================|| EMPLOYEE MASTER LIST (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: 'Sno', minWidth: 50, width: 60, frozen: true },
  { id: 'photo', label: 'PHOTO', minWidth: 80, width: 80, align: 'center', frozen: true },
  { id: 'empCode', label: 'Emp Code', required: true, minWidth: 120, width: 130, frozen: true },
  { id: 'employeeName', label: 'Employee Name', minWidth: 160, width: 180, frozen: true },
  { id: 'designationId', label: 'Designation', minWidth: 150 },
  { id: 'departmentId', label: 'Department', required: true, minWidth: 150 },
  { id: 'dateOfJoining', label: 'Date of Join', minWidth: 120 },
  { id: 'dob', label: 'Birth Date', minWidth: 120 },
  { id: 'personalEmail', label: 'Personal Mail Id', minWidth: 180 },
  { id: 'homeManagerName', label: 'Home Manager', minWidth: 150 },
  { id: 'hrName', label: 'HR Manager', minWidth: 150 },
  { id: 'businessManagerName', label: 'Business Manager', minWidth: 150 },
  { id: 'verticalHeadName', label: 'Vertical Head (VR Manager)', minWidth: 150 },
  { id: 'status', label: 'Status', required: true, isConstant: true, defaultValue: 'Active', options: [{ label: 'All', value: 'All' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }], minWidth: 100 },
  { id: 'exitDate', label: 'Exit Date', minWidth: 120 },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 120 },
  { id: 'createdDate', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedBy', label: 'UPDATED BY', minWidth: 120 },
  { id: 'updatedDate', label: 'UPDATED DATE', minWidth: 150 }
];

export default function EmployeeList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const perms = usePagePermissions(PAGE_CODES.EMP_MASTER);
  const { user } = useAuth();
  const isBossAdmin = user?.userLevel === 5;
  const globalQuery = useSelector((state) => state.search?.rawQuery || state.search?.query || '');
  const globalFilters = useSelector((state) => state.search.filters);
  const { timeFormat, dateFormat } = useConfig();

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Auto reset page to 0 when globalQuery or globalFilters change
  useEffect(() => {
    setPage(0);
  }, [globalQuery, globalFilters]);

  // Register Global Filter configuration for Employee Master
  useEffect(() => {
    const config = [
      { id: 'empCode', label: 'Emp Code', type: 'text', placeholder: 'Search by Emp Code...', isStarred: true },
      { id: 'employeeName', label: 'Employee Name', type: 'text', placeholder: 'Search by Name...', isStarred: true },
      { id: 'departmentId', label: 'Department', type: 'text', placeholder: 'Search by Department...', isStarred: true },
      { id: 'designationId', label: 'Designation', type: 'text', placeholder: 'Search by Designation...' },
      { id: 'status', label: 'Status', type: 'select', options: [{ label: 'All', value: 'All' }, { label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }], isStarred: true },
      { id: 'personalEmail', label: 'Personal Mail Id', type: 'text', placeholder: 'Search by Email...' },
      { id: 'homeManagerName', label: 'Home Manager', type: 'text', placeholder: 'Search by Home Manager...' },
      { id: 'businessManagerName', label: 'Business Manager', type: 'text', placeholder: 'Search by Business Manager...' },
      { id: 'verticalHeadName', label: 'Vertical Head', type: 'text', placeholder: 'Search by Vertical Head...' },
      { id: 'hrName', label: 'HR Manager', type: 'text', placeholder: 'Search by HR Manager...' },
      ...getCommonDateFilters('createdDate', 'updatedDate')
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);

  // Row selection for manager mapping
  const [selectedRow, setSelectedRow] = useState(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [mapErrors, setMapErrors] = useState({});
  const [eligibleManagers, setEligibleManagers] = useState([]);
  const [mappingState, setMappingState] = useState({
    homeManagerId: '',
    businessManagerId: '',
    verticalHeadId: '',
    hrId: ''
  });

  // Mapping list from API
  const [mappings, setMappings] = useState([]);

  // Resolution Lookups
  const {
    departments = [],
    designations = [],
    levels = [],
    designationLevels = [],
    users = [],
    grades = [],
    refetch: refetchLookups
  } = useLookups(['DEPARTMENTS', 'DESIGNATIONS', 'LEVELS', 'DESIGNATION_LEVELS', 'USERS', 'GRADES']);

  const finalLevels = levels.length > 0 ? levels : designationLevels;

  const getDeptName = (id) => String(departments.find(d => String(d.id) === String(id))?.departmentName || id || '-');
  const getDesigName = (id) => String(designations.find(d => String(d.id) === String(id))?.designationName || id || '-');
  const getLevelName = (id) => {
    const found = finalLevels.find(l => String(l.rowId || l.id) === String(id));
    return String(found?.level || found?.levelName || id || '-');
  };
  const getUnitName = (id) => String([{ id: 1, name: 'UNIT 1' }, { id: 2, name: 'UNIT 2' }].find(u => String(u.id) === String(id))?.name || id || '-');

  // Helper: format manager dropdown label as "Name - EmpCode / Designation / Level"
  const getManagerLabel = (option) => {
    if (!option) return '';
    const name = `${option.firstName || option.employeeName || ''} ${option.lastName || ''}`.trim();
    const code = option.oldEmpCode || option.empCode || '';
    const desig = option.designationId ? getDesigName(option.designationId) : (option.designationName || '-');
    const level = option.empLevelId ? getLevelName(option.empLevelId) : '-';
    return `${name} - ${code} / ${desig} / ${level}`;
  };

  const fetchMappings = useCallback(async () => {
    try {
      const response = await axios.get('/api/master/hr/employees/manager-mapping', { params: { maxResult: 5000 } });
      if (Array.isArray(response.data)) {
        setMappings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch manager mappings:', error);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.HRM.EMPLOYEES_LIST, { params: { maxResult: 5000 } });
      if (Array.isArray(response.data)) {
        setRows(response.data);
      } else {
        console.error('API did not return an array:', response.data);
        setRows([]);
      }
      await fetchMappings();
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchMappings]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Real-time synchronization
  useEffect(() => {
    const handleRealtimeUpdate = (e) => {
      const eventData = e.detail;
      if (eventData && eventData.entityName === 'EmployeeMasterController') {
        fetchEmployees();
      }
    };
    window.addEventListener('bos-realtime-update', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('bos-realtime-update', handleRealtimeUpdate);
    };
  }, [fetchEmployees]);

  const handleRowClick = (row) => {
    setSelectedRow(prev => prev && prev.id === row.id ? null : row);
  };

  const handleOpenAdd = () => navigate('/hr/employee/master/create');
  const handleOpenEdit = (row) => navigate(`/hr/employee/master/create?id=${row.id}`);
  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.firstName ? `${row.firstName} ${row.lastName || ''}`.trim() : `Employee #${row.oldEmpCode || row.empCode}`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.HRM.EMPLOYEES}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Employee deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchEmployees();
      if (refetchLookups) refetchLookups();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete employee.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleGenerateCredentials = async () => {
    if (selectedEmpIds.length === 0) return;
    try {
      setLoading(true);
      const res = await axios.post('/api/users/generate-from-employees', selectedEmpIds);
      dispatch(openSnackbar({
        open: true,
        message: res.data.message + ` (Created: ${res.data.created}, Skipped: ${res.data.skipped})`,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success',
        close: true
      }));
      setSelectedEmpIds([]);
      fetchEmployees();
      if (refetchLookups) refetchLookups();
    } catch (error) {
      console.error('Failed to generate credentials:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to generate credentials.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: true
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleMapManagerOpen = async () => {
    if (!selectedRow) {
      dispatch(openSnackbar({
        open: true,
        message: 'Select row first',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'warning',
        close: false
      }));
      return;
    }

    try {
      // Fetch eligible managers
      const managersRes = await axios.get(`/api/master/hr/employees/manager-mapping/eligible-managers?empId=${selectedRow.id}`);
      setEligibleManagers(managersRes.data || []);

      // Fetch current mapping for this employee
      const mappingRes = await axios.get(`/api/master/hr/employees/manager-mapping/${selectedRow.id}`);
      const cur = mappingRes.data || {};
      setMappingState({
        homeManagerId: cur.homeManagerId || '',
        businessManagerId: cur.businessManagerId || '',
        verticalHeadId: cur.verticalHeadId || '',
        hrId: cur.hrId || ''
      });
      setMapErrors({});
      setMapDialogOpen(true);
    } catch (error) {
      console.error('Failed to prepare Map Manager:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to retrieve eligible managers.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
    }
  };

  const handleMapManagerSave = async () => {
    if (!mappingState.verticalHeadId) {
      setMapErrors({ verticalHeadId: 'Vertical Head is not mapped.' });
      return;
    }
    setMapErrors({});
    try {
      await axios.post('/api/master/hr/employees/manager-mapping', {
        empId: selectedRow.id,
        homeManagerId: mappingState.homeManagerId || null,
        businessManagerId: mappingState.businessManagerId || null,
        verticalHeadId: mappingState.verticalHeadId || null,
        hrId: mappingState.hrId || null
      });

      dispatch(openSnackbar({
        open: true,
        message: 'Manager mapping updated successfully!',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success',
        close: false
      }));
      setMapDialogOpen(false);
      fetchMappings();
    } catch (error) {
      console.error('Failed to save manager mapping:', error);
      const errMsg = error?.response?.data?.message || error?.message || 'Failed to update manager mapping.';
      if (errMsg.includes('Vertical Head is not mapped') || errMsg.includes('Required mapping not found')) {
        setMapErrors({ verticalHeadId: 'Vertical Head is not mapped.' });
      } else {
        dispatch(openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        }));
      }
    }
  };

  // SOP #4 — Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { }
  });

  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];

    const userMap = new Map();
    if (users && users.length > 0) {
      users.forEach(u => {
        if (u.empId) userMap.set(u.empId, u.userId || u.id);
      });
    }

    const getEmpDisplayName = (r) => {
      if (!r) return '-';
      const full = `${r.firstName || ''} ${r.lastName || ''}`.trim();
      return full || r.employeeName || '-';
    };

    const getFirstName = (r) => r.firstName || (r.employeeName ? r.employeeName.split(' ')[0] : '-') || '-';
    const getLastName = (r) => r.lastName || (r.employeeName ? r.employeeName.split(' ').slice(1).join(' ') : '-') || '-';

    const mapped = rows.map((row) => {
      const map = mappings.find(m => String(m.empId) === String(row.id));
      const homeManager = map && map.homeManagerId ? rows.find(r => String(r.id) === String(map.homeManagerId)) : null;
      const businessManager = map && map.businessManagerId ? rows.find(r => String(r.id) === String(map.businessManagerId)) : null;
      const verticalHead = map && map.verticalHeadId ? rows.find(r => String(r.id) === String(map.verticalHeadId)) : null;

      return {
        ...row,
        empCode: row.oldEmpCode || row.empCode || '-',
        photo: row.employeePhotoUpload || row.photoPath,
        firstName: getFirstName(row),
        lastName: getLastName(row),
        employeeName: row.employeeName || `${row.firstName || ''} ${row.lastName || ''}`.trim() || '-',
        departmentId: getDeptName(row.departmentId),
        designationId: getDesigName(row.designationId),
        dateOfJoining: (row.dateOfJoining || row.joiningDate) ? formatDate(row.dateOfJoining || row.joiningDate, dateFormat) : '-',
        dob: (row.dob || row.birthDate) ? formatDate(row.dob || row.birthDate, dateFormat) : '-',
        personalEmail: row.personalEmail || row.email || '-',
        empLevelId: getLevelName(row.empLevelId),
        unitId: getUnitName(row.unitId),
        supplierName: row.supplierName || row.vendorName || '-',
        userId: row.userId || userMap.get(row.id) || null,
        homeManagerName: row.homeManagerName || (homeManager ? getEmpDisplayName(homeManager) : '-'),
        businessManagerName: row.businessManagerName || (businessManager ? getEmpDisplayName(businessManager) : '-'),
        verticalHeadName: row.verticalHeadName || (verticalHead ? getEmpDisplayName(verticalHead) : '-'),
        hrName: row.hrName || '-',
        exitDate: row.exitDate ? formatDate(row.exitDate, dateFormat) : '-',
        status: row.status || 'Active'
      };
    });

    const filtered = mapped.filter(r => {
      if (r.fromWhere === 'ATS' && (!r.oldEmpCode && !r.empCode || r.empCode === '-')) return false;

      // 1. Status Filter
      const st = r.status || 'Active';
      const targetStatus = (globalFilters && globalFilters.status !== undefined) ? globalFilters.status : 'Active';
      if (targetStatus !== 'All') {
        if (String(st).toUpperCase() !== String(targetStatus).toUpperCase()) return false;
      }

      // 2. Department Filter
      const deptFilter = globalFilters?.departmentId || globalFilters?.department || '';
      if (deptFilter) {
        if (!r.departmentId.toLowerCase().includes(deptFilter.toLowerCase())) return false;
      }

      // 3. Designation Filter
      const desigFilter = globalFilters?.designationId || globalFilters?.designation || '';
      if (desigFilter) {
        if (!r.designationId.toLowerCase().includes(desigFilter.toLowerCase())) return false;
      }

      // 4. Employee Code Filter
      const empCodeFilter = globalFilters?.empCode || '';
      if (empCodeFilter) {
        if (!r.empCode.toLowerCase().includes(empCodeFilter.toLowerCase())) return false;
      }

      // 5. Employee Name Filter
      const employeeNameFilter = globalFilters?.employeeName || '';
      if (employeeNameFilter) {
        if (!r.employeeName.toLowerCase().includes(employeeNameFilter.toLowerCase())) return false;
      }

      // 6. Grade Filter
      const gradeFilter = globalFilters?.gradeCode || '';
      if (gradeFilter) {
        if (!String(r.gradeCode || '').toLowerCase().includes(gradeFilter.toLowerCase())) return false;
      }

      // 7. Unit Filter
      const unitFilter = globalFilters?.unitId || '';
      if (unitFilter) {
        if (!r.unitId.toLowerCase().includes(unitFilter.toLowerCase())) return false;
      }

      // 8. Personal Email Filter
      const emailFilter = globalFilters?.personalEmail || globalFilters?.email || '';
      if (emailFilter) {
        if (!r.personalEmail.toLowerCase().includes(emailFilter.toLowerCase())) return false;
      }

      // 9. Father/Husband Name Filter
      const fatherFilter = globalFilters?.fatherHusbandName || '';
      if (fatherFilter) {
        if (!String(r.fatherHusbandName || '').toLowerCase().includes(fatherFilter.toLowerCase())) return false;
      }

      // 10. Home Manager Filter
      const homeMgrFilter = globalFilters?.homeManagerName || '';
      if (homeMgrFilter) {
        if (!r.homeManagerName.toLowerCase().includes(homeMgrFilter.toLowerCase())) return false;
      }

      // 11. Business Manager Filter
      const bizMgrFilter = globalFilters?.businessManagerName || '';
      if (bizMgrFilter) {
        if (!r.businessManagerName.toLowerCase().includes(bizMgrFilter.toLowerCase())) return false;
      }

      // 12. Vertical Head Filter
      const vhFilter = globalFilters?.verticalHeadName || '';
      if (vhFilter) {
        if (!r.verticalHeadName.toLowerCase().includes(vhFilter.toLowerCase())) return false;
      }

      // 13. HR Manager Filter
      const hrFilter = globalFilters?.hrName || '';
      if (hrFilter) {
        if (!r.hrName.toLowerCase().includes(hrFilter.toLowerCase())) return false;
      }

      // 14. Supplier Filter
      const supplierFilter = globalFilters?.supplierName || '';
      if (supplierFilter) {
        if (!r.supplierName.toLowerCase().includes(supplierFilter.toLowerCase())) return false;
      }

      // 15. Global Search Query across all fields
      if (globalQuery) {
        const q = globalQuery.toLowerCase().trim();
        const matches =
          r.empCode.toLowerCase().includes(q) ||
          r.employeeName.toLowerCase().includes(q) ||
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          r.departmentId.toLowerCase().includes(q) ||
          r.designationId.toLowerCase().includes(q) ||
          r.dateOfJoining.toLowerCase().includes(q) ||
          r.dob.toLowerCase().includes(q) ||
          r.personalEmail.toLowerCase().includes(q) ||
          r.homeManagerName.toLowerCase().includes(q) ||
          r.hrName.toLowerCase().includes(q) ||
          r.businessManagerName.toLowerCase().includes(q) ||
          r.verticalHeadName.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.exitDate.toLowerCase().includes(q) ||
          r.unitId.toLowerCase().includes(q) ||
          r.supplierName.toLowerCase().includes(q) ||
          String(r.fatherHusbandName || '').toLowerCase().includes(q) ||
          String(r.gradeCode || '').toLowerCase().includes(q) ||
          String(r.createdBy || '').toLowerCase().includes(q) ||
          String(r.updatedBy || '').toLowerCase().includes(q);

        if (!matches) return false;
      }

      // 16. Created / Updated Date filters
      if (!matchCommonDateFilters(r, globalFilters, 'createdDate', 'updatedDate')) return false;

      return true;
    });

    return filtered;
  }, [rows, departments, designations, levels, mappings, users, globalFilters, globalQuery, dateFormat]);

  const handleExport = () => {
    const exportData = resolvedRows.map((r, i) => ({
      'Sno': i + 1,
      'Employee Name': r.employeeName,
      'Designation': r.designationId,
      'Department': r.departmentId,
      'Date of Join': r.dateOfJoining,
      'Birth Date': r.dob,
      'Personal Mail Id': r.personalEmail,
      'Emp Code': r.empCode,
      'Home Manager': r.homeManagerName,
      'Business Manager': r.businessManagerName,
      'Vertical Head': r.verticalHeadName,
      'HR': r.hrName,
      'Created By': r.createdBy,
      'Created Date': r.createdAt ? formatDateTime(r.createdAt, timeFormat, dateFormat) : '',
      'Updated By': r.updatedBy,
      'Updated Date': r.updatedAt ? formatDateTime(r.updatedAt, timeFormat, dateFormat) : ''
    }));
    exportToExcel(exportData, 'Employee_Master');
  };

  const tableColumns = useMemo(() => {
    if (isBossAdmin) {
      return [
        {
          id: 'select',
          label: (
            <Checkbox
              size="small"
              color="primary"
              sx={{ p: 0 }}
              checked={selectedEmpIds.length > 0 && selectedEmpIds.length === resolvedRows.filter(r => !r.userId).length}
              indeterminate={selectedEmpIds.length > 0 && selectedEmpIds.length < resolvedRows.filter(r => !r.userId).length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedEmpIds(resolvedRows.filter(r => !r.userId).map(r => r.id));
                } else {
                  setSelectedEmpIds([]);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ),
          minWidth: 60,
          width: 60,
          align: 'center',
          frozen: true
        },
        ...columns
      ];
    }
    return columns;
  }, [isBossAdmin, columns, selectedEmpIds, resolvedRows]);

  return (
    <MainCard
      fullWidth
      title="Employee Master"
      icon={IconUsers}
      secondary={
        <Stack direction="row" spacing={1} alignItems="center">
          {isBossAdmin && selectedEmpIds.length > 0 && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<IconShieldCheck size={18} />}
              onClick={handleGenerateCredentials}
            >
              Create User Credentials ({selectedEmpIds.length})
            </Button>
          )}
          <BOSTableToolbar
            onRefresh={fetchEmployees}
            onNew={handleOpenAdd}
            newTooltip={shortcutTooltip('Create New Employee', 'Ctrl + N')}
            hasWritePermission={perms.write}
            columns={tableColumns}
            exportData={resolvedRows}
            exportFilename="Employee_Master"
            hasExportPermission={perms.export}
            onMapManager={perms.write ? handleMapManagerOpen : null}
            mapManagerDisabled={!selectedRow}
            mapManagerTooltip={selectedRow ? 'Map Reporting Managers' : 'Select row first'}
          />
        </Stack>
      }
    >

      <BOSDataTable
        id="EmployeeListTable"
        columns={tableColumns}
        rows={resolvedRows}
        page={page}
        size={size}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleOpenEdit}
        onEditRow={perms.write ? handleOpenEdit : null}
        onDeleteRow={perms.delete ? handleDeleteClick : null}
        onClickRow={handleRowClick}

        selectedRowId={
          isBossAdmin
            // In admin mode, highlight all checkbox-selected rows (supports array in BOSDataTable)
            ? (selectedEmpIds.length > 0 ? selectedEmpIds : (selectedRow ? selectedRow.id : null))
            // In standard mode, highlight the single Map Manager selected row
            : selectedRow?.id
        }
        renderCell={(col, row) => {
          if (col.id === 'select') {
            const isChecked = selectedEmpIds.includes(row.id);
            return (
              <Checkbox
                color="primary"
                checked={isChecked}
                disabled={!!row.userId}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Guard: don't add duplicate IDs
                    setSelectedEmpIds(prev => prev.includes(row.id) ? prev : [...prev, row.id]);
                  } else {
                    setSelectedEmpIds(prev => prev.filter(id => id !== row.id));
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                size="small"
                sx={{ p: 0 }}
              />
            );
          }
          if (col.id === 'employeeName') {
            return (
              <Box>
                <Typography variant="body2">{row.employeeName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  ID : {row.userId || '-'}
                </Typography>
              </Box>
            );
          }
          return null;
        }}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? All related data (personal, contact, job profile, education, etc.) will be permanently removed."
        itemName={deleteTargetName}
      />

      <BOSFormDialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        title={<Stack direction="row" alignItems="center" spacing={1}>
          <IconUsers size={22} />
          <Typography variant="h3">
            Map Manager — {selectedRow ? (selectedRow.employeeName || `${selectedRow.firstName || ''} ${selectedRow.lastName || ''}`.trim()) : ''}
          </Typography>
        </Stack>}
        onSave={handleMapManagerSave}
      >
        <Stack spacing={2.5}>
          <BOSFormSection
            icon={<IconUserCheck size={20} />}
            title="Reporting Managers"
            defaultOpen={true}
            sx={{ overflow: 'visible' }}
            contentSx={{ p: 2, overflow: 'visible' }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, width: '100%', overflow: 'visible' }}>
              <Box sx={{ width: '100%' }}>
                <Autocomplete
                  fullWidth
                  sx={{ width: '100%' }}
                  size="medium"
                  clearOnEscape
                  options={eligibleManagers}
                  getOptionLabel={(option) => getManagerLabel(option)}
                  isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                  value={eligibleManagers.find(m => String(m.id) === String(mappingState.homeManagerId)) || null}
                  onChange={(_, newValue) => setMappingState(prev => ({ ...prev, homeManagerId: newValue?.id || '' }))}
                  slotProps={{ popper: { style: { zIndex: 1400 } } }}
                  ListboxProps={{ style: { maxHeight: '300px' } }}
                  noOptionsText="No eligible managers found for this level"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Home Manager"
                      placeholder="Search by name, code, or designation..."
                      sx={{ '& .MuiOutlinedInput-root': { minHeight: 56, borderRadius: '12px' } }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const photoUrl = getPhotoUrl(option.photoPath);
                    return (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2 }}>
                        <Tooltip
                          placement="right"
                          arrow
                          enterDelay={150}
                          leaveDelay={0}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                bgcolor: 'background.paper',
                                color: 'text.primary',
                                boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
                                border: '1px solid',
                                borderColor: 'divider',
                                p: 0.5,
                                borderRadius: '12px',
                                maxWidth: 'none',
                                zIndex: 9999
                              }
                            }
                          }}
                          title={
                            photoUrl ? (
                              <Box
                                component="img"
                                src={photoUrl}
                                alt="Enlarged Photo"
                                sx={{
                                  width: 120,
                                  height: 150,
                                  objectFit: 'contain',
                                  display: 'block',
                                  borderRadius: '8px'
                                }}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo Available</Typography>
                            )
                          }
                        >
                          <Avatar
                            src={photoUrl}
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: 'primary.main',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              transition: 'transform 0.15s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.2)',
                                boxShadow: 2
                              }
                            }}
                          >
                            {!photoUrl && (option.firstName || option.employeeName || '?')[0]}
                          </Avatar>
                        </Tooltip>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {`${option.firstName || option.employeeName || ''} ${option.lastName || ''}`.trim()} — {option.oldEmpCode || option.empCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getDesigName(option.designationId)} / {getLevelName(option.empLevelId)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                />
              </Box>

              <Box sx={{ width: '100%' }}>
                <Autocomplete
                  fullWidth
                  sx={{ width: '100%' }}
                  size="medium"
                  clearOnEscape
                  options={eligibleManagers}
                  getOptionLabel={(option) => getManagerLabel(option)}
                  isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                  value={eligibleManagers.find(m => String(m.id) === String(mappingState.businessManagerId)) || null}
                  onChange={(_, newValue) => setMappingState(prev => ({ ...prev, businessManagerId: newValue?.id || '' }))}
                  slotProps={{ popper: { style: { zIndex: 1400 } } }}
                  ListboxProps={{ style: { maxHeight: '300px' } }}
                  noOptionsText="No eligible managers found for this level"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Business Manager"
                      placeholder="Search by name, code, or designation..."
                      sx={{ '& .MuiOutlinedInput-root': { minHeight: 56, borderRadius: '12px' } }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const photoUrl = getPhotoUrl(option.photoPath);
                    return (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2 }}>
                        <Tooltip
                          placement="right"
                          arrow
                          enterDelay={150}
                          leaveDelay={0}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                bgcolor: 'background.paper',
                                color: 'text.primary',
                                boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
                                border: '1px solid',
                                borderColor: 'divider',
                                p: 0.5,
                                borderRadius: '12px',
                                maxWidth: 'none',
                                zIndex: 9999
                              }
                            }
                          }}
                          title={
                            photoUrl ? (
                              <Box
                                component="img"
                                src={photoUrl}
                                alt="Enlarged Photo"
                                sx={{
                                  width: 120,
                                  height: 150,
                                  objectFit: 'contain',
                                  display: 'block',
                                  borderRadius: '8px'
                                }}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo Available</Typography>
                            )
                          }
                        >
                          <Avatar
                            src={photoUrl}
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: 'secondary.main',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              transition: 'transform 0.15s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.2)',
                                boxShadow: 2
                              }
                            }}
                          >
                            {!photoUrl && (option.firstName || option.employeeName || '?')[0]}
                          </Avatar>
                        </Tooltip>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {`${option.firstName || option.employeeName || ''} ${option.lastName || ''}`.trim()} — {option.oldEmpCode || option.empCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getDesigName(option.designationId)} / {getLevelName(option.empLevelId)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                />
              </Box>
            </Box>
          </BOSFormSection>

          <BOSFormSection
            icon={<IconShieldCheck size={20} />}
            title="Approving Authorities"
            defaultOpen={true}
            sx={{ overflow: 'visible' }}
            contentSx={{ p: 2, overflow: 'visible' }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, width: '100%', overflow: 'visible' }}>
              <Box sx={{ width: '100%' }}>
                <Autocomplete
                  fullWidth
                  sx={{ width: '100%' }}
                  size="medium"
                  clearOnEscape
                  options={eligibleManagers}
                  getOptionLabel={(option) => getManagerLabel(option)}
                  isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                  value={eligibleManagers.find(m => String(m.id) === String(mappingState.verticalHeadId)) || null}
                  onChange={(_, newValue) => {
                    setMappingState(prev => ({ ...prev, verticalHeadId: newValue?.id || '' }));
                    setMapErrors(prev => ({ ...prev, verticalHeadId: undefined }));
                  }}
                  slotProps={{ popper: { style: { zIndex: 1400 } } }}
                  ListboxProps={{ style: { maxHeight: '300px' } }}
                  noOptionsText="No eligible managers found for this level"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Vertical Head"
                      placeholder="Search by name, code, or designation..."
                      error={!!mapErrors.verticalHeadId}
                      helperText={mapErrors.verticalHeadId}
                      sx={{ '& .MuiOutlinedInput-root': { minHeight: 56, borderRadius: '12px' } }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const photoUrl = getPhotoUrl(option.photoPath);
                    return (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2 }}>
                        <Tooltip
                          placement="right"
                          arrow
                          enterDelay={150}
                          leaveDelay={0}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                bgcolor: 'background.paper',
                                color: 'text.primary',
                                boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
                                border: '1px solid',
                                borderColor: 'divider',
                                p: 0.5,
                                borderRadius: '12px',
                                maxWidth: 'none',
                                zIndex: 9999
                              }
                            }
                          }}
                          title={
                            photoUrl ? (
                              <Box
                                component="img"
                                src={photoUrl}
                                alt="Enlarged Photo"
                                sx={{
                                  width: 120,
                                  height: 150,
                                  objectFit: 'contain',
                                  display: 'block',
                                  borderRadius: '8px'
                                }}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo Available</Typography>
                            )
                          }
                        >
                          <Avatar
                            src={photoUrl}
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: 'info.main',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              transition: 'transform 0.15s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.2)',
                                boxShadow: 2
                              }
                            }}
                          >
                            {!photoUrl && (option.firstName || option.employeeName || '?')[0]}
                          </Avatar>
                        </Tooltip>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {`${option.firstName || option.employeeName || ''} ${option.lastName || ''}`.trim()} — {option.oldEmpCode || option.empCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getDesigName(option.designationId)} / {getLevelName(option.empLevelId)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                />
              </Box>

              <Box sx={{ width: '100%' }}>
                <Autocomplete
                  fullWidth
                  sx={{ width: '100%' }}
                  size="medium"
                  clearOnEscape
                  options={eligibleManagers}
                  getOptionLabel={(option) => getManagerLabel(option)}
                  isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                  value={eligibleManagers.find(m => String(m.id) === String(mappingState.hrId)) || null}
                  onChange={(_, newValue) => setMappingState(prev => ({ ...prev, hrId: newValue?.id || '' }))}
                  slotProps={{ popper: { style: { zIndex: 1400 } } }}
                  ListboxProps={{ style: { maxHeight: '300px' } }}
                  noOptionsText="No eligible managers found for this level"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="HR"
                      placeholder="Search by name, code, or designation..."
                      sx={{ '& .MuiOutlinedInput-root': { minHeight: 56, borderRadius: '12px' } }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const photoUrl = getPhotoUrl(option.photoPath);
                    return (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2 }}>
                        <Tooltip
                          placement="right"
                          arrow
                          enterDelay={150}
                          leaveDelay={0}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                bgcolor: 'background.paper',
                                color: 'text.primary',
                                boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
                                border: '1px solid',
                                borderColor: 'divider',
                                p: 0.5,
                                borderRadius: '12px',
                                maxWidth: 'none',
                                zIndex: 9999
                              }
                            }
                          }}
                          title={
                            photoUrl ? (
                              <Box
                                component="img"
                                src={photoUrl}
                                alt="Enlarged Photo"
                                sx={{
                                  width: 120,
                                  height: 150,
                                  objectFit: 'contain',
                                  display: 'block',
                                  borderRadius: '8px'
                                }}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo Available</Typography>
                            )
                          }
                        >
                          <Avatar
                            src={photoUrl}
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: 'warning.main',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              transition: 'transform 0.15s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.2)',
                                boxShadow: 2
                              }
                            }}
                          >
                            {!photoUrl && (option.firstName || option.employeeName || '?')[0]}
                          </Avatar>
                        </Tooltip>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {`${option.firstName || option.employeeName || ''} ${option.lastName || ''}`.trim()} — {option.oldEmpCode || option.empCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getDesigName(option.designationId)} / {getLevelName(option.empLevelId)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }}
                />
              </Box>
            </Box>
          </BOSFormSection>
        </Stack>
      </BOSFormDialog>
    </MainCard>
  );
}
