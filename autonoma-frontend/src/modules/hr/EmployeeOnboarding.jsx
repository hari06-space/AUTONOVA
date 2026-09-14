import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Button, Menu, MenuItem } from '@mui/material';
import { IconUserCheck, IconPlus, IconChevronDown } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, BOSStatusChip, btnNew } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { format } from 'date-fns';

// ==============================|| EMPLOYEE ONBOARDING TRACKING (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: 'S.No', minWidth: 60, frozen: true },
  { id: 'empCode', label: 'Employee Code', minWidth: 140, bold: true, frozen: true },
  { id: 'employeeName', label: 'Employee Name', minWidth: 180, bold: true, frozen: true },
  { id: 'department', label: 'Department', minWidth: 150 },
  { id: 'designation', label: 'Designation', minWidth: 150 },
  { id: 'recruitmentDate', label: 'Recruitment Date', minWidth: 150 },
  { id: 'interviewCompletionDate', label: 'Interview Completion Date', minWidth: 180 },
  { id: 'offerLetterGeneratedDate', label: 'Offer Letter Generated Date', minWidth: 190 },
  { id: 'offerLetterAcceptedDate', label: 'Offer Letter Accepted Date', minWidth: 180 },
  { id: 'internshipStartDate', label: 'Internship Start Date', minWidth: 160 },
  { id: 'internshipCompletionDate', label: 'Internship Completion Date', minWidth: 190 },
  { id: 'inductionProgramDate', label: 'Induction Date', minWidth: 150 },
  { id: 'documentVerificationDate', label: 'Document Verification Date', minWidth: 190 },
  { id: 'joiningDate', label: 'Joining Date', minWidth: 150 },
  { id: 'onboardingCompletionDate', label: 'Onboarding Completion Date', minWidth: 200 },
  { id: 'onboardingStatus', label: 'Onboarding Status', minWidth: 160 },
  { id: 'lastUpdatedDate', label: 'Last Updated Date', minWidth: 160 }
];

export default function EmployeeOnboarding() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const perms = usePagePermissions(PAGE_CODES.EMP_ONBOARDING);
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Dropdown menu state
  const [anchorEl, setAnchorEl] = useState(null);

  const handleCreateClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCreateClose = () => {
    setAnchorEl(null);
  };

  const handleNavigateTo = (path) => {
    navigate(path);
    handleCreateClose();
  };

  // Configure global search filters inside useEffect
  useEffect(() => {
    const config = [
      {
        id: 'onboardingStatus',
        label: 'Onboarding Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'APPLIED', label: 'APPLIED' },
          { value: 'INTERVIEWING', label: 'INTERVIEWING' },
          { value: 'OFFER ISSUED', label: 'OFFER ISSUED' },
          { value: 'ONBOARDING SUBMITTED', label: 'ONBOARDING SUBMITTED' },
          { value: 'DOCUMENT VERIFIED', label: 'DOCUMENT VERIFIED' },
          { value: 'INDUCTION PENDING', label: 'INDUCTION PENDING' },
          { value: 'COMPLETED', label: 'COMPLETED' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      },
      { id: 'empCode', label: 'Employee Code', type: 'text', placeholder: 'Filter by Code...', isStarred: true },
      { id: 'employeeName', label: 'Employee Name', type: 'text', placeholder: 'Filter by Name...', isStarred: true },
      { id: 'department', label: 'Department', type: 'text', placeholder: 'Filter by Department...', isStarred: true },
      { id: 'designation', label: 'Designation', type: 'text', placeholder: 'Filter by Designation...', isStarred: true },
      ...getCommonDateFilters('recruitmentDate', 'joiningDate')
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchOnboardingData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hra/applicants/onboarding-tracking');
      // Sort descending by id to show recent records at the top
      const sorted = (response.data || []).sort((a, b) => (b.id || 0) - (a.id || 0));
      setRows(sorted);
    } catch (error) {
      console.error('Failed to fetch onboarding tracking data:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnboardingData();
  }, [fetchOnboardingData]);

  // Client-side filtering logic matching global search and filters
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // 1. Onboarding Status Filter
      const statusFilter = globalFilters.onboardingStatus || 'ALL';
      if (statusFilter !== 'ALL' && row.onboardingStatus !== statusFilter) return false;

      // 2. Recruitment Date Range Filter
      if (globalFilters.recruitmentDateStart || globalFilters.recruitmentDateEnd) {
        if (!row.recruitmentDate) return false;
        const rDate = format(new Date(row.recruitmentDate), 'yyyy-MM-dd');
        if (globalFilters.recruitmentDateStart && rDate < globalFilters.recruitmentDateStart) return false;
        if (globalFilters.recruitmentDateEnd && rDate > globalFilters.recruitmentDateEnd) return false;
      }

      // 3. Joining Date Range Filter
      if (globalFilters.joiningDateStart || globalFilters.joiningDateEnd) {
        if (!row.joiningDate) return false;
        const jDate = format(new Date(row.joiningDate), 'yyyy-MM-dd');
        if (globalFilters.joiningDateStart && jDate < globalFilters.joiningDateStart) return false;
        if (globalFilters.joiningDateEnd && jDate > globalFilters.joiningDateEnd) return false;
      }

      // 4. Employee Code Filter
      const empCodeFilter = globalFilters.empCode || '';
      if (empCodeFilter && !(row.empCode || '').toLowerCase().includes(empCodeFilter.toLowerCase())) return false;

      // 5. Employee Name Filter
      const employeeNameFilter = globalFilters.employeeName || '';
      if (employeeNameFilter && !(row.employeeName || '').toLowerCase().includes(employeeNameFilter.toLowerCase())) return false;

      // 6. Department Filter
      const departmentFilter = globalFilters.department || '';
      if (departmentFilter && !(row.department || '').toLowerCase().includes(departmentFilter.toLowerCase())) return false;

      // 7. Designation Filter
      const designationFilter = globalFilters.designation || '';
      if (designationFilter && !(row.designation || '').toLowerCase().includes(designationFilter.toLowerCase())) return false;

      // 8. Global Search Query
      if (globalQuery) {
        const query = globalQuery.toLowerCase();
        const matchesSearch =
          (row.empCode && row.empCode.toLowerCase().includes(query)) ||
          (row.employeeName && row.employeeName.toLowerCase().includes(query)) ||
          (row.department && row.department.toLowerCase().includes(query)) ||
          (row.designation && row.designation.toLowerCase().includes(query)) ||
          (row.onboardingStatus && row.onboardingStatus.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * size, page * size + size);
  }, [filteredRows, page, size]);

  const renderCell = (col, row, idx) => {
    const val = row[col.id];

    if (col.id === 'index') {
      return (page * size) + idx + 1;
    }

    if (col.id === 'onboardingStatus') {
      let customSx = {};
      const statusText = String(val || '').toUpperCase();
      if (statusText === 'COMPLETED') {
        customSx = { bgcolor: '#E8F5E9', color: '#2E7D32' };
      } else if (statusText === 'INDUCTION PENDING') {
        customSx = { bgcolor: '#FFF3E0', color: '#E65100' };
      } else if (statusText === 'DOCUMENT VERIFIED') {
        customSx = { bgcolor: '#E3F2FD', color: '#1565C0' };
      } else if (statusText === 'ONBOARDING SUBMITTED') {
        customSx = { bgcolor: '#F3E5F5', color: '#7B1FA2' };
      } else if (statusText === 'OFFER ISSUED') {
        customSx = { bgcolor: '#E0F7FA', color: '#006064' };
      } else if (statusText === 'INTERVIEWING') {
        customSx = { bgcolor: '#FFFDE7', color: '#F57F17' };
      } else if (statusText === 'APPLIED') {
        customSx = { bgcolor: '#E8F5E9', color: '#2E7D32' };
      }
      return <BOSStatusChip status={val || 'APPLIED'} width={160} sx={customSx} />;
    }

    // Explicit date rendering override to align format across all columns
    const isDateField = col.id.toLowerCase().includes('date') || col.id === 'inductionProgramDate';
    if (isDateField) {
      if (!val) return '-';
      try {
        return format(new Date(val), 'dd/MM/yyyy');
      } catch {
        return '-';
      }
    }

    return val ?? '-';
  };

  return (
    <MainCard
      fullWidth
      icon={IconUserCheck}
      title={"Employee Onboarding Tracking"}
      secondary={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {perms.write && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<IconPlus size={18} />}
                endIcon={<IconChevronDown size={18} />}
                onClick={handleCreateClick}
                sx={btnNew}
              >
                Create
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCreateClose}
              >
                <MenuItem onClick={() => handleNavigateTo('/hra/employee/onboarding/offer-letter')}>Offer Letter</MenuItem>
                <MenuItem onClick={() => handleNavigateTo('/hra/employee/onboarding/relieving-order')}>Relieving Order</MenuItem>
                <MenuItem onClick={() => handleNavigateTo('/hra/employee/onboarding/appointment-order')}>Appointment Order</MenuItem>
              </Menu>
            </>
          )}
          <BOSTableToolbar
            id="EmployeeOnboardingTable"
            onRefresh={fetchOnboardingData}
            hasWritePermission={false} // Read-only view
            exportData={filteredRows}
            exportFilename="Employee_Onboarding_Tracking"
            hasExportPermission={perms.export}
            columns={columns}
          />
        </Stack>
      }
    >
      <BOSDataTable
        id="EmployeeOnboardingTable"
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        renderCell={renderCell}
        showActions={false} // No actions column
      />
    </MainCard>
  );
}