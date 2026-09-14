import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconList } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddDetectionFmeaDialog from './AddDetectionFmeaDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| NPD DETECTION FMEA MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'id', label: 'ID', minWidth: 80 },
  { id: 'detection', label: 'Detection', minWidth: 200, bold: true },
  { id: 'criteria', label: 'Criteria', minWidth: 200 },
  { id: 'detectionMethod', label: 'Detection Method', minWidth: 200 },
  { id: 'aAvail', label: 'A Avail', minWidth: 100 },
  { id: 'bAvail', label: 'B Avail', minWidth: 100 },
  { id: 'cAvail', label: 'C Avail', minWidth: 100 },
  { id: 'rank', label: 'Rank', minWidth: 80 },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 120 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedBy', label: 'UPDATED_BY', minWidth: 120 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 },
  { id: 'status', label: 'Status', minWidth: 100, status: true }
];

export default function DetectionFmeaMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_DETECTION_FMEA);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetRow, setDeleteTargetRow] = useState(null);

  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        isRequired: true,
        isStarred: true,
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }
        ],
        defaultValue: 'ACTIVE'
      },
      ...getCommonDateFilters('createdAt', 'updatedAt'),
      {
        id: 'createdBy',
        label: 'CREATED BY',
        type: 'text',
        isStarred: false
      },
      {
        id: 'updatedBy',
        label: 'UPDATED BY',
        type: 'text',
        isStarred: false
      }
     ];
     dispatch(setFilterConfig(config));
     dispatch(setFilters({
       status: 'ACTIVE',
       createdAtStart: '',
       createdAtEnd: '',
       createdAtConsider: 'No',
       updatedAtStart: '',
       updatedAtEnd: '',
       updatedAtConsider: 'No',
       createdBy: '',
       updatedBy: ''
     }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.DETECTION_FMEA);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch detection FMEA records:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchData(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetRow(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.DETECTION_FMEA}/${deleteTargetRow.id}`);
      dispatch(openSnackbar({ open: true, message: 'Detection FMEA deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchData();
    } catch (error) {
      console.error('Failed to delete detection FMEA record:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete detection FMEA record.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const processedRows = useMemo(() => {
    return rows.map((row) => {
      const isUpdated = row.updatedAt && row.createdAt && Math.abs(new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime()) > 1000;
      return {
        ...row,
        updatedBy: isUpdated ? (row.updatedBy || '-') : '-',
        updatedAt: isUpdated ? row.updatedAt : null,
        updatedDate: isUpdated ? row.updatedDate : null,
        updated_at: isUpdated ? row.updated_at : null,
        updated_date: isUpdated ? row.updated_date : null
      };
    });
  }, [rows]);

  const filteredRows = useMemo(() => {
    return processedRows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      // 1. Status Filter
      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL') {
        const isActive = row.status === true || row.status === 'ACTIVE' || row.status === 1 || row.status === 'Active';
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      // 2. Primary Field (Detection)
      const detectionFilter = globalFilters.detection || '';
      if (detectionFilter && !(row.detection || '').toLowerCase().includes(detectionFilter.toLowerCase())) return false;

      // 3. Created By Filter
      const createdByFilter = globalFilters.createdBy || '';
      if (createdByFilter && !(row.createdBy || '').toLowerCase().includes(createdByFilter.toLowerCase())) return false;

      // 4. Updated By Filter
      const updatedByFilter = globalFilters.updatedBy || '';
      if (updatedByFilter && !(row.updatedBy || '').toLowerCase().includes(updatedByFilter.toLowerCase())) return false;

      // 5. Wildcard Query Search
      const matchesSearch = !globalQuery ||
        (row.detection && row.detection.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.criteria && row.criteria.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.detectionMethod && row.detectionMethod.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    }).map((r, i) => ({
      ...r,
      index: i + 1
    }));
  }, [processedRows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconList}
      title={"Detection FMEA Master"}
      secondary={
        <BOSTableToolbar
          id="npd-detection-fmea-toolbar"
          onRefresh={fetchData}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Detection FMEA', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Detection_FMEA_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="npd-detection-fmea-table"
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddDetectionFmeaDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Detection FMEA"
        message="Are you sure you want to delete this Detection FMEA? This action cannot be undone."
        itemName={deleteTargetRow?.detection}
      />
    </MainCard>
  );
}
