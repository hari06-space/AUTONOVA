import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Chip, Box, TextField, Button } from '@mui/material';
import { IconCalendar, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar,
  BOSStatusChip} from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { API_PATHS } from 'utils/api-constants';

// ==============================|| HOLIDAY CALENDAR REPORT ||============================== //

const STATUS_COLOR = { MANAGER_APPROVED: 'primary', HR_APPROVED: 'success' };
const renderStatus = (row) => {
  const value = row?.status;
  return <BOSStatusChip status={value} showIcon />;
};

const isoDate = (d) => d.toISOString().slice(0, 10);

export default function HolidayCalendarReport() {
  const perms = usePagePermissions(PAGE_CODES.HRA_HOLIDAY_CALENDAR_REPORT);
  const today = new Date();
  const [fromDate, setFromDate] = useState(isoDate(startOfMonth(today)));
  const [toDate, setToDate] = useState(isoDate(endOfMonth(today)));
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);

  const fetchData = useCallback(async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const [reqs, masters] = await Promise.all([
        axios.get(`${API_PATHS.HRM.HOLIDAY_REQUESTS}/report/calendar`, { params: { from: fromDate, to: toDate } }),
        axios.get(`${API_PATHS.HRM.HOLIDAYS}/calendar`, { params: { from: fromDate, to: toDate } })
      ]);
      setRows(Array.isArray(reqs.data) ? reqs.data : []);
      setHolidays(Array.isArray(masters.data) ? masters.data : []);
    } catch (e) { console.error('Failed to fetch calendar report:', e); }
    finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = useMemo(() => ([
    { id: 'index', label: '#', minWidth: 50 },
    { id: 'holidayDateDisplay', label: 'Date', minWidth: 120, bold: true },
    { id: 'holidayDay', label: 'Day', minWidth: 100 },
    { id: 'holidayName', label: 'Holiday', minWidth: 180 },
    { id: 'requestType', label: 'Type', minWidth: 150 },
    { id: 'empName', label: 'Employee', minWidth: 180 },
    { id: 'empCode', label: 'Emp Code', minWidth: 110 },
    { id: 'departmentName', label: 'Department', minWidth: 160 },
    { id: 'status', label: 'Status', minWidth: 140, render: renderStatus }
  ]), []);

  const resolvedRows = useMemo(() => (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    id: row.requestId,
    holidayDateDisplay: row.holidayDate ? format(new Date(row.holidayDate), 'dd/MM/yyyy') : '-'
  })), [rows]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconCalendar}
      title={"Holiday Calendar Report"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={resolvedRows}
          exportFilename="Holiday_Calendar_Report"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
        <TextField type="date" size="small" label="From" InputLabelProps={{ shrink: true }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <TextField type="date" size="small" label="To" InputLabelProps={{ shrink: true }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <Button variant="contained" startIcon={<IconRefresh size={16} />} onClick={fetchData}>Apply</Button>
        <Box sx={{ ml: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            Company holidays in range: <strong>{holidays.length}</strong> · Approved employee requests: <strong>{resolvedRows.length}</strong>
          </Typography>
        </Box>
      </Box>
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        page={page}
        size={size}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
      />
    </MainCard>
  );
}
