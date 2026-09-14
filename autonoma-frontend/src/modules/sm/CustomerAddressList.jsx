import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton, useTheme } from '@mui/material';
import { IconRefresh, IconPlus, IconMapPin } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSExportButton, btnNew, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import AddCustomerDetailsDialog from './AddCustomerDetailsDialog';

// ==============================|| SM - CUSTOMER ADDRESS LIST ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'invoiceName', label: 'Customer Name (I)', minWidth: 150, bold: true },
  { id: 'shipment', label: 'Shipment', minWidth: 100 },
  { id: 'address', label: 'Address', minWidth: 250 },
  { id: 'city', label: 'City', minWidth: 100 },
  { id: 'district', label: 'District', minWidth: 100 },
  { id: 'state', label: 'State', minWidth: 100 },
  { id: 'country', label: 'Country', minWidth: 100 },
  { id: 'pincode', label: 'Pincode', minWidth: 100 },
  { id: 'contactName', label: 'Contact Name', minWidth: 120 },
  { id: 'contactNo', label: 'Contact No', minWidth: 120 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function CustomerAddressList() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const theme = useTheme();

  useEffect(() => {
    const config = [{ id: 'invoiceName', label: 'Customer Name', type: 'text', placeholder: 'Search by Name...', isStarred: true },
      { id: 'address', label: 'Address', type: 'text', placeholder: 'Search by Address...' },
      { id: 'city', label: 'City', type: 'text', placeholder: 'Search by City...', isStarred: true },
      ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      // Assuming endpoint exists or will exist. For now, fetch from customers or similar.
      const response = await axios.get('/api/sm/customer-details'); 
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch customer addresses:', error);
      // Fallback for demo if API not ready
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleOpenAdd = () => { setSelectedRow(null); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchAddresses(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.invoiceName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/sm/customer-details/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Address deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete address.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });



  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

      const nameFilter = (globalFilters.invoiceName || '').toLowerCase();
      const addressFilter = (globalFilters.address || '').toLowerCase();
      const cityFilter = (globalFilters.city || '').toLowerCase();
      
      const matchesName = !nameFilter || (row.invoiceName && row.invoiceName.toLowerCase().includes(nameFilter));
      const matchesAddress = !addressFilter || (row.address && row.address.toLowerCase().includes(addressFilter));
      const matchesCity = !cityFilter || (row.city && row.city.toLowerCase().includes(cityFilter));
      
      const q = (globalQuery || '').toLowerCase();
      const matchesSearch = !q ||
        (row.invoiceName && row.invoiceName.toLowerCase().includes(q)) ||
        (row.address && row.address.toLowerCase().includes(q)) ||
        (row.city && row.city.toLowerCase().includes(q)) ||
        (row.shipment && row.shipment.toLowerCase().includes(q));

      return matchesName && matchesAddress && matchesCity && matchesSearch;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconMapPin}
      title={"Customer Address Master"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAddresses} color="primary" size="small" sx={{
              border: '2px solid', borderColor: 'divider', borderRadius: '8px', p: 1,
              transition: 'all 0.2s', '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.05)' }
            }}>
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
          <BOSExportButton
            data={filteredRows}
            filename="Customer_Addresses"
            
           screenColumns={columns} />
          <Tooltip title={shortcutTooltip('Add New Address', 'Ctrl + N')}>
            <Button variant="contained" color="primary" size="medium" onClick={handleOpenAdd} sx={btnNew}>
              + New
            </Button>
          </Tooltip>
        </Stack>
      }
    >
      <BOSDataTable
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleOpenEdit}
        onEditRow={handleOpenEdit}
        onDeleteRow={handleDeleteClick}
      />

      <AddCustomerDetailsDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} />
      
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Address"
        message="Are you sure you want to delete this customer address? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
