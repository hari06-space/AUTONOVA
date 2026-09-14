import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_API_URL || window.location.origin).replace(/\/+$/, '');

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setError('Authorization code not found in redirect URL.');
      return;
    }

    const tenantId = localStorage.getItem('ocr_tenant_id');
    const clientId = localStorage.getItem('ocr_client_id');
    const clientSecret = localStorage.getItem('ocr_client_secret');
    const sharedMailbox = localStorage.getItem('ocr_shared_mailbox');
    const recordId = localStorage.getItem('ocr_record_id');
    const serviceToken = sessionStorage.getItem('serviceToken') || localStorage.getItem('token') || localStorage.getItem('serviceToken') || '';

    // 1. Call proxy callback to complete token exchange
    axios.post(`${API_BASE}/api/ocr/auth/callback`, {
      code,
      tenant_id: tenantId || '',
      client_id: clientId || '',
      client_secret: clientSecret || '',
      shared_mailbox: sharedMailbox || '',
      redirect_uri: window.location.origin + '/oauth/callback'
    }, {
      headers: { 'Authorization': `Bearer ${serviceToken}` }
    })
    .then((res) => {
      const { access_token, refresh_token, expires_in, user_email } = res.data;

      // 2. Fetch current Company Profile from Java Backend
      return fetch(`${API_BASE}/api/company-profile/all`, {
        headers: { 'Authorization': `Bearer ${serviceToken}` }
      })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Failed to retrieve existing company profile.');
        }

        const currentProfile = data[0];
        const updatedMailbox = user_email || sharedMailbox || currentProfile.ocrSharedMailbox;

        const updatePayload = {
          ...currentProfile,
          ocrTenantId: tenantId || currentProfile.ocrTenantId,
          ocrClientId: clientId || currentProfile.ocrClientId,
          ocrClientSecret: clientSecret || currentProfile.ocrClientSecret,
          ocrSharedMailbox: updatedMailbox,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + (expires_in || 3600) * 1000).toISOString(),
          // Ensure correct numeric formats for Java serialization
          stateCode: currentProfile.stateCode ? parseInt(currentProfile.stateCode) : null,
          licExpRemainderDays: currentProfile.licExpRemainderDays ? parseInt(currentProfile.licExpRemainderDays) : 0,
          restoreEnableDays: currentProfile.restoreEnableDays ? parseInt(currentProfile.restoreEnableDays) : 0,
          decimalPlaces: currentProfile.decimalPlaces ? parseInt(currentProfile.decimalPlaces) : 2,
          smtpPort: currentProfile.smtpPort ? parseInt(currentProfile.smtpPort) : 587,
          defaultRowsPerPage: currentProfile.defaultRowsPerPage ? parseInt(currentProfile.defaultRowsPerPage, 10) : 50,
          defaultMaxRecords: currentProfile.defaultMaxRecords ? parseInt(currentProfile.defaultMaxRecords, 10) : 100,
          autoLogoutSeconds: currentProfile.autoLogoutSeconds ? parseInt(currentProfile.autoLogoutSeconds, 10) : 30
        };

        // 3. Save merged config (including tokens) to Java database
        const targetRecordId = recordId || currentProfile.id;
        return fetch(`${API_BASE}/api/company-profile/update/${targetRecordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceToken}`
          },
          body: JSON.stringify(updatePayload)
        });
      });
    })
    .then((response) => {
      if (!response.ok) {
        return response.text().then(text => { throw new Error(text); });
      }
      setStatus('success');
      if (window.opener) {
        try {
          window.opener.postMessage({ type: 'MS_OAUTH_SUCCESS' }, '*');
        } catch (e) {
          console.error('Failed to notify opener window:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1200);
      }
    })
    .catch((err) => {
      setStatus('error');
      setError(err.message || 'Failed to complete OAuth setup.');
      if (window.opener) {
        try {
          window.opener.postMessage({ type: 'MS_OAUTH_ERROR', error: err.message }, '*');
        } catch (e) {
          console.error('Failed to notify opener window:', e);
        }
      }
    });
  }, [searchParams]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#121212', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, maxWidth: 480, width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', bgcolor: '#1e1e1e' }}>
        {status === 'loading' && (
          <Box>
            <CircularProgress color="primary" sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>Connecting Outlook Account...</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>Exchanging OAuth authorization code with Microsoft.</Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box>
            <Alert severity="success" variant="filled" sx={{ mb: 2, borderRadius: 2 }}>
              Outlook Account connected and tokens saved successfully!
            </Alert>
            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>You can close this tab now.</Typography>
          </Box>
        )}

        {status === 'error' && (
          <Box>
            <Alert severity="error" variant="filled" sx={{ mb: 2, borderRadius: 2 }}>
              Authentication Failed
            </Alert>
            <Typography variant="body2" sx={{ color: '#ff6b6b', mb: 2, fontFamily: 'monospace' }}>{error}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Please try again from the Company Profile settings.</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
