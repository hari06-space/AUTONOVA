import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Chip } from '@mui/material';
import { IconPackage } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddProductIPPDialog from './AddProductIPPDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| PRODUCT IPP MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 60 },
  { id: 'customerName', label: 'Customer', minWidth: 160, bold: true },
  { id: 'customerGroup', label: 'Cust.Group', minWidth: 140 },
  { id: 'custPartNo', label: 'Cust Part No', minWidth: 150 },
  { id: 'partNo', label: 'Part No', minWidth: 150, bold: true },
  { id: 'oemPartNo', label: 'OEM Part No', minWidth: 160 },
  { id: 'status', label: 'Status', minWidth: 110, status: true },
  { id: 'createdBy', label: 'Created By', minWidth: 140 },
  { id: 'createdAt', label: 'Created Date', minWidth: 160 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 140 },
  { id: 'updatedAt', label: 'Updated Date', minWidth: 160 }
];

export default function ProductIPPMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_PRODUCT_IPP);

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
    const config = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        isRequired: true,
        isStarred: true,
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }
        ],
        defaultValue: 'ACTIVE'
      },
      { id: 'customerName', label: 'Customer', type: 'text', placeholder: 'Search customer...', isStarred: false },
      { id: 'partNo', label: 'Part No', type: 'text', placeholder: 'Search part no...', isStarred: false },
      ...getCommonDateFilters('createdAt', 'updatedAt')
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      status: 'ACTIVE',
      createdAt: '',
      updatedAt: ''
    }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.PRODUCT_IPP);
      const mappedData = (response.data || []).map(r => ({
        ...r,
        status: r.isActive ? 'ACTIVE' : 'INACTIVE'
      }));
      setRows(mappedData);
    } catch (error) {
      console.error('Failed to fetch Product IPP records:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh, savedRecords) => {
    setDialogOpen(false);
    if (refresh === true && savedRecords) {
      setRows((prevRows) => {
        let updatedRows = [...prevRows];
        const records = Array.isArray(savedRecords) ? savedRecords : [savedRecords];
        records.forEach((newRec) => {
          const idx = updatedRows.findIndex((r) => r.id === newRec.id);
          if (idx !== -1) {
            updatedRows[idx] = newRec;
          } else {
            updatedRows.push(newRec);
          }
        });
        return updatedRows;
      });
    }
  };
  const handleRefresh = () => {
    fetchRecords();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.partNo || row.customerName || '');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.PRODUCT_IPP}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Product IPP record deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchRecords();
    } catch (error) {
      console.error('Failed to delete:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete record.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;

      const customerFilter = globalFilters.customerName || '';
      if (customerFilter && !(row.customerName || '').toLowerCase().includes(customerFilter.toLowerCase())) return false;

      const partNoFilter = globalFilters.partNo || '';
      if (partNoFilter && !(row.partNo || '').toLowerCase().includes(partNoFilter.toLowerCase())) return false;

      if (globalQuery) {
        const query = globalQuery.toLowerCase();
        const matchesSearch =
          (row.customerName && row.customerName.toLowerCase().includes(query)) ||
          (row.customerGroup && row.customerGroup.toLowerCase().includes(query)) ||
          (row.custPartNo && row.custPartNo.toLowerCase().includes(query)) ||
          (row.partNo && row.partNo.toLowerCase().includes(query)) ||
          (row.oemPartNo && row.oemPartNo.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      return true;
    }).map((r, i) => {
      const isUpdated = r.updatedAt && r.createdAt && Math.abs(new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) > 1000;
      return {
        ...r,
        index: i + 1,
        updatedBy: isUpdated ? (r.updatedBy || '-') : '-',
        updatedAt: isUpdated ? r.updatedAt : null,
        updatedDate: isUpdated ? r.updatedDate : null,
        updated_at: isUpdated ? r.updated_at : null,
        updated_date: isUpdated ? r.updated_date : null
      };
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  const isRecordUpdated = (row) => {
    const created = row.createdAt || row.createdDate;
    const updated = row.updatedAt || row.updatedDate;
    if (!updated) return false;
    if (!created) return true;
    const msDiff = Math.abs(new Date(updated) - new Date(created));
    return msDiff > 1000;
  };

  const renderCell = (col, row, idx) => {
    if (col.id === 'createdAt') {
      return row.createdAt ? format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm') : '-';
    }
    if (col.id === 'updatedAt') {
      return row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yyyy HH:mm') : '-';
    }
    if (col.id === 'updatedBy') {
      return row.updatedBy || '-';
    }
    return null;
  };

  const exportData = useMemo(() => {
    return filteredRows.map((r) => {
      const updated = isRecordUpdated(r);
      return {
        ...r,
        updatedBy: updated ? (r.updatedBy || '-') : '-',
        updatedAt: updated && r.updatedAt ? format(new Date(r.updatedAt), 'dd/MM/yyyy HH:mm') : '-',
        createdAt: r.createdAt ? format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm') : '-'
      };
    });
  }, [filteredRows]);

  return (
    <MainCard
      fullWidth
      icon={IconPackage}
      title={"Product IPP Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={handleRefresh}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Product IPP', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={exportData}
          exportFilename="Product_IPP_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
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
        renderCell={renderCell}
      />

      <AddProductIPPDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product IPP"
        message="Are you sure you want to delete this record? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}