import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconFolders, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddItemSubtypeDialog from './AddItemSubtypeDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, btnNew, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| PRODUCT ITEM SUB TYPE MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 70 },
  { id: 'itemType', label: 'Item Type', minWidth: 180, bold: true },
  { id: 'subType', label: 'Sub Type', minWidth: 200, bold: true },
  { id: 'prefixBased', label: 'Prefix Based', minWidth: 130 },
  { id: 'status', label: 'Status', minWidth: 100, status: true },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 120 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedBy', label: 'UPDATED_BY', minWidth: 120 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 }
];

export default function ItemSubtypeMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_ITEM_SUBTYPE);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Fetch Item Types to populate dynamic starred filter
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await axios.get(API_PATHS.NPD.ITEM_TYPE);
        const unique = new Map();
        response.data.forEach(t => {
          unique.set(t.itemType, t.itemType);
        });
        const typeOptions = Array.from(unique.values()).map(type => ({
          itemType: type
        }));
        setTypes(typeOptions);
      } catch (error) {
        console.error('Failed to fetch types for filter config:', error);
      }
    };
    fetchTypes();
  }, []);

  // Dispatch standard starred filter configs including Status, CREATED DATE, Sub Type, and Item Type
  useEffect(() => {
    const typeOptions = [
      { value: 'All', label: 'ALL' },
      ...types.map(t => ({ value: t.itemType, label: t.itemType }))
    ];

    const config = [{
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
      { id: 'subType', label: 'Sub Type', type: 'text', placeholder: 'Search sub type...', isStarred: false },
      {
        id: 'itemType', label: 'Item Type', type: 'select',
        options: typeOptions,
        defaultValue: 'ACTIVE',
        isStarred: false
      },
      {
        id: 'createdAt',
        label: 'CREATED DATE',
        type: 'date_range',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      status: 'ACTIVE',
      createdAt: '',
      itemType: 'All'
    }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, types]);

  const fetchItemSubtypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.ITEM_SUBTYPE);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch item subtypes:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItemSubtypes(); }, [fetchItemSubtypes]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchItemSubtypes(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.subType);
    setDeleteTargetName(row.subType);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.ITEM_SUBTYPE}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Item Sub Type deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchItemSubtypes();
    } catch (error) {
      console.error('Failed to delete item subtype:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete item subtype.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt')) return false;

      // 1. Status Filter
      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL') {
        const isActive = row.status === 1 || row.status === 'ACTIVE' || row.status === true;
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }



      // 3. Primary Field (Sub Type)
      const subTypeFilter = globalFilters.subType || '';
      if (subTypeFilter && !(row.subType || '').toLowerCase().includes(subTypeFilter.toLowerCase())) return false;

      // 4. Item Type Filter
      const typeFilter = globalFilters.itemType || 'All';
      const matchesType = typeFilter === 'All' || (row.type?.itemType && row.type.itemType === typeFilter);
      if (!matchesType) return false;

      // 5. Wildcard Search query
      const matchesSearch = !globalQuery ||
        (row.subType && row.subType.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.type?.itemType && row.type.itemType.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.subItemPrefix && row.subItemPrefix.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [rows, globalQuery, globalFilters]);

  // Map rows for correct table display
  const mappedRows = useMemo(() => {
    return filteredRows.map((r) => {
      const isUpdated = r.updatedAt && r.createdAt && Math.abs(new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) > 1000;
      return {
        ...r,
        itemType: r.type?.itemType || '',
        updatedBy: isUpdated ? (r.updatedBy || '-') : '-',
        updatedAt: isUpdated ? r.updatedAt : null,
        updatedDate: isUpdated ? r.updatedDate : null,
        updated_at: isUpdated ? r.updated_at : null,
        updated_date: isUpdated ? r.updated_date : null
      };
    });
  }, [filteredRows]);

  const paginatedRows = useMemo(() => mappedRows.slice(page * size, page * size + size), [mappedRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconFolders}
      title={"Product Item Sub Type Master"}
            secondary={
        <BOSTableToolbar
          onRefresh={fetchItemSubtypes}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Item Sub Type', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={mappedRows}
          
          exportFilename="Product_Item_Sub_Type_Master"
          hasExportPermission={perms.export}
         columns={columns} />
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

      <AddItemSubtypeDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Item Sub Type"
        message="Are you sure you want to delete this item sub type? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}