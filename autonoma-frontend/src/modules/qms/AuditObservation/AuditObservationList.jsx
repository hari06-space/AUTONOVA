import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Stack, IconButton } from '@mui/material';
import { IconFileText } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSDataTable, BOSStatusChip, BOSTableToolbar, BOSPdfButton } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import AuditObservationPDFDialog from './AuditObservationPDFDialog';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'observationNo', label: 'Observation No', minWidth: 130, bold: true },
  { id: 'observationDate', label: 'Date', minWidth: 100 },
  { id: 'auditScheduleNo', label: 'Schedule No', minWidth: 130 },
  { id: 'auditType', label: 'Audit Type', minWidth: 150 },
  { id: 'departmentName', label: 'Dept Name', minWidth: 150 },
  { id: 'auditee', label: 'Auditee', minWidth: 120 },
  { id: 'auditor', label: 'Auditor', minWidth: 120 },
  { id: 'complianceCount', label: 'Compliance', minWidth: 100 },
  { id: 'ncrCount', label: 'NC', minWidth: 80 },
  { id: 'ofiCount', label: 'OFI', minWidth: 80 },
  { id: 'auditScore', label: 'Score', minWidth: 80 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'pdf', label: 'PDF', minWidth: 60, align: 'center', isConstant: true, disableFilters: true }
];

export default function AuditObservationList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const defaultFromDate = useMemo(() => format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'), []);
  const defaultToDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_OBSERVATION);
  const bosFilters = useBOSFilters(perms);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [selectedPdfRow, setSelectedPdfRow] = useState(null);

  const [auditTypeOptions, setAuditTypeOptions] = useState([
    { value: 'All', label: 'ALL' },
    { value: 'INTERNAL', label: 'INTERNAL' },
    { value: 'EXTERNAL', label: 'EXTERNAL' }
  ]);

  useEffect(() => {
    let isMounted = true;
    axios
      .get(API_PATHS.QMS.AUDIT_TYPE, { skipGlobalAlert: true })
      .then((res) => {
        if (isMounted && res.data && Array.isArray(res.data)) {
          const opts = [{ value: 'All', label: 'ALL' }];
          res.data.forEach((item) => {
            const val = typeof item === 'object' ? (item.auditType || item.name) : item;
            if (val && !opts.some((o) => o.value.toUpperCase() === String(val).toUpperCase())) {
              opts.push({ value: String(val), label: String(val).toUpperCase() });
            }
          });
          if (!opts.some((o) => o.value.toUpperCase() === 'INTERNAL')) opts.push({ value: 'INTERNAL', label: 'INTERNAL' });
          if (!opts.some((o) => o.value.toUpperCase() === 'EXTERNAL')) opts.push({ value: 'EXTERNAL', label: 'EXTERNAL' });
          setAuditTypeOptions(opts);
        }
      })
      .catch((err) => console.warn('Failed to fetch audit types for filter:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;

    dispatch(
      setFilterConfig([
        {
          id: 'taskScope',
          label: 'Scope',
          type: 'select',
          isStarred: true,
          defaultValue: perms.additional1 ? 'Company' : 'Mine',
          options: bosFilters.getFilterOptions()
        },
        {
          id: 'observationDate',
          label: 'Date',
          type: 'dateRange',
          isStarred: true
        },
        {
          id: 'auditType',
          label: 'Audit Type',
          type: 'select',
          options: auditTypeOptions,
          defaultValue: 'All',
          isStarred: true
        },
        {
          id: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'All', label: 'ALL' },
            { value: 'OPEN', label: 'OPEN' },
            { value: 'CLOSED', label: 'CLOSED' }
          ],
          defaultValue: 'OPEN',
          isStarred: true
        },
        {
          id: 'searchBy',
          label: 'Search By',
          type: 'select',
          options: [
            { value: 'All', label: 'All Fields' },
            { value: 'observationNo', label: 'Observation No' },
            { value: 'auditScheduleNo', label: 'Schedule No' },
            { value: 'auditType', label: 'Audit Type' },
            { value: 'departmentName', label: 'Dept Name' },
            { value: 'auditee', label: 'Auditee' },
            { value: 'auditor', label: 'Auditor' },
            { value: 'complianceCount', label: 'Compliance' },
            { value: 'ncrCount', label: 'NC' },
            { value: 'ofiCount', label: 'OFI' },
            { value: 'auditScore', label: 'Score' },
            { value: 'observationDate', label: 'Date' }
          ],
          defaultValue: 'All'
        }
      ])
    );
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, perms.additional1, perms.manager, user, auditTypeOptions]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.QMS.AUDIT_OBSERVATION, {
        params: {
          taskScope: globalFilters.taskScope || undefined,
          currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.name || undefined,
          memberId: (globalFilters.memberId && globalFilters.memberId !== 'All') ? globalFilters.memberId : undefined,
          fromDate: globalFilters.observationDateStart || undefined,
          toDate: globalFilters.observationDateEnd || undefined,
          considerDate: globalFilters.observationDateConsider === true ? 'Yes' : (globalFilters.observationDateConsider || 'No')
        }
      });
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch observations:', error);
    } finally {
      setLoading(false);
    }
  }, [globalFilters.taskScope, globalFilters.memberId, globalFilters.observationDateStart, globalFilters.observationDateEnd, globalFilters.observationDateConsider, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => navigate('/qms/audit/observation/add');
  const handleOpenEdit = (row) => navigate(`/qms/audit/observation/edit/${row.id}`);

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_PATHS.QMS.AUDIT_OBSERVATION}/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Observation deleted!', severity: 'success', variant: 'alert' }));
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to delete observation:', error);
      let errorMsg = 'Failed to delete observation.';
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error.response?.data) {
        errorMsg = error.response.data.message || (typeof error.response.data === 'string' ? error.response.data : errorMsg);
      } else if (error.message) {
        errorMsg = error.message;
      }
      dispatch(openSnackbar({ open: true, message: errorMsg, severity: 'error', variant: 'alert' }));
    }
  };

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').trim().toLowerCase();

    return rows.filter((row) => {
      // 1. Status filter
      const statusFilter = globalFilters.status || 'OPEN';
      const rawStatus = typeof row.status === 'object' ? row.status?.name : row.status;
      const rowStatus = rawStatus ? String(rawStatus).trim().toUpperCase() : '';
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'OPEN' && (rowStatus === 'OPEN' || rowStatus === 'ACTIVE' || rowStatus === 'DRAFT' || !rowStatus)) ||
        (statusFilter === 'CLOSED' && rowStatus === 'CLOSED') ||
        rowStatus === statusFilter.toUpperCase();

      // 2. Audit Type filter
      const auditTypeFilter = globalFilters.auditType || 'All';
      const rawAuditType = typeof row.auditType === 'object' ? (row.auditType?.auditType || row.auditType?.name || row.auditType?.label) : row.auditType;
      const rowAuditType = rawAuditType ? String(rawAuditType).trim().toUpperCase() : '';
      const matchesAuditType =
        auditTypeFilter === 'All' ||
        rowAuditType === auditTypeFilter.toUpperCase() ||
        rowAuditType.includes(auditTypeFilter.toUpperCase()) ||
        auditTypeFilter.toUpperCase().includes(rowAuditType);

      // 3. Search filter (globalQuery + searchBy)
      const searchBy = globalFilters.searchBy || 'All';
      let matchesSearch = true;

      if (q) {
        const obsNo = row.observationNo ? String(row.observationNo).toLowerCase() : '';
        const schedNo = row.auditScheduleNo ? String(row.auditScheduleNo).toLowerCase() : '';
        const dept = row.departmentName ? String(row.departmentName).toLowerCase() : '';
        const auditee = row.auditee ? String(row.auditee).toLowerCase() : '';
        const auditor = row.auditor ? String(row.auditor).toLowerCase() : '';
        const auditType = rawAuditType ? String(rawAuditType).toLowerCase() : (row.auditType ? String(row.auditType).toLowerCase() : '');
        const statusStr = rawStatus ? String(rawStatus).toLowerCase() : '';

        const obsDateStr = row.observationDate ? format(new Date(row.observationDate), 'dd/MM/yyyy') : '';
        const obsDateIso = row.observationDate ? String(row.observationDate).toLowerCase() : '';
        const compStr = row.complianceCount !== undefined && row.complianceCount !== null ? String(row.complianceCount) : '';
        const ncStr = row.ncrCount !== undefined && row.ncrCount !== null ? String(row.ncrCount) : '';
        const ofiStr = row.ofiCount !== undefined && row.ofiCount !== null ? String(row.ofiCount) : '';

        const comp = row.complianceCount || 0;
        const ncr = row.ncrCount || 0;
        const ofi = row.ofiCount || 0;
        const total = comp + ncr + ofi;
        const pct = total === 0 ? 0 : (comp / total) * 100;
        const scoreStr = `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;

        if (searchBy === 'observationNo') {
          matchesSearch = obsNo.includes(q);
        } else if (searchBy === 'auditScheduleNo') {
          matchesSearch = schedNo.includes(q);
        } else if (searchBy === 'departmentName') {
          matchesSearch = dept.includes(q);
        } else if (searchBy === 'auditee') {
          matchesSearch = auditee.includes(q);
        } else if (searchBy === 'auditor') {
          matchesSearch = auditor.includes(q);
        } else if (searchBy === 'auditType') {
          matchesSearch = auditType.includes(q);
        } else if (searchBy === 'complianceCount') {
          matchesSearch = compStr.includes(q);
        } else if (searchBy === 'ncrCount') {
          matchesSearch = ncStr.includes(q);
        } else if (searchBy === 'ofiCount') {
          matchesSearch = ofiStr.includes(q);
        } else if (searchBy === 'auditScore') {
          matchesSearch = scoreStr.toLowerCase().includes(q) || String(pct).includes(q);
        } else if (searchBy === 'observationDate') {
          matchesSearch = obsDateStr.toLowerCase().includes(q) || obsDateIso.includes(q);
        } else {
          // 'All' field matching
          matchesSearch =
            obsNo.includes(q) ||
            schedNo.includes(q) ||
            dept.includes(q) ||
            auditee.includes(q) ||
            auditor.includes(q) ||
            auditType.includes(q) ||
            statusStr.includes(q) ||
            compStr.includes(q) ||
            ncStr.includes(q) ||
            ofiStr.includes(q) ||
            scoreStr.toLowerCase().includes(q) ||
            obsDateStr.toLowerCase().includes(q);
        }
      }

      // 4. Date filter
      const considerDate = globalFilters.observationDateConsider;
      const fromDate = globalFilters.observationDateStart;
      const toDate = globalFilters.observationDateEnd;
      let matchesDate = true;

      if (considerDate === true || considerDate === 'Yes') {
        if (row.observationDate) {
          const rowD = new Date(row.observationDate).getTime();
          if (fromDate) {
            const startD = new Date(fromDate).setHours(0, 0, 0, 0);
            if (rowD < startD) matchesDate = false;
          }
          if (toDate) {
            const endD = new Date(toDate).setHours(23, 59, 59, 999);
            if (rowD > endD) matchesDate = false;
          }
        } else {
           matchesDate = false; 
        }
      }

      return matchesStatus && matchesAuditType && matchesSearch && matchesDate;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'ctrl+e': () => {
      if (paginatedRows.length > 0) handleOpenEdit(paginatedRows[0]);
    }
  });

  const renderCell = (col, row, idx) => {
    if (col.id === 'index') return idx + 1 + page * size;
    const val = row[col.id];
    if (col.id === 'observationDate') return val ? format(new Date(val), 'dd/MM/yyyy') : '-';
    if (col.id === 'status') {
      const statusText = typeof val === 'object' ? val?.name : val;
      return <BOSStatusChip status={statusText} showIcon={true} width={120} />;
    }
    if (col.id === 'pdf') {
      return (
        <BOSPdfButton
          onClick={() => {
            setSelectedPdfRow(row);
            setPdfDialogOpen(true);
          }}
        />
      );
    }
    if (col.id === 'auditScore') {
      const comp = row.complianceCount || 0;
      const ncr = row.ncrCount || 0;
      const ofi = row.ofiCount || 0;
      const total = comp + ncr + ofi;
      if (total === 0) return '0%';
      const pct = (comp / total) * 100;
      return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
    }
    if (col.id === 'auditee' || col.id === 'auditor') {
      if (col.id === 'auditor' && (!val || val === '-' || String(val).trim() === '')) {
        const ext = row.externalName || row.auditSchedule?.externalName;
        if (ext && String(ext).trim() !== '') {
          return `${String(ext).trim()} (External)`;
        }
      }
      if (val && typeof val === 'string' && val.includes(' - ')) {
        return val.split(' - ')[0].trim();
      }
    }
    if (typeof val === 'object' && val !== null) {
      return val.name || val.label || val.id || '-';
    }
    if (val === 0) return '0';
    return val || '-';
  };

  return (
    <MainCard
      fullWidth
      pageCode={PAGE_CODES.QMS_AUDIT_OBSERVATION}
      icon={IconFileText}
      title={"Audit Observation"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Observation', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Audit_Observations"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onEditRow={perms.write || perms.read ? handleOpenEdit : undefined}
        onDeleteRow={
          perms.delete
            ? (row) => {
              setDeleteTarget(row);
              setDeleteDialogOpen(true);
            }
            : undefined
        }
        renderCell={renderCell}
      />

      {deleteDialogOpen && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            handleDeleteConfirm();
            setDeleteDialogOpen(false);
          }}
          title="Delete Audit Observation"
          content={`Are you sure you want to delete observation no ${deleteTarget?.observationNo}?`}
        />
      )}
      {pdfDialogOpen && (
        <AuditObservationPDFDialog
          open={pdfDialogOpen}
          onClose={() => setPdfDialogOpen(false)}
          row={selectedPdfRow}
        />
      )}
    </MainCard>
  );
}
