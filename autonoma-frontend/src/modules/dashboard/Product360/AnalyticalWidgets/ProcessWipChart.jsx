import React from 'react';
import { Card, CardContent, Typography, Box, Button, LinearProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function ProcessWipChart({ processWipList = [], onViewWip }) {
  const theme = useTheme();

  const maxVal = processWipList.length > 0 ? Math.max(...processWipList.map((p) => Number(p.wipQty) || 0)) : 420;

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Process Wise WIP (NOS)
        </Typography>
      </Box>
      <CardContent sx={{ p: 1.5, pt: 0.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, my: 0.5 }}>
          {processWipList.map((p, idx) => {
            const val = Number(p.wipQty) || 0;
            const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
            return (
              <Box key={p.processId || idx}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                    {p.processName}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.75rem', color: p.barColor || 'primary.main' }}>
                    {val.toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 1, height: 6, overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width: `${pct}%`,
                      height: '100%',
                      bgcolor: p.barColor || '#1e88e5',
                      borderRadius: 1,
                      transition: 'width 0.5s ease-in-out'
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>

        <Button
          size="small"
          variant="text"
          color="primary"
          onClick={onViewWip}
          sx={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, p: 0, justifyContent: 'flex-start', mt: 0.5 }}
        >
          View Process WIP →
        </Button>
      </CardContent>
    </Card>
  );
}
