import TextField from 'ui-component/CustomTextField';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, IconButton, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme } from '@mui/material';
import { IconX, IconUpload, IconPlus, IconPrinter, IconTrash } from '@tabler/icons-react';
import { getDialogStyles, btnSave, btnCancel, btnDelete } from 'ui-component/bos/BOSStyles';
import { useColorScheme } from '@mui/material/styles';

export default function UploadFileDialog({ open, handleClose, workItemData }) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ds = getDialogStyles(theme, isDark);
  
  const [file, setFile] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [addedItems, setAddedItems] = useState([]);
  
  useEffect(() => {
    if (open) {
      setAddedItems([]);
      setFile(null);
      setRemarks('');
    }
  }, [open]);

  const handleAdd = () => {
    if (!file) return;
    const newItem = {
      id: addedItems.length + 1,
      workItemNo: workItemData?.id || '-',
      fileName: file.name,
      attNo: addedItems.length + 1,
      inquiryNo: workItemData?.enquiryNo || '-',
      remarks: remarks
    };
    setAddedItems([...addedItems, newItem]);
    setFile(null);
    setRemarks('');
  };

  const handleDelete = (id) => {
    setAddedItems(addedItems.filter(item => item.id !== id));
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: ds.paper }}>
      <DialogTitle sx={ds.titleBar} component="div">
        <Typography variant="h5" component="span" sx={ds.titleText}>
          Upload New File For Work Item {workItemData?.id ? `#${workItemData.id}` : ''}
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={ds.closeBtn}>
          <IconX size={24} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 4, pt: 2 }}>
        <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1.5, mb: 3, bgcolor: isDark ? 'background.default' : 'primary.light', borderRadius: '12px', display: 'flex', gap: 2 }}>
          <Button variant="contained" component="label" sx={{ ...btnSave, bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }} startIcon={<IconPlus size={18} />}>
            Choose
            <input type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
          </Button>
          <Button variant="contained" disabled sx={{ ...btnCancel, opacity: 0.5 }} startIcon={<IconUpload size={18} />}>
            Upload
          </Button>
          <Button variant="contained" onClick={handleClose} sx={btnCancel} startIcon={<IconX size={18} />}>
            Cancel
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>File Name</Typography>
          <TextField size="small" value={file ? file.name : ''} disabled sx={{ width: 250, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Remarks</Typography>
          <TextField size="small" placeholder="Enter remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} sx={{ width: 250, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
          <Button variant="contained" onClick={handleAdd} disabled={!file} sx={{ ...btnSave, bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }} startIcon={<IconPlus size={18} />}>
            Add
          </Button>
        </Box>
        
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>#</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Work Item No</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Attachment</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Att.No</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Inquiry.No</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, py: 1.5 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {addedItems.length > 0 ? (
                addedItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.workItemNo}</TableCell>
                    <TableCell>{item.fileName}</TableCell>
                    <TableCell>{item.attNo}</TableCell>
                    <TableCell>{item.inquiryNo}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                        <IconTrash size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="left" sx={{ py: 3, color: 'text.secondary' }}>
                    No records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" onClick={handleClose} sx={{ ...btnCancel, px: 6 }} startIcon={<IconX size={18} />}>
            Close
          </Button>
          <Button variant="contained" disabled sx={{ ...btnCancel, bgcolor: 'grey.300', color: 'grey.600', px: 6 }} startIcon={<IconPrinter size={18} />}>
            Print
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
