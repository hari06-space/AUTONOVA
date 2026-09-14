import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconFileDownload, IconRefresh, IconMail } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import { exportToExcel } from 'utils/excelExport';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSExportButton, btnExport, btnNew, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import { useSelector, useDispatch } from 'react-redux';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| SM - ENQUIRY MANAGEMENT (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'enquiryNo', label: 'Enquiry No', minWidth: 130, bold: true, required: true },
  { id: 'enquiryDate', label: 'Date', minWidth: 110 },
  { id: 'customerName', label: 'Customer', minWidth: 150, bold: true },
  { id: 'rfqMode', label: 'RFQ Mode', minWidth: 130 },
  { id: 'targetDate', label: 'Target Date', minWidth: 110 },
  { id: 'salType', label: 'Sal Type', minWidth: 130 },
  { id: 'source', label: 'Source', minWidth: 100 },
  { id: 'priority', label: 'Priority', minWidth: 90 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function EnquiryList() {
  const navigate = useNavigate();
  const perms = usePagePermissions(PAGE_CODES.SM_ENQUIRY);
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // ── RESOLVED ROWS (SOP #16 Standard) ──
  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.map(row => {
      const match = customers.find(c => c.id === row.customerId);
      const statusMatch = statusList.find(s => s.id === row.status);
      
      let finalStatus = 'Open';
      if (statusMatch) {
        finalStatus = statusMatch.name;
      } else if (row.status === true || row.status === 'true' || row.status === 1) {
        finalStatus = 'Active';
      } else if (row.status === false || row.status === 'false' || row.status === 0) {
        finalStatus = 'Inactive';
      } else if (row.status) {
        finalStatus = row.status;
      }
      
      return {
        ...row,
        customerName: match ? match.vendorName : (row.customerName || row.customerId),
        status: finalStatus
      };
    });
  }, [rows, customers, statusList]);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const [enqRes, custRes, statusRes] = await Promise.all([
        axios.get(API_PATHS.SM.ENQUIRIES),
        axios.get('/api/master/vendors?type=customer'),
        axios.get('/api/sm/enquiry/statuses')
      ]);
      setCustomers(custRes.data || []);
      setStatusList(statusRes.data || []);
      setRows(enqRes.data || []);
    } catch (error) {
      console.error('Failed to fetch enquiries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

  const handleOpenAdd = () => { navigate('/sm/enquiries/create'); };
  const handleOpenEdit = (row) => { navigate(`/sm/enquiries/create?id=${row.id}`); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchEnquiries(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.enquiryNo || row.customerName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.ENQUIRIES}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Enquiry deleted successfully!', variant: 'alert', severity: 'success' }));
      fetchEnquiries();
    } catch (error) {
      console.error('Failed to delete enquiry:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete enquiry.', variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  
  useEffect(() => {
    const config = [{ id: 'enquiryNo', label: 'Enquiry No', type: 'text', isStarred: true },
      { id: 'enquiryDate', label: 'Date', type: 'text' },
      { id: 'customerName', label: 'Customer', type: 'text', isStarred: true },
      { id: 'rfqMode', label: 'RFQ Mode', type: 'text' },
      { id: 'targetDate', label: 'Target Date', type: 'text' },
      { id: 'salType', label: 'Sal Type', type: 'text' },
      { id: 'source', label: 'Source', type: 'text' },
      { id: 'priority', label: 'Priority', type: 'text' },
      ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').toLowerCase();
    const sourceRows = typeof resolvedRows !== 'undefined' ? resolvedRows : rows; // handle if resolvedRows exists (like SupplierList)
    const filtered = sourceRows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;
      if (!q) return true;
      return (
        (row.enquiryNo && row.enquiryNo.toString().toLowerCase().includes(q)) ||
        (row.enquiryDate && row.enquiryDate.toString().toLowerCase().includes(q)) ||
        (row.customerName && row.customerName.toString().toLowerCase().includes(q)) ||
        (row.rfqMode && row.rfqMode.toString().toLowerCase().includes(q)) ||
        (row.salType && row.salType.toString().toLowerCase().includes(q)) ||
        (row.source && row.source.toString().toLowerCase().includes(q)) ||
        (row.priority && row.priority.toString().toLowerCase().includes(q))
      );
    });
    return filtered.map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, globalQuery, globalFilters, resolvedRows]);
return (
    <MainCard fullWidth
      icon={IconMail}
      title={"Enquiry Management"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={fetchEnquiries} color="primary" size="small" sx={{
              border: '2px solid', borderColor: 'divider', borderRadius: '8px', p: 1,
              transition: 'all 0.2s', '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.05)' }
            }}>
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
          {perms.export && <BOSExportButton
            data={resolvedRows}
            filename="SM_Enquiries"
            
           screenColumns={columns} />}
          {perms.write && <Tooltip title={shortcutTooltip('Create New Enquiry', 'Ctrl + N')}>
            <Button variant="contained" color="primary" size="medium" onClick={handleOpenAdd} sx={btnNew}>
              + New
            </Button>
          </Tooltip>}
        </Stack>
      }
    >
      <BOSDataTable columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        loading={loading}
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
        title="Delete Enquiry"
        message="Are you sure you want to delete this enquiry? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
