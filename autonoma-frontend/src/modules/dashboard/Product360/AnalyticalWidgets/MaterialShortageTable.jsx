import React from 'react';
import {
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  Button,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function MaterialShortageTable({ materialShortages = [], onViewAllShortages }) {
  const theme = useTheme();

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Material Shortage (For Open Routing Cards)
        </Typography>
      </Box>
      <CardContent sx={{ p: '0 !important', flexGrow: 1, overflow: 'auto' }} className="p360-scroll">
        <Table size="small" className="p360-table">
          <TableHead>
            <TableRow>
              <TableCell>Material Code</TableCell>
              <TableCell align="right">Required</TableCell>
              <TableCell align="right">Available</TableCell>
              <TableCell align="right">Shortage</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materialShortages.map((m, idx) => {
              const isShort = m.status === 'SHORT' || (Number(m.shortageQty) > 0);
              return (
                <TableRow key={m.materialId || idx} hover sx={{ cursor: 'pointer' }} onClick={onViewAllShortages}>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {m.materialCode}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {Number(m.requiredQty).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {Number(m.availableQty).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: isShort ? '#f44336' : 'text.secondary' }}>
                    {Number(m.shortageQty).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={m.status || (isShort ? 'SHORT' : 'OK')}
                      size="small"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        height: 20,
                        bgcolor: isShort ? 'rgba(211, 47, 47, 0.15)' : 'rgba(46, 125, 50, 0.15)',
                        color: isShort ? '#f44336' : '#4caf50',
                        border: isShort ? '1px solid rgba(244, 67, 54, 0.3)' : '1px solid rgba(76, 175, 80, 0.3)'
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <Box sx={{ p: 1.5, pt: 0.5 }}>
        <Button
          size="small"
          variant="text"
          color="primary"
          onClick={onViewAllShortages}
          sx={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, p: 0 }}
        >
          View All Material Shortage →
        </Button>
      </Box>
    </Card>
  );
}
