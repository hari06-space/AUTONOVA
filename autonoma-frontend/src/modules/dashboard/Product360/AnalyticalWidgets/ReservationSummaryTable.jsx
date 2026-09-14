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
  Box
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function ReservationSummaryTable({ reservations = [], onRowClick }) {
  const theme = useTheme();
  const totalReserved = reservations.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Reservation Summary
        </Typography>
      </Box>
      <CardContent sx={{ p: '0 !important', flexGrow: 1, overflow: 'auto' }} className="p360-scroll">
        <Table size="small" className="p360-table">
          <TableHead>
            <TableRow>
              <TableCell>Reservation Type</TableCell>
              <TableCell align="right">Qty (NOS)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservations.map((row, idx) => (
              <TableRow
                key={idx}
                hover
                onClick={() => onRowClick && onRowClick(row)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell sx={{ fontWeight: 600 }}>{row.reservationType}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {Number(row.quantity).toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            ))}
            {/* Total Row */}
            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              <TableCell sx={{ fontWeight: 800 }}>Total Reserved</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: 'warning.dark' }}>
                {totalReserved.toLocaleString('en-IN')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
