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
  MenuItem,
  CircularProgress,
  TablePagination
} from '@mui/material';
import { IconSearch, IconCheck } from '@tabler/icons-react';
import { BOSTextField, BOSFormDialog } from 'ui-component/bos';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';

export default function PartNumberSelectDialog({ open, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [oemMappings, setOemMappings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (open) {
      const fetchAllData = async () => {
        setLoading(true);
        try {
          const [productsRes, oemRes] = await Promise.all([
            axios.get(API_PATHS.NPD.PRODUCT_MASTER),
            axios.get(API_PATHS.NPD.ITEM_OEM_MAPPING).catch(() => ({ data: [] }))
          ]);

          // Filter active products and map itemNo/itemName to partNo/partName for backward compatibility
          const activeProducts = (productsRes.data || [])
            .filter((p) => (p.status === 'ACTIVE' || p.status === 'Active') && p.isActive !== false)
            .map(p => ({ ...p, partNo: p.itemNo, partName: p.itemName }));
          setProducts(activeProducts);

          // Filter active OEM mappings
          const activeOems = (oemRes.data || []).filter((m) => m.status === 'ACTIVE' || m.status === 'Active');
          setOemMappings(activeOems);
        } catch (error) {
          console.error('Failed to fetch data for Part Number Selection:', error);
          setProducts([]);
          setOemMappings([]);
        } finally {
          setLoading(false);
        }
      };

      fetchAllData();
      // Reset search and pagination on open
      setSearch('');
      setPage(0);
      setRowsPerPage(10);
    }
  }, [open]);

  // Combine products with their mapped OEM part numbers
  const combinedData = useMemo(() => {
    const oemMap = {};
    oemMappings.forEach((oem) => {
      if (oem.partNo) {
        if (!oemMap[oem.partNo]) oemMap[oem.partNo] = [];
        // Prevent duplicate OEM numbers in list
        if (!oemMap[oem.partNo].includes(oem.oemPartNo)) {
          oemMap[oem.partNo].push(oem.oemPartNo);
        }
      }
    });

    return products
      .filter((prod) => prod.partNo && prod.partName)
      .map((prod) => {
        const oems = oemMap[prod.partNo] || [];
        return {
          ...prod,
          oemPartNo: oems.join(', ')
        };
      });
  }, [products, oemMappings]);

  // Search filter logic
  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return combinedData;

    return combinedData.filter((item) => {
      const partNoVal = item.partNo || '';
      const partNameVal = item.partName || '';
      const oemPartNoVal = item.oemPartNo || '';
      return (
        partNoVal.toLowerCase().includes(query) ||
        partNameVal.toLowerCase().includes(query) ||
        oemPartNoVal.toLowerCase().includes(query)
      );
    });
  }, [combinedData, search]);

  // Paginated records
  const paginatedData = useMemo(() => {
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      title="Select Part Number"
      maxWidth="md"
      sx={{ zIndex: 1600 }}
    >
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
          <BOSTextField
            fullWidth
            placeholder="Search Here..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
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

        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, borderRadius: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#547787', color: 'white', fontWeight: 900, width: 60, py: 1.5, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Sl No</TableCell>
                  <TableCell sx={{ bgcolor: '#547787', color: 'white', fontWeight: 900, width: 180, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Part No</TableCell>
                  <TableCell sx={{ bgcolor: '#547787', color: 'white', fontWeight: 900, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>Part Name</TableCell>
                  <TableCell sx={{ bgcolor: '#547787', color: 'white', fontWeight: 900, width: 220, borderRight: '1px solid rgba(224, 224, 224, 0.2)' }}>OEM Part No</TableCell>
                  <TableCell sx={{ bgcolor: '#547787', color: 'white', fontWeight: 900, width: 80, textAlign: 'center' }}>Select</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No results found for "{search}"
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      hover
                      onDoubleClick={() => onSelect(item)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'primary.lighter !important' },
                        '& td': { borderRight: '1px solid rgba(224, 224, 224, 0.5)' },
                        '& td:last-child': { borderRight: 'none' }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 900, color: 'primary.main' }}>{item.partNo}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{item.partName}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{item.oemPartNo || '-'}</TableCell>
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
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {!loading && filteredData.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Box>
    </BOSFormDialog>
  );
}

PartNumberSelectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};
