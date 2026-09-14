import { useState, useEffect } from 'react';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack,
  Tooltip,
  Paper as MuiPaper
} from '@mui/material';

// third-party
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconUpload,
  IconTrashX,
  IconDeviceFloppy,
  IconArrowUp,
  IconArrowDown,
  IconChevronRight,
  IconX
} from '@tabler/icons-react';

// project imports
import axios from 'utils/axios';

const CATEGORIES = [
  'New Features',
  'Enhancements',
  'Bug Fixes',
  'UI/UX',
  'Performance',
  'Security',
  'Database',
  'Deprecated'
];

const MEDIA_TYPES = [
  { value: '', label: 'No Media' },
  { value: 'SCREENSHOT', label: 'Screenshot / Image Upload' },
  { value: 'BEFORE_AFTER', label: 'Before vs After Slider' },
  { value: 'VIDEO', label: 'Video Upload (.mp4)' },
  { value: 'YOUTUBE', label: 'YouTube / Vimeo Video Link' },
  { value: 'GIF', label: 'GIF Demonstration' }
];

export default function ReleaseNotesManager() {
  const theme = useTheme();

  // List states
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [openForm, setOpenForm] = useState(false);
  const [editingRelease, setEditingRelease] = useState(null);

  // Form states
  const [versionNo, setVersionNo] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isCritical, setIsCritical] = useState(false);
  const [details, setDetails] = useState([]);

  // Git suggestions states
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [sinceDate, setSinceDate] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState({});

  const handleOpenSuggestions = () => {
    let defaultSince = '';
    if (releaseDate) {
      defaultSince = releaseDate;
    } else {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      defaultSince = date.toISOString().split('T')[0];
    }
    setSinceDate(defaultSince);
    setOpenSuggestions(true);
    fetchGitSuggestions(defaultSince);
  };

  const fetchGitSuggestions = (dateStr) => {
    setSuggestionsLoading(true);
    axios.get(`/api/releases/admin/suggest-commits?since=${dateStr}`)
      .then((res) => {
        const list = res.data || [];
        setSuggestions(list);
        const selections = {};
        list.forEach((_, idx) => {
          selections[idx] = true;
        });
        setSelectedSuggestions(selections);
      })
      .catch((err) => {
        console.error('Failed to fetch git suggestions:', err);
        alert('Failed to load suggestions: ' + (err.response?.data || err.message));
      })
      .finally(() => setSuggestionsLoading(false));
  };

  const handleImportSuggestions = () => {
    const imported = suggestions.filter((_, idx) => selectedSuggestions[idx]);
    if (imported.length === 0) {
      alert('Please select at least one item to import.');
      return;
    }

    const currentLength = details.length;
    const newDetails = [
      ...details,
      ...imported.map((item, idx) => ({
        category: item.category,
        title: item.title,
        description: item.description,
        mediaType: '',
        mediaUrl: '',
        beforeMediaUrl: '',
        afterMediaUrl: '',
        docUrl: '',
        displayOrder: currentLength + idx + 1
      }))
    ];
    setDetails(newDetails);
    setOpenSuggestions(false);
  };

  // Fetch list on load
  const fetchReleases = () => {
    setLoading(true);
    axios.get('/api/releases/admin/list')
      .then((res) => setReleases(res.data || []))
      .catch((err) => console.error('Failed to fetch releases:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleOpenCreate = () => {
    setEditingRelease(null);
    setVersionNo('');
    // set to current date yyyy-MM-dd
    const today = new Date().toISOString().split('T')[0];
    setReleaseDate(today);
    setTitle('');
    setDescription('');
    setIsActive(true);
    setIsCritical(false);
    setDetails([]);
    setOpenForm(true);
  };

  const handleOpenEdit = (release) => {
    setEditingRelease(release);
    setVersionNo(release.versionNo || '');
    setReleaseDate(release.releaseDate ? new Date(release.releaseDate).toISOString().split('T')[0] : '');
    setTitle(release.title || '');
    setDescription(release.description || '');
    setIsActive(release.isActive ?? true);
    setIsCritical(release.isCritical ?? false);
    setDetails(release.details ? [...release.details] : []);
    setOpenForm(true);
  };

  // Details management
  const handleAddDetail = () => {
    setDetails([
      ...details,
      {
        category: 'New Features',
        title: '',
        description: '',
        mediaType: '',
        mediaUrl: '',
        beforeMediaUrl: '',
        afterMediaUrl: '',
        docUrl: '',
        displayOrder: details.length + 1
      }
    ]);
  };

  const handleRemoveDetail = (index) => {
    const newDetails = [...details];
    newDetails.splice(index, 1);
    // Reorder displayOrder
    const reordered = newDetails.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));
    setDetails(reordered);
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  // Upload handler helper
  const handleFileUpload = async (index, field, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', 'releases');

    try {
      const res = await axios.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // The relative path is returned as a plain text string
      handleDetailChange(index, field, res.data);
    } catch (err) {
      console.error('File upload failed:', err);
      alert('Upload failed: ' + (err.response?.data || err.message));
    }
  };

  // Detail item order shifting
  const handleMoveDetail = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === details.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newDetails = [...details];

    // Swap elements
    const temp = newDetails[index];
    newDetails[index] = newDetails[targetIndex];
    newDetails[targetIndex] = temp;

    // Recalculate displayOrder
    const reordered = newDetails.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));
    setDetails(reordered);
  };

  // Save submit
  const handleSaveRelease = async () => {
    if (!versionNo.trim() || !releaseDate || !title.trim()) {
      alert('Please fill in version number, release date, and title.');
      return;
    }

    const payload = {
      id: editingRelease ? editingRelease.id : null,
      versionNo,
      releaseDate: new Date(releaseDate).toISOString(),
      title,
      description,
      isActive,
      isCritical,
      details: details.map((item, idx) => ({
        ...item,
        displayOrder: idx + 1
      }))
    };

    try {
      await axios.post('/api/releases/admin/save', payload);
      setOpenForm(false);
      fetchReleases();
    } catch (err) {
      console.error('Failed to save release:', err);
      alert('Error saving release notes: ' + (err.response?.data || err.message));
    }
  };

  // Delete
  const handleDeleteRelease = async (id) => {
    if (window.confirm('Are you sure you want to delete this release version? All read tracking and items will be deleted.')) {
      try {
        await axios.delete(`/api/releases/admin/${id}`);
        fetchReleases();
      } catch (err) {
        console.error('Failed to delete release:', err);
      }
    }
  };

  // Reset Reads / Force Show
  const handleResetReads = async (id) => {
    if (window.confirm('This will delete all read records for this version, forcing it to display as a login popup for all users again. Continue?')) {
      try {
        await axios.post(`/api/releases/admin/reset-read/${id}`);
        alert('Read records have been reset. Users will see the popup on their next login.');
      } catch (err) {
        console.error('Failed to reset reads:', err);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Title block */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 800 }}>
            Release Notes Manager
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Create, publish, and configure "What's New" release notes updates shown to users on login.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<IconPlus size={18} />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: '12px', fontWeight: 700, px: 3, py: 1 }}
        >
          Create Release Version
        </Button>
      </Box>

      {/* Grid List */}
      <Card sx={{ borderRadius: '18px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <TableContainer component={Paper} sx={{ borderRadius: '18px', boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Release Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Items Count</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="h5" color="textSecondary">Loading releases...</Typography>
                  </TableCell>
                </TableRow>
              ) : releases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="h5" color="textSecondary">No releases found. Click Create Release to get started.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                releases.map((rel) => (
                  <TableRow key={rel.id} hover>
                    <TableCell sx={{ fontWeight: 750 }}>{rel.versionNo}</TableCell>
                    <TableCell>{new Date(rel.releaseDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{rel.title}</TableCell>
                    <TableCell>{rel.details ? rel.details.length : 0} items</TableCell>
                    <TableCell>
                      <Chip
                        label={rel.isActive ? 'Active' : 'Inactive'}
                        color={rel.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: '8px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rel.isCritical ? 'Critical' : 'Standard'}
                        color={rel.isCritical ? 'error' : 'primary'}
                        variant={rel.isCritical ? 'filled' : 'outlined'}
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: '8px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Reset Read (Force Show to users)">
                          <IconButton onClick={() => handleResetReads(rel.id)} size="small" color="secondary">
                            <IconRefresh size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Release Notes">
                          <IconButton onClick={() => handleOpenEdit(rel)} size="small" color="primary">
                            <IconEdit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Release Notes">
                          <IconButton onClick={() => handleDeleteRelease(rel.id)} size="small" color="error">
                            <IconTrash size={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Save / Edit Dialog Modal Form */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.4rem' }}>
          {editingRelease ? `Edit Release notes: Version ${versionNo}` : 'Create Release Version'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Version Number (e.g. v2.5.0)"
                  value={versionNo}
                  onChange={(e) => setVersionNo(e.target.value)}
                  placeholder="v2.5.0"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Release Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Release Notes Header Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="June 2026 Features & Updates"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Release Overview/Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the core achievements of this deployment..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="success" />}
                  label={<Typography variant="subtitle1" sx={{ fontWeight: 650 }}>Release is ACTIVE (visible to users)</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} color="error" />}
                  label={<Typography variant="subtitle1" sx={{ fontWeight: 650 }}>Mark as CRITICAL (forces acknowledgment modal)</Typography>}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* List Details section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Release Item Details ({details.length})
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<IconRefresh size={16} />}
                  onClick={handleOpenSuggestions}
                  sx={{ borderRadius: '8px', fontWeight: 700 }}
                >
                  Suggest from Git
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<IconPlus size={16} />}
                  onClick={handleAddDetail}
                  sx={{ borderRadius: '8px', fontWeight: 700 }}
                >
                  Add Release Item
                </Button>
              </Stack>
            </Box>

            {details.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  textAlign: 'center',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: '16px'
                }}
              >
                <Typography color="textSecondary">No items added yet. Click Add Release Item to enter features or fixes.</Typography>
              </Box>
            ) : (
              details.map((item, idx) => (
                <MuiPaper
                  key={idx}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    mb: 2,
                    borderRadius: '16px',
                    borderColor: 'divider',
                    position: 'relative',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)'
                  }}
                >
                  {/* Action row */}
                  <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleMoveDetail(idx, 'up')} disabled={idx === 0}>
                      <IconArrowUp size={16} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleMoveDetail(idx, 'down')} disabled={idx === details.length - 1}>
                      <IconArrowDown size={16} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleRemoveDetail(idx)}>
                      <IconTrashX size={16} />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                          label="Category"
                          value={item.category}
                          onChange={(e) => handleDetailChange(idx, 'category', e.target.value)}
                        >
                          {CATEGORIES.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={9} sx={{ pr: 12 }}>
                      <TextField
                        fullWidth
                        label="Item Title"
                        value={item.title}
                        onChange={(e) => handleDetailChange(idx, 'title', e.target.value)}
                        placeholder="e.g. Cab Booking Approval Workflow"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Detailed Description"
                        value={item.description}
                        onChange={(e) => handleDetailChange(idx, 'description', e.target.value)}
                        placeholder="Provide deep details or user instructions here..."
                      />
                    </Grid>

                    {/* Media attachments */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Media Support</InputLabel>
                        <Select
                          label="Media Support"
                          value={item.mediaType || ''}
                          onChange={(e) => {
                            handleDetailChange(idx, 'mediaType', e.target.value);
                            // Clear inputs
                            handleDetailChange(idx, 'mediaUrl', '');
                            handleDetailChange(idx, 'beforeMediaUrl', '');
                            handleDetailChange(idx, 'afterMediaUrl', '');
                          }}
                        >
                          {MEDIA_TYPES.map((m) => (
                            <MenuItem key={m.value} value={m.value}>
                              {m.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Dynamic media inputs */}
                    {item.mediaType === 'YOUTUBE' && (
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          label="YouTube Video Link"
                          value={item.mediaUrl || ''}
                          onChange={(e) => handleDetailChange(idx, 'mediaUrl', e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </Grid>
                    )}

                    {(item.mediaType === 'SCREENSHOT' || item.mediaType === 'VIDEO' || item.mediaType === 'GIF') && (
                      <Grid item xs={12} sm={8}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<IconUpload size={16} />}
                            sx={{ textTransform: 'none', borderRadius: '8px' }}
                          >
                            Upload File
                            <input
                              type="file"
                              hidden
                              accept={
                                item.mediaType === 'VIDEO'
                                  ? 'video/mp4'
                                  : 'image/png, image/jpeg, image/gif'
                              }
                              onChange={(e) => handleFileUpload(idx, 'mediaUrl', e.target.files[0])}
                            />
                          </Button>
                          {item.mediaUrl ? (
                            <Typography variant="caption" noWrap sx={{ maxWidth: '350px', color: 'success.main', fontWeight: 600 }}>
                              Uploaded: {item.mediaUrl}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              No file selected (Supports PNG, JPG, GIF, or MP4)
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                    )}

                    {item.mediaType === 'BEFORE_AFTER' && (
                      <Grid item xs={12} sm={8}>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                startIcon={<IconUpload size={14} />}
                                sx={{ textTransform: 'none', borderRadius: '8px' }}
                              >
                                Upload Before
                                <input
                                  type="file"
                                  hidden
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(idx, 'beforeMediaUrl', e.target.files[0])}
                                />
                              </Button>
                              {item.beforeMediaUrl && (
                                <Typography variant="caption" noWrap sx={{ maxWidth: 80, color: 'text.secondary' }}>
                                  Uploaded
                                </Typography>
                              )}
                            </Stack>
                          </Grid>
                          <Grid item xs={6}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                startIcon={<IconUpload size={14} />}
                                sx={{ textTransform: 'none', borderRadius: '8px' }}
                              >
                                Upload After
                                <input
                                  type="file"
                                  hidden
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(idx, 'afterMediaUrl', e.target.files[0])}
                                />
                              </Button>
                              {item.afterMediaUrl && (
                                <Typography variant="caption" noWrap sx={{ maxWidth: 80, color: 'text.secondary' }}>
                                  Uploaded
                                </Typography>
                              )}
                            </Stack>
                          </Grid>
                        </Grid>
                      </Grid>
                    )}

                    {/* PDF Document attachment */}
                    <Grid item xs={12} sm={4}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Button
                          variant="outlined"
                          component="label"
                          color="secondary"
                          size="small"
                          startIcon={<IconUpload size={14} />}
                          sx={{ textTransform: 'none', borderRadius: '8px' }}
                        >
                          Attach PDF/Doc
                          <input
                            type="file"
                            hidden
                            accept=".pdf, .doc, .docx"
                            onChange={(e) => handleFileUpload(idx, 'docUrl', e.target.files[0])}
                          />
                        </Button>
                        {item.docUrl ? (
                          <Typography variant="caption" noWrap sx={{ maxWidth: 100, color: 'success.main', fontWeight: 600 }}>
                            Doc Attached
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            None (PDF)
                          </Typography>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </MuiPaper>
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            variant="outlined"
            onClick={() => setOpenForm(false)}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveRelease}
            startIcon={<IconDeviceFloppy size={18} />}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 4 }}
          >
            Save Release Notes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Git Suggestions Dialog */}
      <Dialog
        open={openSuggestions}
        onClose={() => setOpenSuggestions(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '20px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Auto-Suggest Release Items from Git</span>
          <IconButton size="small" onClick={() => setOpenSuggestions(false)}>
            <IconX size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1.5, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Commits Since Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={sinceDate}
                  onChange={(e) => {
                    setSinceDate(e.target.value);
                    fetchGitSuggestions(e.target.value);
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => fetchGitSuggestions(sinceDate)}
                  startIcon={<IconRefresh size={14} />}
                  sx={{ borderRadius: '8px', height: '40px' }}
                >
                  Reload
                </Button>
              </Grid>
            </Grid>
          </Box>

          {suggestionsLoading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">Fetching commits and generating suggestions...</Typography>
            </Box>
          ) : suggestions.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
              <Typography variant="body1" color="textSecondary">No commits found since this date.</Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: '350px', overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={suggestions.length > 0 && suggestions.every((_, idx) => selectedSuggestions[idx])}
                      indeterminate={
                        suggestions.some((_, idx) => selectedSuggestions[idx]) &&
                        !suggestions.every((_, idx) => selectedSuggestions[idx])
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const newSelections = {};
                        suggestions.forEach((_, idx) => {
                          newSelections[idx] = checked;
                        });
                        setSelectedSuggestions(newSelections);
                      }}
                    />
                  }
                  label={<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Select All ({suggestions.length})</Typography>}
                />
              </Box>
              <Divider sx={{ mb: 1 }} />
              {suggestions.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    py: 1,
                    px: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Checkbox
                    checked={!!selectedSuggestions[idx]}
                    onChange={(e) => {
                      setSelectedSuggestions({
                        ...selectedSuggestions,
                        [idx]: e.target.checked
                      });
                    }}
                    sx={{ mt: 0.5 }}
                  />
                  <Box sx={{ flex: 1, ml: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={item.category}
                        size="small"
                        color={
                          item.category === 'New Features' ? 'primary' :
                          item.category === 'Bug Fixes' ? 'error' :
                          item.category === 'UI/UX' ? 'warning' :
                          item.category === 'Performance' ? 'secondary' :
                          item.category === 'Enhancements' ? 'success' : 'default'
                        }
                        sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.65rem', height: '18px' }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.2 }}>
                      {item.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="outlined" onClick={() => setOpenSuggestions(false)} sx={{ borderRadius: '10px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleImportSuggestions}
            disabled={suggestionsLoading || suggestions.length === 0}
            sx={{ borderRadius: '10px', px: 3 }}
          >
            Import Selected
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
