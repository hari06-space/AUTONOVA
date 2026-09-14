import React from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableRow, TableCell, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function PurchasePipelineCard({ pipeline = {}, onViewAllPurchase }) {
  const theme = useTheme();

  const items = [
    { label: 'Open PR Qty', value: pipeline.openPrQty || 0, color: 'text.primary' },
    { label: 'Open RFQ Qty', value: pipeline.openRfqQty || 0, color: 'text.primary' },
    { label: 'Open PO Qty', value: pipeline.openPoQty || 0, color: 'primary.main' },
    { label: 'In Transit', value: pipeline.inTransit || 0, color: 'info.main' },
    { label: 'Expected GRN', value: pipeline.expectedGrn || 0, color: 'success.main' }
  ];

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Open Purchase Pipeline
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
          ({pipeline.uom || 'NOS'})
        </Typography>
      </Box>
      <CardContent sx={{ p: '0 !important', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Table size="small" className="p360-table">
          <TableBody>
            {items.map((it, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{it.label}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: it.color }}>
                  {Number(it.value).toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ p: 1.5, pt: 0.5 }}>
          <Button
            size="small"
            variant="text"
            color="primary"
            onClick={onViewAllPurchase}
            sx={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, p: 0 }}
          >
            View All Purchase →
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
