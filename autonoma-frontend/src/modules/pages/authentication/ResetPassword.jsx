import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import useMediaQuery from '@mui/material/useMediaQuery';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import AuthWrapper1 from './AuthWrapper1';
import AuthCardWrapper from './AuthCardWrapper';
import ViewOnlyAlert from './ViewOnlyAlert';
import LoginProvider from './LoginProvider';

import Logo from 'ui-component/Logo';
import AuthFooter from 'ui-component/cards/AuthFooter';

import { APP_AUTH } from 'config';
import useAuth from 'hooks/useAuth';

// A mapping of auth types to dynamic imports for reset password
const authResetPasswordImports = {
  jwt: () => import('./jwt/AuthResetPassword'),
  auth0: () => import('./auth0/AuthResetPassword')
};

export default function ResetPassword() {
  const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();
  const [AuthResetPasswordComponent, setAuthResetPasswordComponent] = useState(null);

  const authParam = searchParams.get('auth') || '';

  useEffect(() => {
    const selectedAuth = authParam || APP_AUTH;

    const importAuthResetPasswordComponent = authResetPasswordImports[selectedAuth];

    importAuthResetPasswordComponent()
      .then((module) => setAuthResetPasswordComponent(() => module.default))
      .catch((error) => {
        console.error(`Error loading ${selectedAuth} AuthResetPassword`, error);
      });
  }, [authParam]);

  return (
    <AuthWrapper1>
      <Stack sx={{ justifyContent: 'flex-end', minHeight: '100vh' }}>
        <Stack sx={{ justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 68px)' }}>
          <Box sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
            {!isLoggedIn && <ViewOnlyAlert />}
            <AuthCardWrapper>
              <Stack sx={{ alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Box sx={{ mb: 3 }}>
                  <Link to="#" aria-label="theme logo">
                    <Logo />
                  </Link>
                </Box>
                <Stack direction={{ xs: 'column-reverse', md: 'row' }} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Stack sx={{ alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Typography gutterBottom variant={downMD ? 'h3' : 'h2'} sx={{ color: 'secondary.main' }}>
                      Reset Password
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '16px', textAlign: { xs: 'center', md: 'inherit' } }}>
                      Please choose your new password
                    </Typography>
                  </Stack>
                </Stack>
                {AuthResetPasswordComponent && <AuthResetPasswordComponent />}
              </Stack>
            </AuthCardWrapper>
            {!isLoggedIn && (
              <Box
                sx={{
                  maxWidth: { xs: 400, lg: 475 },
                  margin: { xs: 2.5, md: 3 },
                  '& > *': {
                    flexGrow: 1,
                    flexBasis: '50%'
                  }
                }}
              >
                <LoginProvider currentLoginWith={APP_AUTH} />
              </Box>
            )}
          </Box>
        </Stack>
        <Box sx={{ px: 3, my: 3 }}>
          <AuthFooter />
        </Box>
      </Stack>
    </AuthWrapper1>
  );
}
