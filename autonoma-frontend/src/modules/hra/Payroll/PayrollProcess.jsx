import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Button, Stack, Typography, useTheme, Box, 
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, Tooltip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Collapse
} from '@mui/material';
import { 
  IconCalculator, IconTrash, IconEye, IconChecklist, IconCheck
} from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, BOSStatusChip } from 'ui-component/bos';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export default function PayrollProcess() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Filter lists from database
  const [filterOptions, setFilterOptions] = useState({ companies: [], categories: [], departments: [] });



  // Dialog/Detail state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  const snack = useCallback((msg, sev = 'success') => {
    dispatch(openSnackbar({ 
      open: true, 
      message: msg, 
      variant: 'alert', 
      alert: { variant: 'filled' }, 
      severity: sev 
    }));
  }, [dispatch]);

  // Load Lookup Filters
  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/payroll/process/filters');
      setFilterOptions(data || { companies: [], categories: [], departments: [] });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchPeriods = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await axios.get('/api/payroll/process/periods');
      setPeriods(data || []);
    } catch (e) {
      console.error(e);
      snack('Failed to fetch processed periods', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [snack]);

  useEffect(() => {
    fetchPeriods();
    fetchFilterOptions();
  }, [fetchPeriods, fetchFilterOptions]);



  const handleApprove = async (yr, mo, comp, cat, dept) => {
    if (!window.confirm(`Are you sure you want to APPROVE the payroll for ${mo} ${yr}? This will lock the records.`)) {
      return;
    }
    setLoading(true);
    try {
      const url = `/api/payroll/process/approve?year=${yr}&month=${mo}&companyId=${comp || ''}&categoryId=${cat || ''}&departmentId=${dept || ''}`;
      await axios.post(url);
      snack(`Payroll period approved and finalized successfully.`);
      fetchPeriods();
      if (detailOpen) {
        setDetailOpen(false);
      }
    } catch (e) {
      console.error(e);
      snack('Failed to approve payroll.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (yr, mo, comp, cat, dept) => {
    if (!window.confirm(`Are you sure you want to delete and rollback processed payroll for ${mo} ${yr}?`)) {
      return;
    }
    setLoading(true);
    try {
      const url = `/api/payroll/process/period?year=${yr}&month=${mo}&companyId=${comp || ''}&categoryId=${cat || ''}&departmentId=${dept || ''}`;
      await axios.delete(url);
      snack(`Payroll record for ${mo} ${yr} deleted/rolled back.`);
      fetchPeriods();
    } catch (e) {
      console.error(e);
      snack('Failed to delete payroll period.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (yr, mo, comp, cat, dept) => {
    setLoading(true);
    try {
      const url = `/api/payroll/process/details?year=${yr}&month=${mo}&companyId=${comp || ''}&categoryId=${cat || ''}&departmentId=${dept || ''}`;
      const { data } = await axios.get(url);
      setDetailPeriod({ year: yr, month: mo, companyId: comp, categoryId: cat, departmentId: dept });
      setDetailRows(data || []);
      setDetailOpen(true);
    } catch (e) {
      console.error(e);
      snack('Failed to load payroll details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Paginated Rows
  const paginatedPeriods = useMemo(() => {
    return periods.slice(page * size, page * size + size);
  }, [periods, page, size]);

  // Lookup helper functions for tables
  const getCompanyName = (id) => filterOptions.companies.find(c => String(c.id) === String(id))?.name || 'All';
  const getCategoryName = (id) => filterOptions.categories.find(c => String(c.id) === String(id))?.name || 'All';
  const getDeptName = (id) => filterOptions.departments.find(d => String(d.id) === String(id))?.name || 'All';

  // List View Columns
  const listColumns = [
    { id: 'year', label: 'Year', minWidth: 80 },
    { id: 'month', label: 'Month', minWidth: 100 },
    { id: 'companyName', label: 'Company', minWidth: 120 },
    { id: 'categoryName', label: 'Category', minWidth: 120 },
    { id: 'departmentName', label: 'Department', minWidth: 120 },
    { id: 'totalEmployees', label: 'Employees', minWidth: 100, align: 'center' },
    { id: 'totalNetSalary', label: 'Total Net Payout', minWidth: 140, align: 'right' },
    { id: 'status', label: 'Status', minWidth: 100, align: 'center' },
    { id: 'actions', label: 'Actions', minWidth: 180, align: 'center' }
  ];

  const renderCellList = (row, col) => {
    if (col.id === 'companyName') return getCompanyName(row.companyId);
    if (col.id === 'categoryName') return getCategoryName(row.employeeCategoryId);
    if (col.id === 'departmentName') return getDeptName(row.departmentId);
    if (col.id === 'status') {
      return <BOSStatusChip status={row.status} width={100} />;
    }
    if (col.id === 'totalNetSalary') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.dark' }}>
          ₹ {parseFloat(row.totalNetSalary).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      );
    }
    if (col.id === 'actions') {
      return (
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Tooltip title="View Details">
            <IconButton color="info" size="small" onClick={() => handleViewDetails(row.year, row.month, row.companyId, row.employeeCategoryId, row.departmentId)}>
              <IconEye size={18} />
            </IconButton>
          </Tooltip>
          {row.status !== 'APPROVED' && (
            <Tooltip title="Approve & Lock">
              <IconButton color="success" size="small" onClick={() => handleApprove(row.year, row.month, row.companyId, row.employeeCategoryId, row.departmentId)}>
                <IconCheck size={18} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Rollback/Delete">
            <IconButton color="error" size="small" onClick={() => handleDelete(row.year, row.month, row.companyId, row.employeeCategoryId, row.departmentId)}>
              <IconTrash size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      );
    }
    const val = row[col.id];
    return val ?? '-';
  };

  return (
    <Box sx={{ width: '100%' }}>
      
        <MainCard
          fullWidth
          title={
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
              <Box sx={{ p: 1, bgcolor: 'success.lighter', borderRadius: 2, display: 'flex' }}>
                <IconCalculator size={22} color={isDark ? '#fff' : '#2e7d32'} />
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>Payroll Processing</Typography>
            </Stack>
          }
          secondary={
            <BOSTableToolbar
              onRefresh={fetchPeriods}
              onNew={() => navigate('/hra/payroll/payroll-process-creation')}
              hasWritePermission={true}
              columns={listColumns}
            />
          }
        >
          <BOSDataTable
            id="payroll-process-list-table"
            columns={listColumns}
            rows={paginatedPeriods}
            page={page}
            size={size}
            totalCount={periods.length}
            loading={refreshing}
            onPageChange={setPage}
            onSizeChange={(s) => { setSize(s); setPage(0); }}
            showActions={false}
            renderCell={renderCellList}
          />
        </MainCard>

      {/* Details View Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconChecklist size={22} color={theme.palette.primary.main} />
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              Payroll Details - {detailPeriod?.month} {detailPeriod?.year} ({getCompanyName(detailPeriod?.companyId)})
            </Typography>
          </Stack>
          <IconButton onClick={() => setDetailOpen(false)} size="small">✕</IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, mt: 1 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell />
                  <TableCell><strong>Emp Code</strong></TableCell>
                  <TableCell><strong>Employee Name</strong></TableCell>
                  <TableCell><strong>Payment Mode</strong></TableCell>
                  <TableCell align="right"><strong>Gross Earning</strong></TableCell>
                  <TableCell align="right"><strong>Deductions</strong></TableCell>
                  <TableCell align="right"><strong>Net Salary</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detailRows.map((row) => (
                  <React.Fragment key={row.employeeCode}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => setExpandedRow(expandedRow === row.employeeCode ? null : row.employeeCode)}
                        >
                          {expandedRow === row.employeeCode ? '▲' : '▼'}
                        </IconButton>
                      </TableCell>
                      <TableCell>{row.employeeCode}</TableCell>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={row.paymentMode} 
                          color={row.paymentMode === 'BANK' ? 'primary' : 'default'} 
                          size="small" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'success.dark', fontWeight: 600 }}>
                        ₹ {row.grossSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.dark', fontWeight: 600 }}>
                        ₹ {row.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'primary.dark', fontWeight: 800 }}>
                        ₹ {row.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={expandedRow === row.employeeCode} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="h5" gutterBottom component="div" sx={{ fontWeight: 700 }}>
                              Component Breakdown
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell><strong>Component Code</strong></TableCell>
                                  <TableCell><strong>Component Name</strong></TableCell>
                                  <TableCell><strong>Type</strong></TableCell>
                                  <TableCell align="right"><strong>Actual Amount</strong></TableCell>
                                  <TableCell align="right"><strong>Process Amount</strong></TableCell>
                                  <TableCell><strong>Formula / Source</strong></TableCell>
                                  <TableCell><strong>Calculation Log</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {row.components && row.components.map((comp) => (
                                  <TableRow key={comp.componentCode}>
                                    <TableCell>{comp.componentCode}</TableCell>
                                    <TableCell>{comp.componentName}</TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={comp.componentType} 
                                        size="small" 
                                        color={comp.componentType === 'EARNING' ? 'success' : (comp.componentType === 'DEDUCTION' ? 'error' : 'default')} 
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    </TableCell>
                                    <TableCell align="right">
                                      ₹ {comp.actualAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                                      ₹ {comp.processAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>{comp.formula || '-'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                      {comp.calculationLog || '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Box>
            {detailRows.length > 0 && detailRows[0].status !== 'APPROVED' && (
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<IconCheck size={18} />}
                onClick={() => handleApprove(detailPeriod?.year, detailPeriod?.month, detailPeriod?.companyId, detailPeriod?.categoryId, detailPeriod?.departmentId)}
              >
                Approve & Lock Payroll
              </Button>
            )}
          </Box>
          <Button variant="contained" color="primary" onClick={() => setDetailOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
