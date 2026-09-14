import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  MenuItem,
  Box,
  Avatar,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'utils/axios';
import {
  IconRotate2,
  IconUser,
  IconArrowRight,
  IconCalendar,
  IconHistory
} from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSTextField,
  BOSTableToolbar,
  getPhotoUrl,
  BOSDatePicker,
  BOSEmployeeAutocomplete,
  BOSFormSection
} from 'ui-component/bos';
import { useLookups } from 'hooks/useLookups';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { setFilterConfig, resetFilters, setFilters, setQuery } from 'store/slices/search';

export default function EmployeeTransfer() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.EMPLOYEE_TRANSFER);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Redux Search Filters
  const globalFilters = useSelector((state) => state.search.filters);
  const globalQuery = useSelector((state) => state.search.query);

  // Data State
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  
  // Default Table Columns (No internal Employee Code as per Requirement #38)
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => [
    'index',
    'oldEmpCode',
    'employeeName',
    'oldDepartment',
    'transferDept',
    'oldDesignation',
    'transferDesignation',
    'empType',
    'transEmpType',
    'oldUnit',
    'transferUnit',
    'expectRevDate',
    'status',
    'fromDate',
    'createdAt',
    'createdUser'
  ]);

  // Lookups
  const {
    departments = [],
    designations = [],
    types = [],      // Employee Types
    divisions = [],  // Units
    employees = []   // Active Employees
  } = useLookups(['DEPARTMENTS', 'DESIGNATIONS', 'TYPES', 'DIVISIONS', 'EMPLOYEES']);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');

  // Form State
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Details fetched from backend (left-side: read-only, right-side: editable defaults)
  const [transferDetails, setTransferDetails] = useState({
    empType: '',
    department: '',
    designation: '',
    oldEmpCode: '',
    unit: '',
    expectRevDate: '',
    // Current values to verify changes
    currentEmpTypeId: '',
    currentDepartmentId: '',
    currentDesignationId: '',
    currentUnitId: '',
    currentEmpCode: '',
    // Target transfer fields (Requirement #38: New Employee Code is the FIRST field)
    transOldEmpCode: '', // New Employee Code
    transferDepartmentId: '',
    transferDesignationId: '',
    transferUnitId: '',
    transferEmpTypeId: '',
    transferExpectRevDate: '',
    remarks: ''
  });

  // Load transfers
  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/hr/employee-transfers');
      setRows(data || []);
      setSelectedIds([]);
    } catch (e) {
      console.error('Failed to load employee transfers', e);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load employee transfer records.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const deptsString = JSON.stringify(departments);
  const divsString = JSON.stringify(divisions);

  // Search Filter Registration
  useEffect(() => {
    const config = [
      {
        id: 'transferDept',
        label: 'Transfer Department',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          ...departments.map((d) => ({ value: d.departmentName, label: d.departmentName }))
        ],
        defaultValue: 'ALL',
        isStarred: true
      },
      {
        id: 'transferUnit',
        label: 'Transfer Unit',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          ...divisions.map((div) => ({ value: div.divisionName, label: div.divisionName }))
        ],
        defaultValue: 'ALL',
        isStarred: true
      }
    ];

    dispatch(setFilterConfig(config));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, deptsString, divsString]);

  useEffect(() => {
    dispatch(
      setFilters({
        transferDept: 'ALL',
        transferUnit: 'ALL'
      })
    );
    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
      dispatch(setQuery(''));
    };
  }, [dispatch]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  // Handle Employee Selection Change
  const handleEmployeeChange = async (eventOrValue, newValueParam) => {
    const val = newValueParam !== undefined ? newValueParam : eventOrValue;
    setSelectedEmployee(val || null);
    setEmployeeProfile(null);
    clearTransferFormDetails();
    if (val?.id) {
      await loadEmployeeLatestInfo(val.id);
    }
  };

  // Fetch full employee profile when selected
  useEffect(() => {
    if (selectedEmployee?.id && !isNaN(Number(selectedEmployee.id))) {
      axios.get(`/api/master/hr/employees/${selectedEmployee.id}`)
        .then(res => {
          setEmployeeProfile(res.data);
        })
        .catch(err => {
          console.error('Failed to fetch employee profile:', err);
          setEmployeeProfile(null);
        });
    } else {
      setEmployeeProfile(null);
    }
  }, [selectedEmployee?.id]);

  // Effective current details with immediate fallback & lookup cross-referencing
  const effectiveCurrentDetails = useMemo(() => {
    if (!selectedEmployee) {
      return { oldEmpCode: '—', department: '—', designation: '—', unit: '—', empType: '—', photoUrl: null, employeeName: '' };
    }
    const emp = employeeProfile || selectedEmployee;

    // 1. Old Employee Code (prioritize active selectedEmployee & emp profile over stale transferDetails)
    const oldEmpCode = selectedEmployee.oldEmpCode || emp.oldEmpCode || transferDetails.oldEmpCode || emp.empCode || selectedEmployee.empCode || '—';

    // 2. Department
    let department = transferDetails.department || emp.departmentName || emp.department?.departmentName || selectedEmployee.departmentName;
    if (!department && (transferDetails.currentDepartmentId || emp.departmentId || emp.organization?.departmentId || selectedEmployee.departmentId)) {
      const deptId = transferDetails.currentDepartmentId || emp.departmentId || emp.organization?.departmentId || selectedEmployee.departmentId;
      const foundDept = departments.find((d) => String(d.id) === String(deptId));
      if (foundDept) department = foundDept.departmentName;
    }

    // 3. Designation
    let designation = transferDetails.designation || emp.designationName || emp.designation?.designationName || selectedEmployee.designationName;
    if (!designation && (transferDetails.currentDesignationId || emp.designationId || emp.organization?.designationId || selectedEmployee.designationId)) {
      const desigId = transferDetails.currentDesignationId || emp.designationId || emp.organization?.designationId || selectedEmployee.designationId;
      const foundDesig = designations.find((ds) => String(ds.id) === String(desigId));
      if (foundDesig) designation = foundDesig.designationName;
    }

    // 4. Unit
    let unit = transferDetails.unit || emp.unitName || emp.divisionName || emp.unit?.divisionName || selectedEmployee.unitName || selectedEmployee.divisionName;
    if (!unit && (transferDetails.currentUnitId || emp.unitId || emp.organization?.unitId || selectedEmployee.unitId)) {
      const unitId = transferDetails.currentUnitId || emp.unitId || emp.organization?.unitId || selectedEmployee.unitId;
      const foundUnit = divisions.find((div) => String(div.id) === String(unitId));
      if (foundUnit) unit = foundUnit.divisionName;
    }

    // 5. Employee Type
    let empType = transferDetails.empType || emp.employeeTypeName || emp.employeeType?.typeName || emp.typeName || selectedEmployee.employeeTypeName;
    if (!empType && (transferDetails.currentEmpTypeId || emp.employeeTypeId || emp.organization?.employeeTypeId || selectedEmployee.employeeTypeId)) {
      const typeId = transferDetails.currentEmpTypeId || emp.employeeTypeId || emp.organization?.employeeTypeId || selectedEmployee.employeeTypeId;
      const foundType = types.find((t) => String(t.id) === String(typeId));
      if (foundType) empType = foundType.typeName;
    }

    const photo = emp.employeePhotoUpload || emp.employeePhoto || emp.profileUpload || emp.photoPath;
    const photoUrl = photo ? getPhotoUrl(photo) : null;
    const employeeName = emp.employeeName || selectedEmployee.label || selectedEmployee.employeeName || '—';

    return {
      employeeName,
      oldEmpCode: oldEmpCode || '—',
      department: department || '—',
      designation: designation || '—',
      unit: unit || '—',
      empType: empType || '—',
      photoUrl
    };
  }, [selectedEmployee, employeeProfile, transferDetails, departments, designations, divisions, types]);

  // Filter out currently assigned options from Transfer Target Details
  const filteredTargetDepartments = useMemo(() => {
    if (!selectedEmployee) return departments;
    const currentId = transferDetails.currentDepartmentId || employeeProfile?.departmentId || employeeProfile?.organization?.departmentId || selectedEmployee.departmentId;
    return departments.filter(d => String(d.id) !== String(currentId));
  }, [departments, selectedEmployee, employeeProfile, transferDetails.currentDepartmentId]);

  const filteredTargetDesignations = useMemo(() => {
    if (!selectedEmployee) return designations;
    const currentId = transferDetails.currentDesignationId || employeeProfile?.designationId || employeeProfile?.organization?.designationId || selectedEmployee.designationId;
    return designations.filter(ds => String(ds.id) !== String(currentId));
  }, [designations, selectedEmployee, employeeProfile, transferDetails.currentDesignationId]);

  const filteredTargetUnits = useMemo(() => {
    if (!selectedEmployee) return divisions;
    const currentId = transferDetails.currentUnitId || employeeProfile?.unitId || employeeProfile?.organization?.unitId || selectedEmployee.unitId;
    return divisions.filter(div => String(div.id) !== String(currentId));
  }, [divisions, selectedEmployee, employeeProfile, transferDetails.currentUnitId]);

  const filteredTargetTypes = useMemo(() => {
    if (!selectedEmployee) return types;
    const currentId = transferDetails.currentEmpTypeId || employeeProfile?.employeeTypeId || employeeProfile?.organization?.employeeTypeId || selectedEmployee.employeeTypeId;
    return types.filter(t => String(t.id) !== String(currentId));
  }, [types, selectedEmployee, employeeProfile, transferDetails.currentEmpTypeId]);

  // Fetch Latest state for selected employee
  const loadEmployeeLatestInfo = async (employeeId) => {
    setLoadingInfo(true);
    try {
      const { data } = await axios.get(`/api/hr/employee-transfers/latest-info/${employeeId}`);
      if (data) {
        const formattedDate = data.expectRevDate 
          ? new Date(data.expectRevDate).toLocaleDateString('en-GB') 
          : '';

        setTransferDetails({
          empType: data.employeeTypeName || selectedEmployee?.employeeTypeName || selectedEmployee?.typeName || '',
          department: data.departmentName || selectedEmployee?.departmentName || selectedEmployee?.department?.departmentName || '',
          designation: data.designationName || selectedEmployee?.designationName || selectedEmployee?.designation?.designationName || '',
          oldEmpCode: data.oldEmpCode || selectedEmployee?.oldEmpCode || selectedEmployee?.empCode || '',
          unit: data.unitName || selectedEmployee?.unitName || selectedEmployee?.divisionName || '',
          expectRevDate: formattedDate,
          currentEmpTypeId: data.employeeTypeId || selectedEmployee?.employeeTypeId || '',
          currentDepartmentId: data.departmentId || selectedEmployee?.departmentId || '',
          currentDesignationId: data.designationId || selectedEmployee?.designationId || '',
          currentUnitId: data.unitId || selectedEmployee?.unitId || '',
          currentEmpCode: data.empCode || selectedEmployee?.empCode || '',
          transOldEmpCode: '',
          transferDepartmentId: '',
          transferDesignationId: '',
          transferUnitId: '',
          transferEmpTypeId: '',
          transferExpectRevDate: '',
          remarks: ''
        });
        return;
      }
    } catch (e) {
      console.log('No prior transfer info found or info query completed:', e);
    } finally {
      setLoadingInfo(false);
    }

    if (selectedEmployee) {
      setTransferDetails({
        empType: selectedEmployee.employeeTypeName || selectedEmployee.typeName || '',
        department: selectedEmployee.departmentName || selectedEmployee.department?.departmentName || '',
        designation: selectedEmployee.designationName || selectedEmployee.designation?.designationName || '',
        oldEmpCode: selectedEmployee.oldEmpCode || selectedEmployee.empCode || '',
        unit: selectedEmployee.unitName || selectedEmployee.divisionName || '',
        expectRevDate: '',
        currentEmpTypeId: selectedEmployee.employeeTypeId || '',
        currentDepartmentId: selectedEmployee.departmentId || '',
        currentDesignationId: selectedEmployee.designationId || '',
        currentUnitId: selectedEmployee.unitId || '',
        currentEmpCode: selectedEmployee.empCode || '',
        transOldEmpCode: '',
        transferDepartmentId: '',
        transferDesignationId: '',
        transferUnitId: '',
        transferEmpTypeId: '',
        transferExpectRevDate: '',
        remarks: ''
      });
    }
  };

  const clearTransferFormDetails = () => {
    setTransferDetails({
      empType: '',
      department: '',
      designation: '',
      oldEmpCode: '',
      unit: '',
      expectRevDate: '',
      currentEmpTypeId: '',
      currentDepartmentId: '',
      currentDesignationId: '',
      currentUnitId: '',
      currentEmpCode: '',
      transOldEmpCode: '',
      transferDepartmentId: '',
      transferDesignationId: '',
      transferUnitId: '',
      transferEmpTypeId: '',
      transferExpectRevDate: '',
      remarks: ''
    });
  };

  const handleClearForm = () => {
    setSelectedEmployee(null);
    setEmployeeProfile(null);
    clearTransferFormDetails();
  };

  const handleOpenAdd = () => {
    handleClearForm();
    setDialogOpen(true);
  };

  // Save Transfer Details
  const handleSave = async () => {
    if (!selectedEmployee) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please select an employee.',
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    const hasEmpTypeChange = transferDetails.transferEmpTypeId && String(transferDetails.transferEmpTypeId) !== String(transferDetails.currentEmpTypeId || '');
    const hasDeptChange = transferDetails.transferDepartmentId && String(transferDetails.transferDepartmentId) !== String(transferDetails.currentDepartmentId || '');
    const hasDesgChange = transferDetails.transferDesignationId && String(transferDetails.transferDesignationId) !== String(transferDetails.currentDesignationId || '');
    const hasUnitChange = transferDetails.transferUnitId && String(transferDetails.transferUnitId) !== String(transferDetails.currentUnitId || '');
    const hasCodeChange = transferDetails.transOldEmpCode && transferDetails.transOldEmpCode.trim() && transferDetails.transOldEmpCode.trim() !== (transferDetails.currentEmpCode || '').trim();

    if (!hasEmpTypeChange && !hasDeptChange && !hasDesgChange && !hasUnitChange && !hasCodeChange) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'At least 1 change must be specified.',
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    if (!transferDetails.transferExpectRevDate) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please select Expected Revision Date.',
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    if (transferDetails.transferExpectRevDate) {
      const parts = transferDetails.transferExpectRevDate.split('-');
      const selectedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Expected Revision Date must be today or a future date.',
            variant: 'alert',
            severity: 'warning'
          })
        );
        return;
      }
    }

    const empName = effectiveCurrentDetails.employeeName || selectedEmployee?.employeeName || 'this employee';
    const oldDept = effectiveCurrentDetails.department || 'current department';
    const targetDeptObj = departments.find(d => String(d.id) === String(transferDetails.transferDepartmentId));
    const newDept = targetDeptObj?.departmentName || (transferDetails.transferDepartmentId ? 'new department' : oldDept);

    let msg = `Are you sure you want to transfer ${empName} from ${oldDept}`;
    if (newDept && newDept !== oldDept && newDept !== 'current department') {
      msg += ` to ${newDept}`;
    }
    msg += `?`;

    setConfirmMsg(msg);
    setConfirmOpen(true);
  };

  // Called when user confirms the transfer in the MUI dialog
  const executeTransfer = async () => {
    setConfirmOpen(false);
    setSaving(true);
    try {
      const payload = {
        employeeId: selectedEmployee.id,
        transferEmployeeTypeId: transferDetails.transferEmpTypeId || null,
        transferDepartmentId: transferDetails.transferDepartmentId || null,
        transferDesignationId: transferDetails.transferDesignationId || null,
        transferUnitId: transferDetails.transferUnitId || null,
        transOldEmpCode: transferDetails.transOldEmpCode || null,
        expectRevDate: transferDetails.transferExpectRevDate ? `${transferDetails.transferExpectRevDate}T00:00:00` : null,
        remarks: transferDetails.remarks || null
      };

      await axios.post('/api/hr/employee-transfers', payload);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Employee transfer saved successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchTransfers();
    } catch (e) {
      console.error('Failed to save employee transfer', e);
      const errorMsg = e.response?.data?.message || 'Failed to save transfer details.';
      dispatch(
        openSnackbar({
          open: true,
          message: errorMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSaving(false);
    }
  };

  // Flatten rows for datatable and global filtering (No internal empCode as per Requirement #38)
  const resolvedRows = useMemo(() => {
    return rows.map((row, idx) => {
      const formattedExpectRevDate = row.expectRevDate ? new Date(row.expectRevDate).toLocaleDateString('en-GB') : '-';
      const formattedFromDate = row.fromDate ? new Date(row.fromDate).toLocaleDateString('en-GB') : '-';
      const formattedToDate = row.toDate ? new Date(row.toDate).toLocaleDateString('en-GB') : '-';
      const formattedCreatedDate = row.createdDate ? new Date(row.createdDate).toLocaleDateString('en-GB') : '-';

      return {
        ...row,
        index: idx + 1,
        oldEmpCode: row.employee?.oldEmpCode || row.oldEmpCode || row.employee?.empCode || '-',
        employeeName: row.employee?.employeeName || '-',
        transOldEmpCode: row.transOldEmpCode || '-',
        oldDepartment: row.oldDepartment?.departmentName || '-',
        transferDept: row.transferDepartment?.departmentName || '-',
        oldDesignation: row.oldDesignation?.designationName || '-',
        transferDesignation: row.transferDesignation?.designationName || '-',
        empType: row.oldEmployeeType?.typeName || '-',
        transEmpType: row.transferEmployeeType?.typeName || '-',
        oldUnit: row.oldUnit?.divisionName || '-',
        transferUnit: row.transferUnit?.divisionName || '-',
        expectRevDate: formattedExpectRevDate,
        fromDate: formattedFromDate,
        toDate: formattedToDate,
        createdAt: formattedCreatedDate,
        createdUser: row.createdUser || row.createdBy || '-',
        status: row.status || 'EXECUTED'
      };
    });
  }, [rows]);

  // Historical transfer logs for the selected employee (Requirement #39)
  const employeeTransferLogs = useMemo(() => {
    if (!selectedEmployee?.id) return [];
    return rows.filter((r) => String(r.employeeId) === String(selectedEmployee.id));
  }, [selectedEmployee?.id, rows]);

  const handleSelectRow = useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  // Table Columns Setup (Requirement #38: No internal Employee Code)
  const tableColumns = useMemo(
    () => [
      { id: 'index', label: 'No', minWidth: 55, align: 'center' },
      { id: 'oldEmpCode', label: 'Employee ID', minWidth: 120, bold: true, align: 'center' },
      { id: 'employeeName', label: 'Employee Name', minWidth: 160, bold: true },
      { id: 'oldDepartment', label: 'Old Department', minWidth: 150 },
      { id: 'transferDept', label: 'Transfer Department', minWidth: 160, bold: true, color: 'primary.main' },
      { id: 'oldDesignation', label: 'Old Designation', minWidth: 150 },
      { id: 'transferDesignation', label: 'Transfer Designation', minWidth: 160 },
      { id: 'empType', label: 'Employee Type', minWidth: 130 },
      { id: 'transEmpType', label: 'Transfer Type', minWidth: 130 },
      { id: 'oldUnit', label: 'Old Unit', minWidth: 120 },
      { id: 'transferUnit', label: 'Transfer Unit', minWidth: 120 },
      { id: 'expectRevDate', label: 'Expected Revision Date', minWidth: 150, align: 'center' },
      { id: 'status', label: 'Status', minWidth: 110, align: 'center', bold: true },
      { id: 'fromDate', label: 'From Date', minWidth: 110, align: 'center' },
      { id: 'createdAt', label: 'Created Date', minWidth: 110, align: 'center' },
      { id: 'createdUser', label: 'Created By', minWidth: 120 }
    ],
    []
  );

  const filteredTableColumns = useMemo(
    () => tableColumns.filter((col) => visibleColumnIds.includes(col.id)),
    [tableColumns, visibleColumnIds]
  );

  return (
    <MainCard
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconRotate2 size={24} color={theme.palette.primary.main} />
          <Typography variant="h3">Employee Transfer</Typography>
        </Box>
      }
      secondary={
        <BOSTableToolbar
          onRefresh={fetchTransfers}
          exportData={resolvedRows}
          exportFilename="Employee_Transfer_List"
          hasExportPermission={perms.export}
          columns={tableColumns}
          visibleColumnIds={visibleColumnIds}
          onColumnVisibilityChange={setVisibleColumnIds}
          columnVisibilityLabel="Add Component"
          requiredColumnIds={['index', 'oldEmpCode', 'employeeName']}
          hasWritePermission={perms.write}
          onNew={handleOpenAdd}
          newLabel="Add"
          newTooltip="Add Employee Transfer"
        />
      }
    >
      {/* Main Data Table */}
      <BOSDataTable
        columns={filteredTableColumns}
        rows={resolvedRows}
        page={page}
        size={size}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onClickRow={(row) => handleSelectRow(row.id)}
        selectedRowId={selectedIds}
        showActions={false}
      />

      {/* Employee Transfer Details Modal */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onClear={handleClearForm}
        title="Employee Transfer Details"
        maxWidth="md"
        fullWidth
        saveButtonText="Execute Transfer"
        saveButtonDisabled={saving || !selectedEmployee}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5, pb: 0.5, width: '100%' }}>
          
          {/* Section 1: Employee Selection & Profile Banner (Requirement #37) */}
          <BOSFormSection icon={<IconUser size={18} color={theme.palette.primary.main} />} title="Employee Selection & Details">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <BOSEmployeeAutocomplete
                name="employeeId"
                label="Employee Name *"
                options={employees}
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                placeholder="Search Employee..."
                size="small"
                fullWidth
              />

              {selectedEmployee && (
                <Box sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '10px',
                  bgcolor: isDark ? 'background.default' : 'grey.50',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                  <Avatar
                    src={effectiveCurrentDetails.photoUrl}
                    alt={effectiveCurrentDetails.employeeName}
                    sx={{
                      width: 52,
                      height: 52,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      boxShadow: 1,
                      flexShrink: 0
                    }}
                  >
                    {effectiveCurrentDetails.employeeName?.charAt(0) || <IconUser size={24} />}
                  </Avatar>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr 1fr 1fr' }, gap: 1.5, flexGrow: 1, alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {effectiveCurrentDetails.employeeName}
                      </Typography>
                      <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                        Employee ID: {effectiveCurrentDetails.oldEmpCode}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Department</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{effectiveCurrentDetails.department}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Designation</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{effectiveCurrentDetails.designation}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Unit</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{effectiveCurrentDetails.unit}</Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </BOSFormSection>

          {/* Section 2: Current vs Transfer Details Grid (Requirement #38) */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, width: '100%' }}>
            
            {/* Current Details Column (No internal Employee Code as per Requirement #38) */}
            <BOSFormSection icon={<IconUser size={18} color={theme.palette.text.secondary} />} title="Current Details (Read-only)">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <BOSTextField
                  label="Employee ID"
                  size="small"
                  disabled
                  value={effectiveCurrentDetails.oldEmpCode}
                />
                <BOSTextField
                  label="Department"
                  size="small"
                  disabled
                  value={effectiveCurrentDetails.department}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
                  <BOSTextField
                    label="Designation"
                    size="small"
                    disabled
                    value={effectiveCurrentDetails.designation}
                  />
                  <BOSTextField
                    label="Unit"
                    size="small"
                    disabled
                    value={effectiveCurrentDetails.unit}
                  />
                </Box>
                <BOSTextField
                  label="Employee Type"
                  size="small"
                  disabled
                  value={effectiveCurrentDetails.empType}
                />
              </Box>
            </BOSFormSection>

            {/* Transfer Target Column (Requirement #38: New Employee Code is FIRST, Department has NO red asterisk) */}
            <BOSFormSection icon={<IconArrowRight size={18} color={theme.palette.primary.main} />} title="Transfer Target Details">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {/* 1st Field: New Employee Code (Requirement #38) */}
                <BOSTextField
                  label="New Employee Code"
                  size="small"
                  placeholder="Enter new employee code..."
                  value={transferDetails.transOldEmpCode}
                  onChange={(e) => setTransferDetails({ ...transferDetails, transOldEmpCode: e.target.value })}
                  fullWidth
                />
                {/* 2nd Field: Department (No red asterisk as per Requirement #38) */}
                <BOSTextField
                  select
                  label="Department"
                  size="small"
                  value={transferDetails.transferDepartmentId}
                  onChange={(e) => setTransferDetails({ ...transferDetails, transferDepartmentId: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">- Select Department -</MenuItem>
                  {filteredTargetDepartments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
                  ))}
                </BOSTextField>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
                  <BOSTextField
                    select
                    label="Designation"
                    size="small"
                    value={transferDetails.transferDesignationId}
                    onChange={(e) => setTransferDetails({ ...transferDetails, transferDesignationId: e.target.value })}
                    fullWidth
                  >
                    <MenuItem value="">- Select Designation -</MenuItem>
                    {filteredTargetDesignations.map((ds) => (
                      <MenuItem key={ds.id} value={ds.id}>{ds.designationName}</MenuItem>
                    ))}
                  </BOSTextField>
                  <BOSTextField
                    select
                    label="Unit"
                    size="small"
                    value={transferDetails.transferUnitId}
                    onChange={(e) => setTransferDetails({ ...transferDetails, transferUnitId: e.target.value })}
                    fullWidth
                  >
                    <MenuItem value="">- Select Unit -</MenuItem>
                    {filteredTargetUnits.map((div) => (
                      <MenuItem key={div.id} value={div.id}>{div.divisionName}</MenuItem>
                    ))}
                  </BOSTextField>
                </Box>
                <BOSTextField
                  select
                  label="Employee Type"
                  size="small"
                  value={transferDetails.transferEmpTypeId}
                  onChange={(e) => setTransferDetails({ ...transferDetails, transferEmpTypeId: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">- Select Employee Type -</MenuItem>
                  {filteredTargetTypes.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.typeName}</MenuItem>
                  ))}
                </BOSTextField>
              </Box>
            </BOSFormSection>

          </Box>

          {/* Section 3: Revision Date & Remarks */}
          <BOSFormSection icon={<IconCalendar size={18} color={theme.palette.primary.main} />} title="Revision Date & Remarks">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '240px 1fr' }, gap: 1.5 }}>
              <BOSDatePicker
                name="transferExpectRevDate"
                label="Expected Revision Date *"
                value={transferDetails.transferExpectRevDate}
                onChange={(e) => setTransferDetails({ ...transferDetails, transferExpectRevDate: e.target.value })}
                minDate={new Date()}
                size="small"
              />
              <BOSTextField
                label="Remarks"
                size="small"
                placeholder="Enter transfer remarks..."
                value={transferDetails.remarks}
                onChange={(e) => setTransferDetails({ ...transferDetails, remarks: e.target.value })}
                fullWidth
              />
            </Box>
          </BOSFormSection>

          {/* Section 4: Transfer History Audit Logs (Requirement #39) */}
          {selectedEmployee && (
            <BOSFormSection icon={<IconHistory size={18} color={theme.palette.primary.main} />} title="Transfer History Logs">
              <Box sx={{ maxHeight: '220px', overflowY: 'auto', pr: 0.5 }}>
                {employeeTransferLogs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1.5 }}>
                    No previous transfer history recorded for this employee.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {employeeTransferLogs.map((log, idx) => {
                      const logDate = log.createdDate || log.fromDate;
                      const formattedDate = logDate ? new Date(logDate).toLocaleDateString('en-GB') : '—';
                      const formattedTime = logDate ? new Date(logDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                      // Build transfer summary chips — only show fields that ACTUALLY changed (old !== new)
                      const changes = [];
                      const oldDeptName = log.oldDepartment?.departmentName;
                      const newDeptName = log.transferDepartment?.departmentName;
                      if (newDeptName && newDeptName !== oldDeptName) {
                        changes.push({ label: 'Dept', val: `${oldDeptName || '—'} → ${newDeptName}` });
                      }
                      const oldDesgName = log.oldDesignation?.designationName;
                      const newDesgName = log.transferDesignation?.designationName;
                      if (newDesgName && newDesgName !== oldDesgName) {
                        changes.push({ label: 'Desig', val: `${oldDesgName || '—'} → ${newDesgName}` });
                      }
                      const oldUnitName = log.oldUnit?.divisionName;
                      const newUnitName = log.transferUnit?.divisionName;
                      if (newUnitName && newUnitName !== oldUnitName) {
                        changes.push({ label: 'Unit', val: `${oldUnitName || '—'} → ${newUnitName}` });
                      }
                      const oldTypeName = log.oldEmployeeType?.typeName;
                      const newTypeName = log.transferEmployeeType?.typeName;
                      if (newTypeName && newTypeName !== oldTypeName) {
                        changes.push({ label: 'Type', val: `${oldTypeName || '—'} → ${newTypeName}` });
                      }
                      const oldCode = (log.oldEmpCode || '').trim();
                      const newCode = (log.transOldEmpCode || '').trim();
                      if (newCode && newCode !== oldCode) {
                        changes.push({ label: 'Emp Code', val: `${oldCode || '—'} → ${newCode}` });
                      }

                      return (
                        <Box
                          key={log.id || idx}
                          sx={{
                            p: 1.2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '8px',
                            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'grey.50',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.75
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.825rem' }}>
                              Transfer #{employeeTransferLogs.length - idx}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              {formattedDate} {formattedTime} | By: {log.createdUser || log.createdBy || 'System'}
                            </Typography>
                          </Box>
                          <Divider sx={{ my: 0.2 }} />
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                            {changes.length === 0 ? (
                              <Typography variant="caption" color="text.secondary">Transfer recorded with no category change</Typography>
                            ) : (
                              changes.map((c, i) => (
                                <Chip
                                  key={i}
                                  size="small"
                                  label={`${c.label}: ${c.val}`}
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    bgcolor: isDark ? 'rgba(33,150,243,0.15)' : '#e3f2fd',
                                    color: isDark ? '#90caf9' : '#1565c0',
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(33,150,243,0.3)' : '#90caf9'
                                  }}
                                />
                              ))
                            )}
                          </Box>
                          {log.remarks && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Remarks: {log.remarks}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </BOSFormSection>
          )}

        </Box>
      </BOSFormDialog>

      {/* Transfer Confirmation Dialog — rendered at zIndex 1500 to appear above BOSFormDialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 1500 }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 1
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: 700,
            fontSize: '1rem',
            color: 'primary.main',
            pb: 0.5
          }}
        >
          Confirm Employee Transfer
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem', color: 'text.primary', mt: 0.5 }}>
            {confirmMsg}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setConfirmOpen(false)}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={executeTransfer}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
          >
            Yes, Execute Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
