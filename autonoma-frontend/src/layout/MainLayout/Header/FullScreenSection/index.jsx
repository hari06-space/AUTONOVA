import { useCallback, useEffect, useState, useRef } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';

// project imports
import { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

// assets
import { IconArrowsMaximize, IconArrowsMinimize } from '@tabler/icons-react';

// ==============================|| HEADER CONTENT - FULLSCREEN ||============================== //

export default function FullScreen() {
  const theme = useTheme();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setOpen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        const openOverlays = document.querySelectorAll(
          '.MuiDialog-root, .MuiMenu-root, .MuiPopover-root, .MuiModal-root'
        );
        // Only exit fullscreen if no overlays are open
        if (openOverlays.length === 0) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggle = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  return (
    <>
      <Box sx={{ ml: 2 }}>
      <Tooltip title={shortcutTooltip(open ? 'Exit Fullscreen' : 'Fullscreen', 'F11')}>
        <Avatar
          accessKey="f"
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            transition: 'all .2s cubic-bezier(0.4,0,0.2,1)',
            color: '#ffffff',
            background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
            boxShadow: `0 4px 14px ${theme.palette.info.main}45`,
            '&:hover, &[aria-controls="menu-list-grow"]': {
              background: `linear-gradient(135deg, ${theme.palette.info.dark}, ${theme.palette.info.main})`,
              transform: 'translateY(-1px)',
              boxShadow: `0 6px 20px ${theme.palette.info.main}60`
            }
          }}
          aria-controls={open ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          {open ? <IconArrowsMinimize /> : <IconArrowsMaximize />}
        </Avatar>
      </Tooltip>
    </Box>
    </>
  );
}
