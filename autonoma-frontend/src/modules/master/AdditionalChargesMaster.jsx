import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTextField, BOSTableToolbar, BOSFormDialog, BOSFormSection, getCommonDateFilters } from 'ui-component/bos';
import { setFilterConfig } from 'store/slices/search';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { Switch, FormControlLabel, MenuItem } from '@mui/material';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'charges', label: 'Charges', minWidth: 200, bold: true },
  { id: 'calculationType', label: 'Calculation Type', minWidth: 150 },
  { id: 'statusText', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

const INITIAL = { charges: '', calculationType: '', status: true };

const AdditionalChargesMaster = () => {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.globalQuery);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.LOG_ADDITIONAL_CHARGES || 'M5310'); // Assuming M5310
  const [data, setData] = useState([]);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  const calculationTypes = ['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'];

  const fetchData = async () => {
    try {
      const res = await axios.get(API_PATHS.SM.ADDITIONAL_CHARGES);
      const formatted = res.data.map((r, i) => ({
        ...r,
        index: i + 1,
        statusText: r.status ? 'Active' : 'Inactive'
      }));
      setData(res.data);
      setRows(formatted);
    } catch (e) {
      console.error(e);
      dispatch(openSnackbar({ open: true, message: 'Failed to fetch data', variant: 'alert', severity: 'error' }));
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const config = [
      { id: 'charges', label: 'Charges', type: 'text', isStarred: true },
      {
        id: 'calculationType',
        label: 'Calculation Type',
        type: 'multiselect',
        isStarred: true,
        options: calculationTypes.map(type => ({ value: type, label: type }))
      },
      ...getCommonDateFilters('createdDate', 'updatedDate')
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').toLowerCase();
    const selCalcTypes = Array.isArray(globalFilters.calculationType) ? globalFilters.calculationType : (globalFilters.calculationType ? [globalFilters.calculationType] : []);

    return rows.filter(row => {
      // 1. Text match (globalQuery)
      const matchesText = !q || (
        (row.charges && row.charges.toLowerCase().includes(q)) ||
        (row.calculationType && row.calculationType.toLowerCase().includes(q))
      );

      // 2. Multiselect match
      const matchesCalcType = selCalcTypes.length === 0 || selCalcTypes.includes(row.calculationType);

      return matchesText && matchesCalcType;
    }).map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, globalQuery, globalFilters]);

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    if (!form.charges || !form.calculationType) {
      dispatch(openSnackbar({ open: true, message: 'Please fill all required fields.', variant: 'alert', severity: 'error' }));
      return;
    }

    try {
      if (selectedId) {
        await axios.put(`${API_PATHS.SM.ADDITIONAL_CHARGES}/${selectedId}`, form);
      } else {
        await axios.post(API_PATHS.SM.ADDITIONAL_CHARGES, form);
      }

      dispatch(openSnackbar({ open: true, message: `Saved successfully!`, variant: 'alert', severity: 'success' }));
      setShowForm(false);
      setForm(INITIAL);
      setSelectedId(null);
      fetchData();
    } catch (e) {
      console.error(e);
      const msg = e.response?.data || 'Failed to save';
      dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', severity: 'error' }));
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteId(row.id);
    setDeleteName(row.charges);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_PATHS.SM.ADDITIONAL_CHARGES}/${deleteId}`);
      dispatch(openSnackbar({ open: true, message: 'Deleted successfully!', variant: 'alert', severity: 'success' }));
      setDeleteOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete', variant: 'alert', severity: 'error' }));
    }
  };

  return (
    <MainCard
      title="Additional Charges Master"
      secondary={
        <BOSTableToolbar
          title="Additional Charges"
          onNew={() => { setForm(INITIAL); setSelectedId(null); setShowForm(true); }}
          hasWritePermission={perms.write || true}
          exportData={rows}
          exportFilename="Additional_Charges_Master"
          hasExportPermission={perms.export || true}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onEditRow={(row) => { setForm({ charges: row.charges, calculationType: row.calculationType, status: row.status }); setSelectedId(row.id); setShowForm(true); }}
        onDeleteRow={handleDeleteClick}
      />

      <BOSFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setForm(INITIAL); setSelectedId(null); }}
        title={selectedId ? 'Edit Additional Charges' : 'New Additional Charges'}
        onSave={handleSave}
        hideCollapse
        maxWidth="sm"
      >
        <BOSFormSection>
          <BOSTextField
            name="charges"
            label="Charges *"
            value={form.charges}
            onChange={handleInputChange}
          />
          <BOSTextField
            select
            name="calculationType"
            label="Calculation Type *"
            value={form.calculationType}
            onChange={handleInputChange}
          >

            {calculationTypes.map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </BOSTextField>

          <FormControlLabel
            control={
              <Switch
                name="status"
                checked={form.status}
                onChange={handleInputChange}
                color="primary"
              />
            }
            label={form.status ? 'Active' : 'Inactive'}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Additional Charges"
        message="Are you sure you want to delete?"
        itemName={deleteName}
      />
    </MainCard>
  );
};

export default AdditionalChargesMaster;
