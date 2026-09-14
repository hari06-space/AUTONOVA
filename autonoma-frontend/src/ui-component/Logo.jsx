import PropTypes from 'prop-types';

import { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

// project imports
import autonomaLogo from 'assets/images/autonoma-logo.png';
import { getCompanyImageUrl } from 'utils/upload-helper';

// ==============================|| LOGO IMAGE ||============================== //

export default function Logo({ height = 45, logoUrl = null }) {
  const [logoSrc, setLogoSrc] = useState(logoUrl || autonomaLogo);

  useEffect(() => {
    if (logoUrl) {
      setLogoSrc(logoUrl);
      return;
    }

    const setValidatedLogo = (url) => {
      if (!url) {
        setLogoSrc(autonomaLogo);
        return;
      }
      const testImg = new Image();
      testImg.onload = () => {
        setLogoSrc(url);
      };
      testImg.onerror = () => {
        setLogoSrc(autonomaLogo);
      };
      testImg.src = url;
    };

    const fetchLogo = (event) => {
      if (event && event.detail && event.detail.fileName) {
        const url = getCompanyImageUrl(event.detail.fileName);
        const cacheBusted = url ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : autonomaLogo;
        setValidatedLogo(cacheBusted);
        return;
      }

      const token = sessionStorage.getItem('serviceToken') || localStorage.getItem('serviceToken') || '';
      const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_API_URL || window.location.origin).replace(/\/+$/, '');
      const fetchUrl = token ? `${API_BASE}/api/company-profile/all` : `${API_BASE}/api/hra/applicants/portal/branding`;
      const fetchHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

      fetch(fetchUrl, { headers: fetchHeaders, cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          const profile = Array.isArray(data) ? data[0] : data;
          if (profile && profile.logoFileName) {
            const url = getCompanyImageUrl(profile.logoFileName);
            const cacheBusted = url ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : autonomaLogo;
            setValidatedLogo(cacheBusted);
          } else {
            setLogoSrc(autonomaLogo);
          }
        })
        .catch(() => {
          fetch(`${API_BASE}/api/hra/applicants/portal/branding`, { cache: 'no-store' })
            .then(res => res.json())
            .then(branding => {
              if (branding && branding.logoFileName) {
                const url = getCompanyImageUrl(branding.logoFileName);
                const cacheBusted = url ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : autonomaLogo;
                setValidatedLogo(cacheBusted);
              } else {
                setLogoSrc(autonomaLogo);
              }
            })
            .catch(() => {
              setLogoSrc(autonomaLogo);
            });
        });
    };

    fetchLogo();
    window.addEventListener('companyLogoUpdated', fetchLogo);
    window.addEventListener('storage', fetchLogo);
    return () => {
      window.removeEventListener('companyLogoUpdated', fetchLogo);
      window.removeEventListener('storage', fetchLogo);
    };
  }, [logoUrl]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={logoSrc || autonomaLogo}
        alt="Company Logo"
        style={{
          height: height,
          width: 'auto',
          objectFit: 'contain',
          maxWidth: '180px' // to prevent huge logos from breaking the header
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = autonomaLogo;
        }}
      />
    </Box>
  );
}

Logo.propTypes = {
  dark: PropTypes.bool,
  height: PropTypes.number,
  logoUrl: PropTypes.string
};
