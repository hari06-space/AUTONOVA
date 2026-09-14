import { Link } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import AuthWrapper1 from '../AuthWrapper1';
import AuthCardWrapper from '../AuthCardWrapper';
import Logo from 'ui-component/Logo';
import AnimateButton from 'ui-component/extended/AnimateButton';
import AuthCodeVerification from '../jwt/AuthCodeVerification';
import BackgroundPattern1 from 'ui-component/cards/BackgroundPattern1';
import AuthSlider from 'ui-component/cards/AuthSlider';

// assets
import AuthBlueCard from 'assets/images/auth/auth-blue-card.svg';
import AuthWhiteCard from 'assets/images/auth/auth-signup-white-card.svg';

// carousel items
const items = [
  {
    title: 'Powerful and easy to use multi-purpose theme.',
    description: 'Powerful and easy to use multipurpose theme'
  },
  {
    title: 'Powerful and easy to use multi-purpose theme.',
    description: 'Powerful and easy to use multipurpose theme'
  },
  {
    title: 'Powerful and easy to use multi-purpose theme.',
    description: 'Powerful and easy to use multipurpose theme'
  }
];

// ===========================|| AUTH1 - CODE VERIFICATION ||=========================== //

export default function CodeVerification() {
  const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

  return (
    <AuthWrapper1>
      <Grid container sx={{ justifyContent: 'space-between', alignItems: 'center', minHeight: '100vh' }}>
        <Grid container sx={{ justifyContent: 'center', my: 3 }} size={{ xs: 12, md: 6, lg: 7 }}>
          <AuthCardWrapper>
            <Stack sx={{ justifyContent: 'center', gap: 2 }}>
              <Stack
                direction={{ xs: 'column-reverse', md: 'row' }}
                sx={{ alignItems: { xs: 'center', md: 'inherit' }, justifyContent: { xs: 'center', md: 'space-between' } }}
              >
                <Stack sx={{ justifyContent: { xs: 'center', md: 'flex-start' }, textAlign: { xs: 'center', md: 'inherit' } }}>
                  <Typography gutterBottom variant={downMD ? 'h3' : 'h2'} sx={{ color: 'secondary.main' }}>
                    Verification Code
                  </Typography>
                  <Typography gutterBottom variant="h4" sx={{ color: 'text.primary' }}>
                    We send you on mail.
                  </Typography>
                </Stack>
                <Box sx={{ mb: { xs: 3, sm: 0 } }}>
                  <Link to="#" aria-label="theme logo">
                    <Logo />
                  </Link>
                </Box>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '16px', textAlign: { xs: 'center', md: 'inherit' } }}>
                  We’ve send you code on jone.****@company.com
                </Typography>
              </Stack>
              <AuthCodeVerification />
              <Divider />
              <Stack sx={{ alignItems: 'flex-end' }}>
                <Typography
                  component={Link}
                  to="#"
                  variant="subtitle1"
                  sx={{ textAlign: { xs: 'center', md: 'inherit' }, textDecoration: 'none' }}
                >
                  Did not receive the email? Check your spam filter, or
                </Typography>
              </Stack>
              <AnimateButton>
                <Button disableElevation fullWidth size="large" type="submit" variant="outlined" color="secondary">
                  Resend Code
                </Button>
              </AnimateButton>
            </Stack>
          </AuthCardWrapper>
        </Grid>
        <Grid sx={{ position: 'relative', alignSelf: 'stretch', display: { xs: 'none', md: 'block' } }} size={{ md: 6, lg: 5 }}>
          <BackgroundPattern1>
            <Grid container spacing={3} sx={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <Grid size={12}>
                <span />
                <Box
                  sx={{
                    '&:after': {
                      content: '""',
                      position: 'absolute',
                      top: { xs: '50%', xl: '45%' },
                      left: { xs: '25%', xl: '35%' },
                      width: 260,
                      backgroundSize: 380,
                      height: 290,
                      backgroundImage: `url(${AuthWhiteCard})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      animation: '15s wings ease-in-out infinite'
                    },
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: { xs: '10%', xl: '12%' },
                      left: { xs: '15%', xl: '25%' },
                      width: 360,
                      height: 350,
                      backgroundSize: 460,
                      backgroundImage: `url(${AuthBlueCard})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      animation: '15s wings ease-in-out infinite',
                      animationDelay: '1s'
                    }
                  }}
                />
              </Grid>
              <Grid size={12}>
                <Grid container sx={{ justifyContent: 'center', pb: 8 }}>
                  <Grid sx={{ '& .slick-list': { pb: 2 } }} size={{ xs: 10, lg: 8 }}>
                    <AuthSlider items={items} />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </BackgroundPattern1>
        </Grid>
      </Grid>
    </AuthWrapper1>
  );
}
