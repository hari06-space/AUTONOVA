import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'utils/axios';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Button
} from '@mui/material';
import { IconAlertCircle } from '@tabler/icons-react';
import Logo from 'ui-component/Logo';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useConfig from 'hooks/useConfig';
import { SmoothLoadingSpinner, staticBgStylesheet } from './CandidatePortalShared';

export default function DocumentReupload() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { themeMode } = useConfig();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Access denied. Missing re-upload verification token.');
      setLoading(false);
      return;
    }

    const verifyReupload = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get('/api/hra/applicants/portal/document-reupload/verify', {
          params: { token }
        });

        if (response.data && response.data.valid) {
          // Save session token so that the target portal can reuse it
          sessionStorage.setItem('candidateSessionToken', token);
          localStorage.setItem('candidateSessionToken', token);

          const portal = response.data.portal;
          const targetId = searchParams.get('targetId');
          const targetParam = targetId ? `&targetId=${encodeURIComponent(targetId)}` : '';
          if (portal === 'ONBOARDING') {
            navigate(`/candidate/onboarding?token=${token}${targetParam}`, { replace: true });
          } else {
            navigate(`/candidate/assessment?token=${token}&section=upload${targetParam}`, { replace: true });
          }
        } else {
          setError('Invalid or expired document re-upload session.');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data || 'Failed to verify re-upload token. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyReupload();
  }, [token, navigate]);

  // Premium design theme wrap
  const darkTheme = createTheme({
    palette: {
      mode: themeMode === 'light' ? 'light' : 'dark',
      background: {
        default: themeMode === 'light' ? '#f4f6f9' : '#0a0e17'
      }
    }
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: themeMode === 'light' ? '#f4f6f9' : '#0a0e17',
          p: 2
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              borderRadius: '24px',
              border: '1px solid',
              borderColor: themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
              boxShadow: themeMode === 'light' 
                ? '0 20px 40px -12px rgba(0,0,0,0.06)' 
                : '0 20px 40px -12px rgba(0,0,0,0.5)',
              backgroundColor: themeMode === 'light' ? '#ffffff' : '#111827'
            }}
          >
            <CardContent sx={{ p: 5, textAlign: 'center' }}>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                <Logo />
              </Box>

              {loading && (
                <Stack spacing={3} alignItems="center">
                  <SmoothLoadingSpinner size={54} color="#2563EB" label="Verifying portal access..." />
                  <Typography variant="body2" color="text.secondary">
                    Please wait while we validate your document re-upload session.
                  </Typography>
                </Stack>
              )}

              {error && (
                <Stack spacing={3} alignItems="center">
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      color: '#dc2626',
                      display: 'inline-flex'
                    }}
                  >
                    <IconAlertCircle size={40} />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: '#dc2626' }}>
                    Verification Failed
                  </Typography>
                  <Alert severity="error" sx={{ width: '100%', borderRadius: '12px' }}>
                    {error}
                  </Alert>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    If you believe this is an error, please reach out to your HR contact to request a new link.
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
