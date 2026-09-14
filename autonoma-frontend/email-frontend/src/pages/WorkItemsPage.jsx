import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import { processingService } from '../api/services';

const WorkItemsPage = () => {
  const [data, setData] = useState([]);
  
  // Filter states
  const [fromDate, setFromDate] = useState('2026-05-03');
  const [toDate, setToDate] = useState('2026-05-08');
  const [considerDate, setConsiderDate] = useState('Yes');
  const [category, setCategory] = useState('All');
  const [mode, setMode] = useState('All');
  const [status, setStatus] = useState('Workitem Pending');
  const [searchBy, setSearchBy] = useState('Work Item No');
  const [searchValue, setSearchValue] = useState('');

  const loadData = async () => {
    try {
      const res = await processingService.getAll();
      setData(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Box className="page-header" sx={{ flexShrink: 0, mb: 3 }}>
        <h1 className="page-header__title">Work Items</h1>
      </Box>

      <Paper sx={{ p: 2, mb: 2, bgcolor: '#161D30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item>
            <TextField
              label="From Date"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true, style: { color: '#9AA0B0' } }}
              InputProps={{ style: { color: '#fff', borderColor: 'rgba(255,255,255,0.2)' } }}
              sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } } }}
            />
          </Grid>
          <Grid item>
            <TextField
              label="To Date"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true, style: { color: '#9AA0B0' } }}
              InputProps={{ style: { color: '#fff' } }}
              sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } } }}
            />
          </Grid>
          <Grid item>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#9AA0B0' }}>Consider Date?</InputLabel>
              <Select
                value={considerDate}
                label="Consider Date?"
                onChange={(e) => setConsiderDate(e.target.value)}
                sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#9AA0B0' }}>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
                sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                <MenuItem value="All">All</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#9AA0B0' }}>Mode</InputLabel>
              <Select
                value={mode}
                label="Mode"
                onChange={(e) => setMode(e.target.value)}
                sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                <MenuItem value="All">All</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: '#9AA0B0' }}>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
                sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                <MenuItem value="Workitem Pending">Workitem Pending</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: '#9AA0B0' }}>Search By</InputLabel>
              <Select
                value={searchBy}
                label="Search By"
                onChange={(e) => setSearchBy(e.target.value)}
                sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                <MenuItem value="Work Item No">Work Item No</MenuItem>
                <MenuItem value="Customer Name">Customer Name</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item>
            <TextField
              label="Search Value"
              size="small"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              InputLabelProps={{ style: { color: '#9AA0B0' } }}
              InputProps={{ style: { color: '#fff' } }}
              sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } } }}
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={loadData}
              sx={{ bgcolor: '#6C63FF', '&:hover': { bgcolor: '#5A52D5' }, height: 40 }}
            >
              Get Details
            </Button>
          </Grid>
          <Grid item>
            <IconButton sx={{ border: '1px solid #00D9A6', color: '#00D9A6', borderRadius: 1, height: 40, width: 40 }}>
              <DownloadIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ bgcolor: '#161D30', flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>WI NO</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>DATE & TIME</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>CATEGORY</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>CUST CODE</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>CUST NAME</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>FROM</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>TO</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>SUBJECT</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>NO OF ITEMS</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>ENQUIRY NO</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>Enq Entry</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>Quote No</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>Quote Entry</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>Sale Order No</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>Sale Order Entr</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>Att</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>Mode</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>Updated User Id</TableCell>
              <TableCell sx={{ bgcolor: '#1B243B', color: '#9AA0B0', fontWeight: 'bold', fontSize: '0.75rem' }}>Updated Date Tim</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={row.id || index} hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.05)' } }}>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>#{row.id}</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>{new Date(row.emailReceivedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Box sx={{ border: '1px solid #1E4976', color: '#4DA3FF', px: 1, py: 0.2, borderRadius: 4, display: 'inline-block', fontSize: '0.7rem' }}>
                    {row.intent || 'GENERAL_INQUIRY'}
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>{row.customerName || '-'}</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>{row.emailFrom}</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>{row.emailSubject}</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>{row.quotationNo || row.invoiceNo || '-'}</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>{row.quotationNo || '-'}</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
                <TableCell sx={{ color: '#fff', fontSize: '0.8rem' }}>-</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={19} align="center" sx={{ color: '#9AA0B0', py: 3 }}>No records found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkItemsPage;
