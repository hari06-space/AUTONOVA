import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  InputAdornment,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Popover,
  Stack,
  Divider,
  Button,
  Grid,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { IconSearch, IconX, IconAdjustmentsHorizontal, IconMicrophone, IconRefresh, IconPlus, IconCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { BOSMovableDialog, BOSTextField } from 'ui-component/bos';

export default function CustomerLookupDialog({ open, onClose, onSelect }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [nameSearch, setNameSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [gstFilter, setGstFilter] = useState('');
  
  const [activeFilters, setActiveFilters] = useState([]);
  const [tempSelectedFilters, setTempSelectedFilters] = useState([]);
  const [addFilterAnchorEl, setAddFilterAnchorEl] = useState(null);
  const isAddFilterOpen = Boolean(addFilterAnchorEl);
  const optionalFiltersList = ['CITY', 'GST NUMBER'];

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const openFilter = Boolean(filterAnchorEl);

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios.get(API_PATHS.SM.CUSTOMERS)
        .then((res) => {
          setCustomers(res.data || []);
        })
        .catch((err) => console.error('Failed to load customers for lookup:', err))
        .finally(() => setLoading(false));
    } else {
      setFilterAnchorEl(null);
      setAddFilterAnchorEl(null);
    }
  }, [open]);

  const customerGroups = useMemo(() => {
    const groups = new Set(customers.map(c => c.category || c.customerGroup || 'N/A').filter(g => g !== 'N/A'));
    return ['All', ...Array.from(groups)];
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const group = (c.category || c.customerGroup || 'N/A').toLowerCase();
      const name = (c.customerName || c.ledgerName || '').toLowerCase();
      const code = (c.customerCode || c.code || '').toLowerCase();
      const gst = (c.gstin || '').toLowerCase();
      const city = (c.city || '').toLowerCase();

      // Outer global search
      const term = search.trim().toLowerCase();
      const matchesSearch = !term || (
        name.includes(term) || code.includes(term) || 
        gst.includes(term) || city.includes(term)
      );

      // Inner popover filters
      const matchesGroup = groupFilter === 'All' || group === groupFilter.toLowerCase();
      const nameTerm = nameSearch.trim().toLowerCase();
      const matchesName = !nameTerm || name.includes(nameTerm) || code.includes(nameTerm);

      const cityTerm = cityFilter.trim().toLowerCase();
      const matchesCity = !cityTerm || city.includes(cityTerm);
      const gstTerm = gstFilter.trim().toLowerCase();
      const matchesGst = !gstTerm || gst.includes(gstTerm);

      return matchesSearch && matchesGroup && matchesName && matchesCity && matchesGst;
    });
  }, [customers, search, groupFilter, nameSearch, cityFilter, gstFilter]);

  const paginatedCustomers = useMemo(() => {
    return filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  const handleRowDoubleClick = (c) => {
    onSelect(c);
    onClose();
  };

  const handleKeyPress = (e, c) => {
    if (e.key === 'Enter') {
      onSelect(c);
      onClose();
    }
  };

  return (
    <BOSMovableDialog
      open={open}
      onClose={onClose}
      title="Select Customer"
      defaultWidth={1400}
      defaultHeight={820}
    >

      <DialogContent sx={{ p: 2, pt: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Global Filter Bar */}
        <Box sx={{ width: '100%' }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ width: '60%' }}>
              <BOSTextField
                fullWidth
                placeholder="Search in current page / Use # for page search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch stroke={1.5} size="16px" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" color="primary">
                        <IconMicrophone stroke={1.5} size="16px" />
                      </IconButton>
                      <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                      <IconButton 
                        size="small" 
                        color={groupFilter !== 'All' || nameSearch !== '' || cityFilter !== '' || gstFilter !== '' ? 'warning' : 'inherit'}
                        onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                      >
                        <IconAdjustmentsHorizontal stroke={1.5} size="16px" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Popover
                open={openFilter}
                anchorEl={filterAnchorEl}
                onClose={() => setFilterAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ zIndex: 1700 }}
                disableEnforceFocus
                disableAutoFocus
                PaperProps={{
                  sx: {
                    width: 640,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: (theme) => `0 12px 32px ${theme.palette.divider}`,
                    border: '1px solid',
                    borderColor: 'divider',
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{
                    position: 'relative', px: 2.5, pt: 2.2, pb: 1.8,
                    borderBottom: '1px solid', borderColor: 'divider',
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(30,32,46,1) 0%, rgba(25,28,42,1) 100%)'
                      : 'linear-gradient(135deg, rgba(248,250,255,1) 0%, rgba(255,255,255,1) 100%)',
                    overflow: 'hidden',
                  }}>
                    <Box sx={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                      background: (theme) => `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      borderRadius: '0 2px 2px 0',
                    }} />
                    <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                      <Box sx={{
                        width: 38, height: 38, borderRadius: '11px', flexShrink: 0,
                        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}40`,
                      }}>
                        <IconAdjustmentsHorizontal size={17} color="#fff" />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.3px', lineHeight: 1.2, color: 'text.primary' }}>
                          Global Filters
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', fontWeight: 500, lineHeight: 1.4, mt: 0.3 }}>
                          Filter business information across this view
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.8} alignItems="center" sx={{ flexShrink: 0, mt: 0.3 }}>
                        <Box sx={{
                          px: 1, py: 0.25, borderRadius: '6px',
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                          border: '1px solid', borderColor: 'divider',
                        }}>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                            {2 + activeFilters.length} FIELDS
                          </Typography>
                        </Box>
                        <Box sx={{
                          px: 1, py: 0.25, borderRadius: '6px',
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,200,83,0.12)' : 'rgba(0,160,67,0.08)',
                          border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,200,83,0.3)' : 'rgba(0,160,67,0.2)',
                          display: 'flex', alignItems: 'center', gap: 0.5,
                        }}>
                          <Box sx={{
                            width: 5, height: 5, borderRadius: '50%', bgcolor: '#00C853',
                            animation: 'bosPulse 2s infinite',
                            '@keyframes bosPulse': { '0%, 100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.5, transform: 'scale(0.8)' } }
                          }} />
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#00C853', letterSpacing: '0.3px' }}>
                            LIVE
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setFilterAnchorEl(null)} sx={{ width: 26, height: 26, borderRadius: '7px', color: 'text.secondary' }}>
                          <IconX size={14} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>

                  <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {/* Customer Group Field */}
                      <Box sx={{
                        flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                        minWidth: { xs: '100%', sm: 'calc(50% - 6px)' },
                        p: '10px 14px 12px', borderRadius: '12px',
                        border: '1px solid', borderColor: groupFilter !== 'All' ? 'primary.main' : 'divider',
                        bgcolor: groupFilter !== 'All' ? (theme) => theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)' : 'background.paper',
                        transition: 'all 0.18s',
                        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                      }}>
                        <Typography sx={{
                          fontSize: '0.67rem', fontWeight: 700,
                          color: groupFilter !== 'All' ? 'primary.main' : 'text.disabled',
                          textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1, lineHeight: 1
                        }}>
                          Customer Group
                        </Typography>
                        <BOSTextField
                          select
                          fullWidth
                          value={groupFilter}
                          onChange={(e) => setGroupFilter(e.target.value)}
                          variant="standard"
                          InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', fontWeight: 600 } }}
                        >
                          {customerGroups.map((g) => (
                            <MenuItem key={g} value={g}>{g}</MenuItem>
                          ))}
                        </BOSTextField>
                      </Box>
                      
                      {/* Customer Name Field */}
                      <Box sx={{
                        flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                        minWidth: { xs: '100%', sm: 'calc(50% - 6px)' },
                        p: '10px 14px 12px', borderRadius: '12px',
                        border: '1px solid', borderColor: nameSearch !== '' ? 'primary.main' : 'divider',
                        bgcolor: nameSearch !== '' ? (theme) => theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)' : 'background.paper',
                        transition: 'all 0.18s',
                        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                      }}>
                        <Typography sx={{
                          fontSize: '0.67rem', fontWeight: 700,
                          color: nameSearch !== '' ? 'primary.main' : 'text.disabled',
                          textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1, lineHeight: 1
                        }}>
                          Customer Name
                        </Typography>
                        <BOSTextField
                          fullWidth
                          placeholder="Enter customer name..."
                          value={nameSearch}
                          onChange={(e) => setNameSearch(e.target.value)}
                          variant="standard"
                          InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', fontWeight: 600 } }}
                        />
                      </Box>
                    </Box>

                    {activeFilters.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
                        {/* City Field */}
                        {activeFilters.includes('CITY') && (
                          <Box sx={{
                            flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                            minWidth: { xs: '100%', sm: 'calc(50% - 6px)' },
                            p: '10px 14px 12px', borderRadius: '12px',
                            border: '1px solid', borderColor: cityFilter !== '' ? 'primary.main' : 'divider',
                            bgcolor: cityFilter !== '' ? (theme) => theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)' : 'background.paper',
                            transition: 'all 0.18s',
                            '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                          }}>
                            <Typography sx={{
                              fontSize: '0.67rem', fontWeight: 700,
                              color: cityFilter !== '' ? 'primary.main' : 'text.disabled',
                              textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1, lineHeight: 1
                            }}>
                              City
                            </Typography>
                            <BOSTextField
                              fullWidth
                              placeholder="Enter city..."
                              value={cityFilter}
                              onChange={(e) => setCityFilter(e.target.value)}
                              variant="standard"
                              InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', fontWeight: 600 } }}
                            />
                          </Box>
                        )}
                        {/* GST Number Field */}
                        {activeFilters.includes('GST NUMBER') && (
                          <Box sx={{
                            flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                            minWidth: { xs: '100%', sm: 'calc(50% - 6px)' },
                            p: '10px 14px 12px', borderRadius: '12px',
                            border: '1px solid', borderColor: gstFilter !== '' ? 'primary.main' : 'divider',
                            bgcolor: gstFilter !== '' ? (theme) => theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)' : 'background.paper',
                            transition: 'all 0.18s',
                            '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                          }}>
                            <Typography sx={{
                              fontSize: '0.67rem', fontWeight: 700,
                              color: gstFilter !== '' ? 'primary.main' : 'text.disabled',
                              textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1, lineHeight: 1
                            }}>
                              GST Number
                            </Typography>
                            <BOSTextField
                              fullWidth
                              placeholder="Enter GST..."
                              value={gstFilter}
                              onChange={(e) => setGstFilter(e.target.value)}
                              variant="standard"
                              InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', fontWeight: 600 } }}
                            />
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{
                    p: 2, borderTop: '1px solid', borderColor: 'divider',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f8f9fa',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <Box>
                      <Button
                        variant="text" size="small"
                        startIcon={<IconPlus size={14} />}
                        onClick={(e) => {
                          setTempSelectedFilters([...activeFilters]);
                          setAddFilterAnchorEl(e.currentTarget);
                        }}
                        sx={{
                          borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem',
                          px: 1.5, color: 'text.secondary',
                          '&:hover': { bgcolor: 'action.hover', color: 'primary.main' }
                        }}
                      >
                        Add filters
                      </Button>

                      <Popover
                        open={isAddFilterOpen}
                        anchorEl={addFilterAnchorEl}
                        onClose={() => setAddFilterAnchorEl(null)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        disableEnforceFocus
                        disableAutoFocus
                        sx={{ zIndex: 1800 }}
                        slotProps={{
                          paper: {
                            sx: {
                              p: 1.5,
                              boxShadow: (theme) => `0 12px 30px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.15)'}`,
                              border: '1px solid', borderColor: 'divider',
                              width: 360, mb: 1, borderRadius: '16px',
                              WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)',
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,32,40,0.95)' : 'rgba(255,255,255,0.95)'
                            }
                          }
                        }}
                      >
                        <Stack spacing={1.5}>
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.65rem', letterSpacing: '0.6px' }}>
                                ADD/REMOVE FILTERS
                              </Typography>
                              <IconButton size="small" onClick={() => setAddFilterAnchorEl(null)} sx={{ p: 0.2, color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}>
                                <IconX size={14} />
                              </IconButton>
                            </Stack>
                            <Divider sx={{ my: '4px !important' }} />
                            <Box sx={{ maxHeight: 240, overflowY: 'auto', overflowX: 'hidden' }}>
                              <Grid container spacing={0}>
                                {optionalFiltersList.map((filterName) => (
                                  <Grid item xs={6} key={filterName}>
                                    <FormControlLabel
                                      sx={{ m: 0, px: 1, py: 0.5, width: '100%', borderRadius: '8px', transition: 'all 0.15s', '&:hover': { bgcolor: 'action.hover' } }}
                                      control={
                                        <Checkbox
                                          size="small"
                                          checked={tempSelectedFilters.includes(filterName)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setTempSelectedFilters([...tempSelectedFilters, filterName]);
                                            } else {
                                              setTempSelectedFilters(tempSelectedFilters.filter(f => f !== filterName));
                                              if (filterName === 'CITY') setCityFilter('');
                                              if (filterName === 'GST NUMBER') setGstFilter('');
                                            }
                                          }}
                                          sx={{ p: 0.5, mr: 0.5 }}
                                        />
                                      }
                                      label={
                                        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}>
                                          {filterName}
                                        </Typography>
                                      }
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Button
                              size="small" variant="outlined" color="inherit"
                              onClick={() => {
                                setTempSelectedFilters([]);
                                setActiveFilters([]);
                                setCityFilter('');
                                setGstFilter('');
                              }}
                              startIcon={<IconRefresh size={14} />}
                              sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              Reset
                            </Button>
                            <Button
                              size="small" variant="contained" color="primary"
                              onClick={() => {
                                setActiveFilters([...tempSelectedFilters]);
                                setAddFilterAnchorEl(null);
                              }}
                              startIcon={<IconCheck size={14} />}
                              sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              Apply
                            </Button>
                          </Stack>
                        </Stack>
                      </Popover>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => { setGroupFilter('All'); setNameSearch(''); setCityFilter(''); setGstFilter(''); }}
                        sx={{ color: 'text.secondary', border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}
                      >
                        <IconRefresh size={16} />
                        <Typography sx={{ ml: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>Clear</Typography>
                      </IconButton>
                      <Box
                        onClick={() => setFilterAnchorEl(null)}
                        sx={{
                          display: 'flex', alignItems: 'center', px: 2, py: 0.5,
                          bgcolor: 'primary.main', color: '#fff', borderRadius: '8px', cursor: 'pointer',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }}
                      >
                        <IconSearch size={16} />
                        <Typography sx={{ ml: 0.5, fontSize: '0.75rem', fontWeight: 700 }}>Search</Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </Popover>
            </Box>
          </Stack>
        </Box>

        {/* Table Container */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px', flex: 1, minHeight: 480, overflowX: 'auto', overflowY: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#2196F3' }}>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', width: 40 }}>#</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>CUSTOMER CODE</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>CUSTOMER NAME</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>CUSTOMER GROUP</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>GST NUMBER</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>CITY</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>STATE</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>Loading customers...</TableCell>
                </TableRow>
              ) : paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No customers found</TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((c, index) => (
                  <TableRow
                    key={c.id}
                    hover
                    onClick={() => handleRowDoubleClick(c)}
                    onDoubleClick={() => handleRowDoubleClick(c)}
                    onKeyDown={(e) => handleKeyPress(e, c)}
                    tabIndex={0}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'primary.main' }}>{c.customerCode || c.code}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{c.customerName || c.ledgerName}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{c.category || c.customerGroup || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{c.gstin || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{c.city || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{c.state || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{c.isActive ? 'ACTIVE' : 'INACTIVE'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Bottom Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', pt: 1 }}>
          <TablePagination
            component="div"
            count={filteredCustomers.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Box>
      </DialogContent>

    </BOSMovableDialog>
  );
}

CustomerLookupDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};
