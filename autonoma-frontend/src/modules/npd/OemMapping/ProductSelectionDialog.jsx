import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Stack,
  IconButton,
  CircularProgress,
  TextField
} from '@mui/material';
import { IconSearch, IconCheck } from '@tabler/icons-react';
import { BOSFormDialog } from 'ui-component/bos';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';

export default function ProductSelectionDialog({ open, onClose, onSelect, itemGroup }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset when open changes
  useEffect(() => {
    if (open) {
      setSearch('');
      setDebouncedSearch('');
      setPage(0);
      setProducts([]);
    }
  }, [open]);

  // Handle resetting page when search or itemGroup changes
  useEffect(() => {
    if (open) {
      setPage(0);
    }
  }, [debouncedSearch, itemGroup, open]);

  // Fetch paginated products
  useEffect(() => {
    if (open) {
      const fetchProducts = async () => {
        if (page === 0) setLoading(true);
        try {
          const response = await axios.get(`${API_PATHS.NPD.PRODUCT_MASTER}/paginated`, {
            params: {
              page: page,
              size: 50,
              search: debouncedSearch,
              itemGroup: itemGroup || ''
            }
          });

          const newProducts = (response.data?.content || [])
            .map(p => ({ ...p, partNo: p.itemNo, partName: p.itemName }));

          if (page === 0) {
            setProducts(newProducts);
          } else {
            setProducts(prev => {
              // Avoid duplicates if same page fetches twice
              const existingIds = new Set(prev.map(p => p.id));
              const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));
              return [...prev, ...uniqueNew];
            });
          }
          setTotalPages(response.data?.totalPages || 1);
          setTotalElements(response.data?.totalElements || 0);
        } catch (error) {
          console.error('Failed to fetch paginated products:', error);
          if (page === 0) setProducts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [open, page, debouncedSearch, itemGroup]);

  const data = useMemo(() => {
    const nilItem = { id: 'NIL', partNo: 'NIL', partName: 'NO PRODUCT / UNSELECT' };
    return [nilItem, ...products];
  }, [products]);

  const handleClear = () => {
    onSelect({ partNo: '', partName: '' });
  };

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 100;
    if (bottom && !loading && page < totalPages - 1) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onClear={handleClear}
      title="Select Product"
      maxWidth="md"
      sx={{ zIndex: 1600 }}
    >
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search Part No or Part Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={18} />
                </InputAdornment>
              )
            }}
          />
        </Stack>

        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 450, borderRadius: 2 }} onScroll={handleScroll}>
          {loading && page === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 900, width: 60, py: 1.5 }}>Sl No</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 900, width: 180 }}>Part No</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 900 }}>Part Name</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 900, width: 80, textAlign: 'center' }}>Select</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 1 && data[0].id === 'NIL' && debouncedSearch ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No results found for "{debouncedSearch}"
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      hover
                      onDoubleClick={() => onSelect(item)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'primary.lighter !important' }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{idx === 0 ? '-' : idx}</TableCell>
                      <TableCell sx={{ fontWeight: 900, color: 'primary.main' }}>{item.partNo}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{item.partName}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onSelect(item)}
                          sx={{ bgcolor: 'primary.lighter', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                        >
                          <IconCheck size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {loading && page > 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {!loading && (
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              Showing {data.length - 1} of {totalElements} records • Double-click row to select
            </Typography>
          </Box>
        )}
      </Box>
    </BOSFormDialog>
  );
}

ProductSelectionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  itemGroup: PropTypes.string
};
