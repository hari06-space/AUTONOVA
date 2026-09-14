import React from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableRow, TableCell } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function DaysOfInventoryCard({ doi = {} }) {
  const theme = useTheme();
  const uom = doi.uom || 'NOS';

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Days of Inventory
        </Typography>
      </Box>
      <CardContent sx={{ p: '0 !important', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Table size="small" className="p360-table" sx={{ '& td': { py: 1 } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Average Daily Consumption</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {doi.avgDailyConsumption != null ? `${Number(doi.avgDailyConsumption).toLocaleString('en-IN')} ${uom}` : `0 ${uom}`}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Current Available Stock</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {doi.currentAvailableStock != null ? `${Number(doi.currentAvailableStock).toLocaleString('en-IN')} ${uom}` : `0 ${uom}`}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Days of Inventory</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: 'warning.main' }}>
                {doi.daysOfInventory != null ? `${doi.daysOfInventory} Days` : '0 Days'}
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.08)' : 'rgba(211, 47, 47, 0.04)' }}>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Projected Stockout Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: '#f44336' }}>
                {doi.projectedStockoutDate || '-'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
