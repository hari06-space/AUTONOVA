import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconFileDownload, IconRefresh, IconAddressBook } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import AddContactDialog from './AddContactDialog';
import { exportToExcel } from 'utils/excelExport';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSExportButton, btnExport, btnNew, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;

// ==============================|| SM - CONTACT MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'type', label: 'Type', minWidth: 120 },
  { id: 'title', label: 'Title', minWidth: 100 },
  { id: 'groupName', label: 'Customer Name', minWidth: 150 },
  { id: 'contactName', label: 'Contact Name', minWidth: 200, bold: true },
  { id: 'contactType', label: 'Contact Type', minWidth: 150 },
  { id: 'designation', label: 'Designation', minWidth: 150 },
  { id: 'department', label: 'Department', minWidth: 150 },
  { id: 'emailId', label: 'Email ID', minWidth: 200 },
  { id: 'landlineNo', label: 'Landline No', minWidth: 120 },
  { id: 'mobileNo', label: 'Mobile No', minWidth: 120 },
  { id: 'whatsAppNo', label: 'WhatsApp No', minWidth: 120 },
  { id: 'fileUpload', label: 'File Upload', minWidth: 120 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function ContactMasterList() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.CRM_CONTACT);

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

  useEffect(() => {
    const config = [{ id: 'contactName', label: 'Contact Name', type: 'text', placeholder: 'Search by Name...', isStarred: true },
      { id: 'groupName', label: 'Customer Name', type: 'text', placeholder: 'Search by Customer Name...', isStarred: true },
      { id: 'emailId', label: 'Email', type: 'text', placeholder: 'Search by Email...' },
      ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.SM.CONTACTS);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchContacts(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.contactName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.CONTACTS}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Contact deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchContacts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete contact.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const handleExport = () => {
    const exportData = filteredRows.map((r, i) => ({
      '#': i + 1,
      'Type': r.type || '',
      'Title': r.title || '',
      'Customer Name': r.groupName || '',
      'Contact Name': r.contactName || '',
      'Contact Type': r.contactType || '',
      'Designation': r.designation || '',
      'Department': r.department || '',
      'Email ID': r.emailId || '',
      'Landline No': r.landlineNo || '',
      'Mobile No': r.mobileNo || '',
      'WhatsApp No': r.whatsAppNo || '',
      'File Upload': r.fileUpload || '',
      'Status': r.status || ''
    }));
    exportToExcel(exportData, 'Contact_Master');
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

      const nameFilter = (globalFilters.contactName || '').toLowerCase();
      const groupFilter = (globalFilters.groupName || '').toLowerCase();
      const emailFilter = (globalFilters.emailId || '').toLowerCase();
      
      const matchesName = !nameFilter || (row.contactName && row.contactName.toLowerCase().includes(nameFilter));
      const matchesGroup = !groupFilter || (row.groupName && row.groupName.toLowerCase().includes(groupFilter));
      const matchesEmail = !emailFilter || (row.emailId && row.emailId.toLowerCase().includes(emailFilter));
      
      const q = (globalQuery || '').toLowerCase();
      const matchesSearch = !q ||
        (row.contactName && row.contactName.toLowerCase().includes(q)) ||
        (row.groupName && row.groupName.toLowerCase().includes(q)) ||
        (row.emailId && row.emailId.toLowerCase().includes(q)) ||
        (row.designation && row.designation.toLowerCase().includes(q));

      return matchesName && matchesGroup && matchesEmail && matchesSearch;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconAddressBook}
      title={"Contact Master"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={fetchContacts} color="primary" size="small" sx={{
              border: '2px solid', borderColor: 'divider', borderRadius: '8px', p: 1,
              transition: 'all 0.2s', '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.05)' }
            }}>
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
          {perms.export && <BOSExportButton
            data={filteredRows}
            filename="Contact_Master"
            
           screenColumns={columns} />}
          {perms.write && <Tooltip title={shortcutTooltip('Create New Contact', 'Ctrl + N')}>
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
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddContactDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
