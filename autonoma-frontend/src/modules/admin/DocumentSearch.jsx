/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-02
 * Description: Intelligent Document Content Search Page with exact location indicators and secure viewer.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Stack,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';

// Assets & Icons
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Project imports
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

const MODULE_OPTIONS = ['ALL', 'PURCHASE', 'SALES', 'QMS', 'HR', 'ADMIN', 'NPD', 'MASTER'];
const DB_MODULE_OPTIONS = ['ALL', 'NPD', 'PURCHASE', 'SALES', 'HR', 'FINANCE', 'QMS'];
const FILE_TYPE_OPTIONS = ['ALL', 'PDF', 'XLSX', 'DOCX', 'IMAGE', 'TEXT'];

const MODULE_NAMES = {
  QMS: 'Quality Management System',
  HR: 'Human Resources (ATS & Payroll)',
  SALES: 'Sales & Marketing',
  PURCHASE: 'Planning & Purchase',
  NPD: 'New Product Development',
  ADMIN: 'Admin Hub',
  STORES: 'Stores & Logistics',
  PRODUCTION: 'Production & Operations',
  MASTER: 'Global Master Data'
};

const PAGE_NAMES = {
  QM1210: 'Audit Schedule',
  HA1110: 'Application Tracking System (ATS)',
  HA1430: 'Induction Criteria Master',
  SM1110: 'Enquiry & Order Management',
  AD1170: 'File Traceability Hub',
  AD1110: 'User Overview',
  DM1010: 'Document Content Search',
  PP1110: 'Purchase Order Master',
  NP1110: 'Product & BOM Master'
};

const DocumentSearch = () => {
  const theme = useTheme();
  const perms = usePagePermissions('DM1010');

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedFileType, setSelectedFileType] = useState('ALL');
  const [searchMode, setSearchMode] = useState('DOCUMENTS'); // 'DOCUMENTS' | 'DATABASE'
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);

  // Data States
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusMetrics, setStatusMetrics] = useState({
    indexedDocuments: 9,
    localIndexFiles: 9,
    localIndexRows: 11132,
    localIndexSizeBytes: 1753088
  });
  const [indexingPoc, setIndexingPoc] = useState(false);
  const [message, setMessage] = useState(null);

  // Viewer Modal States
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [docBlobUrl, setDocBlobUrl] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [highlightVisible, setHighlightVisible] = useState(true);
  const [highlightPulsing, setHighlightPulsing] = useState(true);
  const [viewMode, setViewMode] = useState('VISUAL'); // 'VISUAL' or 'NATIVE'
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchPagePreview = async (docId, pageNum, query, highlight = true) => {
    if (!docId) return;
    setPreviewLoading(true);
    try {
      const res = await axios.get(`/api/document-search/document/${docId}/preview-page`, {
        params: {
          page: pageNum,
          q: query,
          highlight: highlight
        }
      });
      if (res.data && (res.data.dataUrl || res.data.data)) {
        setPreviewData(res.data.data || res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch visual preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Auto-relax highlight pulse after 8 seconds
  useEffect(() => {
    if (viewerOpen) {
      setHighlightVisible(true);
      setHighlightPulsing(true);
      const timer = setTimeout(() => {
        setHighlightPulsing(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [viewerOpen, currentDoc]);

  // Fetch Index Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/document-search/status');
      if (res && res.data) {
        setStatusMetrics(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch document search status from backend:', err?.message || err);
    }
  }, []);

  // Execute Search
  const executeSearch = useCallback(async (queryStr, mod, type, pageNum, modeOverride = null) => {
    if (!queryStr || !queryStr.trim()) {
      setResults([]);
      setTotalMatches(0);
      setTotalPages(0);
      return;
    }

    const currentMode = modeOverride || searchMode;
    setLoading(true);
    setMessage(null);
    try {
      const endpoint = currentMode === 'DATABASE' ? '/api/document-search/database' : '/api/document-search';
      const params = currentMode === 'DATABASE'
        ? {
          q: queryStr.trim(),
          module: mod !== 'ALL' ? mod : undefined,
          page: pageNum,
          size: pageSize
        }
        : {
          q: queryStr.trim(),
          module: mod !== 'ALL' ? mod : undefined,
          fileType: type !== 'ALL' ? type : undefined,
          page: pageNum,
          size: pageSize
        };

      const res = await axios.get(endpoint, { params });

      if (res.data) {
        setResults(res.data.items || []);
        setTotalMatches(res.data.totalMatches || 0);
        setTotalPages(res.data.totalPages || 0);
        setActiveQuery(queryStr.trim());
      }
    } catch (err) {
      console.error(`${currentMode} search error:`, err);
      setMessage({
        type: 'error',
        text: `${currentMode === 'DATABASE' ? 'Database' : 'Document'} search failed. Please ensure the backend is running.`
      });
    } finally {
      setLoading(false);
    }
  }, [pageSize, searchMode]);

  // Initial load
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle manual search submit
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    executeSearch(searchQuery, selectedModule, selectedFileType, 0, searchMode);
  };

  // Handle clearing search query and resetting results
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setActiveQuery('');
    setResults([]);
    setTotalMatches(0);
    setTotalPages(0);
    setPage(0);
    setMessage(null);
  }, []);

  // Handle live search input change (clears results if emptied)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val || !val.trim()) {
      setActiveQuery('');
      setResults([]);
      setTotalMatches(0);
      setTotalPages(0);
      setPage(0);
      setMessage(null);
    }
  };

  // Handle Mode Switch
  const handleModeChange = (event, nextMode) => {
    if (nextMode && nextMode !== searchMode) {
      setSearchMode(nextMode);
      setResults([]);
      setTotalMatches(0);
      setTotalPages(0);
      setSelectedModule('ALL');
      if (searchQuery.trim()) {
        executeSearch(searchQuery, 'ALL', selectedFileType, 0, nextMode);
      }
    }
  };

  // Filter change handlers
  const handleModuleChange = (mod) => {
    setSelectedModule(mod);
    setPage(0);
    if (activeQuery) {
      executeSearch(activeQuery, mod, selectedFileType, 0, searchMode);
    }
  };

  const handleFileTypeChange = (type) => {
    setSelectedFileType(type);
    setPage(0);
    if (activeQuery) {
      executeSearch(activeQuery, selectedModule, type, 0, searchMode);
    }
  };

  const handlePageChange = (event, newPage) => {
    const pIdx = newPage - 1;
    setPage(pIdx);
    executeSearch(activeQuery, selectedModule, selectedFileType, pIdx, searchMode);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Trigger Manual Indexing
  const handleRunPocIndex = async () => {
    setIndexingPoc(true);
    setMessage({ type: 'info', text: 'Synchronizing attachments and indexing pending documents...' });
    try {
      const res = await axios.post('/api/document-search/poc-index');
      if (res.data) {
        const msg = res.data.message || `Indexing complete! ${res.data.successfullyIndexed} of ${res.data.totalDiscovered} files indexed successfully.`;
        setMessage({
          type: 'success',
          text: msg
        });
        fetchStatus();
      }
    } catch (err) {
      console.error('Manual index error:', err);
      setMessage({ type: 'error', text: 'Indexing request failed. Check server logs.' });
    } finally {
      setIndexingPoc(false);
    }
  };

  const isImageFileType = (type) => ['IMAGE', 'JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'TIFF', 'WEBP'].includes((type || '').toUpperCase());

  // Open Document in Secure Viewer
  const handleOpenViewer = async (item) => {
    setCurrentDoc(item);
    setViewerOpen(true);
    setDocLoading(true);
    setDocBlobUrl('');
    setHighlightVisible(true);
    setHighlightPulsing(true);
    setViewMode('VISUAL');
    setZoomLevel(1);
    const targetPage = item.pageNumber || 1;
    setPreviewPage(targetPage);
    setPreviewData(null);

    // Fetch visual highlight preview with yellow marker + red box
    fetchPagePreview(item.documentId, targetPage, activeQuery, true);

    try {
      const res = await axios.get(item.viewUrl, { responseType: 'blob' });
      const type = (item.fileType || '').toUpperCase();
      let mime = 'application/octet-stream';
      if (type === 'PDF') mime = 'application/pdf';
      else if (['JPG', 'JPEG'].includes(type)) mime = 'image/jpeg';
      else if (type === 'PNG') mime = 'image/png';
      else if (type === 'GIF') mime = 'image/gif';
      else if (type === 'BMP') mime = 'image/bmp';
      else if (type === 'WEBP') mime = 'image/webp';
      else if (res.data.type) mime = res.data.type;

      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      setDocBlobUrl(url);
    } catch (err) {
      console.warn('Failed to fetch document blob, fallback to direct URL:', err?.message || err);
      setDocBlobUrl(item.viewUrl);
    } finally {
      setDocLoading(false);
    }
  };

  const handlePageChangeViewer = (newPage) => {
    setPreviewPage(newPage);
    if (currentDoc) {
      fetchPagePreview(currentDoc.documentId, newPage, activeQuery, highlightVisible);
    }
  };

  const handleToggleHighlight = () => {
    const nextVal = !highlightVisible;
    setHighlightVisible(nextVal);
    if (nextVal) setHighlightPulsing(true);
    if (currentDoc) {
      fetchPagePreview(currentDoc.documentId, previewPage, activeQuery, nextVal);
    }
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    if (docBlobUrl && docBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(docBlobUrl);
    }
    setDocBlobUrl('');
    setPreviewData(null);
  };

  // Render Icon according to file format
  const renderFileIcon = (fileType, size = 28) => {
    const type = (fileType || '').toUpperCase();
    if (isImageFileType(type)) {
      return <ImageIcon sx={{ color: '#8E24AA', fontSize: size }} />;
    }
    switch (type) {
      case 'PDF':
        return <PictureAsPdfIcon sx={{ color: '#E53935', fontSize: size }} />;
      case 'XLSX':
      case 'XLS':
        return <TableViewIcon sx={{ color: '#2E7D32', fontSize: size }} />;
      case 'DOCX':
      case 'DOC':
        return <DescriptionIcon sx={{ color: '#1976D2', fontSize: size }} />;
      default:
        return <TextSnippetIcon sx={{ color: '#F57C00', fontSize: size }} />;
    }
  };

  return (
    <MainCard
      title="Intelligent Document Content Search"
      secondary={
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Refresh Status">
            <IconButton onClick={fetchStatus} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRunPocIndex}
            disabled={indexingPoc}
            startIcon={indexingPoc ? <CircularProgress size={16} /> : <AutoStoriesIcon />}
          >
            {indexingPoc ? 'Indexing Documents...' : 'Sync & Index Files'}
          </Button>
        </Stack>
      }
    >
      {/* Top Header Bar: Metrics on Left, Filters on Right */}
      <Box
        sx={{
          mb: 2.5,
          p: 2,
          bgcolor: alpha(theme.palette.primary.light, 0.12),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
        }}
      >
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
          {/* Left: 4 Metric Items */}
          <Grid item xs={12} lg={6} sx={{ width: { xs: '100%', lg: '47%' } }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                  Indexed Documents
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.3 }}>
                  {statusMetrics?.indexedDocuments || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                  Searchable Index Content
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main', mt: 0.3 }}>
                  {statusMetrics?.localIndexRows || 0} items
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                  Physical Files in Index
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.3 }}>
                  {statusMetrics?.localIndexFiles || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                  Index Storage Size
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.3 }}>
                  {((statusMetrics?.localIndexSizeBytes || 0) / 1024).toFixed(1)} KB
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Right: Module & File Type Filter Pills */}
          <Grid item xs={12} lg={6} sx={{ width: { xs: '100%', lg: '47%' } }}>
            <Stack spacing={1} sx={{ pl: { lg: 2 }, borderLeft: { lg: `1px solid ${alpha(theme.palette.divider, 0.8)}` } }}>
              {/* Module Filter Row */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="caption" sx={{ minWidth: 65, fontWeight: 700, color: 'text.secondary' }}>
                  Module:
                </Typography>
                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                  {(searchMode === 'DATABASE' ? DB_MODULE_OPTIONS : MODULE_OPTIONS).map((mod) => (
                    <Chip
                      key={mod}
                      label={mod}
                      size="small"
                      clickable
                      color={selectedModule === mod ? 'primary' : 'default'}
                      variant={selectedModule === mod ? 'filled' : 'outlined'}
                      onClick={() => handleModuleChange(mod)}
                      sx={{
                        height: 24,
                        fontSize: '0.72rem',
                        fontWeight: selectedModule === mod ? 700 : 500
                      }}
                    />
                  ))}
                </Stack>
              </Stack>

              {/* File Type Filter Row */}
              {searchMode === 'DOCUMENTS' && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 65, fontWeight: 700, color: 'text.secondary' }}>
                    File Type:
                  </Typography>
                  <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                    {FILE_TYPE_OPTIONS.map((type) => (
                      <Chip
                        key={type}
                        label={type}
                        size="small"
                        clickable
                        color={selectedFileType === type ? 'error' : 'default'}
                        variant={selectedFileType === type ? 'filled' : 'outlined'}
                        onClick={() => handleFileTypeChange(type)}
                        sx={{
                          height: 24,
                          fontSize: '0.72rem',
                          fontWeight: selectedFileType === type ? 700 : 500
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Alerts */}
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Search Mode Switch (Document Content vs Database Tables) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <ToggleButtonGroup
          value={searchMode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            p: 0.5,
            borderRadius: 2.5,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: 2,
              px: 2.5,
              py: 0.8,
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'none',
              gap: 1,
              color: 'text.secondary',
              '&.Mui-selected': {
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                boxShadow: '0 2px 8px rgba(33, 150, 243, 0.35)',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark
                }
              }
            }
          }}
        >
          <ToggleButton value="DOCUMENTS">
            <DescriptionIcon sx={{ fontSize: 18 }} />
            Document Content Search (Files)
          </ToggleButton>
          <ToggleButton value="DATABASE">
            <StorageIcon sx={{ fontSize: 18 }} />
            Database Tables Search (All ERP Tables)
          </ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {searchMode === 'DATABASE'
            ? '🔍 Searching across ERP database tables (Products, Orders, Ledgers, Employees, Assets)'
            : '📄 Searching inside uploaded document content (PDF, Word, Excel, Images)'}
        </Typography>
      </Box>

      {/* Search Input Bar with inline Search Button */}
      <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={
            searchMode === 'DATABASE'
              ? 'Search database tables by Part No, Item Code, Product Name, PO No, Invoice No, Employee Name, Ledger, Asset...'
              : 'Search inside document contents (e.g. BOM/9285, PO-9285, QMS/FA/004/23-24, Audit schedule, part codes)...'
          }
          value={searchQuery}
          onChange={handleInputChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch} size="small" title="Clear search">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              height: 46,
              borderRadius: 2,
              fontSize: '0.95rem',
              bgcolor: theme.palette.background.paper
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={loading || !searchQuery.trim()}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
          sx={{
            height: 46,
            px: 3.5,
            whiteSpace: 'nowrap',
            borderRadius: 2,
            fontWeight: 700,
            fontSize: '0.88rem'
          }}
        >
          {loading ? 'Searching...' : searchMode === 'DATABASE' ? 'Search Database' : 'Search Content'}
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Results Header */}
      {activeQuery && !loading && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" color="textSecondary">
            Found <b>{totalMatches}</b> {searchMode === 'DATABASE' ? 'record' : 'result'}{totalMatches === 1 ? '' : 's'}{' '}
            {searchMode === 'DATABASE' ? 'across ERP database tables' : 'inside document contents'} for "<b>{activeQuery}</b>"
          </Typography>
        </Box>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results List: Dynamic height scrollable container with 2-cards-per-row grid */}
      {!loading && results.length > 0 && (
        <Box
          sx={{
            height: 'calc(100vh - 365px)',
            minHeight: '380px',
            overflowY: 'auto',
            pr: 1,
            py: 0.5,
            '&::-webkit-scrollbar': {
              width: '7px'
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: alpha(theme.palette.grey[300], 0.3),
              borderRadius: 3
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: alpha(theme.palette.primary.main, 0.35),
              borderRadius: 3
            },
            '&::-webkit-scrollbar-thumb:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.65)
            }
          }}
        >
          <Grid container spacing={1.5} sx={{ width: '100%' }}>
            {results.map((item, idx) => (
              <Grid item xs={12} md={6} key={`${item.documentId || item.recordId}-${idx}`} sx={{ width: { xs: '100%', md: '31%' } }}>
                {searchMode === 'DATABASE' ? (
                  /* Compact Database Table Record Card */
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        borderColor: theme.palette.primary.main
                      }
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      {/* Top: Icon + Title + Table Chip + Badge */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, display: 'flex' }}>
                            <StorageIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Tooltip title={item.primaryTitle || item.referenceCode || 'Database Record'}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: 'text.primary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.primaryTitle || item.referenceCode || 'Database Record'}
                            </Typography>
                          </Tooltip>
                          <Chip
                            label={item.tableName}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: alpha(theme.palette.secondary.main, 0.12),
                              color: theme.palette.secondary.dark,
                              flexShrink: 0
                            }}
                          />
                        </Stack>
                        <Chip
                          label="DB Record"
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}
                        />
                      </Box>

                      {/* Metadata Row */}
                      <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                        <Chip
                          label={`Mod: ${item.moduleCode}`}
                          size="small"
                          color="primary"
                          sx={{ height: 19, fontSize: '0.66rem', fontWeight: 600 }}
                        />
                        <Chip
                          label={`Ref ID: ${item.referenceCode || 'N/A'}`}
                          size="small"
                          sx={{
                            height: 19,
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            color: item.referenceCode ? '#d84315' : 'text.secondary',
                            bgcolor: item.referenceCode ? '#fbe9e7' : alpha(theme.palette.grey[500], 0.08),
                            border: `1px solid ${item.referenceCode ? '#ffab91' : alpha(theme.palette.grey[500], 0.25)}`
                          }}
                        />
                        {item.matchedColumn && (
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.dark', fontSize: '0.72rem' }}>
                            Col: <b>{item.matchedColumn}</b>
                          </Typography>
                        )}
                      </Stack>

                      {/* Snippet preview */}
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: alpha(theme.palette.background.default, 0.7),
                          borderLeft: `3px solid ${theme.palette.info.main}`,
                          borderRadius: '0 6px 6px 0',
                          fontSize: '0.82rem',
                          lineHeight: 1.4,
                          fontFamily: 'Roboto, sans-serif',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          '& mark': {
                            bgcolor: '#FFE082',
                            color: '#212121',
                            fontWeight: 'bold',
                            px: 0.4,
                            borderRadius: 0.5
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: item.highlightedSnippet || item.matchedValue }}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  /* Compact Document Content Card */
                  <Card
                    variant="outlined"
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        borderColor: theme.palette.primary.main
                      }
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, width: '100%' }}>
                      {/* Top: Icon + File Name + File Type + Open Button */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1, width: '100%' }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {renderFileIcon(item.fileType, 22)}
                          </Box>
                          <Tooltip title={item.fileName}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                color: 'text.primary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.fileName}
                            </Typography>
                          </Tooltip>
                          <Chip
                            label={item.fileType}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              bgcolor: alpha(theme.palette.grey[500], 0.12),
                              color: 'text.secondary',
                              flexShrink: 0
                            }}
                          />
                        </Stack>

                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                          onClick={() => handleOpenViewer(item)}
                          sx={{
                            height: 26,
                            px: 1.2,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderRadius: 1.5,
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          Open Document
                        </Button>
                      </Box>

                      {/* Metadata Chips: Module, Screen, Ref, Source */}
                      <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.8 }}>
                        <Chip
                          label={`Mod: ${item.moduleCode}`}
                          size="small"
                          color="primary"
                          sx={{ height: 19, fontSize: '0.66rem', fontWeight: 600 }}
                        />
                        {item.pageCode && (
                          <Chip
                            label={`Page: ${item.pageCode}`}
                            size="small"
                            sx={{
                              height: 19,
                              fontSize: '0.66rem',
                              fontWeight: 600,
                              bgcolor: '#ede7f6',
                              color: '#5e35b1',
                              border: '1px solid #d1c4e9'
                            }}
                          />
                        )}
                        {/* Ref ID Chip - ALWAYS DISPLAYED */}
                        <Chip
                          label={`Ref No: ${item.refId || 'N/A'}`}
                          size="small"
                          sx={{
                            height: 19,
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            color: item.refId ? '#d84315' : 'text.secondary',
                            bgcolor: item.refId ? '#fbe9e7' : alpha(theme.palette.grey[500], 0.08),
                            border: `1px solid ${item.refId ? '#ffab91' : alpha(theme.palette.grey[500], 0.25)}`
                          }}
                        />
                        {item.sourceTable && (
                          <Chip
                            label={item.sourceTable}
                            size="small"
                            variant="outlined"
                            sx={{ height: 19, fontSize: '0.64rem', color: 'text.secondary' }}
                          />
                        )}
                      </Stack>

                      {/* Location Details Indicator */}
                      <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mb: 0.8, color: 'text.secondary' }}>
                        <LocationOnIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />
                        {item.fileType === 'XLSX' || item.fileType === 'XLS' ? (
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.dark', fontSize: '0.74rem' }}>
                            Matched at: <b>Sheet: {item.sheetName || 'Sheet1'}</b> • <b>Cell: {item.cellReference || `Row ${item.lineNumber}`}</b>
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.dark', fontSize: '0.74rem' }}>
                            Matched at: <b>Page {item.pageNumber}</b> • <b>Line {item.lineNumber}</b>
                            {item.sheetName && ` (${item.sheetName})`}
                          </Typography>
                        )}
                      </Stack>

                      {/* Snippet Preview with Highlight */}
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: alpha(theme.palette.background.default, 0.7),
                          borderLeft: `3px solid ${theme.palette.warning.main}`,
                          borderRadius: '0 6px 6px 0',
                          fontSize: '0.82rem',
                          lineHeight: 1.4,
                          fontFamily: 'Roboto, sans-serif',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          '& mark': {
                            bgcolor: '#FFE082',
                            color: '#212121',
                            fontWeight: 'bold',
                            px: 0.4,
                            borderRadius: 0.5
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: item.matchingSnippet || item.matchingText }}
                      />
                    </CardContent>
                  </Card>
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Empty State */}
      {!loading && activeQuery && results.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h4" color="textSecondary" sx={{ mb: 1 }}>
            No matching document content found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            We searched inside all indexed files but found no matches for "{activeQuery}".
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Document Viewer Modal */}
      <Dialog
        open={viewerOpen}
        onClose={handleCloseViewer}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '85vh', borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {currentDoc && renderFileIcon(currentDoc.fileType)}
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{currentDoc?.fileName}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                <Chip
                  label={`Module: ${currentDoc?.moduleCode}`}
                  size="small"
                  color="primary"
                  sx={{ height: 20, fontSize: '0.72rem', fontWeight: 600 }}
                />
                <Chip
                  label={`Page Code: ${currentDoc?.pageCode} (${PAGE_NAMES[currentDoc?.pageCode] || 'Screen'})`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    bgcolor: '#ede7f6',
                    color: '#5e35b1',
                    border: '1px solid #d1c4e9'
                  }}
                />
                <Chip
                  label={`Ref / Part / Item: ${currentDoc?.refId || 'N/A'}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#d84315',
                    bgcolor: '#fbe9e7',
                    border: '1px solid #ffab91'
                  }}
                />
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  Matched at: Page {currentDoc?.pageNumber} • Line {currentDoc?.lineNumber}
                  {currentDoc?.cellReference && ` • Cell: ${currentDoc.cellReference}`}
                </Typography>
              </Stack>
            </Box>
          </Stack>
          <IconButton onClick={handleCloseViewer} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0, height: '100%', bgcolor: '#1e2124', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Subheader Viewer Controls Toolbar */}
          {currentDoc && !docLoading && (
            <Box
              sx={{
                px: 2,
                py: 0.8,
                bgcolor: '#2b2f35',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                zIndex: 20
              }}
            >
              {/* Mode Switcher & Page Nav */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                {currentDoc.fileType === 'PDF' && (
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    size="small"
                    onChange={(e, val) => val && setViewMode(val)}
                    sx={{
                      height: 28,
                      bgcolor: '#1e2124',
                      '& .MuiToggleButton-root': {
                        color: '#94a3b8',
                        px: 1.2,
                        py: 0.2,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        border: '1px solid rgba(255,255,255,0.15)',
                        '&.Mui-selected': {
                          bgcolor: '#ffb300',
                          color: '#000',
                          fontWeight: 800,
                          '&:hover': { bgcolor: '#ffa000' }
                        }
                      }
                    }}
                  >
                    <ToggleButton value="VISUAL">
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                        <span>Visual Highlight</span>
                      </Stack>
                    </ToggleButton>
                    <ToggleButton value="NATIVE">
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <PictureAsPdfIcon sx={{ fontSize: 14 }} />
                        <span>Native PDF</span>
                      </Stack>
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}

                {/* Page Navigation for Multi-Page Docs */}
                {viewMode === 'VISUAL' && previewData && (previewData.totalPages > 1 || currentDoc.totalPages > 1) && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ bgcolor: '#1e2124', px: 1, py: 0.2, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <IconButton
                      size="small"
                      disabled={previewPage <= 1 || previewLoading}
                      onClick={() => handlePageChangeViewer(previewPage - 1)}
                      sx={{ color: '#fff', p: 0.2, '&.Mui-disabled': { color: '#555' } }}
                    >
                      <NavigateBeforeIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ color: '#f8fafc', fontWeight: 700, px: 0.5, fontSize: '0.75rem' }}>
                      Page {previewPage} / {previewData.totalPages || currentDoc.totalPages || 1}
                    </Typography>
                    <IconButton
                      size="small"
                      disabled={previewPage >= (previewData.totalPages || 1) || previewLoading}
                      onClick={() => handlePageChangeViewer(previewPage + 1)}
                      sx={{ color: '#fff', p: 0.2, '&.Mui-disabled': { color: '#555' } }}
                    >
                      <NavigateNextIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Stack>

              {/* Zoom & Highlight Toggle */}
              <Stack direction="row" spacing={1} alignItems="center">
                {viewMode === 'VISUAL' && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ bgcolor: '#1e2124', px: 1, py: 0.2, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <IconButton
                      size="small"
                      onClick={() => setZoomLevel(prev => Math.max(0.4, Number((prev - 0.2).toFixed(1))))}
                      sx={{ color: '#fff', p: 0.3 }}
                      title="Zoom Out"
                    >
                      <ZoomOutIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography variant="caption" sx={{ color: '#f8fafc', fontWeight: 700, minWidth: 38, textAlign: 'center', fontSize: '0.75rem' }}>
                      {Math.round(zoomLevel * 100)}%
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setZoomLevel(prev => Math.min(3.0, Number((prev + 0.2).toFixed(1))))}
                      sx={{ color: '#fff', p: 0.3 }}
                      title="Zoom In"
                    >
                      <ZoomInIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setZoomLevel(1)}
                      sx={{ color: '#94a3b8', p: 0.3, '&:hover': { color: '#fff' } }}
                      title="Reset Zoom"
                    >
                      <RestartAltIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                )}

                <Button
                  size="small"
                  variant={highlightVisible ? "contained" : "outlined"}
                  onClick={handleToggleHighlight}
                  startIcon={highlightVisible ? <VisibilityIcon sx={{ fontSize: 14 }} /> : <VisibilityOffIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    height: 28,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: highlightVisible ? '#ffb300' : 'transparent',
                    color: highlightVisible ? '#000' : '#ffb300',
                    borderColor: '#ffb300',
                    '&:hover': {
                      bgcolor: highlightVisible ? '#ffa000' : 'rgba(255, 179, 0, 0.1)',
                      borderColor: '#ffb300'
                    }
                  }}
                >
                  {highlightVisible ? "Highlight ON" : "Highlight OFF"}
                </Button>
              </Stack>
            </Box>
          )}

          {docLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#fff', gap: 2 }}>
              <CircularProgress color="inherit" />
              <Typography variant="body2">Loading authenticated document stream...</Typography>
            </Box>
          ) : currentDoc && (
            <Box sx={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

              {/* Floating Temporary Search Match Highlight Bar */}
              {highlightVisible && (currentDoc.matchingSnippet || currentDoc.matchingText || activeQuery) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100,
                    maxWidth: { xs: '95%', sm: '85%', md: '75%' },
                    bgcolor: highlightPulsing ? 'rgba(25, 25, 28, 0.95)' : 'rgba(33, 37, 41, 0.88)',
                    backdropFilter: 'blur(10px)',
                    color: '#ffffff',
                    px: 2,
                    py: 1,
                    borderRadius: 2.5,
                    border: '1.5px solid',
                    borderColor: highlightPulsing ? '#ffb300' : 'rgba(255, 179, 0, 0.5)',
                    boxShadow: highlightPulsing
                      ? '0 0 25px rgba(255, 179, 0, 0.6), 0 8px 32px rgba(0,0,0,0.5)'
                      : '0 4px 20px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    transition: 'all 0.5s ease',
                    '@keyframes pulseGlow': {
                      '0%': { boxShadow: '0 0 15px rgba(255, 179, 0, 0.5)' },
                      '50%': { boxShadow: '0 0 30px rgba(255, 179, 0, 0.9)' },
                      '100%': { boxShadow: '0 0 15px rgba(255, 179, 0, 0.5)' }
                    },
                    animation: highlightPulsing ? 'pulseGlow 1.8s infinite ease-in-out' : 'none'
                  }}
                >
                  <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                    <Chip
                      label={`PAGE ${currentDoc.pageNumber || 1} • LINE ${currentDoc.lineNumber || 1}`}
                      size="small"
                      sx={{
                        bgcolor: '#ffb300',
                        color: '#000000',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        height: 22,
                        flexShrink: 0
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#f8fafc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        '& mark': {
                          bgcolor: '#ffd54f',
                          color: '#1a1a1a',
                          fontWeight: 800,
                          px: 0.6,
                          py: 0.1,
                          borderRadius: 0.8,
                          boxShadow: '0 0 8px rgba(255, 213, 79, 0.8)'
                        }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: currentDoc.matchingSnippet || currentDoc.matchingText || `Search match: <b>${activeQuery}</b>`
                      }}
                    />
                  </Stack>
                  <IconButton
                    size="small"
                    onClick={() => setHighlightVisible(false)}
                    sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    title="Dismiss Banner"
                  >
                    <CloseIcon fontSize="small" sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              )}

              {/* 1. VISUAL HIGHLIGHT VIEW (Annotated Page with Yellow Marker + Red Box) */}
              {viewMode === 'VISUAL' && (currentDoc.fileType === 'PDF' || isImageFileType(currentDoc.fileType)) ? (
                <Box
                  sx={{
                    flex: 1,
                    height: '100%',
                    overflow: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    p: 2,
                    bgcolor: '#181a1b',
                    position: 'relative'
                  }}
                >
                  {previewLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ffb300', gap: 2, my: 'auto' }}>
                      <CircularProgress color="inherit" size={36} />
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                        Rendering high-resolution annotated page with highlights...
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.15s ease-out',
                        position: 'relative',
                        display: 'inline-block',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={previewData?.dataUrl || docBlobUrl || currentDoc.viewUrl}
                        alt={`Page ${previewPage}`}
                        style={{
                          display: 'block',
                          maxWidth: zoomLevel === 1 ? '100%' : 'none',
                          maxHeight: zoomLevel === 1 ? 'calc(85vh - 160px)' : 'none',
                          objectFit: 'contain'
                        }}
                      />

                      {/* Interactive CSS Bounding Box Overlay for live pulsing */}
                      {highlightVisible && (Array.isArray(previewData?.coordinates) ? previewData.coordinates : (currentDoc.x != null ? [{ x: currentDoc.x, y: currentDoc.y, w: currentDoc.width, h: currentDoc.height }] : [])).map((box, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            position: 'absolute',
                            left: `${(box.x || 0) * 100}%`,
                            top: `${(box.y || 0) * 100}%`,
                            width: `${Math.max((box.w || 0.04) * 100, 2)}%`,
                            height: `${Math.max((box.h || 0.015) * 100, 1.2)}%`,
                            border: '1.5px solid rgba(255, 179, 0, 0.7)',
                            bgcolor: 'rgba(255, 235, 59, 0.4)',
                            boxShadow: '0 0 10px rgba(255, 213, 79, 0.7)',
                            borderRadius: '2px',
                            pointerEvents: 'none',
                            zIndex: 10,
                            '@keyframes pulseGlowBox': {
                              '0%': { transform: 'scale(1)', opacity: 0.8 },
                              '50%': { transform: 'scale(1.05)', opacity: 1 },
                              '100%': { transform: 'scale(1)', opacity: 0.8 }
                            },
                            animation: highlightPulsing ? 'pulseGlowBox 1.5s infinite ease-in-out' : 'none'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              ) : currentDoc.fileType === 'PDF' ? (
                /* 2. NATIVE PDF VIEWER (Iframe) */
                <iframe
                  title="Document Preview"
                  src={docBlobUrl ? `${docBlobUrl}#page=${previewPage}&search=${encodeURIComponent(activeQuery)}` : ''}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', flex: 1 }}
                />
              ) : (
                /* 3. Non-PDF & Non-Image Documents (Docx, Excel, Text) */
                <Box sx={{ p: 4, bgcolor: '#FFFFFF', height: '100%', overflow: 'auto', flex: 1 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Viewing document at <b>Page {currentDoc.pageNumber}, Line {currentDoc.lineNumber}</b>
                    {currentDoc.cellReference && ` (Cell: ${currentDoc.cellReference})`}.
                  </Alert>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Matched Snippet:</Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#FFF9C4',
                      borderRadius: 1,
                      mb: 3,
                      border: '1px solid #FFE082',
                      fontSize: '0.95rem',
                      '& mark': {
                        bgcolor: '#FFB300',
                        color: '#000',
                        fontWeight: 'bold',
                        px: 0.6,
                        py: 0.2,
                        borderRadius: 0.5
                      }
                    }}
                    dangerouslySetInnerHTML={{ __html: currentDoc.matchingSnippet || currentDoc.matchingText }}
                  />
                  <Button variant="outlined" href={docBlobUrl || currentDoc.viewUrl} download={currentDoc.fileName}>
                    Download Original File
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, bgcolor: '#2b2f35' }}>
          <Button onClick={handleCloseViewer} sx={{ color: '#cbd5e1' }}>Close</Button>
          {currentDoc && (
            <Button variant="contained" href={docBlobUrl || currentDoc.viewUrl} download={currentDoc.fileName} sx={{ bgcolor: '#ffb300', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#ffa000' } }}>
              Download File
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default DocumentSearch;
