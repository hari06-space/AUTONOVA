import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconCamera,
  IconUpload,
  IconX,
  IconSparkles,
  IconCheck,
  IconPhoto,
  IconSearch,
  IconScan
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { getFileViewUrl } from 'utils/upload-helper';

export default function ProductVisualSearchModal({ open, onClose, onSelectProduct }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processFile = async (file) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSearching(true);
    setHasSearched(true);
    setResults([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/api/product-360/search-by-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && Array.isArray(res.data)) {
        setResults(res.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Visual search request error:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults([]);
    setHasSearched(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChooseProduct = (prod) => {
    if (onSelectProduct) {
      onSelectProduct(prod);
    }
    onClose();
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ zIndex: 9999 }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? '#0b1329' : '#ffffff',
          color: isDark ? '#ffffff' : 'inherit',
          backgroundImage: 'none',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box display="flex" alignItems="center" gap={1.2}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              bgcolor: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconScan size={20} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              Visual Product Search
              <Chip label="Lens AI" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f59e0b', color: '#000' }} />
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Upload a product photo, drawing, or sample part image to find matching catalog products
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {!previewUrl ? (
          /* Dropzone / Upload Area */
          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: `2px dashed ${theme.palette.primary.main}66`,
              borderRadius: 3,
              p: 5,
              textAlign: 'center',
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: isDark ? 'rgba(59,130,246,0.05)' : '#f0f9ff'
              }
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <IconCamera size={32} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Click to Upload or Drag & Drop Product Image
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Supports PNG, JPG, JPEG, WEBP photos from mobile camera or desktop
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconUpload size={18} />}
              sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
            >
              Choose Product Image
            </Button>
          </Box>
        ) : (
          /* Preview + Scanner + Search Results */
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, minHeight: 320 }}>
            {/* Left: Uploaded Photo Preview & Scan Laser Animation */}
            <Box
              sx={{
                width: { xs: '100%', md: 240 },
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 220,
                  borderRadius: 2.5,
                  overflow: 'hidden',
                  bgcolor: '#030712',
                  border: `2px solid ${theme.palette.primary.main}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={previewUrl}
                  alt="Uploaded target"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />

                {/* Laser Scanning Line Animation */}
                {searching && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: '3px',
                      bgcolor: '#3b82f6',
                      boxShadow: '0 0 12px #3b82f6, 0 0 20px #60a5fa',
                      animation: 'scanLine 1.5s infinite ease-in-out',
                      '@keyframes scanLine': {
                        '0%': { top: '5%' },
                        '50%': { top: '90%' },
                        '100%': { top: '5%' }
                      }
                    }}
                  />
                )}
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={handleReset}
                startIcon={<IconCamera size={16} />}
                fullWidth
                sx={{ borderRadius: 1.5, fontWeight: 700 }}
              >
                Upload Different Image
              </Button>
            </Box>

            {/* Right: Matched Products Results */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                  {searching ? 'Analyzing Visual Signatures...' : `Matched Products (${results.length})`}
                </Typography>
                {results.length > 0 && (
                  <Chip
                    label="Visual Match AI Active"
                    size="small"
                    color="success"
                    sx={{ fontSize: '0.65rem', height: 20, fontWeight: 800 }}
                  />
                )}
              </Box>

              {searching ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, flexGrow: 1 }}>
                  <CircularProgress size={36} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                    Matching visual perceptual hash against product catalog attachments...
                  </Typography>
                </Box>
              ) : results.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, flexGrow: 1 }}>
                  <IconPhoto size={40} color="gray" />
                  <Typography variant="body1" sx={{ fontWeight: 700, mt: 1 }}>
                    No direct visual matches found
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Try uploading a clearer photo or search by product code above.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, maxHeight: 340, overflowY: 'auto' }} className="p360-scroll">
                  {results.map((prod) => (
                    <Paper
                      key={prod.id}
                      elevation={0}
                      onClick={() => handleChooseProduct(prod)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: isDark ? 'rgba(59,130,246,0.08)' : '#f0f9ff',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* Thumbnail */}
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 1.5,
                            bgcolor: isDark ? '#030712' : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}
                        >
                          {prod.matchedImage ? (
                            <img
                              src={getFileViewUrl(prod.matchedImage)}
                              alt={prod.itemNo}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <IconPhoto size={24} color="gray" />
                          )}
                        </Box>

                        <Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.92rem' }}>
                              {prod.itemNo}
                            </Typography>
                            {prod.matchScore && (
                              <Chip
                                label={`${prod.matchScore.toFixed(0)}% Match`}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  bgcolor: prod.matchScore >= 90 ? '#22c55e' : '#f59e0b',
                                  color: '#ffffff'
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', color: isDark ? '#f8fafc' : '#334155' }}>
                            {prod.itemName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem' }}>
                            {prod.itemCategory} • {prod.uom} • Cost: ₹ {prod.itemCost ? Number(prod.itemCost).toFixed(2) : '0.00'}
                          </Typography>
                        </Box>
                      </Box>

                      <Button
                        variant="contained"
                        size="small"
                        sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: '0.72rem', textTransform: 'none' }}
                      >
                        Select
                      </Button>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
