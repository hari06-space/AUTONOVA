import TextField from 'ui-component/CustomTextField';
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid, MenuItem, Button, Checkbox, Stack, IconButton, Tooltip, useTheme, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, Fade, TablePagination, alpha, CircularProgress, Pagination, Autocomplete, Popover } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import {
  IconDeviceFloppy,
  IconUser,
  IconCheck,
  IconX,
  IconCopy,
  IconLayoutGrid,
  IconAdjustmentsHorizontal
} from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig, resetFilters } from 'store/slices/search';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

import { getUserImageUrl } from 'utils/upload-helper';
import { showAppAlert } from 'utils/alert';
import useAuth from 'hooks/useAuth';

const userAccessSearchConfig = [
  { id: 'module', label: 'Module', type: 'text', placeholder: 'Search Module...', isStarred: true },
  { id: 'subModule', label: 'Submodule', type: 'text', placeholder: 'Search Submodule...' },
  { id: 'pageName', label: 'Page Name', type: 'text', placeholder: 'Search Page Name...', isStarred: true },
  { id: 'pageCode', label: 'Page Code', type: 'text', placeholder: 'Search Page Code...' }
];

const UserAccess = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { mode, systemMode } = useColorScheme();
  const computedMode = mode === 'system' ? systemMode : mode;
  const isDark = computedMode === 'dark';

  const perms = usePagePermissions(PAGE_CODES.AD_USER_ACCESS);
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [targetUsers, setTargetUsers] = useState([]);
  const [authData, setAuthData] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchQuery = useSelector((state) => state.search.query);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [globalMaxResult, setGlobalMaxResult] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchUsers();
    dispatch(setFilterConfig(userAccessSearchConfig));
    dispatch(resetFilters());
    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
    };
  }, [dispatch]);

  // Reset pagination when searching or changing user
  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users/all');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const fetchAuthData = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/user-page-auth/${userId}`);
      setAuthData(res.data);
    } catch (error) {
      console.error('Failed to fetch auth data', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to fetch authorization data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e) => {
    const userId = e.target.value;
    const u = users.find(user => user.userId === userId);
    if (currentUser?.userLevel !== 5 && u?.userLevel === 5) {
      dispatch(openSnackbar({ open: true, message: 'Admins cannot view or modify Boss Admin permissions', variant: 'alert', severity: 'warning' }));
      return;
    }
    setSelectedUser(userId);
    fetchAuthData(userId);
    if (u?.userLevel === 5) {
      dispatch(openSnackbar({
        open: true,
        message: 'Global Administrator permissions are permanently locked to active to prevent console lockout.',
        variant: 'alert',
        severity: 'info',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      }));
    }
  };

  const handleCheckboxChange = (idx, field) => {
    const newData = [...authData];
    newData[idx][field] = newData[idx][field] === 1 ? 0 : 1;
    setAuthData(newData);
  };

  const handleSelectAll = (field, checked) => {
    const newData = authData.map(item => ({ ...item, [field]: checked ? 1 : 0 }));
    setAuthData(newData);
  };

  const isAllChecked = (field) => authData.length > 0 && authData.every(item => item[field] === 1);
  const isSomeChecked = (field) => authData.some(item => item[field] === 1) && !isAllChecked(field);

  // Row-wise Selection Helpers
  const isRowAllChecked = (row) => {
    return permissionHeaders.every(h => row[h.id] === 1);
  };

  const isRowSomeChecked = (row) => {
    return permissionHeaders.some(h => row[h.id] === 1) && !isRowAllChecked(row);
  };

  const handleRowSelectAll = (globalIdx, checked) => {
    const newData = [...authData];
    permissionHeaders.forEach(h => {
      newData[globalIdx][h.id] = checked ? 1 : 0;
    });
    setAuthData(newData);
  };

  const isGlobalAllChecked = () => authData.length > 0 && authData.every(item => permissionHeaders.every(h => item[h.id] === 1));
  const isGlobalSomeChecked = () => authData.some(item => permissionHeaders.some(h => item[h.id] === 1)) && !isGlobalAllChecked();

  const handleGlobalSelectAll = (checked) => {
    const newData = authData.map(item => {
      const updated = { ...item };
      permissionHeaders.forEach(h => {
        updated[h.id] = checked ? 1 : 0;
      });
      return updated;
    });
    setAuthData(newData);
  };


  const handleSaveAll = async () => {
    if (!selectedUser) return;
    try {
      await axios.post('/api/user-page-auth/save-all', authData);
      dispatch(openSnackbar({ open: true, message: 'All authorization matrix modifications saved successfully', variant: 'alert', severity: 'success' }));
    } catch (error) {
      console.error('Save failed', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to save authorization matrix', variant: 'alert', severity: 'error' }));
    }
  };

  const handleSaveRow = async (row) => {
    try {
      await axios.post('/api/user-page-auth/save-all', [row]);
      dispatch(openSnackbar({ open: true, message: `Successfully saved access for ${row.page?.pageName}`, variant: 'alert', severity: 'success' }));
    } catch (error) {
      console.error('Row save failed', error);
      dispatch(openSnackbar({ open: true, message: `Failed to save access for ${row.page?.pageName}`, variant: 'alert', severity: 'error' }));
    }
  };

  // Copy Permissions Logic
  const handleCopyPermissions = async () => {
    if (!selectedUser || targetUsers.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'Please select target users to copy permissions to', variant: 'alert', severity: 'warning' }));
      return;
    }
    setLoading(true);
    try {
      let copyPayload = [];
      targetUsers.forEach(tUser => {
        const userCopy = authData.map(item => ({
          ...item,
          id: null,
          userId: tUser
        }));
        copyPayload = copyPayload.concat(userCopy);
      });

      await axios.post('/api/user-page-auth/save-all', copyPayload);
      dispatch(openSnackbar({ open: true, message: `Successfully copied and saved permissions to ${targetUsers.length} user(s)`, variant: 'alert', severity: 'success' }));
      setTargetUsers([]); // clear selection
    } catch (error) {
      console.error('Copy failed', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to copy permissions', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useKeyboardShortcuts({
    'ctrl+s': () => {
      if (selectedUser) handleSaveAll();
    }
  });

  const showAdminLockedAlert = () => {
    showAppAlert('Warning: This is a Global Administrator (SuperUser) account. All permissions are permanently locked to active to prevent accidental console lockout.', 'warning');
  };

  // filteredData: search-filtered only (used for total count in header)
  const filteredData = useMemo(() => {
    if (!Array.isArray(authData)) return [];
    return authData.filter(item => {
      const query = (searchQuery || '').toLowerCase();
      const pageNameMatch = item.page?.pageName?.toLowerCase()?.includes(query) || false;
      const moduleNameMatch = item.page?.module?.modName?.toLowerCase()?.includes(query) || false;
      const subModuleNameMatch = item.page?.subModule?.subModName?.toLowerCase()?.includes(query) || false;
      const pageCodeMatch = item.page?.pageCode?.toLowerCase()?.includes(query) || false;
      return pageNameMatch || moduleNameMatch || subModuleNameMatch || pageCodeMatch;
    });
  }, [authData, searchQuery]);

  // cappedData: filteredData further capped by the optional "Display Cap" input
  const cappedData = useMemo(() => {
    if (globalMaxResult && !isNaN(parseInt(globalMaxResult, 10))) {
      const limit = parseInt(globalMaxResult, 10);
      if (limit > 0) return filteredData.slice(0, limit);
    }
    return filteredData;
  }, [filteredData, globalMaxResult]);

  const paginatedData = useMemo(() => cappedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [cappedData, page, rowsPerPage]);

  const permissionHeaders = [
    { id: 'enable', label: 'Enable', color: '#2196f3' },
    { id: 'readAcs', label: 'Read', color: '#4caf50' },
    { id: 'write', label: 'Write', color: '#ffc107' },
    { id: 'deleteAcs', label: 'Delete', color: '#f44336' },
    { id: 'export', label: 'Export', color: '#673ab7' },
    { id: 'approval', label: 'Approval', color: '#00bcd4' },
    { id: 'manager', label: 'Manager', color: '#78909c' },
    { id: 'additional1', label: 'Add 1', color: '#b0bec5' },
    { id: 'additional2', label: 'Add 2', color: '#b0bec5' },
    { id: 'addTaskEnable', label: 'Dashboard', color: '#6e16a9' }
  ];

  const allColumns = useMemo(() => [
    { id: 'index', label: '#' },
    { id: 'module', label: 'Module / Submodule' },
    { id: 'pageName', label: 'Page Name' },
    { id: 'all', label: 'All' },
    ...permissionHeaders,
    { id: 'updatedBy', label: 'Updated By' },
    { id: 'updatedDate', label: 'Updated Date' },
    { id: 'action', label: 'Action' }
  ], [permissionHeaders]);

  const defaultVisibleIds = ['index', 'module', 'pageName', 'all', 'enable', 'readAcs', 'write', 'deleteAcs', 'export', 'approval', 'manager', 'additional1', 'additional2', 'addTaskEnable', 'action'];
  const [activeVisibleIds, setActiveVisibleIds] = useState(defaultVisibleIds);

  const handleToggleColumn = (id) => setActiveVisibleIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const handleSelectAllColumns = () => setActiveVisibleIds(allColumns.map(c => c.id));
  const handleResetColumns = () => setActiveVisibleIds(defaultVisibleIds);

  const PermissionHeaderCell = ({ header }) => (
    <TableCell align="center" sx={{
      p: 0,
      minWidth: 85,
      bgcolor: isDark ? '#1e293b' : alpha(header.color, 0.02),
      borderTop: `3px solid ${header.color}`,
      borderBottom: `1px solid ${isDark ? theme.palette.divider : alpha(header.color, 0.2)}`,
      height: 60
    }}>
      <Stack direction="column" alignItems="center" sx={{ py: 1 }}>
        <Checkbox
          size="small"
          checked={isAllChecked(header.id)}
          indeterminate={isSomeChecked(header.id)}
          disabled={!perms.write}
          onChange={(e) => {
            if (selectedUserInfo?.userLevel === 5) {
              showAdminLockedAlert();
              return;
            }
            if (perms.write) {
              handleSelectAll(header.id, e.target.checked);
            }
          }}
          sx={{ color: header.color, '&.Mui-checked': { color: header.color }, '&.MuiCheckbox-indeterminate': { color: header.color }, p: 0.2 }}
        />
        <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? theme.palette.text.secondary : '#333', fontSize: '0.6rem', textTransform: 'uppercase' }}>{header.label}</Typography>
      </Stack>
    </TableCell>
  );

  const selectedUserInfo = useMemo(() => users.find(u => u.userId === selectedUser), [users, selectedUser]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 175px)', gap: 1.5, overflow: 'hidden' }}>
      {/* ── HEADER SECTION ── */}
      <Box sx={{
        bgcolor: 'background.paper',
        p: { xs: '12px 16px', sm: '12px 20px' },
        borderRadius: '12px',
        border: '1px solid',
        borderColor: theme.palette.divider,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 1.5, sm: 2 },
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
      }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={selectedUserInfo?.imgName ? getUserImageUrl(selectedUserInfo.imgName) : ''}
            sx={{ width: 50, height: 50, border: '1px solid', borderColor: theme.palette.divider }}
          >
            {!selectedUserInfo?.imgName && <IconUser size={26} color="#ccc" />}
          </Avatar>
          <Box sx={{ mr: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>User Access</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>GRANULAR CONTROL</Typography>
          </Box>

          <Autocomplete
            size="small"
            options={users}
            getOptionLabel={(option) => {
              if (typeof option === 'string') {
                return option;
              }
              return option?.userId || '';
            }}
            value={users.find(u => u.userId === selectedUser) || null}
            onChange={(e, newValue) => {
              if (newValue) {
                handleUserChange({ target: { value: newValue.userId } });
              } else {
                setSelectedUser('');
                setAuthData([]);
              }
            }}
            filterOptions={(options, state) => {
              const query = (state.inputValue || '').toLowerCase();
              return options.filter(u => 
                String(u.userId || '').toLowerCase().includes(query) ||
                String(u.empId || '').toLowerCase().includes(query) ||
                String(u.firstName || '').toLowerCase().includes(query) ||
                String(u.lastName || '').toLowerCase().includes(query)
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="User Name"
                sx={{
                  width: 220,
                  '& .MuiOutlinedInput-root': { borderRadius: '8px', '& fieldset': { borderColor: '#2196f3 !important' } },
                  '& .MuiInputLabel-root': { color: '#2196f3', fontWeight: 800, fontSize: '0.75rem' }
                }}
              />
            )}
            renderOption={(props, option) => (
              <MenuItem {...props} key={option.userId} value={option.userId}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar src={option.imgName ? getUserImageUrl(option.imgName) : ''} sx={{ width: 24, height: 24 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{option.userId}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Emp ID: {option.empId || 'N/A'} {option.firstName ? `| ${option.firstName} ${option.lastName || ''}` : ''}
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
            )}
          />
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            startIcon={<IconDeviceFloppy size={20} />}
            onClick={() => {
              if (selectedUserInfo?.userLevel === 5) {
                showAdminLockedAlert();
                return;
              }
              handleSaveAll();
            }}
            disabled={!selectedUser || !perms.write}
            sx={{ height: 38, borderRadius: '8px', bgcolor: '#673ab7', '&:hover': { bgcolor: '#5e35b1' }, px: 3, fontWeight: 700, boxShadow: 'none' }}
          >
            Save
          </Button>
          <Autocomplete
            multiple
            size="small"
            options={users.filter(u => u.userId !== selectedUser).map(u => u.userId)}
            value={targetUsers}
            onChange={(e, newValue) => setTargetUsers(newValue)}
            disabled={!selectedUser}
            disableCloseOnSelect
            filterOptions={(options, state) => {
              const query = (state.inputValue || '').toLowerCase();
              return options.filter(userId => {
                const u = users.find(user => user.userId === userId);
                if (!u) return false;
                return (
                  String(u.userId || '').toLowerCase().includes(query) ||
                  String(u.empId || '').toLowerCase().includes(query) ||
                  String(u.firstName || '').toLowerCase().includes(query) ||
                  String(u.lastName || '').toLowerCase().includes(query)
                );
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Copy To Users"
                placeholder="Select users"
                sx={{
                  width: 300,
                  '& .MuiOutlinedInput-root': { borderRadius: '8px', '& fieldset': { borderColor: '#2196f3 !important' } },
                  '& .MuiInputLabel-root': { color: '#2196f3', fontWeight: 800, fontSize: '0.75rem' }
                }}
              />
            )}
            renderOption={(props, option, { selected }) => {
              const u = users.find(user => user.userId === option);
              return (
                <MenuItem {...props} key={option} value={option}>
                  <Checkbox size="small" checked={selected} sx={{ mr: 1, p: 0.5 }} />
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={u?.imgName ? getUserImageUrl(u?.imgName) : ''} sx={{ width: 24, height: 24 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{option}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Emp ID: {u?.empId || 'N/A'} {u?.firstName ? `| ${u.firstName} ${u?.lastName || ''}` : ''}
                      </Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              );
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Box key={option} sx={{ display: 'flex', alignItems: 'center', bgcolor: 'primary.lighter', borderRadius: '4px', px: 1, py: 0.2, mr: 0.5, my: 0.2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>{option}</Typography>
                  <IconButton size="small" onClick={() => {
                    const newValues = [...value];
                    newValues.splice(index, 1);
                    setTargetUsers(newValues);
                  }} sx={{ p: 0, ml: 0.5, color: 'primary.main' }}>
                    <IconX size={12} />
                  </IconButton>
                </Box>
              ))
            }
          />

          <Button
            variant="outlined"
            startIcon={<IconCopy size={18} />}
            onClick={() => {
              if (selectedUserInfo?.userLevel === 5) {
                showAdminLockedAlert();
                return;
              }
              handleCopyPermissions();
            }}
            disabled={!selectedUser || targetUsers.length === 0 || !perms.write}
            sx={{ height: 38, borderRadius: '8px', color: '#2196f3', borderColor: '#2196f3', textTransform: 'none', fontWeight: 700, minWidth: '130px' }}
          >
            Copy & Save
          </Button>


        </Stack>
      </Box>

      {/* ── TABLE SECTION ── */}
      <Fade in={Boolean(selectedUser)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, gap: 1.5 }}>
          {selectedUserInfo?.userLevel === 5 && (
            <Box sx={{
              p: '12px 20px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: alpha(theme.palette.info.main, 0.4),
              bgcolor: isDark ? alpha(theme.palette.info.main, 0.08) : alpha(theme.palette.info.main, 0.03),
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexShrink: 0
            }}>
              <Typography variant="body2" sx={{ color: theme.palette.info.main, fontWeight: 700, fontSize: '0.82rem' }}>
                ℹ️ Global Administrator (SuperUser): This user has global Administrator status. All permissions are permanently locked to checked to prevent locking out console access.
              </Typography>
            </Box>
          )}
          <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: theme.palette.divider,
            bgcolor: 'background.paper',
            minHeight: 0
          }}>
            {/* Sub-toolbar inside Table Card for local search bar */}
            <Box sx={{
              p: '12px 16px',
              borderBottom: '1px solid',
              borderColor: theme.palette.divider,
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.default',
              flexShrink: 0
            }}>
              <Typography variant="subtitle1" fontWeight={700} color={theme.palette.text.primary}>
                Authorization Matrix ({filteredData.length} Rows{cappedData.length < filteredData.length ? ` — Displaying ${cappedData.length}` : ''})
              </Typography>
            </Box>

            <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {activeVisibleIds.includes('index') && <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default', color: 'text.secondary', fontSize: '0.65rem', py: 2, width: 40 }}>#</TableCell>}
                    {activeVisibleIds.includes('module') && <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default', color: 'text.primary', fontSize: '0.65rem', py: 2 }}>Module / Submodule</TableCell>}
                    {activeVisibleIds.includes('pageName') && <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default', color: 'text.primary', fontSize: '0.65rem', py: 2 }}>Page Name</TableCell>}
                    {activeVisibleIds.includes('all') && <TableCell align="center" sx={{ bgcolor: 'background.default', py: 1, width: 60, borderBottom: `1px solid ${isDark ? theme.palette.divider : alpha('#ffb300', 0.2)}` }}>
                      <Stack direction="column" alignItems="center">
                        <Checkbox 
                          size="small" 
                          checked={isGlobalAllChecked()} 
                          indeterminate={isGlobalSomeChecked()}
                          disabled={!perms.write}
                          onChange={(e) => {
                            if (selectedUserInfo?.userLevel === 5) {
                              showAdminLockedAlert();
                              return;
                            }
                            if (perms.write) {
                              handleGlobalSelectAll(e.target.checked);
                            }
                          }}
                          sx={{ color: '#ffb300', '&.Mui-checked': { color: '#ffb300' }, '&.MuiCheckbox-indeterminate': { color: '#ffb300' }, p: 0.2 }} 
                        />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? theme.palette.text.secondary : '#333', fontSize: '0.6rem', textTransform: 'uppercase' }}>All</Typography>
                      </Stack>
                    </TableCell>}
                    {permissionHeaders.map(h => activeVisibleIds.includes(h.id) ? <PermissionHeaderCell key={h.id} header={h} /> : null)}
                    {activeVisibleIds.includes('updatedBy') && <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default', color: 'text.primary', fontSize: '0.65rem', py: 2 }}>Updated By</TableCell>}
                    {activeVisibleIds.includes('updatedDate') && <TableCell sx={{ fontWeight: 800, bgcolor: 'background.default', color: 'text.primary', fontSize: '0.65rem', py: 2 }}>Updated Date</TableCell>}
                    {activeVisibleIds.includes('action') && <TableCell align="center" sx={{ fontWeight: 800, bgcolor: 'background.default', color: 'text.primary', fontSize: '0.65rem', py: 2 }}>Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={14} align="center" sx={{ py: 10 }}>
                        <CircularProgress size={30} sx={{ color: '#2196f3' }} />
                        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>Retrieving Authorization Matrix...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} align="center" sx={{ py: 10 }}>
                        <Typography variant="h5" color="textSecondary">No access rules found matching search criteria</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, idx) => {
                      const globalIdx = authData.findIndex(item => item.pageId === row.pageId);
                      return (
                        <TableRow
                          key={row.pageId}
                          sx={{
                            '& td': { py: 1.2, borderBottom: '1px solid', borderBottomColor: theme.palette.divider },
                            '&:hover': { bgcolor: isDark ? '#334155 !important' : '#f1f5f9 !important' },
                            bgcolor: idx % 2 === 0 ? ('background.paper') : (isDark ? '#1e293b' : '#f9fbff')
                          }}
                        >
                          {activeVisibleIds.includes('index') && <TableCell sx={{ fontWeight: 700, color: isDark ? theme.palette.text.secondary : '#d1d5db', fontSize: '0.7rem' }}>{page * rowsPerPage + idx + 1}</TableCell>}
                          {activeVisibleIds.includes('module') && (
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.75rem', lineHeight: 1.2 }}>{row.page?.module?.modName}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.6rem' }}>{row.page?.subModule?.subModName}</Typography>
                            </TableCell>
                          )}
                          {activeVisibleIds.includes('pageName') && (
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#2196f3', textTransform: 'uppercase', fontSize: '0.75rem', lineHeight: 1.2 }}>{row.page?.pageName}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? theme.palette.text.secondary : '#a6b0cf', fontSize: '0.6rem' }}>ID: {row.pageId} | {row.page?.pageCode}</Typography>
                            </TableCell>
                          )}

                          {activeVisibleIds.includes('all') && (
                            <TableCell align="center" sx={{ borderLeft: '1px solid', borderLeftColor: theme.palette.divider }}>
                              <Checkbox
                                size="small"
                                checked={isRowAllChecked(row)}
                                indeterminate={isRowSomeChecked(row)}
                                disabled={!perms.write}
                                onChange={(e) => {
                                  if (selectedUserInfo?.userLevel === 5) {
                                    showAdminLockedAlert();
                                    return;
                                  }
                                  if (perms.write) {
                                    handleRowSelectAll(globalIdx, e.target.checked);
                                  }
                                }}
                                sx={{ color: '#78909c', '&.Mui-checked': { color: '#4caf50' } }}
                              />
                            </TableCell>
                          )}

                          {permissionHeaders.map(h => (
                            activeVisibleIds.includes(h.id) ? (
                              <TableCell key={h.id} align="center" sx={{ borderLeft: '1px solid', borderLeftColor: theme.palette.divider }}>
                                <Checkbox
                                  checked={row[h.id] === 1}
                                  disabled={!perms.write}
                                  onChange={() => {
                                    if (selectedUserInfo?.userLevel === 5) {
                                      showAdminLockedAlert();
                                      return;
                                    }
                                    if (perms.write) {
                                      handleCheckboxChange(globalIdx, h.id);
                                    }
                                  }}
                                  icon={<IconX size={16} color={isDark ? '#475569' : '#e5e7eb'} />}
                                  checkedIcon={<IconCheck size={16} color="#4caf50" stroke={3} />}
                                  sx={{ p: 0.2 }}
                                />
                              </TableCell>
                            ) : null
                          ))}
                          {activeVisibleIds.includes('updatedBy') && (
                            <TableCell sx={{ borderLeft: '1px solid', borderLeftColor: theme.palette.divider, fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem' }}>
                              {row.updatedBy || '-'}
                            </TableCell>
                          )}
                          {activeVisibleIds.includes('updatedDate') && (
                            <TableCell sx={{ borderLeft: '1px solid', borderLeftColor: theme.palette.divider, color: 'text.secondary', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                              {row.updatedDate ? new Date(row.updatedDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                            </TableCell>
                          )}
                          {activeVisibleIds.includes('action') && (
                            <TableCell align="center" sx={{ borderLeft: '1px solid', borderLeftColor: theme.palette.divider }}>
                              {row.enable === 1 ? (
                                <Tooltip title="Save Permissions" arrow>
                                  <IconButton
                                    onClick={() => {
                                      if (selectedUserInfo?.userLevel === 5) {
                                        showAdminLockedAlert();
                                        return;
                                      }
                                      handleSaveRow(row);
                                    }}
                                    disabled={!perms.write}
                                    sx={{ bgcolor: alpha('#2196f3', 0.1), color: '#2196f3', borderRadius: '4px', p: 0.4, '&:hover': { bgcolor: '#2196f3', color: 'white' } }}
                                  >
                                    <IconDeviceFloppy size={18} />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Typography variant="caption" sx={{ color: isDark ? '#475569' : '#d1d5db', fontSize: '0.6rem', fontWeight: 600 }}>—</Typography>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    }))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{
              px: 1, minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              borderTop: '1px solid', borderColor: theme.palette.divider,
              bgcolor: 'background.default', flexShrink: 0
            }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mr: 1, fontSize: '0.875rem' }}>
                Rows per page:
              </Typography>
              <Autocomplete
                freeSolo
                disableClearable
                options={['100', '250', '500', 'All']}
                value={String(rowsPerPage)}
                onChange={(e, newValue) => {
                  if (newValue) {
                    if (newValue === 'All') { setRowsPerPage(9999); setPage(0); return; }
                    const val = parseInt(newValue, 10);
                    if (!isNaN(val) && val > 0) { setRowsPerPage(val); setPage(0); }
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    size="small"
                    sx={{
                      width: 85, mr: 2,
                      '& .MuiOutlinedInput-root': {
                        height: '34px', borderRadius: '8px', fontWeight: 600, bgcolor: 'background.paper',
                        '& fieldset': { borderColor: 'divider' },
                        '&:hover fieldset': { borderColor: 'primary.main' },
                        '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '2px' }
                      },
                      '& .MuiInputBase-input': { textAlign: 'center', color: 'primary.main', fontWeight: 700 }
                    }}
                  />
                )}
              />

              <TablePagination
                rowsPerPageOptions={[]}
                labelRowsPerPage=""
                labelDisplayedRows={({ from, to, count }) => `Showing ${from} to ${to} of ${count !== -1 ? count : `more than ${to}`}`}
                component="div"
                count={cappedData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                sx={{
                  border: 'none', overflow: 'hidden',
                  '& .MuiTablePagination-displayedRows': {
                    fontWeight: 700, color: 'primary.main', bgcolor: isDark ? alpha(theme.palette.primary.main, 0.1) : 'primary.lighter',
                    px: 1.5, py: 0.5, borderRadius: '8px', border: '1px solid', borderColor: isDark ? alpha(theme.palette.primary.main, 0.2) : 'primary.light',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)', ml: 1, m: 0
                  },
                  '& .MuiTablePagination-toolbar': { p: 0, minHeight: '40px !important' },
                  '& .MuiTablePagination-actions': { display: 'none' }
                }}
              />

              <Pagination
                count={Math.max(0, Math.ceil(cappedData.length / rowsPerPage))}
                page={page + 1}
                onChange={(e, newPage) => setPage(newPage - 1)}
                showFirstButton
                showLastButton
                size="small"
                color="primary"
                shape="rounded"
                variant="outlined"
                sx={{
                  ml: 2.5,
                  '@keyframes flipHorizontal': {
                    '0%': { transform: 'perspective(400px) rotateY(0deg) scale(0.85)' },
                    '100%': { transform: 'perspective(400px) rotateY(360deg) scale(1.15)' }
                  },
                  '& .MuiPagination-ul': { alignItems: 'center' },
                  '& .MuiPaginationItem-root': {
                    fontWeight: 600, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  },
                  '& .MuiPaginationItem-page': { transform: 'scale(0.85)', opacity: 0.6, borderRadius: '6px' },
                  '& .MuiPaginationItem-page:hover': { opacity: 0.9, transform: 'scale(0.95)' },
                  '& .MuiPaginationItem-page.Mui-selected': {
                    backgroundColor: 'primary.main', color: '#fff', borderColor: 'primary.main', opacity: 1,
                    transform: 'scale(1.15)', margin: '0 6px', boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                    animation: 'flipHorizontal 0.5s ease-out',
                    '&:hover': { backgroundColor: 'primary.dark', transform: 'scale(1.15)' }
                  },
                  '& .MuiPaginationItem-previousNext': {
                    borderRadius: '50%', backgroundColor: 'transparent', color: 'primary.main', border: '1px solid', borderColor: 'primary.light',
                    '&:hover': { backgroundColor: isDark ? alpha(theme.palette.primary.main, 0.2) : 'primary.lighter' }
                  },
                  '& .MuiPaginationItem-firstLast': {
                    borderRadius: '50%', backgroundColor: 'transparent', color: 'text.secondary', border: '1px solid', borderColor: 'divider',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }
                }}
              />

              <TextField
                placeholder="Display Cap"
                variant="outlined"
                size="small"
                type="number"
                value={globalMaxResult}
                onChange={(e) => setGlobalMaxResult(e.target.value)}
                sx={{
                  width: 140, ml: 2, mr: 1,
                  '& .MuiOutlinedInput-root': {
                    height: '34px', borderRadius: '8px', fontWeight: 600, bgcolor: 'background.paper',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'primary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '2px' }
                  },
                  '& .MuiInputBase-input': { textAlign: 'center', color: 'primary.main', fontWeight: 700, '&::placeholder': { color: 'primary.main', fontWeight: 700, opacity: 1 } }
                }}
              />

              <Tooltip title="Toggle Columns">
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  size="small"
                  sx={{
                    ml: 0.5, mr: 0.5, p: 0.5,
                    color: Boolean(anchorEl) ? 'primary.main' : 'text.secondary',
                    bgcolor: Boolean(anchorEl) ? 'primary.lighter' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <IconAdjustmentsHorizontal size={18} />
                </IconButton>
              </Tooltip>
              <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                PaperProps={{
                  sx: { p: 2, width: 250, maxHeight: 360, boxShadow: '0px -8px 24px rgba(0, 0, 0, 0.12)', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Toggle Columns</Typography>
                  <Button size="small" onClick={handleSelectAllColumns} sx={{ textTransform: 'none', fontWeight: 600, p: 0 }}>Show All</Button>
                </Stack>
                <Box sx={{ overflowY: 'auto', flex: 1, py: 1, my: 1, pr: 0.5, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' } }}>
                  <Stack spacing={0.5}>
                    {allColumns.map((col) => {
                      const isRequired = col.id === 'index' || col.id === 'action';
                      return (
                        <Box key={col.id} onClick={() => { if (!isRequired) handleToggleColumn(col.id); }}
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, px: 1, borderRadius: '6px', cursor: isRequired ? 'default' : 'pointer', bgcolor: isRequired ? 'grey.50' : 'transparent', opacity: isRequired ? 0.7 : 1, '&:hover': { bgcolor: isRequired ? 'grey.50' : 'grey.100' } }}>
                          <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: isRequired ? 600 : 400 }}>{col.label}</Typography>
                          <Checkbox size="small" checked={activeVisibleIds.includes(col.id)} disabled={isRequired} onClick={(e) => e.stopPropagation()} onChange={() => handleToggleColumn(col.id)} sx={{ p: 0.5 }} />
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1, mt: 0.5, display: 'flex', justifyContent: 'center' }}>
                  <Button size="small" variant="text" onClick={handleResetColumns} sx={{ textTransform: 'none', fontWeight: 600, color: 'error.main', p: 0 }}>Reset to Default</Button>
                </Box>
              </Popover>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

export default UserAccess;
