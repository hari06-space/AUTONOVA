import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Stack,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  TablePagination
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import DragHandleIcon from '@mui/icons-material/DragHandle';

import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import axiosInstance from 'utils/axios';
import { format } from 'sql-formatter';
import * as XLSX from 'xlsx';

// Configure Monaco to use local bundled version
loader.config({ monaco });

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} style={{ height: '100%' }} {...other}>
      {value === index && <Box sx={{ pt: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>{children}</Box>}
    </div>
  );
}

const DbQuery = () => {
  const globalSearchQuery = useSelector((state) => state.search?.query || '').toLowerCase();
  const [activeTab, setActiveTab] = useState(0);
  const [queryTabs, setQueryTabs] = useState([{ id: 1, name: 'SQLQuery1.sql', content: '' }]);
  const [activeQueryId, setActiveQueryId] = useState(1);
  const nextQueryId = useRef(2);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState('');
  const [rowsAffected, setRowsAffected] = useState(null);
  const [queryResultsList, setQueryResultsList] = useState([]);
  const [schema, setSchema] = useState({});
  const [history, setHistory] = useState([]);
  const [snippetAnchor, setSnippetAnchor] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Split screen and fullscreen states
  const [editorHeight, setEditorHeight] = useState(50); // percentage
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [isResultsFullscreen, setIsResultsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const [savedQueries, setSavedQueries] = useState([]);
  const [saveQueryDialogOpen, setSaveQueryDialogOpen] = useState(false);
  const [queryToSaveText, setQueryToSaveText] = useState('');
  const [queryToSaveName, setQueryToSaveName] = useState('');
  const [savingQuery, setSavingQuery] = useState(false);

  // DB Backup state
  const getDynamicBackupPath = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}_${pad(now.getMinutes())}`;
    return `D:\\MSSQL\\Backup\\autonoma_${dateStr}.bak`;
  };
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupPath, setBackupPath] = useState(getDynamicBackupPath());
  const [backingUp, setBackingUp] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const schemaRef = useRef({});
  const completionProviderRef = useRef(null);
  const editorRef = useRef(null);

  const handleDrag = React.useCallback((e) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
      setEditorHeight(Math.max(15, Math.min(newHeight, 85))); // clamp
    }
  }, []);

  const handleMouseUp = React.useCallback(() => {
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  }, [handleDrag]);

  const handleMouseDown = React.useCallback((e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
  }, [handleDrag, handleMouseUp]);

  const fetchSavedQueries = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/db-query/saved');
      if (response.data) {
        setSavedQueries(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch saved queries', err);
    }
  };

  const handleBackup = async () => {
    if (!backupPath.trim()) return;
    setBackingUp(true);
    try {
      const response = await axiosInstance.post('/api/admin/db-query/backup', { backupPath });
      if (response.data && response.data.success) {
        setSnackbar({ open: true, message: response.data.message, severity: 'success' });
        setBackupDialogOpen(false);
      } else {
        setSnackbar({ open: true, message: response.data.message || 'Failed to backup database.', severity: 'error' });
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setSnackbar({ open: true, message: err.response.data.message, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Server error during backup.', severity: 'error' });
      }
    } finally {
      setBackingUp(false);
    }
  };

  useEffect(() => {
    fetchSavedQueries();
  }, []);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('dbQueryHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Could not parse history');
      }
    }
  }, []);

  // Fetch Schema
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await axiosInstance.get('/api/admin/db-query/schema');
        if (response.data) {
          setSchema(response.data);
          schemaRef.current = response.data;
        }
      } catch (err) {
        console.error('Failed to fetch db schema', err);
      }
    };
    fetchSchema();

    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
    };
  }, []);

  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor;

    // Add Ctrl+Enter shortcut to execute query
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
      handleExecuteRef.current();
    });

    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }

    completionProviderRef.current = monacoInstance.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const currentSchema = schemaRef.current || {};
        const allTables = Object.keys(currentSchema);

        const queryText = model.getValue().toUpperCase();
        const tableMatches = queryText.match(/(?:FROM|UPDATE|JOIN|INTO)\s+([A-Z0-9_]+)/g);
        const activeTables = tableMatches ? tableMatches.map(m => m.split(/\s+/)[1]) : [];

        let columnSuggestions = [];

        if (activeTables.length > 0) {
          const addedCols = new Set();
          activeTables.forEach(t => {
            const cols = currentSchema[t] || [];
            cols.forEach(colObj => {
              const c = typeof colObj === 'string' ? colObj : colObj.name;
              if (!addedCols.has(c)) {
                addedCols.add(c);
                columnSuggestions.push({
                  label: c,
                  kind: monacoInstance.languages.CompletionItemKind.Field,
                  insertText: c,
                  detail: `Column (${t})`,
                  range: range
                });
              }
            });
          });
        }

        const tableSuggestions = allTables.map((t) => ({
          label: t,
          kind: monacoInstance.languages.CompletionItemKind.Struct,
          insertText: t,
          detail: 'Table',
          range: range
        }));

        const sqlKeywords = [
          'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES',
          'UPDATE', 'SET', 'DELETE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'ON', 'AS', 'AND', 'OR', 'ORDER BY', 'GROUP BY'
        ];

        const keywordSuggestions = sqlKeywords.map((k) => ({
          label: k,
          kind: monacoInstance.languages.CompletionItemKind.Keyword,
          insertText: k + ' ',
          range: range
        }));

        return { suggestions: [...columnSuggestions, ...tableSuggestions, ...keywordSuggestions] };
      }
    });
  };

  const saveToHistory = (executedQuery) => {
    const newHistory = [executedQuery, ...history.filter(q => q !== executedQuery)].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('dbQueryHistory', JSON.stringify(newHistory));
  };

  const handleSaveQueryClick = (sql) => {
    let queryToSave = sql;
    if (!queryToSave && editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();
      if (selection && !selection.isEmpty()) {
        queryToSave = model.getValueInRange(selection);
      } else {
        queryToSave = editorRef.current.getValue();
      }
    }
    if (!queryToSave || !queryToSave.trim()) {
      setError('Please enter a query to save.');
      return;
    }
    setQueryToSaveText(queryToSave.trim());
    setQueryToSaveName('');
    setSaveQueryDialogOpen(true);
  };

  const handleConfirmSaveQuery = async () => {
    if (!queryToSaveName.trim()) {
      return;
    }
    setSavingQuery(true);
    try {
      const response = await axiosInstance.post('/api/admin/db-query/saved', {
        queryName: queryToSaveName,
        queryText: queryToSaveText
      });
      if (response.data) {
        setSaveQueryDialogOpen(false);
        fetchSavedQueries();
      }
    } catch (err) {
      console.error('Failed to save query', err);
    } finally {
      setSavingQuery(false);
    }
  };

  const handleDeleteSavedQuery = async (id) => {
    try {
      await axiosInstance.delete(`/api/admin/db-query/saved/${id}`);
      fetchSavedQueries();
    } catch (err) {
      console.error('Failed to delete query', err);
    }
  };

  const handleExecute = async () => {
    let queryToRun = '';
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();

      // If there's a valid selection that isn't empty, get only the highlighted text
      if (selection && !selection.isEmpty()) {
        queryToRun = model.getValueInRange(selection);
      } else {
        queryToRun = editorRef.current.getValue();
      }
    } else {
      queryToRun = query;
    }

    if (!queryToRun.trim()) {
      setError('Please enter a query.');
      return;
    }

    // Auto-correct common syntax typos: "SELECT FROM * NPD_TABLE" -> "SELECT * FROM NPD_TABLE"
    const cleanedQuery = queryToRun.replace(/\bSELECT\s+FROM\s+\*\s*([A-Za-z0-9_#$@\[\]\.]+)/gi, 'SELECT * FROM $1');
    if (cleanedQuery !== queryToRun) {
      queryToRun = cleanedQuery;
      if (editorRef.current) {
        editorRef.current.setValue(cleanedQuery);
      }
      setQuery(cleanedQuery);
    }

    setLoading(true);
    setError('');
    setResults(null);
    setColumns([]);
    setRowsAffected(null);
    setQueryResultsList([]);
    setPage(0);

    try {
      const response = await axiosInstance.post('/api/admin/db-query/execute', { query: queryToRun });

      if (response.data.success) {
        if (response.data.queryResults && response.data.queryResults.length > 0) {
          setQueryResultsList(response.data.queryResults);
          // Also keep legacy state populated for export functions if needed
          if (response.data.data) {
            setResults(response.data.data);
            setColumns(response.data.columns || []);
          } else {
            setRowsAffected(response.data.rowsAffected);
          }
        } else {
          if (response.data.data) {
            setResults(response.data.data);
            setColumns(response.data.columns || []);
          } else {
            setRowsAffected(response.data.rowsAffected);
          }
        }
        saveToHistory(queryToRun);
      } else {
        setError(response.data.message || 'Query failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while executing the query');
    } finally {
      setLoading(false);
    }
  };

  // Keep a ref to handleExecute for the keyboard shortcut
  const handleExecuteRef = useRef(handleExecute);
  useEffect(() => {
    handleExecuteRef.current = handleExecute;
  }, [query, handleExecute]);

  const handleFormat = () => {
    if (editorRef.current) {
      const currentQuery = editorRef.current.getValue();
      if (!currentQuery) return;
      try {
        const formatted = format(currentQuery, { language: 'tsql' });
        setQuery(formatted);
        editorRef.current.setValue(formatted);
      } catch (e) {
        console.error('Format failed', e);
      }
    }
  };

  const handleExportCSV = () => {
    if (!results || results.length === 0) return;

    const headers = columns.join(',');
    const rows = results.map(row =>
      columns.map(col => {
        let str = row[col] !== null && row[col] !== undefined ? String(row[col]) : '';
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `query_results_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!results || results.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    XLSX.writeFile(workbook, `Query_Results_${new Date().getTime()}.xlsx`);
  };

  const insertSnippet = (snippet) => {
    if (editorRef.current) {
      const currentVal = editorRef.current.getValue();
      const newVal = currentVal ? `${currentVal}\n${snippet}` : snippet;
      setQuery(newVal);
      editorRef.current.setValue(newVal);
    }
    setSnippetAnchor(null);
  };

  const insertTableQuery = (tableName) => {
    const newQuery = `SELECT * FROM ${tableName}`;
    setQuery(newQuery);
    if (editorRef.current) {
      editorRef.current.setValue(newQuery);
    }
    setActiveTab(0);
  };

  const handleQueryTabSwitch = (newId) => {
    if (activeQueryId === newId) return;

    // Save current editor content to the current tab
    if (editorRef.current) {
      const currentVal = editorRef.current.getValue();
      setQueryTabs(prev => prev.map(t => t.id === activeQueryId ? { ...t, content: currentVal } : t));
    }

    // Load new tab content
    setActiveQueryId(newId);
    setQueryTabs(prev => {
      const newTab = prev.find(t => t.id === newId);
      if (editorRef.current && newTab) {
        editorRef.current.setValue(newTab.content);
        setQuery(newTab.content);
      }
      return prev;
    });
  };

  const addNewQueryTab = () => {
    if (editorRef.current) {
      const currentVal = editorRef.current.getValue();
      setQueryTabs(prev => prev.map(t => t.id === activeQueryId ? { ...t, content: currentVal } : t));
    }
    const newId = nextQueryId.current++;
    setQueryTabs(prev => [...prev, { id: newId, name: `SQLQuery${newId}.sql`, content: '' }]);
    setActiveQueryId(newId);
    setQuery('');
    if (editorRef.current) {
      editorRef.current.setValue('');
    }
  };

  const closeQueryTab = (e, id) => {
    e.stopPropagation();
    if (queryTabs.length === 1) {
      // Just clear the last one
      if (editorRef.current) editorRef.current.setValue('');
      setQuery('');
      return;
    }

    const newTabs = queryTabs.filter(t => t.id !== id);
    setQueryTabs(newTabs);

    if (activeQueryId === id) {
      const nextTab = newTabs[newTabs.length - 1];
      setActiveQueryId(nextTab.id);
      setQuery(nextTab.content);
      if (editorRef.current) {
        editorRef.current.setValue(nextTab.content);
      }
    }
  };

  const hasResults = (queryResultsList && queryResultsList.length > 0) || (results && results.length > 0);
  const isEditorMinimized = hasResults || rowsAffected !== null || error || (queryResultsList && queryResultsList.length > 0);

  return (
    <>
      <Card sx={{ boxShadow: '0 10px 30px rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden', height: '85vh', display: 'flex', flexDirection: 'column' }}>



        {/* Sleek Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default', px: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={(theme) => ({
              minHeight: 48,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', minHeight: 48, color: 'text.secondary' },
              '& .Mui-selected': { color: `${theme.palette.text.primary} !important` },
              '& .MuiTabs-indicator': { backgroundColor: theme.palette.primary.main, height: 3, borderRadius: '3px 3px 0 0' }
            })}
          >
            <Tab icon={<CodeIcon fontSize="small" />} iconPosition="start" label="Query Editor" />
            <Tab icon={<DataObjectIcon fontSize="small" />} iconPosition="start" label="Schema Browser" />
            <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Query History" />
            <Tab icon={<BookmarkIcon fontSize="small" />} iconPosition="start" label="Saved Queries" />
          </Tabs>
        </Box>

        {/* Main Content Area (Flex Grow) */}
        <CardContent sx={{ p: '0 !important', flexGrow: 1, bgcolor: 'background.default', overflow: 'hidden' }}>

          {/* TAB 0: EDITOR */}
          <TabPanel value={activeTab} index={0}>
            <Box ref={containerRef} sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 0, gap: 0, overflow: 'hidden' }}>

                            {/* Toolbar */}
              <Paper elevation={0} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 0, borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default', flexShrink: 0 }}>
                <Button
                  variant="contained"
                  onClick={() => handleExecute()}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  sx={{
                    bgcolor: 'primary.main',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                    borderRadius: 1.5,
                    textTransform: 'none',
                    px: 3
                  }}
                >
                  Execute
                </Button>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'divider' }} />

                <Tooltip title="Format SQL (Beautify)">
                  <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'action.hover' } }} onClick={handleFormat}>
                    <AutoFixHighIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Clear Editor">
                  <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.lighter' } }} onClick={() => setQuery('')}>
                    <DeleteSweepIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Copy to Clipboard">
                  <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'success.main', bgcolor: 'success.lighter' } }} onClick={() => navigator.clipboard.writeText(query)}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Button
                  size="small"
                  variant="text"
                  sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={(e) => setSnippetAnchor(e.currentTarget)}
                  endIcon={<ExpandMoreIcon />}
                >
                  Snippets
                </Button>
                <Button
                  size="small"
                  variant="text"
                  sx={{ color: 'text.primary', textTransform: 'none', fontWeight: 600, ml: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => {
                    setBackupPath(getDynamicBackupPath());
                    setBackupDialogOpen(true);
                  }}
                  startIcon={<DownloadIcon />}
                >
                  Backup DB
                </Button>
                <Menu
                  anchorEl={snippetAnchor}
                  open={Boolean(snippetAnchor)}
                  onClose={() => setSnippetAnchor(null)}
                  PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid', borderColor: 'divider', mt: 1 } }}
                >
                  <MenuItem onClick={() => insertSnippet('SELECT * FROM ')} sx={{ fontSize: '0.9rem' }}>SELECT * FROM</MenuItem>
                  <MenuItem onClick={() => insertSnippet('SELECT COUNT(*) FROM ')} sx={{ fontSize: '0.9rem' }}>SELECT COUNT(*)</MenuItem>
                  <MenuItem onClick={() => insertSnippet('WHERE ')} sx={{ fontSize: '0.9rem' }}>WHERE ...</MenuItem>
                  <MenuItem onClick={() => insertSnippet('INNER JOIN  ON ')} sx={{ fontSize: '0.9rem' }}>INNER JOIN</MenuItem>
                  <MenuItem onClick={() => insertSnippet('LEFT JOIN  ON ')} sx={{ fontSize: '0.9rem' }}>LEFT JOIN</MenuItem>
                  <MenuItem onClick={() => insertSnippet('GROUP BY ')} sx={{ fontSize: '0.9rem' }}>GROUP BY</MenuItem>
                  <MenuItem onClick={() => insertSnippet('ORDER BY  DESC')} sx={{ fontSize: '0.9rem' }}>ORDER BY DESC</MenuItem>
                  <Divider />
                  <MenuItem onClick={() => insertSnippet('INSERT INTO  () VALUES ()')} sx={{ fontSize: '0.9rem' }}>INSERT INTO</MenuItem>
                  <MenuItem onClick={() => insertSnippet('UPDATE  SET  =  WHERE ')} sx={{ fontSize: '0.9rem' }}>UPDATE</MenuItem>
                  <MenuItem onClick={() => insertSnippet('DELETE FROM  WHERE ')} sx={{ fontSize: '0.9rem' }}>DELETE</MenuItem>
                </Menu>

                <Tooltip title="Save Current Query">
                  <IconButton size="small" sx={{ ml: 1, color: 'warning.main', '&:hover': { color: 'warning.dark', bgcolor: 'warning.lighter' } }} onClick={() => handleSaveQueryClick()}>
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title={isEditorFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                  <IconButton size="small" sx={{ ml: 1, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' } }} onClick={() => { setIsEditorFullscreen(!isEditorFullscreen); setIsResultsFullscreen(false); }}>
                    {isEditorFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                <Box sx={{ flexGrow: 1 }} />

                <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1, display: { xs: 'none', md: 'block' } }}>
                  <kbd style={{ background: 'background.default', padding: '2px 6px', borderRadius: '4px', border: '1px solid divider' }}>Ctrl</kbd> + <kbd style={{ background: 'background.default', padding: '2px 6px', borderRadius: '4px', border: '1px solid divider' }}>Enter</kbd> to execute
                </Typography>
              </Paper>

{/* Sub-Tabs for Multiple Queries */}
              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', overflowX: 'auto', '&::-webkit-scrollbar': { height: 4 }, flexShrink: 0, minHeight: 40 }}>
                {queryTabs.map((tab, index) => (
                  <Box
                    key={tab.id}
                    onClick={() => handleQueryTabSwitch(tab.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: activeQueryId === tab.id ? 'background.paper' : 'background.default',
                      color: activeQueryId === tab.id ? 'text.primary' : 'text.secondary',
                      px: 2,
                      py: 1,
                      cursor: 'pointer',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      borderTop: activeQueryId === tab.id ? '2px solid' : '2px solid transparent',
                      borderTopColor: 'primary.main',
                      fontWeight: activeQueryId === tab.id ? 600 : 400,
                      minWidth: '120px',
                      '&:hover': { bgcolor: activeQueryId === tab.id ? 'background.paper' : 'action.hover' }
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'nowrap', userSelect: 'none', flexGrow: 1 }}>{tab.name}</Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => closeQueryTab(e, tab.id)}
                      sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'transparent' } }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
                <IconButton size="small" onClick={addNewQueryTab} sx={{ ml: 1, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>


              {/* Error State */}
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(239,68,68,0.1)', flexShrink: 0 }}>
                  {error}
                </Alert>
              )}

              {/* Space Management: Editor */}
              <Box
                sx={{
                  display: isResultsFullscreen ? 'none' : 'block',
                  flex: isEditorFullscreen ? '1 1 auto' : (isEditorMinimized ? `0 0 ${editorHeight}%` : '1 1 auto'),
                  minHeight: '150px',
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Editor
                  height="100%"
                  width="100%"
                  defaultLanguage="sql"
                  theme="vs-dark"
                  defaultValue={query}
                  onChange={(value) => setQuery(value || '')}
                  onMount={handleEditorDidMount}
                  loading={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', bgcolor: 'background.paper' }}><CircularProgress sx={{ color: 'primary.main' }} /></Box>}
                  options={{
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    suggestOnTriggerCharacters: true,
                    padding: { top: 12, bottom: 12 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    lineHeight: 1.5,
                    renderWhitespace: 'boundary'
                  }}
                />
              </Box>

              {/* Drag Handle Divider */}
              {isEditorMinimized && !isEditorFullscreen && !isResultsFullscreen && (
                <Box
                  onMouseDown={handleMouseDown}
                  sx={{
                    height: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'row-resize',
                    opacity: 0.5,
                    transition: 'opacity 0.2s',
                    '&:hover': { opacity: 1 },
                    flexShrink: 0,
                    my: 1
                  }}
                >
                  <Divider sx={{ flexGrow: 1, borderColor: 'primary.main', opacity: 0.2 }} />
                  <Box sx={{ bgcolor: 'primary.lighter', borderRadius: 1, px: 1, display: 'flex', alignItems: 'center' }}>
                    <DragHandleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  </Box>
                  <Divider sx={{ flexGrow: 1, borderColor: 'primary.main', opacity: 0.2 }} />
                </Box>
              )}

              {/* Query Results */}
              {!isEditorFullscreen && (queryResultsList && queryResultsList.length > 0) ? (
                <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflowY: queryResultsList.length > 1 ? 'auto' : 'hidden', gap: queryResultsList.length > 1 ? 3 : 0, pb: 2, pr: 1 }}>
                  {queryResultsList.map((result, index) => (
                    <Box key={index} sx={{ display: 'flex', flexDirection: 'column', flex: queryResultsList.length === 1 ? 1 : 'none', minHeight: 0 }}>
                      {/* Header for each result */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Result {index + 1} 
                          {result.select && <Chip label={`${result.data?.length || 0} rows`} size="small" sx={{ ml: 1, bgcolor: 'primary.lighter', color: 'primary.main', fontWeight: 'bold' }} />}
                        </Typography>
                        {index === 0 && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={isResultsFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                              <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' } }} onClick={() => { setIsResultsFullscreen(!isResultsFullscreen); setIsEditorFullscreen(false); }}>
                                {isResultsFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            {result.select && (
                              <>
                                <Button
                                  startIcon={<DownloadIcon />}
                                  variant="outlined"
                                  size="small"
                                  onClick={handleExportCSV}
                                  sx={{ borderRadius: 1.5, textTransform: 'none', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' } }}
                                >
                                  Export CSV
                                </Button>
                                <Button
                                  startIcon={<DownloadIcon />}
                                  variant="outlined"
                                  size="small"
                                  onClick={handleExportExcel}
                                  sx={{ borderRadius: 1.5, textTransform: 'none', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' } }}
                                >
                                  Export Excel
                                </Button>
                              </>
                            )}
                          </Box>
                        )}
                      </Box>

                      {/* Content based on type */}
                      {!result.select ? (
                        <Alert severity="success" sx={{ borderRadius: 2 }}>
                          Query executed successfully. <strong>{result.rowsAffected}</strong> rows affected.
                        </Alert>
                      ) : (
                        <>
                          {result.data && result.data.length === 0 ? (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>Query executed successfully, but no records were found.</Alert>
                          ) : (
                            <>
                              <TableContainer component={Paper} sx={{ flex: queryResultsList.length === 1 ? '1 1 auto' : 'none', maxHeight: queryResultsList.length > 1 ? '400px' : 'none', borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.02)', overflow: 'auto' }}>
                                <Table stickyHeader size="small" sx={{ width: 'max-content', minWidth: '100%' }}>
                                  <TableHead>
                                    <TableRow>
                                      {result.columns && result.columns.map((key) => (
                                        <TableCell key={key} sx={{ fontWeight: 800, bgcolor: 'background.default', color: 'text.primary', borderBottom: '2px solid', borderColor: 'divider', whiteSpace: 'nowrap', py: 1.5, px: 2 }}>
                                          {key}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {result.data && result.data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, rIndex) => (
                                      <TableRow key={rIndex} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
                                        {result.columns && result.columns.map((colKey, i) => {
                                          const val = row[colKey];
                                          return (
                                            <TableCell key={i} sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', py: 1, px: 2, color: val === null || val === undefined ? 'text.secondary' : 'text.primary' }}>
                                              {val !== null && val !== undefined ? String(val) : <em>null</em>}
                                            </TableCell>
                                          );
                                        })}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                              <TablePagination
                                rowsPerPageOptions={[10, 50, 100, 500]}
                                component="div"
                                count={result.data.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                              />
                            </>
                          )}
                        </>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                /* Fallback for legacy single-result state */
                !isEditorFullscreen && (results || rowsAffected !== null) && (
                  <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Results {results && <Chip label={`${results.length} rows`} size="small" sx={{ ml: 1, bgcolor: 'primary.lighter', color: 'primary.main', fontWeight: 'bold' }} />}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title={isResultsFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                          <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' } }} onClick={() => { setIsResultsFullscreen(!isResultsFullscreen); setIsEditorFullscreen(false); }}>
                            {isResultsFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        {results && (
                          <>
                            <Button
                              startIcon={<DownloadIcon />}
                              variant="outlined"
                              size="small"
                              onClick={handleExportCSV}
                              sx={{ borderRadius: 1.5, textTransform: 'none', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' } }}
                            >
                              Export CSV
                            </Button>
                            <Button
                              startIcon={<DownloadIcon />}
                              variant="outlined"
                              size="small"
                              onClick={handleExportExcel}
                              sx={{ borderRadius: 1.5, textTransform: 'none', borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' } }}
                            >
                              Export Excel
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                    
                    {rowsAffected !== null && (
                      <Alert severity="success" sx={{ borderRadius: 2, flexShrink: 0 }}>
                        Query executed successfully. <strong>{rowsAffected}</strong> rows affected.
                      </Alert>
                    )}

                    {results && results.length === 0 && (
                      <Alert severity="info" sx={{ borderRadius: 2, flexShrink: 0 }}>Query executed successfully, but no records were found.</Alert>
                    )}

                    {results && results.length > 0 && (
                      <>
                        <TableContainer component={Paper} sx={{ flex: '1 1 auto', borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.02)', overflow: 'auto' }}>
                          <Table stickyHeader size="small" sx={{ width: 'max-content', minWidth: '100%' }}>
                            <TableHead>
                              <TableRow>
                                {columns.map((key) => (
                                  <TableCell key={key} sx={{ fontWeight: 800, bgcolor: 'background.default', color: 'text.primary', borderBottom: '2px solid', borderColor: 'divider', whiteSpace: 'nowrap', py: 1.5, px: 2 }}>
                                    {key}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {results.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                                <TableRow key={index} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}>
                                  {columns.map((colKey, i) => {
                                    const val = row[colKey];
                                    return (
                                      <TableCell key={i} sx={{ borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', py: 1, px: 2, color: val === null || val === undefined ? 'text.secondary' : 'text.primary' }}>
                                        {val !== null && val !== undefined ? String(val) : <em>null</em>}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <TablePagination
                          rowsPerPageOptions={[10, 50, 100, 500]}
                          component="div"
                          count={results.length}
                          rowsPerPage={rowsPerPage}
                          page={page}
                          onPageChange={handleChangePage}
                          onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                      </>
                    )}
                  </Box>
                )
              )}

            </Box>
          </TabPanel>

          {/* TAB 1: SCHEMA BROWSER */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold" color="text.primary">Database Schema Explorer</Typography>
                <Chip label={`${Object.keys(schema).filter(t => t.toLowerCase().includes(globalSearchQuery)).length} Tables Found`} color="primary" sx={{ fontWeight: 'bold' }} />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, alignItems: 'start', flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' } }}>
                {Object.keys(schema)
                  .filter((tableName) => tableName.toLowerCase().includes(globalSearchQuery))
                  .map((tableName) => (
                  <Accordion 
                    key={tableName} 
                    disableGutters 
                    TransitionProps={{ unmountOnExit: true }}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px !important', boxShadow: 'none', '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />} sx={{ bgcolor: 'background.paper', borderRadius: 1.5, minHeight: '40px !important', '& .MuiAccordionSummary-content': { my: 1 } }}>
                      <Typography fontWeight="bold" sx={{ color: 'text.primary', flexGrow: 1 }}>{tableName}</Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ mr: 2, borderRadius: 1.5, textTransform: 'none' }}
                        onClick={(e) => { e.stopPropagation(); insertTableQuery(tableName); }}
                      >
                        Query Table
                      </Button>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 1.5, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                      <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 350, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 700, color: 'text.primary', py: 1.5 }}>Column Name</TableCell>
                              <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 700, color: 'text.primary', py: 1.5 }}>Data Type</TableCell>
                              <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 700, color: 'text.primary', py: 1.5 }}>Constraints</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {schema[tableName].map((colObj) => {
                              const col = typeof colObj === 'string' ? { name: colObj } : colObj;
                              return (
                                <TableRow
                                  key={col.name}
                                  hover
                                  sx={{
                                    bgcolor: col.isPk ? 'action.selected' : 'background.paper',
                                    '&:nth-of-type(even)': { bgcolor: col.isPk ? 'action.selected' : 'action.hover' },
                                    '&:last-child td, &:last-child th': { border: 0 }
                                  }}
                                >
                                  <TableCell sx={{ fontWeight: 600, color: col.isPk ? 'primary.main' : 'text.primary' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {col.isPk && <span title="Primary Key" style={{ fontSize: '12px' }}>🔑</span>}
                                      {col.name}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: "'JetBrains Mono', monospace" }}>
                                      {col.type || 'N/A'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                      {col.isPk && <Chip label="PK" size="small" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, height: 20, fontSize: '0.65rem', borderRadius: 1 }} />}
                                      {col.isFk && (
                                        <Tooltip title={`References ${col.refTable}(${col.refCol})`}>
                                          <Chip label="FK" size="small" sx={{ bgcolor: 'action.disabledBackground', color: 'text.primary', fontWeight: 700, height: 20, fontSize: '0.65rem', borderRadius: 1, cursor: 'help' }} />
                                        </Tooltip>
                                      )}
                                      {col.isIndexed && !col.isPk && <Chip label="IDX" size="small" sx={{ bgcolor: 'info.main', color: 'info.contrastText', fontWeight: 700, height: 20, fontSize: '0.65rem', borderRadius: 1 }} />}
                                      {col.isNotNull && <Chip label="NOT NULL" size="small" sx={{ bgcolor: 'error.main', color: 'error.contrastText', fontWeight: 700, height: 20, fontSize: '0.65rem', borderRadius: 1 }} />}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          </TabPanel>

          {/* TAB 2: QUERY HISTORY */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold" color="text.primary">Execution History</Typography>
                <Button size="small" color="error" onClick={() => { setHistory([]); localStorage.removeItem('dbQueryHistory'); }}>
                  Clear History
                </Button>
              </Box>

              {history.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                  <HistoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">No queries executed yet.</Typography>
                </Box>
              ) : (
                <Stack spacing={2} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' } }}>
                  {history.map((histQuery, idx) => (
                    <Card key={idx} variant="outlined" sx={{ flexShrink: 0, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.paper', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2, gap: 2 }}>
                        <Box sx={{ flexGrow: 1, p: 2, bgcolor: 'background.default', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', overflowX: 'auto', '&::-webkit-scrollbar': { height: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' } }}>
                          <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                            {histQuery}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                          <Button variant="contained" size="small" sx={{ textTransform: 'none', borderRadius: 1.5, boxShadow: 'none' }} onClick={() => {
                            setQuery(histQuery);
                            if (editorRef.current) editorRef.current.setValue(histQuery);
                            setActiveTab(0);
                          }}>
                            Load Editor
                          </Button>
                          <Button variant="outlined" color="warning" size="small" startIcon={<SaveIcon />} sx={{ textTransform: 'none', borderRadius: 1.5 }} onClick={() => handleSaveQueryClick(histQuery)}>
                            Save
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </TabPanel>

          {/* TAB 3: SAVED QUERIES */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold" color="text.primary">Saved Queries</Typography>
                <Button size="small" variant="outlined" onClick={fetchSavedQueries}>
                  Refresh
                </Button>
              </Box>

              {savedQueries.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                  <BookmarkIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">No saved queries yet.</Typography>
                </Box>
              ) : (
                <Stack spacing={2} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' } }}>
                  {savedQueries.map((saved) => (
                    <Card key={saved.id} variant="outlined" sx={{ flexShrink: 0, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.paper', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                      <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                          {saved.queryName}
                        </Typography>
                        <Tooltip title="Delete Saved Query">
                          <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => handleDeleteSavedQuery(saved.id)}>
                            <DeleteSweepIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2, gap: 2 }}>
                        <Box sx={{ flexGrow: 1, p: 2, bgcolor: 'background.default', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', overflowX: 'auto', '&::-webkit-scrollbar': { height: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' } }}>
                          <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                            {saved.queryText}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                          <Button variant="contained" size="small" sx={{ textTransform: 'none', borderRadius: 1.5, boxShadow: 'none' }} onClick={() => {
                            setQuery(saved.queryText);
                            if (editorRef.current) editorRef.current.setValue(saved.queryText);
                            setActiveTab(0);
                          }}>
                            Load Editor
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </TabPanel>

        </CardContent>
      </Card>

      {/* Save Query Dialog */}
      <Dialog open={saveQueryDialogOpen} onClose={() => setSaveQueryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Query</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Give your query a name so you can easily identify it later.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Query Name"
            type="text"
            fullWidth
            variant="outlined"
            value={queryToSaveName}
            onChange={(e) => setQueryToSaveName(e.target.value)}
          />
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 150, overflowY: 'auto' }}>
            <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
              {queryToSaveText}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSaveQueryDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmSaveQuery} variant="contained" disabled={!queryToSaveName.trim() || savingQuery}>
            {savingQuery ? 'Saving...' : 'Save Query'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Database Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => !backingUp && setBackupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Backup Database</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Important:</strong> The path specified below must be a valid path on the <strong>Database Server</strong> where SQL Server is installed (e.g. <code>192.168.1.28</code>).
          </Alert>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Enter the absolute file path where you want to save the <code>.bak</code> file.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Server File Path"
            type="text"
            fullWidth
            variant="outlined"
            value={backupPath}
            onChange={(e) => setBackupPath(e.target.value)}
            placeholder="C:\Backups\Autonoma_Backup.bak"
            disabled={backingUp}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBackupDialogOpen(false)} color="inherit" disabled={backingUp}>Cancel</Button>
          <Button onClick={handleBackup} variant="contained" disabled={!backupPath.trim() || backingUp}>
            {backingUp ? 'Backing Up...' : 'Run Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DbQuery;
