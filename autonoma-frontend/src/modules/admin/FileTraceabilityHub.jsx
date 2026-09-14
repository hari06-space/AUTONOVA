import React, { useEffect, useState, useMemo } from 'react';

// material-ui
import {
  Box,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Avatar,
  Stack,
  LinearProgress,
  Button,
  useTheme,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';

// third-party
import Chart from 'react-apexcharts';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, resetFilters } from 'store/slices/search';
import { exportToExcel } from 'utils/excelExport';
import { getUserImageUrl } from 'utils/upload-helper';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import BOSDataTable from 'ui-component/bos/BOSDataTable';

// assets
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DownloadIcon from '@mui/icons-material/Download';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';

// ==============================|| MINI CHART CARD ||============================== //

const HeaderStatCard = ({ title, count, color, icon }) => {
  const theme = useTheme();

  const chartOptions = {
    chart: { type: 'area', sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
    colors: [color],
    tooltip: { enabled: false }
  };

  return (
    <Paper elevation={0} sx={{
      p: 1.2,
      width: 140,
      height: 75,
      borderRadius: '12px',
      bgcolor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
        <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', zIndex: 1 }}>{count}</Typography>
      <Box sx={{ position: 'absolute', bottom: -5, left: 0, right: 0, height: 35 }}>
        <Chart options={chartOptions} series={[{ data: [10, 15, 8, 22, 14, 25, 18] }]} type="area" height={40} />
      </Box>
    </Paper>
  );
};

// ==============================|| FILE TRACEABILITY HUB PAGE ||============================== //

const API_BASE = (import.meta.env.VITE_APP_API_URL || window.location.origin).replace(/\/+$/, '');

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const FileTraceabilityHub = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const perms = usePagePermissions(PAGE_CODES.AD_FILE_TRACEABILITY);

  const globalSearch = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Preview States
  const [selectedPreviewLog, setSelectedPreviewLog] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);

  useEffect(() => {
    const traceFilterConfig = [
      { id: 'pageName', label: 'Page Name', type: 'text', isStarred: true },
      { id: 'reportName', label: 'Report Name', type: 'text', isStarred: true },
      { id: 'createdBy', label: 'User ID', type: 'text', isStarred: true },
      { id: 'singleDate', label: 'Single Date', type: 'date', isStarred: true },
      { id: 'startDate', label: 'Start Date', type: 'date', isStarred: true },
      { id: 'endDate', label: 'End Date', type: 'date', isStarred: true }
    ];
    dispatch(setFilterConfig(traceFilterConfig));
    loadLogs();
    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
    };
  }, [dispatch]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/file-traceability?_t=${new Date().getTime()}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading file traceability logs:', error);
      setSnackbar({ open: true, message: 'Failed to load file traceability logs', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewClick = async (log) => {
    setSelectedPreviewLog(log);
    setPreviewTab(log.reportName?.toLowerCase().endsWith('.pdf') ? 1 : 0);

    if (!log.filePath) {
      setPreviewData(null);
      setPreviewDialogOpen(true);
      return;
    }

    try {
      setPreviewLoading(true);
      const res = await axios.get(`/api/files/view?path=${encodeURIComponent(log.filePath)}`);
      setPreviewData(res.data);
      setPreviewDialogOpen(true);
    } catch (err) {
      console.error("Failed to load report preview data:", err);
      setSnackbar({ open: true, message: 'Could not load report preview data from server.', severity: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrintPDF = () => {
    try {
      if (!previewData) return;

      let iframe = document.getElementById('pdf-print-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'pdf-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
      }

      const timestamp = new Date(previewData.timestamp || selectedPreviewLog.createdAt).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const columnsHtml = (previewData.columns || []).map(col => `
        <th style="padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #ddd; background-color: #673ab7; color: white;">
          ${col.header || col.label || col.id}
        </th>
      `).join('');

      const rowsHtml = (previewData.data || []).map((row, idx) => `
        <tr style="border-bottom: 1px solid #eee; background-color: ${idx % 2 === 0 ? 'transparent' : '#fafafa'};">
          ${(previewData.columns || []).map(col => `
            <td style="padding: 10px 8px; font-size: 10px; color: #444;">
              ${row[col.header || col.id] || '-'}
            </td>
          `).join('')}
        </tr>
      `).join('');

      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <title>${previewData.filename || 'export'}</title>
            <style>
              body { font-family: 'Inter', 'Roboto', sans-serif; margin: 0; padding: 20px; }
              .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border-bottom: 3px solid #673ab7; padding-bottom: 15px; }
              .summary-box { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #673ab7; border-radius: 4px; margin-bottom: 25px; }
              .data-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .footer { border-top: 1px solid #eee; padding-top: 15px; text-align: center; color: #aaa; font-size: 10px; margin-top: 50px; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <table class="header-table">
              <tr>
                <td style="vertical-align: top;">
                  <h1 style="margin: 0; color: #673ab7; font-size: 28px; font-weight: 900; letter-spacing: -1px;">AUTONOMA</h1>
                  <span style="font-size: 10px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px;">Business Operating System</span>
                </td>
                <td style="text-align: right; vertical-align: top;">
                  <h3 style="margin: 0; font-size: 18px; color: #333;">${(previewData.filename || '').replace(/_/g, ' ')}</h3>
                  <div style="font-size: 11px; color: #666; margin-top: 5px;">
                    Generated By: ${selectedPreviewLog.creatorName || selectedPreviewLog.createdBy || 'System User'}<br>
                    Date: ${timestamp}
                  </div>
                </td>
              </tr>
            </table>

            <div class="summary-box">
              <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #333;">Report Summary</h4>
              <span style="font-size: 11px; color: #666;">This document contains ${previewData.data.length} verified records from the Autonoma ERP database.</span>
            </div>

            <table class="data-table">
              <thead>
                <tr>${columnsHtml}</tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="footer">
              Confidential Report | © ${new Date().getFullYear()} Autonoma ERP
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 500);
    } catch (error) {
      console.error("PDF download/print failed:", error);
      setSnackbar({ open: true, message: 'PDF print failed: ' + error.message, severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // Filtering Logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = !globalSearch ||
      (log.pageName && log.pageName.toLowerCase().includes(globalSearch.toLowerCase())) ||
      (log.page?.pageCode && log.page.pageCode.toLowerCase().includes(globalSearch.toLowerCase())) ||
      (log.pageCode && log.pageCode.toLowerCase().includes(globalSearch.toLowerCase())) ||
      (log.reportName && log.reportName.toLowerCase().includes(globalSearch.toLowerCase())) ||
      (log.createdBy && log.createdBy.toLowerCase().includes(globalSearch.toLowerCase()));

    const matchesPage = !globalFilters.pageName || (log.pageName && log.pageName.toLowerCase().includes(globalFilters.pageName.toLowerCase()));
    const matchesReport = !globalFilters.reportName || (log.reportName && log.reportName.toLowerCase().includes(globalFilters.reportName.toLowerCase()));
    const matchesUser = !globalFilters.createdBy || (log.createdBy && log.createdBy.toLowerCase().includes(globalFilters.createdBy.toLowerCase()));

    // Date Filtering
    if (!log.createdAt) return matchesSearch && matchesPage && matchesReport && matchesUser;

    const logDate = new Date(log.createdAt);
    logDate.setHours(0, 0, 0, 0);

    let matchesSingleDate = true;
    if (globalFilters.singleDate) {
      const single = new Date(globalFilters.singleDate);
      single.setHours(0, 0, 0, 0);
      matchesSingleDate = logDate.getTime() === single.getTime();
    }

    let matchesStartDate = true;
    if (globalFilters.startDate) {
      const start = new Date(globalFilters.startDate);
      start.setHours(0, 0, 0, 0);
      matchesStartDate = logDate >= start;
    }

    let matchesEndDate = true;
    if (globalFilters.endDate) {
      const end = new Date(globalFilters.endDate);
      end.setHours(0, 0, 0, 0);
      matchesEndDate = logDate <= end;
    }

    return matchesSearch && matchesPage && matchesReport && matchesUser && matchesSingleDate && matchesStartDate && matchesEndDate;
  });

  const pagedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Statistics
  const totalCount = logs.length;
  const excelCount = logs.filter(l => l.reportName && (l.reportName.toLowerCase().endsWith('.xls') || l.reportName.toLowerCase().endsWith('.xlsx'))).length;
  const pdfCount = logs.filter(l => l.reportName && l.reportName.toLowerCase().endsWith('.pdf')).length;
  const otherCount = totalCount - excelCount - pdfCount;
  const uniqueUsers = new Set(logs.map(l => l.createdBy).filter(Boolean)).size;

  const getFileIcon = (reportName) => {
    if (!reportName) return <FilePresentIcon color="action" />;
    const lower = reportName.toLowerCase();
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) {
      return <TableViewIcon sx={{ color: '#2e7d32' }} />;
    } else if (lower.endsWith('.pdf')) {
      return <PictureAsPdfIcon sx={{ color: '#d32f2f' }} />;
    }
    return <FilePresentIcon color="primary" />;
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* ── HEADER BANNER ── */}
      <Paper sx={{
        p: 3, mb: 2, borderRadius: '16px',
        background: 'linear-gradient(90deg, #673ab7 0%, #512da8 100%)',
        color: '#fff', position: 'relative'
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          {/* Left Side: Branding */}
          <Box>
            <Typography variant="h2" sx={{ color: '#fff', fontWeight: 800 }}>File Traceability Hub</Typography>
            <Typography variant="subtitle2" sx={{ color: alpha('#fff', 0.8), mt: 0.5 }}>
              Comprehensive log tracking and auditing for exported documents (Excel, PDF) across system modules
            </Typography>
          </Box>

          {/* Right Side: Stats & Actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <HeaderStatCard title="Excel Exports" count={excelCount} color={theme.palette.success.main} icon={<TableViewIcon sx={{ fontSize: 10 }} />} />
            <HeaderStatCard title="PDF Exports" count={pdfCount} color={theme.palette.error.main} icon={<PictureAsPdfIcon sx={{ fontSize: 10 }} />} />
            <HeaderStatCard title="Active Users" count={uniqueUsers} color={theme.palette.info.main} icon={<PersonIcon sx={{ fontSize: 10 }} />} />
            <HeaderStatCard title="Total Exports" count={totalCount} color={theme.palette.primary.main} icon={<DownloadIcon sx={{ fontSize: 10 }} />} />

            <Button
              variant="contained"
              onClick={loadLogs}
              startIcon={<RefreshIcon />}
              sx={{
                height: 75, px: 3, borderRadius: '12px',
                bgcolor: '#8e24aa', color: '#fff',
                boxShadow: '0 4px 14px 0 rgba(142,36,170,0.39)',
                '&:hover': { bgcolor: '#7b1fa2', boxShadow: '0 6px 20px rgba(142,36,170,0.23)' },
                textTransform: 'none', fontWeight: 700, fontSize: '1rem'
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* ── DATA TABLE ── */}
      <MainCard sx={{ borderRadius: '16px' }} content={false}>
        {(() => {
          const columns = [
            {
              id: 'rowId',
              label: 'Row ID',
              render: (row) => (
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>#{row.rowId}</Typography>
              )
            },
            {
              id: 'createdAt',
              label: 'Timeline Details',
              render: (row) => (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {row.createdAt ? new Date(row.createdAt).toLocaleTimeString() : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {row.createdAt ? formatDate(row.createdAt) : ''}
                  </Typography>
                </Box>
              )
            },
            {
              id: 'pageName',
              label: 'Page Context',
              render: (row) => (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                    {row.pageName || 'Unknown Page'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Page Code: {row.page?.pageCode || row.pageCode || 'N/A'}
                  </Typography>
                </Box>
              )
            },
            {
              id: 'reportName',
              label: 'Report File Name',
              render: (row) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), width: 34, height: 34 }}>
                    {getFileIcon(row.reportName)}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: 'primary.main',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        '&:hover': { color: 'primary.dark' }
                      }}
                      onClick={() => handlePreviewClick(row)}
                    >
                      {row.reportName || 'export_document'}
                    </Typography>
                  </Box>
                </Stack>
              )
            },
            {
              id: 'createdBy',
              label: 'Exported By',
              render: (row) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={row.creatorImg ? getUserImageUrl(row.creatorImg) : undefined}
                    sx={{ width: 28, height: 28, bgcolor: theme.palette.secondary.main, fontSize: '0.8rem' }}
                  >
                    {!row.creatorImg && (row.creatorName || row.createdBy || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {row.creatorName || row.createdBy || 'System User'}
                  </Typography>
                </Stack>
              )
            },
            {
              id: 'format',
              label: 'Format',
              render: (row) => {
                const isExcel = row.reportName && (row.reportName.toLowerCase().endsWith('.xls') || row.reportName.toLowerCase().endsWith('.xlsx'));
                const isPdf = row.reportName && row.reportName.toLowerCase().endsWith('.pdf');

                return (
                  <Chip
                    label={isExcel ? 'EXCEL' : isPdf ? 'PDF' : 'DOC'}
                    size="small"
                    sx={{
                      fontWeight: 800, fontSize: '0.65rem',
                      bgcolor: isExcel ? alpha(theme.palette.success.main, 0.1) :
                        isPdf ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.primary.main, 0.1),
                      color: isExcel ? 'success.main' :
                        isPdf ? 'error.main' : 'primary.main'
                    }}
                  />
                );
              }
            }
          ];

          return (
            <BOSDataTable
              columns={columns}
              data={filteredLogs}
              page={page}
              size={rowsPerPage}
              totalCount={filteredLogs.length}
              onPageChange={setPage}
              onSizeChange={(s) => { setRowsPerPage(s); setPage(0); }}
              showActions={false}
              loading={loading}
            />
          );
        })()}
      </MainCard>

      {/* ── PREVIEW LOADING BACKDROP ── */}
      {previewLoading && (
        <Dialog open={true} PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}>
          <CircularProgress color="primary" size={60} />
        </Dialog>
      )}

      {/* ── REPORT PREVIEW DIALOG ── */}
      {previewDialogOpen && selectedPreviewLog && (
        <Dialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', height: '90vh' } }}
        >
          <DialogTitle sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.light' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34 }}>
                {selectedPreviewLog.reportName?.toLowerCase().endsWith('.pdf') ? <PictureAsPdfIcon /> : <TableViewIcon />}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  Preview: {selectedPreviewLog.reportName}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Exported By: {selectedPreviewLog.creatorName || selectedPreviewLog.createdBy} | Code: {selectedPreviewLog.page?.pageCode || selectedPreviewLog.pageCode || 'N/A'}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setPreviewDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          {previewData && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Tabs value={previewTab} onChange={(e, val) => setPreviewTab(val)} aria-label="preview tabs">
                <Tab label="Excel View" icon={<TableViewIcon fontSize="small" />} iconPosition="start" disabled={!selectedPreviewLog.reportName?.toLowerCase().endsWith('.xls') && !selectedPreviewLog.reportName?.toLowerCase().endsWith('.xlsx') && previewTab !== 0} />
                <Tab label="PDF View" icon={<PictureAsPdfIcon fontSize="small" />} iconPosition="start" disabled={!selectedPreviewLog.reportName?.toLowerCase().endsWith('.pdf') && previewTab !== 1} />
              </Tabs>
            </Box>
          )}

          <DialogContent sx={{ p: 0, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!previewData ? (
              <Box sx={{ p: 6, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: 'background.paper' }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.warning.light,
                    color: theme.palette.warning.dark,
                    width: 70,
                    height: 70,
                    mb: 3,
                    fontSize: '2rem'
                  }}
                >
                  ⚠️
                </Avatar>
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 800 }}>
                  Preview Not Available
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 4, lineHeight: 1.6 }}>
                  This report log was created before file storage tracking was enabled. Live preview and recovery downloads are only supported for reports exported after this update.
                </Typography>
                <Typography variant="caption" sx={{ px: 2, py: 1, bgcolor: 'grey.100', borderRadius: '8px', color: 'text.secondary', fontWeight: 600 }}>
                  Log Row ID: #{selectedPreviewLog.rowId} | File: {selectedPreviewLog.reportName}
                </Typography>
              </Box>
            ) : previewTab === 0 ? (
              // Excel preview
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <Box sx={{ p: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ px: 1, py: 0.5, bgcolor: 'success.main', color: 'white', borderRadius: '4px', fontWeight: 800 }}>
                    EXCEL WORKBOOK
                  </Typography>
                  <Divider orientation="vertical" flexItem />
                  <Typography variant="caption" color="textSecondary">
                    Sheet1 ({previewData.data?.length || 0} rows)
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, height: 'calc(90vh - 180px)', overflow: 'auto' }}>
                  <BOSDataTable
                    rows={previewData.data || []}
                    columns={previewData.columns ? previewData.columns.map(c => ({ id: c.header || c.id, label: c.header || c.label })) : []}
                    checkboxSelection={false}
                    disableSelectionOnClick
                    showSearch={false}
                    showFilters={false}
                  />
                </Box>
              </Box>
            ) : (
              // PDF / Document preview
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 4, display: 'flex', justifyContent: 'center', height: 'calc(90vh - 180px)' }}>
                <Paper sx={{
                  width: '210mm',
                  minHeight: '297mm',
                  p: '20mm',
                  bgcolor: 'background.paper',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                  fontFamily: theme.typography.fontFamily,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 4, borderBottom: '3px solid', borderColor: 'primary.main', pb: 2 }}>
                    <Box>
                      <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 900, fontSize: '2rem', letterSpacing: -1 }}>
                        AUTONOMA
                      </Typography>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Business Operating System
                      </span>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 700 }}>
                        {selectedPreviewLog.reportName?.replace(/_/g, ' ').replace(/\.[^/.]+$/, '')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Generated: {new Date(previewData.timestamp || selectedPreviewLog.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderLeft: '4px solid', borderColor: 'primary.main', borderRadius: '4px', mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                      Report Summary
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      This document contains {previewData.data?.length || 0} verified records from the Autonoma ERP database.
                    </Typography>
                  </Box>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
                        {previewData.columns?.map(col => (
                          <th key={col.header || col.id} style={{ padding: '8px 6px', textAlign: 'left', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                            {col.header || col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.data?.slice(0, 15).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee', backgroundColor: idx % 2 === 0 ? 'transparent' : '#fafafa' }}>
                          {previewData.columns?.map(col => (
                            <td key={col.header || col.id} style={{ padding: '8px 6px', fontSize: '10px', color: '#444' }}>
                              {row[col.header || col.id]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {previewData.data?.length > 15 && (
                    <Box sx={{ p: 1.5, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '4px', mb: 2 }}>
                      <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        [... {previewData.data.length - 15} additional records omitted from preview ...]
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #eee', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                      Confidential Report | © {new Date().getFullYear()} Autonoma ERP
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button onClick={() => setPreviewDialogOpen(false)} variant="contained" color="secondary" sx={{ textTransform: 'none', borderRadius: '8px' }}>
              Close Preview
            </Button>
            
            {previewData && (
              previewTab === 0 ? (
                <Button
                  onClick={() => {
                    try {
                      exportToExcel(previewData.data, previewData.filename || 'export', { userName: selectedPreviewLog.creatorName || selectedPreviewLog.createdBy });
                    } catch (error) {
                      console.error("Excel export failed:", error);
                      setSnackbar({ open: true, message: 'Excel export failed: ' + error.message, severity: 'error' });
                    }
                  }}
                  variant="contained"
                  color="success"
                  startIcon={<TableViewIcon />}
                  sx={{ textTransform: 'none', borderRadius: '8px', color: 'white', '&:hover': { bgcolor: 'success.dark' } }}
                >
                  Download Excel
                </Button>
              ) : (
                <Button
                  onClick={handlePrintPDF}
                  variant="contained"
                  color="error"
                  startIcon={<PictureAsPdfIcon />}
                  sx={{ textTransform: 'none', borderRadius: '8px', '&:hover': { bgcolor: 'error.dark' } }}
                >
                  Download / Print PDF
                </Button>
              )
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* ── NOTIFICATION SNACKBAR ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: '8px', fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileTraceabilityHub;
