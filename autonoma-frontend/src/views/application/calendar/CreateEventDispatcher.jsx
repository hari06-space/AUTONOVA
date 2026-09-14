import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

// icons
import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

// ==============================|| CREATE EVENT DISPATCHER ||============================== //

export default function CreateEventDispatcher({ open, onClose, onSelectGeneric, onSelectMeeting, selectedRange }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleSelect = (type) => {
    onClose();
    
    if (type === 'generic') {
      onSelectGeneric();
    } else if (type === 'meeting') {
      onSelectMeeting();
    } else if (type === 'audit') {
      navigate('/qms/audit/schedule/add', { state: { fromCalendar: true } });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h4">Create New Schedule</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Select the type of schedule you want to create. The corresponding dynamic form will be opened.
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          {/* Meeting Schedule */}
          <Grid item xs={12} sm={4}>
            <Box
              onClick={() => handleSelect('meeting')}
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: theme.palette.primary.light + '20',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              <GroupsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5">Meeting</Typography>
              <Typography variant="caption" color="textSecondary">QMS Meeting Schedule</Typography>
            </Box>
          </Grid>

          {/* Audit Schedule */}
          <Grid item xs={12} sm={4}>
            <Box
              onClick={() => handleSelect('audit')}
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: theme.palette.error.main,
                  bgcolor: theme.palette.error.light + '20',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              <AssignmentTurnedInIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5">Audit</Typography>
              <Typography variant="caption" color="textSecondary">QMS Audit Schedule</Typography>
            </Box>
          </Grid>

          {/* Generic Event */}
          <Grid item xs={12} sm={4}>
            <Box
              onClick={() => handleSelect('generic')}
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: theme.palette.secondary.main,
                  bgcolor: theme.palette.secondary.light + '20',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              <EventIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5">Generic</Typography>
              <Typography variant="caption" color="textSecondary">Basic Calendar Event</Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

CreateEventDispatcher.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSelectGeneric: PropTypes.func,
  onSelectMeeting: PropTypes.func,
  selectedRange: PropTypes.object
};
