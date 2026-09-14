import PropTypes from 'prop-types';
// material-ui
import { useColorScheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';

// project imports
import ComposeDialog from './ComposeDialog';
import { ThemeMode } from 'config';
import useConfig from 'hooks/useConfig';
import MainCard from 'ui-component/cards/MainCard';
import SimpleBar from 'ui-component/third-party/SimpleBar';

import { appDrawerWidth as drawerWidth, gridSpacing } from 'store/constant';

// assets
import MailTwoToneIcon from '@mui/icons-material/MailTwoTone';
import InboxTwoToneIcon from '@mui/icons-material/InboxTwoTone';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import HistoryEduTwoToneIcon from '@mui/icons-material/HistoryEduTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import LabelImportantTwoToneIcon from '@mui/icons-material/LabelImportantTwoTone';
import LabelTwoToneIcon from '@mui/icons-material/LabelTwoTone';
import NewReleasesTwoToneIcon from '@mui/icons-material/NewReleasesTwoTone';
import StarTwoToneIcon from '@mui/icons-material/StarTwoTone';

// ==============================|| MAIL DRAWER ||============================== //

export default function MailDrawer({ filter, handleDrawerOpen, handleFilter, openMailSidebar, unreadCounts }) {
  const { colorScheme } = useColorScheme();
  const {
    state: { borderRadius }
  } = useConfig();
  const matchDownSM = useMediaQuery((theme) => theme.breakpoints.down('md'));

  return (
    <Drawer
      slotProps={{
        paper: {
          sx: {
            height: 'auto',
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'relative',
            border: 'none',
            borderRadius: matchDownSM ? 0 : `${borderRadius}px`
          }
        }
      }}
      sx={{ width: drawerWidth, flexShrink: 0, zIndex: { xs: 1200, md: 0 } }}
      variant={matchDownSM ? 'temporary' : 'persistent'}
      anchor="left"
      open={openMailSidebar}
      ModalProps={{ keepMounted: true }}
      onClose={handleDrawerOpen}
    >
      {openMailSidebar && (
        <MainCard
          sx={(theme) => ({ bgcolor: 'grey.50', ...theme.applyStyles('dark', { bgcolor: 'dark.main' }) })}
          border={colorScheme !== ThemeMode.DARK}
          content={false}
        >
          <CardContent sx={{ height: matchDownSM ? '100vh' : 'auto' }}>
            <Grid container spacing={gridSpacing}>
              <Grid size={12}>
                <ComposeDialog />
              </Grid>
              <Grid size={12}>
                <SimpleBar
                  style={{
                    height: matchDownSM ? 'calc(100vh - 115px)' : '100%',
                    overflowX: 'hidden',
                    minHeight: matchDownSM ? 0 : 435
                  }}
                >
                  <List
                    component="nav"
                    sx={(theme) => ({
                      '& .MuiListItem-root': {
                        mb: 0.75,
                        borderRadius: `${borderRadius}px`,
                        '& .MuiChip-root': { color: 'secondary.main', bgcolor: 'secondary.light' }
                      },
                      '& .MuiListItem-root.Mui-selected': {
                        bgcolor: 'secondary.light',
                        '& .MuiListItemText-primary': { color: 'secondary.main' },
                        '& .MuiChip-root': { color: 'secondary.light', bgcolor: 'secondary.main' }
                      },

                      ...theme.applyStyles('dark', {
                        '& .MuiListItem-root': {
                          '& .MuiChip-root': { color: 'primary.main', bgcolor: 'dark.dark' }
                        },
                        '& .MuiListItem-root.Mui-selected': {
                          bgcolor: 'dark.dark',
                          '& .MuiListItemText-primary': { color: 'primary.main' },
                          '& .MuiChip-root': { color: 'primary.main', bgcolor: 'dark.main' }
                        }
                      })
                    })}
                  >
                    <ListItemButton selected={filter === 'all'} onClick={() => handleFilter('all')}>
                      <ListItemIcon>
                        <MailTwoToneIcon />
                      </ListItemIcon>
                      <ListItemText primary="All Mail" />
                      {unreadCounts?.all !== 0 && <Chip label={unreadCounts?.all} color="default" size="small" />}
                    </ListItemButton>
                    <ListItemButton selected={filter === 'inbox'} onClick={() => handleFilter('inbox')}>
                      <ListItemIcon>
                        <InboxTwoToneIcon />
                      </ListItemIcon>
                      <ListItemText primary="Inbox" />
                      {unreadCounts?.inbox !== 0 && <Chip label={unreadCounts?.inbox} color="default" size="small" />}
                    </ListItemButton>
                    <ListItemButton selected={filter === 'sent'} onClick={() => handleFilter('sent')}>
                      <ListItemIcon>
                        <SendTwoToneIcon />
                      </ListItemIcon>
                      <ListItemText primary="Sent" />
                      {unreadCounts?.sent !== 0 && <Chip label={unreadCounts?.sent} color="default" size="small" />}
                    </ListItemButton>
                    <ListItemButton selected={filter === 'draft'} onClick={() => handleFilter('draft')}>
                      <ListItemIcon>
                        <HistoryEduTwoToneIcon />
                      </ListItemIcon>
                      <ListItemText primary="Draft" />
                      {unreadCounts?.draft !== 0 && <Chip label={unreadCounts?.draft} color="default" size="small" />}
                    </ListItemButton>
                    <ListItemButton selected={filter === 'spam'} onClick={() => handleFilter('spam')}>
                      <ListItemIcon>
                        <NewReleasesTwoToneIcon />
                      </ListItemIcon>
                      <ListItemText primary="Spam" />
                      {unreadCounts?.spam !== 0 && <Chip label={unreadCounts?.spam} color="default" size="small" />}
                    </ListItemButton>
                    <ListItemButton selected={filter === 'trash'} onClick={() => handleFilter('trash')}>
                      <ListItemIcon>
                        <DeleteTwoToneIcon />
                      </ListItemIcon>
                      <ListItemText primary="Trash" />
                      {unreadCounts?.trash !== 0 && <Chip label={unreadCounts?.trash} color="default" size="small" />}
                    </ListItemButton>
                    <Divider />
                    <ListSubheader sx={{ bgcolor: 'transparent' }}>Filters</ListSubheader>
                    <ListItemButton selected={filter === 'starred'} onClick={() => handleFilter('starred')}>
                      <ListItemIcon>
                        <StarTwoToneIcon />
                      </ListItemIcon>
                      <ListItemText primary="Starred" />
                      {unreadCounts?.starred !== 0 && <Chip label={unreadCounts?.starred} color="default" size="small" />}
                    </ListItemButton>
                    <ListItemButton selected={filter === 'important'} onClick={() => handleFilter('important')}>
                      <ListItemIcon>
                        <LabelImportantTwoToneIcon />
                      </ListItemIcon>
                      <ListItemText primary="Important" />
                      {unreadCounts?.important !== 0 && <Chip label={unreadCounts?.important} color="default" size="small" />}
                    </ListItemButton>
                    <Divider />
                    <ListSubheader sx={{ bgcolor: 'transparent' }}>Label</ListSubheader>
                    <ListItemButton selected={filter === 'promotions'} onClick={() => handleFilter('promotions')}>
                      <ListItemIcon>
                        <LabelTwoToneIcon sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="Promotions" />
                      {unreadCounts?.promotions !== 0 && <Chip label={unreadCounts?.promotions} color="default" size="small" />}
                    </ListItemButton>
                    <ListItemButton selected={filter === 'forums'} onClick={() => handleFilter('forums')}>
                      <ListItemIcon>
                        <LabelTwoToneIcon sx={{ color: 'warning.main' }} />
                      </ListItemIcon>
                      <ListItemText primary="Forums" />
                      {unreadCounts?.forums !== 0 && <Chip label={unreadCounts?.forums} color="default" size="small" />}
                    </ListItemButton>
                  </List>
                </SimpleBar>
              </Grid>
            </Grid>
          </CardContent>
        </MainCard>
      )}
    </Drawer>
  );
}

MailDrawer.propTypes = {
  filter: PropTypes.any,
  handleDrawerOpen: PropTypes.any,
  handleFilter: PropTypes.any,
  openMailSidebar: PropTypes.any,
  unreadCounts: PropTypes.any
};
