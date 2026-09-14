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
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function DivisionStockTable({ divisionStocks = [], onRowClick }) {
  const theme = useTheme();

  // Always use the real division stocks array provided by backend/master
  const displayRows = divisionStocks || [];

  const totalCurrent = displayRows.reduce((acc, r) => acc + (Number(r.currentStock) || 0), 0);
  const totalReserved = displayRows.reduce((acc, r) => acc + (Number(r.reserved) || 0), 0);
  const totalAvailable = displayRows.reduce((acc, r) => acc + (Number(r.available) || 0), 0);
  const totalValue = displayRows.reduce((acc, r) => acc + (Number(r.stockValue) || 0), 0);

  const formatLakhs = (val) => {
    if (val >= 10000000) {
      return `₹ ${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹ ${(val / 100000).toFixed(2)} L`;
    }
    return `₹ ${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.82rem' }}>
          Stock Overview (Division Wise)
        </Typography>
      </Box>
      <CardContent sx={{ p: '0 !important', flexGrow: 1, overflow: 'auto' }} className="p360-scroll">
        <Table size="small" className="p360-table">
          <TableHead>
            <TableRow>
              <TableCell>Division</TableCell>
              <TableCell align="right">Current Stock</TableCell>
              <TableCell align="right">Reserved</TableCell>
              <TableCell align="right">Available</TableCell>
              <TableCell align="right">Stock Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '0.75rem' }}>
                  No divisions configured
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, idx) => (
                <TableRow
                  key={row.divisionId || idx}
                  hover
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    <Tooltip title={`Division: ${row.divisionName}`} arrow enterDelay={150}>
                      <span>{row.divisionName}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    <Tooltip title={`Current Stock in ${row.divisionName}: ${Number(row.currentStock || 0).toLocaleString('en-IN')}`} arrow enterDelay={150}>
                      <span>{Number(row.currentStock || 0).toLocaleString('en-IN')}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 700 }}>
                    <Tooltip title={`Reserved Stock in ${row.divisionName}: ${Number(row.reserved || 0).toLocaleString('en-IN')}`} arrow enterDelay={150}>
                      <span>{Number(row.reserved || 0).toLocaleString('en-IN')}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 800 }}>
                    <Tooltip title={`Available Stock in ${row.divisionName}: ${Number(row.available || 0).toLocaleString('en-IN')}`} arrow enterDelay={150}>
                      <span>{Number(row.available || 0).toLocaleString('en-IN')}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    <Tooltip title={`Total Valuation in ${row.divisionName}: ${row.stockValueFormatted || formatLakhs(row.stockValue || 0)}`} arrow enterDelay={150}>
                      <span>{row.stockValueFormatted || formatLakhs(row.stockValue || 0)}</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
            {/* Total Row */}
            {displayRows.length > 0 && (
              <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {totalCurrent.toLocaleString('en-IN')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'warning.main' }}>
                  {totalReserved.toLocaleString('en-IN')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'success.main' }}>
                  {totalAvailable.toLocaleString('en-IN')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                  {formatLakhs(totalValue)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
