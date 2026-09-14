import React from 'react';
import { Card, CardContent, Typography, Box, Button, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconRoute, IconPlayerPlay, IconPlayerPause, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';

export default function OpenRoutingCardsCard({ routingCards = {}, onViewAll }) {
  const theme = useTheme();

  const totalOpen = routingCards.totalOpen != null ? routingCards.totalOpen : 0;
  const active = routingCards.active != null ? routingCards.active : 0;
  const onHold = routingCards.onHold != null ? routingCards.onHold : 0;
  const delayed = routingCards.delayed != null ? routingCards.delayed : 0;
  const completed = routingCards.completed != null ? routingCards.completed : 0;

  const statuses = [
    { label: 'Active', count: active, color: '#4caf50', icon: <IconPlayerPlay size={14} /> },
    { label: 'On Hold', count: onHold, color: '#ff9800', icon: <IconPlayerPause size={14} /> },
    { label: 'Delayed', count: delayed, color: '#f44336', icon: <IconAlertTriangle size={14} /> },
    { label: 'Completed', count: completed, color: '#2196f3', icon: <IconCircleCheck size={14} /> }
  ];

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Open Routing Cards
        </Typography>
      </Box>
      <CardContent sx={{ p: 1.5, pt: 0.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 0.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconRoute size={24} />
          </Box>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.4rem' }}>
              {totalOpen}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
              Total Open
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, my: 0.5 }}>
          {statuses.map((st, idx) => (
            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: st.color }} />
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.72rem' }}>
                  {st.label}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: st.color, fontSize: '0.75rem' }}>
                {st.count}
              </Typography>
            </Box>
          ))}
        </Box>

        <Button
          size="small"
          variant="text"
          color="primary"
          onClick={onViewAll}
          sx={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, p: 0, justifyContent: 'flex-start', mt: 0.5 }}
        >
          View All Routing Cards →
        </Button>
      </CardContent>
    </Card>
  );
}
