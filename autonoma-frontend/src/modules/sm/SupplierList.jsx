import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Stack, Tooltip, IconButton, useTheme } from '@mui/material';
import { IconFileDownload, IconRefresh, IconUserPlus, IconMapPin, IconUser } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
// import AddVendorDialog from './AddVendorDialog'; // Replaced with page navigation
import AddContactDialog from './AddContactDialog';
import AddVendorDetailsDialog from './AddVendorDetailsDialog';
import VendorMindMapDialog from './VendorMindMapDialog';
import { exportToExcel } from 'utils/excelExport';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSExportButton, btnExport, btnNew, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;

// ==============================|| SM - CUSTOMER MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'gstin', label: 'GSTIN Number', minWidth: 150 },
  { id: 'referenceCode', label: 'VENDOR CODE', minWidth: 120 },
  { id: 'vendorName', label: 'Vendor Name', minWidth: 200, bold: true },
  { id: 'vendorType', label: 'Vendor Type', minWidth: 150 },
  { id: 'invoiceName', label: 'Vendor Invoice Name', minWidth: 200 },
  { id: 'shortName', label: 'Short Name', minWidth: 120 },
  { id: 'address', label: 'Address', minWidth: 250 },
  { id: 'pincode', label: 'PinCode', minWidth: 100 },
  { id: 'city', label: 'City', minWidth: 120 },
  { id: 'state', label: 'State', minWidth: 120 },
  { id: 'country', label: 'Country', minWidth: 120 },
  { id: 'modeOfDispatch', label: 'Mode of Dispatch', minWidth: 150 },
  { id: 'contactName', label: 'Contact Person', minWidth: 150 },
  { id: 'mobileNo', label: 'Phone No', minWidth: 120 },
  { id: 'emailId', label: 'Email Id', minWidth: 150 },
  { id: 'department', label: 'Department', minWidth: 120 },
  { id: 'designation', label: 'Designation', minWidth: 120 },
  { id: 'isoNumber', label: 'ISO Number', minWidth: 120 },
  { id: 'isoExpiry', label: 'ISO Expiry', minWidth: 120 },
  { id: 'ndaRequired', label: 'NDA Required', minWidth: 120 },
  { id: 'currency', label: 'Currency', minWidth: 100 },
  { id: 'segment', label: 'Segment', minWidth: 120 },
  { id: 'subSegment', label: 'Sub Segment', minWidth: 120 },
  { id: 'paymentTerms', label: 'Payment Terms', minWidth: 150 },
  { id: 'deliveryTerms', label: 'Delivey Terms', minWidth: 150 },
  { id: 'domainName', label: 'Domain Name', minWidth: 150 },
  { id: 'stateCode', label: 'State Code', minWidth: 100 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'distance', label: 'Distance', minWidth: 100 },
  { id: 'dailyDispatchMail', label: 'Daily Dispatch Mail Req?', minWidth: 180 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function SupplierList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.VEN_SUPPLIER);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [mindMapOpen, setMindMapOpen] = useState(false);
  const [selectedListRow, setSelectedListRow] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const config = [{ id: 'vendorName', label: 'Vendor Name', type: 'text', placeholder: 'Search by Name...', isStarred: true },
      { id: 'gstin', label: 'GSTIN', type: 'text', placeholder: 'Search by GSTIN...', isStarred: true },
      { id: 'invoiceName', label: 'Invoice Name', type: 'text', placeholder: 'Search by Invoice Name...' },
      ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
      try {
        const [vendorsRes, contactsRes] = await Promise.all([
          axios.get('/api/master/vendors'),
          axios.get('/api/sm/contacts')
        ]);
        const contacts = contactsRes.data || [];
        const filteredVendors = vendorsRes.data.filter(v => v.isSupplier || v.isSubcon);
        const mappedData = filteredVendors.map(v => {
          const myContact = contacts.find(c => c.groupName === v.vendorName) || {};
          let typeArr = [];
          if (v.isSupplier) typeArr.push('Supplier');
          if (v.isSubcon) typeArr.push('Subcontractor');
          return {
            ...v,
            vendorType: typeArr.join(', '),
            vendorName: v.vendorName,
            contactName: myContact.contactName || '',
            mobileNo: myContact.mobileNo || '',
            emailId: myContact.emailId || '',
            department: myContact.department || '',
            designation: myContact.designation || '',
            invoiceName: v.printName,
        pincode: v.pinCode || v.pincode,
        currency: v.currencyCode,
        modeOfDispatch: v.dispatchMode,
        isoExpiry: v.isoExpiryDate,
        negotiateVendor: v.negotiateRequired,
          status: v.isActive ? 'Active' : 'Inactive'
        };
      });
        setRows(mappedData);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleOpenAdd = () => navigate('/sm/vendors/create');
  const handleOpenEdit = (row) => navigate(`/sm/vendors/create?id=${row.id}`);
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchVendors(); };

  const handleRowClick = (row) => {
    if (selectedListRow?.id === row.id) {
      setSelectedListRow(null);
    } else {
      setSelectedListRow(row);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.vendorName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/master/vendors/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Vendor deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchVendors();
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete vendor.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const handleExport = () => {
      const exportData = filteredRows.map((r, i) => ({
        '#': i + 1,
        'GSTIN Number': r.gstin,
        'VENDOR CODE': r.referenceCode,
        'Vendor Type': r.vendorType,
        'Vendor Invoice Name': r.invoiceName,
      'Short Name': r.shortName,
      'Address': r.address,
      'PinCode': r.pincode,
      'City': r.city,
      'Country': r.country,
      'Mode of Dispatch': r.dispatchMode,
      'Contact Person': r.contactName,
      'Phone No': r.mobileNo,
      'Email Id': r.emailId,
      'Department': r.department,
      'Designation': r.designation,
      'ISO Number': r.isoNumber,
      'ISO Expiry': r.isoExpiry,
      'NDA Required': r.ndaRequired,
      'Currency': r.currency,
      'Segment': r.segment,
      'Sub Segment': r.subSegment,
      'Payment Terms': r.paymentTerms,
      'Delivery Terms': r.deliveryTerms,
      'Domain Name': r.domainName,
      'State Code': r.stateCode,
      'Status': r.status,
      'Distance': r.distance,
      'Daily Dispatch Mail Req?': r.dailyDispatchMail
    }));
    exportToExcel(exportData, 'Vendor_Master');
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

      const nameFilter = (globalFilters.vendorName || '').toLowerCase();
      const gstinFilter = (globalFilters.gstin || '').toLowerCase();
      const invoiceFilter = (globalFilters.invoiceName || '').toLowerCase();
      
      const matchesName = !nameFilter || (row.vendorName && row.vendorName.toLowerCase().includes(nameFilter));
      const matchesGstin = !gstinFilter || (row.gstin && row.gstin.toLowerCase().includes(gstinFilter));
      const matchesInvoice = !invoiceFilter || (row.invoiceName && row.invoiceName.toLowerCase().includes(invoiceFilter));
      
      const q = (globalQuery || '').toLowerCase();
      const matchesSearch = !q ||
        (row.vendorName && row.vendorName.toLowerCase().includes(q)) ||
        (row.gstin && row.gstin.toLowerCase().includes(q)) ||
        (row.invoiceName && row.invoiceName.toLowerCase().includes(q)) ||
        (row.shortName && row.shortName.toLowerCase().includes(q));

      return matchesName && matchesGstin && matchesInvoice && matchesSearch;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconUserPlus}
      title={"Vendor Master"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={fetchVendors} color="primary" size="small" sx={{
              border: '2px solid', borderColor: 'divider', borderRadius: '8px', p: 1,
              transition: 'all 0.2s', '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.05)' }
            }}>
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
          {perms.export && <BOSExportButton
            data={filteredRows}
            filename="Vendor_Master"
            
           screenColumns={columns} />}
          {perms.write && <Tooltip title={shortcutTooltip('Create New Vendor', 'Ctrl + N')}>
            <Button variant="contained" color="primary" size="medium" onClick={handleOpenAdd} sx={btnNew}>
              + New
            </Button>
          </Tooltip>}
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
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onClickRow={handleRowClick}
        selectedRowId={selectedListRow?.id}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        renderCell={null}
        footerActions={
          <Stack direction="row" spacing={1.5}>
            <Button 
              variant="contained" 
              color="secondary" 
              disabled={!selectedListRow}
              startIcon={<IconUserPlus size={18} />} 
              onClick={() => setContactDialogOpen(true)}
              sx={{ borderRadius: '8px', px: 2, fontWeight: 600, textTransform: 'none' }}
            >
              Add Contact Master
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              disabled={!selectedListRow}
              startIcon={<IconMapPin size={18} />} 
              onClick={() => setDetailsDialogOpen(true)}
              sx={{ borderRadius: '8px', px: 2, fontWeight: 600, textTransform: 'none' }}
            >
              Add Vendor Details
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              disabled={!selectedListRow}
              startIcon={<IconUser size={18} />} 
              onClick={() => setMindMapOpen(true)}
              sx={{ borderRadius: '8px', px: 2, fontWeight: 600, textTransform: 'none' }}
            >
              View Mind Map
            </Button>
          </Stack>
        }
      />

      {/* <AddVendorDialog key={selectedRow?.id || 'new'} open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} /> */}
      <AddContactDialog open={contactDialogOpen} handleClose={() => setContactDialogOpen(false)} initialGroupName={selectedListRow?.vendorName} />
      <AddVendorDetailsDialog open={detailsDialogOpen} handleClose={() => setDetailsDialogOpen(false)} initialData={selectedListRow} />
      
      {mindMapOpen && selectedListRow && (
        <VendorMindMapDialog
          open={mindMapOpen}
          onClose={() => setMindMapOpen(false)}
          vendor={selectedListRow}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}





