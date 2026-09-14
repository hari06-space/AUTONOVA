import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Tooltip, IconButton, Button, useTheme, Select, MenuItem, Box, Badge, CircularProgress } from '@mui/material';
import { IconRefresh, IconMail, IconPlus, IconMailForward, IconUser, IconSettings, IconPaperclip } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';

import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSExportButton, btnNew, btnEdit, getCommonDateFilters, matchCommonDateFilters, BOSFilePreview } from 'ui-component/bos';;
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import WorkItemMasterDialog from './WorkItemMasterDialog';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import ForwardMailDialog from './ForwardMailDialog';
import CustomerGmailDialog from './CustomerGmailDialog';
import CategoryDialog from './CategoryDialog';
import StatusDialog from './StatusDialog';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

const columns = [
  { id: 'wiNo', label: 'OCR NO', minWidth: 80, bold: true },
  { id: 'dateTime', label: 'DATE & TIME', minWidth: 150 },
  { id: 'att', label: 'Attachment', minWidth: 100 },
  { id: 'category', label: 'CATEGORY', minWidth: 130 },
  { id: 'custCode', label: 'CUST CODE', minWidth: 100 },
  { id: 'custName', label: 'CUST NAME', minWidth: 180 },
  { id: 'from', label: 'FROM', minWidth: 180 },
  { id: 'to', label: 'TO', minWidth: 80 },
  { id: 'subject', label: 'SUBJECT', minWidth: 250 },
  { id: 'noOfItems', label: 'NO OF ITEMS', minWidth: 100 },
  { id: 'enqEntry', label: 'ENQ ENTRY NO', minWidth: 140 },
  { id: 'quoteEntry', label: 'QUOTE ENTRY NO', minWidth: 150 },
  { id: 'saleOrderEntr', label: 'SALE ORDER ENTRY NO', minWidth: 180 },
  { id: 'mode', label: 'MODE', minWidth: 100 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

const getSenderDomain = (email) => {
  if (!email) return '';
  const idx = email.lastIndexOf('@');
  return idx !== -1 ? email.slice(idx).toLowerCase().trim() : '';
};

const btnAction = (theme, type) => {
  const colors = {
    customer: theme.palette.success,
    category: theme.palette.warning,
    status: theme.palette.secondary,
    forward: theme.palette.primary,
  };
  const color = colors[type] || theme.palette.primary;
  return {
    height: 38,
    minHeight: 38,
    borderRadius: '10px',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
    px: 2.5,
    whiteSpace: 'nowrap',
    bgcolor: color.main,
    color: color.contrastText || '#fff',
    transition: 'all 0.2s',
    '&:hover': {
      bgcolor: color.dark,
      transform: 'translateY(-1.5px)',
      boxShadow: `0 8px 22px ${color.main}73`
    },
    '&:active': {
      transform: 'translateY(0)'
    }
  };
};

export default function EnquiryDashboard() {
  const theme = useTheme();
  const perms = usePagePermissions(PAGE_CODES.SM_OCR_DASHBOARD);
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const defaultFromDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const defaultToDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    axios.get('/api/sm/customers')
      .then(res => {
        setCustomers(res.data || []);
      })
      .catch(err => {
        console.error('Failed to fetch customers for domain matching:', err);
      });
  }, []);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedRowForActions, setSelectedRowForActions] = useState(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewAllFiles, setPreviewAllFiles] = useState([]);
  const [previewEmailId, setPreviewEmailId] = useState('');
  const [loadingAttachmentsRowId, setLoadingAttachmentsRowId] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const handleSyncMail = async () => {
    setSyncing(true);
    try {
      const res = await axios.post('/api/ocr/processing-requests/sync?companyId=1');
      const msg = res.data?.message || 'Mail sync completed successfully.';
      dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      await fetchWorkItems();
    } catch (error) {
      console.error('Failed to sync mail:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to sync mail from server.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    } finally {
      setSyncing(false);
    }
  };

  const handleAttachmentClick = async (row) => {
    setLoadingAttachmentsRowId(row.id);
    try {
      const res = await axios.get(`/api/ocr/processing-requests/${row.id}/attachments`);
      const files = (res.data || []).map(att => ({
        id: att.id,
        fileName: att.name,
        serverFileName: att.id,
        url: `/api/ocr/processing-requests/${row.id}/attachments/${att.id}`,
        isServer: true
      }));
      if (files.length > 0) {
        setPreviewEmailId(row.emailMessageId);
        setPreviewAllFiles(files);
        setPreviewFile(files[0]);
        setPreviewOpen(true);
      } else {
        dispatch(openSnackbar({ open: true, message: 'No attachments found for this email.', variant: 'alert', alert: { variant: 'filled' }, severity: 'info' }));
      }
    } catch (err) {
      console.error('Failed to fetch row attachments:', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to load attachments.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    } finally {
      setLoadingAttachmentsRowId(null);
    }
  };

  const renderCell = (col, row, idx) => {
    if (col.id === 'att') {
      const count = row.attachmentCount || 0;
      if (count > 0) {
        return (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', p: 0.5, overflow: 'visible' }}>
            <Tooltip title="View Attachments">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAttachmentClick(row);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                }}
                disabled={loadingAttachmentsRowId === row.id}
                sx={{ overflow: 'visible', p: 0.75 }}
              >
                {loadingAttachmentsRowId === row.id ? (
                  <CircularProgress size={18} />
                ) : (
                  <Badge
                    badgeContent={count}
                    color="secondary"
                    sx={{
                      overflow: 'visible',
                      '& .MuiBadge-badge': {
                        fontSize: '0.68rem',
                        height: 16,
                        minWidth: 16,
                        padding: '0 4px',
                        borderRadius: '8px',
                        boxShadow: '0 0 0 1.5px #fff',
                        right: -4,
                        top: -2
                      }
                    }}
                  >
                    <IconPaperclip size={18} />
                  </Badge>
                )}
              </IconButton>
            </Tooltip>
          </Box>
        );
      }
      return '-';
    }
    return null;
  };

  const getCleanDomain = (domainOrEmail) => {
    if (!domainOrEmail) return '';
    let str = domainOrEmail.toLowerCase().trim();
    const idx = str.lastIndexOf('@');
    if (idx !== -1) {
      str = str.slice(idx + 1);
    }
    if (str.startsWith('@')) {
      str = str.slice(1);
    }
    return str.trim();
  };

  const checkSelected = () => {
    if (!selectedRowForActions) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select an enquiry from the table first.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
      return false;
    }
    return true;
  };

  const handleCustomerClick = () => {
    if (!checkSelected()) return;
    const fromEmail = selectedRowForActions.from || '';
    const domain = getCleanDomain(fromEmail);
    if (domain !== 'gmail.com' && domain !== 'yahoo.com') {
      dispatch(openSnackbar({
        open: true,
        message: 'Customer mapping is only available for Gmail and Yahoo emails.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'warning',
        close: false
      }));
      return;
    }
    setCustomerDialogOpen(true);
  };

  // Configure global search filters
  useEffect(() => {
    const config = [
      { id: 'ocrStatusFilter', label: 'OCR Status Type', type: 'select', isStarred: true, defaultValue: 'OCR PENDING', options: [
          { value: 'OCR PENDING', label: 'OCR PENDING' },
          { value: 'ENQUIRY PENDING', label: 'ENQUIRY PENDING' },
          { value: 'ALL', label: 'ALL' }
        ]
      },
      { id: 'wiNo', label: 'OCR No', type: 'text', placeholder: 'Search by OCR No...', isStarred: true },
      { id: 'custName', label: 'Customer Name', type: 'text', placeholder: 'Search by Customer...', isStarred: true },
      { id: 'mode', label: 'Mode', type: 'select', isStarred: true, options: [
          { value: 'All', label: 'All' },
          { value: 'OCR', label: 'OCR' },
          { value: 'MANUAL', label: 'MANUAL' }
        ],
        defaultValue: 'All'
      },
      { id: 'category', label: 'Category', type: 'select', options: [
          { value: 'All', label: 'All' },
          { value: 'Order', label: 'Order' },
          { value: 'Enquiry', label: 'Enquiry' },
          { value: 'Ledger', label: 'Ledger' },
          { value: 'Others', label: 'Others' }
        ]
      },
      { id: 'status', label: 'Status', type: 'select', isStarred: true, options: [
          { value: 'All', label: 'All' },
          { value: 'Open', label: 'Open' },
          { value: 'Hold', label: 'Hold' },
          { value: 'Ledger Request Mail with CC', label: 'Ledger Request Mail with CC' },
          { value: 'Ledger Request Mail', label: 'Ledger Request Mail' },
          { value: 'Abandoned', label: 'Abandoned' },
          { value: 'Not Relevant', label: 'Not Relevant' }
        ],
        defaultValue: 'All'
      },
      { id: 'createdDate', label: 'Created Date', type: 'dateRange', isStarred: true, defaultValueConsider: 'Yes' }
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchWorkItems = useCallback(async () => {
    setLoading(true);
    try {
      const ocrFilter = globalFilters?.ocrStatusFilter || 'OCR PENDING';
      const res = await axios.get(`/api/ocr/processing-requests?ocrStatusFilter=${ocrFilter}`);
      // Sort by id descending so newest id is at the top (same ordering as schedule no)
      const sorted = (res.data || []).sort((a, b) => (b.id || 0) - (a.id || 0));
      setData(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [globalFilters?.ocrStatusFilter]);

 
  useEffect(() => {
    fetchWorkItems();
    
    // Fallback polling: auto-refresh the dashboard table every 15 seconds 
    // to ensure newly synced requests populate even if the WebSocket connection drops.
    const intervalId = setInterval(() => {
      fetchWorkItems();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchWorkItems]);

  useEffect(() => {
    const handleRealtimeUpdate = (e) => {
      const eventData = e.detail;
      if (eventData && (eventData.entityName === 'ProcessingRequest' || eventData.entityName === 'processing_request' || eventData.entityName === 'EmailProcessorService')) {
        fetchWorkItems();
      }
    };
    window.addEventListener('bos-realtime-update', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('bos-realtime-update', handleRealtimeUpdate);
    };
  }, [fetchWorkItems]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = async (row) => { 
    // Fetch full detail (includes emailBodyPreview/content) from the detail API
    try {
      const res = await axios.get(`/api/ocr/processing-requests/${row.id}`);
      setSelectedRow({ ...res.data, wiNo: row.wiNo });
    } catch (err) {
      console.error('Failed to fetch detail:', err);
      // Fallback to list data
      const original = data.find(d => d.id === row.id);
      setSelectedRow({ ...original, wiNo: row.wiNo });
    }
    setIsReadOnly(!perms.write); 
    setDialogOpen(true); 
  };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchWorkItems(); };

  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/ocr/processing-requests/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Enquiry deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchWorkItems();
    } catch (error) {
      console.error('Failed to delete work item:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete work item.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };



  const filteredRows = useMemo(() => {
    const processed = data.map((row) => {
      let custCode = row.customerCode || '-';
      let custName = row.customerName || '-';

      if (row.customerCode || row.customerName) {
        let rawCode = row.customerCode || '';
        let rawName = row.customerName || '';
        
        if (rawName.includes('/')) {
          const parts = rawName.split('/');
          rawCode = parts[0].trim();
          rawName = parts[1].trim();
        } else if (rawName.includes('-')) {
          const parts = rawName.split('-');
          rawCode = parts[0].trim();
          rawName = parts[1].trim();
        }
        
        custCode = rawCode || '-';
        custName = rawName || '-';
      }

      return {
        ...row,
        dynamicCustCode: custCode,
        dynamicCustName: custName,
        mappedStatus: row.status === 'HOLD' ? 'Hold' :
                      row.status === 'LEDGER_REQUEST_MAIL' ? 'Ledger Request Mail' :
                      row.status === 'LEDGER_REQUEST_MAIL_WITH_CC' ? 'Ledger Request Mail with CC' :
                      row.status === 'AWAITING_REVIEW' ? 'Open' :
                      row.status === 'ABANDONED' ? 'Abandoned' :
                      row.status === 'NOT_RELEVANT' ? 'Not Relevant' :
                      row.status === 'COMPLETED' ? 'Completed' :
                      row.status === 'FAILED' ? 'Failed' :
                      (row.status === 'SKIPPED' || !row.status) ? 'Open' : row.status,
        mappedCategory: row.category ? row.category :
                        row.intent === 'GENERAL_INQUIRY' ? 'Others' : 
                        row.intent === 'QUOTATION_REQUEST' ? 'Enquiry' : 
                        row.intent === 'INVOICE_REQUEST' ? 'Order' : 
                        row.intent === 'LEDGER' ? 'Ledger' :
                        row.intent === 'UNCLASSIFIED' ? 'Others' : (row.intent || 'Others'),
        formattedReceivedDate: row.emailReceivedAt ? format(new Date(row.emailReceivedAt), 'dd/MM/yyyy HH:mm') : '-',
        formattedCreatedDate: row.createdAt ? format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm') : '-',
        formattedUpdatedDate: row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yyyy HH:mm') : '-',
        enqEntry: row.enqEntry || row.enqEntryNo || '-',
        quoteEntry: row.quoteEntry || row.quoteEntryNo || '-',
        saleOrderEntr: row.saleOrderEntr || row.saleOrderEntryNo || '-'
      };
    });

    const filtered = processed.filter((row) => {
      const considerDate = globalFilters.createdDateConsider || 'No';
      if (considerDate === 'Yes') {
        const targetDate = row.emailReceivedAt || row.createdAt;
        if (targetDate) {
          try {
            const targetDateStr = format(new Date(targetDate), 'yyyy-MM-dd');
            const fromDateStr = globalFilters.createdDateStart || '';
            const toDateStr = globalFilters.createdDateEnd || '';
            if (fromDateStr && targetDateStr < fromDateStr) return false;
            if (toDateStr && targetDateStr > toDateStr) return false;
          } catch (e) {
            console.error('Failed to parse date:', targetDate, e);
            return false;
          }
        } else {
          return false;
        }
      }

      const q = (globalQuery || '').toLowerCase();
      const wiFilter = (globalFilters.wiNo || '').toLowerCase();
      const custFilter = (globalFilters.custName || '').toLowerCase();
      const modeFilter = globalFilters.mode || 'All';
      const catFilter = globalFilters.category || 'All';
      const statusFilter = globalFilters.status || 'All';

      // Apply OCR Status Type Filter
      const ocrFilterVal = globalFilters.ocrStatusFilter || 'OCR PENDING';
      if (ocrFilterVal === 'OCR PENDING') {
        const isCustEmpty = (row.dynamicCustCode === '-' && row.dynamicCustName === '-');
        const isOpen = row.mappedStatus === 'Open';
        if (!isCustEmpty || !isOpen) return false;
        if (row.mappedCategory === 'Ledger' || row.mappedCategory === 'Order') {
          return false;
        }
      } else if (ocrFilterVal === 'ENQUIRY PENDING') {
        const isCustFilled = (row.dynamicCustCode !== '-' && row.dynamicCustName !== '-');
        const isEnqPending = (!row.quotationNo || row.quotationNo === '-');
        if (!isCustFilled || !isEnqPending) return false;
      }

      const rowMode = (row.mode || (row.emailMessageId && row.emailMessageId.startsWith('MANUAL_') ? 'MANUAL' : (row.emailMessageId ? 'OCR' : 'MANUAL'))).toUpperCase();
      const matchesMode = modeFilter === 'All' || rowMode === modeFilter.toUpperCase();

      const matchesQuery = !q || 
        `${row.id}`.toLowerCase().includes(q) || 
        (row.dynamicCustName || '').toLowerCase().includes(q) || 
        (row.subject || '').toLowerCase().includes(q);

      const matchesWi = !wiFilter || `${row.id}`.toLowerCase().includes(wiFilter);
      const matchesCust = !custFilter || (row.dynamicCustName || '').toLowerCase().includes(custFilter);
      const matchesCat = catFilter === 'All' || row.mappedCategory === catFilter;
      const matchesStatus = statusFilter === 'All' || row.mappedStatus === statusFilter;
      
      return matchesMode && matchesQuery && matchesWi && matchesCust && matchesCat && matchesStatus;
    });

    return filtered.map((row, index) => ({
      ...row,
      id: row.id,
      wiNo: row.id,
      dateTime: row.formattedReceivedDate,
      category: row.mappedCategory,
      custCode: row.dynamicCustCode,
      custName: row.dynamicCustName,
      from: row.emailFrom || '-',
      to: row.emailTo || '-',
      subject: row.emailSubject || '-',
      noOfItems: row.noOfItems || '-',
      enquiryNo: row.quotationNo || row.invoiceNo || '-',
      enqEntry: '-',
      quoteNo: row.quotationNo || '-',
      quoteEntry: '-',
      saleOrderNo: '-',
      saleOrderEntr: '-',
      att: row.attachmentCount || 0,
      mode: (row.mode || (row.emailMessageId && row.emailMessageId.startsWith('MANUAL_') ? 'MANUAL' : (row.emailMessageId ? 'OCR' : 'MANUAL'))).toUpperCase(),
      status: row.mappedStatus,
      createdBy: row.createdBy || 'System',
      createdDate: row.formattedCreatedDate,
      updatedBy: row.updatedBy || '-',
      updatedDate: row.updatedAt ? row.formattedUpdatedDate : '-'
    }));
  }, [data, globalQuery, globalFilters, customers]);

  useEffect(() => {
    if (filteredRows && filteredRows.length > 0) {
      if (!selectedRowForActions || !filteredRows.some(r => r.id === selectedRowForActions.id)) {
        setSelectedRowForActions(filteredRows[0]);
      }
    } else {
      setSelectedRowForActions(null);
    }
  }, [filteredRows, selectedRowForActions]);

  const nextWiNo = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map(d => d.id || 0)) + 1 : 1;
  }, [data]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'ctrl+r': fetchWorkItems,
    'escape': () => { if (dialogOpen) setDialogOpen(false); }
  });

  return (
    <MainCard fullWidth
      pageCode={PAGE_CODES.SM_OCR_DASHBOARD}
      icon={IconMail}
      title={"OCR Dashboard"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mr: 2 }}>
            <Button
              variant="contained"
              sx={btnAction(theme, 'customer')}
              startIcon={<IconUser size={18} />}
              onClick={handleCustomerClick}
            >
              Customer
            </Button>
            <Button
              variant="contained"
              sx={btnAction(theme, 'category')}
              startIcon={<IconSettings size={18} />}
              onClick={() => { if (checkSelected()) setCategoryDialogOpen(true); }}
            >
              Category
            </Button>
            <Button
              variant="contained"
              sx={btnAction(theme, 'status')}
              startIcon={<IconSettings size={18} />}
              onClick={() => { if (checkSelected()) setStatusDialogOpen(true); }}
            >
              Status
            </Button>
            <Button
              variant="contained"
              sx={btnAction(theme, 'forward')}
              startIcon={<IconMailForward size={18} />}
              onClick={() => { if (checkSelected()) setForwardDialogOpen(true); }}
            >
              Forward To
            </Button>
          </Stack>
          {perms.export && <BOSExportButton
            data={filteredRows}
            filename="OCR_Dashboard"
            
           screenColumns={columns} />}
          {perms.write && <Tooltip title={shortcutTooltip('Create New Enquiry', 'Ctrl + N')}>
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
        onEditRow={perms.write || perms.read ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        onDoubleClickRow={perms.write || perms.read ? handleOpenEdit : undefined}
        editTooltip={perms.write ? 'Edit' : 'View'}
        onClickRow={(row) => setSelectedRowForActions(row)}
        selectedRowId={selectedRowForActions?.id}
        renderCell={renderCell}
      />

      <WorkItemMasterDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} perms={perms} nextWiNo={nextWiNo} />
      <ForwardMailDialog open={forwardDialogOpen} handleClose={() => setForwardDialogOpen(false)} row={selectedRowForActions} />
      <CustomerGmailDialog open={customerDialogOpen} handleClose={() => setCustomerDialogOpen(false)} selectedRow={selectedRowForActions} onSelect={() => fetchWorkItems()} />
      <CategoryDialog open={categoryDialogOpen} handleClose={() => setCategoryDialogOpen(false)} selectedRow={selectedRowForActions} onSelect={() => fetchWorkItems()} />
      <StatusDialog open={statusDialogOpen} handleClose={() => setStatusDialogOpen(false)} selectedRow={selectedRowForActions} onSelect={() => fetchWorkItems()} />
      
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Enquiry"
        message="Are you sure you want to delete this enquiry? This action cannot be undone."
        itemName={deleteTarget ? deleteTarget.id : ''}
      />

      {previewOpen && (
        <BOSFilePreview
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewFile(null);
            setPreviewAllFiles([]);
            setPreviewEmailId('');
          }}
          file={previewFile}
          allFiles={previewAllFiles}
          onNavigate={(f) => setPreviewFile(f)}
          url={previewFile?.url || ''}
          title="Attachment"
        />
      )}
    </MainCard>
  );
}
