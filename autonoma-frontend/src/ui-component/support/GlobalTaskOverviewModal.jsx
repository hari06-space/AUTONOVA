import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  useTheme,
  Grid
} from '@mui/material';
import { IconX, IconClock, IconUser, IconExternalLink } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useNavigate } from 'react-router-dom';
import { sanitizeHTML } from 'utils/sanitize';

export default function GlobalTaskOverviewModal() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    const handleOpenModal = (event) => {
      const id = event.detail?.ticketId;
      if (id) {
        setTicketId(id);
        setOpen(true);
      }
    };

    window.addEventListener('open-task-modal', handleOpenModal);
    return () => window.removeEventListener('open-task-modal', handleOpenModal);
  }, []);

  useEffect(() => {
    const fetchTicketData = async () => {
      if (!open || !ticketId) return;
      setLoading(true);
      try {
        const res = await axios.get('/api/tickets');
        const found = res.data?.find((t) => t.ticketId === ticketId);
        if (found) {
          setTicket(found);
        } else {
          setTicket(null);
        }
      } catch (e) {
        console.error('Failed to fetch ticket overview', e);
        setTicket(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [open, ticketId]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setTicketId(null);
      setTicket(null);
    }, 300); // Allow animation to finish
  };

  const handleOpenFullTask = () => {
    handleClose();
    navigate(`/support/raised-for-me?openTicketId=${encodeURIComponent(ticketId)}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'primary';
      case 'In Progress': return 'info';
      case 'Completed': return 'success';
      case 'Reopened': return 'error';
      case 'Closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
      case 'Critical': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          bottom: 16,
          right: 16,
          m: 0,
          borderRadius: 3,
          boxShadow: '0px 10px 40px rgba(0,0,0,0.2)',
          background: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out',
          '@keyframes slideUp': {
            from: { transform: 'translateY(100%)', opacity: 0 },
            to: { transform: 'translateY(0)', opacity: 1 }
          }
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          Task Overview
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.05)', '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }}>
          <IconX size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : !ticket ? (
          <Box sx={{ textAlign: 'center', p: 3, opacity: 0.7 }}>
            <Typography variant="body1">Task not found or you don't have permission to view it.</Typography>
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>TASK ID</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>{ticket.ticketId}</Typography>
            </Box>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{ticket.title}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Chip size="small" label={ticket.ticketStatus || 'Open'} color={getStatusColor(ticket.ticketStatus)} sx={{ fontWeight: 600 }} />
                <Chip size="small" label={ticket.priorityLevel || 'Medium'} color={getPriorityColor(ticket.priorityLevel)} variant="outlined" sx={{ fontWeight: 600 }} />
                <Chip size="small" label={ticket.ticketType || 'Internal'} variant="outlined" />
              </Stack>
            </Box>

            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                  <IconUser size={14} /> Assigned To
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{ticket.assignedTo || 'Unassigned'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                  <IconUser size={14} /> Raised By
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{ticket.employeeName || ticket.createdBy}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                  <IconClock size={14} /> Target Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {ticket.targetDate ? new Date(ticket.targetDate).toLocaleDateString() : 'Not Set'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                  <IconClock size={14} /> Assigned Hrs
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{ticket.assignedHours || '-'}</Typography>
              </Grid>
            </Grid>

            {ticket.description && (
              <Box sx={{ mt: 1, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>DESCRIPTION</Typography>
                <Typography variant="body2" sx={{ '& p': { m: 0 } }} dangerouslySetInnerHTML={{ __html: sanitizeHTML(ticket.description) }} />
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
        <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 600 }}>
          Close (Esc)
        </Button>
        <Button 
          variant="contained" 
          onClick={handleOpenFullTask}
          endIcon={<IconExternalLink size={16} />}
          sx={{ fontWeight: 600, borderRadius: 2 }}
          disabled={!ticket}
        >
          Open Full Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}
