import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { IconPackage } from '@tabler/icons-react';
import axios from 'utils/axios';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters } from 'ui-component/bos';
import BOSStatusChip from 'ui-component/bos/BOSStatusChip';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'bundleCode', label: 'Bundle Code', minWidth: 120, bold: true },
  { id: 'bundleName', label: 'Bundle Name', minWidth: 180 },
  { id: 'bundleType', label: 'Type', minWidth: 120 },
  { id: 'effectiveFrom', label: 'Effective From', minWidth: 120 },
  { id: 'effectiveTo', label: 'Effective To', minWidth: 120 },
  { id: 'isActive', label: 'Status', minWidth: 130, renderCell: (val) => <BOSStatusChip status={val ? 'Active' : 'Inactive'} showIcon={true} width={100} /> },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function ProductBundleList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const perms = usePagePermissions(PAGE_CODES.NPD_PRODUCT_BUNDLE);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/product-bundles');
      if (response && response.data && Array.isArray(response.data)) {
        setRows(response.data);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.map(row => ({
      ...row,
      isActive: row.isActive !== false ? true : false
    }));
  }, [rows]);

  useEffect(() => {
    const config = [
      {
        id: 'bundleType',
        label: 'Bundle Type',
        type: 'select',
        options: [
          { value: 'All', label: 'All' },
          { value: 'Sales Bundle', label: 'Sales Bundle' },
          { value: 'Kit', label: 'Kit' },
          { value: 'Package', label: 'Package' },
          { value: 'Promotion Combo', label: 'Promotion Combo' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'isActive',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'All', label: 'All' },
          { value: true, label: 'ACTIVE' },
          { value: false, label: 'INACTIVE' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      { id: 'createdDate', label: 'Created Date', type: 'date' },
      { id: 'updatedDate', label: 'Updated Date', type: 'date' },
      ...getCommonDateFilters('createdDate', 'updatedDate')
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const handleOpenAdd = () => {
    navigate('/dd/product-bundle/add');
  };

  const handleOpenEdit = (row) => {
    navigate(`/dd/product-bundle/edit/${row.id}`);
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.bundleName || `Bundle #${row.bundleCode}`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/product-bundles/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Bundle deleted successfully!', variant: 'alert', severity: 'success' }));
      fetchBundles();
    } catch (error) {
      console.error('Failed to delete bundle:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete bundle.', variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': () => { if (perms.write) handleOpenAdd(); }
  });

  return (
    <MainCard
      contentSX={{ p: 0 }}
      icon={IconPackage}
      title={"Product Bundle"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchBundles}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Bundle', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          exportFilename="Product_Bundles"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product Bundle"
        message="Are you sure you want to delete this bundle? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
