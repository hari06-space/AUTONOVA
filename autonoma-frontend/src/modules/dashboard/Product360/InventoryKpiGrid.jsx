import React from 'react';
import { Box, Card, Typography, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconBuildingWarehouse,
  IconCircleCheck,
  IconLock,
  IconTruckDelivery,
  IconReceipt2,
  IconFileText,
  IconChartBar,
  IconShieldCheck,
  IconBox,
  IconClockHour4,
  IconCurrencyRupee
} from '@tabler/icons-react';

export default function InventoryKpiGrid({ kpis = {}, onKpiClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const uom = kpis.uom || 'NOS';

  const kpiItems = [
    {
      id: 'CURRENT_STOCK',
      label: 'Current Stock',
      value: Number(kpis.currentStock || 0).toLocaleString('en-IN'),
      unit: uom,
      icon: <IconBuildingWarehouse size={16} stroke={2.2} />,
      color: '#1565c0',
      iconBg: isDark ? 'rgba(21, 101, 192, 0.2)' : '#e3f2fd'
    },
    {
      id: 'AVAILABLE_STOCK',
      label: 'Available Stock',
      value: Number(kpis.availableStock || 0).toLocaleString('en-IN'),
      unit: uom,
      icon: <IconCircleCheck size={16} stroke={2.2} />,
      color: '#2e7d32',
      iconBg: isDark ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9'
    },
    {
      id: 'RESERVED_STOCK',
      label: 'Reserved Stock',
      value: Number(kpis.reservedStock || 0).toLocaleString('en-IN'),
      unit: uom,
      icon: <IconLock size={16} stroke={2.2} />,
      color: '#ef6c00',
      iconBg: isDark ? 'rgba(239, 108, 0, 0.2)' : '#fff3e0'
    },
    {
      id: 'IN_TRANSIT',
      label: 'In Transit',
      value: Number(kpis.inTransit || 0).toLocaleString('en-IN'),
      unit: uom,
      icon: <IconTruckDelivery size={16} stroke={2.2} />,
      color: '#0288d1',
      iconBg: isDark ? 'rgba(2, 136, 209, 0.2)' : '#e1f5fe'
    },
    {
      id: 'OPEN_PO',
      label: 'Open PO Qty',
      value: Number(kpis.openPoQty || 0).toLocaleString('en-IN'),
      unit: uom,
      icon: <IconReceipt2 size={16} stroke={2.2} />,
      color: '#00897b',
      iconBg: isDark ? 'rgba(0, 137, 123, 0.2)' : '#e0f2f1'
    },
    {
      id: 'OPEN_PR',
      label: 'Open PR Qty',
      value: Number(kpis.openPrQty || 0).toLocaleString('en-IN'),
      unit: uom,
      icon: <IconFileText size={16} stroke={2.2} />,
      color: '#e53935',
      iconBg: isDark ? 'rgba(229, 57, 53, 0.2)' : '#ffebee'
    },
    {
      id: 'ROL',
      label: 'ROL',
      value: Number(kpis.rol || 0).toLocaleString('en-IN'),
      unit: uom,
      icon: <IconChartBar size={16} stroke={2.2} />,
      color: '#f57c00',
      iconBg: isDark ? 'rgba(245, 124, 0, 0.2)' : '#fff8e1'
    },
    {
      id: 'SAFETY_STOCK',
      label: 'Safety Stock',
      value: Number(kpis.safetyStock || 0).toLocaleString('en-IN'),
      unit: uom,
      icon: <IconShieldCheck size={16} stroke={2.2} />,
      color: '#1565c0',
      iconBg: isDark ? 'rgba(21, 101, 192, 0.2)' : '#e8eaf6'
    },
    {
      id: 'MAX_STOCK',
      label: 'Max Stock',
      value: Number(kpis.maxStock || 0).toLocaleString('en-IN'),
      unit: uom,
      icon: <IconBox size={16} stroke={2.2} />,
      color: '#00897b',
      iconBg: isDark ? 'rgba(0, 137, 123, 0.2)' : '#e0f2f1'
    },
    {
      id: 'DOI',
      label: 'DOI (Days)',
      value: Number(kpis.daysOfInventory || 0),
      unit: '',
      icon: <IconClockHour4 size={16} stroke={2.2} />,
      color: '#2e7d32',
      iconBg: isDark ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9'
    },
    {
      id: 'STOCK_VALUE',
      label: 'Stock Value',
      value: kpis.stockValueFormatted || '₹ 0.00',
      unit: '',
      icon: <IconCurrencyRupee size={16} stroke={2.2} />,
      color: '#6a1b9a',
      iconBg: isDark ? 'rgba(106, 27, 154, 0.2)' : '#f3e5f5'
    }
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(4, 1fr)',
          md: 'repeat(6, 1fr)',
          lg: 'repeat(11, 1fr)'
        },
        gap: 1,
        mb: 2
      }}
    >
      {kpiItems.map((item) => (
        <Tooltip
          key={item.id}
          title={`${item.label}: ${item.value} ${item.unit || ''}`}
          arrow
          enterDelay={150}
          placement="top"
        >
          <Card
            className="p360-card"
            onClick={() => onKpiClick && onKpiClick(item.id)}
            sx={{
              bgcolor: isDark ? '#111936' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
              borderRadius: '8px',
              p: '8px 10px',
              minHeight: 74,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.03)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '5px',
                  bgcolor: item.iconBg,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {item.icon}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 700,
                  fontSize: '0.67rem',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {item.label}
              </Typography>
            </Box>

            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'baseline', gap: 0.4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: item.color,
                  fontSize: '0.95rem',
                  letterSpacing: '-0.2px',
                  lineHeight: 1.1
                }}
              >
                {item.value}
              </Typography>
              {item.unit && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    color: 'text.secondary',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.unit}
                </Typography>
              )}
            </Box>
          </Card>
        </Tooltip>
      ))}
    </Box>
  );
}
