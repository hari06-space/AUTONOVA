import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Grid,
  TextField
} from '@mui/material';
import { IconClipboardList, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSStatusChip, BOSFormDialog, BOSTextField, BOSStatusField } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import usePagePermissions from 'hooks/usePagePermissions';

const SATISFACTION_TYPES = ['Employee', 'Vendor', 'Customer', 'Internal Customer'];

const columns = [
  { id: 'index', label: 'No', minWidth: 50 },
  { id: 'satisfactionType', label: 'Satisfaction Type', minWidth: 150 },
  { id: 'satisfactionCriteria', label: 'Satisfaction Criteria', minWidth: 350 },
  {
    id: 'status',
    label: 'Status',
    minWidth: 100,
    render: (row) => {
      const active = row.status === 1;
      return (
        <BOSStatusChip
          status={active ? 'Active' : 'Inactive'}
          showIcon={true}
          width={130}
        />
      );
    }
  },
  { id: 'createdBy', label: 'Created By', minWidth: 120 }
];

export default function SatisfactionCriteriaMaster() {
  const dispatch = useDispatch();
  const perms = usePagePermissions('M2270');

  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('All');
  const [searchCriteria, setSearchCriteria] = useState('');
  
  // Dialog Form states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formType, setFormType] = useState('Employee');
  const [formCriteria, setFormCriteria] = useState('');
  const [formStatus, setFormStatus] = useState(1);

  // Delete Confirm states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchCriteria = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        type: searchType !== 'All' ? searchType : undefined,
        criteria: searchCriteria || undefined
      };
      const res = await axios.get('/api/qms/satisfaction/criteria', { params });
      setRows(res.data.content || []);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch satisfaction criteria:', err);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchType, searchCriteria]);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditId(null);
    setFormType('Employee');
    setFormCriteria('');
    setFormStatus(1);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setIsEditMode(true);
    setEditId(row.id);
    setFormType(row.satisfactionType);
    setFormCriteria(row.satisfactionCriteria);
    setFormStatus(row.status);
    setDialogOpen(true);
  };

  const handleClear = () => {
    setFormType('Employee');
    setFormCriteria('');
    setFormStatus(1);
  };

  const handleSave = async () => {
    if (!formCriteria.trim()) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Satisfaction Criteria is required.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    try {
      const payload = {
        satisfactionType: formType,
        satisfactionCriteria: formCriteria,
        status: formStatus
      };

      if (isEditMode) {
        await axios.put(`/api/qms/satisfaction/criteria/${editId}`, payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Satisfaction Criteria updated successfully!',
            variant: 'alert',
            severity: 'success'
          })
        );
      } else {
        await axios.post('/api/qms/satisfaction/criteria', payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Satisfaction Criteria saved successfully!',
            variant: 'alert',
            severity: 'success'
          })
        );
      }

      setDialogOpen(false);
      fetchCriteria();
    } catch (err) {
      console.error('Failed to save criteria:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to save Satisfaction Criteria.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const handleDelete = (row) => {
    setItemToDelete(row);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`/api/qms/satisfaction/criteria/${itemToDelete.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Satisfaction Criteria deleted successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchCriteria();
    } catch (err) {
      console.error('Failed to delete criteria:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete criteria.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const resolvedRows = rows.map((row, idx) => ({
    ...row,
    index: page * size + idx + 1
  }));

  const actionColumn = {
    label: 'Actions',
    render: (row) => (
      <Stack direction="row" spacing={1}>
        <IconButton size="small" onClick={() => handleOpenEdit(row)} color="primary" disabled={!perms.write}>
          <IconEdit size={18} />
        </IconButton>
        <IconButton size="small" onClick={() => handleDelete(row)} color="error" disabled={!perms.delete}>
          <IconTrash size={18} />
        </IconButton>
      </Stack>
    )
  };

  return (
    <MainCard
      contentClassName="p-0"
      icon={IconClipboardList}
      title={"SATISFACTION CRITERIA"}
      secondary={
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Search Type</InputLabel>
            <Select
              value={searchType}
              label="Search Type"
              onChange={(e) => {
                setSearchType(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="All">All</MenuItem>
              {SATISFACTION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Search Criteria"
            value={searchCriteria}
            onChange={(e) => {
              setSearchCriteria(e.target.value);
              setPage(0);
            }}
            placeholder="Search criteria text..."
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<IconPlus size={18} />}
            onClick={handleOpenAdd}
            disabled={!perms.write}
          >
            Add Criteria
          </Button>
        </Stack>
      }
    >
      <BOSDataTable
        id="qms-satisfaction-criteria-table"
        columns={columns}
        rows={resolvedRows}
        page={page}
        size={size}
        totalCount={totalElements}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        actionColumn={actionColumn}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onClear={handleClear}
        title={`${isEditMode ? 'Update' : 'Add'} Satisfaction Criteria`}
        hasId={isEditMode}
        maxWidth="sm"
      >
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Satisfaction Type</InputLabel>
              <Select
                value={formType}
                label="Satisfaction Type"
                onChange={(e) => setFormType(e.target.value)}
              >
                {SATISFACTION_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <BOSTextField
              fullWidth
              multiline
              rows={4}
              required
              label="Satisfaction Criteria"
              value={formCriteria}
              onChange={(e) => setFormCriteria(e.target.value)}
              placeholder="Enter feedback question/criteria details..."
            />
          </Grid>
          <Grid item xs={12}>
            <BOSStatusField
              isCreate={!isEditMode}
              type="number"
              name="status"
              label="Status"
              value={formStatus}
              onChange={(e) => setFormStatus(Number(e.target.value))}
              disabled={!perms.write}
              fullWidth
            />
          </Grid>
        </Grid>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this satisfaction criteria? This action cannot be undone."
        itemName={itemToDelete?.satisfactionCriteria}
      />
    </MainCard>
  );
}
