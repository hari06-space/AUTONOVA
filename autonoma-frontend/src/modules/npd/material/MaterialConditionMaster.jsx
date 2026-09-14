import { useState, useEffect, useMemo } from 'react';
import { MenuItem, Box, useTheme, Typography } from '@mui/material';
import { IconTags } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { BOSDataTable, BOSTextField, BOSStatusField, getCommonDateFilters, matchCommonDateFilters, BOSFormDialog, BOSFormSection, errorStyle, BOSTableToolbar } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import axios from 'utils/axios';
import { useSelector, useDispatch } from 'react-redux';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSValidation from 'hooks/useBOSValidation';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';


const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'code', label: 'Code', minWidth: 120, bold: true },
  { id: 'condition', label: 'Condition', minWidth: 200 },
  { id: 'description', label: 'Description', minWidth: 250 },
  { id: 'type', label: 'Type', minWidth: 150 },
  { id: 'status', label: 'Status', minWidth: 100, status: true },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

const VALIDATION_RULES = [
  { field: 'code', label: 'Code', required: true, maxLength: 50 },
  { field: 'condition', label: 'Condition', required: true, maxLength: 150 }
];

export default function MaterialConditionMaster() {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const perms = usePagePermissions(PAGE_CODES.M3340);
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const { errors, validate, clearErrors } = useBOSValidation();

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpen(),
    escape: () => {
      if (open) handleClose();
    }
  });

  // Add useState, useEffect, useMemo imports back locally inside the file because we removed the main import block
  const [page, setPage] = useState(0);

  const [size, setSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [editCode, setEditCode] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCode, setDeleteCode] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    condition: '',
    description: '',
    type: 'Quality',
    status: true
  });

  const fetchRows = async () => {
    try {
      const res = await axios.get('/api/npd/material/conditions');
      setRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleOpen = (row = null) => {
    clearErrors();
    if (row) {
      setEditCode(row.code);
      setFormData({
        code: row.code || '',
        condition: row.condition || '',
        description: row.description || '',
        type: row.type || 'Quality',
        status: row.status !== undefined ? (row.status === 1 || row.status === true || String(row.status).toUpperCase() === 'ACTIVE' || String(row.status) === '1') : true
      });
    } else {
      setEditCode(null);
      setFormData({
        code: '',
        condition: '',
        description: '',
        type: 'Quality',
        status: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleClear = () => {
    setFormData({
      code: editCode || '',
      condition: '',
      description: '',
      type: 'Quality',
      status: true
    });
    clearErrors();
  };

  const handleSubmit = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;
    try {
      if (editCode) {
        await axios.put(`/api/npd/material/conditions/${editCode}`, formData);
      } else {
        await axios.post('/api/npd/material/conditions', formData);
      }
      handleClose();
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteCode(row.code);
    setDeleteName(row.condition);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/npd/material/conditions/${deleteCode}`);
      setDeleteOpen(false);
      setDeleteCode(null);
      setDeleteName('');
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        isRequired: true,
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }
        ],
        defaultValue: 'ACTIVE',
        isStarred: true
      },
      {
        id: 'createdDate',
        label: 'CREATED DATE',
        type: 'date_range',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      status: 'ACTIVE',
      createdDate: ''
    }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const sourceRows = rows || [];
    return sourceRows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate')) return false;

      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL') {
        const isActive = row.status === 1 || row.status === 'ACTIVE' || row.status === true;
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      const codeFilter = globalFilters.code || '';
      if (codeFilter && !(row.code || '').toLowerCase().includes(codeFilter.toLowerCase())) return false;

      const matchesSearch = !globalQuery ||
        (row.code && row.code.toString().toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.condition && row.condition.toString().toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.type && row.type.toString().toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    }).map((r, i) => {
      const isUpdated = r.updatedDate && r.createdDate && Math.abs(new Date(r.updatedDate).getTime() - new Date(r.createdDate).getTime()) > 1000;
      return {
        ...r,
        index: i + 1,
        updatedBy: isUpdated ? (r.updatedBy || '-') : '-',
        updatedDate: isUpdated ? r.updatedDate : null
      };
    });
  }, [rows, globalQuery, globalFilters]);

  return (
    <MainCard fullWidth
      icon={IconTags}
      title={"Material Condition"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={() => handleOpen()}
          newTooltip={shortcutTooltip('Create New Material Condition', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={rows}
          exportFilename="Material_Condition_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        totalCount={rows.length}
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onEditRow={(row) => handleOpen(row)}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <BOSFormDialog
        open={open}
        onClose={handleClose}
        onSave={handleSubmit}
        onDelete={perms.delete && editCode ? () => handleDeleteClick({ code: editCode, condition: formData.condition }) : undefined}
        onClear={handleClear}
        title={editCode ? 'Edit Condition' : 'New Condition'}
        isViewOnly={!perms.write}
        hasId={!!editCode}
        maxWidth="sm"
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField
            name="code"
            required
            disabled={!perms.write || !!editCode}
            label="Code"
            fullWidth
            value={formData.code}
            onChange={(e) => {
              setFormData({ ...formData, code: e.target.value });
              if (errors.code) clearErrors('code');
            }}
            error={!!errors.code}
            helperText={errors.code}
            sx={errorStyle(!!errors.code)}
          />
          <BOSTextField
            name="condition"
            required
            disabled={!perms.write}
            label="Condition"
            fullWidth
            value={formData.condition}
            onChange={(e) => {
              setFormData({ ...formData, condition: e.target.value });
              if (errors.condition) clearErrors('condition');
            }}
            error={!!errors.condition}
            helperText={errors.condition}
            sx={errorStyle(!!errors.condition)}
          />
          <BOSTextField
            name="description"
            label="Description/SOP"
            multiline
            minRows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Standard Operating Procedure... (or use mic 🎤)"
            InputLabelProps={{ shrink: true }}
            disabled={!perms.write}
          />
          <BOSTextField
            select
            disabled={!perms.write}
            label="Type"
            fullWidth
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <MenuItem value="Quality">Quality</MenuItem>
            <MenuItem value="Stock">Stock</MenuItem>
          </BOSTextField>
          <BOSStatusField
            isCreate={!editCode}
            type="boolean"
            name="status"
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            disabled={!perms.write || !editCode}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog 
        open={deleteOpen} 
        onClose={() => setDeleteOpen(false)} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Condition" 
        message="Are you sure you want to delete this material condition?" 
        itemName={deleteName} 
      />
    </MainCard>
  );
}
