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

// ==============================|| HR — HOLIDAY APPROVALS ||============================== //

const STATUS_COLOR = { SUBMITTED: 'info', MANAGER_APPROVED: 'primary', HR_APPROVED: 'success', REJECTED: 'error', CANCELLED: 'warning' };
const renderStatus = (row) => {
  const value = row?.status;
  return <BOSStatusChip status={value} showIcon />;
};

export default function HRHolidayApprovals() {
  const perms = usePagePermissions(PAGE_CODES.HRA_HOLIDAY_APPROVALS_HR);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_PATHS.HRM.HOLIDAY_REQUESTS}/pending/hr`);
      setRows(Array.isArray(r.data) ? r.data : []);
    } catch (e) { console.error('Failed to fetch HR pending requests:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpen = (row) => { setSelected(row); setDialogOpen(true); };
  const handleClose = (refresh) => { setDialogOpen(false); setSelected(null); if (refresh === true) fetchData(); };

  const columns = useMemo(() => ([
    { id: 'index', label: '#', minWidth: 50 },
    { id: 'requestNo', label: 'Request No', minWidth: 140, bold: true },
    { id: 'empName', label: 'Employee', minWidth: 180 },
    { id: 'empCode', label: 'Emp Code', minWidth: 110 },
    { id: 'managerName', label: 'Approved By Manager', minWidth: 180 },
    { id: 'requestType', label: 'Type', minWidth: 150 },
    { id: 'holidayName', label: 'Holiday', minWidth: 180 },
    { id: 'holidayDateDisplay', label: 'Date', minWidth: 120 },
    { id: 'status', label: 'Status', minWidth: 140, render: renderStatus },
    { id: 'managerActionDateDisplay', label: 'Mgr Approved On', minWidth: 160 },
    {
      id: 'actions', label: 'Action', minWidth: 100, render: (row) => (
        <Tooltip title="Review & Approve">
          <IconButton size="small" color="success" onClick={() => handleOpen(row)} sx={{ bgcolor: 'success.light', color: 'success.dark', '&:hover': { bgcolor: 'success.main', color: 'white' } }}>
            <IconEye size={18} />
          </IconButton>
        </Tooltip>
      )
    }
  ]), []);

  const resolvedRows = useMemo(() => (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    id: row.requestId,
    holidayDateDisplay: row.holidayDate ? format(new Date(row.holidayDate), 'dd/MM/yyyy') : '-',
    managerActionDateDisplay: row.managerActionDate ? format(new Date(row.managerActionDate), 'dd/MM/yyyy HH:mm') : '-'
  })), [rows]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconShieldCheck}
      title={"HR — Holiday Approvals"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={resolvedRows}
          exportFilename="HR_Holiday_Approvals"
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
      <HolidayApprovalDialog open={dialogOpen} onClose={handleClose} request={selected} role="HR" />
    </MainCard>
  );
}
