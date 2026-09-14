import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Stack, Box } from '@mui/material';
import { IconClipboardList } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import axios from 'utils/axios';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTableToolbar, BOSStatusChip, BOSExportButton } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import MomApprovalDialog from 'modules/qms/MomApproval/MomApprovalDialog';

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim();
};

const MomReportList = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const globalQuery = useSelector((state) => state.search.query);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (globalFilters.meetingDateStart) params.fromDate = globalFilters.meetingDateStart;
      if (globalFilters.meetingDateEnd) params.toDate = globalFilters.meetingDateEnd;
      if (globalFilters.status && globalFilters.status !== 'ALL') params.status = globalFilters.status;
      if (globalFilters.process && globalFilters.process !== 'ALL') params.process = globalFilters.process;
      
      if (globalFilters.type && globalFilters.type !== 'Mine') params.type = globalFilters.type;

      // Map global search query to actionValue if an actionType is selected
      if (globalFilters.actionType && globalFilters.actionType !== 'ALL' && globalQuery) {
        params.actionType = globalFilters.actionType;
        params.actionValue = globalQuery;
      }

      const res = await axios.get('/api/qms/mom-report', { params });
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(setFilterConfig([
      {
        id: 'type', label: 'Scope', type: 'select',
        options: [{ value: 'Mine', label: 'Mine' }, { value: 'Team', label: 'Team' }, { value: 'Company', label: 'Company' }],
        defaultValue: 'Mine', isStarred: true
      },
      { id: 'meetingDate', label: 'Meeting Date', type: 'dateRange', isStarred: true, defaultValue: null },
      {
        id: 'status', label: '-Status-', type: 'select',
        options: [{ value: 'ALL', label: '-Status-' }, { value: 'OPEN', label: 'OPEN' }, { value: 'CLOSED', label: 'CLOSED' }, { value: 'Pending for Verified', label: 'Pending for Verified' }, { value: 'Accepted', label: 'Accepted' }, { value: 'Rejected', label: 'Rejected' }, { value: 'Cancelled', label: 'Cancelled' }],
        defaultValue: 'ALL'
      },
      {
        id: 'process', label: '-Process-', type: 'select',
        options: [{ value: 'ALL', label: '-Process-' }, { value: 'Action', label: 'Action' }, { value: 'Information', label: 'Information' }],
        defaultValue: 'ALL'
      },
      {
        id: 'actionType', label: '-Select Action-', type: 'select',
        options: [{ value: 'ALL', label: '-Select Action-' }, { value: 'Assigned By', label: 'Assigned By' }, { value: 'Assigned To', label: 'Assigned To' }],
        defaultValue: 'ALL'
      }
    ]));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilters, globalQuery]);


  const EXPORT_COLUMNS = [
    { header: 'Meeting Type', key: 'Meeting Type' },
    { header: 'Meeting Schedule No', key: 'Meeting Schedule No' },
    { header: 'Meeting Minutes Date', key: 'Meeting Minutes Date' },
    { header: 'Process', key: 'Process' },
    { header: 'Meeting Minutes No', key: 'Meeting Minutes No' },
    { header: 'Discussed Points', key: 'Discussed Points' },
    { header: 'Assigned By', key: 'Assigned By' },
    { header: 'Assigned To', key: 'Assigned To' },
    { header: 'Status', key: 'Status' }
  ];

  const flatReports = useMemo(() => {
    const flat = [];
    let idx = 1;
    reports.forEach((report) => {
      const details = report.details || [];
      details.forEach((det) => {
        flat.push({
          id: det.id || `${report.id}-${idx}`,
          index: idx++,
          meetingType: report.meetingType || '-',
          scheduleNo: report.scheduleNo || '-',
          meetingDate: report.meetingDate ? format(new Date(report.meetingDate), 'dd/MM/yyyy') : '-',
          processType: det.processType || '-',
          minutesNo: det.minutesNo || '-',
          discussedPoints: stripHtml(det.discussedPoints) || '-',
          assignedBy: (det.assignedBy || '-').toUpperCase(),
          assignedTo: (det.assignedTo || '-').toUpperCase(),
          status: det.status || '-',
          // Map exact keys for exportData
          'Meeting Type': report.meetingType || '-',
          'Meeting Schedule No': report.scheduleNo || '-',
          'Meeting Minutes Date': report.meetingDate ? format(new Date(report.meetingDate), 'dd/MM/yyyy') : '-',
          'Process': det.processType || '-',
          'Meeting Minutes No': det.minutesNo || '-',
          'Discussed Points': stripHtml(det.discussedPoints) || '-',
          'Assigned By': (det.assignedBy || '-').toUpperCase(),
          'Assigned To': (det.assignedTo || '-').toUpperCase(),
          'Status': det.status || '-'
        });
      });
    });
    return flat;
  }, [reports]);

  // ── CLIENT-SIDE SEARCH: applies globalQuery across all flat columns (Issue 24) ──
  const filteredFlatReports = useMemo(() => {
    if (!globalQuery || !globalQuery.trim()) return flatReports;
    const q = globalQuery.trim().toLowerCase();
    return flatReports.filter(row =>
      (row.meetingType || '').toLowerCase().includes(q) ||
      (row.scheduleNo || '').toLowerCase().includes(q) ||
      (row.minutesNo || '').toLowerCase().includes(q) ||
      (row.processType || '').toLowerCase().includes(q) ||
      (row.discussedPoints || '').toLowerCase().includes(q) ||
      (row.assignedBy || '').toLowerCase().includes(q) ||
      (row.assignedTo || '').toLowerCase().includes(q) ||
      (row.status || '').toLowerCase().includes(q)
    );
  }, [flatReports, globalQuery]);

  // ── PAGINATION (Issue 25) ─────────────────────────────────────────────────────
  const paginatedRows = useMemo(
    () => filteredFlatReports.slice(page * size, page * size + size),
    [filteredFlatReports, page, size]
  );

  const columns = [
    { id: 'index', label: '#', minWidth: 50 },
    { id: 'meetingType', label: 'Meeting Type', minWidth: 130 },
    { id: 'scheduleNo', label: 'Meeting Schedule No', minWidth: 180 },
    { id: 'meetingDate', label: 'Meeting Minutes Date', minWidth: 160 },
    { id: 'processType', label: 'Process', minWidth: 120 },
    { id: 'minutesNo', label: 'Meeting Minutes No', minWidth: 160 },
    { id: 'discussedPoints', label: 'Discussed Points', minWidth: 250 },
    { id: 'assignedBy', label: 'Assigned By', minWidth: 150 },
    { id: 'assignedTo', label: 'Assigned To', minWidth: 150 },
    { id: 'status', label: 'Status', minWidth: 150, renderCell: (val) => <BOSStatusChip status={val} /> },
    { id: 'pdf', label: 'Export', minWidth: 80, align: 'center', renderCell: (val, row) => {
      const singleRow = {};
      EXPORT_COLUMNS.forEach(col => {
        singleRow[col.header] = row[col.header];
      });
      return (
        <BOSExportButton
          data={[singleRow]}
          columns={EXPORT_COLUMNS}
          filename={`MOM_Report_${row.scheduleNo?.replace(/\//g, '_') || 'Single'}`}
          iconOnly={true}
          color="primary"
          tooltip="Export Record"
        />
      );
    }}
  ];

  return (
    <>
      <MainCard
        fullWidth
        title={
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
            <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex' }}>
              <IconClipboardList size={22} color={isDark ? '#fff' : '#1e88e5'} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>MOM Report</Typography>
          </Stack>
        }
        secondary={
          <BOSTableToolbar
            onRefresh={fetchReports}
          exportData={filteredFlatReports}
            exportColumns={EXPORT_COLUMNS}
            exportFilename="MOM_Report"
            hasExportPermission={true}
          />
        }
        content={false}
      >
        <BOSDataTable
          id="mom-report-table"
          columns={columns}
          rows={paginatedRows}
          page={page}
          size={size}
          totalCount={filteredFlatReports.length}
          loading={loading}
          initialSort={{ orderBy: 'index', order: 'asc' }}
          onPageChange={(p) => { setPage(p); }}
          onSizeChange={(s) => { setSize(s); setPage(0); }}
          onDoubleClickRow={async (row) => {
            try {
              const res = await axios.get(`${API_PATHS.QMS.MOM_ACTIONS}/${row.id}`);
              const fullItem = res.data;
              if (fullItem) {
                setSelectedRow(fullItem);
                setDialogOpen(true);
              }
            } catch {
              setSelectedRow(row);
              setDialogOpen(true);
            }
          }}
        />
      </MainCard>

      {dialogOpen && selectedRow && (
        <MomApprovalDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setSelectedRow(null); }}
          item={{ id: selectedRow.id, minutesDetailId: selectedRow.id }}
          onAction={() => { setDialogOpen(false); fetchReports(); }}
        />
      )}
    </>
  );
};

export default MomReportList;
