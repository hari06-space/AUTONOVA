import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconListCheck, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import PremiumFormDialogTemplate from './PremiumFormDialogTemplate';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSExportButton, btnNew } from 'ui-component/bos';

// ==============================|| PREMIUM PAGE TEMPLATE (BOS SOP COMPLIANT) ||============================== //

/**
 * Reference implementation template for new BOS master pages.
 * Copy this file and customize the columns, filters, and endpoints for your module.
 * This template automatically supports the edge-to-edge "fit to full" responsive layout.
 */

const columns = [
  { id: 'index', label: '#', minWidth: 70 },
  { id: 'field1', label: 'Field One', minWidth: 180, bold: true },
  { id: 'field2', label: 'Field Two', minWidth: 220 },
  { id: 'status', label: 'Status', minWidth: 120, status: true },
  { id: 'createdBy', label: 'CREATED USER', minWidth: 140 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 160 }
];

export default function PremiumPageTemplate() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};

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

  // Dispatch starred filter configuration on mount
  useEffect(() => {
    const config = [
      {
        id: 'field1Contains',
        label: 'Field Contains',
        type: 'text',
        defaultValue: '',
        isStarred: true
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'INACTIVE', label: 'INACTIVE' }
        ],
        defaultValue: 'ACTIVE',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Replace with your actual backend API endpoint
      const response = await axios.get('/api/example/master-data');
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch master data:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

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
    if (refresh === true) fetchData(); 
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.field1);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/example/master-data/${deleteTargetId}`);
      dispatch(openSnackbar({ 
        open: true, 
        message: 'Record deleted successfully!', 
        variant: 'alert', 
        alert: { variant: 'filled' }, 
        severity: 'success', 
        close: false 
      }));
      fetchData();
    } catch (error) {
      console.error('Failed to delete record:', error);
      dispatch(openSnackbar({ 
        open: true, 
        message: 'Failed to delete record.', 
        variant: 'alert', 
        alert: { variant: 'filled' }, 
        severity: 'error', 
        close: false 
      }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // 1. Status Filter
      const statusFilter = globalFilters.status || 'ACTIVE';
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter;

      // 2. Text Search / Specific Field Filter
      const field1Contains = globalFilters.field1Contains || '';
      const matchesFieldContains = !field1Contains ||
        (row.field1 && row.field1.toLowerCase().includes(field1Contains.toLowerCase()));

      // 3. Global Query Search
      const matchesSearch = !globalQuery ||
        (row.field1 && row.field1.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.field2 && row.field2.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesStatus && matchesFieldContains && matchesSearch;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => 
    filteredRows.slice(page * size, page * size + size), 
    [filteredRows, page, size]
  );

  return (
    <MainCard
      contentSX={{ p: 0 }}
      sx={{
        mx: { xs: -2, sm: -3 },
        width: { xs: 'calc(100% + 32px)', sm: 'calc(100% + 48px)' },
        borderRadius: 0
      }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconListCheck size={24} />
          <Typography variant="h3">Premium Master Title</Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton 
              onClick={fetchData} 
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
          
          <BOSExportButton
            data={filteredRows}
            filename="Master_Export"
            columns={[
              { header: 'Field One', key: 'field1' },
              { header: 'Field Two', key: 'field2' },
              { header: 'Status', key: 'status' },
              { header: 'Created By', key: 'createdBy' },
              { header: 'Created Date', key: 'createdAt' }
            ]}
          />
          
          <Tooltip title={shortcutTooltip('Create New Record', 'Ctrl + N')}>
            <Button variant="contained" color="primary" size="medium" onClick={handleOpenAdd} sx={btnNew}>
              + New
            </Button>
          </Tooltip>
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
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleOpenEdit}
        onEditRow={handleOpenEdit}
        onDeleteRow={handleDeleteClick}
      />

      <PremiumFormDialogTemplate 
        open={dialogOpen} 
        handleClose={handleCloseDialog} 
        initialData={selectedRow} 
        readOnly={isReadOnly} 
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete master record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
