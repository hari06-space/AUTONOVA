import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, Stack, Tooltip
} from '@mui/material';
import { IconChartBar } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { tableContainerSx, tableHeadCellSx } from 'ui-component/bos/BOSStyles';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { BOSTableToolbar } from 'ui-component/bos';
import { useTheme } from '@mui/material/styles';

/* ──────── column export definitions ──────── */
const EXPORT_COLUMNS = [
  { header: 'Sl.No', key: 'Sl.No' },
  { header: 'Employee Code', key: 'Employee Code' },
  { header: 'Employee Name', key: 'Employee Name' },
  { header: 'Total Points', key: 'Total Points' },
  { header: 'Closed', key: 'Closed' },
  { header: 'Cancelled', key: 'Cancelled' },
  { header: 'Pending Approval', key: 'Pending Approval' },
  { header: 'Unresolved', key: 'Unresolved' },
  { header: 'Open', key: 'Open' },
  { header: 'Overdue Pending Approval', key: 'Overdue Pending Approval' },
  { header: 'Overdue Unresolved', key: 'Overdue Unresolved' },
  { header: 'Overdue Open', key: 'Overdue Open' },
  { header: 'Total OverDue Count', key: 'Total OverDue Count' },
  { header: 'Average OverDue Days', key: 'Average OverDue Days' },
  { header: 'Reward Score', key: 'Reward Score' },
  { header: 'Penalty Score', key: 'Penalty Score' }
];

/* ──────── grouped header band colours ──────── */
const POINTS_BG   = '#e8f5e9'; // soft green
const OVERDUE_BG  = '#fff3e0'; // soft orange
const SCORE_BG    = '#eeeeee'; // darker gray
const POINTS_BG_DARK   = '#1b5e20';
const OVERDUE_BG_DARK  = '#e65100';
const SCORE_BG_DARK    = '#424242';

const MomSummaryReportList = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const globalQuery = useSelector((state) => state.search.query);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Drill-down: click a count cell → navigate to MOM Report pre-filtered ──
  const handleDrillDown = (employeeName, statusLabel) => {
    const params = new URLSearchParams();
    if (employeeName) params.set('employee', employeeName);
    if (statusLabel) params.set('status', statusLabel);
    navigate(`/qms/momreport?${params.toString()}`);
  };

  /* ──────── register global search filters ──────── */
  useEffect(() => {
    dispatch(setFilterConfig([
      {
        id: 'type', label: 'Scope', type: 'select',
        options: [{ value: 'Mine', label: 'Mine' }, { value: 'Team', label: 'Team' }, { value: 'Company', label: 'Company' }],
        defaultValue: 'Mine', isStarred: true
      },
      { id: 'meetingDate', label: 'Meeting Date', type: 'dateRange', isStarred: true },
      {
        id: 'status', label: 'Status', type: 'select',
        options: [{ value: 'ALL', label: '-Status-' }, { value: 'OPEN', label: 'OPEN' }, { value: 'CLOSED', label: 'CLOSED' }, { value: 'Pending for Verified', label: 'Pending for Verified' }, { value: 'Accepted', label: 'Accepted' }, { value: 'Rejected', label: 'Rejected' }, { value: 'Cancelled', label: 'Cancelled' }],
        defaultValue: 'ALL'
      },
      { id: 'department', label: 'Department', type: 'text', defaultValue: '' },
      { id: 'employeeName', label: 'Employee Name', type: 'text', defaultValue: '' }
    ]));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  /* ──────── fetch data from backend ──────── */
  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (globalFilters.type && globalFilters.type !== 'Mine') params.type = globalFilters.type;
      if (globalFilters.meetingDateStart) params.fromDate = globalFilters.meetingDateStart;
      if (globalFilters.meetingDateEnd) params.toDate = globalFilters.meetingDateEnd;
      params.considerDate = globalFilters.meetingDateConsider || 'Yes';
      if (globalFilters.status && globalFilters.status !== 'ALL') params.status = globalFilters.status;
      if (globalFilters.department) params.department = globalFilters.department;
      if (globalFilters.employeeName) params.employeeName = globalFilters.employeeName;
      // Also support the global search bar query as employee name filter
      if (globalQuery && globalQuery.trim()) {
        params.employeeName = globalQuery.trim();
      }
      const res = await axios.get('/api/qms/mom-summary-report', { params });
      setReports(res.data);
    } catch (err) {
      console.error('Failed to fetch MOM Summary Report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilters, globalQuery]);

  /* ──────── export data ──────── */
  const exportData = useMemo(() => {
    return reports.map((r, idx) => ({
      'Sl.No': idx + 1,
      'Employee Code': r.employeeCode || '-',
      'Employee Name': r.employeeName || '-',
      'Total Points': r.totalPoints ?? 0,
      'Closed': r.closed ?? 0,
      'Cancelled': r.cancelled ?? 0,
      'Pending Approval': r.pendingApproval ?? 0,
      'Unresolved': r.unresolved ?? 0,
      'Open': r.open ?? 0,
      'Overdue Pending Approval': r.overduePendingApproval ?? 0,
      'Overdue Unresolved': r.overdueUnresolved ?? 0,
      'Overdue Open': r.overdueOpen ?? 0,
      'Total OverDue Count': r.totalOverdueCount ?? 0,
      'Average OverDue Days': r.avgOverdueDays ?? 0,
      'Reward Score': `${r.rewardScore ?? 0}%`,
      'Penalty Score': `${r.penaltyScore ?? 0}%`,
      'Final Score': `${r.finalScore ?? 0}%`
    }));
  }, [reports]);

  /* ──────── shared header cell sx helpers ──────── */
  const groupHeaderSx = (bg) => ({
    bgcolor: bg,
    color: isDark ? '#fff' : '#333',
    fontWeight: 700,
    fontSize: '0.78rem',
    textAlign: 'center',
    py: 1.2,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid',
    borderColor: 'divider',
    whiteSpace: 'nowrap'
  });

  const subHeaderSx = (bg) => ({
    bgcolor: bg,
    color: isDark ? '#eee' : '#444',
    fontWeight: 600,
    fontSize: '0.72rem',
    textAlign: 'center',
    py: 1,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    borderBottom: 'none',
    whiteSpace: 'nowrap'
  });

  const bodyCellSx = {
    textAlign: 'center',
    py: 1.2,
    fontSize: '0.82rem',
    borderBottom: '1px solid',
    borderColor: 'divider'
  };

  const pBg = isDark ? POINTS_BG_DARK : POINTS_BG;
  const oBg = isDark ? OVERDUE_BG_DARK : OVERDUE_BG;
  const sBg = isDark ? SCORE_BG_DARK : SCORE_BG;

  return (
    <MainCard
      fullWidth
      title={
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex' }}>
            <IconChartBar size={22} color={isDark ? '#fff' : '#1e88e5'} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>MOM Summary Report</Typography>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          onRefresh={fetchReports}
          exportData={exportData}
          exportColumns={EXPORT_COLUMNS}
          exportFilename="MOM_Summary_Report"
          hasExportPermission={true}
        />
      }
      content={false}
    >
      {/* ─── Data Table ─── */}
      <TableContainer sx={tableContainerSx}>
        {loading && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%', zIndex: 2 }} />}
        <Table stickyHeader size="small">
          <TableHead>
            {/* ─── Row 1: Group header bands ─── */}
            <TableRow>
              {/* Base identity — 3 cols */}
              <TableCell rowSpan={2} sx={{ ...tableHeadCellSx, textAlign: 'center', minWidth: 55 }}>Sl.No</TableCell>
              <TableCell rowSpan={2} sx={{ ...tableHeadCellSx, textAlign: 'center', minWidth: 110 }}>Employee Code</TableCell>
              <TableCell rowSpan={2} sx={{ ...tableHeadCellSx, textAlign: 'left', minWidth: 170, borderRight: '2px solid rgba(224, 224, 224, 1)' }}>Employee Name</TableCell>
              {/* Points Summary — 6 cols */}
              <TableCell colSpan={6} sx={{ ...groupHeaderSx(pBg), borderRight: '2px solid rgba(224, 224, 224, 1)' }}>Points Summary</TableCell>
              {/* Overdue Summary — 5 cols */}
              <TableCell colSpan={5} sx={{ ...groupHeaderSx(oBg), borderRight: '2px solid rgba(224, 224, 224, 1)' }}>Overdue Summary</TableCell>
              {/* Score Summary — 3 cols */}
              <TableCell colSpan={3} sx={groupHeaderSx(sBg)}>Score Summary</TableCell>
            </TableRow>

            {/* ─── Row 2: Sub-column headers ─── */}
            <TableRow>
              {/* Points sub-headers */}
              <TableCell sx={subHeaderSx(pBg)}>Total Points</TableCell>
              <TableCell sx={subHeaderSx(pBg)}>Closed</TableCell>
              <TableCell sx={subHeaderSx(pBg)}>Cancelled</TableCell>
              <TableCell sx={subHeaderSx(pBg)}>Pending Approval</TableCell>
              <TableCell sx={subHeaderSx(pBg)}>Unresolved</TableCell>
              <TableCell sx={{ ...subHeaderSx(pBg), borderRight: '2px solid rgba(224, 224, 224, 1)' }}>Open</TableCell>
              {/* Overdue sub-headers */}
              <TableCell sx={subHeaderSx(oBg)}>Pending Approval</TableCell>
              <TableCell sx={subHeaderSx(oBg)}>Unresolved</TableCell>
              <TableCell sx={subHeaderSx(oBg)}>Open</TableCell>
              <TableCell sx={subHeaderSx(oBg)}>Total OverDue Count</TableCell>
              <TableCell sx={{ ...subHeaderSx(oBg), borderRight: '2px solid rgba(224, 224, 224, 1)' }}>Average OverDue Days</TableCell>
              {/* Score sub-headers */}
              <TableCell sx={subHeaderSx(sBg)}>Reward Score</TableCell>
              <TableCell sx={subHeaderSx(sBg)}>Penalty Score</TableCell>
              <TableCell sx={subHeaderSx(sBg)}>Final Score</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {reports.map((row, idx) => (
              <TableRow
                key={idx}
                sx={{
                  '&:nth-of-type(even)': { bgcolor: isDark ? 'grey.900' : '#fafafa' },
                  '&:hover': { bgcolor: isDark ? 'grey.800' : 'grey.50' },
                  transition: 'background-color 180ms ease'
                }}
              >
                {/* Base identity */}
                <TableCell sx={bodyCellSx}>{idx + 1}</TableCell>
                <TableCell sx={bodyCellSx}>{row.employeeCode || '-'}</TableCell>
                <TableCell sx={{ ...bodyCellSx, textAlign: 'left', textTransform: 'uppercase', fontWeight: 600, borderRight: '2px solid rgba(224, 224, 224, 1)' }}>
                  {row.employeeName || '-'}
                </TableCell>
                {/* Points Summary */}
                <TableCell sx={{ ...bodyCellSx, fontWeight: 700 }}>{row.totalPoints ?? 0}</TableCell>
                <Tooltip title="Click to view Closed records" placement="top">
                  <TableCell
                    sx={{ ...bodyCellSx, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', color: 'primary.main', fontWeight: 700 } }}
                    onClick={() => handleDrillDown(row.employeeName, 'Closed')}
                  >{row.closed ?? 0}</TableCell>
                </Tooltip>
                <Tooltip title="Click to view Cancelled records" placement="top">
                  <TableCell
                    sx={{ ...bodyCellSx, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', color: 'primary.main', fontWeight: 700 } }}
                    onClick={() => handleDrillDown(row.employeeName, 'Cancelled')}
                  >{row.cancelled ?? 0}</TableCell>
                </Tooltip>
                <Tooltip title="Click to view Pending Approval records" placement="top">
                  <TableCell
                    sx={{ ...bodyCellSx, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', color: 'primary.main', fontWeight: 700 } }}
                    onClick={() => handleDrillDown(row.employeeName, 'Pending for Verified')}
                  >{row.pendingApproval ?? 0}</TableCell>
                </Tooltip>
                <Tooltip title="Click to view Unresolved records" placement="top">
                  <TableCell
                    sx={{ ...bodyCellSx, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', color: 'primary.main', fontWeight: 700 } }}
                    onClick={() => handleDrillDown(row.employeeName, 'UNRESOLVED')}
                  >{row.unresolved ?? 0}</TableCell>
                </Tooltip>
                <Tooltip title="Click to view Open records" placement="top">
                  <TableCell
                    sx={{ ...bodyCellSx, cursor: 'pointer', borderRight: '2px solid rgba(224, 224, 224, 1)', '&:hover': { bgcolor: 'action.hover', color: 'primary.main', fontWeight: 700 } }}
                    onClick={() => handleDrillDown(row.employeeName, 'OPEN')}
                  >{row.open ?? 0}</TableCell>
                </Tooltip>
                {/* Overdue Summary */}
                <Tooltip title="Click to view Overdue Pending Approval records" placement="top">
                  <TableCell
                    sx={{ ...bodyCellSx, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', color: 'error.main', fontWeight: 700 } }}
                    onClick={() => handleDrillDown(row.employeeName, 'Pending for Verified')}
                  >{row.overduePendingApproval ?? 0}</TableCell>
                </Tooltip>
                <Tooltip title="Click to view Overdue Unresolved records" placement="top">
                  <TableCell
                    sx={{ ...bodyCellSx, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', color: 'error.main', fontWeight: 700 } }}
                    onClick={() => handleDrillDown(row.employeeName, 'UNRESOLVED')}
                  >{row.overdueUnresolved ?? 0}</TableCell>
                </Tooltip>
                <Tooltip title="Click to view Overdue Open records" placement="top">
                  <TableCell
                    sx={{ ...bodyCellSx, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', color: 'error.main', fontWeight: 700 } }}
                    onClick={() => handleDrillDown(row.employeeName, 'OPEN')}
                  >{row.overdueOpen ?? 0}</TableCell>
                </Tooltip>
                <TableCell sx={{ ...bodyCellSx, fontWeight: 700, color: (row.totalOverdueCount ?? 0) > 0 ? 'error.main' : 'inherit' }}>
                  {row.totalOverdueCount ?? 0}
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, borderRight: '2px solid rgba(224, 224, 224, 1)' }}>{row.avgOverdueDays ?? 0}</TableCell>
                {/* Score Summary */}
                <TableCell sx={{ ...bodyCellSx, color: (row.rewardScore ?? 0) > 0 ? 'success.main' : 'inherit', fontWeight: 600 }}>
                  {row.rewardScore ?? 0}%
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, color: (row.penaltyScore ?? 0) > 0 ? 'error.main' : 'inherit', fontWeight: 600 }}>
                  {row.penaltyScore ?? 0}%
                </TableCell>
                <TableCell sx={{ ...bodyCellSx, color: (row.finalScore ?? 0) > 0 ? 'success.main' : ((row.finalScore ?? 0) < 0 ? 'error.main' : 'inherit'), fontWeight: 800 }}>
                  {row.finalScore ?? 0}%
                </TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={17} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="textSecondary">No Data Found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </MainCard>
  );
};

export default MomSummaryReportList;
