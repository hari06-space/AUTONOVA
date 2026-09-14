import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Grid, TextField, Paper, Box } from '@mui/material';
import { IconFileDownload, IconRefresh, IconFileInvoice, IconShieldCheck, IconX, IconCheck, IconFile, IconUsers, IconCalendarEvent, IconBox, IconHash, IconCurrencyRupee } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import { exportToExcel } from 'utils/excelExport';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSExportButton, btnExport, btnNew, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { useLocation, useNavigate } from 'react-router-dom';

// ==============================|| SM - QUOTATION MANAGEMENT (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'quotationNo', label: 'Quotation No', minWidth: 130, bold: true, required: true },
  { id: 'quotationDate', label: 'Date', minWidth: 110 },
  { id: 'customerName', label: 'Customer', minWidth: 180, required: true },
  { id: 'totalAmount', label: 'Amount', minWidth: 100 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function QuotationList() {
  const perms = usePagePermissions(PAGE_CODES.SM_QUOTATION);
  const dispatch = useDispatch();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const statusFilter = searchParams.get('status');

  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifyTarget, setVerifyTarget] = useState(null);

  // ── RESOLVED ROWS (SOP #16 Standard) ──
  const resolvedRows = useMemo(() => {
      if (!Array.isArray(rows)) return [];
      return rows.map(row => ({
        ...row,
        status: row.quotationStatusName || 'Draft'
      }));
    }, [rows]);

  const filteredRows = useMemo(() => {
    let result = resolvedRows;
    if (statusFilter) {
      const sf = statusFilter.toUpperCase();
      result = result.filter(row => {
        const s = (row.status || '').toUpperCase();
        if (sf === 'PENDING') {
          return s === 'PENDING';
        }
        if (sf === 'OVERDUE') {
          const validUpto = row.validUpto || row.validityDate || row.validUptoDate;
          if (validUpto) {
            return s === 'PENDING' && new Date(validUpto) < new Date();
          }
          return s === 'PENDING';
        }
        if (sf === 'TODAY') {
          const createdDate = row.createdDate ? new Date(row.createdDate).toDateString() : '';
          return createdDate === new Date().toDateString();
        }
        return s === sf;
      });
    }
    return result;
  }, [resolvedRows, statusFilter]);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const [quotationRes, customerRes] = await Promise.all([
         axios.get(API_PATHS.SM.QUOTATIONS),
         axios.get(API_PATHS.SM.CUSTOMERS).catch(() => ({ data: [] }))
      ]);
      const customerMap = {};
      (customerRes.data || []).forEach(c => customerMap[c.id] = c.customerName);

      const rowsData = (quotationRes.data || []).map(q => {
         const parts = q.parts || [];
         const total = parts.reduce((sum, p) => {
            const amount = p.amount || 0;
            const qty = p.qty || 0;
            const discount = p.discount || 0;
            return sum + (amount * qty) - discount;
         }, 0);
         return {
            ...q,
            customerName: customerMap[q.customerId] || '-',
            totalAmount: total || 0
         };
      });

      setRows(rowsData);
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  const handleOpenAdd = () => { navigate('/sm/quotation/entry'); };
  const handleOpenEdit = (row) => { navigate(`/sm/quotation/entry/${row.id}`); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.quotationNo || row.customerName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.QUOTATIONS}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Quotation deleted successfully!', variant: 'alert', severity: 'success' }));
      fetchQuotations();
    } catch (error) {
      console.error('Failed to delete quotation:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete quotation.', variant: 'alert', severity: 'error' }));
    }
  };

  const handleVerifyClick = async () => {
    if (selectedRowIds.length !== 1) return;
    const targetId = selectedRowIds[0];
    const targetRow = rows.find(r => r.id === targetId);
    try {
      const res = await axios.get(`${API_PATHS.SM.QUOTATIONS}/${targetId}`);
      if (res.data) {
        const data = { ...res.data };
        if (targetRow) {
          data.customerName = targetRow.customerName;
        }
        setVerifyTarget(data);
        setVerifyRemarks(data.verifyRejComments || '');
        setVerifyOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch quotation details:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to fetch quotation details.', variant: 'alert', severity: 'error' }));
    }
  };

  const handleVerifyConfirm = async (action) => {
    if (action === 'reject' && (!verifyRemarks || verifyRemarks.trim() === '')) {
      dispatch(openSnackbar({ open: true, message: 'Please enter rejection comments!', variant: 'alert', severity: 'error' }));
      return;
    }
    setVerifyOpen(false);
    try {
      await axios.put(`${API_PATHS.SM.QUOTATIONS}/${verifyTarget.id}/${action}`, { remarks: verifyRemarks });
      dispatch(openSnackbar({ open: true, message: `Quotation ${action === 'verify' ? 'verified' : 'rejected'} successfully!`, variant: 'alert', severity: 'success' }));
      fetchQuotations();
    } catch (error) {
      console.error('Failed to verify/reject quotation:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to verify/reject quotation.', variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd
  });

  return (
    <MainCard fullWidth
      icon={IconFileInvoice}
      title={"Quotation Management"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button 
            variant="contained" 
            color="secondary" 
            size="medium" 
            onClick={handleVerifyClick} 
            disabled={selectedRowIds.length !== 1}
            startIcon={<IconShieldCheck size={18} />}
          >
            Verify
          </Button>

          {perms.export && <BOSExportButton
            data={filteredRows}
            filename="SM_Quotations"
            
           screenColumns={columns} />}
          {perms.write && <Tooltip title={shortcutTooltip('Create New Quotation', 'Ctrl + N')}>
            <Button variant="contained" color="primary" size="medium" onClick={handleOpenAdd} sx={btnNew}>
              + New
            </Button>
          </Tooltip>}
        </Stack>
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        loading={loading}
        selectedRowId={selectedRowIds}
        onClickRow={(row, ids) => setSelectedRowIds(ids || [])}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />


      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        itemName={deleteTargetName}
      />

      <Dialog open={verifyOpen} onClose={() => setVerifyOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: 24 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.dark', color: 'white', py: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }}>
              <IconShieldCheck size={24} />
            </Avatar>
            <Typography variant="h3" fontWeight="bold">Verify / Reject Quotation</Typography>
          </Stack>
          <IconButton onClick={() => setVerifyOpen(false)} sx={{ color: 'white' }}>
            <IconX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f8fafc', p: 3 }}>
          {verifyTarget && (
            <Stack spacing={3}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }} variant="rounded">
                        <IconFile size={20} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Quotation No</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{verifyTarget.quotationNo}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }} variant="rounded">
                        <IconUsers size={20} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Customer</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{verifyTarget.customerName || '-'}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 40, height: 40 }} variant="rounded">
                        <IconCalendarEvent size={20} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Date</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {verifyTarget.quotationDate ? format(new Date(verifyTarget.quotationDate), 'dd/MM/yyyy') : '-'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 32, height: 32 }} variant="rounded">
                    <IconBox size={18} />
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.main">QUOTATION PARTS</Typography>
                </Stack>
                {verifyTarget.parts && verifyTarget.parts.length > 0 ? (
                  <Stack spacing={2}>
                    {verifyTarget.parts.map((detail, index) => (
                      <Box key={index} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={4}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }} variant="rounded">
                                <IconHash size={20} />
                              </Avatar>
                              <Box>
                                <Typography variant="caption" color="textSecondary">Part No</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{detail.partNo}</Typography>
                              </Box>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }} variant="rounded">
                                <IconFile size={20} />
                              </Avatar>
                              <Box>
                                <Typography variant="caption" color="textSecondary">Part Name</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{detail.name}</Typography>
                              </Box>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 40, height: 40 }} variant="rounded">
                                <IconCurrencyRupee size={20} />
                              </Avatar>
                              <Box>
                                <Typography variant="caption" color="textSecondary">Amount</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{detail.amount || '-'}</Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="textSecondary" align="center">No parts found.</Typography>
                )}
              </Paper>

              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold" color="secondary.main">VERIFICATION / REJECTION COMMENTS</Typography>
                  <Typography color="error">*</Typography>
                </Stack>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  placeholder="Enter comments (mandatory for rejection)..."
                  disabled={verifyTarget.quotationStatusName !== 'Pending for Verified'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: verifyTarget.quotationStatusName !== 'Pending for Verified' ? 'action.hover' : 'background.paper'
                    }
                  }}
                />
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Box>
            {verifyTarget && verifyTarget.quotationStatusName !== 'Pending for Verified' && (
              <Typography 
                variant="subtitle1" 
                fontWeight="bold" 
                color={verifyTarget.quotationStatusName === 'Verified' ? 'success.main' : 'error.main'}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                {verifyTarget.quotationStatusName === 'Verified' ? <IconCheck size={20} /> : <IconX size={20} />}
                Current Status: {verifyTarget.quotationStatusName}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            {verifyTarget && verifyTarget.quotationStatusName === 'Pending for Verified' ? (
              <>
                <Button
                  onClick={() => handleVerifyConfirm('reject')}
                  color="error"
                  variant="outlined"
                  startIcon={<IconX size={18} />}
                  sx={{ fontWeight: 'bold', borderRadius: 2, px: 3 }}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleVerifyConfirm('verify')}
                  color="success"
                  variant="outlined"
                  startIcon={<IconCheck size={18} />}
                  sx={{ fontWeight: 'bold', borderRadius: 2, px: 3 }}
                >
                  Verify
                </Button>
              </>
            ) : (
              <Button onClick={() => setVerifyOpen(false)} color="primary" variant="contained" sx={{ fontWeight: 'bold', borderRadius: 2, px: 4 }}>
                Close
              </Button>
            )}
          </Stack>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
