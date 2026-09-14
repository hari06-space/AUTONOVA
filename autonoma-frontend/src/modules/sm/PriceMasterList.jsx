import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Stack,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Grid,
  Avatar,
  Divider
} from '@mui/material';
import { 
  IconRefresh, IconFileDollar, IconCheck, IconX, IconShieldCheck,
  IconFileDescription, IconUsers, IconTag, IconCalendarEvent,
  IconBox, IconHash, IconFile, IconCurrencyRupee, IconChartLine, IconMessageDots
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import {
  BOSDataTable,
  btnNew,
  getCommonDateFilters,
  matchCommonDateFilters,
  BOSExportButton
} from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'priceListNo', label: 'Price List No', minWidth: 120, bold: true },
  { id: 'priceListType', label: 'Type', minWidth: 160 },
  { id: 'customerName', label: 'Customer', minWidth: 160 },
  { id: 'customerGroupName', label: 'Group', minWidth: 120 },
  { id: 'referenceNo', label: 'Ref No', minWidth: 100 },
  { id: 'effectiveFrom', label: 'Effective From', minWidth: 110 },
  { id: 'effectiveTo', label: 'Effective To', minWidth: 110 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'verifyStatus', label: 'Verify Status', minWidth: 110 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 140 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 140 }
];

export default function PriceMasterList() {
  const perms = usePagePermissions(PAGE_CODES.SM_PRICE_MASTER);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Deletion
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Verification Dialog
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifyTarget, setVerifyTarget] = useState(null);

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  useEffect(() => {
    const config = [
      {
        id: 'priceListType',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'GENERAL PRICE LIST', label: 'GENERAL PRICE LIST' },
          { value: 'CUSTOMER PRICE LIST', label: 'CUSTOMER PRICE LIST' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'INACTIVE', label: 'INACTIVE' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'verifyStatus',
        label: 'Verify Status',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'Pending', label: 'PENDING' },
          { value: 'Verified', label: 'VERIFIED' },
          { value: 'Rejected', label: 'REJECTED' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      ...getCommonDateFilters('createdDate', 'updatedDate')
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchMasters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sales/price-master');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch price lists:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  const handleOpenAdd = () => {
    navigate('/sm/price-master/create');
  };

  const handleOpenEdit = (row) => {
    navigate(`/sm/price-master/edit/${row.id}`);
  };

  const handleDeleteClick = (row) => {
    if (row.verifyStatus === 'Verified') {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Verified price lists cannot be deleted!',
          variant: 'alert',
          severity: 'warning',
          close: false
        })
      );
      return;
    }
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.priceListNo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/sales/price-master/${deleteTargetId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Price list deleted successfully!',
          variant: 'alert',
          severity: 'success',
          close: false
        })
      );
      fetchMasters();
    } catch (error) {
      console.error('Failed to delete price list:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete price list.',
          variant: 'alert',
          severity: 'error',
          close: false
        })
      );
    }
  };

  const handleVerifyClick = () => {
    if (selectedRowIds.length !== 1) return;
    const targetId = selectedRowIds[0];
    const targetRow = rows.find(r => r.id === targetId);
    if (targetRow) {
      setVerifyTarget(targetRow);
      setVerifyRemarks(targetRow.verifyRejComments || '');
      setVerifyOpen(true);
    }
  };

  const handleVerifyConfirm = async (action) => {
    if (action === 'reject' && (!verifyRemarks || verifyRemarks.trim() === '')) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Verification Remarks is mandatory for Rejection!',
          variant: 'alert',
          severity: 'error',
          close: false
        })
      );
      return;
    }

    setVerifyOpen(false);
    try {
      await axios.put(`/api/sales/price-master/${verifyTarget.id}/${action}`, { remarks: verifyRemarks });
      dispatch(
        openSnackbar({
          open: true,
          message: `Price list ${action === 'verify' ? 'verified' : 'rejected'} successfully!`,
          variant: 'alert',
          severity: 'success',
          close: false
        })
      );
      fetchMasters();
    } catch (error) {
      console.error('Failed to verify/reject price list:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Action failed.',
          variant: 'alert',
          severity: 'error',
          close: false
        })
      );
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`/api/sales/price-master/export?format=${format}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Price_Master_Export.${format === 'EXCEL' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export price list:', err);
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

      const typeFilter = globalFilters.priceListType || 'All';
      const matchesType = typeFilter === 'All' || row.priceListType === typeFilter;

      const statusFilter = globalFilters.status || 'All';
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter;

      const verifyFilter = globalFilters.verifyStatus || 'All';
      const matchesVerify = verifyFilter === 'All' || row.verifyStatus === verifyFilter;

      const matchesSearch =
        !globalQuery ||
        (row.priceListNo && row.priceListNo.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.referenceNo && row.referenceNo.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.customerName && row.customerName.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesType && matchesStatus && matchesVerify && matchesSearch;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * size, page * size + size);
  }, [filteredRows, page, size]);

  const displayRows = useMemo(() => {
    return paginatedRows.map((r, i) => ({
      ...r,
      index: page * size + i + 1,
      effectiveFrom: r.effectiveFrom ? format(new Date(r.effectiveFrom), 'dd/MM/yyyy') : '',
      effectiveTo: r.effectiveTo ? format(new Date(r.effectiveTo), 'dd/MM/yyyy') : '',
      createdDate: r.createdDate ? format(new Date(r.createdDate), 'dd/MM/yyyy HH:mm') : '',
      updatedDate: r.updatedDate ? format(new Date(r.updatedDate), 'dd/MM/yyyy HH:mm') : ''
    }));
  }, [paginatedRows, page, size]);

  const finalColumns = useMemo(() => {
    return columns;
  }, []);

  return (
    <MainCard
      fullWidth
      icon={IconFileDollar}
      title={'Price Master'}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          {perms.approval && (
            <Tooltip title={selectedRowIds.length !== 1 ? 'Select exactly one price list to verify' : 'Verify Price List'}>
              <span>
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={selectedRowIds.length !== 1}
                  onClick={handleVerifyClick}
                  startIcon={<IconCheck size={18} />}
                >
                  Verify
                </Button>
              </span>
            </Tooltip>
          )}
          {perms.export && (
            <BOSExportButton
              data={filteredRows}
              filename="Price_Master"
              screenColumns={columns}
            />
          )}

          {perms.write && (
            <Tooltip title={shortcutTooltip('Create New Price Master', 'Ctrl + N')}>
              <Button variant="contained" color="primary" size="medium" onClick={handleOpenAdd} sx={btnNew}>
                + New
              </Button>
            </Tooltip>
          )}
        </Stack>
      }
    >
      <BOSDataTable
        columns={finalColumns}
        rows={displayRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        selectedRowId={selectedRowIds}
        onClickRow={(row, ids) => setSelectedRowIds(ids || [])}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onDoubleClickRow={handleOpenEdit}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Price Master"
        message="Are you sure you want to delete this price master? This action cannot be undone."
        itemName={deleteTargetName}
      />

      <Dialog open={verifyOpen} onClose={() => setVerifyOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }}>
              <IconShieldCheck size={24} />
            </Avatar>
            <Typography variant="h3" fontWeight="bold">Verify / Reject Price List</Typography>
          </Stack>
          <IconButton onClick={() => setVerifyOpen(false)}>
            <IconX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f8fafc', p: 3 }}>
          {verifyTarget && (
            <Stack spacing={3}>
              {/* PRICE LIST INFORMATION */}
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 32, height: 32 }} variant="rounded">
                    <IconFileDescription size={18} />
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.main">PRICE LIST INFORMATION</Typography>
                </Stack>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }} variant="rounded">
                        <IconFile size={20} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Price List No</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{verifyTarget.priceListNo}</Typography>
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
                        <IconTag size={20} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Type</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{verifyTarget.priceListType}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', width: 40, height: 40 }} variant="rounded">
                        <IconCalendarEvent size={20} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Effective From</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{verifyTarget.effectiveFrom}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', width: 40, height: 40 }} variant="rounded">
                        <IconCalendarEvent size={20} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Effective To</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{verifyTarget.effectiveTo}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              {/* PRICE DETAILS */}
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 32, height: 32 }} variant="rounded">
                    <IconBox size={18} />
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.main">PRICE DETAILS</Typography>
                </Stack>
                {verifyTarget.details && verifyTarget.details.length > 0 ? (
                  <Stack spacing={2}>
                    {verifyTarget.details.map((detail, index) => (
                      <Box key={index} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }} variant="rounded">
                                <IconHash size={20} />
                              </Avatar>
                              <Box>
                                <Typography variant="caption" color="textSecondary">Part No</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{detail.productCode}</Typography>
                              </Box>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }} variant="rounded">
                                <IconFile size={20} />
                              </Avatar>
                              <Box>
                                <Typography variant="caption" color="textSecondary">Part Name</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{detail.productName}</Typography>
                              </Box>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 40, height: 40 }} variant="rounded">
                                <IconCurrencyRupee size={20} />
                              </Avatar>
                              <Box>
                                <Typography variant="caption" color="textSecondary">Base Price</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{detail.basePrice || '-'}</Typography>
                              </Box>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main', width: 40, height: 40 }} variant="rounded">
                                <IconChartLine size={20} />
                              </Avatar>
                              <Box>
                                <Typography variant="caption" color="textSecondary">Min Price</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{detail.minPrice || '-'}</Typography>
                              </Box>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main', width: 40, height: 40 }} variant="rounded">
                                <IconChartLine size={20} />
                              </Avatar>
                              <Box>
                                <Typography variant="caption" color="textSecondary">Max Price</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{detail.maxPrice || '-'}</Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="textSecondary" align="center">No line items found.</Typography>
                )}
              </Paper>

              {/* COMMENTS */}
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', width: 32, height: 32 }} variant="rounded">
                    <IconMessageDots size={18} />
                  </Avatar>
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
                  disabled={verifyTarget.verifyStatus !== 'Pending'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: verifyTarget.verifyStatus !== 'Pending' ? 'action.hover' : 'background.paper'
                    }
                  }}
                />
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Box>
            {verifyTarget && verifyTarget.verifyStatus !== 'Pending' && (
              <Typography 
                variant="subtitle1" 
                fontWeight="bold" 
                color={verifyTarget.verifyStatus === 'Verified' ? 'success.main' : 'error.main'}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                {verifyTarget.verifyStatus === 'Verified' ? <IconCheck size={20} /> : <IconX size={20} />}
                Current Status: {verifyTarget.verifyStatus}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            {verifyTarget && verifyTarget.verifyStatus === 'Pending' ? (
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
