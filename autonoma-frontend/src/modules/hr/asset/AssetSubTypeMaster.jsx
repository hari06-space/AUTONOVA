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
  BOSAutocomplete,
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
  groupId: '',
  typeId: '',
  subTypeName: '',
  status: true
};

const VALIDATION_RULES = [
  { field: 'groupId', label: 'Group', required: true },
  { field: 'typeId', label: 'Type', required: true },
  { field: 'subTypeName', label: 'Sub Type Name', required: true }
];

export default function AssetSubTypeMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [types, setTypes] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const perms = usePagePermissions(PAGE_CODES.ASSET_SUB_TYPE);

  const columns = useMemo(
    () => [
      { id: 'id', label: 'ID', align: 'center', minWidth: 70, width: '9.09%', bold: true, color: 'primary.main' },
      { id: 'groupId', label: 'Group ID', align: 'center', minWidth: 80, width: '9.09%' },
      { id: 'assetGroup.groupName', label: 'Group Name', minWidth: 120, width: '9.09%', render: (row) => row.assetGroup?.groupName || '' },
      { id: 'typeId', label: 'Type ID', align: 'center', minWidth: 80, width: '9.09%' },
      { id: 'assetType.type', label: 'Type Name', minWidth: 120, width: '9.09%', render: (row) => row.assetType?.type || '' },
      { id: 'subTypeName', label: 'Asset Sub Type', minWidth: 140, width: '9.09%' },
      { id: 'createdBy', label: 'Created User', minWidth: 100, width: '9.09%' },
      {
        id: 'createdDate',
        label: 'Created Date',
        align: 'center',
        minWidth: 130,
        width: '9.09%',
        render: (row) => (row.createdDate ? new Date(row.createdDate).toLocaleString() : '')
      },
      { id: 'updatedBy', label: 'Updated User', minWidth: 100, width: '9.09%' },
      {
        id: 'updatedDate',
        label: 'Updated Date',
        align: 'center',
        minWidth: 130,
        width: '9.09%',
        render: (row) => (row.updatedDate ? new Date(row.updatedDate).toLocaleString() : '')
      },
      {
        id: 'status',
        label: 'Status',
        align: 'center',
        minWidth: 80,
        width: '9.09%',
        render: (row) => <AssetStatusChip active={row.status} />
      }
    ],
    []
  );

  useEffect(() => {
    const groupOptions = [
      { value: 'ALL', label: 'ALL' },
      ...groups.map((g) => ({ value: String(g.id), label: String(g.id) }))
    ];
    const typeOptions = [
      { value: 'ALL', label: 'ALL' },
      ...types.map((t) => ({ value: String(t.id), label: String(t.id) }))
    ];
    const config = [
      {
        id: 'groupId',
        label: 'Group ID',
        type: 'select',
        options: groupOptions,
        defaultValue: 'ALL',
        isStarred: true
      },
      {
        id: 'typeId',
        label: 'Type ID',
        type: 'select',
        options: typeOptions,
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
  }, [dispatch, groups, types]);

  const fetchDependencies = async () => {
    try {
      const groupRes = await axios.get(`${API_PATHS.HRM.ASSET_GROUP}/active`);
      setGroups(groupRes.data || []);
      const typeRes = await axios.get(`${API_PATHS.HRM.ASSET_TYPE}/active`);
      setTypes(typeRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.HRM.ASSET_SUB_TYPE);
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch asset sub types:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (perms.read) {
      fetchRows();
      fetchDependencies();
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
      groupId: row.groupId,
      typeId: row.typeId,
      subTypeName: row.subTypeName,
      status: row.status
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleChange = (field) => (event) => {
    let value = event && event.target ? event.target.value : event;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      value = value.id !== undefined ? value.id : (value.value !== undefined ? value.value : value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearErrors(field);

    // Auto-clear typeId when group changes
    if (field === 'groupId') {
      setFormData((prev) => ({ ...prev, typeId: '' }));
    }
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      if (formData.id) {
        await axios.put(`${API_PATHS.HRM.ASSET_SUB_TYPE}/${formData.id}`, formData);
        dispatch(openSnackbar({ open: true, message: 'Updated successfully', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post(API_PATHS.HRM.ASSET_SUB_TYPE, formData);
        dispatch(openSnackbar({ open: true, message: 'Created successfully', variant: 'alert', severity: 'success' }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      console.error('Save failed:', error);
      if (error.response?.data?.message?.includes('duplicate') || error.response?.data?.message?.includes('ConstraintViolationException')) {
        setErrors({ subTypeName: 'Asset Sub Type already exists' });
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
      await axios.delete(`${API_PATHS.HRM.ASSET_SUB_TYPE}/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Deleted successfully', variant: 'alert', severity: 'success' }));
      fetchRows();
    } catch (error) {
      console.error('Failed to delete asset sub type:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete. It might be in use.', variant: 'alert', severity: 'error' }));
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // 1. Group ID Filter
      const groupFilter = globalFilters.groupId || 'ALL';
      if (groupFilter !== 'ALL' && String(row.groupId) !== groupFilter) return false;

      // 2. Type ID Filter
      const typeFilter = globalFilters.typeId || 'ALL';
      if (typeFilter !== 'ALL' && String(row.typeId) !== typeFilter) return false;

      // 3. Status Filter
      const statusFilter = globalFilters.status || 'ALL';
      if (statusFilter !== 'ALL') {
        const expectedStatus = statusFilter === 'ACTIVE';
        if (row.status !== expectedStatus) return false;
      }

      // 4. Date Filters
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

      // 5. Global Search query
      if (globalQuery) {
        const queryLower = globalQuery.toLowerCase().trim();
        const matchesQuery =
          (row.subTypeName && row.subTypeName.toLowerCase().includes(queryLower)) ||
          (row.assetType?.type && row.assetType.type.toLowerCase().includes(queryLower)) ||
          (row.assetGroup?.groupName && row.assetGroup.groupName.toLowerCase().includes(queryLower));
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
    return null;
  }

  const filteredTypes = types.filter((t) => t.groupId === formData.groupId);

  return (
    <MainCard
      content={false}
      title="Asset Sub Type"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={perms.write ? handleOpenAdd : undefined}
          newLabel="+ New"
          exportData={filteredRows}
          exportFilename="Asset_Sub_Type"
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="asset-sub-type-table"
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
        title={formData.id ? 'Edit Asset Sub Type' : 'Add Asset Sub Type'}
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

          <BOSAutocomplete
            label="Asset Group"
            value={formData.groupId}
            onChange={handleChange('groupId')}
            options={groups}
            getOptionLabel={(option) => option.groupName || ''}
            error={!!errors.groupId}
            helperText={errors.groupId}
            required
          />

          <BOSAutocomplete
            label="Asset Type"
            value={formData.typeId}
            onChange={handleChange('typeId')}
            options={filteredTypes}
            getOptionLabel={(option) => option.type || ''}
            error={!!errors.typeId}
            helperText={errors.typeId}
            required
            disabled={!formData.groupId}
          />

          <BOSTextField
            label="Sub Type Name"
            value={formData.subTypeName}
            onChange={handleChange('subTypeName')}
            error={!!errors.subTypeName}
            helperText={errors.subTypeName}
            required
            fullWidth
            sx={errorStyle(!!errors.subTypeName)}
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
        content={`Are you sure you want to delete "${deleteTarget?.subTypeName}"?`}
      />
    </MainCard>
  );
}
