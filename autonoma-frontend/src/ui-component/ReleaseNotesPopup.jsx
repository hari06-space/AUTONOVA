import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  FormControlLabel,
  Checkbox,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Stack
} from '@mui/material';

// third-party
import {
  IconX,
  IconSearch,
  IconChevronRight,
  IconDownload,
  IconVideo,
  IconPhoto,
  IconRocket,
  IconSettings,
  IconBug,
  IconPalette,
  IconBolt,
  IconShield,
  IconDatabase,
  IconAlertTriangle,
  IconBrandYoutube
} from '@tabler/icons-react';

// project imports
import axios from 'utils/axios';

const CATEGORY_STYLES = {
  'New Features': { label: 'New Feature', color: 'primary', icon: IconRocket },
  'Enhancements': { label: 'Enhancement', color: 'success', icon: IconSettings },
  'Bug Fixes': { label: 'Bug Fix', color: 'error', icon: IconBug },
  'UI/UX': { label: 'UI/UX', color: 'warning', icon: IconPalette },
  'Performance': { label: 'Performance', color: 'secondary', icon: IconBolt },
  'Security': { label: 'Security', color: 'info', icon: IconShield },
  'Database': { label: 'Database', color: 'default', icon: IconDatabase },
  'Deprecated': { label: 'Deprecated', color: 'default', icon: IconAlertTriangle }
};

export default function ReleaseNotesPopup({ open, onClose, isHistoryMode = false, releaseMaster }) {
  const theme = useTheme();
  
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load history if in history mode or if no release is provided
  useEffect(() => {
    if (open) {
      if (isHistoryMode || !releaseMaster) {
        axios.get('/api/releases/history')
          .then((res) => {
            const list = res.data || [];
            setHistoryList(list);
            if (list.length > 0) {
              setSelectedRelease(list[0]);
            }
          })
          .catch((err) => console.error('Failed to load release history:', err));
      } else {
        setSelectedRelease(releaseMaster);
      }
    }
  }, [open, isHistoryMode, releaseMaster]);

  if (!open || !selectedRelease) return null;

  const details = selectedRelease.details || [];
  
  // Filter by category and search query
  const filteredDetails = details.filter((item) => {
    const matchesTab = activeTab === 'All' || item.category === activeTab;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const categories = ['All', ...Object.keys(CATEGORY_STYLES).filter((cat) =>
    details.some((item) => item.category === cat)
  )];

  const handleAcknowledge = async () => {
    setSubmitting(true);
    try {
      await axios.post(`/api/releases/acknowledge/${selectedRelease.id}?dontShowAgain=${dontShowAgain}`);
      onClose();
    } catch (err) {
      console.error('Failed to acknowledge release:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v');
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const isCritical = selectedRelease.isCritical;

  return (
    <Dialog
      open={open}
      onClose={isCritical && !isHistoryMode ? undefined : onClose}
      maxWidth={isHistoryMode ? 'lg' : 'md'}
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(17, 17, 28, 0.95)' : 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.25)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          minHeight: '650px',
          maxHeight: '85vh'
        }
      }}
    >
      {/* Title Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(30, 30, 47, 0.6) 0%, rgba(17, 17, 28, 0.6) 100%)'
            : 'linear-gradient(135deg, rgba(235, 240, 255, 0.6) 0%, rgba(255, 255, 255, 0.6) 100%)'
        }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isHistoryMode ? "Release History" : "What's New in Autonova"}
            {isCritical && (
              <Chip
                label="Critical Update"
                color="error"
                size="small"
                sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', px: 1, height: '20px' }}
              />
            )}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550 }}>
            Version {selectedRelease.versionNo} &bull; Released on {new Date(selectedRelease.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        {(!isCritical || isHistoryMode) && (
          <IconButton onClick={onClose} sx={{ color: 'text.secondary', '&:hover': { bgcolor: alpha(theme.palette.text.secondary, 0.1) } }}>
            <IconX size={20} />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'row', height: 'calc(100% - 140px)', overflow: 'hidden' }}>
        {/* Left Sidebar (Only in History Mode) */}
        {isHistoryMode && historyList.length > 0 && (
          <Box
            sx={{
              width: '280px',
              borderRight: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              overflowY: 'auto',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(10, 10, 15, 0.3)' : 'rgba(0, 0, 0, 0.01)',
              p: 1.5
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', px: 2, py: 1, letterSpacing: '0.05em' }}>
              Past Versions
            </Typography>
            <List component="nav">
              {historyList.map((rel) => {
                const isActive = selectedRelease.id === rel.id;
                return (
                  <ListItemButton
                    key={rel.id}
                    selected={isActive}
                    onClick={() => {
                      setSelectedRelease(rel);
                      setActiveTab('All');
                      setSearchQuery('');
                    }}
                    sx={{
                      borderRadius: '12px',
                      mb: 0.5,
                      border: isActive ? '1px solid' : '1px solid transparent',
                      borderColor: isActive ? 'primary.main' : 'transparent',
                      bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.12)
                        }
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: isActive ? 800 : 650 }}>
                            {rel.versionNo}
                          </Typography>
                          {rel.isCritical && (
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          {new Date(rel.releaseDate).toLocaleDateString()}
                        </Typography>
                      }
                    />
                    <IconChevronRight size={16} style={{ opacity: isActive ? 1 : 0.3 }} />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        )}

        {/* Main Contents Panel */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', p: 3 }}>
          
          {/* Header search / category tabs */}
          <Box sx={{ mb: 2.5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ width: '100%', overflowX: 'auto', display: 'flex', gap: 0.8, pb: 0.5, '&::-webkit-scrollbar': { height: '4px' } }}>
              {categories.map((cat) => {
                const isSelected = activeTab === cat;
                const opt = CATEGORY_STYLES[cat];
                return (
                  <Chip
                    key={cat}
                    label={opt ? opt.label : cat}
                    icon={opt ? <opt.icon size={14} /> : null}
                    color={isSelected ? (opt ? opt.color : 'primary') : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => setActiveTab(cat)}
                    sx={{
                      fontWeight: 650,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      px: 0.5,
                      '&:hover': {
                        bgcolor: isSelected ? undefined : alpha(theme.palette.action.hover, 0.1)
                      }
                    }}
                  />
                );
              })}
            </Box>
            <TextField
              size="small"
              placeholder="Search release details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: { xs: '100%', sm: 260 }, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                    <IconSearch size={16} />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <Divider sx={{ mb: 2.5, opacity: 0.5 }} />

          {/* Release Notes List */}
          <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
            {selectedRelease.description && searchQuery === '' && activeTab === 'All' && (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: '16px',
                  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.02) : alpha(theme.palette.primary.main, 0.02),
                  border: '1px dashed',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
                }}
              >
                <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontWeight: 500 }}>
                  {selectedRelease.description}
                </Typography>
              </Box>
            )}

            {filteredDetails.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h4" color="textSecondary" sx={{ mb: 1, fontWeight: 700 }}>
                  No items found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Try adjusting your filters or search terms.
                </Typography>
              </Box>
            ) : (
              filteredDetails.map((item, idx) => {
                const styleOpt = CATEGORY_STYLES[item.category] || { label: item.category, color: 'default', icon: IconSettings };
                const isPdf = item.docUrl?.toLowerCase().endsWith('.pdf');
                const isImage = /\.(png|jpe?g|gif|webp)$/i.test(item.docUrl || '');
                return (
                  <Card
                    key={item.id || idx}
                    sx={{
                      mb: 2.5,
                      borderRadius: '18px',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                      boxShadow: 'none',
                      background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : '#fff',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
                        borderColor: alpha(theme.palette[styleOpt.color]?.main || theme.palette.primary.main, 0.3)
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Chip
                          label={styleOpt.label}
                          icon={<styleOpt.icon size={13} />}
                          color={styleOpt.color}
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: '8px', fontSize: '0.7rem' }}
                        />
                        {item.displayOrder > 0 && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Item #{item.displayOrder}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                        {item.title}
                      </Typography>
                      {item.description && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {item.description}
                        </Typography>
                      )}

                      {/* Media Render logic */}
                      {item.mediaType && (
                        <Box sx={{ mt: 2, borderRadius: '12px', overflow: 'hidden' }}>
                          {/* Before & After comparison */}
                          {item.mediaType === 'BEFORE_AFTER' && (item.beforeMediaUrl || item.afterMediaUrl) && (
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', p: 1, bgcolor: 'background.default' }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ border: '1px solid', borderColor: 'error.light', borderRadius: '8px', overflow: 'hidden' }}>
                                    <Box sx={{ bgcolor: 'error.light', color: 'error.contrastText', px: 1, py: 0.3, fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>
                                      BEFORE
                                    </Box>
                                    <CardMedia
                                      component="img"
                                      image={item.beforeMediaUrl ? `/api/files/view/${item.beforeMediaUrl}` : '/placeholder-before.png'}
                                      alt="Before version"
                                      sx={{ maxHeight: 220, objectFit: 'contain', bgcolor: 'grey.900' }}
                                    />
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ border: '1px solid', borderColor: 'success.light', borderRadius: '8px', overflow: 'hidden' }}>
                                    <Box sx={{ bgcolor: 'success.light', color: 'success.contrastText', px: 1, py: 0.3, fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>
                                      AFTER
                                    </Box>
                                    <CardMedia
                                      component="img"
                                      image={item.afterMediaUrl ? `/api/files/view/${item.afterMediaUrl}` : '/placeholder-after.png'}
                                      alt="After version"
                                      sx={{ maxHeight: 220, objectFit: 'contain', bgcolor: 'grey.900' }}
                                    />
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          )}

                          {/* YouTube / Vimeo Embedded */}
                          {item.mediaType === 'YOUTUBE' && item.mediaUrl && (
                            <Box sx={{ position: 'relative', pt: '56.25%', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                              <iframe
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                src={getYouTubeEmbedUrl(item.mediaUrl)}
                                title="Media Demonstration"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </Box>
                          )}

                          {/* Standard Screenshot / GIF image */}
                          {(item.mediaType === 'SCREENSHOT' || item.mediaType === 'GIF') && item.mediaUrl && (
                            <CardMedia
                              component="img"
                              image={`/api/files/view/${item.mediaUrl}`}
                              alt={item.title}
                              sx={{ maxHeight: 300, objectFit: 'contain', borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'grey.900' }}
                            />
                          )}

                          {/* Video Uploaded player */}
                          {item.mediaType === 'VIDEO' && item.mediaUrl && (
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
                              <video controls style={{ width: '100%', maxHeight: '300px', display: 'block', backgroundColor: '#000' }}>
                                <source src={`/api/files/view/${item.mediaUrl}`} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* PDF / Image Documents attachment auto-view */}
                      {item.docUrl && (
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {isPdf ? (
                            <Box sx={{
                              borderRadius: '16px',
                              border: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                              overflow: 'hidden',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                            }}>
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 2,
                                py: 1,
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                              }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <IconPhoto size={16} style={{ color: theme.palette.primary.main }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    Document Preview
                                  </Typography>
                                </Stack>
                                <Button
                                  component="a"
                                  href={`/api/files/view/${item.docUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                  variant="text"
                                  sx={{ textTransform: 'none', fontWeight: 650, py: 0.2, minWidth: 0, px: 1 }}
                                >
                                  Open in New Tab
                                </Button>
                              </Box>
                              <iframe
                                src={`/api/files/view/${item.docUrl}#toolbar=0`}
                                title={`Document Preview - ${item.title}`}
                                width="100%"
                                height="450px"
                                style={{ border: 'none', display: 'block' }}
                              />
                            </Box>
                          ) : isImage ? (
                            <Box sx={{
                              borderRadius: '16px',
                              overflow: 'hidden',
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              p: 1,
                              maxHeight: '400px'
                            }}>
                              <img
                                src={`/api/files/view/${item.docUrl}`}
                                alt="Document attachment"
                                style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '12px' }}
                              />
                            </Box>
                          ) : (
                            <Box sx={{
                              p: 2,
                              borderRadius: '16px',
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '12px',
                                  bgcolor: 'primary.light',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'primary.main'
                                }}>
                                  <IconDownload size={20} />
                                </Box>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {item.docUrl.split('/').pop()}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Office Document / Attachment
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <Button
                              component="a"
                              href={`/api/files/download/${item.docUrl}`}
                              download
                              variant="outlined"
                              size="small"
                              color="primary"
                              startIcon={<IconDownload size={14} />}
                              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 650 }}
                            >
                              Download Attachment/PDF Details
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Action Footer */}
      {!isHistoryMode && (
        <DialogActions
          sx={{
            p: 3,
            borderTop: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: theme.palette.mode === 'dark' ? 'rgba(10, 10, 15, 0.2)' : 'rgba(0, 0, 0, 0.01)'
          }}
        >
          <Box>
            {!isCritical && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Don't show again for this version
                  </Typography>
                }
              />
            )}
          </Box>
          <Stack direction="row" spacing={1.5}>
            {!isCritical && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={onClose}
                sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3 }}
              >
                Remind Me Later
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              disabled={submitting}
              onClick={handleAcknowledge}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                px: 4,
                boxShadow: theme.customShadows?.primary
              }}
            >
              {submitting ? 'Acknowledging...' : 'Acknowledge & Get Started'}
            </Button>
          </Stack>
        </DialogActions>
      )}
    </Dialog>
  );
}

ReleaseNotesPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isHistoryMode: PropTypes.bool,
  releaseMaster: PropTypes.object
};
