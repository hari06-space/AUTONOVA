import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Box, Stack, Button, Tooltip, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Badge } from '@mui/material';
import { IconPlus, IconUsersGroup, IconRefresh, IconDownload, IconEye, IconPaperclip, IconCalendarTime } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, btnNew, BOSStatusChip, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSFilePreview } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import AddMeetingMasterDialog from './AddMeetingMasterDialog';
import ScheduleRuleBuilderDialog from '../MeetingSchedule/ScheduleRuleBuilderDialog';
import ScheduleSimulationDialog from '../MeetingSchedule/ScheduleSimulationDialog';

const formatEmployeeNames = (val) => {
  if (!val || val === '-') return '-';
  return val.split(',').map((item) => {
    const trimmed = item.trim();
    if (trimmed.includes(' - ')) {
      const parts = trimmed.split(' - ').map((p) => p.trim());
      const isCode = (str) => /^[A-Z0-9_-]+$/i.test(str) || str.includes('EMP-') || str.includes('ADMIN_');
      if (isCode(parts[0])) {
        return `${parts[1] || parts[0]} (${parts[0]})`;
      }
      return `${parts[0]} (${parts[1] || ''})`;
    }
    return trimmed;
  }).join(', ');
};

const parseEmpDetails = (empStr) => {
  let name = empStr.trim();
  let code = '';
  if (name.includes(' - ')) {
    const parts = name.split(' - ').map((p) => p.trim());
    const isCode = (str) => /^[A-Z0-9_-]+$/i.test(str) || str.includes('EMP-') || str.includes('ADMIN_');
    if (isCode(parts[0])) {
      code = parts[0];
      name = parts[1] || parts[0];
    } else {
      name = parts[0];
      code = parts[1] || '';
    }
  } else if (name.includes('(') && name.includes(')')) {
    const match = name.match(/^(.*?)\((.*?)\)$/);
    if (match) {
      name = match[1].trim();
      code = match[2].trim();
    }
  }
  return { name, code, labelText: code ? `${name} (${code})` : name, initial: (name || 'E').charAt(0).toUpperCase() };
};

const renderSingleChip = (empStr, key) => {
  const { labelText, initial } = parseEmpDetails(empStr);
  return (
    <Chip
      key={key}
      avatar={
        <Box
          sx={{
            bgcolor: '#0f172a',
            color: '#ffffff',
            width: 20,
            height: 20,
            borderRadius: '50%',
            fontSize: '0.65rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ml: '2px !important'
          }}
        >
          {initial}
        </Box>
      }
      label={labelText}
      size="small"
      variant="outlined"
      sx={{
        fontWeight: 600,
        fontSize: '0.72rem',
        bgcolor: 'background.paper',
        borderColor: 'divider',
        borderRadius: '16px',
        height: 24,
        maxHeight: 24,
        whiteSpace: 'nowrap',
        '& .MuiChip-label': { px: 1 }
      }}
    />
  );
};

const renderEmployeeProfileChips = (val) => {
  if (!val || val === '-') return '-';
  const items = val.split(',').map((item) => item.trim()).filter(Boolean);
  if (items.length === 0) return '-';

  const visibleItems = items.slice(0, 2);
  const remainingItems = items.slice(2);

  const fullListText = items.map((i) => parseEmpDetails(i).labelText).join('\n');

  return (
    <Stack direction="row" alignItems="center" spacing={0.6} sx={{ py: 0.5, flexWrap: 'nowrap' }}>
      {visibleItems.map((item, idx) => renderSingleChip(item, idx))}
      {remainingItems.length > 0 && (
        <Tooltip
          title={
            <Box sx={{ p: 0.5, whiteSpace: 'pre-line', fontSize: '0.75rem', lineHeight: 1.6 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#38bdf8' }}>
                All Participants ({items.length}):
              </Typography>
              {fullListText}
            </Box>
          }
          arrow
          placement="top"
        >
          <Chip
            label={`+${remainingItems.length} more`}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 24,
              maxHeight: 24,
              cursor: 'pointer',
              bgcolor: '#e0f2fe',
              color: '#0369a1',
              borderColor: '#bae6fd',
              borderRadius: '16px',
              '&:hover': { bgcolor: '#bae6fd' }
            }}
          />
        </Tooltip>
      )}
    </Stack>
  );
};

const formatUserName = (name) => {
  if (!name) return '-';
  if (name.toLowerCase() === 'admin') return 'Admin';
  return name;
};

const stripHtml = (html) => {
  if (!html) return '-';
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text || '-';
};

const columns = [
  { id: 'index', label: '#', minWidth: 50, align: 'center' },
  { id: 'meetingName', label: 'Meeting Name', minWidth: 150, bold: true, align: 'center' },
  { id: 'meetingDescription', label: 'Meeting Description', minWidth: 200 },
  { id: 'meetingPrefix', label: 'Meeting Prefix', minWidth: 100, align: 'center' },
  { id: 'meetingAgenda', label: 'Meeting Agenda', minWidth: 200 },
  { id: 'employeeName', label: 'Employee Name', minWidth: 250 },
  { id: 'createdUser', label: 'CREATED BY', minWidth: 120, align: 'center' },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 140, align: 'center' },
  { id: 'updatedUser', label: 'UPDATED BY', minWidth: 120, align: 'center' },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 140, align: 'center' },
  { id: 'attachmentName', label: <Box display="flex" justifyContent="center" width="100%" title="Attachment"><IconPaperclip size={20} /></Box>, minWidth: 100, align: 'center' },
  { id: 'scheduleRules', label: 'Schedule Rules', minWidth: 130, align: 'center' },
  { id: 'status', label: 'Status', minWidth: 100, align: 'center' }
];

const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const dateStr = `${day}/${month}/${year}`;
  let hours = d.getHours() % 12;
  if (hours === 0) hours = 12;
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hoursStr}:${minutesStr}`;
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ width: '100%', textAlign: 'center' }}>
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
        {dateStr}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {timeStr}
      </Typography>
    </Stack>
  );
};

export default function MeetingMasterList() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.QMS_MEETING);
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewAllFiles, setPreviewAllFiles] = useState([]);

  // ── RULE BUILDER & SIMULATION STATE ──
  const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [selectedMeetingForRule, setSelectedMeetingForRule] = useState(null);
  const [meetingRulesMap, setMeetingRulesMap] = useState({});

  // ── GLOBAL FILTER CONFIG (same pattern as AuditScheduleList) ──
  useEffect(() => {
    const uniqueMeetingNames = [...new Set((rows || []).map(r => r.meetingName).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({ value: name, label: name }));

    dispatch(setFilterConfig([
      {
        id: 'status', label: 'Status', type: 'select', isStarred: true,
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'INACTIVE', label: 'INACTIVE' }
        ],
        defaultValue: 'ACTIVE'
      },
      {
        id: 'meetingName',
        label: 'Meeting Name',
        type: 'autocomplete',
        freeSolo: true,
        options: uniqueMeetingNames,
        placeholder: 'Search meeting name...',
        isStarred: true
      },
      ...getCommonDateFilters('createdAt', 'updatedAt').map(f => {
        if (f.id === 'createdAt') {
          return { ...f, type: 'dateRange', isStarred: true };
        }
        return f.id === 'updatedAt' ? { ...f, isStarred: false } : f;
      })
    ]));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, rows]);

  // ── FETCH DATA ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.QMS.MEETINGS);
      const data = Array.isArray(response.data) ? response.data : [];
      setRows([...data].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0)));

      // Fetch existing rules for each meeting
      data.forEach(m => {
        if (m && m.id) {
          axios.get(`${API_PATHS.QMS.SCHEDULE_RULES}/meeting/${m.id}`)
            .then(res => {
              setMeetingRulesMap(prev => ({ ...prev, [m.id]: res.data || [] }));
            })
            .catch(() => {});
        }
      });
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── CLIENT-SIDE FILTERING ──
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      const statusFilter = String(globalFilters.status === undefined ? 'ACTIVE' : globalFilters.status).toUpperCase();
      const rowStatus = row.isActive === false ? 'INACTIVE' : 'ACTIVE';
      if (statusFilter !== 'ALL' && rowStatus !== statusFilter) return false;

      const nameFilter = globalFilters.meetingName || '';
      if (nameFilter && !(row.meetingName || '').toLowerCase().includes(nameFilter.toLowerCase())) return false;

      if (globalQuery) {
        const q = globalQuery.toLowerCase();
        return (row.meetingName || '').toLowerCase().includes(q) ||
               (row.meetingPrefix || '').toLowerCase().includes(q) ||
               (row.meetingAgenda || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  // ── HANDLERS ──
  const handleAdd = () => { setSelectedItem(null); setDialogOpen(true); };
  const handleEdit = (item) => { setSelectedItem(item); setDialogOpen(true); };
  const handleDeleteClick = (row) => { setDeleteTarget(row); setDeleteDialogOpen(true); };

  const handleSave = async (form) => {
    try {
      const payload = { ...form };
      delete payload.createdUser;
      delete payload.updatedUser;
      delete payload.attachments;
      delete payload.employeeMappings;
      delete payload.employeeName;
      delete payload.statusObj;
      delete payload.title;
      delete payload.componentName;
      if (selectedItem) {
        await axios.put(`${API_PATHS.QMS.MEETINGS}/${selectedItem.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Meeting updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      } else {
        await axios.post(API_PATHS.QMS.MEETINGS, payload);
        dispatch(openSnackbar({ open: true, message: 'Meeting created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
        setPage(0);
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      let cleanError = error.details || error.message || error.response?.data?.message || '';
      if (cleanError.includes('could not execute statement [')) {
        const match = cleanError.match(/could not execute statement \[(.*?)\]/);
        if (match && match[1]) {
          cleanError = match[1];
        }
      }
      const finalMessage = cleanError ? `Failed to save meeting: ${cleanError}` : 'Failed to save meeting';
      dispatch(openSnackbar({ open: true, message: finalMessage, variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.QMS.MEETINGS}/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Meeting deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      fetchData();
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : (error.message || error.response?.data?.message || 'Failed to delete meeting');
      dispatch(openSnackbar({ open: true, message: errorMessage, variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleAdd,
    'ctrl+e': () => {
      const btn = document.getElementById('bos-export-button');
      if (btn && !btn.disabled) {
        btn.click();
      }
    }
  });

  // ── RENDER CELL ──
  const renderCell = (col, row, idx) => {
    if (col.id === 'index') return idx + 1 + page * size;
    if (col.id === 'status') {
      const rowStatus = row.isActive === false ? 'INACTIVE' : 'ACTIVE';
      return <BOSStatusChip status={rowStatus} showIcon={true} width={100} />;
    }
    if (col.id === 'createdAt') {
      return formatDateTime(row[col.id]);
    }
    if (col.id === 'createdUser') {
      return formatUserName(row.createdUser || row.createdBy);
    }
    if (col.id === 'updatedUser') {
      const isUpdated = row.updatedAt && row.createdAt && (new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime() > 1000);
      return isUpdated ? formatUserName(row.updatedUser || row.updatedBy) : '-';
    }
    if (col.id === 'updatedAt') {
      const isUpdated = row.updatedAt && row.createdAt && (new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime() > 1000);
      return isUpdated ? formatDateTime(row.updatedAt) : '-';
    }
    if (col.id === 'attachmentName') {
      const urls = (row.attachmentUrl || '').split(',').map(u => u.trim()).filter(Boolean);
      const names = (row.attachmentName || '').split(',').map(n => n.trim()).filter(Boolean);
      if (urls.length > 0) {
        return (
          <Tooltip title="View Attachments">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                const files = urls.map((url, i) => ({
                  serverFileName: url,
                  fileName: names[i] || url,
                  isServer: true
                }));
                setPreviewAllFiles(files);
                setPreviewFile(files[0]);
                setPreviewOpen(true);
              }}
            >
              <Badge badgeContent={urls.length} color="secondary" sx={{ '& .MuiBadge-badge': { right: -3, top: 3 } }}>
                <IconPaperclip size={18} />
              </Badge>
            </IconButton>
          </Tooltip>
        );
      }
      return '-';
    }
    if (col.id === 'scheduleRules') {
      const rules = meetingRulesMap[row.id] || [];
      const hasRules = rules.length > 0;
      return (
        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
          <Tooltip title={hasRules ? `${rules.length} Schedule Rule(s) Configured` : 'Configure Schedule Rules'}>
            <IconButton
              size="small"
              color={hasRules ? 'primary' : 'default'}
              onClick={() => {
                setSelectedMeetingForRule(row);
                setRuleBuilderOpen(true);
              }}
            >
              <Badge badgeContent={rules.length} color="primary">
                <IconCalendarTime size={18} />
              </Badge>
            </IconButton>
          </Tooltip>
        </Stack>
      );
    }
    if (col.id === 'employeeName') {
      return renderEmployeeProfileChips(row[col.id]);
    }
    if (col.id === 'meetingDescription' || col.id === 'meetingAgenda') {
      return stripHtml(row[col.id]);
    }
    return row[col.id] || '-';
  };

  return (
    <MainCard fullWidth
      icon={IconUsersGroup}
      title={"Meeting Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          onNew={handleAdd}
          newTooltip={shortcutTooltip('New Meeting', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows.map(row => ({
            ...row,
            meetingDescription: stripHtml(row.meetingDescription),
            meetingAgenda: stripHtml(row.meetingAgenda),
            employeeName: formatEmployeeNames(row.employeeName),
            createdUser: formatUserName(row.createdUser || row.createdBy),
            updatedUser: formatUserName(row.updatedUser || row.updatedBy),
            updatedAt: (row.updatedUser || row.updatedBy) ? row.updatedAt : null
          }))}
          exportButtonTooltip={shortcutTooltip('Export', 'Ctrl + E')}
          exportFilename="Meeting_Master"
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
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={perms.read ? handleEdit : undefined}
        onEditRow={perms.write ? handleEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        renderCell={renderCell}
        id="meeting-master-table"
      />

      <AddMeetingMasterDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        item={selectedItem}
        existingData={rows}
        readOnly={!perms.write}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Meeting Master"
        message="Are you sure you want to delete this meeting? This action cannot be undone."
        itemName={deleteTarget?.meetingName}
      />

      <BOSFilePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
        allFiles={previewAllFiles}
        onNavigate={(f) => setPreviewFile(f)}
        title="Attachment"
      />

      {/* SCHEDULE RULE BUILDER DIALOG */}
      {selectedMeetingForRule && (
        <ScheduleRuleBuilderDialog
          open={ruleBuilderOpen}
          onClose={() => {
            setRuleBuilderOpen(false);
            setSelectedMeetingForRule(null);
          }}
          meetingId={selectedMeetingForRule.id}
          meetingName={selectedMeetingForRule.meetingName}
          existingRules={meetingRulesMap[selectedMeetingForRule.id] || []}
          onRuleSaved={() => fetchData()}
          onOpenSimulation={() => {
            setRuleBuilderOpen(false);
            setSimulationOpen(true);
          }}
        />
      )}

      {/* SCHEDULE SIMULATION DIALOG */}
      {selectedMeetingForRule && (
        <ScheduleSimulationDialog
          open={simulationOpen}
          onClose={() => {
            setSimulationOpen(false);
            setSelectedMeetingForRule(null);
          }}
          meetingId={selectedMeetingForRule.id}
          meetingName={selectedMeetingForRule.meetingName || selectedMeetingForRule.name}
          meetingCode={selectedMeetingForRule.meetingCode || selectedMeetingForRule.code}
          defaultFrequency={selectedMeetingForRule.frequency || 'MONTHLY'}
        />
      )}
    </MainCard>
  );
}
