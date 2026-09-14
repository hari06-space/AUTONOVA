import { useEffect, useRef, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import Transitions from 'ui-component/extended/Transitions';
import { getUserStorageJson, setUserStorageItem } from 'utils/userStorage';

// assets
import TranslateTwoToneIcon from '@mui/icons-material/TranslateTwoTone';
import useConfig from 'hooks/useConfig';

const getLangIndicator = (lng) => {
  switch (lng) {
    case 'ta':
      return 'த';
    case 'hi':
      return 'ह';
    case 'fr':
      return 'F';
    case 'ro':
      return 'R';
    case 'zh':
      return '中';
    default:
      return 'E';
  }
};

/**
 * Sets or clears the googtrans cookie so Google Translate picks it up on reload.
 * - For English (en): clears the cookie across all domain/path variants and sets /en/en.
 * - For other languages: sets googtrans=/en/<lang>.
 */
function applyGoogTransCookie(lng) {
  const googleLang = lng === 'zh' ? 'zh-CN' : lng;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || /^[0-9.]+$/.test(hostname);

  // Expire old cookies across all potential domains and paths
  const domains = ['', hostname];
  if (!isLocalhost) {
    domains.push(`.${hostname}`);
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const rootDomain = parts.slice(-2).join('.');
      domains.push(rootDomain, `.${rootDomain}`);
    }
  } else {
    domains.push('.localhost');
  }

  const paths = ['/', window.location.pathname];
  const expire = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; Max-Age=0;';

  domains.forEach((dom) => {
    paths.forEach((p) => {
      if (dom) {
        document.cookie = `googtrans=; ${expire} path=${p}; domain=${dom}`;
      }
      document.cookie = `googtrans=; ${expire} path=${p};`;
    });
  });

  if (lng === 'en') {
    // English is native; set /en/en and wipe translate caches
    document.cookie = `googtrans=/en/en; path=/;`;
    if (!isLocalhost) {
      document.cookie = `googtrans=/en/en; path=/; domain=${hostname};`;
      document.cookie = `googtrans=/en/en; path=/; domain=.${hostname};`;
    }
    try {
      sessionStorage.removeItem('googtrans');
      localStorage.removeItem('googtrans');
    } catch (_) {}
    return;
  }

  const value = `/en/${googleLang}`;
  // Set cookie for target language
  document.cookie = `googtrans=${value}; path=/`;
  if (!isLocalhost) {
    document.cookie = `googtrans=${value}; path=/; domain=${hostname}`;
    document.cookie = `googtrans=${value}; path=/; domain=.${hostname}`;
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const rootDomain = parts.slice(-2).join('.');
      document.cookie = `googtrans=${value}; path=/; domain=.${rootDomain}`;
    }
  }
}

// ==============================|| LOCALIZATION ||============================== //

export default function LocalizationSection() {
  const {
    state: { borderRadius, i18n },
    setField
  } = useConfig();

  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleListItemClick = (_event, lng) => {
    setOpen(false);

    // No-op if same language already selected
    if (lng === i18n) return;

    // Persist the selection in config state (React async, for in-session use)
    setField('i18n', lng);

    // Synchronously update both user-scoped and global localStorage before reload
    try {
      const STORAGE_KEY = 'berry-config-vite-js';
      const stored = getUserStorageJson(STORAGE_KEY) || {};
      const updated = { ...stored, i18n: lng };
      setUserStorageItem(STORAGE_KEY, updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore storage errors
    }

    // Apply cookie and reload so Google Translate picks up the new language
    applyGoogTransCookie(lng);
    window.location.reload();
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const prevOpen = useRef(open);

  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  return (
    <>
      <Box sx={{ ml: { xs: 0, sm: 2 } }}>
        <Avatar
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            transition: 'all .2s cubic-bezier(0.4,0,0.2,1)',
            color: '#ffffff',
            background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
            boxShadow: `0 4px 14px ${theme.palette.secondary.main}45`,
            '&:hover, &[aria-controls="menu-list-grow"]': {
              background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
              transform: 'translateY(-1px)',
              boxShadow: `0 6px 20px ${theme.palette.secondary.main}60`
            }
          }}
          ref={anchorRef}
          aria-controls={open ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          alt="language"
          onClick={handleToggle}
        >
          <Typography
            className="notranslate"
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: 'inherit',
              fontSize: '1.15rem'
            }}
          >
            {getLangIndicator(i18n)}
          </Typography>
        </Avatar>
      </Box>

      <Popper
        placement={downMD ? 'bottom-start' : 'bottom'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [downMD ? 0 : 0, 20]
            }
          }
        ]}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Transitions position={downMD ? 'top-left' : 'top'} in={open} {...TransitionProps}>
              <Paper elevation={16}>
                {open && (
                  <List
                    sx={{
                      width: '100%',
                      minWidth: 200,
                      maxWidth: { xs: 250, sm: 280 },
                      borderRadius: `${borderRadius}px`
                    }}
                  >
                    <ListItemButton selected={i18n === 'en'} onClick={(event) => handleListItemClick(event, 'en')}>
                      <ListItemText
                        primary={
                          <Grid container>
                            <Typography>English</Typography>
                            <Typography variant="caption" sx={{ ml: '8px' }}>
                              (UK)
                            </Typography>
                          </Grid>
                        }
                      />
                    </ListItemButton>
                    <ListItemButton selected={i18n === 'ta'} onClick={(event) => handleListItemClick(event, 'ta')}>
                      <ListItemText
                        primary={
                          <Grid container>
                            <Typography>தமிழ்</Typography>
                            <Typography variant="caption" sx={{ ml: '8px' }}>
                              (Tamil)
                            </Typography>
                          </Grid>
                        }
                      />
                    </ListItemButton>
                    <ListItemButton selected={i18n === 'hi'} onClick={(event) => handleListItemClick(event, 'hi')}>
                      <ListItemText
                        primary={
                          <Grid container>
                            <Typography>हिन्दी</Typography>
                            <Typography variant="caption" sx={{ ml: '8px' }}>
                              (Hindi)
                            </Typography>
                          </Grid>
                        }
                      />
                    </ListItemButton>
                    <ListItemButton selected={i18n === 'fr'} onClick={(event) => handleListItemClick(event, 'fr')}>
                      <ListItemText
                        primary={
                          <Grid container>
                            <Typography>français</Typography>
                            <Typography variant="caption" sx={{ ml: '8px' }}>
                              (French)
                            </Typography>
                          </Grid>
                        }
                      />
                    </ListItemButton>
                    <ListItemButton selected={i18n === 'ro'} onClick={(event) => handleListItemClick(event, 'ro')}>
                      <ListItemText
                        primary={
                          <Grid container>
                            <Typography>Română</Typography>
                            <Typography variant="caption" sx={{ ml: '8px' }}>
                              (Romanian)
                            </Typography>
                          </Grid>
                        }
                      />
                    </ListItemButton>
                    <ListItemButton selected={i18n === 'zh'} onClick={(event) => handleListItemClick(event, 'zh')}>
                      <ListItemText
                        primary={
                          <Grid container>
                            <Typography>中国人</Typography>
                            <Typography variant="caption" sx={{ ml: '8px' }}>
                              (Chinese)
                            </Typography>
                          </Grid>
                        }
                      />
                    </ListItemButton>
                  </List>
                )}
              </Paper>
            </Transitions>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
}
