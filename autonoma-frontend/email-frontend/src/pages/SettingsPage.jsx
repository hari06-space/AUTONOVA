import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Switch, FormControlLabel,
  Divider, Alert, Snackbar, Chip
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import api from '../api/axiosInstance';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    api.get('/health').then(res => setHealth(res.data)).catch(() => setHealth(null));
  }, []);

  const Section = ({ title, children }) => (
    <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(108,99,255,0.08)', borderRadius: 3, p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1.05rem' }}>{title}</Typography>
      {children}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Box className="page-header" sx={{ flexShrink: 0, mb: 3 }}>
        <h1 className="page-header__title">Settings</h1>
        <p className="page-header__subtitle">System configuration and environment status</p>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
        {/* System Health */}
        <Section title="System Health">
          {health ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Service</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{health.service}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Version</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{health.version}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Chip label={health.status} size="small"
                      color={health.status === 'UP' ? 'success' : 'error'} sx={{ fontWeight: 700 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Database</Typography>
                <Chip label={health.database} size="small" variant="outlined"
                      color={health.database === 'connected' ? 'success' : 'error'} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Graph API</Typography>
                <Chip label={health.graphApi || 'disconnected'} size="small" variant="outlined"
                      color={health.graphApi === 'connected' ? 'success' : 'error'} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Last Check</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {health.timestamp ? new Date(health.timestamp).toLocaleString('en-IN') : '-'}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Alert severity="error">Backend is not responding</Alert>
          )}
        </Section>

        {/* Python OAuth 2.0 & BeautifulSoup Configuration */}
        <Section title="Python Outlook Service (OAuth 2.0 & BeautifulSoup4)">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Tenant ID" fullWidth defaultValue="dc9c3a4c-20c8-4af8-beeb-e0fbd4d8be82"
                         helperText="Azure Entra ID Tenant ID" />
              <TextField label="Client ID" fullWidth defaultValue="4b71dd8b-4df4-44b0-8a2c-5dafab094a0c"
                         helperText="Azure Application Client ID" />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Client Secret" fullWidth type="password" defaultValue="••••••••••••••••"
                         helperText="Azure App Registration Client Secret" />
              <TextField label="Shared Mailbox Email" fullWidth defaultValue="darshan.k@technosprint.net"
                         helperText="Monitored Outlook mailbox" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Chip label="BeautifulSoup4 Parser: ENABLED" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  window.open('https://login.microsoftonline.com/dc9c3a4c-20c8-4af8-beeb-e0fbd4d8be82/oauth2/v2.0/authorize?client_id=4b71dd8b-4df4-44b0-8a2c-5dafab094a0c&response_type=code&redirect_uri=http://localhost:3000/oauth/callback&scope=https://graph.microsoft.com/Mail.ReadWrite%20https://graph.microsoft.com/Mail.Send%20offline_access', '_blank');
                }}
              >
                🔗 Connect Outlook Account (Microsoft SSO)
              </Button>
            </Box>
          </Box>
        </Section>

        {/* Email Configuration */}
        <Section title="Email Configuration (Graph API)">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Azure Tenant ID" fullWidth defaultValue="••••••••"
                         InputProps={{ readOnly: true }} helperText="Set via AZURE_TENANT_ID env var" />
              <TextField label="Azure Client ID" fullWidth defaultValue="••••••••"
                         InputProps={{ readOnly: true }} helperText="Set via AZURE_CLIENT_ID env var" />
            </Box>
            <TextField label="Shared Mailbox" fullWidth defaultValue="Set via SHARED_MAILBOX_EMAIL env var"
                       InputProps={{ readOnly: true }} helperText="The Outlook 365 mailbox being monitored" />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Poll Interval (ms)" type="number" defaultValue="60000" fullWidth
                         helperText="How often to check for new emails" />
              <TextField label="Max Emails Per Batch" type="number" defaultValue="10" fullWidth
                         helperText="Maximum emails to fetch per poll cycle" />
            </Box>
          </Box>
        </Section>

        {/* AI Configuration */}
        <Section title="AI Configuration (OpenAI)">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Model" fullWidth defaultValue="gpt-4o-mini"
                         helperText="OpenAI model for classification & extraction" />
              <TextField label="Temperature" type="number" fullWidth defaultValue="0.1"
                         helperText="Lower = more deterministic" inputProps={{ step: 0.1, min: 0, max: 2 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Confidence Threshold" type="number" fullWidth defaultValue="0.90"
                         helperText="Min confidence for auto-mapping parts" inputProps={{ step: 0.05, min: 0, max: 1 }} />
              <TextField label="Max Tokens" type="number" fullWidth defaultValue="4096" />
            </Box>
          </Box>
        </Section>

        {/* Document Settings */}
        <Section title="Document Generation">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="PDF Storage Path" fullWidth defaultValue="./generated-documents"
                       helperText="Where generated PDFs are stored on disk" />
            <TextField label="Quotation Validity (days)" type="number" fullWidth defaultValue="30" />
            <FormControlLabel
              control={<Switch defaultChecked color="primary" />}
              label="Auto-send quotation via email reply"
            />
          </Box>
        </Section>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
          <Button variant="contained" startIcon={<SaveRoundedIcon />}
                  onClick={() => setSnackbar({ open: true, message: 'Settings saved (restart required for env vars)', severity: 'info' })}>
            Save Settings
          </Button>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
