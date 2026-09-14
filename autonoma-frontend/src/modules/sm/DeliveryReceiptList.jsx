import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Stack,
  Tooltip,
  IconButton,
  Checkbox,
  Chip,
  Box,
  Typography
} from '@mui/material';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconPrinter,
  IconReceipt2,
  IconCheck
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable } from 'ui-component/bos';
import { useNavigate } from 'react-router-dom';
import DeliveryReceiptPdfDialog from './DeliveryReceiptPdfDialog';

export default function DeliveryReceiptList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Row selection for DC to Invoice conversion
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [converting, setConverting] = useState(false);

  // PDF Preview State
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfReceiptData, setPdfReceiptData] = useState(null);

  const fetchDeliveryReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.SM.INVOICES, {
        params: {
          docType: 'DELIVERY_RECEIPT',
          page,
          size,
          sortBy: 'id',
          direction: 'desc'
        }
      });
      setRows(response.data.content || []);
      setTotalCount(response.data.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch delivery receipts:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load delivery receipts.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, page, size]);

  useEffect(() => {
    fetchDeliveryReceipts();
  }, [fetchDeliveryReceipts]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSizeChange = (newSize) => {
    setSize(newSize);
    setPage(0);
  };

  const handleOpenAdd = useCallback(() => {
    navigate('/sm/sales/customer/delivery-receipts/create');
  }, [navigate]);

  const handleOpenEdit = (row) => {
    navigate(`/sm/sales/customer/delivery-receipts/edit/${row.id}`);
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.invoiceNo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.INVOICES}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Delivery Receipt deleted successfully!', variant: 'alert', severity: 'success' }));
      fetchDeliveryReceipts();
    } catch (error) {
      console.error('Failed to delete delivery receipt:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete delivery receipt.', variant: 'alert', severity: 'error' }));
    }
  };

  // Selection Checkbox Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === rows.length && rows.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(rows.map(r => r.id));
      setSelectedIds(allIds);
    }
  };

  const handleToggleSelectRow = (id) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  // "DC to Invoice" conversion trigger
  const handleDcToInvoice = async () => {
    if (selectedIds.size === 0) {
      dispatch(openSnackbar({ open: true, message: 'Please select at least one Delivery Receipt.', variant: 'alert', severity: 'warning' }));
      return;
    }

    const selectedList = rows.filter(r => selectedIds.has(r.id));

    // Validate Same Customer
    const customerIds = new Set(selectedList.map(r => r.customerId));
    if (customerIds.size > 1) {
      dispatch(openSnackbar({ open: true, message: 'Selected Delivery Receipts must belong to the SAME Customer.', variant: 'alert', severity: 'error' }));
      return;
    }

    // Validate that none is already invoiced
    const alreadyInvoiced = selectedList.filter(r => r.dcStatus === 'INVOICED' || r.refInvoiceNo);
    if (alreadyInvoiced.length > 0) {
      dispatch(openSnackbar({ open: true, message: `Delivery Receipt (${alreadyInvoiced[0].invoiceNo}) has already been invoiced.`, variant: 'alert', severity: 'error' }));
      return;
    }

    setConverting(true);
    try {
      const idsArray = Array.from(selectedIds);
      const response = await axios.post(`${API_PATHS.SM.INVOICES}/from-dcs`, idsArray);
      dispatch(openSnackbar({ open: true, message: `Prepared draft invoice from ${idsArray.length} Delivery Receipt(s).`, variant: 'alert', severity: 'info' }));
      navigate('/sm/sales/customer/invoices/create', { state: { fromDcs: response.data } });
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to prepare invoice from Delivery Receipts.';
      dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
    } finally {
      setConverting(false);
    }
  };

  // Open PDF Print Modal
  const handleOpenPdf = async (row) => {
    try {
      const response = await axios.get(`${API_PATHS.SM.INVOICES}/${row.id}`);
      setPdfReceiptData(response.data);
      setPdfDialogOpen(true);
    } catch (error) {
      console.error('Failed to load DC details for print:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load Delivery Receipt details for printing.', variant: 'alert', severity: 'error' }));
    }
  };

  // Keyboard shortcut listener (Alt+N to create, Alt+I for DC to Invoice)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N' || e.code === 'KeyN')) {
        e.preventDefault();
        handleOpenAdd();
      } else if (e.altKey && (e.key === 'i' || e.key === 'I' || e.code === 'KeyI')) {
        e.preventDefault();
        handleDcToInvoice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenAdd, handleDcToInvoice]);

  const columns = [
    {
      id: 'select',
      label: (
        <Checkbox
          size="small"
          indeterminate={selectedIds.size > 0 && selectedIds.size < rows.length}
          checked={rows.length > 0 && selectedIds.size === rows.length}
          onChange={handleToggleSelectAll}
          sx={{ p: 0.5, color: '#fff', '&.Mui-checked': { color: '#fff' }, '&.MuiCheckbox-indeterminate': { color: '#fff' } }}
        />
      ),
      minWidth: 45,
      align: 'center'
    },
    { id: 'index', label: '#', minWidth: 45 },
    { id: 'invoiceNo', label: 'Receipt No', minWidth: 140, bold: true },
    { id: 'invoiceDate', label: 'Receipt Date', minWidth: 110 },
    { id: 'customerName', label: 'Customer Name', minWidth: 180, bold: true },
    { id: 'customerPo', label: 'Customer PO', minWidth: 130 },
    { id: 'grandTotal', label: 'Grand Total', minWidth: 120, align: 'right' },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      align: 'center'
    },
    { id: 'refInvoiceNo', label: 'Invoice No', minWidth: 140, bold: true },
    { id: 'refInvoiceDate', label: 'Invoice Date', minWidth: 110 }
  ];

  return (
    <MainCard
      title="Delivery Chellan (DC)"
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* DC to Invoice Action Button */}
          <Tooltip title="Convert Selected DC(s) to Sales Invoice (Alt + I)">
            <span>
              <Button
                variant="contained"
                color="primary"
                startIcon={<IconReceipt2 size={18} />}
                onClick={handleDcToInvoice}
                disabled={selectedIds.size === 0 || converting}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '8px',
                  bgcolor: '#2563eb',
                  '&:hover': { bgcolor: '#1d4ed8' },
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                }}
              >
                DC to Invoice {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
              </Button>
            </span>
          </Tooltip>

          {/* Create Delivery Receipt Button */}
          <Tooltip title="Create Delivery Receipt (Alt + N)">
            <Button
              variant="contained"
              color="secondary"
              startIcon={<IconPlus size={18} />}
              onClick={handleOpenAdd}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
            >
              New
            </Button>
          </Tooltip>
        </Stack>
      }
    >
      <BOSDataTable
        id="sm_delivery_receipt_list"
        columns={columns}
        rows={rows.map((row, index) => {
          const isInvoiced = row.dcStatus === 'INVOICED' || Boolean(row.refInvoiceNo);
          return {
            ...row,
            select: (
              <Checkbox
                size="small"
                checked={selectedIds.has(row.id)}
                onChange={() => handleToggleSelectRow(row.id)}
                disabled={isInvoiced}
                sx={{ p: 0.5 }}
              />
            ),
            index: page * size + index + 1,
            customerName: row.customerName || 'Customer',
            invoiceDate: row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '',
            grandTotal: parseFloat(row.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            status: (
              <Chip
                size="small"
                label={isInvoiced ? 'Invoice Generated' : 'Pending'}
                color={isInvoiced ? 'success' : 'warning'}
                variant={isInvoiced ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
              />
            ),
            refInvoiceNo: row.refInvoiceNo || '-',
            refInvoiceDate: row.refInvoiceDate ? new Date(row.refInvoiceDate).toLocaleDateString() : '-'
          };
        })}
        loading={loading}
        page={page}
        size={size}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onSizeChange={handleSizeChange}
        actions={(row) => (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            <Tooltip title="Print / Download PDF">
              <IconButton color="info" size="small" onClick={() => handleOpenPdf(row)}>
                <IconPrinter size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit DC">
              <IconButton color="primary" size="small" onClick={() => handleOpenEdit(row)}>
                <IconEdit size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete DC">
              <IconButton color="error" size="small" onClick={() => handleDeleteClick(row)}>
                <IconTrash size={18} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      />

      {/* PDF Print Preview Dialog */}
      <DeliveryReceiptPdfDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        receipt={pdfReceiptData}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
        handleConfirm={handleDeleteConfirm}
        title="Delete Delivery Receipt"
        message={`Are you sure you want to delete delivery receipt "${deleteTargetName}"?`}
      />
    </MainCard>
  );
}
