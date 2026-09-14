import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  IconButton,
  Grid,
  Divider,
  useTheme,
  TextField
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyIcon from '@mui/icons-material/Key';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axiosServices from '../../utils/axios';
import { formatDate } from '../../utils/BOSTimeUtils';
import MainCard from '../../ui-component/cards/MainCard';
import { BOSTextField, BOSDatePicker, btnSave, btnCancel, getDialogStyles, BOSPageHeader, BOSDataTable, BOSStatusChip } from '../../ui-component/bos';

export default function VendorLicensing() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dialogStyles = getDialogStyles(theme, isDark);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [expiryDate, setExpiryDate] = useState(() => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().split('T')[0];
  });
  const [privateKeyFile, setPrivateKeyFile] = useState(null);
  const [privateKeyPassword, setPrivateKeyPassword] = useState('');
  const [genError, setGenError] = useState('');

  // Check existing session on load
  useEffect(() => {
    const token = sessionStorage.getItem('vendorToken');
    if (token) {
      setIsAuthenticated(true);
      fetchClients(token);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axiosServices.post('/api/v1/internal-licensing/auth', { username, password });
      const { token } = response.data;
      sessionStorage.setItem('vendorToken', token);
      setIsAuthenticated(true);
      fetchClients(token);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or connection failure.');
    }
  };

  const handleLogout = async () => {
    const token = sessionStorage.getItem('vendorToken');
    try {
      await axiosServices.post('/api/v1/internal-licensing/logout', {}, {
        headers: { 'X-Vendor-Token': token }
      });
    } catch (e) {
      // Ignore network failure on logout
    }
    sessionStorage.removeItem('vendorToken');
    setIsAuthenticated(false);
    setClients([]);
  };

  const fetchClients = async (token) => {
    setLoading(true);
    try {
      const response = await axiosServices.get('/api/v1/internal-licensing/clients', {
        headers: { 'X-Vendor-Token': token }
      });
      setClients(response.data);
    } catch (err) {
      setError('Session expired or access denied.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGenerateModal = (client) => {
    setSelectedClient(client);
    setPrivateKeyFile(null);
    setPrivateKeyPassword('');
    setGenError('');
    setOpenModal(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setPrivateKeyFile(e.target.files[0]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenError('');

    if (!privateKeyFile) {
      setGenError('Please upload the Private Key signing file.');
      return;
    }

    const token = sessionStorage.getItem('vendorToken');
    const formData = new FormData();
    formData.append('clientCode', selectedClient.clientCode);
    formData.append('productCode', selectedClient.productCode);
    formData.append('expiryDate', expiryDate);
    formData.append('privateKeyFile', privateKeyFile);
    if (privateKeyPassword) {
      formData.append('privateKeyPassword', privateKeyPassword);
    }

    try {
      const response = await axiosServices.post('/api/v1/internal-licensing/generate', formData, {
        headers: {
          'X-Vendor-Token': token,
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob'
      });

      // Create a local URL for the downloaded blob and trigger saving
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'license.lic');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setOpenModal(false);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        err.response.data.text().then(text => {
          setGenError(text || 'Failed to generate license. Ensure key file and password are correct.');
        }).catch(() => {
          setGenError('Failed to generate license. Ensure key file and password are correct.');
        });
      } else {
        setGenError(err.response?.data || 'Failed to generate license. Ensure key file and password are correct.');
      }
    }
  };

  if (!user || user.userLevel < 5) {
    return <Navigate to="/access-denied" replace />;
  }

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'radial-gradient(circle, rgba(16,20,38,1) 0%, rgba(10,12,22,1) 100%)',
          p: 3
        }}
      >
        <Card sx={{ maxWidth: 450, width: '100%', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  p: 1.5,
                  borderRadius: '50%',
                  display: 'inline-flex',
                  mb: 1.5
                }}
              >
                <LockIcon fontSize="large" />
              </Box>
              <Typography variant="h5" fontWeight="bold">
                Vendor Control Panel
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Enter secure licensing credentials to access offline management
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <Stack spacing={2.5}>
                <TextField
                  label="Internal Username"
                  fullWidth
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <TextField
                  label="Secure Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ py: 1.2, fontWeight: 'bold' }}
                >
                  Verify Identity
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const columns = [
    { id: 'index', label: 'Sl. No.', minWidth: 70 },
    { id: 'clientName', label: 'Client Name', minWidth: 200 },
    { id: 'clientCode', label: 'Client Code', minWidth: 150 },
    { id: 'productCode', label: 'Product Assignment', minWidth: 180 },
    { id: 'status', label: 'Status', minWidth: 120 },
    { id: 'actions', label: 'Actions', minWidth: 150, align: 'right' }
  ];

  const renderCell = (col, row, idx) => {
    if (col.id === 'status') {
      return <BOSStatusChip status={row.status} />;
    }
    if (col.id === 'actions') {
      return (
        <Button
          variant="contained"
          size="small"
          startIcon={<KeyIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenGenerateModal(row);
          }}
          sx={{ borderRadius: 1.5 }}
        >
          Generate License
        </Button>
      );
    }
    if (col.id === 'clientCode' || col.id === 'productCode') {
      return <code>{row[col.id]}</code>;
    }
    return null;
  };

  return (
    <Box sx={{ p: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 145px)' }}>
      <BOSPageHeader
        title="Offline License Management"
        subtitle="Issue, cryptographically sign, and encrypt license packages for active Autonoma ERP clients."
        actions={
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ fontWeight: 'bold' }}
          >
            Exit Vendor Session
          </Button>
        }
      />

      <Box sx={{ p: 4, flex: '1 1 0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <MainCard content={false} sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 0', minHeight: 0 }}>
          <BOSDataTable
            columns={columns}
            rows={clients}
            loading={loading}
            renderCell={renderCell}
          />
        </MainCard>
      </Box>

      {/* License Generation Modal */}
      {selectedClient && (
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            backdrop: {
              sx: dialogStyles.backdrop
            }
          }}
          PaperProps={{
            sx: dialogStyles.paper
          }}
        >
          <form onSubmit={handleGenerate}>
            <DialogTitle sx={dialogStyles.titleBar}>
              <Typography variant="h4" fontWeight="bold" sx={{ color: isDark ? 'primary.main' : 'primary.dark' }}>
                Issue Offline License
              </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 2.5 }}>
              <Stack spacing={3}>
                {genError && (
                  <Alert severity="error" sx={{ borderRadius: 1.5 }}>
                    {genError}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <BOSTextField
                      label="Client Code"
                      fullWidth
                      value={selectedClient.clientCode}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <BOSTextField
                      label="Product Assignment"
                      fullWidth
                      value={selectedClient.productCode}
                      disabled
                    />
                  </Grid>
                </Grid>

                <BOSDatePicker
                  label="Expiration Date"
                  name="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                  fullWidth
                />

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  Signing Credentials
                </Typography>

                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'primary.light',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'primary.lighter',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'primary.light',
                      borderColor: 'primary.main'
                    }
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    accept=".key,.pem,.der"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <CloudUploadIcon fontSize="large" color="primary" />
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold', color: 'primary.dark' }}>
                    {privateKeyFile ? privateKeyFile.name : 'Upload RSA Private Key (*.key, *.pem, *.der)'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Supported: unencrypted PKCS#8 / PKCS#1 or encrypted PKCS#8 with passphrase.
                  </Typography>
                </Box>

                <BOSTextField
                  label="Private Key Password (If encrypted)"
                  type="password"
                  fullWidth
                  value={privateKeyPassword}
                  onChange={(e) => setPrivateKeyPassword(e.target.value)}
                  placeholder="Leave empty if signing key is unencrypted"
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
              <Button
                onClick={() => setOpenModal(false)}
                variant="contained"
                sx={btnCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<KeyIcon />}
                sx={btnSave}
                data-shortcut="verify"
              >
                Sign & Encrypt License
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Box>
  );
}
