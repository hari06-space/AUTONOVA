import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig, setFilters } from 'store/slices/search';
import usePagePermissions from 'hooks/usePagePermissions';
import { BOSDataTable, BOSStatusChip, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { IconSettings } from '@tabler/icons-react';

export default function MachineMaster() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const perms = usePagePermissions('M3520');
  const filters = useSelector((state) => state.search.filters);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/qmt/machines');
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch machines',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (perms.read) {
      fetchRows();
    }
  }, [perms.read, fetchRows]);

  // Set Search Bar Configuration
  useEffect(() => {
    dispatch(setFilterConfig({
      placeholder: 'Search by Asset ID or Name...',
      fields: [
        { name: 'search', type: 'text' },
        { name: 'status', type: 'status' },
        ...getCommonDateFilters()
      ]
    }));
    return () => {
      dispatch(setFilterConfig(null));
      dispatch(setFilters({}));
    };
  }, [dispatch]);

  const handleDeleteClick = (row) => {
    setRowToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rowToDelete) return;
    try {
      await axios.delete(`/api/qmt/machines/${rowToDelete.id}`);
      dispatch(openSnackbar({
        open: true,
        message: 'Asset deleted successfully',
        variant: 'alert',
        alert: { color: 'success' }
      }));
      fetchRows();
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.response?.data || 'Failed to delete Asset',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setDeleteDialogOpen(false);
      setRowToDelete(null);
    }
  };

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search || '');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search || '');
    }, 200);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const columns = useMemo(() => [
    { id: 'index', label: 'S.NO', minWidth: 60, align: 'center' },
    { id: 'assetId', label: 'ASSET ID', minWidth: 150 },
    { id: 'assetName', label: 'ASSET NAME', minWidth: 200 },
    {
      id: 'assetGroup',
      label: 'ASSET GROUP',
      minWidth: 150,
      render: (row) => row?.assetGroupName || row?.assetGroup?.groupName || '-'
    },
    {
      id: 'assetType',
      label: 'ASSET TYPE',
      minWidth: 150,
      render: (row) => row?.assetTypeName || row?.assetType?.typeName || '-'
    },
    { id: 'make', label: 'MAKE', minWidth: 120, render: (row) => row?.make || '-' },
    { id: 'modelNo', label: 'MODEL NO', minWidth: 120, render: (row) => row?.modelNo || '-' },
    {
      id: 'status',
      label: 'STATUS',
      minWidth: 100,
      align: 'center',
      render: (row) => <BOSStatusChip status={row.status ? 'ACTIVE' : 'INACTIVE'} />
    }
  ], []);

  const filteredRows = useMemo(() => {
    const hasSearch = Boolean(debouncedSearch && debouncedSearch.trim());
    const hasStatus = filters.status !== undefined && filters.status !== '';
    const isStatusActive = hasStatus ? (filters.status === 'ACTIVE' || filters.status === true) : null;
    const searchLower = hasSearch ? debouncedSearch.trim().toLowerCase() : '';

    if (!hasSearch && !hasStatus && !filters.startDate && !filters.endDate && !filters.year && !filters.month) {
      return rows;
    }

    const result = [];
    const len = rows.length;
    for (let i = 0; i < len; i++) {
      const row = rows[i];
      if (hasSearch) {
        const idMatch = row.assetId && row.assetId.toLowerCase().includes(searchLower);
        const nameMatch = row.assetName && row.assetName.toLowerCase().includes(searchLower);
        const groupName = row.assetGroupName || row?.assetGroup?.groupName;
        const groupMatch = groupName && groupName.toLowerCase().includes(searchLower);
        const typeName = row.assetTypeName || row?.assetType?.typeName;
        const typeMatch = typeName && typeName.toLowerCase().includes(searchLower);
        if (!idMatch && !nameMatch && !groupMatch && !typeMatch) continue;
      }
      if (hasStatus && row.status !== isStatusActive) {
        continue;
      }
      if (!matchCommonDateFilters(row, filters)) {
        continue;
      }
      result.push(row);
    }
    return result;
  }, [rows, debouncedSearch, filters]);

  return (
    <MainCard content={false} title="Assets/Instruments" secondary={
      <BOSTableToolbar
        onRefresh={fetchRows}
        onNew={perms.write ? () => navigate('/master/qmt/machine/add') : undefined}
        onExport={() => console.log('Export logic here')}
      />
    }>
      <BOSDataTable
        rows={filteredRows}
        columns={columns}
        loading={loading}
        showActions={true}
        onEditRow={perms.write ? (row) => navigate(`/master/qmt/machine/edit/${row.id}`) : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        onDoubleClickRow={perms.write ? (row) => navigate(`/master/qmt/machine/edit/${row.id}`) : undefined}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Asset"
        content="Are you sure you want to delete this Asset? This action cannot be undone."
      />
    </MainCard>
  );
}
