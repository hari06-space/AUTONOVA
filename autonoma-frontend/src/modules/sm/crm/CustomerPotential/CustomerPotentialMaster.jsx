import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconCoins, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddPotentialDialog from './AddPotentialDialog';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSExportButton, btnNew, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| CUSTOMER POTENTIAL MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 60 },
  { id: 'customerGroupName', label: 'Customer Group Name', minWidth: 180 },
  { id: 'customerCode', label: 'Customer Code', minWidth: 120, bold: true },
  { id: 'customerType', label: 'Customer Type', minWidth: 120 },
  { id: 'manufacturerOem', label: 'Manufacturer OEM', minWidth: 160 },
  { id: 'wtgModel', label: 'WTG Model', minWidth: 140 },
  { id: 'windTurbinePower', label: 'Wind Turbine Power in MW', minWidth: 180 },
  { id: 'windFarmName', label: 'Wind Farm Name', minWidth: 160 },
  { id: 'area', label: 'Area', minWidth: 140 },
  { id: 'pincode', label: 'Pin Code', minWidth: 120 },
  { id: 'state', label: 'State', minWidth: 120 },
  { id: 'country', label: 'Country', minWidth: 120 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'status', label: 'Status', minWidth: 100 }
];

export default function CustomerPotentialMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.CRM_POTENTIAL);

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

  // Starred filter configuration for Customer Potential
  useEffect(() => {
    const config = [{
        id: 'groupContains',
        label: 'Group Name Contains',
        type: 'text',
        defaultValue: '',
        isStarred: true
      },
      {
        id: 'codeContains',
        label: 'Code Contains',
        type: 'text',
        defaultValue: '',
        isStarred: true
      },
      ...getCommonDateFilters('createdAt', 'updatedAt')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchPotentials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.SM.POTENTIAL);
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch Customer Potentials:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPotentials();
  }, [fetchPotentials]);

  const handleOpenAdd = () => {
    setSelectedRow(null);
    setIsReadOnly(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setSelectedRow(row);
    setIsReadOnly(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = (refresh) => {
    setDialogOpen(false);
    if (refresh === true) fetchPotentials();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.customerCode);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.POTENTIAL}/${deleteTargetId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Customer Potential deleted successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      fetchPotentials();
    } catch (error) {
      console.error('Failed to delete Customer Potential:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete Customer Potential.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => {
      if (dialogOpen) handleCloseDialog();
    }
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      // 1. Group Name contains filter
      const groupFilter = globalFilters.groupContains || '';
      const matchesGroup =
        !groupFilter ||
        (row.customerGroupName &&
          row.customerGroupName.toLowerCase().includes(groupFilter.toLowerCase()));

      // 2. Code contains filter
      const codeFilter = globalFilters.codeContains || '';
      const matchesCode =
        !codeFilter ||
        (row.customerCode &&
          row.customerCode.toLowerCase().includes(codeFilter.toLowerCase()));

      // 3. Global search query
      const matchesSearch =
        !globalQuery ||
        (row.customerGroupName &&
          row.customerGroupName.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.customerCode &&
          row.customerCode.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.customerType &&
          row.customerType.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.manufacturerOem &&
          row.manufacturerOem.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.wtgModel &&
          row.wtgModel.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.windFarmName &&
          row.windFarmName.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.area && row.area.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.state && row.state.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.country && row.country.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesGroup && matchesCode && matchesSearch;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * size, page * size + size),
    [filteredRows, page, size]
  );

  return (
    <MainCard fullWidth
      icon={IconCoins}
      title={"Customer Potential Master"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchPotentials}
              color="primary"
              size="small"
              sx={{
                border: '2px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                p: 1,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.05)' }
              }}
            >
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
          {perms.export && <BOSExportButton
            data={filteredRows}
            filename="Customer_Potential_Master"
            
           screenColumns={columns} />}
          {perms.write && <Tooltip title={shortcutTooltip('Create New Customer Potential', 'Ctrl + N')}>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleOpenAdd}
              sx={btnNew}
            >
              + New
            </Button>
          </Tooltip>}
        </Stack>
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
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddPotentialDialog
        open={dialogOpen}
        handleClose={handleCloseDialog}
        initialData={selectedRow}
        readOnly={isReadOnly}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Potential details"
        message="Are you sure you want to delete this Customer Potential details? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
