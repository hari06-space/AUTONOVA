import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'utils/axios';

// material-ui
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';

export default function UnallocatedResourcesModal({ open, handleClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios.get('/api/qms/meeting-schedules/unallocated-resources')
        .then(response => {
          setData(response.data || []);
        })
        .catch(err => {
          console.error('Error fetching unallocated resources', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Unallocated Resources (Available Employees)</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : data.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ p: 2 }}>
            No unallocated resources found.
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 650 }} aria-label="unallocated resources table">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Employee Code</strong></TableCell>
                  <TableCell><strong>Employee Name</strong></TableCell>
                  <TableCell><strong>Department</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.empCode}</TableCell>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{row.departmentName || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

UnallocatedResourcesModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
};
