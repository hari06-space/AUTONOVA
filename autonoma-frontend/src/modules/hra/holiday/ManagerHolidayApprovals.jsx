import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Chip, Tooltip, IconButton } from '@mui/material';
import { IconShieldCheck, IconEye } from '@tabler/icons-react';
import axios from 'utils/axios';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar,
  BOSStatusChip} from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { API_PATHS } from 'utils/api-constants';
import HolidayApprovalDialog from './HolidayApprovalDialog';

// ==============================|| MANAGER — LEAVE APPROVALS ||============================== //

const STATUS_COLOR = {
  DRAFT: 'default',
  PENDING: 'info',
  SUBMITTED: 'info',
  APPROVED: 'success',
  MANAGER_APPROVED: 'primary',
  HR_APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'warning'
};

const renderStatus = (row) => {
  const value = row?.status;
  return <BOSStatusChip status={value || 'PENDING'} showIcon />;
};

export default function ManagerHolidayApprovals() {
  const perms = usePagePermissions(PAGE_CODES.HRA_HOLIDAY_APPROVALS_MGR);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_PATHS.HRM.LEAVE_REQUESTS}/pending/manager`);
      setRows(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      console.error('Failed to fetch manager pending requests:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpen = (row) => { setSelected(row); setDialogOpen(true); };
  const handleClose = (refresh) => { setDialogOpen(false); setSelected(null); if (refresh === true) fetchData(); };

  const columns = useMemo(() => ([
    { id: 'index', label: '#', minWidth: 50 },
    { id: 'requestNo', label: 'Request No', minWidth: 140, bold: true },
    { id: 'empName', label: 'Employee Name', minWidth: 180 },
    { id: 'empCode', label: 'Emp Code', minWidth: 110 },
    { id: 'leaveTypeName', label: 'Leave Type', minWidth: 150 },
    { id: 'leaveDatesDisplay', label: 'Leave Dates', minWidth: 220 },
    { id: 'status', label: 'Status', minWidth: 140, render: renderStatus },
    { id: 'requestDateDisplay', label: 'Applied On', minWidth: 150 },
    { id: 'reason', label: 'Reason', minWidth: 200 },
    {
      id: 'actions', label: 'Action', minWidth: 100, render: (row) => (
        <Tooltip title="Review & Action">
          <IconButton size="small" color="success" onClick={() => handleOpen(row)} sx={{ bgcolor: 'success.light', color: 'success.dark', '&:hover': { bgcolor: 'success.main', color: 'white' } }}>
            <IconEye size={18} />
          </IconButton>
        </Tooltip>
      )
    }
  ]), []);

  const resolvedRows = useMemo(() => (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    id: row.leaveRequestId,
    leaveDatesDisplay: `${row.startDate ? format(new Date(row.startDate), 'dd/MM/yyyy') : '-'} to ${row.endDate ? format(new Date(row.endDate), 'dd/MM/yyyy') : '-'} (${row.numberOfDays} days)`,
    requestDateDisplay: row.requestDate ? format(new Date(row.requestDate), 'dd/MM/yyyy HH:mm') : '-'
  })), [rows]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconShieldCheck}
      title={"Manager — Leave Approvals"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={resolvedRows}
          exportFilename="Manager_Leave_Approvals"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        page={page}
        size={size}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleOpen}
      />
      <HolidayApprovalDialog open={dialogOpen} onClose={handleClose} request={selected} role="MANAGER" />
    </MainCard>
  );
}
