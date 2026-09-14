import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Tooltip,
  IconButton,
  useTheme,
  Box
} from '@mui/material';
import { IconReport, IconFileTypePdf } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useLookups from 'hooks/useLookups';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import { API_PATHS } from 'utils/api-constants';
import useColumnVisibility from 'hooks/useColumnVisibility';
import AuditObservationPDFDialog from '../AuditObservation/AuditObservationPDFDialog';

const columns = [
  { id: 'index', label: 'Sl.No', minWidth: 60, align: 'center' },
  { id: 'auditType', label: 'Audit Type', minWidth: 140 },
  { id: 'scheduleNo', label: 'Schedule No', minWidth: 120 },
  { id: 'scheduleDate', label: 'Schedule Date', minWidth: 110, align: 'center' },
  { id: 'observationNo', label: 'Observation No', minWidth: 130, bold: true },
  { id: 'observationDate', label: 'Observation Date', minWidth: 110, align: 'center' },
  { id: 'status', label: 'Status', minWidth: 90, align: 'center' },
  { id: 'pdf', label: 'Pdf', minWidth: 70, align: 'center' },
  { id: 'clause', label: 'Clause No', minWidth: 110, align: 'center' },
  { id: 'criteriaDetails', label: 'Audit Criteria', minWidth: 350 },
  { id: 'comments', label: 'Comments / Remarks', minWidth: 250 },
  { id: 'observationStatus', label: 'Observation Status', minWidth: 160, align: 'center' }
];

const formatDateStr = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return String(dateVal);
  }
};

export default function AuditReport() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_REPORT);

  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [selectedPdfRow, setSelectedPdfRow] = useState(null);

  // Column visibility
  const { visibleColumnIds, toggleColumn, showAllColumns, resetColumns } = useColumnVisibility(
    columns,
    columns.map(c => c.id)
  );

  const { auditSchedules = [] } = useLookups(['AUDIT_SCHEDULE']);

  const [filterOptions, setFilterOptions] = useState({
    employees: [],
    auditTypes: []
  });

  // Fetch filter options dynamically from appropriate master pages
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [empRes, typeRes] = await Promise.all([
          axios.get('/api/master/hr/employees/filter/active'),
          axios.get(API_PATHS.QMS.AUDIT_TYPE)
        ]);

        const employees = empRes.data || [];
        const types = typeRes.data || [];

        const getEmpLabel = (emp) => {
          const fName = emp.firstName || '';
          const lName = emp.lastName || '';
          const empName = emp.employeeName || '';
          let name = '';
          if (fName && lName) {
            name = `${fName} ${lName}`.trim();
          } else if (empName && lName && !empName.toLowerCase().includes(lName.toLowerCase())) {
            name = `${empName} ${lName}`.trim();
          } else if (empName) {
            name = empName;
          } else {
            name = `${fName} ${lName}`.trim();
          }
          return `${name} - ${emp.empCode || emp.employeeCode || emp.id}`;
        };

        const employeesOptions = employees.map(e => ({
          value: getEmpLabel(e),
          label: getEmpLabel(e).split(' - ')[0]
        }));

        const auditTypesOptions = types.map(t => ({ value: t.auditType, label: t.auditType }));

        setFilterOptions({
          employees: employeesOptions,
          auditTypes: auditTypesOptions
        });
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };

    fetchOptions();
  }, []);

  // Set filter config in Redux
  useEffect(() => {
    dispatch(setFilterConfig([
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        isStarred: true,
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'OPEN', label: 'OPEN' },
          { value: 'CLOSED', label: 'CLOSED' },
          { value: 'CANCELLED', label: 'CANCELLED' }
        ],
        defaultValue: 'All'
      },
      {
        id: 'filterBy',
        label: 'Filter By',
        type: 'select',
        isStarred: true,
        options: [
          { value: 'All', label: '-Select-' },
          { value: 'auditor', label: 'Auditor' },
          { value: 'auditee', label: 'Auditee' }
        ],
        defaultValue: 'All'
      },
      {
        id: 'employee',
        label: 'Employee',
        type: 'select',
        isStarred: true,
        options: [
          { value: 'All', label: 'ALL' },
          ...filterOptions.employees
        ],
        defaultValue: 'All'
      },
      {
        id: 'auditType',
        label: 'Audit Type',
        type: 'select',
        isStarred: true,
        options: [
          { value: 'All', label: 'ALL' },
          ...filterOptions.auditTypes
        ],
        defaultValue: 'All'
      },
      ...getCommonDateFilters('observationDate', 'createdDate').map(filter => ({
        ...filter,
        label: filter.id === 'observationDate' ? 'OBSERVATION DATE' : filter.label
      }))
    ]));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, filterOptions]);

  const fetchData = useCallback(async (force = false, detail = null, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await axios.get('/api/qms/audit/observation', {
        params: { taskScope: 'Company' }
      });
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeRefresh(fetchData, 'AuditObservation');

  // Resolve rows with master names, raw dates for filtering, and formatted strings for display
  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.map(row => {
      const schNo = row.auditScheduleNo || row.scheduleNo || '';
      const matchingSch = auditSchedules.find(s => s.scheduleNo === schNo);

      let resolvedStatus = 'OPEN';
      if (row.status === 'APPROVED' || row.status === 'CLOSED') {
        resolvedStatus = 'CLOSED';
      } else if (row.status === 'CANCELLED') {
        resolvedStatus = 'CANCELLED';
      }

      const rawObsDate = row.observationDate || row.createdDate || null;
      const rawSchDate = matchingSch?.scheduleDate || row.scheduleDate || null;

      return {
        ...row,
        auditType: typeof row.auditType === 'object' ? row.auditType?.name : (row.auditType || row.auditTypeName || ''),
        scheduleNo: schNo,
        rawScheduleDate: rawSchDate,
        rawObservationDate: rawObsDate,
        scheduleDateDisplay: formatDateStr(rawSchDate),
        observationDateDisplay: formatDateStr(rawObsDate),
        observationDate: rawObsDate,
        status: resolvedStatus,
        details: Array.isArray(row.details) ? row.details : []
      };
    });
  }, [rows, auditSchedules]);

  const filteredRows = useMemo(() => {
    if (!Array.isArray(resolvedRows)) return [];
    return resolvedRows.filter(row => {
      // 1. Date filter on observationDate
      if (!matchCommonDateFilters(row, globalFilters, 'observationDate', 'createdDate')) {
        return false;
      }

      // 2. Status filter (case-insensitive check)
      const statusFilter = globalFilters.status;
      if (statusFilter && String(statusFilter).toLowerCase() !== 'all') {
        if (String(row.status).toLowerCase() !== String(statusFilter).toLowerCase()) {
          return false;
        }
      }

      // 3. Filter By & Employee filter
      const filterBy = globalFilters.filterBy;
      const employeeFilter = globalFilters.employee;
      if (filterBy && String(filterBy).toLowerCase() !== 'all' && employeeFilter && String(employeeFilter).toLowerCase() !== 'all') {
        const empVal = String(employeeFilter).toLowerCase().trim();
        if (String(filterBy).toLowerCase() === 'auditor') {
          const auditorName = String(row.auditor || row.auditorName || '').toLowerCase();
          if (!auditorName.includes(empVal)) return false;
        } else if (String(filterBy).toLowerCase() === 'auditee') {
          const auditeeName = String(row.auditee || row.auditeeName || '').toLowerCase();
          if (!auditeeName.includes(empVal)) return false;
        }
      }

      // 4. Audit Type filter (case-insensitive check)
      const auditTypeFilter = globalFilters.auditType;
      if (auditTypeFilter && String(auditTypeFilter).toLowerCase() !== 'all') {
        if (!row.auditType || String(row.auditType).toLowerCase() !== String(auditTypeFilter).toLowerCase()) {
          return false;
        }
      }

      // 5. Search query
      const matchesSearch = !globalQuery ||
        (row.observationNo && row.observationNo.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.departmentName && row.departmentName.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.details && row.details.some(d =>
          (d.clause && d.clause.toLowerCase().includes(globalQuery.toLowerCase())) ||
          (d.criteriaDetails && d.criteriaDetails.toLowerCase().includes(globalQuery.toLowerCase())) ||
          (d.comments && d.comments.toLowerCase().includes(globalQuery.toLowerCase())) ||
          (d.observationStatus && d.observationStatus.toLowerCase().includes(globalQuery.toLowerCase()))
        ));

      return matchesSearch;
    });
  }, [resolvedRows, globalQuery, globalFilters]);

  const handleRenderCell = (col, row) => {
    if (col.id === 'scheduleDate') {
      return row.scheduleDateDisplay || formatDateStr(row.scheduleDate);
    }

    if (col.id === 'observationDate') {
      return row.observationDateDisplay || formatDateStr(row.observationDate);
    }

    if (col.id === 'pdf') {
      return (
        <Tooltip title="View Audit Report PDF">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPdfRow(row);
              setPdfDialogOpen(true);
            }}
            sx={{ p: 0, '&:hover': { opacity: 0.8 } }}
          >
            <IconFileTypePdf size={24} color="#d32f2f" />
          </IconButton>
        </Tooltip>
      );
    }

    if (col.id === 'clause') {
      const details = Array.isArray(row.details) && row.details.length > 0 ? row.details : [];
      if (details.length === 0) return '-';
      return (
        <Box sx={{ width: '100%', mx: -2, my: -1 }}>
          {details.map((d, idx) => (
            <Box
              key={d.id || idx}
              sx={{
                p: 0.75,
                px: 1.5,
                borderBottom: idx < details.length - 1 ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                minHeight: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8125rem',
                fontWeight: 500
              }}
            >
              {d.clause || '-'}
            </Box>
          ))}
        </Box>
      );
    }

    if (col.id === 'criteriaDetails') {
      const details = Array.isArray(row.details) && row.details.length > 0 ? row.details : [];
      if (details.length === 0) return '-';
      return (
        <Box sx={{ width: '100%', mx: -2, my: -1 }}>
          {details.map((d, idx) => (
            <Box
              key={d.id || idx}
              sx={{
                p: 0.75,
                px: 1.5,
                borderBottom: idx < details.length - 1 ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                minHeight: 36,
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.8125rem',
                textAlign: 'left',
                lineHeight: 1.2
              }}
            >
              {d.criteriaDetails || d.criteria || d.checklistDescription || '-'}
            </Box>
          ))}
        </Box>
      );
    }

    if (col.id === 'comments') {
      const details = Array.isArray(row.details) && row.details.length > 0 ? row.details : [];
      if (details.length === 0) return '-';
      return (
        <Box sx={{ width: '100%', mx: -2, my: -1 }}>
          {details.map((d, idx) => (
            <Box
              key={d.id || idx}
              sx={{
                p: 0.75,
                px: 1.5,
                borderBottom: idx < details.length - 1 ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                minHeight: 36,
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.8125rem',
                textAlign: 'left',
                lineHeight: 1.2
              }}
            >
              {d.comments || d.remarks || '-'}
            </Box>
          ))}
        </Box>
      );
    }

    if (col.id === 'observationStatus') {
      const details = Array.isArray(row.details) && row.details.length > 0 ? row.details : [];
      if (details.length === 0) return '-';
      return (
        <Box sx={{ width: '100%', mx: -2, my: -1 }}>
          {details.map((d, idx) => (
            <Box
              key={d.id || idx}
              sx={{
                p: 0.75,
                px: 1.5,
                borderBottom: idx < details.length - 1 ? '1px solid rgba(224, 224, 224, 1)' : 'none',
                minHeight: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8125rem',
                fontWeight: 500
              }}
            >
              {d.observationStatus || d.status || '-'}
            </Box>
          ))}
        </Box>
      );
    }

    return null;
  };

  return (
    <MainCard fullWidth
      icon={IconReport}
      title={"Audit Summary Report"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={filteredRows}
          exportFilename="Audit_Summary_Report"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="qms_audit_report_table"
        columns={columns}
        data={filteredRows}
        loading={loading}
        showActions={false}
        page={page}
        size={size}
        onPageChange={setPage}
        onSizeChange={setSize}
        renderCell={handleRenderCell}
      />
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
