import { useState, useEffect, useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSValidation from 'hooks/useBOSValidation';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSTextField,
  errorStyle,
  BOSTableToolbar,
  getCommonDateFilters,
  matchCommonDateFilters,
  AssetStatusChip,
  BOSFormSection,
  BOSStatusField
} from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { API_PATHS } from 'utils/api-constants';

const INITIAL_STATE = {
  id: null,
  groupName: '',
  status: true
};

const VALIDATION_RULES = [{ field: 'groupName', label: 'Group Name', required: true }];

export default function AssetGroupMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const perms = usePagePermissions(PAGE_CODES.ASSET_GROUP);

  const columns = useMemo(
    () => [
      { id: 'id', label: 'ID', align: 'center', minWidth: 80, width: '14.28%', bold: true, color: 'primary.main' },
      { id: 'groupName', label: 'Asset Group', minWidth: 150, width: '14.28%' },
      { id: 'createdBy', label: 'Created User', minWidth: 120, width: '14.28%' },
      {
        id: 'createdDate',
        label: 'Created Date',
        align: 'center',
        minWidth: 150,
        width: '14.28%',
        render: (row) => (row.createdDate ? new Date(row.createdDate).toLocaleString() : '')
      },
      { id: 'updatedBy', label: 'Updated User', minWidth: 120, width: '14.28%' },
      {
        id: 'updatedDate',
        label: 'Updated Date',
        align: 'center',
        minWidth: 150,
        width: '14.28%',
        render: (row) => (row.updatedDate ? new Date(row.updatedDate).toLocaleString() : '')
      },
      {
        id: 'status',
        label: 'Status',
        align: 'center',
        minWidth: 100,
        width: '14.28%',
        render: (row) => <AssetStatusChip active={row.status} />
      }
    ],
    []
  );

  useEffect(() => {
    const groupOptions = [
      { value: 'ALL', label: 'ALL' },
      ...rows.map((g) => ({ value: String(g.id), label: g.groupName }))
    ];
    const config = [
      {
        id: 'id',
        label: 'Asset Group',
        type: 'select',
        options: groupOptions,
        defaultValue: 'ALL',
        isStarred: true
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'INACTIVE', label: 'INACTIVE' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      },
      ...getCommonDateFilters('createdDate', 'updatedDate'),
      { id: 'updatedDate', label: 'UPDATED DATE', type: 'dateRange', isStarred: true }
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, rows]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.HRM.ASSET_GROUP);
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch asset groups:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (perms.read) {
      fetchRows();
    }
  }, [fetchRows, perms.read]);

  const handleOpenAdd = () => {
    setFormData(INITIAL_STATE);
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setFormData({
      id: row.id,
      groupName: row.groupName,
      status: row.status
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearErrors(field);
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      if (formData.id) {
        await axios.put(`${API_PATHS.HRM.ASSET_GROUP}/${formData.id}`, formData);
        dispatch(openSnackbar({ open: true, message: 'Updated successfully', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post(API_PATHS.HRM.ASSET_GROUP, formData);
        dispatch(openSnackbar({ open: true, message: 'Created successfully', variant: 'alert', severity: 'success' }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      console.error('Save failed:', error);
      if (error.response?.data?.message?.includes('duplicate') || error.response?.data?.message?.includes('ConstraintViolationException')) {
        setErrors({ groupName: 'Group Name already exists' });
      } else {
        dispatch(openSnackbar({ open: true, message: 'Failed to save', variant: 'alert', severity: 'error' }));
      }
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_PATHS.HRM.ASSET_GROUP}/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Deleted successfully', variant: 'alert', severity: 'success' }));
      fetchRows();
    } catch (error) {
      console.error('Failed to delete asset group:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete. It might be in use.', variant: 'alert', severity: 'error' }));
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // 1. Asset Group Select Filter
      const groupFilter = globalFilters.id || 'ALL';
      if (groupFilter !== 'ALL' && String(row.id) !== groupFilter) return false;

      // 2. Status Filter
      const statusFilter = globalFilters.status || 'ALL';
      if (statusFilter !== 'ALL') {
        const expectedStatus = statusFilter === 'ACTIVE';
        if (row.status !== expectedStatus) return false;
      }

      // 3. Date Filters
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

      // 4. Global Search query
      if (globalQuery) {
        const queryLower = globalQuery.toLowerCase().trim();
        const matchesQuery = (row.groupName && row.groupName.toLowerCase().includes(queryLower));
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * size, page * size + size),
    [filteredRows, page, size]
  );

  if (!perms.read) {
    return null; // The Guard will redirect to access-denied
  }

  return (
    <MainCard
      content={false}
      title="Asset Group"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={perms.write ? handleOpenAdd : undefined}
          newLabel="+ New"
          exportData={filteredRows}
          exportFilename="Asset_Group"
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="asset-group-table"
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        disableSearchFilter={true}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        title={formData.id ? 'Edit Asset Group' : 'Add Asset Group'}
        maxWidth="sm"
      >
        <BOSFormSection>
          <BOSTextField
            label="ID"
            value={formData.id || 'Auto Generated'}
            disabled
            InputProps={{ readOnly: true }}
            fullWidth
          />

          <BOSTextField
            label="Group Name"
            value={formData.groupName}
            onChange={handleChange('groupName')}
            error={!!errors.groupName}
            helperText={errors.groupName}
            required
            fullWidth
            sx={errorStyle(!!errors.groupName)}
          />

          <BOSStatusField
            isCreate={!formData.id}
            type="boolean"
            name="status"
            label="Status"
            value={formData.status}
            onChange={handleChange('status')}
            sx={{ mt: 1 }}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        content={`Are you sure you want to delete "${deleteTarget?.groupName}"?`}
      />
    </MainCard>
  );
}
