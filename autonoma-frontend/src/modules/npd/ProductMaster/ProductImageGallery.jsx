import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, IconButton, Stack, useTheme, alpha, Button, Grid, Chip, Tooltip } from '@mui/material';
import { IconCloudUpload, IconX, IconEye, IconRefresh, IconPhotoPlus } from '@tabler/icons-react';
import { getFileViewUrl } from 'utils/upload-helper';

export default function ProductImageGallery({
  files = [],
  onChange,
  maxFiles = 5,
  module = 'PRODUCT_MASTER'
}) {
  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const processFiles = async (newFiles) => {
    if (!newFiles.length) return;
    const remainingSlots = maxFiles - files.length;
    if (remainingSlots <= 0) return;
    const filesToUpload = newFiles.slice(0, remainingSlots);

    try {
      const newEntries = filesToUpload.map((fileObj) => {
        const cleanName = (fileObj.name || '').replace(/\\/g, '/').split('/').pop();
        return {
          fileName: cleanName,
          file: fileObj, // RAW file to upload on save
          preview: URL.createObjectURL(fileObj),
          isNew: true
        };
      });

      const updatedFiles = [...files, ...newEntries];
      onChange(updatedFiles);
    } catch (err) {
      console.error('[ProductImageGallery] Processing error:', err);
    }
  };

  const handleReplaceFile = async (newFile) => {
    if (!newFile || replaceIndex === null) return;
    try {
      const cleanName = (newFile.name || '').replace(/\\/g, '/').split('/').pop();
      const newEntry = {
        fileName: cleanName,
        file: newFile,
        preview: URL.createObjectURL(newFile),
        isNew: true
      };
      const updatedFiles = [...files];
      updatedFiles[replaceIndex] = newEntry;
      onChange(updatedFiles);
      setReplaceIndex(null);
    } catch (err) {
      console.error('[ProductImageGallery] Replace error:', err);
    }
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (!e.clipboardData || !e.clipboardData.items) return;
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter(item => item.type.startsWith('image/'));
      if (imageItems.length > 0) {
        const filesToProcess = imageItems.map(item => item.getAsFile()).filter(f => f !== null);
        if (filesToProcess.length > 0) {
          processFiles(filesToProcess);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [files, maxFiles, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    processFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  }, [files, maxFiles]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files).filter(f => f.type.startsWith('image/')));
      e.target.value = null; // reset
    }
  };

  const handleReplaceInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleReplaceFile(e.target.files[0]);
      e.target.value = null; // reset
    }
  };

  const handleRemove = (index) => {
    const updated = [...files];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handlePreview = (file) => {
    const url = file.preview || getFileViewUrl(file.serverFileName || file.path || file.filePath);
    if (url) window.open(url, '_blank');
  };

  return (
    <Box sx={{ width: '100%' }}>
      
      {/* Hidden Inputs */}
      <input
        id="product-image-upload-main"
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />
      <input
        id="product-image-replace"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleReplaceInput}
      />

      {files.length === 0 ? (
        /* Empty State */
        <Box
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          sx={{
            py: 6, px: 2, textAlign: 'center', border: '1.5px dashed', borderColor: dragActive ? 'primary.main' : 'divider',
            borderRadius: 2, bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.05) : 'grey.50',
            transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}
        >
          <IconPhotoPlus size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No product images added</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>Upload images to showcase this product</Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<IconCloudUpload size={18} />}
            onClick={() => document.getElementById('product-image-upload-main')?.click()}
            sx={{ mb: 2, boxShadow: 'none' }}
          >
            Add Product Image
          </Button>
          <Typography variant="caption" color="text.disabled">JPG / PNG • Maximum 5MB</Typography>
        </Box>
      ) : (
        /* Gallery State */
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Product Images
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: files.length === maxFiles ? 'success.main' : 'text.secondary' }}>
              {files.length} / {maxFiles} images
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {/* Primary Image */}
            <Grid item xs={12} sm={5} md={4} lg={3}>
              <Box 
                onMouseEnter={() => setHoverIndex(0)}
                onMouseLeave={() => setHoverIndex(null)}
                sx={{ 
                  width: '100%', height: 240, position: 'relative', borderRadius: 2, overflow: 'hidden',
                  border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <img 
                  src={files[0].preview || getFileViewUrl(files[0].serverFileName || files[0].path || files[0].filePath)} 
                  alt="Primary" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
                <Chip 
                  label="PRIMARY" 
                  size="small" 
                  color="primary" 
                  sx={{ position: 'absolute', top: 8, left: 8, height: 20, fontSize: '0.65rem', fontWeight: 600 }} 
                />
                
                {/* Hover Overlay */}
                {hoverIndex === 0 && (
                  <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Preview"><IconButton size="small" onClick={() => handlePreview(files[0])} sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.200' } }}><IconEye size={16} /></IconButton></Tooltip>
                    <Tooltip title="Replace"><IconButton size="small" onClick={() => { setReplaceIndex(0); document.getElementById('product-image-replace')?.click(); }} sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.200' } }}><IconRefresh size={16} /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => handleRemove(0)} sx={{ bgcolor: 'error.main', color: '#fff', '&:hover': { bgcolor: 'error.dark' } }}><IconX size={16} /></IconButton></Tooltip>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Thumbnails & Add Button */}
            <Grid item xs={12} sm={7} md={8} lg={9}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                
                {files.slice(1).map((file, idx) => {
                  const actualIndex = idx + 1;
                  return (
                    <Box 
                      key={actualIndex}
                      onMouseEnter={() => setHoverIndex(actualIndex)}
                      onMouseLeave={() => setHoverIndex(null)}
                      sx={{ 
                        width: 112, height: 112, position: 'relative', borderRadius: 2, overflow: 'hidden',
                        border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <img 
                        src={file.preview || getFileViewUrl(file.serverFileName || file.path || file.filePath)} 
                        alt={`Thumbnail ${actualIndex}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                      />
                      
                      {/* Hover Overlay */}
                      {hoverIndex === actualIndex && (
                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, flexDirection: 'column' }}>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Preview"><IconButton size="small" onClick={() => handlePreview(file)} sx={{ bgcolor: 'background.paper', width: 24, height: 24, '&:hover': { bgcolor: 'grey.200' } }}><IconEye size={14} /></IconButton></Tooltip>
                            <Tooltip title="Replace"><IconButton size="small" onClick={() => { setReplaceIndex(actualIndex); document.getElementById('product-image-replace')?.click(); }} sx={{ bgcolor: 'background.paper', width: 24, height: 24, '&:hover': { bgcolor: 'grey.200' } }}><IconRefresh size={14} /></IconButton></Tooltip>
                          </Stack>
                          <Tooltip title="Delete"><IconButton size="small" onClick={() => handleRemove(actualIndex)} sx={{ bgcolor: 'error.main', color: '#fff', width: 24, height: 24, '&:hover': { bgcolor: 'error.dark' } }}><IconX size={14} /></IconButton></Tooltip>
                        </Box>
                      )}
                    </Box>
                  );
                })}

                {/* Add Image Tile */}
                {files.length < maxFiles && (
                  <Box
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => document.getElementById('product-image-upload-main')?.click()}
                    sx={{
                      width: 112, height: 112, border: '1px dashed', borderColor: dragActive ? 'primary.main' : 'divider',
                      borderRadius: 2, bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.02) }
                    }}
                  >
                    <IconCloudUpload size={24} color={theme.palette.primary.main} style={{ marginBottom: 4 }} />
                    <Typography variant="caption" color="primary.main" fontWeight={600}>Add Image</Typography>
                  </Box>
                )}

              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}
