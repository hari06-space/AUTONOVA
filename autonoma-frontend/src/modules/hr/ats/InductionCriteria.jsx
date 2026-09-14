import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton, Grid, MenuItem, Box, Checkbox, ListItemText, Chip, useTheme } from '@mui/material';
import { IconClipboardCheck, IconRefresh, IconPlus, IconDeviceFloppy, IconEraser, IconEye, IconPaperclip } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable, BOSFormDialog, BOSTextField, BOSAutocomplete, BOSFormSection, BOSFileUpload, BOSFilePreview, errorStyle, BOSStatusField, BOSTableToolbar, BOSStatusChip, matchDateRange } from 'ui-component/bos';
import { useLookups } from 'hooks/useLookups';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig, setFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { Navigate } from 'react-router-dom';

// ==============================|| INDUCTION CRITERIA MASTER ||============================== //



const INITIAL_STATE = {
  id: null,
  inductionDetails: '',
  answer: '',
  departmentCodes: [], // Will be joined as string for API
  levelCodes: [],      // Will be joined as string for API
  attachmentRequired: 'NO',
  isActive: true,
  inductionAttachment: []
};

const FALLBACK_DEPARTMENTS_MAP = {
  '10': 'ADMIN',
  '20': 'PRODUCTION',
  '30': 'QUALITY',
  '40': 'PURCHASE',
  '50': 'HRA',
  '60': 'ACCOUNTS',
  '70': 'PRODUCT DEVELOPMENT',
  '80': 'MAINTENANCE',
  '90': 'SALES & MARKETING',
  '150': 'ASSEMBLY',
  '160': 'QMS',
  '170': 'DESIGN & DEVELOPMENT',
  '180': 'STORES',
  '200': 'OPERATIONS',
  '220': 'LOGISTICS',
  '240': 'TOP MANAGEMENT',
  '250': 'STRATEGIC PROCUREMENT',
  '260': 'PLANNING',
  '270': 'MANAGEMENT REPRESENTATIVE',
  '280': 'MANAGEMENT',
  '290': 'BUSINESS DEVELOPMENT',
  'DEPT-001': 'DIGITECH'
};

const FALLBACK_ROUND_OPTIONS = ['HR', 'QMS', 'DEPARTMENT', 'MANAGEMENT'];
const LEVEL_OPTIONS = [
  { code: 'L1', label: 'L1' },
  { code: 'L2', label: 'L2' },
  { code: 'L3', label: 'L3' },
  { code: 'L4', label: 'L4' },
  { code: 'L5', label: 'L5' },
  { code: 'L6', label: 'L6' },
  { code: 'L7', label: 'L7' }
];

const VALIDATION_RULES = [
  { field: 'inductionDetails', label: 'Induction Details', required: true, maxLength: 1000 },
  { field: 'answer', label: 'Answer', required: true, maxLength: 2000 },
  { field: 'departmentCodes', label: 'Department', required: true, validate: (val) => (!val || val.length === 0 ? 'At least one department is required' : null) },
  { field: 'levelCodes', label: 'Level', required: true, validate: (val) => (!val || val.length === 0 ? 'At least one level is required' : null) }
];

export default function InductionCriteria() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nextSequence, setNextSequence] = useState(null);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewFilesList, setPreviewFilesList] = useState([]);

  const handlePreviewFile = useCallback((file, allFilesList = []) => {
    setPreviewFile(file);
    setPreviewFilesList(allFilesList.length > 0 ? allFilesList : [file]);
    setPreviewOpen(true);
  }, []);

  const { departments = [], designationLevels = [] } = useLookups(['DEPARTMENTS', 'DESIGNATION_LEVELS']);

  const levelOptions = useMemo(() => {
    if (designationLevels && designationLevels.length > 0) {
      return designationLevels.map(dl => {
        const code = dl.level || dl.levelName;
        return {
          code: code,
          label: code
        };
      });
    }
    return LEVEL_OPTIONS;
  }, [designationLevels]);

  const departmentOptions = useMemo(() => {
    return departments.map((d) => ({
      id: d.id !== undefined && d.id !== null ? String(d.id) : String(d.departmentNo),
      label: (d.departmentName || '').toUpperCase()
    }));
  }, [departments]);

  const levelAutocompleteOptions = useMemo(() => {
    return levelOptions.map((l) => ({
      id: l.code,
      label: l.label
    }));
  }, [levelOptions]);

  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.ATS_INDUCTION_CRITERIA);

  const columns = useMemo(() => [
    { id: 'serialNo', label: 'Sl.No', bold: true, color: 'primary.main', minWidth: 80 },
    { id: 'inductionDetails', label: 'Induction Details', required: true, bold: true, minWidth: 250 },
    { id: 'answer', label: 'Answer', required: true, minWidth: 200 },
    {
      id: 'departmentCodes',
      label: 'DEPARTMENT',
      minWidth: 180,
      getTooltip: (row) => {
        if (!row.departmentCodes || row.departmentCodes === '-') return '';
        return row.departmentCodes.split(',').map(d => d.trim()).filter(Boolean).join(', ');
      },
      render: (row) => {
        if (!row.departmentCodes) return '-';
        const depts = row.departmentCodes.split(',').map(d => d.trim()).filter(Boolean);
        if (depts.length === 0) return '-';
        
        const displayText = depts.length <= 2 
          ? depts.join(', ') 
          : `${depts.slice(0, 2).join(', ')} ... (+${depts.length - 2})`;
          
        return (
          <Typography variant="body2">
            {displayText}
          </Typography>
        );
      }
    },
    { id: 'levelCodes', label: 'Level', minWidth: 120 },
    { id: 'attachmentRequired', label: 'Attach Req.', minWidth: 100 },
    {
      id: 'inductionAttachment',
      label: 'Attachment',
      minWidth: 100,
      getTooltip: (row) => {
        if (!row.inductionAttachment || row.inductionAttachment === '-') return '';
        return row.inductionAttachment.split(',').filter(Boolean).map(p => p.split('/').pop()).join(', ');
      },
      render: (row) => {
        if (!row.inductionAttachment) return '-';
        const attachmentPaths = row.inductionAttachment.split(',').filter(Boolean);
        if (attachmentPaths.length === 0) return '-';
        
        const fileObjects = attachmentPaths.map((path) => ({
          id: path,
          serverFileName: path,
          fileName: path.split('/').pop(),
          isServer: true
        }));
        
        const count = fileObjects.length;

        return (
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#ffffff',
              p: 0.8,
              borderRadius: '50%',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.18)'
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePreviewFile(fileObjects[0], fileObjects);
            }}
          >
            <IconPaperclip size={18} color="#4b5563" />
            <Box
              sx={{
                position: 'absolute',
                top: -3,
                right: -3,
                bgcolor: '#87CEEB',
                color: '#000000',
                fontSize: '10px',
                fontWeight: 700,
                width: 17,
                height: 17,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              }}
            >
              {count}
            </Box>
          </Box>
        );
      }
    },
    {
      id: 'isActive',
      label: 'Status',
      required: true,
      minWidth: 100,
      render: (row) => {
        const label = row.isActive !== false ? 'Active' : 'Inactive';
        return (
          <BOSStatusChip
            status={label}
            showIcon={true}
            width={100}
          />
        );
      }
    },
    { id: 'createdUser', label: 'CREATED USER', minWidth: 120 },
    { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
    { id: 'updatedUser', label: 'UPDATED BY', minWidth: 120 },
    { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 }
  ], [handlePreviewFile]);

  // Dispatch starred filter configuration matching Status
  useEffect(() => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const todayStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];

    const config = [
      {
        id: 'isActive',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'INACTIVE', label: 'INACTIVE' }
        ],
        defaultValue: 'ACTIVE',
        isStarred: true
      },
      {
        id: 'createdAt',
        label: 'CREATED DATE',
        type: 'dateRange',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      isActive: 'ACTIVE',
      createdAtStart: todayStr,
      createdAtEnd: todayStr,
      createdAtConsider: 'No'
    }));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchRows = useCallback(async () => {
    if (!perms.enabled) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/induction-master');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch induction criteria:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, perms.enabled]);

  useEffect(() => {
    if (!perms.loading) {
      fetchRows();
    }
  }, [fetchRows, perms.loading]);

  // Resolve raw department codes to database ID strings once departments lookup finishes loading
  useEffect(() => {
    if (departments.length > 0 && formData.departmentCodes && formData.departmentCodes.length > 0) {
      const hasRawCodes = formData.departmentCodes.some(code => !/^\d+$/.test(String(code).trim()));
      if (hasRawCodes) {
        const mappedIds = formData.departmentCodes.map(code => {
          const trimmedCode = String(code).trim();
          if (/^\d+$/.test(trimmedCode)) return trimmedCode;
          
          const byNo = departments.find(d => d.departmentNo && d.departmentNo.trim() === trimmedCode);
          if (byNo && byNo.id !== undefined && byNo.id !== null) return String(byNo.id);
          
          const byName = departments.find(d => d.departmentName && d.departmentName.trim().toLowerCase() === trimmedCode.toLowerCase());
          if (byName && byName.id !== undefined && byName.id !== null) return String(byName.id);
          
          return trimmedCode;
        });
        
        if (mappedIds.join(',') !== formData.departmentCodes.join(',')) {
          setFormData(prev => ({ ...prev, departmentCodes: mappedIds }));
        }
      }
    }
  }, [departments, formData.departmentCodes]);

  // No inductionRound needed

  const handleOpenAdd = async () => {
    setFormData(INITIAL_STATE);
    setErrors({});
    try {
      const res = await axios.get('/api/hr/induction-master/next-sequence');
      setNextSequence(res.data);
    } catch (err) {
      console.error('Failed to fetch next sequence:', err);
    }
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    // Find the original raw row to get raw serial codes instead of resolved department names
    const originalRow = rows.find(r => r.id === row.id) || row;
    const deptCodes = originalRow.departmentCodes ? originalRow.departmentCodes.split(',').filter(Boolean) : [];
    // Also keep _rawDepartmentCodes from original row (already dept nos like DEPT-001)
    // Make sure we trim the codes so we don't have spaces like " DEPT-002"
    const rawCodes = (originalRow._rawDepartmentCodes
      ? originalRow._rawDepartmentCodes.split(',')
      : deptCodes
    ).map(c => c.trim()).filter(Boolean);

    // Match by id (numeric string) first, then by departmentNo, then by departmentName as fallback
    const deptIds = rawCodes.map((code) => {
      const byId = departments.find((d) => d.id !== undefined && d.id !== null && d.id.toString() === code);
      if (byId) return byId.id.toString();
      const byNo = departments.find((d) => d.departmentNo && d.departmentNo.trim() === code);
      if (byNo) return byNo.id.toString();
      const byName = departments.find((d) => d.departmentName && d.departmentName.trim().toLowerCase() === code.toLowerCase());
      if (byName) return byName.id.toString();
      return code;
    });
    const order = LEVEL_OPTIONS.map(l => l.code);
    const rawLevels = originalRow.levelCodes ? originalRow.levelCodes.split(',').filter(Boolean) : [];
    const sortedLevels = [...rawLevels].sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      const aNum = parseInt(a.replace(/^\D+/g, ''), 10) || 0;
      const bNum = parseInt(b.replace(/^\D+/g, ''), 10) || 0;
      return aNum - bNum;
    });

    setFormData({
      ...originalRow,
      departmentCodes: deptIds,
      _rawDepartmentCodes: rawCodes.join(','), // preserve raw DEPT-XXX codes for save fallback
      levelCodes: sortedLevels,
      index: row.index || resolvedRows.find(r => r.id === row.id)?.index || '',
      inductionAttachment: originalRow.inductionAttachment
        ? originalRow.inductionAttachment.split(',').filter(Boolean).map((path) => ({
            id: path,
            serverFileName: path,
            fileName: path.split('/').pop(),
            isServer: true
          }))
        : []
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'departmentCodes') {
      if (value.includes('ALL')) {
        if (formData.departmentCodes.length === departments.length) {
          setFormData(prev => ({ ...prev, departmentCodes: [] }));
        } else {
          setFormData(prev => ({ ...prev, departmentCodes: departments.map(d => d.id ? d.id.toString() : '').filter(Boolean) }));
        }
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) clearErrors(name);
  };

  const handleDepartmentChange = (e) => {
    const { value } = e.target;
    if (value.includes('ALL')) {
      if (formData.departmentCodes.length === departments.length) {
        setFormData(prev => ({ ...prev, departmentCodes: [] }));
      } else {
        setFormData(prev => ({ ...prev, departmentCodes: departments.map(d => d.id ? d.id.toString() : '').filter(Boolean) }));
      }
    } else {
      setFormData(prev => ({ ...prev, departmentCodes: value }));
    }
    if (errors.departmentCodes) clearErrors('departmentCodes');
  };

  const handleLevelChange = (e) => {
    const { value } = e.target;
    let newLevels = [];
    if (value.includes('ALL')) {
      if (formData.levelCodes.length === levelOptions.length) {
        newLevels = [];
      } else {
        newLevels = levelOptions.map(l => l.code);
      }
    } else {
      newLevels = value;
    }
    const order = LEVEL_OPTIONS.map(l => l.code);
    const sortedLevels = [...newLevels].sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      const aNum = parseInt(a.replace(/^\D+/g, ''), 10) || 0;
      const bNum = parseInt(b.replace(/^\D+/g, ''), 10) || 0;
      return aNum - bNum;
    });
    setFormData(prev => ({ ...prev, levelCodes: sortedLevels }));
    if (errors.levelCodes) clearErrors('levelCodes');
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    const selectedLevels = formData.levelCodes || [];
    if (selectedLevels.includes('L1') && selectedLevels.length < 2) {
      dispatch(openSnackbar({
        open: true,
        message: 'Minimum 2 levels must be selected when Level L1 is chosen.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
      setErrors(prev => ({ ...prev, levelCodes: 'Minimum 2 levels required for L1' }));
      return;
    }
    if ((selectedLevels.includes('L6') || selectedLevels.includes('L7')) && selectedLevels.length < 3) {
      dispatch(openSnackbar({
        open: true,
        message: 'Minimum 3 levels must be selected when Level L6 or L7 is chosen.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
      setErrors(prev => ({ ...prev, levelCodes: 'Minimum 3 levels required for L6/L7' }));
      return;
    }

    if (formData.attachmentRequired === 'YES' && (!formData.inductionAttachment || formData.inductionAttachment.length === 0)) {
      dispatch(openSnackbar({
        open: true,
        message: 'Attachment is mandatory when Attachment Required is set to YES',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
      setErrors(prev => ({ ...prev, inductionAttachment: 'File required' }));
      return;
    }

    try {
      const payload = {
        ...formData,
        // Map IDs back to departmentNo codes; fall back to _rawDepartmentCodes if lookup not loaded
        departmentCodes: (() => {
          if (departments.length > 0) {
            return formData.departmentCodes
              .map((id) => {
                const idStr = id ? String(id).trim() : '';
                const dept = departments.find((d) => d.id !== undefined && d.id !== null && String(d.id) === idStr);
                return (dept?.departmentNo && dept.departmentNo.trim()) ? dept.departmentNo.trim() : idStr;
              })
              .join(',');
          }
          // Departments lookup not loaded yet — use raw stored codes directly
          return formData._rawDepartmentCodes || formData.departmentCodes.join(',');
        })(),
        levelCodes: formData.levelCodes.join(','),
        inductionAttachment: Array.isArray(formData.inductionAttachment)
          ? formData.inductionAttachment.map((f) => f.serverFileName || f).filter(Boolean).join(',')
          : (formData.inductionAttachment?.serverFileName || formData.inductionAttachment || '')
      };

      console.log('InductionCriteria handleSave payload:', payload);

      // Clean up audit fields and helper fields before sending to backend
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdUser;
      delete payload.updatedUser;
      delete payload.createdBy;
      delete payload.updatedBy;
      delete payload._rawDepartmentCodes; // internal helper field
      delete payload.index; // from table mapper

      if (formData.id) {
        await axios.put(`/api/hr/induction-master/${formData.id}`, payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Induction Criteria Updated Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      } else {
        await axios.post('/api/hr/induction-master', payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Induction Criteria Saved Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || 'Failed to save induction criteria';
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
      await axios.delete(`/api/hr/induction-master/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Induction Criteria Deleted Successfully', variant: 'alert', severity: 'success' }));
      setDeleteDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || 'Failed to delete';
      dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', severity: 'error' }));
    }
  };

  const resolvedRows = useMemo(() => {
    return rows
      .filter((row) => {
        if (!matchDateRange(row, globalFilters, 'createdAt')) return false;

        const statusFilter = (globalFilters?.isActive || 'ALL').toUpperCase();
        if (statusFilter !== 'ALL') {
          const isActiveVal = statusFilter === 'ACTIVE';
          if (row.isActive !== isActiveVal) return false;
        }

        if (globalQuery) {
          const q = globalQuery.toLowerCase();
          const matchText = (
            (row.inductionDetails || '') + ' ' +
            (row.answer || '') + ' ' +
            (row.departmentCodes || '') + ' ' +
            (row.levelCodes || '')
          ).toLowerCase();
          if (!matchText.includes(q)) return false;
        }

        return true;
      })
      .map((r, i) => {
        // Resolve comma-separated department IDs or codes to actual department names
        const deptNames = r.departmentCodes
          ? r.departmentCodes
              .split(',')
              .map((code) => {
                const trimmed = code.trim();
                const match = departments.find((d) =>
                  (d.id !== undefined && d.id !== null && String(d.id) === trimmed) ||
                  (d.departmentNo && d.departmentNo.trim().toLowerCase() === trimmed.toLowerCase()) ||
                  (d.code && String(d.code).trim().toLowerCase() === trimmed.toLowerCase()) ||
                  (d.departmentName && d.departmentName.trim().toLowerCase() === trimmed.toLowerCase())
                );
                if (match) return (match.departmentName || match.name || match.departmentNo).toUpperCase();
                if (FALLBACK_DEPARTMENTS_MAP[trimmed]) return FALLBACK_DEPARTMENTS_MAP[trimmed];
                return trimmed.toUpperCase();
              })
              .join(', ')
          : '-';

        return {
          ...r,
          index: i + 1,
          serialNo: (i + 1).toString(),
          _rawDepartmentCodes: r.departmentCodes || '', // preserve raw codes before overwriting
          departmentCodes: deptNames, // Render friendly department names in table row
          createdUser: r.createdUser || r.createdBy || '-',
          updatedUser: r.updatedUser || r.updatedBy || '-',
          createdAt: r.createdAt || '-',
          updatedAt: r.updatedAt || '-'
        };
      });
  }, [rows, departments, globalFilters, globalQuery]);

  const exportColumns = useMemo(() => [
    { id: 'inductionDetails', header: 'Induction Details', key: (row) => row.inductionDetails || '-' },
    { id: 'answer', header: 'Answer', key: (row) => row.answer || '-' },
    { id: 'departmentCodes', header: 'Department', key: (row) => row.departmentCodes || '-' },
    { id: 'levelCodes', header: 'Level', key: (row) => row.levelCodes || '-' },
    { id: 'attachmentRequired', header: 'Attachment Required', key: (row) => row.attachmentRequired || 'NO' },
    { id: 'isActive', header: 'Status', key: (row) => row.isActive !== false ? 'Active' : 'Inactive' },
    { id: 'createdUser', header: 'Created By', key: (row) => row.createdUser || row.createdBy || '-' },
    { id: 'createdAt', header: 'Created Date', key: (row) => row.createdAt || '-' },
    { id: 'updatedUser', header: 'Updated By', key: (row) => row.updatedUser || row.updatedBy || '-' },
    { id: 'updatedAt', header: 'Updated Date', key: (row) => row.updatedAt || '-' }
  ], []);

  if (perms.loading) {
    return null;
  }

  return (
    <MainCard fullWidth
      icon={IconClipboardCheck}
      title={"Induction Criteria"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newLabel="+ New"
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          exportColumns={exportColumns}
          exportFilename="Induction_Criteria"
          hasExportPermission={perms.export}
          columns={columns} />
      }
    >
      <BOSDataTable
        id="induction-criteria-table"
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={handleDelete}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={formData.id ? 'Edit Induction Details' : 'Add Induction Details'}
        fullWidth
        maxWidth="lg"
        sidebar={sidebarContent}
        hideCollapse={true}
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
      >
        <BOSFormSection title="1. Basic Information">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
            <BOSTextField
              name="serialNo"
              label="Sl.No"
              value={
                formData.id
                  ? (formData.index || resolvedRows.find(r => r.id === formData.id)?.index || '').toString()
                  : (resolvedRows.length + 1).toString()
              }
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
            <BOSStatusField
              isCreate={!formData.id}
              type="boolean"
              name="isActive"
              label="STATUS"
              value={formData.isActive}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, isActive: val === 'true' || val === true }));
              }}
              disabled={!formData.id}
              required
              error={!!errors.isActive}
              helperText={errors.isActive}
              sx={errorStyle(!!errors.isActive)}
            />
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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mt: 3 }}>
            <BOSAutocomplete
              multiple
              name="departmentCodes"
              label="DEPARTMENT"
              value={formData.departmentCodes}
              options={departmentOptions}
              onChange={(vals) => {
                const selectedIds = Array.isArray(vals)
                  ? vals.map((v) => (typeof v === 'object' ? String(v.id || v.value) : String(v)))
                  : [];
                setFormData((prev) => ({ ...prev, departmentCodes: selectedIds }));
                if (errors.departmentCodes) clearErrors('departmentCodes');
              }}
              required
              error={!!errors.departmentCodes}
              helperText={errors.departmentCodes || 'Select departments this applies to'}
            />

            <BOSAutocomplete
              multiple
              name="levelCodes"
              label="LEVEL"
              value={formData.levelCodes}
              options={levelAutocompleteOptions}
              onChange={(vals) => {
                const selectedLevels = Array.isArray(vals)
                  ? vals.map((v) => (typeof v === 'object' ? String(v.id || v.value || v.code) : String(v)))
                  : [];
                const order = LEVEL_OPTIONS.map((l) => l.code);
                const sortedLevels = [...selectedLevels].sort((a, b) => {
                  const idxA = order.indexOf(a);
                  const idxB = order.indexOf(b);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return 0;
                });
                setFormData((prev) => ({ ...prev, levelCodes: sortedLevels }));
                if (errors.levelCodes) clearErrors('levelCodes');
              }}
              required
              error={!!errors.levelCodes}
              helperText={errors.levelCodes || 'Select levels this applies to'}
            />
          </Box>
        </BOSFormSection>

        <BOSFormSection title="2. Criteria Content">
          <Stack spacing={3}>
            <BOSTextField
              name="inductionDetails"
              label="INDUCTION DETAILS"
              placeholder="Enter specific induction criteria or question details..."
              value={formData.inductionDetails}
              onChange={handleInputChange}
              multiline
              rows={4}
              required
              fullWidth
              error={!!errors.inductionDetails}
              helperText={errors.inductionDetails}
              sx={errorStyle(!!errors.inductionDetails)}
            />
            <BOSTextField
              name="answer"
              label="ANSWER"
              placeholder="Enter the expected answer or guidelines for this induction..."
              value={formData.answer}
              onChange={handleInputChange}
              multiline
              rows={4}
              required
              fullWidth
              error={!!errors.answer}
              helperText={errors.answer}
              sx={errorStyle(!!errors.answer)}
            />
          </Stack>
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Induction Criteria"
        message="Are you sure you want to delete this induction criteria?"
        itemName={deleteTarget?.inductionDetails}
      />

      <BOSFilePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
        allFiles={previewFilesList}
        onNavigate={(newFile) => setPreviewFile(newFile)}
      />
    </MainCard>
  );
}

