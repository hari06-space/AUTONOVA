import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconBook2, IconSitemap, IconList, IconBuildingBank, IconReceiptTax, IconZoomIn, IconZoomOut, IconFocusCentered, IconHandStop, IconArrowRight, IconArrowDown, IconPlus, IconMinus } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { Box, Card, Typography, Button, Stack, IconButton, Tooltip } from '@mui/material';
import Tree from 'react-d3-tree';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSDataTable, BOSTextField, BOSStatusField, getCommonDateFilters, errorStyle, BOSTableToolbar, BOSFormDialog, BOSFormSection, BOSAutocomplete, BOSStatusChip } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import axios from 'utils/axios';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

const renderForeignObjectNode = ({ nodeDatum, toggleNode, foreignObjectProps, handleOpen }) => {
  const { isRoot, groupName, description, level, isFinanceLedger, isTaxLedger, ledgerName } = nodeDatum.attributes || {};
  
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
          <Card variant="outlined" sx={{ p: 1, display: 'inline-block', width: '100%', height: '100%', boxSizing: 'border-box', bgcolor: '#f0fdf4', border: '2px solid #22c55e', borderRadius: 2, textAlign: 'center' }}>
            <IconBuildingBank size={18} color="#22c55e" />
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#166534', mt: 0.5 }}>{ledgerName}</Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#166534', fontSize: '0.65rem' }}>Finance Ledger</Typography>
          </Card>
        </foreignObject>
      </g>
    );
  }

  if (isTaxLedger) {
    return (
      <g>
        <foreignObject {...foreignObjectProps} width={160} height={80} x={-80} y={-40}>
          <Card variant="outlined" sx={{ p: 1, display: 'inline-block', width: '100%', height: '100%', boxSizing: 'border-box', bgcolor: '#fef2f2', border: '2px solid #ef4444', borderRadius: 2, textAlign: 'center' }}>
            <IconReceiptTax size={18} color="#ef4444" />
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', color: '#991b1b', mt: 0.5 }}>{ledgerName}</Typography>
            <Typography variant="caption" sx={{ display: 'block', color: '#991b1b', fontSize: '0.65rem' }}>Tax Ledger</Typography>
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
            onClick={() => handleOpen(nodeDatum.rawNode)}
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
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, bgcolor: 'grey.100', borderRadius: 1, px: 1, py: 0.2 }}>Level {level}</Typography>
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
  { id: 'groupName', label: 'Group Name', minWidth: 200, bold: true, align: 'left' },
  { id: 'description', label: 'Description', minWidth: 250 },
  { id: 'parentName', label: 'Parent Group', minWidth: 200 },
  { id: 'rootGroupName', label: 'Root Group', minWidth: 200 },
  { id: 'level', label: 'Level', minWidth: 100 },
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

export default function LedgerGroup() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpen(),
    'escape': () => handleClose()
  });

  const [rows, setRows] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);
  // We need to define a new PAGE_CODE for Ledger Group if it doesn't exist, we'll use a placeholder or check permissions loosely.
  // Using 'M9110' which we added to the database script.
  const perms = usePagePermissions('M9110');

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
  const [editId, setEditId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    level: '',
    parentId: '',
    isActive: true
  });

  const [financeLedgers, setFinanceLedgers] = useState([]);
  const [taxLedgers, setTaxLedgers] = useState([]);

  const fetchRows = async () => {
    try {
      const [grpRes, finRes, taxRes] = await Promise.all([
        axios.get('/api/master/finance/ledger-group'),
        axios.get('/api/master/finance/ledger'),
        axios.get('/api/master/finance/tax-ledger')
      ]);
      const allRows = grpRes.data || [];
      setFinanceLedgers(finRes.data || []);
      setTaxLedgers(taxRes.data || []);

      const rowMap = new Map(allRows.map(r => [r.id, r]));

      const rowsWithRoot = allRows.map(row => {
        let current = row;
        while (current.parentId) {
          const parent = rowMap.get(current.parentId);
          if (!parent) break;
          current = parent;
        }
        return { ...row, rootGroupName: current.id === row.id ? '-' : current.groupName };
      });

      setRows(rowsWithRoot);
      setParentOptions(allRows.map(item => ({ label: item.groupName, value: item.id })));
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
        groupName: row.groupName || '',
        description: row.description || '',
        level: row.level || '',
        parentId: row.parentId || '',
        isActive: row.isActive
      });
    } else {
      setEditId(null);
      setFormData({
        groupName: '',
        description: '',
        level: '',
        parentId: '',
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
    if (!formData.groupName?.trim()) {
      currentErrors.groupName = 'Group Name is required.';
    }

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
        await axios.put(`/api/master/finance/ledger-group/${editId}`, formData);
      } else {
        await axios.post('/api/master/finance/ledger-group', formData);
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
    setDeleteName(row.groupName);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/master/finance/ledger-group/${deleteId}`);
      setDeleteOpen(false);
      setDeleteId(null);
      setDeleteName('');
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const config = [
      { id: 'groupName', label: 'Group Name', type: 'text', isStarred: true },
      { id: 'description', label: 'Description', type: 'text', isStarred: true },
      { id: 'parentName', label: 'Parent Group', type: 'text' },
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
      (row.groupName && row.groupName.toString().toLowerCase().includes(q)) ||
      (row.description && row.description.toString().toLowerCase().includes(q)) ||
      (row.parentName && row.parentName.toString().toLowerCase().includes(q))
    ).map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, globalQuery]);

  const visibleSet = useMemo(() => {
    if (!treeRootId) return new Set(rows.map(r => String(r.id)));
    const visible = new Set();

    // Add ancestors
    let curr = String(treeRootId);
    while (curr && curr !== 'null' && curr !== 'undefined') {
      visible.add(curr);
      const node = rows.find(r => String(r.id) === curr);
      curr = node && node.parentId ? String(node.parentId) : null;
    }

    // Add descendants
    const addDescendants = (parentId) => {
      const children = rows.filter(r => String(r.parentId) === String(parentId));
      children.forEach(c => {
        visible.add(String(c.id));
        addDescendants(c.id);
      });
    };
    addDescendants(treeRootId);

    return visible;
  }, [treeRootId, rows]);

  const buildTreeData = (parentId = null) => {
    const children = rows.filter(r => {
      const pId = r.parentId ? String(r.parentId) : null;
      return pId === (parentId ? String(parentId) : null) && visibleSet.has(String(r.id));
    });

    if (!children.length) return [];

    return children.map(child => {
      const childFinanceLedgers = financeLedgers.filter(l => l.groupId === child.id);
      const childTaxLedgers = taxLedgers.filter(l => l.groupId === child.id);

      const subChildren = buildTreeData(child.id);
      
      const finChildren = childFinanceLedgers.map(l => ({
        name: `fin-${l.id}`,
        attributes: { isFinanceLedger: true, ledgerName: l.ledgerName }
      }));
      
      const taxChildren = childTaxLedgers.map(l => ({
        name: `tax-${l.id}`,
        attributes: { isTaxLedger: true, ledgerName: l.ledgerName }
      }));

      return {
        name: child.groupName,
        rawNode: child,
        attributes: {
          groupName: child.groupName,
          description: child.description,
          level: child.level
        },
        children: [...subChildren, ...finChildren, ...taxChildren]
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
            options={[{ label: 'ALL LEDGER GROUPS', value: null }, ...parentOptions]}
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
      title={"Ledger Group"}
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
            newTooltip={shortcutTooltip('Create New Ledger Group', 'Ctrl + N')}
            hasWritePermission={perms.write}
            exportData={rows}
            exportFilename="Ledger_Group"
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
          onPageChange={(p) => setPage(p)}
          onSizeChange={(s) => { setSize(s); setPage(0); }}
          onEditRow={(row) => handleOpen(row)}
          onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        />
      ) : (
        renderTreeView()
      )}

      <BOSFormDialog
        open={open}
        onClose={handleClose}
        title={editId ? 'Edit Ledger Group' : 'New Ledger Group'}
        onSave={handleSubmit}
        isViewOnly={!perms.write}
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField
            disabled={!perms.write}
            label="Group Name"
            fullWidth
            value={formData.groupName}
            onChange={(e) => {
              setFormData({ ...formData, groupName: e.target.value });
              if (errors.groupName) setErrors((prev) => ({ ...prev, groupName: '' }));
            }}
            error={!!errors.groupName}
            helperText={errors.groupName}
            sx={errorStyle(!!errors.groupName)}
          />
          <BOSTextField
            disabled={!perms.write}
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <BOSAutocomplete
            disabled={!perms.write}
            label="Parent Group"
            options={parentOptions.filter(opt => opt.value !== editId)} // prevent self-parenting
            value={formData.parentId}
            onChange={(val) => setFormData({ ...formData, parentId: val })}
          />
          <BOSTextField
            disabled={!perms.write}
            label="Level"
            fullWidth
            type="number"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
          />
          <BOSStatusField
            isCreate={!editId}
            type="boolean"
            name="isActive"
            label="Status"
            value={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.value })}
            disabled={!perms.write}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Ledger Group"
        message="Are you sure you want to delete this ledger group?"
        itemName={deleteName}
      />
    </MainCard>
  );
}
