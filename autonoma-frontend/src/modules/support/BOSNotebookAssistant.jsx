import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Button,
  Checkbox,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Paper,
  InputAdornment,
  Avatar,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import axios from 'utils/axios';
import {
  IconNotebook,
  IconPlus,
  IconSend,
  IconDotsVertical,
  IconMenu2,
  IconAdjustmentsHorizontal,
  IconThumbUp,
  IconThumbDown,
  IconCopy,
  IconPin,
  IconGlobe,
  IconChevronRight,
  IconChevronLeft,
  IconSearch,
  IconLink,
  IconBookmark,
  IconArrowLeft,
  IconGridPattern,
  IconLayoutList,
  IconSelector,
  IconHeadphones,
  IconCircleCheck,
  IconPlayerPlay,
  IconPlayerPause,
  IconTrash,
  IconUpload,
  IconShare
} from '@tabler/icons-react';

// Styled Components for Dashboard
const DashboardCard = styled(Paper)(({ bordercolor }) => ({
  backgroundColor: 'transparent',
  border: `1px solid ${bordercolor}`,
  borderRadius: '16px',
  padding: '20px',
  height: '220px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  cursor: 'pointer',
  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  boxShadow: 'none',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: '#3b82f6'
  }
}));

const FeaturedCard = styled(Paper)(({ bg, bordercolor }) => ({
  background: bg || 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
  borderRadius: '16px',
  padding: '24px',
  height: '220px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  border: `1px solid ${bordercolor}`,
  transition: 'transform 180ms ease',
  boxShadow: 'none',
  '&:hover': {
    transform: 'translateY(-2px)'
  }
}));

const templates = [
  {
    id: 'template-qms',
    title: 'ISO 9001 Quality Compliance',
    description: 'Pre-loaded template with ISO 9001:2015 clauses, audit notes, and compliance policies.',
    bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    icon: <IconCircleCheck size={28} style={{ color: '#fff' }} />,
    notes: [
      {
        title: 'ISO 9001:2015 Quality Policy',
        content: 'Our organization is committed to providing products and services that exceed customer expectations. We achieve this by: 1. Adhering strictly to regulatory requirements. 2. Engaging in continuous process improvements. 3. Implementing rigorous risk-based assessments across all engineering divisions.'
      },
      {
        title: 'Audit Guidance Note',
        content: 'Internal audits must be scheduled at least once every quarter. Any non-conformances (NCRs) must be logged in the QMS module and tracked until corrective actions (CAPAs) are fully verified and closed.'
      }
    ]
  },
  {
    id: 'template-erp',
    title: 'ERP Administration Guide',
    description: 'System deployment guide detailing port bindings, database migrations, and file storage rules.',
    bg: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    icon: <IconAdjustmentsHorizontal size={28} style={{ color: '#fff' }} />,
    notes: [
      {
        title: 'BOS Architecture Parameters',
        content: 'The Spring Boot backend binds to port 8081. Local upload files are saved to the BOS_DOCUMENTS folder, and raw file uploads are processed on-the-fly into extracted text context for the AI.'
      },
      {
        title: 'Database Migrations',
        content: 'All schema and master data changes must use SQL scripts placed in the dbscripts folder. Pending scripts are executed automatically on startup by SqlMigrationRunner.'
      }
    ]
  },
  {
    id: 'template-hr',
    title: 'HR Policy & Onboarding',
    description: 'Employee handbook guidelines mapping onboarding tracks and standard leaves policies.',
    bg: 'linear-gradient(135deg, #581c87 0%, #a855f7 100%)',
    icon: <IconLayoutList size={28} style={{ color: '#fff' }} />,
    notes: [
      {
        title: 'Leaves & Holidays Policy',
        content: 'Employees receive 15 earned leaves, 12 sick leaves, and 10 casual leaves annually. Leave applications require approval from the immediate manager followed by HR department release.'
      },
      {
        title: 'Onboarding Track Checklist',
        content: 'New hire onboarding consists of: Day 1 - Credentials & Asset assignment; Day 2 - Security orientation & training; Week 1 - First project assignment and mentor coupling.'
      }
    ]
  }
];

export default function BOSNotebookAssistant() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Dynamic colors matching user theme toggles
  const currentBgColor = isDark ? '#0c0d0e' : '#f3f4f6';
  const currentPanelBg = isDark ? '#161719' : '#ffffff';
  const currentBorder = isDark ? '#28292c' : '#e5e7eb';
  const currentTextPrimary = isDark ? '#f1f5f9' : '#111827';
  const currentTextSecondary = isDark ? '#94a3b8' : '#4b5563';
  const currentBtnBg = isDark ? '#ffffff' : '#111827';
  const currentBtnText = isDark ? '#000000' : '#ffffff';
  const currentCardBg = isDark ? '#222326' : '#f9fafb';
  const currentCitationBg = isDark ? '#2d2f36' : '#e5e7eb';
  const chatInputBg = isDark ? '#1d1e22' : '#f9fafb';

  // State Management
  const [currentView, setCurrentView] = useState('dashboard');
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [sources, setSources] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedCitation, setSelectedCitation] = useState(null);
  
  // Loading & Action states
  const [loadingNotebooks, setLoadingNotebooks] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState(false);

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmpId, setShareEmpId] = useState('');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Audio briefing preview simulator state
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  // Fetch all active notebooks
  const fetchNotebooks = async () => {
    setLoadingNotebooks(true);
    try {
      const res = await axios.get('/api/support/notebook');
      setNotebooks(res.data || []);
    } catch (error) {
      console.error('Failed to fetch notebooks:', error);
    } finally {
      setLoadingNotebooks(false);
    }
  };

  // Create a new notebook
  const handleCreateNotebook = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await axios.post('/api/support/notebook', {
        title: newTitle,
        description: newDescription
      });
      setCreateDialogOpen(false);
      setNewTitle('');
      setNewDescription('');
      fetchNotebooks();
      handleOpenNotebook(res.data);
    } catch (error) {
      console.error('Failed to create notebook:', error);
    }
  };

  // Create notebook from template
  const handleCreateFromTemplate = async (tpl) => {
    try {
      const res = await axios.post('/api/support/notebook', {
        title: tpl.title,
        description: tpl.description
      });
      const newNb = res.data;

      // Add template notes in parallel
      await Promise.all(
        tpl.notes.map(note =>
          axios.post(`/api/support/notebook/${newNb.id}/notes`, {
            title: note.title,
            content: note.content
          })
        )
      );

      fetchNotebooks();
      handleOpenNotebook(newNb);
    } catch (error) {
      console.error('Failed to create notebook from template:', error);
    }
  };

  // Delete notebook
  const handleDeleteNotebook = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this notebook?')) return;
    try {
      await axios.delete(`/api/support/notebook/${id}`);
      fetchNotebooks();
      if (selectedNotebook && selectedNotebook.id === id) {
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Failed to delete notebook:', error);
    }
  };

  // Open active notebook workspace
  const handleOpenNotebook = async (notebook) => {
    setSelectedNotebook(notebook);
    setCurrentView('workspace');
    const welcomeMsg = {
      id: 'welcome',
      sender: 'ai',
      text: `Welcome to your "${notebook.title}" workspace! Upload PDFs/Word/Excel documents, scrape URLs, or write notes. I am fully grounded in your custom documents and live ERP databases.`
    };
    setChatMessages([welcomeMsg]);
    fetchNotebookContent(notebook.id);
    fetchChatHistory(notebook.id, welcomeMsg);
  };

  // Fetch persistent chat log for active notebook workspace
  const fetchChatHistory = async (notebookId, welcomeMsg) => {
    try {
      const res = await axios.get(`/api/support/notebook/${notebookId}/chat`);
      if (res.data && res.data.length > 0) {
        const historyMsgs = res.data.map(m => {
          let parsedCitations = [];
          if (m.citationsJson) {
            try {
              const rawCits = JSON.parse(m.citationsJson);
              if (Array.isArray(rawCits)) {
                parsedCitations = rawCits.map((c, idx) => ({
                  index: idx + 1,
                  source: c,
                  excerpt: 'Grounding citation referenced by the model'
                }));
              }
            } catch (e) {
              console.error('Failed to parse citations:', e);
            }
          }
          return {
            id: m.id,
            sender: m.sender,
            text: m.text,
            citations: parsedCitations
          };
        });
        setChatMessages([welcomeMsg, ...historyMsgs]);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // Fetch sources and notes for active notebook
  const fetchNotebookContent = async (notebookId) => {
    try {
      const [sourcesRes, notesRes] = await Promise.all([
        axios.get(`/api/support/notebook/${notebookId}/sources`),
        axios.get(`/api/support/notebook/${notebookId}/notes`)
      ]);
      setSources((sourcesRes.data || []).map(s => ({ ...s, checked: true })));
      setSavedNotes(notesRes.data || []);
    } catch (error) {
      console.error('Failed to load notebook contents:', error);
    }
  };

  // Source selection mechanics
  const handleToggleSource = (id) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSources(prev => prev.map(s => ({ ...s, checked })));
  };

  const isAllSelected = sources.length > 0 && sources.every(s => s.checked);

  // File uploading handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedNotebook) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadLoading(true);
    try {
      await axios.post(`/api/support/notebook/${selectedNotebook.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchNotebookContent(selectedNotebook.id);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data || error.message));
    } finally {
      setUploadLoading(false);
    }
  };

  // URL scraping handler
  const handleScrapeUrl = async () => {
    if (!urlInput.trim() || !selectedNotebook) return;
    setScrapeLoading(true);
    try {
      await axios.post(`/api/support/notebook/${selectedNotebook.id}/scrape-url`, { url: urlInput });
      setUrlDialogOpen(false);
      setUrlInput('');
      fetchNotebookContent(selectedNotebook.id);
    } catch (error) {
      console.error('Scrape failed:', error);
      alert('Scraping failed: ' + (error.response?.data || error.message));
    } finally {
      setScrapeLoading(false);
    }
  };

  // Save AI response or custom content to notes
  const handleSaveNote = async (title, content) => {
    if (!selectedNotebook) return;
    try {
      await axios.post(`/api/support/notebook/${selectedNotebook.id}/notes`, { title, content });
      fetchNotebookContent(selectedNotebook.id);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`/api/support/notebook/notes/${noteId}`);
      if (selectedNotebook) fetchNotebookContent(selectedNotebook.id);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Share notebook
  const handleShareNotebook = async () => {
    if (!shareEmpId || !selectedNotebook) return;
    try {
      await axios.post(`/api/support/notebook/${selectedNotebook.id}/share`, {
        sharedWithEmpId: shareEmpId,
        permissionLevel: shareLevel
      });
      setShareDialogOpen(false);
      setShareEmpId('');
      alert('Notebook shared successfully!');
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to share: ' + (error.response?.data || error.message));
    }
  };

  // Send query to Gemini AI grounded in sources
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedNotebook) return;
    const userMsg = { id: Date.now(), sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const queryText = chatInput;
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await axios.post('/api/support/notebook/query', {
        notebookId: selectedNotebook.id,
        query: queryText
      });
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.data.answer,
        citations: (res.data.citations || []).map((c, idx) => ({
          index: idx + 1,
          source: c,
          excerpt: 'Grounding citation referenced by the model'
        }))
      }]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Sorry, I failed to process that query: ' + (error.response?.data?.message || error.message)
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Citation and markdown formatting parser
  const renderMessageText = (msg) => {
    const text = msg.text || '';
    const citations = msg.citations || [];
    const lines = text.split('\n');

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
        {lines.map((line, lineIdx) => {
          const cleanLine = line.trim();
          if (!cleanLine) return <Box key={lineIdx} sx={{ height: '0.4rem' }} />;

          let isListItem = false;
          let listPrefix = '';

          // Check for numbered list (e.g., "1. ")
          const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
          // Check for bullet list (e.g., "- " or "* ")
          const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);

          let lineContent = line;
          let indent = 0;

          if (numberedMatch) {
            isListItem = true;
            listPrefix = numberedMatch[2] + '. ';
            lineContent = numberedMatch[3];
            indent = numberedMatch[1].length;
          } else if (bulletMatch) {
            isListItem = true;
            listPrefix = '• ';
            lineContent = bulletMatch[2];
            indent = bulletMatch[1].length;
          }

          // Parse inline elements (Bold, Code, Citations)
          const parseInline = (str) => {
            // Regex matches `code`, **bold**, or [1]
            const tokenRegex = /(\`[^\`]+\`|\*\*[^\*]+\*\*|\[\d+\])/g;
            const parts = str.split(tokenRegex);

            return parts.map((part, partIdx) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                const codeVal = part.substring(1, part.length - 1);
                return (
                  <Box
                    key={partIdx}
                    component="code"
                    sx={{
                      fontFamily: 'monospace',
                      backgroundColor: isDark ? '#2d2f36' : '#f1f5f9',
                      px: 0.6,
                      py: 0.2,
                      borderRadius: '4px',
                      fontSize: '0.85em',
                      color: isDark ? '#f43f5e' : '#e11d48'
                    }}
                  >
                    {codeVal}
                  </Box>
                );
              } else if (part.startsWith('**') && part.endsWith('**')) {
                const boldVal = part.substring(2, part.length - 2);
                return (
                  <Box
                    key={partIdx}
                    component="span"
                    sx={{
                      fontWeight: 800,
                      color: isDark ? '#60a5fa' : '#2563eb'
                    }}
                  >
                    {boldVal}
                  </Box>
                );
              } else if (part.startsWith('[') && part.endsWith(']')) {
                const citNumStr = part.substring(1, part.length - 1);
                const idx = parseInt(citNumStr, 10);
                const cit = citations.find(c => c.index === idx);
                return (
                  <Tooltip title={cit ? cit.source : 'Citation'} key={partIdx}>
                    <Box
                      component="span"
                      onClick={() => cit && setSelectedCitation(cit)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: currentCitationBg,
                        color: currentTextPrimary,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        cursor: 'pointer',
                        border: `1px solid ${currentBorder}`,
                        mx: 0.5,
                        verticalAlign: 'middle'
                      }}
                    >
                      {citNumStr}
                    </Box>
                  </Tooltip>
                );
              }
              return part;
            });
          };

          if (isListItem) {
            return (
              <Box key={lineIdx} sx={{ display: 'flex', pl: indent * 2 + 1, alignItems: 'flex-start', mb: 0.5 }}>
                <Box
                  component="span"
                  sx={{
                    fontWeight: 800,
                    color: isDark ? '#60a5fa' : '#2563eb',
                    mr: 1,
                    userSelect: 'none',
                    minWidth: '1.2rem'
                  }}
                >
                  {listPrefix}
                </Box>
                <Typography variant="body1" component="span" sx={{ lineHeight: 1.7, fontSize: '0.95rem', color: msg.sender === 'user' ? currentTextPrimary : currentTextSecondary }}>
                  {parseInline(lineContent)}
                </Typography>
              </Box>
            );
          }

          return (
            <Typography key={lineIdx} variant="body1" sx={{ lineHeight: 1.7, fontSize: '0.95rem', color: msg.sender === 'user' ? currentTextPrimary : currentTextSecondary }}>
              {parseInline(line)}
            </Typography>
          );
        })}
      </Box>
    );
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  // ----------------------------------------------------
  // VIEW A: DASHBOARD VIEW
  // ----------------------------------------------------
  if (currentView === 'dashboard') {
    const featuredNotebooks = notebooks.filter(nb => nb.tags && nb.tags.toLowerCase().includes('featured'));
    const myNotebooks = notebooks.filter(nb => !nb.tags || !nb.tags.toLowerCase().includes('featured'));

    return (
      <Box sx={{ height: 'calc(100vh - 145px)', backgroundColor: currentBgColor, color: currentTextPrimary, p: 0, overflowY: 'auto' }}>
        
        {/* Hero Header Banner */}
        <Box sx={{ 
          px: 4, 
          py: 4, 
          background: isDark ? 'radial-gradient(circle at 10% 20%, rgba(30,32,40,0.4) 0%, rgba(12,13,14,0.7) 90%)' : 'radial-gradient(circle at 10% 20%, #f9fafb 0%, #f3f4f6 90%)',
          borderBottom: `1px solid ${currentBorder}`, 
          backgroundColor: currentPanelBg,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative grid pattern */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: isDark ? 0.05 : 0.02, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 42, height: 42, borderRadius: '12px', bgcolor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem', fontWeight: 900, boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>
                N
              </Box>
              <Box>
                <Typography variant="h2" sx={{ fontWeight: 850, fontSize: '1.65rem', mb: 0.5, letterSpacing: '-0.02em', color: currentTextPrimary }}>BOS Notebook Assistant</Typography>
                <Typography variant="body2" sx={{ color: currentTextSecondary, fontSize: '0.85rem' }}>
                  Analyze documents, write notes, and query live ERP transactions grounded by Gemini AI.
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                backgroundColor: currentBtnBg,
                color: currentBtnText,
                fontWeight: 700,
                borderRadius: '24px',
                px: 3,
                py: 1,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                '&:hover': { backgroundColor: isDark ? '#cbd5e1' : '#1e293b' }
              }}
            >
              Create notebook
            </Button>
          </Box>
        </Box>

        {/* 1. CREATION PRESETS SECTION */}
        <Box sx={{ px: 4, pt: 4, pb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, fontSize: '1.15rem', color: currentTextPrimary }}>Notebook Presets (Quick Start)</Typography>
          <Grid container spacing={3}>
            {templates.map((tpl) => (
              <Grid item xs={12} sm={6} md={4} key={tpl.id}>
                <FeaturedCard bg={tpl.bg} bordercolor={currentBorder} onClick={() => handleCreateFromTemplate(tpl)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                      {tpl.icon}
                    </Box>
                    <Chip label="PRESET" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 900, border: 'none' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#fff', fontSize: '1rem' }}>
                      {tpl.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                      {tpl.description}
                    </Typography>
                  </Box>
                </FeaturedCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 2. FEATURED WORKSPACES (REAL DB RECORDS) */}
        {featuredNotebooks.length > 0 && (
          <Box sx={{ px: 4, pt: 3, pb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, fontSize: '1.15rem', color: currentTextPrimary }}>Featured Workspaces</Typography>
            <Grid container spacing={3}>
              {featuredNotebooks.map((nb) => (
                <Grid item xs={12} sm={6} md={4} key={nb.id}>
                  <FeaturedCard 
                    bg={nb.title.toLowerCase().includes('quality') ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' : nb.title.toLowerCase().includes('ops') || nb.title.toLowerCase().includes('dev') || nb.title.toLowerCase().includes('admin') ? 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' : 'linear-gradient(135deg, #581c87 0%, #a855f7 100%)'} 
                    bordercolor={currentBorder} 
                    onClick={() => handleOpenNotebook(nb)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconNotebook size={24} style={{ color: '#fff' }} />
                      </Box>
                      <IconButton size="small" onClick={(e) => handleDeleteNotebook(nb.id, e)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#ef4444' } }}>
                        <IconTrash size={16} />
                      </IconButton>
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#fff', fontSize: '1.05rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {nb.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {nb.sourceCount || 0} sources {nb.shared ? '• Shared' : ''}
                      </Typography>
                    </Box>
                  </FeaturedCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* 3. MY WORKSPACES */}
        <Box sx={{ px: 4, pt: 3, pb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, fontSize: '1.15rem', color: currentTextPrimary }}>My Workspaces</Typography>
          
          {loadingNotebooks ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress color="inherit" />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Create Custom Workspace Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{
                    backgroundColor: currentPanelBg,
                    border: `2px dashed ${currentBorder}`,
                    borderRadius: '16px',
                    height: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    transition: 'border-color 150ms ease, background-color 150ms ease',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                    }
                  }}
                >
                  <Avatar sx={{ bgcolor: isDark ? '#222326' : '#f3f4f6', color: currentTextPrimary, mb: 1.5 }}>
                    <IconPlus size={24} />
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: currentTextPrimary }}>Create custom workspace</Typography>
                </Paper>
              </Grid>

              {/* Dynamic Notebooks list */}
              {myNotebooks.map((nb) => (
                <Grid item xs={12} sm={6} md={4} key={nb.id}>
                  <DashboardCard bordercolor={currentBorder} onClick={() => handleOpenNotebook(nb)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ width: 32, height: 32, bgcolor: isDark ? '#27292f' : '#eff6ff', border: `1px solid ${currentBorder}`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: isDark ? '#60a5fa' : '#2563eb' }}>
                        NB
                      </Box>
                      <IconButton size="small" onClick={(e) => handleDeleteNotebook(nb.id, e)} sx={{ color: currentTextSecondary, '&:hover': { color: '#ef4444' } }}>
                        <IconTrash size={16} />
                      </IconButton>
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.92rem', mb: 0.5, color: currentTextPrimary, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {nb.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: currentTextSecondary, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{nb.sourceCount || 0} sources</span>
                        {nb.shared && <Chip label="SHARED" size="small" sx={{ height: 14, fontSize: '0.5rem', fontWeight: 900, bgcolor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none' }} />}
                      </Typography>
                    </Box>
                  </DashboardCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Create Notebook Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
          <DialogTitle>Create New Notebook Workspace</DialogTitle>
          <DialogContent sx={{ minWidth: 350, display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Notebook Title"
              fullWidth
              variant="outlined"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateNotebook} variant="contained">Create</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ----------------------------------------------------
  // VIEW B: ACTIVE WORKSPACE VIEW
  // ----------------------------------------------------
  return (
    <Box sx={{ height: 'calc(100vh - 145px)', backgroundColor: currentBgColor, color: currentTextPrimary, display: 'flex', flexDirection: 'column', p: 0, overflow: 'hidden' }}>
      
      {/* 1. TOP HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderBottom: `1px solid ${currentBorder}`, backgroundColor: currentPanelBg }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => { setCurrentView('dashboard'); fetchNotebooks(); }} sx={{ color: currentTextPrimary, p: 0.5, border: `1px solid ${currentBorder}`, mr: 0.5 }}>
            <IconArrowLeft size={18} />
          </IconButton>
          <Box sx={{ width: 28, height: 28, borderRadius: '50%', border: `2.5px solid ${currentTextPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem' }}>
            N
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: currentTextPrimary }}>
            {selectedNotebook?.title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <Button
            variant="contained"
            startIcon={uploadLoading ? <CircularProgress size={16} color="inherit" /> : <IconUpload size={16} />}
            disabled={uploadLoading}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              backgroundColor: currentBtnBg,
              color: currentBtnText,
              fontWeight: 700,
              borderRadius: '24px',
              px: 2.5,
              textTransform: 'none'
            }}
          >
            Upload File
          </Button>

          <Button
            variant="outlined"
            startIcon={scrapeLoading ? <CircularProgress size={16} color="inherit" /> : <IconGlobe size={16} />}
            onClick={() => setUrlDialogOpen(true)}
            sx={{ borderColor: currentBorder, color: currentTextPrimary, borderRadius: '24px', textTransform: 'none', px: 2 }}
          >
            Link URL
          </Button>

          <Button
            variant="outlined"
            startIcon={<IconShare size={16} />}
            onClick={() => setShareDialogOpen(true)}
            sx={{ borderColor: currentBorder, color: currentTextPrimary, borderRadius: '24px', textTransform: 'none', px: 2 }}
          >
            Share
          </Button>
        </Box>
      </Box>

      {/* 2. THREE PANEL WORKSPACE */}
      <Box sx={{ display: 'flex', flex: 1, p: 1.5, gap: 1.5, minHeight: 0, overflow: 'hidden' }}>
        
        {/* PANEL 1: Sources Sidebar */}
        <Box sx={{ 
          width: leftPanelCollapsed ? '50px' : '320px', 
          transition: 'width 200ms ease', 
          height: '100%', 
          minWidth: 0, 
          flexShrink: 0 
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            backgroundColor: currentPanelBg, 
            border: `1px solid ${currentBorder}`, 
            borderRadius: '16px', 
            p: leftPanelCollapsed ? 1 : 2.5,
            alignItems: leftPanelCollapsed ? 'center' : 'stretch',
            overflow: 'hidden'
          }}>
            {leftPanelCollapsed ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', py: 1 }}>
                <IconButton size="small" onClick={() => setLeftPanelCollapsed(false)} sx={{ color: currentTextPrimary, border: `1px solid ${currentBorder}`, mb: 3, p: 0.5 }}>
                  <IconChevronRight size={18} />
                </IconButton>
                <Typography variant="caption" sx={{ 
                  fontWeight: 900, 
                  color: currentTextSecondary, 
                  writingMode: 'vertical-rl', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.15em',
                  transform: 'rotate(180deg)',
                  whiteSpace: 'nowrap'
                }}>
                  Sources ({sources.length})
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.05rem', color: currentTextPrimary }}>Sources</Typography>
                  <IconButton size="small" onClick={() => setLeftPanelCollapsed(true)} sx={{ color: currentTextSecondary }}>
                    <IconChevronLeft size={16} />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ color: currentTextSecondary, fontWeight: 700 }}>Select all</Typography>
                  <Checkbox checked={isAllSelected} onChange={handleSelectAll} size="small" />
                </Box>

                {/* Scrollable Sources List */}
                <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, mb: 2 }}>
                  <List disablePadding>
                    {sources.map((src) => (
                      <ListItem
                        key={src.id}
                        disablePadding
                        sx={{
                          mb: 1,
                          borderRadius: '12px',
                          '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {src.sourceType === 'URL' ? (
                            <Box sx={{ width: 18, height: 18, bgcolor: '#10b981', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.55rem', fontWeight: 800 }}>U</Box>
                          ) : (
                            <Box sx={{ width: 18, height: 18, bgcolor: '#3b82f6', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.55rem', fontWeight: 800 }}>F</Box>
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={src.sourceName}
                          primaryTypographyProps={{ variant: 'body2', sx: { color: currentTextPrimary, fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' } }}
                        />
                        <Checkbox checked={src.checked} onChange={() => handleToggleSource(src.id)} size="small" />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {/* Source metrics info card */}
                <Paper sx={{ p: 1.5, backgroundColor: currentCardBg, border: `1px solid ${currentBorder}`, borderRadius: '12px', flexShrink: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: currentTextSecondary }}>Workspace Grounding</Typography>
                    <Chip label="ONLINE" size="small" sx={{ height: 16, fontSize: '0.55rem', bgcolor: '#10b981', color: '#fff', fontWeight: 900 }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontSize: '0.72rem', color: currentTextPrimary, mb: 0.5 }}>
                    • Custom documents/links active: {sources.filter(s => s.checked).length}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.72rem', color: currentTextPrimary }}>
                    • Enterprise Knowledge system active
                  </Typography>
                </Paper>
              </>
            )}
          </Box>
        </Box>

        {/* PANEL 2: Chat Workspace */}
        <Box sx={{ flex: 1, height: '100%', minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: currentPanelBg, border: `1px solid ${currentBorder}`, borderRadius: '16px', p: 2.5, position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.05rem', color: currentTextPrimary }}>Chat</Typography>
            </Box>

            {/* Chat Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', mb: 8, pr: 0.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {chatMessages.map((msg) => (
                  <Box key={msg.id}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      {msg.sender === 'ai' && (
                        <Avatar sx={{ width: 24, height: 24, bgcolor: '#2196f3', fontSize: '0.7rem' }}>AI</Avatar>
                      )}
                      <Box sx={{ flex: 1, pl: msg.sender === 'user' ? 4 : 0 }}>
                        {renderMessageText(msg)}
                      </Box>
                    </Box>

                    {msg.sender === 'ai' && msg.id !== 'welcome' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, pl: 4 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<IconPin size={14} />}
                          onClick={() => handleSaveNote('Saved AI Response', msg.text)}
                          sx={{
                            borderColor: currentBorder,
                            color: currentTextPrimary,
                            borderRadius: '24px',
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            px: 2
                          }}
                        >
                          Save to note
                        </Button>
                        <IconButton size="small" sx={{ color: currentTextSecondary }} onClick={() => handleCopyText(msg.text)}><IconCopy size={16} /></IconButton>
                      </Box>
                    )}
                  </Box>
                ))}
                {chatLoading && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pl: 4 }}>
                    <CircularProgress size={16} color="inherit" />
                    <Typography variant="body2" sx={{ color: currentTextSecondary }}>Thinking...</Typography>
                  </Box>
                )}
                <div ref={chatEndRef} />
              </Box>
            </Box>

            {/* Bottom floating query box */}
            <Box sx={{ position: 'absolute', bottom: 15, left: 15, right: 15, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <TextField
                fullWidth
                placeholder="Ask a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={chatLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ gap: 1 }}>
                      <Chip label={`${sources.filter(s => s.checked).length} sources`} size="small" sx={{ backgroundColor: currentCitationBg, color: currentTextPrimary, fontWeight: 700 }} />
                      <IconButton
                        onClick={handleSendMessage}
                        disabled={chatLoading}
                        sx={{
                          backgroundColor: isDark ? '#27292f' : '#f1f5f9',
                          color: currentTextPrimary,
                          '&:hover': { backgroundColor: isDark ? '#3e4049' : '#e2e8f0' }
                        }}
                      >
                        <IconSend size={18} />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '28px',
                    backgroundColor: chatInputBg,
                    border: `1px solid ${currentBorder}`,
                    color: currentTextPrimary,
                    px: 1.5
                  }
                }}
              />
              <Typography variant="caption" sx={{ color: currentTextSecondary, textAlign: 'center', fontSize: '0.65rem' }}>
                BOS Notebook assistant is grounded in real ERP databases & user uploads.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* PANEL 3: Studio Panel */}
        <Box sx={{ 
          width: rightPanelCollapsed ? '50px' : '350px', 
          transition: 'width 200ms ease', 
          height: '100%', 
          minWidth: 0, 
          flexShrink: 0 
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            backgroundColor: currentPanelBg, 
            border: `1px solid ${currentBorder}`, 
            borderRadius: '16px', 
            p: rightPanelCollapsed ? 1 : 2.5,
            alignItems: rightPanelCollapsed ? 'center' : 'stretch',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {rightPanelCollapsed ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', py: 1 }}>
                <IconButton size="small" onClick={() => setRightPanelCollapsed(false)} sx={{ color: currentTextPrimary, border: `1px solid ${currentBorder}`, mb: 3, p: 0.5 }}>
                  <IconChevronLeft size={18} />
                </IconButton>
                <Typography variant="caption" sx={{ 
                  fontWeight: 900, 
                  color: currentTextSecondary, 
                  writingMode: 'vertical-rl', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.15em',
                  transform: 'rotate(180deg)',
                  whiteSpace: 'nowrap'
                }}>
                  Studio ({savedNotes.length})
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.05rem', color: currentTextPrimary }}>Studio</Typography>
                  <IconButton size="small" onClick={() => setRightPanelCollapsed(true)} sx={{ color: currentTextSecondary }}>
                    <IconChevronRight size={16} />
                  </IconButton>
                </Box>

                <Box sx={{ flex: 1, overflowY: 'auto', mb: 7, pr: 0.5 }}>
                  {/* Active Citation Panel */}
                  {selectedCitation && (
                    <Box sx={{ p: 1.5, borderRadius: '12px', backgroundColor: isDark ? 'rgba(33,150,243,0.08)' : '#eff6ff', border: '1px solid #bfdbfe', mb: 1.5 }}>
                      <Typography variant="caption" color="primary" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
                        {selectedCitation.source}
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: currentTextPrimary, fontSize: '0.8rem', lineHeight: 1.5 }}>
                        "{selectedCitation.excerpt}"
                      </Typography>
                    </Box>
                  )}

                  {/* Saved Notes List */}
                  <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentTextSecondary }}>Notes</Typography>
                    {savedNotes.map((note) => (
                      <Box key={note.id} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.2, borderRadius: '12px', backgroundColor: currentCardBg, border: `1px solid ${currentBorder}` }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Box sx={{ width: 28, height: 28, bgcolor: currentCitationBg, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTextPrimary }}>
                            <IconBookmark size={16} />
                          </Box>
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: currentTextPrimary }}>{note.title}</Typography>
                            <Typography variant="caption" sx={{ color: currentTextSecondary, fontSize: '0.68rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                              {note.content}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small" onClick={() => handleDeleteNote(note.id)} sx={{ color: currentTextSecondary, '&:hover': { color: '#ef4444' } }}>
                          <IconTrash size={16} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Bottom floating add note button */}
                <Box sx={{ position: 'absolute', bottom: 15, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      const title = prompt('Enter note title:');
                      const content = prompt('Enter note content:');
                      if (title && content) handleSaveNote(title, content);
                    }}
                    startIcon={<IconPlus size={18} style={{ color: currentBtnText }} />}
                    sx={{
                      backgroundColor: currentBtnBg,
                      color: currentBtnText,
                      fontWeight: 700,
                      borderRadius: '24px',
                      px: 3,
                      py: 0.8,
                      textTransform: 'none',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      '&:hover': { backgroundColor: isDark ? '#e2e8f0' : '#334155' }
                    }}
                  >
                    Add note
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Scrape URL Dialog */}
      <Dialog open={urlDialogOpen} onClose={() => setUrlDialogOpen(false)}>
        <DialogTitle>Link a Public URL to Workspace</DialogTitle>
        <DialogContent sx={{ minWidth: 350, display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="URL Link"
            fullWidth
            variant="outlined"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUrlDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScrapeUrl} variant="contained" disabled={scrapeLoading}>
            {scrapeLoading ? <CircularProgress size={16} color="inherit" /> : 'Link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Notebook Workspace</DialogTitle>
        <DialogContent sx={{ minWidth: 350, display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Employee ID to share with"
            fullWidth
            variant="outlined"
            value={shareEmpId}
            onChange={(e) => setShareEmpId(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleShareNotebook} variant="contained">Share</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
