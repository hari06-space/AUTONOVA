import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconSettings } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { useNavigate } from 'react-router-dom';

// ==============================|| PRODUCT MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'itemNo', label: 'ITEM NO', minWidth: 150, bold: true },
  { id: 'itemCode', label: 'ITEM CODE', minWidth: 120 },
  { id: 'itemName', label: 'ITEM NAME', minWidth: 250 },
  { id: 'revNo', label: 'REV NO', minWidth: 100 },
  { id: 'drmReq', label: 'DRM REQ', minWidth: 100 },
  { id: 'inventoryType', label: 'INVENTORY TYPE', minWidth: 150 },
  { id: 'itemGroup', label: 'ITEM GROUP', minWidth: 150 },
  { id: 'itemCategory', label: 'CATEGORY', minWidth: 150 },
  { id: 'itemSubCategory', label: 'SUB CATEGORY', minWidth: 150 },
  { id: 'hsnCode', label: 'HSN CODE', minWidth: 120 },
  { id: 'element', label: 'ELEMENT', minWidth: 120 },
  { id: 'grade', label: 'GRADE', minWidth: 120 },
  { id: 'shape', label: 'SHAPE', minWidth: 120 },
  { id: 'conditions', label: 'CONDITIONS', minWidth: 120 },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 120 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedBy', label: 'UPDATED BY', minWidth: 120 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 },
  { id: 'status', label: 'Status', minWidth: 100, status: true }
];

export default function ProductMaster() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_PRODUCT_MASTER);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
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
          { value: 'ALL', label: 'ALL' },
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'INACTIVE', label: 'INACTIVE' }
        ],
        defaultValue: 'ACTIVE'
      },
      { id: 'itemNo', label: 'Item No', type: 'text', placeholder: 'Search item no...', isStarred: false },
      { id: 'itemName', label: 'Item Name', type: 'text', placeholder: 'Search item name...', isStarred: false },
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

  // Uses the lightweight /list endpoint — no attachments, no identifications
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.PRODUCT_MASTER_LIST);
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleOpenAdd = () => navigate('/master/product-master/add');
  const handleOpenEdit = (row) => navigate(`/master/product-master/edit/${row.id}`);

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.itemNo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.PRODUCT_MASTER}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Product deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete product.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      // 1. Status Filter
      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;

      // 2. Date Filtering is completely handled by matchCommonDateFilters above

      // 3. Item No Filter
      const itemNoFilter = globalFilters.itemNo || '';
      if (itemNoFilter && !(row.itemNo || '').toLowerCase().includes(itemNoFilter.toLowerCase())) return false;

      // 4. Item Name Filter
      const itemNameFilter = globalFilters.itemName || '';
      if (itemNameFilter && !(row.itemName || '').toLowerCase().includes(itemNameFilter.toLowerCase())) return false;

      // 5. Wildcard Query Search
      const matchesSearch = !globalQuery ||
        (row.itemNo && row.itemNo.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.itemName && row.itemName.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
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

  return (
    <MainCard fullWidth
      icon={IconSettings}
      title={"Product Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchProducts}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Product', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Product_Master"
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

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
