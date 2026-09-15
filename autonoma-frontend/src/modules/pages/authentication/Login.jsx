import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box, Grid, Typography, alpha, Paper, Button } from '@mui/material';

// third party
import { motion } from 'framer-motion';

// project imports
import ViewOnlyAlert from './ViewOnlyAlert';
import AuthLoginBackground from './AuthLoginBackground';
import { APP_AUTH } from 'config';
import useAuth from 'hooks/useAuth';

// assets
import bgImage from 'assets/images/boss_login_bg.png';

// tabler icons
import {
  IconCurrencyRupee, IconUsers, IconBox, IconChartBar,
  IconBuildingFactory2, IconChecklist, IconTruckDelivery, IconChartPie,
  IconShieldCheck, IconCertificate, IconWorld,
  IconSquareLetterIFilled,
  IconDashboardFilled,
  IconDashboard,
  IconAdjustmentsBolt,
  IconPhone,
  IconMicrophone,
  IconFaceId
} from '@tabler/icons-react';

const authLoginImports = {
  jwt: () => import('./jwt/AuthLogin'),
  auth0: () => import('./auth0/AuthLogin')
};

// ================================|| MOCK COMPONENTS FOR LEFT PANEL ||================================ //

const StatCard = ({ title, value, growth }) => (
  <Box sx={{
    p: 2, mb: 2,
    borderRadius: '16px',
    background: 'rgba(15, 20, 30, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)',
    transition: 'transform 0.3s',
    '&:hover': { transform: 'translateX(5px)', background: 'rgba(255, 255, 255, 0.06)' }
  }}>
    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>{title}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700 }}>{value}</Typography>
      <Typography sx={{ color: '#00e676', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
        ↑ {growth}
      </Typography>
    </Box>
  </Box>
);

const ModuleIcon = ({ icon: Icon, title }) => (
  <Box sx={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    p: 1, borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    minHeight: 60,
    '&:hover': { background: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.3)', transform: 'translateY(-2px)' }
  }}>
    <Icon size={20} color="#D4AF37" stroke={1.5} style={{ marginBottom: 4 }} />
    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.6rem', fontWeight: 500, textAlign: 'center', lineHeight: 1.1 }}>
      {title}
    </Typography>
  </Box>
);

// ================================|| AUTH - ERP LOGIN ||================================ //

export default function Login() {
  const { isLoggedIn } = useAuth();
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));
  const [AuthLoginComponent, setAuthLoginComponent] = useState(null);
  const [isFaceMode, setIsFaceMode] = useState(true);

  const [searchParams] = useSearchParams();
  const authParam = searchParams.get('auth') || '';

  useEffect(() => {
    const selectedAuth = authParam || APP_AUTH;
    const importAuthLoginComponent = authLoginImports[selectedAuth];

    if (importAuthLoginComponent) {
      importAuthLoginComponent()
        .then((module) => setAuthLoginComponent(() => module.default))
        .catch((error) => console.error(`Error loading ${selectedAuth} AuthLogin`, error));
    }
  }, [authParam]);

  return (
    <>
      <AuthLoginBackground />
      <Box sx={{
        minHeight: '100vh', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: { xs: 2, sm: 3, md: 4 },
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto'
      }}>

        {/* Massive Centered Card Container */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%', maxWidth: 1000, margin: 'auto' }}>
          <Paper elevation={24} sx={{
            width: '100%',
            minHeight: { xs: 'auto', md: '600px' },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            overflow: 'hidden',
            borderRadius: { xs: 3, md: 2 },
            borderTop: '3px solid #D4AF37', // Yellow accent border
            borderBottom: '3px solid #D4AF37',
            borderLeft: '4px solid #fff', // White structural border
            borderRight: '4px solid #fff',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
            backgroundColor: '#0a0e17'
          }}>

            {/* ================= LEFT COLUMN (MARKETING) ================= */}
            {!downMD && (
              <Box sx={{
                flex: { md: 1, lg: 1.1 },
                position: 'relative',
                display: 'flex',
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRight: '1px solid rgba(255,255,255,0.05)'
              }}>
                {/* Dark overlay over the image */}
                <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10, 14, 23, 0.95) 0%, rgba(10, 14, 23, 0.4) 100%)' }} />

                <Box sx={{ p: { md: 3, lg: 4 }, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>

                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h1" sx={{ fontSize: { md: '2rem', lg: '2.5rem' }, fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #D4AF37 0%, #FFDF73 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                        BOS(S)
                      </Typography>
                      <Typography sx={{ fontSize: { md: '0.55rem', lg: '0.65rem' }, fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', mt: 0.5 }}>
                        Business Operating System (Solutions)
                      </Typography>
                    </Box>
                  </Box>

                  {/* Hero Text */}
                  <Box sx={{ my: { md: 1.5, lg: 2 } }}>
                    <Typography variant="h2" sx={{ fontSize: { md: '1.25rem', lg: '1.5rem' }, fontWeight: 300, color: '#fff', mb: 0.25 }}>
                      One Platform.
                    </Typography>
                    <Typography variant="h2" sx={{ fontSize: { md: '1.25rem', lg: '1.5rem' }, fontWeight: 700, color: '#D4AF37', mb: 1 }}>
                      Complete Control.
                    </Typography>
                    <Typography sx={{ fontSize: { md: '0.7rem', lg: '0.75rem' }, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, maxWidth: 350 }}>
                      BOS(S) unifies your people, processes and data to run your business smarter.
                    </Typography>
                  </Box>

                  <Box>
                    {/* Modules Grid */}
                    <Grid container spacing={1} sx={{ maxWidth: 450, mb: { md: 1.5, lg: 2 } }}>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconChartBar} title="CRM & Sales" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconAdjustmentsBolt} title="Design & Dev" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconChecklist} title="Planning" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconBuildingFactory2} title="Manufacturing" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconTruckDelivery} title="Supply Chain" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconBox} title="Inventory" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconCurrencyRupee} title="Finance" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconUsers} title="HR" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconCertificate} title="Quality" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconShieldCheck} title="KPI" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconDashboard} title="Dashboards" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconChartPie} title="Analytics" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconPhone} title="Mobile Apps" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconMicrophone} title="Voice" /></Grid>
                      <Grid item xs={4} sm={3}><ModuleIcon icon={IconFaceId} title="Face Login" /></Grid>
                    </Grid>

                    {/* Security Footers */}
                    <Box sx={{ display: 'flex', flexDirection: { md: 'column', lg: 'row' }, gap: 1.5, mb: { md: 1, lg: 1.5 }, maxWidth: 450 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1, borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                        <IconShieldCheck size={20} color="#D4AF37" stroke={1.5} />
                        <Box>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>Enterprise Security</Typography>
                          <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>Advanced encryption</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1, borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                        <IconCertificate size={20} color="#D4AF37" stroke={1.5} />
                        <Box>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>ISO 27001 Certified</Typography>
                          <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>Global standards</Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>
                      © 2026 Autonova Solutions Pvt. Ltd. All rights reserved.
                    </Typography>
                  </Box>
                </Box>


              </Box>
            )}

            {/* ================= RIGHT COLUMN (LOGIN) ================= */}
            <Box sx={{
              flex: { xs: 1, md: 0.9 },
              p: { xs: 2.5, sm: 4, md: 3, lg: 4 },
              display: 'flex', flexDirection: 'column',
              backgroundColor: '#0a0e17',
              position: 'relative',
              zIndex: 1,
              justifyContent: 'center'
            }}>


              <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 420 }, mx: 'auto' }}>
                {!isLoggedIn && <ViewOnlyAlert />}

                {AuthLoginComponent && (
                  <AuthLoginComponent onFaceModeChange={(isFace) => setIsFaceMode(isFace)} />
                )}
              </Box>
            </Box>

          </Paper>
        </motion.div>

      </Box>
    </>
  );
}
