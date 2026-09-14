import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Box, TextField, Button } from '@mui/material';
import { IconReportAnalytics, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { API_PATHS } from 'utils/api-constants';

// ==============================|| EMPLOYEE HOLIDAY YEARLY SUMMARY ||============================== //

export default function EmployeeHolidaySummaryReport() {
  const perms = usePagePermissions(PAGE_CODES.HRA_HOLIDAY_YEARLY_SUMMARY);
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!year) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API_PATHS.HRM.HOLIDAY_REQUESTS}/report/yearly-summary`, { params: { year } });
      setRows(Array.isArray(r.data) ? r.data : []);
    } catch (e) { console.error('Failed to fetch yearly summary:', e); }
    finally { setLoading(false); }
  }, [year]);

  // Fetch active leave types from Leave Master
  useEffect(() => {
    axios.get('/api/master/hr/leaves/active')
      .then((r) => setLeaveTypes(r.data || []))
      .catch((e) => console.error('Failed to fetch active leave types:', e));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Aggregate per employee
  const summary = useMemo(() => {
    const map = new Map();
    
    // We need to know all columns we will generate to initialize them to 0.
    const allLeaveTypeIds = new Set(leaveTypes.map((t) => t.leaveTypeId));
    (Array.isArray(rows) ? rows : []).forEach((r) => {
      if (r.leaveTypeId) {
        allLeaveTypeIds.add(r.leaveTypeId);
      }
    });

    (Array.isArray(rows) ? rows : []).forEach((r) => {
      const key = r.empId;
      if (!map.has(key)) {
        const base = {
          id: key,
          empId: r.empId,
          empCode: r.empCode,
          empName: r.empName,
          departmentName: r.departmentName || (r.departmentId ? `Dept ${r.departmentId}` : '-'),
          total: 0
        };
        // Initialize all known leave types to 0
        allLeaveTypeIds.forEach((id) => {
          base[`leave_${id}`] = 0;
        });
        map.set(key, base);
      }
      const item = map.get(key);
      const days = Number(r.numberOfDays) || 1.0;
      
      if (r.leaveTypeId) {
        const colId = `leave_${r.leaveTypeId}`;
        item[colId] = (item[colId] || 0) + days;
      } else {
        // Fallback matching by requestType/leaveCode
        const found = leaveTypes.find(
          (t) =>
            t.leaveCode === r.requestType ||
            (r.requestType === 'OPTIONAL_HOLIDAY' && t.leaveCode === 'OH') ||
            (r.requestType === 'PERSONAL_HOLIDAY' && t.leaveCode === 'PL')
        );
        if (found) {
          const colId = `leave_${found.leaveTypeId}`;
          item[colId] = (item[colId] || 0) + days;
        }
      }
      item.total += days;
    });
    return Array.from(map.values()).sort((a, b) => (a.empName || '').localeCompare(b.empName || ''));
  }, [rows, leaveTypes]);

  const columns = useMemo(() => {
    const cols = [
      { id: 'index', label: '#', minWidth: 50 },
      { id: 'empCode', label: 'Emp Code', minWidth: 110, bold: true },
      { id: 'empName', label: 'Employee', minWidth: 200 },
      { id: 'departmentName', label: 'Department', minWidth: 160 }
    ];

    const activeIds = new Set(leaveTypes.map((t) => t.leaveTypeId));
    leaveTypes.forEach((t) => {
      cols.push({
        id: `leave_${t.leaveTypeId}`,
        label: t.leaveName,
        minWidth: 140
      });
    });

    const extraLeaveTypes = new Map();
    (Array.isArray(rows) ? rows : []).forEach((r) => {
      if (r.leaveTypeId && !activeIds.has(r.leaveTypeId)) {
        if (!extraLeaveTypes.has(r.leaveTypeId)) {
          extraLeaveTypes.set(r.leaveTypeId, r.leaveTypeName || `Leave Type ${r.leaveTypeId}`);
        }
      }
    });

    extraLeaveTypes.forEach((name, id) => {
      cols.push({
        id: `leave_${id}`,
        label: name,
        minWidth: 140
      });
    });

    cols.push({ id: 'total', label: 'Total Approved', minWidth: 140, bold: true });
    return cols;
  }, [leaveTypes, rows]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconReportAnalytics}
      title={"Employee Holiday Summary — Yearly"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={summary}
          exportFilename={`Employee_Holiday_Summary_${year}`}
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
        <TextField type="number" size="small" label="Year" InputLabelProps={{ shrink: true }} value={year} onChange={(e) => setYear(Number(e.target.value) || '')} sx={{ width: 140 }} />
        <Button variant="contained" startIcon={<IconRefresh size={16} />} onClick={fetchData}>Apply</Button>
        <Box sx={{ ml: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            Employees: <strong>{summary.length}</strong> · Approved requests: <strong>{rows.length}</strong>
          </Typography>
        </Box>
      </Box>
      <BOSDataTable
        columns={columns}
        rows={summary}
        page={page}
        size={size}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
      />
    </MainCard>
  );
}
