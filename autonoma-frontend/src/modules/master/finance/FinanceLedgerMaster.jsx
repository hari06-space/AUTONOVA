import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconBook2, IconSitemap, IconList, IconBuildingBank, IconBuildingStore, IconZoomIn, IconZoomOut, IconFocusCentered, IconHandStop, IconArrowRight, IconArrowDown, IconPlus, IconMinus } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { Box, Stack, Card, Typography, Button, IconButton, Tooltip } from '@mui/material';
import Tree from 'react-d3-tree';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSDataTable, BOSTextField, BOSStatusField, getCommonDateFilters, errorStyle, BOSTableToolbar, BOSFormDialog, BOSFormSection, BOSAutocomplete, BOSStatusChip } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import axios from 'utils/axios';
import usePagePermissions from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

const renderForeignObjectNode = ({ nodeDatum, toggleNode, foreignObjectProps, handleOpen }) => {
  const { isRoot, groupName, description, level, isFinanceLedger, ledgerName } = nodeDatum.attributes || {};
  
  if (isRoot) {
    return (
      <g>
        <foreignObject {...foreignObjectProps} width={200} height={80} x={-100} y={-40}>
          <Card variant="outlined" sx={{ p: 2, display: 'inline-block', bgcolor: 'primary.main', color: 'white', boxShadow: 2, borderRadius: 2, textAlign: 'center', width: '100%', height: '100%', boxSizing: 'border-box' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
              ALL LEDGER GROUPS
            </Typography>
          </Card>
        </foreignObject>
      </g>
    );
  }

  if (isFinanceLedger) {
    return (
      <g>
        <foreignObject {...foreignObjectProps} width={160} height={80} x={-80} y={-40}>
          <Card 
            variant="outlined" 
            onClick={() => handleOpen(nodeDatum.rawNode)}
            sx={{ p: 1, display: 'inline-block', width: '100%', height: '100%', boxSizing: 'border-box', bgcolor: '#f0fdf4', border: '2px solid #22c55e', borderRadius: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}
          >
            <IconBuildingBank size={18} color="#22c55e" />
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#166534', mt: 0.5 }}>{ledgerName}</Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#166534', fontSize: '0.65rem' }}>Finance Ledger</Typography>
          </Card>
        </foreignObject>
      </g>
    );
  }

  return (
    <g>
      <foreignObject {...foreignObjectProps} width={200} height={100} x={-100} y={-50}>
        <Box sx={{ position: 'relative', display: 'inline-block', width: '100%', height: '100%' }}>
          <Card
            variant="outlined"
            onClick={toggleNode}
            sx={{
              p: 1.5,
              display: 'inline-block',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '2px solid',
              borderColor: 'primary.light',
              borderRadius: 2,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{groupName}</Typography>
            {description && <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>{description}</Typography>}
          </Card>
          {nodeDatum.children && nodeDatum.children.length > 0 && (
            <IconButton 
              size="small" 
              onClick={toggleNode}
              sx={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', bgcolor: 'white', border: '1px solid #cbd5e1', zIndex: 2, '&:hover': { bgcolor: '#f8fafc' }, p: 0.2 }}
            >
              {nodeDatum.__rd3t.collapsed ? <IconPlus size={14} color="#64748b" /> : <IconMinus size={14} color="#64748b" />}
            </IconButton>
          )}
        </Box>
      </foreignObject>
    </g>
  );
};


const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'ledgerName', label: 'Ledger Name', minWidth: 200, bold: true, align: 'left' },
  { id: 'shortName', label: 'Short Name', minWidth: 150 },
  { id: 'printName', label: 'Print Name', minWidth: 200 },
  { id: 'category', label: 'Ledger Category', minWidth: 150 },
  { id: 'groupName', label: 'Group Name', minWidth: 150 },
  {
    id: 'isActive',
    label: 'Status',
    minWidth: 100,
    renderCell: (val) => <BOSStatusChip status={val ? 'Active' : 'Inactive'} showIcon={true} />
  },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function FinanceLedgerMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpen(),
    'escape': () => handleClose()
  });

  const [rows, setRows] = useState([]);
  const [ledgerGroups, setLedgerGroups] = useState([]);
  const perms = usePagePermissions('M9120');

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [treeRootId, setTreeRootId] = useState(null);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [translate, setTranslate] = useState({ x: 200, y: 200 });
  const containerRef = useCallback((containerElem) => {
    if (containerElem !== null) {
      const { width, height } = containerElem.getBoundingClientRect();
      setTranslate(
        isHorizontal 
          ? { x: width / 6, y: height / 2 } 
          : { x: width / 2, y: height / 6 }
      );
    }
  }, [isHorizontal]);
  const [rawLedgerGroups, setRawLedgerGroups] = useState([]);
  const [editId, setEditId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    ledgerName: '',
    shortName: '',
    printName: '',
    category: 'purchase',
    groupId: '',
    isActive: true
  });

  const fetchRows = async () => {
    try {
      const [ledgerRes, groupRes] = await Promise.all([
        axios.get('/api/master/finance/ledger'),
        axios.get('/api/master/finance/ledger-group')
      ]);
      const groups = groupRes.data.map(item => ({ label: item.groupName, value: item.id }));
      setLedgerGroups(groups);
      setRawLedgerGroups(groupRes.data);
      
      const rowsWithGroupName = ledgerRes.data.map(row => {
        const matchedGroup = groupRes.data.find(g => g.id === row.groupId);
        return {
          ...row,
          groupName: matchedGroup ? matchedGroup.groupName : row.groupId
        };
      });
      setRows(rowsWithGroupName);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleOpen = (row = null) => {
    setErrors({});
    if (row) {
      setEditId(row.id);
      setFormData({
        ledgerName: row.ledgerName || '',
        shortName: row.shortName || '',
        printName: row.printName || '',
        category: row.category || 'purchase',
        groupId: row.groupId || '',
        isActive: row.isActive
      });
    } else {
      setEditId(null);
      setFormData({
        ledgerName: '',
        shortName: '',
        printName: '',
        category: 'purchase',
        groupId: '',
        isActive: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setErrors({});
  };

  const handleSubmit = async () => {
    setErrors({});
    let currentErrors = {};
    if (!formData.ledgerName?.trim()) currentErrors.ledgerName = 'Ledger Name is required.';
    if (!formData.shortName?.trim()) currentErrors.shortName = 'Short Name is required.';
    if (!formData.category) currentErrors.category = 'Ledger Category is required.';
    if (!formData.groupId) currentErrors.groupId = 'Group is required.';

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill the mandatory fields',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
      return;
    }

    try {
      if (editId) {
        await axios.put(`/api/master/finance/ledger/${editId}`, formData);
      } else {
        await axios.post('/api/master/finance/ledger', formData);
      }
      handleClose();
      fetchRows();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'An error occurred while saving.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteId(row.id);
    setDeleteName(row.ledgerName);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/master/finance/ledger/${deleteId}`);
      setDeleteOpen(false);
      if (editId === deleteId) {
        handleClose();
      }
      setDeleteId(null);
      setDeleteName('');
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClear = () => {
    if (editId) {
      const row = rows.find(r => r.id === editId);
      if (row) handleOpen(row);
    } else {
      handleOpen();
    }
  };

  useEffect(() => {
    const config = [
      { id: 'ledgerName', label: 'Ledger Name', type: 'text', isStarred: true },
      { id: 'shortName', label: 'Short Name', type: 'text' },
      { id: 'category', label: 'Ledger Category', type: 'text' },
      ...getCommonDateFilters('createdDate', 'updatedDate')
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').toLowerCase();
    const sourceRows = rows || [];
    if (!q) return sourceRows.map((r, i) => ({ ...r, index: i + 1 }));
    return sourceRows.filter(row =>
      (row.ledgerName && row.ledgerName.toString().toLowerCase().includes(q)) ||
      (row.shortName && row.shortName.toString().toLowerCase().includes(q)) ||
      (row.category && row.category.toString().toLowerCase().includes(q))
    ).map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, globalQuery]);

  const ledgerTypeOptions = [
    { label: 'Purchase', value: 'purchase' },
    { label: 'Service', value: 'service' },
    { label: 'Others', value: 'others' }
  ];

  const visibleSet = useMemo(() => {
    if (!treeRootId) return new Set(rawLedgerGroups.map(r => String(r.id)));
    const visible = new Set();

    // Add ancestors
    let curr = String(treeRootId);
    while (curr && curr !== 'null' && curr !== 'undefined') {
      visible.add(curr);
      const node = rawLedgerGroups.find(r => String(r.id) === curr);
      curr = node && node.parentId ? String(node.parentId) : null;
    }

    // Add descendants
    const addDescendants = (parentId) => {
      const children = rawLedgerGroups.filter(r => String(r.parentId) === String(parentId));
      children.forEach(c => {
        visible.add(String(c.id));
        addDescendants(c.id);
      });
    };
    addDescendants(treeRootId);

    return visible;
  }, [treeRootId, rawLedgerGroups]);

  const buildTreeData = (parentId = null) => {
    const children = rawLedgerGroups.filter(r => {
      const pId = r.parentId ? String(r.parentId) : null;
      return pId === (parentId ? String(parentId) : null) && visibleSet.has(String(r.id));
    });

    if (!children.length) return [];

    return children.map(child => {
      const childFinanceLedgers = rows.filter(l => l.groupId === child.id);

      const subChildren = buildTreeData(child.id);
      
      const finChildren = childFinanceLedgers.map(l => ({
        name: `fin-${l.id}`,
        rawNode: l,
        attributes: { isFinanceLedger: true, ledgerName: l.ledgerName }
      }));
      
      return {
        name: child.groupName,
        rawNode: child,
        attributes: {
          groupName: child.groupName,
          description: child.description,
          level: child.level
        },
        children: [...subChildren, ...finChildren]
      };
    });
  };

  const renderTreeView = () => {
    const treeData = {
      name: 'ALL LEDGER GROUPS',
      attributes: { isRoot: true },
      children: buildTreeData(null)
    };

    const nodeSize = isHorizontal ? { x: 280, y: 150 } : { x: 220, y: 200 };

    return (
      <Box sx={{ p: 4, height: 600, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" spacing={2} mb={2} alignItems="center" sx={{ zIndex: 10 }}>
          <Typography variant="h5" color="textSecondary">Mind Map Focus:</Typography>
          <BOSAutocomplete
            options={[{ label: 'ALL LEDGER GROUPS', value: null }, ...ledgerGroups]}
            value={treeRootId}
            onChange={(val) => setTreeRootId(val ? (val.value !== undefined ? val.value : val.id !== undefined ? val.id : val) : null)}
            sx={{ width: 400, bgcolor: 'white' }}
            placeholder="Select a specific group to trace..."
          />
        </Stack>
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: 'white' }} ref={containerRef}>
          <Box sx={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, display: 'flex', gap: 1, bgcolor: 'background.paper', p: 1, borderRadius: 2, boxShadow: 3 }}>
            <Tooltip title="Toggle Layout Direction">
              <IconButton size="small" onClick={() => setIsHorizontal(!isHorizontal)}>
                {isHorizontal ? <IconArrowDown size={20} /> : <IconArrowRight size={20} />}
              </IconButton>
            </Tooltip>
          </Box>
          <Tree
            data={treeData}
            orientation={isHorizontal ? 'horizontal' : 'vertical'}
            pathFunc="step"
            nodeSize={nodeSize}
            renderCustomNodeElement={(rd3tProps) => renderForeignObjectNode({ ...rd3tProps, handleOpen })}
            translate={translate}
          />
        </Box>
      </Box>
    );
  };

  return (
    <MainCard fullWidth
      icon={IconBook2}
      title={"Finance Ledger Master"}
      secondary={
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={viewMode === 'list' ? <IconSitemap size={18} /> : <IconList size={18} />}
            onClick={() => setViewMode(viewMode === 'list' ? 'tree' : 'list')}
            sx={{ height: 36, px: 2, borderRadius: 2 }}
          >
            {viewMode === 'list' ? 'Mind Map' : 'List View'}
          </Button>
          <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={() => handleOpen()}
          newTooltip={shortcutTooltip('Create New Finance Ledger', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={rows}
          exportFilename="Finance_Ledger"
          hasExportPermission={perms.export}
          columns={columns}
        />
        </Stack>
      }
    >
      {viewMode === 'list' ? (
        <BOSDataTable
          columns={columns}
          rows={filteredRows}
          page={page}
          size={size}
          totalCount={rows.length}
          onPageChange={(newPage) => setPage(newPage)}
          onSizeChange={(newSize) => { setSize(newSize); setPage(0); }}
          onEditRow={(row) => handleOpen(row)}
          onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        />
      ) : (
        renderTreeView()
      )}

      <BOSFormDialog
        open={open}
        onClose={handleClose}
        title={editId ? "Edit Finance Ledger" : "New Finance Ledger"}
        icon={<IconBook2 size={24} />}
        onSave={handleSubmit}
        onClear={handleClear}
        hasId={!!editId}
        onDelete={perms.delete && editId ? () => handleDeleteClick({ id: editId, ledgerName: formData.ledgerName }) : undefined}
        isEdit={!!editId}
        maxWidth="md"
      >
        <BOSFormSection title="General Details">
          <Stack spacing={2} sx={{ mt: 1 }}>
            <BOSTextField
              label="Ledger Name"
              required
              value={formData.ledgerName}
              onChange={(e) => setFormData({ ...formData, ledgerName: e.target.value })}
              error={!!errors.ledgerName}
              helperText={errors.ledgerName}
              inputProps={{ sx: errorStyle(!!errors.ledgerName) }}
            />
            <BOSTextField
              label="Short Name"
              required
              value={formData.shortName}
              onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              error={!!errors.shortName}
              helperText={errors.shortName}
              inputProps={{ sx: errorStyle(!!errors.shortName) }}
            />
            <BOSTextField
              label="Print Name"
              value={formData.printName}
              onChange={(e) => setFormData({ ...formData, printName: e.target.value })}
            />
            <BOSAutocomplete
              label="Ledger Category"
              required
              options={ledgerTypeOptions}
              value={ledgerTypeOptions.find(opt => opt.value === formData.category) || null}
              onChange={(newVal) => setFormData({ ...formData, category: newVal ? newVal.value : '' })}
              error={!!errors.category}
              helperText={errors.category}
            />
            <BOSAutocomplete
              label="Ledger Group"
              required
              options={ledgerGroups}
              value={ledgerGroups.find(opt => opt.value === formData.groupId) || null}
              onChange={(newVal) => setFormData({ ...formData, groupId: newVal ? newVal.value : '' })}
              error={!!errors.groupId}
              helperText={errors.groupId}
            />
            <BOSStatusField
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
          </Stack>
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Finance Ledger"
        name={deleteName}
      />
    </MainCard>
  );
}
