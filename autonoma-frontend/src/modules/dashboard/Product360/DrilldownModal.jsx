import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconX } from '@tabler/icons-react';

export default function DrilldownModal({ open, onClose, title, data = [], loading = false }) {
  const theme = useTheme();

  const formatHeader = (key) => {
    const customHeaders = {
      batchNo: 'Batch No',
      ledgerName: 'Supplier / Ledger',
      grnNo: 'GRN No',
      grnDate: 'GRN Date',
      grnDateFormatted: 'GRN Date',
      grnQty: 'GRN Qty',
      stock: 'Current Stock',
      activeStatus: 'Status',
      qtyIn: 'In Qty',
      qtyOut: 'Out Qty',
      balanceStock: 'Balance Stock',
      location: 'Location / Bin',
      division: 'Division',
      divisionName: 'Division Name',
      refDocNo: 'Reference Doc',
      reservedFor: 'Reserved Purpose',
      reservedQty: 'Reserved Qty'
    };
    if (customHeaders[key]) return customHeaders[key];
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  };

  const renderHeaders = () => {
    if (!data || data.length === 0) return null;
    const sample = data[0];
    return Object.keys(sample).map((key) => (
      <TableCell key={key} sx={{ fontWeight: 700 }}>
        {formatHeader(key)}
      </TableCell>
    ));
  };

  const renderCellContent = (val) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    if (typeof val === 'string' && (val === 'ACTIVE' || val === 'COMPLETED' || val === 'OK' || val === 'SAFE')) {
      return <Chip label={val} size="small" color="success" sx={{ fontSize: '0.65rem', height: 20 }} />;
    }
    if (typeof val === 'string' && (val === 'DELAYED' || val === 'SHORT' || val === 'CRITICAL' || val === 'HIGH')) {
      return <Chip label={val} size="small" color="error" sx={{ fontSize: '0.65rem', height: 20 }} />;
    }
    if (typeof val === 'string' && (val === 'ON HOLD' || val === 'LOW BUFFER' || val === 'WARNING' || val === 'MEDIUM')) {
      return <Chip label={val} size="small" color="warning" sx={{ fontSize: '0.65rem', height: 20 }} />;
    }
    if (typeof val === 'number') {
      return val.toLocaleString('en-IN');
    }
    return String(val);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {title || 'Drill-Down Details'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2, minHeight: 250 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress size={32} />
          </Box>
        ) : !data || data.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography variant="body2" color="textSecondary">
              No detailed records found for the selected filter.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" className="p360-table">
              <TableHead>
                <TableRow>{renderHeaders()}</TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={idx} hover>
                    {Object.keys(row).map((key, cIdx) => (
                      <TableCell key={cIdx}>{renderCellContent(row[key])}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 1.5 }}>
        <Button onClick={onClose} variant="contained" color="primary" size="small" sx={{ borderRadius: '6px' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
