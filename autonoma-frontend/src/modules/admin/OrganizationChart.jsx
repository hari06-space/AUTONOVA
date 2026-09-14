import TextField from 'ui-component/CustomTextField';
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Card, Avatar, Stack, CircularProgress, IconButton, Tooltip, useTheme, Grid, Autocomplete, Popover, FormGroup, FormControlLabel, Checkbox, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import { Tree, TreeNode } from 'react-organizational-chart';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useLookups } from 'hooks/useLookups';
import MainCard from 'ui-component/cards/MainCard';
import {
  IconSitemap, IconZoomIn, IconZoomOut, IconFocus2, IconSettings,
  IconChevronDown, IconChevronUp, IconPlus, IconUserPlus, IconUserMinus, IconTrash, IconRefresh,
  IconArrowsJoin2, IconHierarchy
} from '@tabler/icons-react';
import { getUserImageUrl, getCompanyImageUrl } from 'utils/upload-helper';

// ─── Styled Node Component ──────────────────────────────────────────────────
const StyledNode = ({ position, isRoot, theme, isHighlighted, fields, collapsedNodes, toggleCollapse, handleDragStart, handleDrop, handleDragOver, isDraggingTarget, onAddPosition, onAssignEmployee, onUnassignEmployee, onDeletePosition, onManageReporting }) => {
  const hasChildren = position.children && position.children.length > 0;
  const isCollapsed = collapsedNodes.has(position.id);
  const isEmptySlot = !position.assignedEmployeeId && !position.isExited;
  const isExited = position.isExited;
  const isVacant = isEmptySlot || isExited;

  return (
    <Card
      draggable={!position.isCompanyNode}
      onDragStart={(e) => handleDragStart(e, position)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, position)}
      elevation={0}
      sx={{
        px: 1.8,
        pt: 1.2,
        pb: position.secondaryParentTitles?.length > 0 ? 2.4 : 1.6,
        display: 'inline-block',
        border: isEmptySlot
          ? `2px dashed ${theme.palette.text.disabled}`
          : isExited ? `2px solid ${theme.palette.error.light}`
            : isHighlighted ? `2px solid #2563eb`
              : `2px solid ${isDraggingTarget ? theme.palette.success.main : (isRoot ? theme.palette.primary.main : theme.palette.divider)}`,
        borderRadius: 2.5,
        backgroundColor: isDraggingTarget ? (theme.palette.mode === 'dark' ? 'rgba(16,185,129,0.1)' : '#ECFDF5') : (theme.palette.mode === 'dark' ? (isExited ? '#331111' : '#1E293B') : (isEmptySlot ? '#f9f9f9' : isExited ? '#fff1f0' : '#fff')),
        boxShadow: isHighlighted ? '0 0 16px rgba(37, 99, 235, 0.45)' : (isRoot ? `0 4px 14px ${theme.palette.primary.light}` : '0 3px 10px rgba(0,0,0,0.06)'),
        minWidth: 185,
        maxWidth: 220,
        position: 'relative',
        zIndex: 5,
        transition: 'all 0.25s ease',
        opacity: isExited ? 0.7 : 1,
        cursor: position.isCompanyNode ? 'default' : 'default',
        '&:hover': {
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          borderColor: isExited ? theme.palette.error.main : theme.palette.primary.light,
          opacity: 1
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Top Action Bar for Company Node */}
      {position.isCompanyNode && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minHeight: 24, mb: 0.8 }}>
          <Tooltip title="Add Top-Level Position (e.g. Director)" placement="top" arrow>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onAddPosition(position); }}
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
                color: '#059669',
                width: 24, height: 24,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#059669', color: '#fff', transform: 'scale(1.1)' }
              }}
            >
              <IconPlus size={13} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Dedicated Top Action Bar — Zero Overlap */}
      {!position.isCompanyNode && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, minHeight: 24, mb: 0.8 }}>
          {onManageReporting && (
            <Tooltip title="Manage Reporting (Matrix / Joint Managers)" placement="top" arrow>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onManageReporting(position); }}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
                  color: '#2563eb',
                  width: 24, height: 24,
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#2563eb', color: '#fff', transform: 'scale(1.1)' }
                }}
              >
                <IconArrowsJoin2 size={13} />
              </IconButton>
            </Tooltip>
          )}
          {!isVacant && (
            <Tooltip title="Unassign Employee" placement="top" arrow>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onUnassignEmployee(position); }}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(234, 88, 12, 0.2)' : '#fff7ed',
                  color: '#ea580c',
                  width: 24, height: 24,
                  border: '1px solid rgba(234, 88, 12, 0.3)',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#ea580c', color: '#fff', transform: 'scale(1.1)' }
                }}
              >
                <IconUserMinus size={13} />
              </IconButton>
            </Tooltip>
          )}
          {isVacant && (
            <Tooltip title="Assign Employee" placement="top" arrow>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onAssignEmployee(position); }}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(147, 51, 234, 0.2)' : '#faf5ff',
                  color: '#9333ea',
                  width: 24, height: 24,
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#9333ea', color: '#fff', transform: 'scale(1.1)' }
                }}
              >
                <IconUserPlus size={13} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Create Subordinate Position" placement="top" arrow>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onAddPosition(position); }}
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
                color: '#059669',
                width: 24, height: 24,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: '#059669', color: '#fff', transform: 'scale(1.1)' }
              }}
            >
              <IconPlus size={13} />
            </IconButton>
          </Tooltip>
          {!hasChildren && (
            <Tooltip title="Delete Position" placement="top" arrow>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDeletePosition(position); }}
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2',
                  color: '#dc2626',
                  width: 24, height: 24,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#dc2626', color: '#fff', transform: 'scale(1.1)' }
                }}
              >
                <IconTrash size={13} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      <Stack alignItems="center" spacing={1}>
        {isEmptySlot && (
          <Chip label="VACANT" color="default" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
        )}
        {isExited && (
          <Chip label="EXITED / INACTIVE" color="error" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
        )}

        {position.isCompanyNode ? (
          <Avatar
            src={position.companyLogo ? getCompanyImageUrl(position.companyLogo) : undefined}
            imgProps={{
              style: {
                objectFit: 'contain',
                imageRendering: '-webkit-optimize-contrast'
              }
            }}
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'primary.main',
              border: `2px solid ${theme.palette.primary.light}`,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              p: position.companyLogo ? 0.5 : 0
            }}
          >
            <IconSitemap size={30} color="#ffffff" />
          </Avatar>
        ) : fields.showPhoto && !isEmptySlot && (
          <Tooltip
            title={
              <Box sx={{ p: 0.5, textAlign: 'center' }}>
                {position.photo ? (
                  <img src={getUserImageUrl(position.photo)} alt="Profile" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '4px', filter: isExited ? 'grayscale(100%)' : 'none', imageRendering: '-webkit-optimize-contrast' }} />
                ) : (
                  <Avatar sx={{ width: 100, height: 100, fontSize: '3rem', margin: '0 auto', bgcolor: isExited ? theme.palette.grey[500] : theme.palette.primary.main }}>
                    {position.firstName ? position.firstName[0].toUpperCase() : (position.employeeName ? position.employeeName[0].toUpperCase() : '?')}
                  </Avatar>
                )}
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: '#fff' }}>
                  {position.firstName || position.employeeName || ''}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {position.designationId || position.positionTitle || ''}
                </Typography>
              </Box>
            }
            placement="top"
            arrow
            componentsProps={{
              tooltip: {
                sx: { bgcolor: 'rgba(0,0,0,0.85)', p: 1 }
              }
            }}
          >
            <Avatar
              src={position.photo ? getUserImageUrl(position.photo) : undefined}
              imgProps={{
                style: {
                  objectFit: 'cover',
                  imageRendering: '-webkit-optimize-contrast',
                  transform: 'translateZ(0)'
                }
              }}
              sx={{
                width: 52,
                height: 52,
                border: `2px solid ${isExited ? theme.palette.error.main : theme.palette.background.default}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                bgcolor: isExited ? 'error.main' : 'primary.main',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                filter: isExited ? 'grayscale(100%)' : 'none'
              }}
            >
              {position.firstName ? position.firstName[0].toUpperCase() : (position.employeeName ? position.employeeName[0].toUpperCase() : '?')}
            </Avatar>
          </Tooltip>
        )}

        <Box textAlign="center" width="100%">
          <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.2, mb: 0.5, wordWrap: 'break-word', color: position.isCompanyNode ? 'primary.main' : (isEmptySlot ? 'text.secondary' : isExited ? 'error.main' : 'text.primary'), textDecoration: isExited ? 'line-through' : 'none' }}>
            {position.isCompanyNode ? position.positionTitle : (isEmptySlot ? position.positionTitle : `${position.firstName || ''} ${position.lastName || ''}`.trim() || position.employeeName || 'Unknown')}
          </Typography>

          {fields.showDesignation && !isEmptySlot && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.1 }}>
              {position.designationId || position.positionTitle || '-'}
            </Typography>
          )}

          {fields.showDepartment && position.departmentName && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.1, fontStyle: 'italic' }}>
              {position.departmentName}
            </Typography>
          )}

          {fields.showCode && !isEmptySlot && (
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: isExited ? 'text.secondary' : 'primary.main', fontWeight: 600, mt: 0.5, display: 'block' }}>
              {position.empCode || '-'}
            </Typography>
          )}

          {/* Joint / Matrix Reporting Managers Tag */}
          {position.secondaryParentTitles && position.secondaryParentTitles.length > 0 && (
            <Tooltip
              title={`Joint / Matrix Reporting to: ${position.secondaryParentTitles.join(', ')}`}
              arrow
              placement="top"
              PopperProps={{
                style: { pointerEvents: 'none' }
              }}
            >
              <Box
                onClick={(e) => { e.stopPropagation(); onManageReporting && onManageReporting(position); }}
                sx={{
                  mt: 0.6,
                  px: 0.7,
                  py: 0.3,
                  borderRadius: '6px',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                  border: '1px dashed #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.4,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.25)' : '#dbeafe',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <IconArrowsJoin2 size={11} color="#2563eb" />
                <Typography
                  sx={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: '#2563eb',
                    lineHeight: 1.1,
                    textAlign: 'center',
                    whiteSpace: 'normal',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  Joint: {position.secondaryParentTitles.join(', ')}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>

        {hasChildren && (
          <IconButton
            size="small"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); toggleCollapse(position.id); }}
            sx={{
              position: 'absolute',
              bottom: -13,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
              border: `1.5px solid ${theme.palette.primary.main}`,
              color: 'primary.main',
              boxShadow: '0 3px 8px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'primary.main',
                color: '#ffffff',
                transform: 'translateX(-50%) scale(1.15)',
                boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
              },
              width: 24, height: 24,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {isCollapsed ? <IconChevronDown size={15} /> : <IconChevronUp size={15} />}
          </IconButton>
        )}
      </Stack>
    </Card>
  );
};


// ─── Main Component ────────────────────────────────────────────────────────
export default function OrganizationChart() {
  const theme = useTheme();

  // Data State
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]); // For assignment dropdown
  const [loading, setLoading] = useState(true);

  // View State
  const [zoom, setZoom] = useState(1);
  const [rootPositionId, setRootPositionId] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  const [fields, setFields] = useState({
    showPhoto: true,
    showDesignation: true,
    showDepartment: false,
    showCode: true,
    showExited: true
  });

  const [anchorEl, setAnchorEl] = useState(null);

  // Drag and Drop
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOverNodeId, setDragOverNodeId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, source: null, target: null });

  // Add Position State
  const [addPosDialog, setAddPosDialog] = useState({ open: false, parentNode: null, positionTitle: '', departmentId: '', selectedEmployee: null });

  // Assign Employee State
  const [assignDialog, setAssignDialog] = useState({ open: false, position: null, selectedEmployee: null });
  const [reportingDialog, setReportingDialog] = useState({ open: false, position: null, primaryParent: null, secondaryParents: [] });
  const [clearConfirmDialog, setClearConfirmDialog] = useState({ open: false });
  const [isSyncing, setIsSyncing] = useState(false);

  const [companyInfo, setCompanyInfo] = useState(null);

  const { departments = [], designations = [], levels = [], designationLevels = [] } = useLookups(['DEPARTMENTS', 'DESIGNATIONS', 'LEVELS', 'DESIGNATION_LEVELS']);

  const finalLevels = levels.length > 0 ? levels : designationLevels;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [posRes, empRes, compRes] = await Promise.all([
        axios.get('/api/master/hr/positions/tree').catch(() => ({ data: [] })),
        axios.get('/api/master/hr/employees/list').catch(() => axios.get('/api/master/hr/employees')),
        axios.get('/api/company-profile/all').catch(() => ({ data: [] }))
      ]);

      const posData = Array.isArray(posRes.data) ? posRes.data : [];
      const empData = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
      const compList = Array.isArray(compRes.data) ? compRes.data : [];
      const activeComp = compList.find(c => c.companyName) || compList[0] || null;

      setPositions(posData);
      setEmployees(empData);
      if (activeComp) setCompanyInfo(activeComp);
    } catch (error) {
      console.error('Failed to fetch org chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to filter tree
  const filterTree = (nodes, deptId, rootId) => {
    if (!nodes) return [];

    // If root is selected, find it and return it as the only root
    if (rootId) {
      const findNode = (list) => {
        for (let n of list) {
          if (n.id === rootId) return n;
          if (n.children) {
            const found = findNode(n.children);
            if (found) return found;
          }
        }
        return null;
      };
      const foundRoot = findNode(nodes);
      return foundRoot ? [foundRoot] : [];
    }

    return nodes;
  };

  const treeData = useMemo(() => {
    if (!positions || positions.length === 0) return null;

    // Filter exited nodes if toggle is off
    const filterExited = (nodes) => {
      if (fields.showExited) return nodes;
      return nodes
        .filter(n => !n.isExited)
        .map(n => ({ ...n, children: filterExited(n.children || []) }));
    };

    let roots = filterTree(filterExited(positions), selectedDeptId, rootPositionId);

    if (roots.length === 0) return null;

    const cName = companyInfo?.companyName || 'Company Hierarchy';
    const cLogo = companyInfo?.logoFileName;

    return {
      id: 'company-root',
      isCompanyNode: true,
      positionTitle: cName,
      employeeName: cName,
      companyLogo: cLogo,
      assignedEmployeeId: 'ROOT', // not null, so it doesn't show as vacant
      children: roots
    };
  }, [positions, rootPositionId, selectedDeptId, fields.showExited, companyInfo]);

  // Flatten tree for the autocomplete and joint lines calculation
  const flatPositions = useMemo(() => {
    const flat = [];
    if (!treeData) return flat;
    const traverse = (node) => {
      if (!node) return;
      if (!node.isCompanyNode) flat.push(node);
      if (node.children) node.children.forEach(c => traverse(c));
    };
    traverse(treeData);
    return flat;
  }, [treeData]);

  const activeEmpList = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    return employees.filter(r => {
      const isAtsDraft = r.fromWhere === 'ATS' && !r.empCode;
      const isExited = Boolean(r.exitDate || r.isExited || r.resignationDate || r.status === 13 || r.status === '13' || r.status === 'Inactive' || r.status === 'EXITED');
      return !isAtsDraft && !isExited && Boolean(r.empCode || r.oldEmpCode || r.employeeName || r.firstName);
    });
  }, [employees]);

  const unassignedEmployees = activeEmpList;

  // ─── Pan & Zoom — 100% ref-based, zero React re-render during interaction ─
  const panContainerRef = React.useRef(null);
  const canvasInnerRef = React.useRef(null);
  const zoomRef = React.useRef(zoom);
  const panRef = React.useRef({ x: 0, y: 0 });
  const isPanning = React.useRef(false);
  const panStart = React.useRef({ x: 0, y: 0 });

  // Apply transform directly to DOM — crisp HD rendering
  const applyTransform = (px, py, z) => {
    if (canvasInnerRef.current) {
      canvasInnerRef.current.style.transform =
        `translate3d(${px}px, ${py}px, 0) scale(${z})`;
    }
  };

  const commitZoom = (newZ) => {
    zoomRef.current = newZ;
    setZoom(newZ); // for joint lines recalc only
    applyTransform(panRef.current.x, panRef.current.y, newZ);
  };

  const handleZoomIn = () => commitZoom(Math.min(zoomRef.current + 0.1, 2.5));
  const handleZoomOut = () => commitZoom(Math.max(zoomRef.current - 0.1, 0.2));
  const handleResetZoom = () => {
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    setZoom(1);
    applyTransform(0, 0, 1);
  };

  const handlePanMouseDown = (e) => {
    if (e.button !== 0) return;
    // Allow pan on background — block only interactive card elements
    if (e.target.closest('button, .MuiButtonBase-root, input, select, textarea')) return;
    isPanning.current = true;
    panStart.current = {
      x: e.clientX - panRef.current.x,
      y: e.clientY - panRef.current.y
    };
    if (panContainerRef.current) panContainerRef.current.style.cursor = 'grabbing';
  };

  const handlePanMouseMove = (e) => {
    if (!isPanning.current) return;
    panRef.current = {
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y
    };
    applyTransform(panRef.current.x, panRef.current.y, zoomRef.current);
  };

  const handlePanMouseUp = () => {
    if (!isPanning.current) return;
    isPanning.current = false;
    if (panContainerRef.current) panContainerRef.current.style.cursor = 'grab';
  };

  // Native wheel listener — zoom-to-cursor point
  useEffect(() => {
    const el = panContainerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const oldZ = zoomRef.current;
      const nz = Math.min(Math.max(oldZ - e.deltaY * 0.001, 0.2), 2.5);

      // Cursor position relative to container
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Zoom-to-cursor: adjust pan so the point under the cursor stays fixed
      // Formula: newPan = cursor - (cursor - oldPan) * (newZ / oldZ)
      const scale = nz / oldZ;
      panRef.current = {
        x: mx - (mx - panRef.current.x) * scale,
        y: my - (my - panRef.current.y) * scale
      };

      zoomRef.current = nz;
      setZoom(nz); // for SVG joint lines recalc only
      applyTransform(panRef.current.x, panRef.current.y, nz);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep canvasInnerRef transform in sync whenever treeData changes (e.g. after collapse)
  useEffect(() => {
    applyTransform(panRef.current.x, panRef.current.y, zoomRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeData]);

  const toggleCollapse = (id) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleDragStart = (e, position) => {
    setDraggedNode(position);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetPosition) => {
    e.preventDefault();
    setDragOverNodeId(null);
    if (!draggedNode || targetPosition.id === draggedNode.id) return;

    setConfirmDialog({ open: true, source: draggedNode, target: targetPosition });
    setDraggedNode(null);
  };

  const confirmManagerChange = async () => {
    const { source, target } = confirmDialog;
    setConfirmDialog({ open: false, source: null, target: null });

    try {
      setLoading(true);
      const parentId = (target.isCompanyNode || target.id === 'company-root') ? null : target.id;
      await axios.put(`/api/master/hr/positions/${source.id}`, {
        positionTitle: source.positionTitle,
        departmentId: source.departmentId,
        parentPositionId: parentId,
        secondaryParentIds: source.secondaryParentIds || null
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to update position hierarchy', error);
      alert('Failed to update structure.');
      setLoading(false);
    }
  };

  const handleOpenAddPosition = (parentNode) => {
    setAddPosDialog({
      open: true,
      parentNode,
      positionTitle: '',
      departmentId: parentNode.departmentId || '',
      selectedEmployee: null
    });
  };

  const confirmAddPosition = async () => {
    const { parentNode, positionTitle, departmentId, selectedEmployee } = addPosDialog;
    if (!positionTitle) return;

    setAddPosDialog({ open: false, parentNode: null, positionTitle: '', departmentId: '', selectedEmployee: null });

    try {
      setLoading(true);
      const parentId = parentNode.isCompanyNode ? null : parentNode.id;
      const res = await axios.post('/api/master/hr/positions', {
        positionTitle,
        departmentId,
        parentPositionId: parentId,
        status: 'Active'
      });
      if (selectedEmployee) {
        await axios.post('/api/master/hr/positions/assign', {
          positionId: res.data.id,
          employeeId: selectedEmployee.id
        });
      }
      await fetchData();
    } catch (error) {
      console.error('Failed to create position', error);
      alert('Failed to create position.');
      setLoading(false);
    }
  };

  const confirmClearAll = async () => {
    setClearConfirmDialog({ open: false });
    try {
      setLoading(true);
      await axios.delete('/api/master/hr/positions/clear-all');
      await fetchData();
    } catch (error) {
      console.error('Failed to clear positions', error);
      alert('Failed to clear organization structure.');
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isSyncing) {
      setIsSyncing(true);
      try {
        await axios.post('/api/master/hr/positions/migrate');
        await fetchData();
      } catch (error) {
        alert(error.response?.data || 'Failed to sync');
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const confirmAssignEmployee = async () => {
    const { position, selectedEmployee } = assignDialog;
    if (!selectedEmployee) return;

    setAssignDialog({ open: false, position: null, selectedEmployee: null });

    try {
      setLoading(true);
      await axios.post('/api/master/hr/positions/assign', {
        positionId: position.id,
        employeeId: selectedEmployee.id
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to assign employee', error);
      alert('Failed to assign employee.');
      setLoading(false);
    }
  };

  const handleUnassignEmployee = async (position) => {
    if (!window.confirm(`Are you sure you want to unassign the employee from ${position.positionTitle}?`)) return;
    try {
      setLoading(true);
      await axios.post('/api/master/hr/positions/unassign', { positionId: position.id });
      await fetchData();
    } catch (error) {
      console.error('Failed to unassign', error);
      alert('Failed to unassign employee.');
      setLoading(false);
    }
  };

  const handleDeletePosition = async (position) => {
    if (!window.confirm(`Are you sure you want to delete the position: ${position.positionTitle}?`)) return;
    try {
      setLoading(true);
      await axios.delete(`/api/master/hr/positions/${position.id}`);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete position', error);
      alert(error.response?.data || 'Failed to delete position.');
      setLoading(false);
    }
  };

  const handleOpenManageReporting = (position) => {
    const primary = position.parentPositionId ? (flatPositions.find(p => String(p.id) === String(position.parentPositionId)) || null) : { id: 'ROOT', positionTitle: `[Company Root] ${companyInfo?.companyName || ''}` };
    let secondary = [];
    if (position.secondaryParentIds) {
      const sIds = position.secondaryParentIds.split(',').map(s => s.trim());
      secondary = flatPositions.filter(p => sIds.includes(String(p.id)));
    }
    setReportingDialog({
      open: true,
      position,
      primaryParent: primary,
      secondaryParents: secondary
    });
  };

  const confirmSaveReporting = async () => {
    const { position, primaryParent, secondaryParents } = reportingDialog;
    if (!position) return;

    setReportingDialog({ open: false, position: null, primaryParent: null, secondaryParents: [] });
    try {
      setLoading(true);
      const secIds = (secondaryParents || []).map(s => s.id).join(',');
      const parentId = (primaryParent && primaryParent.id !== 'ROOT') ? primaryParent.id : null;
      await axios.put(`/api/master/hr/positions/${position.id}`, {
        positionTitle: position.positionTitle,
        departmentId: position.departmentId,
        parentPositionId: parentId,
        secondaryParentIds: secIds || null
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to update reporting line', error);
      alert('Failed to update reporting line: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());
  const canvasRef = React.useRef(null);
  const [jointLines, setJointLines] = useState([]);

  const calculateJointLines = React.useCallback(() => {
    if (!canvasInnerRef.current || !treeData) return;
    const rect = canvasInnerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const currentZoom = zoomRef.current || zoom || 1;
    const paths = [];

    flatPositions.forEach(child => {
      const rawSec = child.secondaryParentIds;
      if (!rawSec) return;
      if (collapsedNodes.has(child.id)) return;
      if (!fields.showExited && child.isExited) return;

      const childEl = document.getElementById(`org-node-${child.id}`);
      if (!childEl) return;
      const cRect = childEl.getBoundingClientRect();
      if (!cRect.width || !cRect.height) return;

      const cx = ((cRect.left + cRect.right) / 2 - rect.left) / currentZoom;
      const cy = (cRect.top - rect.top) / currentZoom;

      // Safe parse secondary parent IDs (handles String, Array, or Number)
      let sIds = [];
      if (Array.isArray(rawSec)) {
        sIds = rawSec.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof rawSec === 'string') {
        sIds = rawSec.split(',').map(s => s.trim()).filter(Boolean);
      } else if (rawSec) {
        sIds = [String(rawSec).trim()];
      }

      sIds.forEach((pId, idx) => {
        // Skip if secondary parent is same as primary parent
        if (String(pId) === String(child.parentPositionId)) return;

        const pEl = document.getElementById(`org-node-${pId}`);
        if (!pEl) return;
        const pRect2 = pEl.getBoundingClientRect();
        if (!pRect2.width || !pRect2.height) return;

        const px = ((pRect2.left + pRect2.right) / 2 - rect.left) / currentZoom;
        const py = (pRect2.bottom - rect.top) / currentZoom;

        if (isNaN(px) || isNaN(py) || isNaN(cx) || isNaN(cy)) return;

        // L-shaped routing: DOWN → ACROSS → DOWN
        const turnY = py + (cy - py) * 0.65;
        const d = `M ${px} ${py} L ${px} ${turnY} L ${cx} ${turnY} L ${cx} ${cy}`;

        paths.push({
          id: `sec-${pId}-${child.id}-${idx}`,
          d,
          px,
          py
        });
      });
    });

    setJointLines(paths);
  }, [flatPositions, treeData, zoom, collapsedNodes, fields.showExited]);

  useEffect(() => {
    // Run immediately and at staggered intervals to guarantee DOM readiness after image loads & layout passes
    calculateJointLines();
    const t1 = setTimeout(calculateJointLines, 50);
    const t2 = setTimeout(calculateJointLines, 200);
    const t3 = setTimeout(calculateJointLines, 600);

    window.addEventListener('resize', calculateJointLines);

    // Attach ResizeObserver to canvasInnerRef to auto-recalculate on any layout/card size shifts
    let ro = null;
    if (canvasInnerRef.current && window.ResizeObserver) {
      ro = new ResizeObserver(() => {
        calculateJointLines();
      });
      ro.observe(canvasInnerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', calculateJointLines);
      if (ro) ro.disconnect();
    };
  }, [calculateJointLines, positions, treeData, zoom, collapsedNodes, fields]);


  const handleNodeMouseEnter = (pos) => {
    if (!pos) return;
    const ids = new Set([pos.id]);
    if (pos.parentPositionId) ids.add(pos.parentPositionId);
    if (pos.secondaryParentIds) {
      pos.secondaryParentIds.split(',').map(s => s.trim()).forEach(id => {
        if (id) ids.add(isNaN(id) ? id : Number(id));
      });
    }
    setHighlightedNodeIds(ids);
  };

  const handleNodeMouseLeave = () => {
    setHighlightedNodeIds(new Set());
  };

  // ─── Render Helpers ──────────────────────────────────────────────────────
  const renderTreeNodes = (node) => {
    if (collapsedNodes.has(node.id)) return null;

    return node.children?.map(child => {
      const hasChildren = child.children && child.children.length > 0 && !collapsedNodes.has(child.id);
      const isHighlighted = highlightedNodeIds.has(child.id);
      const label = (
        <Box
          id={`org-node-${child.id}`}
          onMouseEnter={() => handleNodeMouseEnter(child)}
          onMouseLeave={handleNodeMouseLeave}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedNode && draggedNode.id !== child.id && !child.isCompanyNode) {
              setDragOverNodeId(child.id);
            }
          }}
          onDragLeave={() => setDragOverNodeId(null)}
        >
          <StyledNode
            position={child}
            theme={theme}
            isRoot={false}
            isHighlighted={isHighlighted}
            fields={fields}
            collapsedNodes={collapsedNodes}
            toggleCollapse={toggleCollapse}
            handleDragStart={handleDragStart}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            isDraggingTarget={dragOverNodeId === child.id}
            onAddPosition={handleOpenAddPosition}
            onAssignEmployee={(pos) => setAssignDialog({ open: true, position: pos, selectedEmployee: null })}
            onUnassignEmployee={handleUnassignEmployee}
            onDeletePosition={handleDeletePosition}
            onManageReporting={handleOpenManageReporting}
          />
        </Box>
      );

      if (!hasChildren) {
        return <TreeNode key={child.id} label={label} />;
      }

      return (
        <TreeNode key={child.id} label={label}>
          {renderTreeNodes(child)}
        </TreeNode>
      );
    });
  };

  return (
    <MainCard
      icon={IconSitemap}
      title={"Organization Chart"}
      sx={{
        height: 'calc(100vh - 145px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      contentSX={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
        p: 0,
        '&:last-child': { pb: 0 }
      }}
      secondary={
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="nowrap">
          <Autocomplete
            size="small"
            sx={{ minWidth: 170, width: 190 }}
            options={flatPositions}
            getOptionLabel={(opt) => `${opt.positionTitle || ''} - ${opt.employeeName || 'Vacant'}`}
            value={flatPositions.find(p => String(p.id) === String(rootPositionId)) || null}
            onChange={(e, val) => setRootPositionId(val ? val.id : null)}
            renderInput={(params) => <TextField {...params} label="Select Root" size="small" />}
          />
          <Button
            size="small"
            variant="contained"
            color="secondary"
            startIcon={isSyncing ? <CircularProgress size={14} color="inherit" /> : <IconRefresh size={15} />}
            onClick={handleSync}
            disabled={isSyncing || loading}
            sx={{ whiteSpace: 'nowrap', textTransform: 'none', px: 1.5, py: 0.6, fontSize: '0.78rem' }}
          >
            {isSyncing ? 'Syncing...' : 'Sync From Employee Master'}
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<IconTrash size={15} />}
            onClick={() => setClearConfirmDialog({ open: true })}
            disabled={isSyncing || loading}
            sx={{ whiteSpace: 'nowrap', textTransform: 'none', px: 1.5, py: 0.6, fontSize: '0.78rem' }}
          >
            Clear All
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<IconPlus size={15} />}
            onClick={() => handleOpenAddPosition({ isCompanyNode: true })}
            sx={{ whiteSpace: 'nowrap', textTransform: 'none', px: 1.5, py: 0.6, fontSize: '0.78rem' }}
          >
            Add Root Position
          </Button>
          <Tooltip title="View Settings">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" color="primary" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, p: 0.6 }}>
              <IconSettings size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} size="small" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, p: 0.6 }}>
              <IconZoomOut size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <IconButton onClick={handleResetZoom} size="small" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, p: 0.6 }}>
              <IconFocus2 size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} size="small" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, p: 0.6 }}>
              <IconZoomIn size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      }

    >
      <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1}>Display Fields</Typography>
          <FormGroup>
            <FormControlLabel control={<Checkbox size="small" checked={fields.showPhoto} onChange={(e) => setFields({ ...fields, showPhoto: e.target.checked })} />} label="Photo" />
            <FormControlLabel control={<Checkbox size="small" checked={fields.showDesignation} onChange={(e) => setFields({ ...fields, showDesignation: e.target.checked })} />} label="Designation" />
            <FormControlLabel control={<Checkbox size="small" checked={fields.showDepartment} onChange={(e) => setFields({ ...fields, showDepartment: e.target.checked })} />} label="Department" />
            <FormControlLabel control={<Checkbox size="small" checked={fields.showCode} onChange={(e) => setFields({ ...fields, showCode: e.target.checked })} />} label="Employee Code" />
            <FormControlLabel control={<Checkbox size="small" checked={fields.showExited} onChange={(e) => setFields({ ...fields, showExited: e.target.checked })} />} label="Show Exited / Inactive" />
          </FormGroup>
          <Box mt={2} textAlign="right">
            <Button size="small" onClick={() => { setCollapsedNodes(new Set()); setAnchorEl(null); }}>Expand All</Button>
          </Box>
        </Box>
      </Popover>

      {/* Confirmation Dialogs */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, source: null, target: null })}>
        <DialogTitle>Restructure Organization</DialogTitle>
        <DialogContent>
          <Typography>
            Move <b>{confirmDialog.source?.positionTitle || confirmDialog.source?.employeeName}</b> to report under <b>{confirmDialog.target?.positionTitle || confirmDialog.target?.employeeName}</b>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, source: null, target: null })}>Cancel</Button>
          <Button variant="contained" onClick={confirmManagerChange}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addPosDialog.open} onClose={() => setAddPosDialog({ open: false, parentNode: null, positionTitle: '', departmentId: '', selectedEmployee: null })} fullWidth maxWidth="sm">
        <DialogTitle>Create Vacant Position</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>Reporting to: {addPosDialog.parentNode?.positionTitle || addPosDialog.parentNode?.employeeName}</Typography>
          <Stack spacing={2}>
            <TextField fullWidth label="Position Title" value={addPosDialog.positionTitle} onChange={(e) => setAddPosDialog(p => ({ ...p, positionTitle: e.target.value }))} autoFocus />
            <Autocomplete
              options={departments}
              getOptionLabel={(opt) => opt.departmentName || ''}
              value={departments.find(d => String(d.id) === String(addPosDialog.departmentId)) || null}
              onChange={(e, val) => setAddPosDialog(p => ({ ...p, departmentId: val ? val.id : '' }))}
              renderInput={(params) => <TextField {...params} label="Department (Optional)" />}
            />
            <Autocomplete
              options={unassignedEmployees}
              getOptionLabel={(opt) => {
                if (!opt) return '';
                const code = opt.empCode || opt.oldEmpCode || '';
                const name = opt.employeeName || `${opt.firstName || ''} ${opt.lastName || ''}`.trim();
                return code ? `${code} - ${name}` : name;
              }}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              value={addPosDialog.selectedEmployee || null}
              onChange={(e, val) => setAddPosDialog(p => ({ ...p, selectedEmployee: val }))}
              renderInput={(params) => <TextField {...params} label="Assign Employee (Optional)" placeholder="Search employee..." />}
              renderOption={(props, opt) => {
                const desig = designations.find(d => String(d.id) === String(opt.designationId))?.designationName || '';
                const dept = departments.find(d => String(d.id) === String(opt.departmentId))?.departmentName || '';
                const level = finalLevels.find(l => String(l.id || l.rowId) === String(opt.empLevelId));
                const levelName = level ? (level.levelName || level.level || '') : '';
                return (
                  <Box component="li" {...props} key={opt.id}>
                    <Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {opt.empCode || opt.oldEmpCode || ''} - {opt.employeeName || opt.firstName || ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[levelName, desig, dept].filter(Boolean).join(' | ')}
                      </Typography>
                    </Stack>
                  </Box>
                );
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPosDialog({ open: false, parentNode: null, positionTitle: '', departmentId: '', selectedEmployee: null })}>Cancel</Button>
          <Button variant="contained" onClick={confirmAddPosition} disabled={!addPosDialog.positionTitle}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={clearConfirmDialog.open} onClose={() => setClearConfirmDialog({ open: false })}>
        <DialogTitle sx={{ color: 'error.main' }}>Clear Organization Structure?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the entire organization structure? This will remove all positions and employee mappings from the chart. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearConfirmDialog({ open: false })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmClearAll}>Delete All</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false, position: null, selectedEmployee: null })} fullWidth maxWidth="sm">
        <DialogTitle>Assign Employee to {assignDialog.position?.positionTitle}</DialogTitle>
        <DialogContent>
          <Autocomplete
            sx={{ mt: 1 }}
            fullWidth
            options={activeEmpList}
            getOptionLabel={(opt) => {
              if (!opt) return '';
              const code = opt.empCode || opt.oldEmpCode || '';
              const name = opt.employeeName || `${opt.firstName || ''} ${opt.lastName || ''}`.trim();
              return code ? `${code} - ${name}` : name;
            }}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={assignDialog.selectedEmployee || null}
            onChange={(e, val) => setAssignDialog(prev => ({ ...prev, selectedEmployee: val }))}
            renderInput={(params) => <TextField {...params} label="Select Employee" variant="outlined" autoFocus />}
            renderOption={(props, opt) => {
              const desig = designations.find(d => String(d.id) === String(opt.designationId))?.designationName || '';
              const dept = departments.find(d => String(d.id) === String(opt.departmentId))?.departmentName || '';
              const level = finalLevels.find(l => String(l.id || l.rowId) === String(opt.empLevelId));
              const levelName = level ? (level.levelName || level.level || '') : '';
              return (
                <Box component="li" {...props} key={opt.id}>
                  <Stack>
                    <Typography variant="body2" fontWeight={600}>
                      {opt.empCode || opt.oldEmpCode || ''} - {opt.employeeName || opt.firstName || ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[levelName, desig, dept].filter(Boolean).join(' | ')}
                    </Typography>
                  </Stack>
                </Box>
              );
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog({ open: false, position: null, selectedEmployee: null })}>Cancel</Button>
          <Button variant="contained" onClick={confirmAssignEmployee} disabled={!assignDialog.selectedEmployee}>Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Configure Reporting Line (Matrix / Multiple Roots) Dialog */}
      <Dialog
        open={reportingDialog.open}
        onClose={() => setReportingDialog({ open: false, position: null, primaryParent: null, secondaryParents: [] })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconArrowsJoin2 size={20} color="#2563eb" />
          Manage Reporting Line (Matrix / Multi-Root)
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, mt: 1, color: 'text.secondary' }}>
            Position: <b>{reportingDialog.position?.positionTitle}</b> {reportingDialog.position?.employeeName && reportingDialog.position?.employeeName !== 'Vacant' ? `(${reportingDialog.position?.employeeName})` : ''}
          </Typography>
          <Stack spacing={2.5}>
            <Autocomplete
              options={[
                { id: 'ROOT', positionTitle: `[Company Root] ${companyInfo?.companyName || 'Top Level'}` },
                ...flatPositions.filter(p => p.id !== reportingDialog.position?.id)
              ]}
              getOptionLabel={(opt) => {
                if (!opt) return '';
                const emp = opt.employeeName && opt.employeeName !== 'Vacant' ? ` - ${opt.employeeName}` : '';
                return `${opt.positionTitle}${emp}`;
              }}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              value={reportingDialog.primaryParent}
              onChange={(e, val) => setReportingDialog(p => ({ ...p, primaryParent: val }))}
              renderInput={(params) => <TextField {...params} label="Primary Reporting Manager (Hierarchy Line)" placeholder="Select primary manager..." />}
            />
            <Autocomplete
              multiple
              options={flatPositions.filter(p => p.id !== reportingDialog.position?.id && p.id !== reportingDialog.primaryParent?.id)}
              getOptionLabel={(opt) => {
                if (!opt) return '';
                const emp = opt.employeeName && opt.employeeName !== 'Vacant' ? ` - ${opt.employeeName}` : '';
                return `${opt.positionTitle}${emp}`;
              }}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              value={reportingDialog.secondaryParents}
              onChange={(e, val) => setReportingDialog(p => ({ ...p, secondaryParents: val }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Additional / Joint Reporting Managers (Dotted-Line / Matrix)"
                  placeholder="Select additional managers (e.g. Directors, Functional Heads)..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.employeeName && option.employeeName !== 'Vacant' ? `${option.positionTitle} (${option.employeeName})` : option.positionTitle}
                    size="small"
                    sx={{ bgcolor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontWeight: 600 }}
                  />
                ))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportingDialog({ open: false, position: null, primaryParent: null, secondaryParents: [] })}>Cancel</Button>
          <Button variant="contained" onClick={confirmSaveReporting}>Save Reporting Line</Button>
        </DialogActions>
      </Dialog>

      {/* Chart Canvas */}
      <Box
        ref={panContainerRef}
        onMouseDown={handlePanMouseDown}
        onMouseMove={handlePanMouseMove}
        onMouseUp={handlePanMouseUp}
        onMouseLeave={handlePanMouseUp}
        sx={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'grab',
          userSelect: 'none',
          backgroundImage: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle, #334155 1px, transparent 1px)'
            : 'radial-gradient(circle, #CBD5E1 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
          bgcolor: theme.palette.mode === 'dark' ? '#0F172A' : '#F1F5F9',
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%"><CircularProgress /></Box>
        ) : !treeData ? (
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" gap={2}>
            <Typography variant="h3" fontWeight={800} color="primary.main">Company Hierarchy</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button size="small" variant="outlined" startIcon={<IconPlus size={16} />} onClick={() => handleOpenAddPosition({ isCompanyNode: true })}>Add Root Position</Button>
              <Button size="small" variant="contained" color="secondary" startIcon={isSyncing ? <CircularProgress size={16} color="inherit" /> : <IconRefresh size={16} />} onClick={handleSync} disabled={isSyncing || loading}>
                {isSyncing ? 'Syncing...' : 'Sync from Employee Master'}
              </Button>
              <Button size="small" variant="contained" color="error" startIcon={<IconTrash size={16} />} onClick={() => setClearConfirmDialog({ open: true })} disabled={isSyncing || loading}>
                Clear All
              </Button>
            </Stack>
          </Box>
        ) : (
          <div
            ref={canvasInnerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transformOrigin: '0 0',
              padding: '60px 80px',
              cursor: 'inherit',
              WebkitFontSmoothing: 'antialiased'
            }}
          >
            {jointLines.length > 0 && (
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 8, overflow: 'visible' }}>
                <defs>
                  <marker id="sec-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
                  </marker>
                </defs>
                {jointLines.map(line => (
                  <g key={line.id}>
                    <circle cx={line.px} cy={line.py} r="4" fill="#2563eb" />
                    <path
                      d={line.d}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.2"
                      strokeDasharray="6 4"
                      strokeLinecap="round"
                      markerEnd="url(#sec-arrow)"
                    />
                  </g>
                ))}
              </svg>
            )}
            <Tree lineWidth={'2px'} lineHeight={'32px'} lineColor={theme.palette.mode === 'dark' ? '#334155' : '#CBD5E1'} lineBorderRadius={'4px'} label={
              <Box id={`org-node-${treeData.id}`} onMouseEnter={() => handleNodeMouseEnter(treeData)} onMouseLeave={handleNodeMouseLeave}>
                <StyledNode
                  position={treeData}
                  theme={theme}
                  isRoot={true}
                  isHighlighted={highlightedNodeIds.has(treeData.id)}
                  fields={fields}
                  collapsedNodes={collapsedNodes}
                  toggleCollapse={toggleCollapse}
                  handleDragStart={handleDragStart}
                  handleDrop={handleDrop}
                  handleDragOver={handleDragOver}
                  isDraggingTarget={dragOverNodeId === treeData.id}
                  onAddPosition={handleOpenAddPosition}
                  onAssignEmployee={(pos) => setAssignDialog({ open: true, position: pos, selectedEmployee: null })}
                  onUnassignEmployee={handleUnassignEmployee}
                  onDeletePosition={handleDeletePosition}
                  onManageReporting={handleOpenManageReporting}
                />
              </Box>
            }>
              {renderTreeNodes(treeData)}
            </Tree>
          </div>
        )}
      </Box>
    </MainCard>
  );
}
