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
  Chip,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconPackages } from '@tabler/icons-react';

export default function OpenBatchDetailsTable({ openBatches = [], onBatchClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const rows = Array.isArray(openBatches) ? openBatches : [];

  return (
    <Card className="p360-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, pb: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        <Chip
          label={`${rows.length} ${rows.length === 1 ? 'Batch' : 'Batches'}`}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.65rem',
            height: 20,
            bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#e0f2fe',
            color: '#0284c7'
          }}
        />
      </Box>

      <CardContent sx={{ p: '0 !important', flexGrow: 1, overflow: 'auto' }} className="p360-scroll">
        <Table size="small" className="p360-table">
          <TableHead>
            <TableRow>
              <TableCell>Batch No</TableCell>
              <TableCell>Supplier / Ledger</TableCell>
              <TableCell>GRN No</TableCell>
              <TableCell>GRN Date</TableCell>
              <TableCell align="right">Batch Qty</TableCell>
              <TableCell align="right">Qty Out</TableCell>
              <TableCell align="right">Batch Stock</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '0.75rem' }}>
                  No open batch records found for this product.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  hover
                  onClick={() => onBatchClick && onBatchClick(row)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 800, color: '#1565c0', whiteSpace: 'nowrap' }}>
                    <Tooltip title={`Batch: ${row.batchNo || '-'}`} arrow enterDelay={150}>
                      <span>{row.batchNo || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Tooltip title={row.ledgerName || '-'} arrow enterDelay={150}>
                      <span>{row.ledgerName || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    <Tooltip title={`GRN Reference: ${row.grnNo || '-'}`} arrow enterDelay={150}>
                      <span>{row.grnNo || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.72rem' }}>
                    {row.grnDateFormatted || row.grnDate || '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {Number(row.batchQty ?? row.grnQty ?? 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    {Number(row.qtyOut ?? 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: Number(row.stock || 0) > 0 ? 'success.main' : 'text.secondary' }}>
                    {Number(row.stock || 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={String(row.activeStatus || row.statusName || 'OPEN').toUpperCase()}
                      size="small"
                      sx={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        height: 18,
                        bgcolor: (String(row.activeStatus).toUpperCase() === 'OPEN' || String(row.activeStatus).toUpperCase() === 'ACTIVE' || row.activeStatus === 1)
                          ? (isDark ? 'rgba(74, 222, 128, 0.15)' : '#e8f5e9')
                          : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2'),
                        color: (String(row.activeStatus).toUpperCase() === 'OPEN' || String(row.activeStatus).toUpperCase() === 'ACTIVE' || row.activeStatus === 1) ? '#2e7d32' : '#dc2626'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
