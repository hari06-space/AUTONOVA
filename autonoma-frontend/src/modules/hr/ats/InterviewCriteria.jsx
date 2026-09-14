import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, MenuItem, Checkbox, ListItemText, Box, Chip } from '@mui/material';
import { IconClipboardCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable, BOSFormDialog, BOSTextField, BOSFileUpload, errorStyle, BOSTableToolbar, matchCommonDateFilters } from 'ui-component/bos';
import { useLookups } from 'hooks/useLookups';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig, setFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

// ==============================|| INTERVIEW CRITERIA MASTER ||============================== //

const INITIAL_STATE = {
  id: null,
  criteriaDetails: '',
  answer: '',
  departmentCodes: [], // Maps to department ID strings in UI state
  levelCodes: [],      // Maps to designation level rowId strings in UI state
  interviewRound: '',
  attachmentRequired: 'NO',
  status: true,
  interviewAttachment: '' // For file upload
};

const ROUND_OPTIONS = ['TECHNICAL', 'HR', 'MANAGEMENT', 'SPECIAL ROUND'];

const VALIDATION_RULES = [
  { field: 'interviewRound', label: 'Interview Round', required: true },
  { field: 'criteriaDetails', label: 'Criteria Details', required: true, maxLength: 300 },
  { field: 'answer', label: 'Answer', required: true, maxLength: 2000 },
  { field: 'departmentCodes', label: 'Department', required: true, validate: (val) => (!val || val.length === 0 ? 'At least one department is required' : null) },
  { field: 'levelCodes', label: 'Level', required: true, validate: (val) => (!val || val.length === 0 ? 'At least one level is required' : null) },
  { field: 'status', label: 'Status', required: true },
  {
    field: 'interviewAttachment',
    label: 'Attachment',
    validate: (val, formData) => {
      if (formData.attachmentRequired === 'YES' && !val) {
        return 'Attachment is mandatory when Attachment Required is set to YES';
      }
      return null;
    }
  }
];

// Strip HTML tags from richText (ReactQuill) values for plain-text display
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
};

export default function InterviewCriteria() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nextSequence, setNextSequence] = useState(null);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [levels, setLevels] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const { departments = [] } = useLookups(['DEPARTMENTS']);

  const perms = usePagePermissions(PAGE_CODES.ATS_INTERVIEW_CRITERIA);

  const criteriaOptions = useMemo(() => {
    const unique = Array.from(new Set(rows.map(r => stripHtml(r.criteriaDetails)).filter(Boolean)));
    return [
      { value: 'ALL', label: 'ALL' },
      ...unique.map(val => ({ value: val, label: val }))
    ];
  }, [rows]);

  // Dynamic columns definition using useMemo to display department name and level instead of codes
  const columns = useMemo(() => [
    { id: 'index', label: 'Sl.No', minWidth: 60 },
    { id: 'criteriaDetails', label: 'Questions', required: true, bold: true, minWidth: 250 },
    { id: 'answer', label: 'Answer', required: true, minWidth: 250 },
    {
      id: 'departmentId',
      label: 'Department',
      minWidth: 150,
      render: (row) => row.departmentCodes || '-'
    },
    {
      id: 'levelCodes',
      label: 'Level',
      minWidth: 120,
      render: (row) => {
        if (!row.levelCodes) return '-';
        return row.levelCodes.split(',').map(c => c.trim()).join(', ');
      }
    },
    { id: 'interviewRound', label: 'Round', minWidth: 120 },
    { id: 'attachmentRequired', label: 'Attachment Required', minWidth: 120 },
    { id: 'createdBy', label: 'CREATED USER', minWidth: 120 },
    { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
    { id: 'updatedBy', label: 'UPDATED USER', minWidth: 120 },
    { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 },
    { id: 'status', label: 'Status', minWidth: 100, status: true }
  ], [departments, levels]);

  // Dispatch starred filter configuration matching Status
  useEffect(() => {
    const config = [
      {
        id: 'criteriaDetails',
        label: 'Questions',
        type: 'select',
        options: criteriaOptions,
        isStarred: true
      },
      {
        id: 'departmentId',
        label: 'Department',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          ...departments.map((d) => ({ value: d.departmentName, label: d.departmentName }))
        ],
        isStarred: true
      },
      {
        id: 'interviewRound',
        label: 'Round',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'TECHNICAL', label: 'TECHNICAL' },
          { value: 'HR', label: 'HR' },
          { value: 'MANAGEMENT', label: 'MANAGEMENT' },
          { value: 'SPECIAL ROUND', label: 'SPECIAL ROUND' }
        ],
        isStarred: true
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: true, label: 'ACTIVE' },
          { value: false, label: 'INACTIVE' }
        ],
        defaultValue: true,
        isStarred: true
      },
      {
        id: 'createdAt',
        label: 'CREATED DATE',
        type: 'dateRange',
        isStarred: true
      },
      {
        id: 'updatedAt',
        label: 'UPDATED DATE',
        type: 'dateRange',
        isStarred: false
      }
    ];

    dispatch(setFilterConfig(config));
  }, [dispatch, criteriaOptions, departments]);

  useEffect(() => {
    // Get current local date in YYYY-MM-DD format
    // Adjusting for local timezone offset to avoid UTC date mismatch issues
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const todayStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];

    dispatch(setFilters({
      status: true,
      criteriaDetails: 'ALL',
      departmentId: 'ALL',
      interviewRound: 'ALL',
      createdAtStart: todayStr,
      createdAtEnd: todayStr,
      createdAtConsider: 'No',
      updatedAtStart: todayStr,
      updatedAtEnd: todayStr,
      updatedAtConsider: 'No'
    }));

    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/interview-master', {
        params: { maxResult: 500 }
      });
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch interview criteria:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const fetchLevels = useCallback(async () => {
    try {
      const res = await axios.get('/api/master/hr/designation-levels');
      setLevels(res.data || []);
    } catch (err) {
      console.error('Failed to fetch designation levels:', err);
    }
  }, []);

  useEffect(() => {
    fetchRows();
    fetchLevels();
  }, [fetchRows, fetchLevels]);

  const handleOpenAdd = async () => {
    setFormData(INITIAL_STATE);
    setErrors({});
    try {
      const res = await axios.get('/api/hr/interview-master/next-sequence');
      setNextSequence(res.data);
    } catch (err) {
      console.error('Failed to fetch next sequence:', err);
    }
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    const originalRow = rows.find(r => r.id === row.id) || row;

    // API returns department IDs directly — use as-is for the multi-select form
    const rawDepts = originalRow.departmentCodes ? originalRow.departmentCodes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const deptIdVals = rawDepts.filter((code) => departments.some((d) => d.id.toString() === code));

    // Map designation level code back to level row_id string (with robust name comparison)
    const rawLevels = originalRow.levelCodes ? originalRow.levelCodes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const levelIdVals = rawLevels.map((lvlName) => {
      const match = levels.find((l) => l.level?.trim().toUpperCase() === lvlName.toUpperCase());
      const id = match?.rowId || match?.id;
      return id ? id.toString() : lvlName;
    });

    setFormData({
      ...originalRow,
      departmentCodes: deptIdVals,
      levelCodes: levelIdVals,
      interviewAttachment: originalRow.interviewAttachment ? {
        serverFileName: originalRow.interviewAttachment,
        fileName: originalRow.interviewAttachment.split('/').pop(),
        isServer: true
      } : null
    });
    setErrors({});
    setDialogOpen(true);
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) setDialogOpen(false); }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) clearErrors(name);
    if (name === 'attachmentRequired' && value === 'NO') {
      clearErrors('interviewAttachment');
    }
  };

  const handleDepartmentChange = (e) => {
    const { value } = e.target;
    if (value.includes('ALL')) {
      if (formData.departmentCodes.length === departments.length) {
        setFormData(prev => ({ ...prev, departmentCodes: [] }));
      } else {
        setFormData(prev => ({ ...prev, departmentCodes: departments.map(d => d.id.toString()) }));
      }
    } else {
      setFormData(prev => ({ ...prev, departmentCodes: typeof value === 'string' ? value.split(',') : value }));
    }
    if (errors.departmentCodes) clearErrors('departmentCodes');
  };

  const handleLevelChange = (e) => {
    const { value } = e.target;
    if (value.includes('ALL')) {
      if (formData.levelCodes.length === levels.length) {
        setFormData(prev => ({ ...prev, levelCodes: [] }));
      } else {
        setFormData(prev => ({ ...prev, levelCodes: levels.map(l => (l.rowId || l.id).toString()) }));
      }
    } else {
      const selectedIds = typeof value === 'string' ? value.split(',') : value;
      const order = levels.map(l => (l.rowId || l.id).toString());
      const sortedIds = [...selectedIds].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      setFormData(prev => ({ ...prev, levelCodes: sortedIds }));
    }
    if (errors.levelCodes) clearErrors('levelCodes');
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      const selectedDepts = formData.departmentCodes
        .map(id => departments.find(d => d.id.toString() === id.toString())?.departmentNo || id)
        .join(',');
      const selectedLevels = formData.levelCodes
        .map(rowId => {
          const match = levels.find(l => (l.rowId || l.id)?.toString() === rowId.toString());
          return match ? match.level : rowId;
        })
        .join(',');

      const payload = {
        ...formData,
        answer: formData.answer || '-',
        departmentCodes: selectedDepts,
        levelCodes: selectedLevels,
        interviewAttachment: formData.interviewAttachment?.serverFileName || formData.interviewAttachment
      };

      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdBy;
      delete payload.updatedBy;
      delete payload.createdUser;
      delete payload.updatedUser;
      delete payload.index;
      delete payload.levelMappings;
      delete payload.departmentMappings;

      if (formData.id) {
        await axios.put(`/api/hr/interview-master/${formData.id}`, payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Interview Criteria Updated Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      } else {
        await axios.post('/api/hr/interview-master', payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Interview Criteria Saved Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || 'Failed to save interview criteria';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    }
  };

  const handleDelete = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/hr/interview-master/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Interview Criteria Deleted Successfully', variant: 'alert', severity: 'success' }));
      setDeleteDialogOpen(false);
      fetchRows();
    } catch (error) {
      console.error('Failed to delete criteria:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete', variant: 'alert', severity: 'error' }));
    }
  };

  const resolvedRows = useMemo(() => {
    return rows.map((r, i) => {
      const deptNames = r.departmentCodes
        ? r.departmentCodes
          .split(',')
          .map((code) => {
            // API returns department IDs — match by id to get the name
            const match = departments.find((d) => d.id.toString() === code.trim());
            return match ? match.departmentName : code;
          })
          .join(', ')
        : '-';

      const isUpdated = r.updatedAt && r.createdAt && Math.abs(new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) > 1000;
      return {
        ...r,
        index: i + 1,
        serialNo: r.id.toString(),
        // Strip HTML tags from richText fields before showing in table
        criteriaDetails: stripHtml(r.criteriaDetails),
        answer: stripHtml(r.answer),
        departmentCodes: deptNames,
        departmentId: deptNames,
        createdBy: r.createdUser || r.createdBy || '-',
        updatedBy: isUpdated ? (r.updatedUser || r.updatedBy || '-') : '-',
        createdAt: r.createdAt || r.createdDate || '-',
        updatedAt: isUpdated ? (r.updatedAt || r.updatedDate) : null,
        updatedDate: isUpdated ? r.updatedDate : null,
        updated_at: isUpdated ? r.updated_at : null,
        updated_date: isUpdated ? r.updated_date : null
      };
    });
  }, [rows, departments]);

  const filteredRows = useMemo(() => {
    return resolvedRows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      // 1. Status Filter
      const statusFilter = globalFilters.status !== undefined ? globalFilters.status : true;
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;

      // 2. Primary Field (Criteria details)
      const criteriaFilter = globalFilters.criteriaDetails || 'ALL';
      if (criteriaFilter !== 'ALL' && row.criteriaDetails !== criteriaFilter) return false;

      // 2b. Department Filter — compare against resolved department names
      const deptFilter = globalFilters.departmentId || 'ALL';
      if (deptFilter !== 'ALL') {
        if (!row.departmentCodes) return false;
        const deptNames = row.departmentCodes.split(',').map((s) => s.trim().toLowerCase());
        if (!deptNames.includes(deptFilter.toLowerCase())) return false;
      }

      // 2c. Round Filter
      const roundFilter = globalFilters.interviewRound || 'ALL';
      if (roundFilter !== 'ALL' && row.interviewRound !== roundFilter) return false;

      // 3. Wildcard Query Search
      const matchesSearch = !globalQuery ||
        (row.criteriaDetails && row.criteriaDetails.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.answer && row.answer.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.interviewRound && row.interviewRound.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.departmentCodes && row.departmentCodes.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.levelCodes && row.levelCodes.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [resolvedRows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  const sidebarContent = (
    <Stack spacing={4}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>Attachments</Typography>
        <BOSFileUpload
          label="UPLOAD DOCUMENT"
          files={formData.interviewAttachment ? [formData.interviewAttachment] : []}
          onChange={(uploadedFiles) => {
            const fileObj = uploadedFiles.length > 0 ? uploadedFiles[0] : null;
            setFormData(prev => ({ ...prev, interviewAttachment: fileObj }));
            if (errors.interviewAttachment) clearErrors('interviewAttachment');
          }}
          multiple={false}
          required={formData.attachmentRequired === 'YES'}
          helperText={errors.interviewAttachment || (formData.attachmentRequired === 'YES' ? 'Reference document is MANDATORY' : 'Optional reference document')}
          error={!!errors.interviewAttachment || (formData.attachmentRequired === 'YES' && !formData.interviewAttachment)}
          sx={errorStyle(!!errors.interviewAttachment)}
        />
      </Box>
    </Stack>
  );

  const exportColumns = useMemo(() => [
    { id: 'criteriaDetails', header: 'Questions', key: (row) => row.criteriaDetails || '-' },
    { id: 'answer', header: 'Answer', key: (row) => row.answer || '-' },
    { id: 'departmentCodes', header: 'Department', key: (row) => row.departmentCodes || '-' },
    { id: 'levelCodes', header: 'Level', key: (row) => row.levelCodes || '-' },
    { id: 'interviewRound', header: 'Interview Round', key: (row) => row.interviewRound || '-' },
    { id: 'status', header: 'Status', key: (row) => (row.status === true || String(row.status) === 'true' || String(row.status) === '1') ? 'Active' : 'Inactive' },
    { id: 'createdUser', header: 'Created By', key: (row) => row.createdUser || row.createdBy || '-' },
    { id: 'createdAt', header: 'Created Date', key: (row) => row.createdAt || '-' },
    { id: 'updatedUser', header: 'Updated By', key: (row) => row.updatedUser || row.updatedBy || '-' },
    { id: 'updatedAt', header: 'Updated Date', key: (row) => row.updatedAt || '-' }
  ], []);

  return (
    <MainCard
      icon={IconClipboardCheck}
      title={"Interview Criteria"}
      pageCode={PAGE_CODES.ATS_INTERVIEW_CRITERIA}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Criteria', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportColumns={exportColumns}
          exportFilename="Interview_Criteria"
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
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDelete : undefined}
        disableMaxRecords={true}
        disableSearchFilter={true}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={formData.id ? 'Edit Interview Details' : 'Add Interview Details'}
        fullWidth
        maxWidth="lg"
        onSave={handleSave}
        onClear={() => {
          setFormData(INITIAL_STATE);
          setErrors({});
        }}
        hasId={!!formData.id}
        onDelete={() => {
          setDeleteTarget(formData);
          setDeleteDialogOpen(true);
        }}
        sidebar={sidebarContent}
      >
        <Stack spacing={2.5} sx={{ mt: 1.5 }}>
          <BOSTextField
            name="id"
            label="SERIAL NUMBER"
            value={formData.id ? formData.id.toString() : (nextSequence ? nextSequence.toString() : '1')}
            disabled
            InputProps={{
              readOnly: true,
              sx: {
                bgcolor: 'rgba(33, 150, 243, 0.04)',
                fontWeight: 700,
                color: 'primary.main',
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: 'var(--primary-main)',
                }
              }
            }}
          />

          <BOSTextField
            name="criteriaDetails"
            label="CRITERIA DETAILS"
            placeholder="Enter 300 characters only..."
            value={formData.criteriaDetails}
            onChange={handleInputChange}
            multiline
            richText={true}
            rows={3}
            required
            fullWidth
            inputProps={{ maxLength: 300 }}
            error={!!errors.criteriaDetails}
            helperText={errors.criteriaDetails || `${formData.criteriaDetails.length}/300 characters`}
            sx={errorStyle(!!errors.criteriaDetails)}
          />

          <BOSTextField
            name="answer"
            label="ANSWER"
            placeholder="Enter expected answer or guidelines (2000 characters max)..."
            value={formData.answer}
            onChange={handleInputChange}
            multiline
            richText={true}
            rows={4}
            required
            fullWidth
            inputProps={{ maxLength: 2000 }}
            error={!!errors.answer}
            helperText={errors.answer || `${formData.answer?.length || 0}/2000 characters`}
            sx={errorStyle(!!errors.answer)}
          />

          <BOSTextField
            select
            name="departmentCodes"
            label="DEPARTMENT"
            value={formData.departmentCodes}
            onChange={handleDepartmentChange}
            SelectProps={{
              multiple: true,
              renderValue: (selected) => {
                if (!selected || selected.length === 0) return <em>-Select-</em>;
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 64, overflowY: 'auto', py: 0.25 }}>
                    {selected.map(id => {
                      const dept = departments.find(d => d.id.toString() === id.toString());
                      return dept ? (
                        <Chip key={id} label={dept.departmentName} size="small"
                          sx={{ height: 20, fontSize: '0.7rem', maxWidth: 140 }} />
                      ) : null;
                    })}
                  </Box>
                );
              }
            }}
            required
            helperText={errors.departmentCodes || "Select departments"}
            error={!!errors.departmentCodes}
            sx={errorStyle(!!errors.departmentCodes)}
          >
            {departments.length > 0 && (
              <MenuItem value="ALL">
                <Checkbox checked={formData.departmentCodes.length === departments.length} indeterminate={formData.departmentCodes.length > 0 && formData.departmentCodes.length < departments.length} />
                <ListItemText primary="Select All" sx={{ '& .MuiTypography-root': { fontWeight: 'bold' } }} />
              </MenuItem>
            )}
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id.toString()}>
                <Checkbox checked={formData.departmentCodes.includes(d.id.toString())} />
                <ListItemText primary={d.departmentName} />
              </MenuItem>
            ))}
          </BOSTextField>

          <BOSTextField
            select
            name="levelCodes"
            label="LEVEL"
            value={formData.levelCodes}
            onChange={handleLevelChange}
            SelectProps={{
              multiple: true,
              renderValue: (selected) => {
                if (!selected || selected.length === 0) return <em>-Select-</em>;
                return selected.map(id => levels.find(l => l.rowId.toString() === id.toString())?.level || id).join(', ');
              }
            }}
            required
            helperText={errors.levelCodes || "Select designation levels"}
            error={!!errors.levelCodes}
            sx={errorStyle(!!errors.levelCodes)}
          >
            {levels.length > 0 && (
              <MenuItem value="ALL">
                <Checkbox checked={formData.levelCodes.length === levels.length} indeterminate={formData.levelCodes.length > 0 && formData.levelCodes.length < levels.length} />
                <ListItemText primary="Select All" sx={{ '& .MuiTypography-root': { fontWeight: 'bold' } }} />
              </MenuItem>
            )}
            {levels.map((l) => (
              <MenuItem key={l.rowId} value={l.rowId.toString()}>
                <Checkbox checked={formData.levelCodes.includes(l.rowId.toString())} />
                <ListItemText primary={l.level} />
              </MenuItem>
            ))}
          </BOSTextField>

          <BOSTextField
            select
            name="interviewRound"
            label="INTERVIEW ROUND"
            value={formData.interviewRound}
            onChange={handleInputChange}
            required
            error={!!errors.interviewRound}
            helperText={errors.interviewRound || 'Select Round'}
            sx={errorStyle(!!errors.interviewRound)}
          >

            {ROUND_OPTIONS.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </BOSTextField>

          {/* Attachment Required + Status — single row like other pages */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <BOSTextField
                select
                name="attachmentRequired"
                label="ATTACHMENT REQUIRED"
                value={formData.attachmentRequired}
                onChange={handleInputChange}
                required
                error={!!errors.attachmentRequired}
                helperText={errors.attachmentRequired}
                sx={errorStyle(!!errors.attachmentRequired)}
              >
                <MenuItem value="NO">NO</MenuItem>
                <MenuItem value="YES">YES</MenuItem>
              </BOSTextField>
            </Box>
            <Box sx={{ flex: 1 }}>
              <BOSTextField
                select
                name="status"
                label="STATUS"
                value={formData.status === true || formData.status === 'Active' ? 'Active' : 'Inactive'}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, status: val === 'Active' }));
                  if (errors.status) clearErrors('status');
                }}
                required
                error={!!errors.status}
                helperText={errors.status}
                sx={errorStyle(!!errors.status)}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </BOSTextField>
            </Box>
          </Stack>
        </Stack>

      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Interview Criteria"
        message="Are you sure you want to completely remove this interview criteria?"
        itemName={deleteTarget?.criteriaDetails}
      />
    </MainCard>
  );
}