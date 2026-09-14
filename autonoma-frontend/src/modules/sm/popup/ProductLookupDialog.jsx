import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
  MenuItem,
  Box,
  Typography,
  Select,
  TextField,
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

export default function ProductLookupDialog({ open, onClose, onSelect }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [prodTypeFilter, setProdTypeFilter] = useState('All');
  const [partNoSearch, setPartNoSearch] = useState('');
  const [partNameSearch, setPartNameSearch] = useState('');
  const [oemSearch, setOemSearch] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  
  const [activeFilters, setActiveFilters] = useState([]);
  const [tempSelectedFilters, setTempSelectedFilters] = useState([]);
  const [addFilterAnchorEl, setAddFilterAnchorEl] = useState(null);
  const isAddFilterOpen = Boolean(addFilterAnchorEl);
  const optionalFiltersList = ['PART NAME', 'OEM PART NO', 'CUSTOMER PART NO', 'CATEGORY'];

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const openFilter = Boolean(filterAnchorEl);

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios.get(API_PATHS.NPD.PRODUCT_MASTER)
        .then((res) => {
          setProducts(res.data || []);
        })
        .catch((err) => console.error('Failed to load products for lookup:', err))
        .finally(() => setLoading(false));
    } else {
      setFilterAnchorEl(null);
      setAddFilterAnchorEl(null);
    }
  }, [open]);

  // Unique Prod Types
  const prodTypes = useMemo(() => {
    const types = new Set(products.map((p) => p.itemType || p.prodType || p.itemCategory).filter(Boolean));
    return ['All', ...Array.from(types)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = (p.itemName || '').toLowerCase();
      const code = (p.itemNo || '').toLowerCase();
      const oem = (p.oemPartNo || p.oemNo || '').toLowerCase();
      const cust = (p.custPartNo || p.customerPartNo || '').toLowerCase();
      const cat = (p.itemCategory || '').toLowerCase();
      const pType = (p.itemType || p.prodType || p.itemCategory || 'All').toLowerCase();

      // Outer global search
      const term = search.trim().toLowerCase();
      const matchesSearch = !term || (
        code.includes(term) || name.includes(term) || oem.includes(term) || cust.includes(term) || cat.includes(term)
      );

      // Inner popover filters
      const matchesType = prodTypeFilter === 'All' || pType === prodTypeFilter.toLowerCase();
      
      const noTerm = partNoSearch.trim().toLowerCase();
      const matchesNo = !noTerm || code.includes(noTerm) || cust.includes(noTerm);

      const nameTerm = partNameSearch.trim().toLowerCase();
      const matchesName = !nameTerm || name.includes(nameTerm);

      const oemTerm = oemSearch.trim().toLowerCase();
      const matchesOem = !oemTerm || oem.includes(oemTerm);

      const custTerm = custSearch.trim().toLowerCase();
      const matchesCust = !custTerm || cust.includes(custTerm);

      const catTerm = catSearch.trim().toLowerCase();
      const matchesCat = !catTerm || cat.includes(catTerm);

      return matchesSearch && matchesType && matchesNo && matchesName && matchesOem && matchesCust && matchesCat;
    });
  }, [products, search, prodTypeFilter, partNoSearch, partNameSearch, oemSearch, custSearch, catSearch]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  const handleRowDoubleClick = (p) => {
    onSelect(p);
    onClose();
  };

  return (
    <BOSMovableDialog
      open={open}
      onClose={onClose}
      title="Part Details"
      defaultWidth={1400}
      defaultHeight={820}
      disableEnforceFocus
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
                        color={prodTypeFilter !== 'All' || partNoSearch !== '' || partNameSearch !== '' || oemSearch !== '' || custSearch !== '' || catSearch !== '' ? 'warning' : 'inherit'}
                        onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                      >
                        <IconAdjustmentsHorizontal stroke={1.5} size="16px" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          </Stack>

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
                mt: 1.5,
                width: 460,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: (theme) => theme.palette.mode === 'dark' 
                  ? '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
                  : '0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
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
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ alignSelf: 'flex-start' }}>
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
                      bgcolor: 'success.main', color: '#fff',
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      boxShadow: '0 2px 6px rgba(46,125,50,0.3)',
                    }}>
                      <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#fff', animation: 'pulse 2s infinite' }} />
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.3px' }}>LIVE</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setFilterAnchorEl(null)} sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.lighter' } }}>
                      <IconX size={16} stroke={2.5} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>

              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {/* Prod Type Field */}
                  <Box sx={{
                    flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                    minWidth: { xs: '100%', sm: 'calc(50% - 6px)' },
                    p: '10px 14px 12px', borderRadius: '12px',
                    border: '1px solid', borderColor: prodTypeFilter !== 'All' ? 'primary.main' : 'divider',
                    bgcolor: prodTypeFilter !== 'All' ? (theme) => theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)' : 'background.paper',
                    transition: 'all 0.18s',
                    '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                  }}>
                    <Typography sx={{
                      fontSize: '0.67rem', fontWeight: 700,
                      color: prodTypeFilter !== 'All' ? 'primary.main' : 'text.disabled',
                      textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1, lineHeight: 1
                    }}>
                      Prod Type
                    </Typography>
                    <BOSTextField
                      select
                      fullWidth
                      value={prodTypeFilter}
                      onChange={(e) => setProdTypeFilter(e.target.value)}
                      variant="standard"
                      InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', fontWeight: 600 } }}
                    >
                      {prodTypes.map((pt) => (
                        <MenuItem key={pt} value={pt}>{pt}</MenuItem>
                      ))}
                    </BOSTextField>
                  </Box>
                  
                  {/* Part No Field */}
                  <Box sx={{
                    flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                    minWidth: { xs: '100%', sm: 'calc(50% - 6px)' },
                    p: '10px 14px 12px', borderRadius: '12px',
                    border: '1px solid', borderColor: partNoSearch !== '' ? 'primary.main' : 'divider',
                    bgcolor: partNoSearch !== '' ? (theme) => theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)' : 'background.paper',
                    transition: 'all 0.18s',
                    '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                  }}>
                    <Typography sx={{
                      fontSize: '0.67rem', fontWeight: 700,
                      color: partNoSearch !== '' ? 'primary.main' : 'text.disabled',
                      textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1, lineHeight: 1
                    }}>
                      Part No
                    </Typography>
                    <BOSTextField
                      fullWidth
                      placeholder="Enter part no..."
                      value={partNoSearch}
                      onChange={(e) => setPartNoSearch(e.target.value)}
                      variant="standard"
                      InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', fontWeight: 600 } }}
                    />
                  </Box>
                </Box>

                {activeFilters.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
                    {/* Part Name Field */}
                    {activeFilters.includes('PART NAME') && (
                      <Box sx={{
                        flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                      minWidth: { xs: '100%', sm: 'calc(50% - 6px)' },
                      p: '10px 14px 12px', borderRadius: '12px',
                      border: '1px solid', borderColor: partNameSearch !== '' ? 'primary.main' : 'divider',
                      bgcolor: partNameSearch !== '' ? (theme) => theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)' : 'background.paper',
                      transition: 'all 0.18s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                    }}>
                      <Typography sx={{
                        fontSize: '0.67rem', fontWeight: 700,
                        color: partNameSearch !== '' ? 'primary.main' : 'text.disabled',
                        textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1, lineHeight: 1
                      }}>
                        Part Name
                      </Typography>
                      <BOSTextField
                        fullWidth
                        placeholder="Enter part name..."
                        value={partNameSearch}
                        onChange={(e) => setPartNameSearch(e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', fontWeight: 600 } }}
                      />
                    </Box>
                  )}

                  {/* OEM Part No Field */}
                  {activeFilters.includes('OEM PART NO') && (
                    <Box sx={{
                      flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                      minWidth: { xs: '100%', sm: 'calc(50% - 6px)' },
                      p: '10px 14px 12px', borderRadius: '12px',
                      border: '1px solid', borderColor: oemSearch !== '' ? 'primary.main' : 'divider',
                      bgcolor: oemSearch !== '' ? (theme) => theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)' : 'background.paper',
                      transition: 'all 0.18s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                    }}>
                      <Typography sx={{
                        fontSize: '0.67rem', fontWeight: 700,
                        color: oemSearch !== '' ? 'primary.main' : 'text.disabled',
                        textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1, lineHeight: 1
                      }}>
                        OEM Part No
                      </Typography>
                      <BOSTextField
                        fullWidth
                        placeholder="Enter OEM part no..."
                        value={oemSearch}
                        onChange={(e) => setOemSearch(e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', fontWeight: 600 } }}
                      />
                    </Box>
                  )}

                  {/* Customer Part No Field */}
                  {activeFilters.includes('CUSTOMER PART NO') && (
                    <Box sx={{
                      flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                      minWidth: { xs: '100%', sm: 'calc(50% - 6px)' },
                      p: '10px 14px 12px', borderRadius: '12px',
                      border: '1px solid', borderColor: custSearch !== '' ? 'primary.main' : 'divider',
                      bgcolor: custSearch !== '' ? (theme) => theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)' : 'background.paper',
                      transition: 'all 0.18s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                    }}>
                      <Typography sx={{
                        fontSize: '0.67rem', fontWeight: 700,
                        color: custSearch !== '' ? 'primary.main' : 'text.disabled',
                        textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1, lineHeight: 1
                      }}>
                        Customer Part No
                      </Typography>
                      <BOSTextField
                        fullWidth
                        placeholder="Enter Cust part no..."
                        value={custSearch}
                        onChange={(e) => setCustSearch(e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', fontWeight: 600 } }}
                      />
                    </Box>
                  )}

                  {/* Category Field */}
                  {activeFilters.includes('CATEGORY') && (
                    <Box sx={{
                      flex: { xs: '1 1 100%', sm: '0 0 calc(50% - 6px)' },
                      minWidth: { xs: '100%', sm: 'calc(50% - 6px)' },
                      p: '10px 14px 12px', borderRadius: '12px',
                      border: '1px solid', borderColor: catSearch !== '' ? 'primary.main' : 'divider',
                      bgcolor: catSearch !== '' ? (theme) => theme.palette.mode === 'dark' ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.07)' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.03)' : 'background.paper',
                      transition: 'all 0.18s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' }
                    }}>
                      <Typography sx={{
                        fontSize: '0.67rem', fontWeight: 700,
                        color: catSearch !== '' ? 'primary.main' : 'text.disabled',
                        textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1, lineHeight: 1
                      }}>
                        Category
                      </Typography>
                      <BOSTextField
                        fullWidth
                        placeholder="Enter category..."
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
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
                                          if (filterName === 'PART NAME') setPartNameSearch('');
                                          if (filterName === 'OEM PART NO') setOemSearch('');
                                          if (filterName === 'CUSTOMER PART NO') setCustSearch('');
                                          if (filterName === 'CATEGORY') setCatSearch('');
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
                            setPartNameSearch('');
                            setOemSearch('');
                            setCustSearch('');
                            setCatSearch('');
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
                    onClick={() => { setProdTypeFilter('All'); setPartNoSearch(''); setPartNameSearch(''); setOemSearch(''); setCustSearch(''); setCatSearch(''); }}
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

        {/* Table Container */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '6px', flex: 1, minHeight: 480, overflowX: 'auto', overflowY: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#2196F3' }}>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', width: 40 }}>#</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>PART NO</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>PART NAME</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>OEM PART NO</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>CUST PART NO</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>PROD TYPE</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>CATEGORY</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>STOCK</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>UOM</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>PRICE</TableCell>
                <TableCell sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>HSN CODE</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>CGST %</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>SGST %</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>IGST %</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#2196F3 !important', color: '#FFFFFF !important', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>LST. QUOTE PR</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={15} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((p, idx) => (
                  <TableRow
                    key={p.id || idx}
                    hover
                    onClick={() => handleRowDoubleClick(p)}
                    onDoubleClick={() => handleRowDoubleClick(p)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#E3F2FD' }
                    }}
                  >
                    <TableCell sx={{ fontSize: '0.8rem' }}>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.8rem' }}>{p.itemNo}</TableCell>
                    <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{p.itemName}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{p.oemPartNo || p.oemNo || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{p.custPartNo || p.customerPartNo || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{p.itemType || p.prodType || p.itemCategory || 'FINISHED GOOD'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{p.itemCategory || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{p.stockQty != null ? p.stockQty : (p.stock != null ? p.stock : 0)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{p.uom || 'NOS'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {p.sellingRate != null ? p.sellingRate.toFixed(2) : (p.basePrice != null ? p.basePrice.toFixed(2) : '0.00')}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{p.hsnCode || p.hsnSac || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{p.cgstRate != null ? p.cgstRate : 0}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{p.sgstRate != null ? p.sgstRate : 0}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{p.igstRate != null ? p.igstRate : 0}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem' }}>
                      {p.lastQuotePrice != null ? p.lastQuotePrice.toFixed(2) : '0.00'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredProducts.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
          sx={{ borderTop: 'none', mt: 1 }}
        />
      </DialogContent>
    </BOSMovableDialog>
  );
}

ProductLookupDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};
