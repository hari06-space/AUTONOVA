import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, IconButton, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, MenuItem } from '@mui/material';
import { IconX, IconUpload, IconPlus, IconTrash, IconDownload, IconEye } from '@tabler/icons-react';
import { getDialogStyles, btnSave, btnCancel, btnDelete } from 'ui-component/bos/BOSStyles';
import TextField from 'ui-component/CustomTextField';
import { useColorScheme } from '@mui/material/styles';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import BOSFilePreview from 'ui-component/bos/BOSFilePreview';

export default function VendorAttachmentDialog({ open, handleClose, vendorId, pageCode, docTypes = [] }) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ds = getDialogStyles(theme, isDark);
  const dispatch = useDispatch();
  
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('File Upload');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewPath, setPreviewPath] = useState('');
  
  const fetchAttachments = useCallback(async () => {
    if (!vendorId || !pageCode) return;
    try {
      const res = await axios.get(`/api/master/vendor/attachment/${pageCode}/${vendorId}`);
      setAttachments(res.data || []);
    } catch (e) {
      console.error(e);
      dispatch(openSnackbar({ open: true, message: 'Failed to fetch attachments', variant: 'alert', alert: { color: 'error' } }));
    }
  }, [vendorId, pageCode, dispatch]);

  useEffect(() => {
    if (open) {
      setFile(null);
      setDocType('File Upload');
      fetchAttachments();
    }
  }, [open, fetchAttachments]);

  const handleUploadDirectly = async (selectedFiles, selectedType) => {
    if (!selectedFiles || selectedFiles.length === 0 || !vendorId || !pageCode) {
      dispatch(openSnackbar({ open: true, message: 'Please select a file to upload', variant: 'alert', alert: { color: 'warning' } }));
      return;
    }
    
    const formData = new FormData();
    Array.from(selectedFiles).forEach(file => {
      formData.append('files', file);
    });
    formData.append('docType', selectedType);

    setUploading(true);
    setDocType(selectedType); // Track which row is uploading
    try {
      await axios.post(`/api/master/vendor/attachment/${pageCode}/${vendorId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      dispatch(openSnackbar({ open: true, message: 'File(s) uploaded successfully', variant: 'alert', alert: { color: 'success' } }));
      setFile(null);
      fetchAttachments();
    } catch (e) {
      console.error(e);
      dispatch(openSnackbar({ open: true, message: 'Failed to upload file(s)', variant: 'alert', alert: { color: 'error' } }));
    } finally {
      setUploading(false);
      setDocType('');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/master/vendor/attachment/${id}`);
      dispatch(openSnackbar({ open: true, message: 'File deleted successfully', variant: 'alert', alert: { color: 'success' } }));
      fetchAttachments();
    } catch (e) {
      console.error(e);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete file', variant: 'alert', alert: { color: 'error' } }));
    }
  };
  
  const handleDownload = (path, fileName) => {
    if (!path) return;
    const url = `${import.meta.env.VITE_API_URL || window.location.origin}/api/files/download?path=${encodeURIComponent(path)}`;
    window.open(url, '_blank');
  };

  const handlePreview = (path, fileName) => {
    if (!path) return;
    const url = `${import.meta.env.VITE_API_URL || window.location.origin}/api/files/view?path=${encodeURIComponent(path)}`;
    setPreviewUrl(url);
    setPreviewTitle(fileName);
    setPreviewPath(path);
    setPreviewOpen(true);
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { ...ds.paper, minHeight: '60vh' } }}>
      <DialogTitle sx={ds.titleBar} component="div">
        <Typography variant="h5" component="span" sx={ds.titleText}>
          {pageCode === 'CUSTOMER_MASTER' ? 'Customer Attachments' : 'Vendor Attachments'}
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={ds.closeBtn}>
          <IconX size={24} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 4, pt: 2 }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'background.default' : 'primary.light' }}>
                <TableCell width={60} align="center" sx={{ fontWeight: 600 }}>S.No</TableCell>
                <TableCell width={250} sx={{ fontWeight: 600 }}>Document Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Uploaded Files & Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {docTypes.map((type, index) => {
                const existingFiles = attachments.filter(a => a.docType === type);

                const getDisplayName = (name) => {
                  if (!name) return '';
                  return name.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
                };

                return (
                  <TableRow key={type}>
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{type}</TableCell>
                    
                    <TableCell>
                      {existingFiles.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {existingFiles.map(file => (
                            <Box key={file.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, bgcolor: isDark ? 'background.default' : 'grey.50' }}>
                              <Box sx={{ flex: 1, pr: 2, overflow: 'hidden' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', mb: 0.5 }}>
                                  {getDisplayName(file.fileName)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  Uploaded on: {file.createdDate ? new Date(file.createdDate).toLocaleString() : '-'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <IconButton size="small" color="info" onClick={() => handlePreview(file.path, file.fileName)} title="Preview / View" sx={{ bgcolor: 'info.lighter' }}>
                                  <IconEye size={18} />
                                </IconButton>
                                <IconButton size="small" color="primary" onClick={() => handleDownload(file.path, file.fileName)} title="Download" sx={{ bgcolor: 'primary.lighter' }}>
                                  <IconDownload size={18} />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDelete(file.id)} title="Delete" sx={{ bgcolor: 'error.lighter' }}>
                                  <IconTrash size={18} />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {uploading && docType === type && (
                              <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mr: 2 }}>Uploading...</Typography>
                            )}
                            <Button 
                              variant="contained" 
                              color="primary"
                              component="label" 
                              size="small"
                              startIcon={<IconPlus size={16} />}
                              sx={{ textTransform: 'none', boxShadow: 'none' }}
                              disabled={uploading}
                            >
                              Add More
                              <input 
                                type="file" 
                                multiple
                                hidden 
                                onChange={(e) => { 
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleUploadDirectly(e.target.files, type);
                                  }
                                }} 
                              />
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                          {uploading && docType === type ? (
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>Uploading...</Typography>
                          ) : (
                            <Typography variant="body2" color="textSecondary">No files uploaded</Typography>
                          )}
                          <Button 
                            variant="outlined" 
                            component="label" 
                            size="small"
                            startIcon={<IconUpload size={16} />}
                            sx={{ textTransform: 'none' }}
                            disabled={uploading}
                          >
                            Choose File(s)
                            <input 
                              type="file" 
                              multiple
                              hidden 
                              onChange={(e) => { 
                                if (e.target.files && e.target.files.length > 0) {
                                  handleUploadDirectly(e.target.files, type);
                                }
                              }} 
                            />
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      {/* BOS File Preview (Supports PPTX, DOCX, XLSX, Images, etc) */}
      {previewOpen && (
        <BOSFilePreview
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewUrl('');
            setPreviewTitle('');
            setPreviewPath('');
          }}
          url={previewUrl}
          file={{ fileName: previewTitle, serverFileName: previewPath, isServer: true }}
        />
      )}
    </Dialog>
  );
}
