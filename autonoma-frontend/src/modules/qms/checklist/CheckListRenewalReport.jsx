import { useState, useEffect, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import axios from 'utils/axios';

import MainCard from 'ui-component/cards/MainCard';
import { useSelector, useDispatch } from 'react-redux';
import { setFilterConfig, setTableConfig, setFilters } from 'store/slices/search';
import useBOSFilters from 'hooks/useBOSFilters';
import useAuth from 'hooks/useAuth';
import ExecutionVerifyDialog from './ExecutionVerifyDialog';
import { BOSDataTable, BOSTableToolbar, BOSStatusChip } from 'ui-component/bos';
import { getCommonDateFilters, matchCommonDateFilters, matchDateRange } from 'ui-component/bos/BOSUtils';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useLookups from 'hooks/useLookups';

const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    let d;
    if (typeof dateVal === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const [yyyy, mm, dd] = dateVal.split('-');
        return `${dd}/${mm}/${yyyy}`;
      }
      if (dateVal.includes('T')) {
        const datePart = dateVal.split('T')[0];
        const [yyyy, mm, dd] = datePart.split('-');
        return `${dd}/${mm}/${yyyy}`;
      }
      d = new Date(dateVal);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return '-';
  }
};

const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    let hours = d.getHours();
    const mins  = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${date} ${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return '-';
  }
};

const getEmployeeName = (idOrCodeOrName, employeesList = []) => {
  if (!idOrCodeOrName || idOrCodeOrName === '-') return '-';
  const parts = String(idOrCodeOrName).split(',').map(p => p.trim());
  const resolvedParts = parts.map(part => {
    const emp = employeesList.find(
      (e) =>
        String(e.id) === String(part) ||
        String(e.empCode) === String(part) ||
        String(e.employeeCode) === String(part) ||
        String(e.employeeName).toLowerCase() === String(part).toLowerCase()
    );
    return emp ? emp.employeeName : part;
  });
  return resolvedParts.join(', ');
};

const StatusChip = BOSStatusChip;

const getFilterConfig = (bosFilters, perms) => [
  {
    id: 'taskType',
    label: 'Scope',
    type: 'select',
    isStarred: true,
    defaultValue: perms.additional1 ? 'Company' : (perms.manager ? 'Team' : 'Mine'),
    options: bosFilters.getFilterOptions()
  },
  {
    id: 'status', label: 'Status', type: 'select', isStarred: true, defaultValue: 'All', options: [
      { value: 'All', label: 'All' },
      { value: 'Open', label: 'Open' },
      { value: 'Pending for Verified', label: 'Pending for Verified' },
      { value: 'Verified', label: 'Verified' }
    ]
  },
  {
    id: 'category', label: 'Category', type: 'select', isStarred: true, defaultValue: 'All', options: [
      { value: 'All', label: 'All' },
      { value: 'RENEWAL', label: 'RENEWAL' },
      { value: 'CHECK LIST', label: 'CHECK LIST' }
    ]
  },
  { id: 'createdDate', label: 'Created Date', type: 'dateRange', isStarred: true }
];

export default function CheckListRenewalReport() {
  const dispatch = useDispatch();
  const { employees = [] } = useLookups(['EMPLOYEES']);
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const activeRow = rows.find((r) => r.id === selectedRowId) || null;
  const searchQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.QMS_CHECKLIST_REPORT);
  const { user } = useAuth();
  const bosFilters = useBOSFilters(perms);

  const [departmentsList, setDepartmentsList] = useState([]);

  const tableCols = [
    { id: 'index', label: '#', minWidth: 55 },
    { id: 'category', label: 'Category', minWidth: 120, render: (row) => row.checklist?.category || '-' },
    { id: 'checkingPoint', label: 'Check Point', minWidth: 200, render: (row) => row.checklist?.checkingPoint ? (
      <Box
        component="span"
        onClick={(e) => { e.stopPropagation(); setSelectedRowId(row.id); setDialogOpen(true); }}
        sx={{ color: 'primary.main', textDecoration: 'none', cursor: 'pointer', fontWeight: 500, '&:hover': { color: 'primary.dark' } }}
      >
        {row.checklist.checkingPoint}
      </Box>
    ) : '-' },
    { id: 'department', label: 'Dept', minWidth: 160, render: (row) => (row.checklist?.departments || []).map(d => d.departmentName).join(', ') },
    { id: 'frequency', label: 'Frequency', minWidth: 120, render: (row) => row.checklist?.frequency || '-' },
    { id: 'stockLink', label: 'Stock Link', minWidth: 100, render: (row) => row.checklist?.stockLink || '-' },
    { id: 'remarks', label: 'Comments', minWidth: 200, render: (row) => row.remarks || '-' },
    { id: 'verificationRequired', label: 'Verification Required', minWidth: 160, render: (row) => { const dc = row.checklist?.dualCheck?.toString().toUpperCase(); return (dc === 'YES' || dc === '1') ? 'Yes' : 'No'; } },
    { id: 'assignedTo', label: 'Assigned To', minWidth: 120, render: (row) => row.assignedToName || getEmployeeName(row.assignedTo, employees) },
    { id: 'createdUser', label: 'Created By', minWidth: 120, render: (row) => row.checklist?.createdUser || row.checklist?.createdBy || '-' },
    { id: 'createdDate', label: 'Created Date', minWidth: 120, render: (row) => formatDate(row.createdAt || row.createdDate || row.checklist?.createdAt || row.checklist?.createdDate) },
    { id: 'updatedUser', label: 'Updated By', minWidth: 120, render: (row) => {
      const upAt = row.updatedAt || row.checklist?.updatedAt;
      const crAt = row.createdAt || row.checklist?.createdAt;
      if (!upAt || !crAt) return '-';
      const msDiff = Math.abs(new Date(upAt) - new Date(crAt));
      if (msDiff <= 60000) return '-';
      let upUser = row.updatedUser || row.updatedBy || row.checklist?.updatedUser || row.checklist?.updatedBy || '-';
      if (upUser === 'Admin istrator' || upUser === 'Administrator') upUser = 'Admin';
      if (String(upUser).toLowerCase().includes('system')) return '-';
      return upUser;
    } },
    { id: 'updatedDate', label: 'Update Date & Time', minWidth: 160, render: (row) => {
      const upAt = row.updatedAt || row.checklist?.updatedAt;
      const crAt = row.createdAt || row.checklist?.createdAt;
      if (!upAt || !crAt) return '-';
      const msDiff = Math.abs(new Date(upAt) - new Date(crAt));
      if (msDiff <= 60000) return '-';
      return formatDateTime(upAt);
    } },
    { id: 'status', label: 'Task Status', minWidth: 160, render: (row) => <StatusChip status={row.status?.name || row.status} /> }
  ];

  useEffect(() => {
    axios.get('/api/master/hr/departments')
      .then(res => {
        const list = (res.data || [])
          .filter(d => d.status?.toLowerCase() === 'active' || d.status === null)
          .map(d => d.departmentName);
        setDepartmentsList(list);
      })
      .catch(err => {
        console.error("Failed to load departments from master", err);
      });
  }, []);

  // Initialize default filters on mount, clean up on unmount
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    const defaultTaskType = perms.additional1 ? 'Company' : (perms.manager || bosFilters.isVerticalHead ? 'Team' : 'Mine');
    dispatch(setFilters({ status: 'All', category: 'All', taskType: defaultTaskType, ...globalFilters }));
    return () => {};
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, perms.additional1, perms.manager, bosFilters.isVerticalHead]);

  // Configure global search bar filters on mount
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    dispatch(setFilterConfig({ config: getFilterConfig(bosFilters, perms), path: '/qms/checklist/renewal-report' }));
    dispatch(setTableConfig(tableCols));
    return () => {
      dispatch(setFilterConfig({ config: null, path: '/qms/checklist/renewal-report' }));
      dispatch(setTableConfig(null));
    };
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, perms.additional1, perms.manager]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const considerDate = globalFilters.createdDateConsider !== undefined ? globalFilters.createdDateConsider : 'Yes';
      const params = {
        page,
        size,
        fromDate: globalFilters.createdDateStart || undefined,
        toDate: globalFilters.createdDateEnd || undefined,
        considerDate: considerDate,
        searchValue: searchQuery || undefined,
        searchBy: undefined,

        // Add-on filters mapping
        category: (globalFilters.category && globalFilters.category !== 'All') ? globalFilters.category : undefined,
        checkingPoint: globalFilters.checkingPoint || undefined,
        department: globalFilters.department || undefined,
        frequency: (globalFilters.frequency && globalFilters.frequency !== 'All') ? globalFilters.frequency : undefined,
        stockLink: (globalFilters.stockLink && globalFilters.stockLink !== 'All') ? globalFilters.stockLink : undefined,
        assignedTo: (globalFilters.memberId && globalFilters.memberId !== 'All') ? globalFilters.memberId : (globalFilters.assignedTo || undefined),
        dualCheck: (globalFilters.dualCheck && globalFilters.dualCheck !== 'All') ? globalFilters.dualCheck : undefined,
        seqNo: globalFilters.seqNo || undefined,
        taskType: globalFilters.taskType || 'Mine',
        currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.name || undefined,
        pageCode: 'QM1140'
      };

      const response = await axios.get('/api/qms/checklist/assignments', { params });
      let displayRows = response.data.content || [];
      displayRows = displayRows.filter((r) => {
        const assignmentStatus = String(typeof r.status === 'object' ? r.status?.name : r.status || '').toUpperCase().trim();
        const verifyStatus = String(typeof r.verifyStatus === 'object' ? r.verifyStatus?.name : r.verifyStatus || '').toUpperCase().trim();
        
        // Show only completed records: Closed, Completed, Verified, or Accepted
        const isCompleted = 
          assignmentStatus === 'CLOSED' || 
          assignmentStatus === 'COMPLETED' || 
          assignmentStatus === 'VERIFIED' || 
          assignmentStatus === 'ACCEPTED';
          
        if (!isCompleted) return false;

        // Apply global filter status if not 'All'
        if (globalFilters.status && globalFilters.status !== 'All') {
          const filterVal = String(globalFilters.status).toUpperCase().trim();
          const masterVerify = String(typeof r.checklist?.verifyStatus === 'object' ? r.checklist?.verifyStatus?.name : r.checklist?.verifyStatus || '').toUpperCase().trim();
          const masterStatus = String(typeof r.checklist?.status === 'object' ? r.checklist?.status?.name : r.checklist?.status || '').toUpperCase().trim();
          if (filterVal === 'VERIFIED') {
            if (verifyStatus !== 'VERIFIED' && verifyStatus !== 'ACCEPTED' && masterVerify !== 'VERIFIED' && masterVerify !== 'RENEWAL VERIFIED' && masterVerify !== 'ACCEPTED') return false;
          } else {
            if (assignmentStatus !== filterVal && masterStatus !== filterVal) return false;
          }
        }

        if (!matchCommonDateFilters(r, globalFilters, 'createdDate', 'updatedDate')) return false;
        if (considerDate === 'Yes') {
          const startVal = globalFilters.createdDateStart;
          const endVal = globalFilters.createdDateEnd;
          if (startVal || endVal) {
            const rowDate = r.checklistDate ? new Date(r.checklistDate) : null;
            if (rowDate && !isNaN(rowDate.getTime())) {
              const checkDate = new Date(rowDate.setHours(0, 0, 0, 0));
              if (startVal && checkDate < new Date(new Date(startVal).setHours(0, 0, 0, 0))) return false;
              if (endVal && checkDate > new Date(new Date(endVal).setHours(0, 0, 0, 0))) return false;
            }
          }
        }
        return true;
      });

      setRows(displayRows);
      setTotalElements(displayRows.length);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchQuery, globalFilters, user]);

  useEffect(() => {
    if (globalFilters.status === undefined) return;
    fetchReportData();
  }, [fetchReportData, globalFilters.status]);

  return (
    <MainCard
      fullWidth
      title="Check List / Renewal Report"
      secondary={
        <BOSTableToolbar
          id="qms-checklist-renewal-report-table"
          onRefresh={fetchReportData}
          hasWritePermission={perms.write}
          columns={tableCols}
          exportData={rows}
          exportFilename="Checklist_Report"
          hasExportPermission={perms.export}
        />
      }
    >
      <BOSDataTable
        id="qms-checklist-renewal-report-table"
        columns={tableCols}
        rows={rows}
        page={page}
        size={size}
        totalCount={totalElements}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={(row) => { setSelectedRowId(row.id); setDialogOpen(true); }}
        onClickRow={(row) => setSelectedRowId(row.id)}
        selectedRowId={selectedRowId}
        disableSearchFilter={true}
      />

      <ExecutionVerifyDialog
        open={dialogOpen}
        handleClose={() => setDialogOpen(false)}
        data={activeRow}
        isExecution={false}
      />
    </MainCard>
  );
}
