import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Checkbox,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  TablePagination,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  IconDeviceFloppy,
  IconShieldLock,
  IconCheck,
  IconX
} from '@tabler/icons-react';

// project imports
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, resetFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { BOSDataTable } from 'ui-component/bos';

// Search Configuration for this page
const businessAuthSearchConfig = [
  { id: 'module', label: 'Module', type: 'text', placeholder: 'Search Module...', isStarred: true },
  { id: 'subModule', label: 'Submodule', type: 'text', placeholder: 'Search Submodule...' },
  { id: 'pageName', label: 'Page Name', type: 'text', placeholder: 'Search Page Name...', isStarred: true }
];

const BusinessAuthorization = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const perms = usePagePermissions(PAGE_CODES.AD_BUSINESS_AUTH);

  const [pageData, setPageData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get global search query and filters from Redux
  const searchQuery = useSelector((state) => state.search.query);
  const searchFilters = useSelector((state) => state.search.filters);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchPageData();
    // Set page-specific search filters
    dispatch(setFilterConfig(businessAuthSearchConfig));
    dispatch(resetFilters());

    return () => {
      // Clear filters on unmount
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
    };
  }, [dispatch]);

  // Reset page when search query or filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, searchFilters]);

  const fetchPageData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/bos-pages');
      setPageData(res.data);
    } catch (error) {
      console.error('Failed to fetch page data', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch page data',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (idx) => {
    const newData = [...pageData];
    newData[idx].enabled = newData[idx].enabled === 1 ? 0 : 1;
    setPageData(newData);
  };

  const handleEnableAll = (checked) => {
    const newData = pageData.map(item => ({
      ...item,
      enabled: checked ? 1 : 0
    }));
    setPageData(newData);
  };

  const isAllEnabled = pageData.length > 0 && pageData.every(item => item.enabled === 1);
  const isSomeEnabled = pageData.some(item => item.enabled === 1) && !isAllEnabled;

  const handleSaveAll = async () => {
    try {
      await axios.post('/api/bos-pages/save-all', pageData);
      dispatch(openSnackbar({
        open: true,
        message: 'Business authorizations saved successfully',
        variant: 'alert',
        severity: 'success'
      }));
    } catch (error) {
      console.error('Save failed', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to save authorizations',
        variant: 'alert',
        severity: 'error'
      }));
    }
  };

  const handleSaveRow = async (row) => {
    try {
      await axios.post('/api/bos-pages/save-all', [row]);
      dispatch(openSnackbar({
        open: true,
        message: `Saved status for ${row.pageName}`,
        variant: 'alert',
        severity: 'success'
      }));
    } catch (error) {
      console.error('Row save failed', error);
    }
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(pageData)) return [];

    return pageData.filter(item => {
      const query = (searchQuery || '').toLowerCase();

      // Global keyword search
      const matchesKeyword = (
        item.pageName?.toLowerCase().includes(query) ||
        item.pageId?.toString().includes(query) ||
        item.module?.modName?.toLowerCase().includes(query) ||
        item.module?.moduleId?.toString().includes(query) ||
        item.subModule?.subModName?.toLowerCase().includes(query) ||
        item.subModule?.subModId?.toString().includes(query) ||
        item.pageCode?.toLowerCase().includes(query)
      );

      // Advanced field filters
      const safeFilters = searchFilters || {};
      const moduleFilter = safeFilters.module?.toLowerCase() || '';
      const subModuleFilter = safeFilters.subModule?.toLowerCase() || '';
      const pageNameFilter = safeFilters.pageName?.toLowerCase() || '';

      const matchesModule = !moduleFilter || item.module?.modName?.toLowerCase().includes(moduleFilter);
      const matchesSubModule = !subModuleFilter || item.subModule?.subModName?.toLowerCase().includes(subModuleFilter);
      const matchesPageName = !pageNameFilter || item.pageName?.toLowerCase().includes(pageNameFilter);

      return matchesKeyword && matchesModule && matchesSubModule && matchesPageName;
    });
  }, [pageData, searchQuery, searchFilters]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = useMemo(() => {
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 145px)', gap: 1, overflow: 'hidden', width: "100%" }}>
      {/* ── HEADER SECTION ── */}
      <Box sx={{
        bgcolor: 'background.paper',
        p: '10px 24px',
        borderRadius: '12px',
        border: '1px solid #eef2f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        width: '100%'
      }}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar
            sx={{
              width: 50,
              height: 50,
              bgcolor: alpha(theme.palette.secondary.main, 0.08),
              color: theme.palette.secondary.main,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`
            }}
          >
            <IconShieldLock size={28} />
          </Avatar>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a223f', lineHeight: 1.2 }}>Business Authorization</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', fontSize: '0.65rem' }}>PAGE ENABLEMENT MATRIX</Typography>
          </Box>
        </Stack>

        {perms.write && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<IconDeviceFloppy size={18} />}
            onClick={handleSaveAll}
            disabled={pageData.length === 0}
            sx={{
              height: 40,
              borderRadius: '8px',
              bgcolor: theme.palette.secondary.main,
              '&:hover': { bgcolor: theme.palette.secondary.dark },
              px: 3,
              fontWeight: 700,
              boxShadow: 'none'
            }}
          >
            Save All Changes
          </Button>
        )}
      </Box>
      <Box sx={{
        bgcolor: 'background.paper',
        p: '10px 24px',
        borderRadius: '12px',
        border: '1px solid #eef2f6',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        width: '100%',
        minHeight: 0
      }}>



        {/* ── TABLE SECTION ── */}
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #eef2f6',
          bgcolor: 'background.paper',
          minHeight: 0
        }}>
          {(() => {
            const columns = [
              { id: 'index', label: '#', align: 'center' },
              {
                id: 'module',
                label: 'Module & Sub Module',
                render: (row) => (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#673ab7', textTransform: 'uppercase', fontSize: '0.7rem', lineHeight: 1.2 }}>
                      {row.module?.modName}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem' }}>
                      {row.subModule?.subModName || 'Main Module'}
                    </Typography>
                  </Box>
                )
              },
              {
                id: 'pageName',
                label: 'Page Identity',
                render: (row) => (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a223f', fontSize: '0.75rem', lineHeight: 1.2 }}>
                      {row.pageName}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#2196f3', fontSize: '0.65rem' }}>
                        ID: {row.pageId}
                      </Typography>
                      {row.pageCode && (
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem', bgcolor: '#f1f5f9', px: 0.5, borderRadius: '4px' }}>
                          {row.pageCode}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )
              },
              {
                id: 'enabled',
                align: 'center',
                label: (
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <Checkbox
                      size="small"
                      indeterminate={isSomeEnabled}
                      checked={isAllEnabled}
                      disabled={!perms.write}
                      onChange={(e) => perms.write && handleEnableAll(e.target.checked)}
                      sx={{ color: '#fff', '&.MuiCheckbox-indeterminate': { color: '#fff' }, '&.Mui-checked': { color: '#fff' }, p: 0 }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.65rem', color: '#fff' }}>Enable All</Typography>
                  </Stack>
                ),
                render: (row) => {
                  const globalIdx = pageData.findIndex(item => item.pageId === row.pageId);
                  return (
                    <Checkbox
                      checked={row.enabled === 1}
                      onChange={() => perms.write && handleCheckboxChange(globalIdx)}
                      disabled={!perms.write}
                      icon={<IconX size={18} color="#cbd5e1" />}
                      checkedIcon={<IconCheck size={18} color="#4caf50" />}
                      sx={{
                        p: 0,
                        transition: 'transform 0.1s',
                        '&:hover': { transform: 'scale(1.2)' },
                        '&.Mui-checked': { color: '#4caf50' }
                      }}
                    />
                  );
                }
              }
            ];

            const actionColumn = {
              render: (row) => (
                <Tooltip title="Commit Change" arrow>
                  <span>
                    <IconButton
                      onClick={() => handleSaveRow(row)}
                      disabled={!perms.write}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: theme.palette.primary.main,
                        borderRadius: '6px',
                        p: 0.5,
                        '&:hover': { bgcolor: theme.palette.primary.main, color: 'white' }
                      }}
                    >
                      <IconDeviceFloppy size={18} />
                    </IconButton>
                  </span>
                </Tooltip>
              )
            };

            return (
              <BOSDataTable
                columns={columns}
                data={filteredData}
                page={page}
                size={rowsPerPage}
                totalCount={filteredData.length}
                onPageChange={setPage}
                onSizeChange={(s) => { setRowsPerPage(s); setPage(0); }}
                showActions={true}
                actionColumn={actionColumn}
                loading={loading}
              />
            );
          })()}
        </Box>
      </Box>
    </Box>
  );
};

export default BusinessAuthorization;
