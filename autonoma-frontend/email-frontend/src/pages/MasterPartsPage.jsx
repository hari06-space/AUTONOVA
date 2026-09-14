import { useEffect, useState } from 'react';
import { partsService } from '../api/services';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Box, IconButton, Chip, Alert, Snackbar, Paper
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

export default function MasterPartsPage() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ partCode: '', partName: '', description: '', category: '', unitPrice: '', uom: 'NOS', hsnCode: '', gstRate: '18', leadTimeDays: '0' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const load = () => {
    setLoading(true);
    partsService.getAll()
      .then(res => setParts(res.data || []))
      .catch(() => setParts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ partCode: '', partName: '', description: '', category: '', unitPrice: '', uom: 'NOS', hsnCode: '', gstRate: '18', leadTimeDays: '0' });
    setDialogOpen(true);
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({
      partCode: p.partCode || '', partName: p.partName || '', description: p.description || '',
      category: p.category || '', unitPrice: p.unitPrice?.toString() || '', uom: p.uom || 'NOS',
      hsnCode: p.hsnCode || '', gstRate: p.gstRate?.toString() || '18', leadTimeDays: p.leadTimeDays?.toString() || '0'
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...form,
        unitPrice: parseFloat(form.unitPrice) || 0,
        gstRate: parseFloat(form.gstRate) || 18,
        leadTimeDays: parseInt(form.leadTimeDays) || 0,
      };
      if (editItem) {
        await partsService.update(editItem.id, data);
        setSnackbar({ open: true, message: 'Part updated', severity: 'success' });
      } else {
        await partsService.create(data);
        setSnackbar({ open: true, message: 'Part created', severity: 'success' });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.message || 'Error saving', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this part?')) return;
    try {
      await partsService.delete(id);
      setSnackbar({ open: true, message: 'Part deleted', severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting', severity: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Box className="page-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0, mb: 3 }}>
        <div>
          <h1 className="page-header__title">Master Parts</h1>
          <p className="page-header__subtitle">Manage part codes, pricing, and specifications</p>
        </div>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Add Part
        </Button>
      </Box>

      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'rgba(108,99,255,0.05)', fontWeight: 700 } }}>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Price (₹)</TableCell>
                  <TableCell>UOM</TableCell>
                  <TableCell>HSN</TableCell>
                  <TableCell>GST %</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parts.map(p => (
                  <TableRow key={p.id} hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell>
                      <Chip label={p.partCode} size="small"
                            sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', bgcolor: 'rgba(108,99,255,0.1)', color: '#6C63FF' }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{p.partName}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{p.category || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {p.unitPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{p.uom || 'NOS'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{p.hsnCode || '-'}</TableCell>
                    <TableCell>{p.gstRate || 18}%</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(p)} sx={{ color: '#6C63FF' }}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(p.id)} sx={{ color: '#FF5C6C' }}>
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {parts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>No master parts yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
              PaperProps={{ sx: { bgcolor: '#161D30', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Part' : 'New Part'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Part Code" value={form.partCode} onChange={e => setForm({ ...form, partCode: e.target.value })} fullWidth required />
              <TextField label="Part Name" value={form.partName} onChange={e => setForm({ ...form, partName: e.target.value })} fullWidth required />
            </Box>
            <TextField label="Description" multiline rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} fullWidth />
              <TextField label="Unit Price (₹)" type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} fullWidth />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="UOM" value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value })} fullWidth />
              <TextField label="HSN Code" value={form.hsnCode} onChange={e => setForm({ ...form, hsnCode: e.target.value })} fullWidth />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="GST Rate (%)" type="number" value={form.gstRate} onChange={e => setForm({ ...form, gstRate: e.target.value })} fullWidth />
              <TextField label="Lead Time (days)" type="number" value={form.leadTimeDays} onChange={e => setForm({ ...form, leadTimeDays: e.target.value })} fullWidth />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
