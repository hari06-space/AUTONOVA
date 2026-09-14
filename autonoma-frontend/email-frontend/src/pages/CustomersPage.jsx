import { useEffect, useState } from 'react';
import { customerService } from '../api/services';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Box, IconButton, Chip, Alert, Snackbar, Paper
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', companyName: '', phone: '', gstNumber: '', city: '', state: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const load = () => {
    setLoading(true);
    customerService.getAll()
      .then(res => setCustomers(res.data || []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', email: '', companyName: '', phone: '', gstNumber: '', city: '', state: '' });
    setDialogOpen(true);
  };

  const openEdit = (c) => {
    setEditItem(c);
    setForm({ name: c.name || '', email: c.email || '', companyName: c.companyName || '', phone: c.phone || '', gstNumber: c.gstNumber || '', city: c.city || '', state: c.state || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await customerService.update(editItem.id, form);
        setSnackbar({ open: true, message: 'Customer updated', severity: 'success' });
      } else {
        await customerService.create(form);
        setSnackbar({ open: true, message: 'Customer created', severity: 'success' });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.message || 'Error saving', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await customerService.delete(id);
      setSnackbar({ open: true, message: 'Customer deleted', severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'Error deleting', severity: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Box className="page-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0, mb: 3 }}>
        <div>
          <h1 className="page-header__title">Customers</h1>
          <p className="page-header__subtitle">Manage customer profiles and contact details</p>
        </div>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Add Customer
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
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>GST</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map(c => (
                  <TableRow key={c.id} hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{c.email}</TableCell>
                    <TableCell>{c.companyName || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{c.phone || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{c.gstNumber || '-'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {[c.city, c.state].filter(Boolean).join(', ') || '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: '#6C63FF' }}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(c.id)} sx={{ color: '#FF5C6C' }}>
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No customers yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
              PaperProps={{ sx: { bgcolor: '#161D30', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Customer' : 'New Customer'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} fullWidth required />
            <TextField label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} fullWidth required />
            <TextField label="Company" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} fullWidth />
              <TextField label="GST Number" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} fullWidth />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} fullWidth />
              <TextField label="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} fullWidth />
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
