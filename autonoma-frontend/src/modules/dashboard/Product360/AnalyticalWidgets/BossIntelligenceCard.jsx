import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconBulb,
  IconAlertTriangle,
  IconAlertOctagon,
  IconCircleCheck,
  IconClock,
  IconTrendingUp,
  IconShoppingCart,
  IconLayersDifference
} from '@tabler/icons-react';

export default function BossIntelligenceCard({ bossInsights = [], onViewAllInsights }) {
  const theme = useTheme();

  const getSeverityIcon = (severity, iconName) => {
    switch (severity) {
      case 'CRITICAL':
        return <IconAlertOctagon size={16} style={{ color: '#f44336', flexShrink: 0 }} />;
      case 'WARNING':
        return <IconAlertTriangle size={16} style={{ color: '#ff9800', flexShrink: 0 }} />;
      case 'SUCCESS':
        return <IconCircleCheck size={16} style={{ color: '#4caf50', flexShrink: 0 }} />;
      case 'INFO':
      default:
        return <IconTrendingUp size={16} style={{ color: '#2196f3', flexShrink: 0 }} />;
    }
  };

  const defaultInsights = [
    { severity: 'WARNING', highlightText: '18 routing cards are currently open.' },
    { severity: 'CRITICAL', highlightText: '4 routing cards are delayed.' },
    { severity: 'WARNING', highlightText: 'Machining has the highest WIP.' },
    { severity: 'CRITICAL', highlightText: 'RM-1003 has a shortage of 120 NOS.' },
    { severity: 'INFO', highlightText: 'Demand increased 14.2% over last 3 months.' },
    { severity: 'CRITICAL', highlightText: 'Available stock is below ROL.' },
    { severity: 'SUCCESS', highlightText: 'Recommended purchase quantity: 800 NOS.' },
    { severity: 'WARNING', highlightText: 'Projected stockout in 18 days.' }
  ];

  const items = bossInsights.length > 0 ? bossInsights : defaultInsights;

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconBulb size={18} style={{ color: '#fbc02d' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
          BOSS Intelligence
        </Typography>
      </Box>
      <CardContent sx={{ p: 1.5, pt: 0.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7, my: 0.5, maxHeight: 180, overflowY: 'auto' }} className="p360-scroll">
          {items.map((ins, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              {getSeverityIcon(ins.severity, ins.icon)}
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.72rem', color: 'text.primary' }}>
                {ins.highlightText || ins.message}
              </Typography>
            </Box>
          ))}
        </Box>

        <Button
          size="small"
          variant="text"
          color="primary"
          onClick={onViewAllInsights}
          sx={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, p: 0, justifyContent: 'flex-start', mt: 0.5 }}
        >
          View All Insights →
        </Button>
      </CardContent>
    </Card>
  );
}
