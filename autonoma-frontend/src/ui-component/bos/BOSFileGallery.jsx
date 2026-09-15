import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  IconEye,
  IconTrash,
  IconFileDescription,
  IconX
} from '@tabler/icons-react';
import { getFileViewUrl } from 'utils/upload-helper';
import BOSFilePreview from './BOSFilePreview';

/**
 * BOSFileGallery - Standardized Attachment Gallery & Dialog Modal for Autonova ERP
 */
export const BOSFileGallery = ({
  open,
  onClose,
  files = [],
  onRemove,
  isEditing = false,
  title = 'Attached Supporting Documents',
  maxHeight = 360
}) => {
  const theme = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState({ url: '', name: '', type: '', content: '' });

  // If used as a Modal Dialog and open is false, render NOTHING in DOM
  if (open !== undefined && !open) {
    return null;
  }

  const handlePreview = (fileItem) => {
    const rawName = typeof fileItem === 'string' ? fileItem : (fileItem?.name || fileItem?.fileName || fileItem?.serverFileName || '');
    const fileObj = typeof fileItem === 'string'
      ? { name: rawName, fileName: rawName, serverFileName: rawName, isServer: true }
      : fileItem;
    setPreviewData(fileObj);
    setPreviewOpen(true);
  };

  const isImage = (file) => {
    const name = (file?.name || file?.fileName || (typeof file === 'string' ? file : '')).toLowerCase();
    const type = (file?.type || file?.fileType || '').toLowerCase();
    return type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
  };

  const getFileUrl = (file) => {
    if (typeof file === 'string') {
      return getFileViewUrl(file);
    }
    if (file?.isServer || file?.serverFileName) {
      const fileName = file.serverFileName || file.name;
      return getFileViewUrl(fileName);
    }
    if (file?.url) return file.url;
    return URL.createObjectURL(file instanceof File ? file : (file?.file || new Blob()));
  };

  const contentNode = (
    <Box sx={{ mt: 1, textAlign: 'left', maxHeight: maxHeight, overflow: 'auto', pr: 0.5 }}>
      {(!files || files.length === 0) ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
          No attachments found
        </Typography>
      ) : (
        files.map((file, i) => {
          const rawName = typeof file === 'string' ? file : (file?.name || file?.fileName || 'Unknown File');
          const isSvr = typeof file === 'string' || file?.isServer || file?.serverFileName;
          const img = isImage(file);

          let decodedName = rawName;
          try {
            decodedName = decodeURIComponent(rawName);
          } catch (e) {}

          let cleanName = decodedName.replace(/\\/g, '/').split('/').pop();
          const parts = cleanName.split('_');
          if (parts.length > 1 && (parts[0].length >= 15 || /^\d+$/.test(parts[0]) || /^[0-9a-fA-F-]+$/.test(parts[0]))) {
            cleanName = parts.slice(1).join('_');
          }
          const displayFileName = cleanName;

          return (
            <Box
              key={i}
              onClick={() => handlePreview(file)}
              sx={{
                display: 'flex', alignItems: 'center', p: 1, mb: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider',
                bgcolor: 'background.paper', cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' },
                position: 'relative', overflow: 'hidden', transition: 'all 0.2s ease'
              }}
            >
              {isSvr && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: 'success.main' }} />
              )}

              {img ? (
                <Tooltip
                  placement="right-start"
                  arrow
                  enterDelay={100}
                  leaveDelay={80}
                  slotProps={{
                    popper: {
                      modifiers: [{ name: 'offset', options: { offset: [0, 12] } }],
                      sx: { zIndex: 14000 }
                    },
                    tooltip: {
                      sx: {
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 6px 20px rgba(0,0,0,0.15)',
                        borderRadius: 3,
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        maxWidth: 'none',
                        pointerEvents: 'none'
                      }
                    }
                  }}
                  title={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 0.5 }}>
                      <Box
                        component="img"
                        src={getFileUrl(file)}
                        alt={displayFileName}
                        sx={{
                          width: 'auto',
                          maxWidth: { xs: 320, sm: 480, md: 540 },
                          maxHeight: { xs: 280, sm: 420, md: 480 },
                          minWidth: { xs: 180, sm: 260 },
                          minHeight: { xs: 120, sm: 180 },
                          borderRadius: 2,
                          objectFit: 'contain',
                          display: 'block',
                          bgcolor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                        }}
                      />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: 'text.primary',
                          fontSize: '0.85rem',
                          maxWidth: { xs: 300, sm: 460, md: 520 },
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {displayFileName}
                      </Typography>
                    </Box>
                  }
                >
                  <Box
                    component="img"
                    src={getFileUrl(file)}
                    sx={{ width: 42, height: 42, borderRadius: 1, objectFit: 'cover', mr: 2, border: '1px solid', borderColor: 'divider' }}
                  />
                </Tooltip>
              ) : (
                <Box sx={{ width: 42, height: 42, borderRadius: 1, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                  <IconFileDescription size={24} color={theme.palette.text.secondary} />
                </Box>
              )}

              <Box sx={{ flexGrow: 1, minWidth: 0, mr: 2 }}>
                <Tooltip title={rawName} arrow placement="top">
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      width: '100%'
                    }}
                  >
                    {displayFileName}
                  </Typography>
                </Tooltip>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', opacity: 0.8, fontStyle: file?.docDetails ? 'italic' : 'normal' }}>
                  {file?.docDetails || (isSvr ? 'Saved on Server' : 'Local Upload')}
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(file);
                  }}
                  sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                >
                  <IconEye size={16} />
                </IconButton>
                {isEditing && onRemove && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(i);
                    }}
                    sx={{ bgcolor: 'error.light', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                  >
                    <IconTrash size={16} />
                  </IconButton>
                )}
              </Stack>
            </Box>
          );
        })
      )}
    </Box>
  );

  // If open prop is passed, render inside a MUI Dialog
  if (open !== undefined) {
    return (
      <>
        <Dialog open={Boolean(open)} onClose={onClose} fullWidth maxWidth="sm">
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{title}</Typography>
            {onClose && (
              <IconButton onClick={onClose} size="small">
                <IconX size={20} />
              </IconButton>
            )}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            {contentNode}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5 }}>
            <Button onClick={onClose} variant="outlined" color="primary" sx={{ borderRadius: '8px', fontWeight: 700 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Shared File Preview */}
        <BOSFilePreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          file={previewData}
          allFiles={files}
          onNavigate={(newFile) => setPreviewData(newFile)}
        />
      </>
    );
  }

  // Otherwise render inline content
  return (
    <Box>
      {contentNode}
      <BOSFilePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewData}
        allFiles={files}
        onNavigate={(newFile) => setPreviewData(newFile)}
      />
    </Box>
  );
};

BOSFileGallery.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  files: PropTypes.array,
  onRemove: PropTypes.func,
  isEditing: PropTypes.bool,
  title: PropTypes.string,
  maxHeight: PropTypes.number
};

export default BOSFileGallery;
