import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, Link, IconButton, useTheme, Badge, Box } from '@mui/material';
import { IconFileDownload, IconChecks, IconRefresh, IconPaperclip } from '@tabler/icons-react';
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';
import MainCard from 'ui-component/cards/MainCard';
import AddAuditCriteriaDialog from './AddAuditCriteriaDialog';
import { exportToExcel } from 'utils/excelExport';
import { formatDateTime } from 'utils/BOSTimeUtils';
import useConfig from 'hooks/useConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSStatusChip, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { Chip } from '@mui/material';
import useLookups from 'hooks/useLookups';
import BOSFilePreview from 'ui-component/bos/BOSFilePreview';
import { useMasterDataStore } from 'store/useMasterDataStore';

// ==============================|| AUDIT CRITERIA MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'attachment', label: 'Attachment', minWidth: 120, align: 'center', frozen: true },
  { id: 'seqNo', label: 'Seq No', minWidth: 80 },
  { id: 'auditType', label: 'Type', minWidth: 120, bold: true },
  { id: 'clause', label: 'Clause', minWidth: 100 },
  { id: 'criteriaText', label: 'Criteria', minWidth: 250 },
  { id: 'department', label: 'Department', minWidth: 120 },
  { id: 'attachmentRequired', label: 'Attachment Req', minWidth: 120 },
  { id: 'mandatoryCriteria', label: 'Mandatory Criteria', minWidth: 140 },
  { id: 'isActive', label: 'Status', minWidth: 100 },
  { id: 'createdUser', label: 'CREATED USER', minWidth: 120 },
  { id: 'createdDate', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedUser', label: 'UPDATED USER', minWidth: 120 },
  { id: 'updatedDate', label: 'UPDATED DATE', minWidth: 150 }
];

export default function AuditCriteriaMaster() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_CRITERIA);
  const { timeFormat, dateFormat } = useConfig();
  const { auditTypes = [], departments = [] } = useLookups(['AUDIT_TYPE', 'DEPARTMENTS']);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [nextSeq, setNextSeq] = useState('1');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Attachment preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [rowAttachments, setRowAttachments] = useState([]);

  const handleOpenPreview = useCallback((row) => {
    if (!row.attachmentInfo) return;
    try {
      const arr = JSON.parse(row.attachmentInfo);
      if (Array.isArray(arr) && arr.length > 0) {
        const mapped = arr.map(item => ({
          name: item.fileName,
          serverFileName: item.path,
          isServer: true
        }));
        setRowAttachments(mapped);
        setPreviewFile(mapped[0]);
        setPreviewOpen(true);
      }
    } catch (e) {
      console.error('Failed to parse attachmentInfo:', e);
    }
  }, []);

  const getAttachmentCount = useCallback((row) => {
    if (!row.attachmentInfo) return 0;
    try {
      const arr = JSON.parse(row.attachmentInfo);
      return Array.isArray(arr) ? arr.length : 0;
    } catch (e) {
      return 0;
    }
  }, []);

  const renderAttachmentCell = useCallback((row) => {
    const count = getAttachmentCount(row);

    if (count === 0) return '-';

    const badgeLabel = count > 99 ? '99+' : String(count);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Box
          onClick={() => handleOpenPreview(row)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0.5,
            m: 0.5, // Add margin around the box to ensure badge space
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
            }
          }}
        >
          <Badge
            badgeContent={badgeLabel}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                transform: 'scale(1) translate(25%, -25%)', // Pull the badge slightly inward to prevent clipping
                fontSize: count > 99 ? '0.55rem' : '0.65rem',
                fontWeight: 800,
                minWidth: count > 9 ? '20px' : '17px',
                height: count > 9 ? '20px' : '17px',
                boxShadow: (theme) => `0 2px 6px 0 ${theme.palette.primary.main}80`,
              }
            }}
          >
            <IconPaperclip
              size={20}
              style={{
                display: 'block',
                color: theme.palette.primary.main,
              }}
            />
          </Badge>
        </Box>
      </Box>
    );
  }, [theme, getAttachmentCount, handleOpenPreview]);

  const uniqueClauses = useMemo(() =>
    [...new Set((rows || []).map(r => r.clause).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map(cl => ({ value: cl, label: cl })),
    [rows]);

  useEffect(() => {
    const config = [{
      id: 'isActive', label: 'Status', type: 'select',
      options: [
        { value: 'All', label: 'ALL' },
        { value: 'ACTIVE', label: 'ACTIVE' },
        { value: 'INACTIVE', label: 'INACTIVE' }
      ],
      defaultValue: 'ACTIVE',
      isStarred: true
    },
    {
      id: 'auditType',
      label: 'Audit Type',
      type: 'autocomplete',
      options: auditTypes.map(t => ({ value: t.auditType, label: t.auditType })),
      isStarred: true
    },
    {
      id: 'clause',
      label: 'Clause',
      type: 'autocomplete',
      freeSolo: true,
      options: uniqueClauses,
      placeholder: 'Select or type Clause...'
    },
    {
      id: 'criteriaText',
      label: 'Criteria',
      type: 'text',
      placeholder: 'Search criteria...',
      isStarred: true
    },
    {
      id: 'department',
      label: 'Department',
      type: 'autocomplete',
      options: departments.map(d => ({ value: d.departmentName, label: d.departmentName })),
      isStarred: true
    },
    { id: 'createdUser', label: 'CREATED USER', type: 'text' },
    { id: 'updatedUser', label: 'UPDATED USER', type: 'text' },
    ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig({ config, path: '/master/qms/audit/criteria' }));
    return () => dispatch(setFilterConfig({ config: null, path: '/master/qms/audit/criteria' }));
  }, [dispatch, JSON.stringify(auditTypes), JSON.stringify(departments), JSON.stringify(uniqueClauses)]);

  const fetchAuditCriteria = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.QMS.AUDIT_CRITERIA);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch audit criteria:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAuditCriteria(); }, [fetchAuditCriteria]);

  const handleOpenAdd = async () => {
    setSelectedRow(null);
    setIsReadOnly(false);
    try {
      const res = await axios.get(`${API_PATHS.QMS.AUDIT_CRITERIA}/next-seq`);
      setNextSeq(res.data);
    } catch (e) {
      setNextSeq('1');
    }
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => {
    setDialogOpen(false);
    if (refresh === true) {
      fetchAuditCriteria();
      useMasterDataStore.getState().fetchLookups(['AUDIT_CRITERIA'], true);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.criteriaText || `Criteria #${row.seqNo}`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.QMS.AUDIT_CRITERIA}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Audit Criteria deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchAuditCriteria();
      useMasterDataStore.getState().fetchLookups(['AUDIT_CRITERIA'], true);
    } catch (error) {
      console.error('Failed to delete audit criteria:', error);
      let errorMsg = 'Failed to delete.';
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error.response?.data) {
        errorMsg = error.response.data.message || (typeof error.response.data === 'string' ? error.response.data : errorMsg);
      } else if (error.message) {
        errorMsg = error.message;
      }
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const handleExport = () => {
    const exportData = filteredRows.map((r, i) => {
      let exportDept = '';
      if (typeof r.departments === 'string') {
        exportDept = r.departments;
      } else if (Array.isArray(r.departments)) {
        exportDept = r.departments.map(d => {
          if (typeof d === 'string') return d;
          if (!d) return '';
          return d.department?.departmentName;
        }).filter(Boolean).join(', ');
      }
      
      return {
        '#': i + 1,
        'Audit Type': r.auditType,
        'Clause': r.clause,
        'Criteria': r.criteriaText,
        'Department': exportDept,
        'Attachment Req': r.attachmentRequired === true || r.attachmentRequired === 'YES' || r.attachmentRequired === 'true' ? 'YES' : 'NO',
        'Mandatory Criteria': r.mandatoryCriteria === 1 ? 'YES' : 'NO',
        'Attachment Count': getAttachmentCount(r),
        'CREATED USER': r.createdUser || r.createdBy || 'Admin',
        'CREATED DATE': r.createdDate ? formatDateTime(r.createdDate, timeFormat, dateFormat) : '',
        'UPDATED USER': r.updatedUser || r.updatedBy || 'Admin',
        'UPDATED DATE': r.updatedDate ? formatDateTime(r.updatedDate, timeFormat, dateFormat) : '',
        Status: r.isActive ? 'ACTIVE' : 'INACTIVE'
      };
    });
    exportToExcel(exportData, 'Audit_Criteria_Details');
  };

  const filteredRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

      const statusFilter = globalFilters.isActive || 'ACTIVE';
      const isRowActive = row.isActive === true || row.isActive === 'true' || row.isActive === 1;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'ACTIVE' ? isRowActive : !isRowActive);
      const auditTypeFilter = globalFilters.auditType || '';
      const matchesAuditType = !auditTypeFilter || (row.auditType && row.auditType.toLowerCase().includes(auditTypeFilter.toLowerCase()));
      const clauseFilter = globalFilters.clause || '';
      const matchesClause = !clauseFilter || (row.clause && row.clause.toLowerCase().includes(clauseFilter.toLowerCase()));
      const criteriaFilter = globalFilters.criteriaText || '';
      const matchesCriteria = !criteriaFilter || (row.criteriaText && row.criteriaText.toLowerCase().includes(criteriaFilter.toLowerCase()));
      const departmentFilter = (globalFilters.department || '').toString().toLowerCase().trim();
      const deptNames = Array.isArray(row.departments)
        ? row.departments
          .map((d) => {
            if (typeof d === 'string') return d;
            if (!d) return '';
            const deptObj = departments.find((dep) => dep.id?.toString() === d.deptId?.toString());
            return deptObj ? deptObj.departmentName : d.department?.departmentName;
          })
          .filter(Boolean)
          .join(', ')
        : (typeof row.departments === 'string' ? row.departments : '');
        
      // Match if the selected department is included in the comma-separated string
      const matchesDepartment = !departmentFilter || departmentFilter === 'all' ||
        deptNames.toLowerCase().includes(departmentFilter) ||
        (Array.isArray(row.departments) && row.departments.some(d => {
          if (typeof d === 'string') return d.toLowerCase() === departmentFilter;
          if (!d) return false;
          return (d.department?.departmentName || '').toLowerCase() === departmentFilter;
        }));
      const createdUserFilter = globalFilters.createdUser || '';
      const matchesCreatedUser = !createdUserFilter || ((row.createdUser || row.createdBy || '').toLowerCase().includes(createdUserFilter.toLowerCase()));
      const updatedUserFilter = globalFilters.updatedUser || '';
      const matchesUpdatedUser = !updatedUserFilter || ((row.updatedUser || row.updatedBy || '').toLowerCase().includes(updatedUserFilter.toLowerCase()));

      const matchesSearch = !globalQuery ||
        (row.seqNo && String(row.seqNo).toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.clause && String(row.clause).toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.criteriaText && row.criteriaText.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.auditType && row.auditType.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (deptNames && deptNames.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesStatus && matchesAuditType && matchesClause && matchesCriteria && matchesDepartment && matchesCreatedUser && matchesUpdatedUser && matchesSearch;
    });
    // Sort ascending by sequence number (seqNo) to match old records order
    return [...filtered].sort((a, b) => {
      const aNum = parseInt((a.seqNo || '').replace(/\D/g, '')) || 0;
      const bNum = parseInt((b.seqNo || '').replace(/\D/g, '')) || 0;
      if (aNum !== bNum) return aNum - bNum;
      return (a.seqNo || '').localeCompare(b.seqNo || '');
    });
  }, [rows, globalQuery, globalFilters, departments]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  // Custom cell renderer for criteria text link
  const renderCell = (col, row, idx) => {
    const val = row[col.id];
    if (col.id === 'seqNo') return row.seqNo || page * size + idx + 1;
    if (col.id === 'criteriaText') {
      const isHtml = (str) => typeof str === 'string' && /<[a-z][\s\S]*>/i.test(str);
      return (
        <Link
          component="button"
          variant="body2"
          onClick={() => handleOpenEdit(row)}
          sx={{ textAlign: 'left', textDecoration: 'none', color: 'secondary.main', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
        >
          {isHtml(val)
            ? <Box sx={{ '& p': { margin: 0 }, '& ul,& ol': { pl: 2, my: 0 }, fontSize: '0.82rem', pointerEvents: 'none' }} dangerouslySetInnerHTML={{ __html: sanitizeHTML(val) }} />
            : val}
        </Link>
      );
    }
    if (col.id === 'isActive') {
      const statusLabel = val ? 'ACTIVE' : 'INACTIVE';
      return <BOSStatusChip status={statusLabel} showIcon={true} width={100} />;
    }
    if (col.id === 'attachmentRequired') {
      return val === true || val === 'YES' || val === 'true' ? 'YES' : 'NO';
    }
    if (col.id === 'mandatoryCriteria') {
      return val === 1 ? 'YES' : 'NO';
    }
    if (col.id === 'attachment') {
      return renderAttachmentCell(row);
    }
    if (col.id === 'department') {
      if (!row.departments) return '-';
      if (typeof row.departments === 'string') return row.departments;
      if (Array.isArray(row.departments) && row.departments.length === 0) return '-';
      if (Array.isArray(row.departments)) {
        return row.departments
          .map((d) => {
            if (typeof d === 'string') return d;
            if (!d) return '';
            const deptObj = departments.find((dep) => dep.id?.toString() === d.deptId?.toString());
            return deptObj ? deptObj.departmentName : d.department?.departmentName;
          })
          .filter(Boolean)
          .join(', ') || '-';
      }
      return '-';
    }
    if (col.id === 'createdUser') return row.createdUser || row.createdBy || 'Admin';
    if (col.id === 'updatedUser') return row.updatedUser || row.updatedBy || '-';
    if (col.id.toLowerCase().includes('date')) {
      return formatDateTime(val, timeFormat, dateFormat);
    }
    return val ?? '-';
  };

  return (
    <MainCard fullWidth
      icon={IconChecks}
      title={"Audit Criteria Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchAuditCriteria}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Criteria', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}

          exportFilename="Audit_Criteria_Details"
          hasExportPermission={perms.export}
          columns={columns} />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        disableSearchFilter={true}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        renderCell={renderCell}
      />

      <AddAuditCriteriaDialog
        open={dialogOpen}
        handleClose={handleCloseDialog}
        initialData={selectedRow}
        readOnly={isReadOnly}
        nextSeq={nextSeq}
      />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Audit Criteria"
        message="Are you sure you want to delete this audit criteria? This action cannot be undone."
        itemName={deleteTargetName}
      />
      <BOSFilePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
        allFiles={rowAttachments}
        onNavigate={(newFile) => setPreviewFile(newFile)}
      />
    </MainCard>
  );
}
