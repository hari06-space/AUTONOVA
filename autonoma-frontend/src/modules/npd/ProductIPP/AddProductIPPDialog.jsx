import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  MenuItem,
  Box,
  FormControl,
  FormLabel,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
  Stack,
  useTheme,
  Tooltip
} from '@mui/material';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSStatusChip , errorStyle, BOSStatusField } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';
import PartNumberSelectDialog from './PartNumberSelectDialog';
import { format } from 'date-fns';
import { IconSearch } from '@tabler/icons-react';

// ==============================|| PRODUCT IPP MASTER - ADD/EDIT DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'customerId', label: 'Customer', required: true },
  { field: 'partNo', label: 'Part Number', required: true, maxLength: 100 },
  { field: 'custPartNo', label: 'Customer Part Number', required: true, maxLength: 100 }
];

const INITIAL_STATE = {
  customerId: '',
  customerName: '',
  customerGroup: '',
  partNo: '',
  oemPartNo: '',
  custPartNo: '',
  status: 'ACTIVE'
};

const headerCellStyle = {
  backgroundColor: '#547787',
  color: '#ffffff',
  fontWeight: 'bold',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '10px 14px',
  borderBottom: 'none',
  whiteSpace: 'nowrap',
  zIndex: 10,
  textAlign: 'center'
};

const tableContainerSx = {
  maxHeight: '350px',
  overflowY: 'auto',
  overflowX: 'auto',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '8px',
  '&::-webkit-scrollbar': { width: 6, height: 6 },
  '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.300', borderRadius: 10, '&:hover': { backgroundColor: 'grey.400' } }
};

const AddProductIPPDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [oemMappings, setOemMappings] = useState([]);

  const [selectDialogOpen, setSelectDialogOpen] = useState(false);

  // New Grid Section States & Logic
  const theme = useTheme();
  const [gridRows, setGridRows] = useState([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridSearch, setGridSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchGridRows = useCallback(async () => {
    setGridLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.PRODUCT_IPP);
      const mapped = (response.data || []).map(r => ({
        ...r,
        status: r.isActive ? 'ACTIVE' : 'INACTIVE'
      }));
      setGridRows(mapped);
    } catch (error) {
      console.error('Failed to fetch grid rows:', error);
      setGridRows([]);
    } finally {
      setGridLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchGridRows();
    }
  }, [open, fetchGridRows]);

  // Auto-refresh when customer group changes
  useEffect(() => {
    if (open && formData.customerGroup) {
      fetchGridRows();
    }
  }, [formData.customerGroup, open, fetchGridRows]);

  const isRecordUpdated = (row) => {
    const created = row.createdAt || row.createdDate;
    const updated = row.updatedAt || row.updatedDate;
    if (!updated) return false;
    if (!created) return true;
    const msDiff = Math.abs(new Date(updated) - new Date(created));
    return msDiff > 1000;
  };

  const handleRequestSort = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const groupFilteredRows = useMemo(() => {
    if (!formData.customerGroup) return [];
    return gridRows.filter(
      (row) => (row.customerGroup || '').toLowerCase() === formData.customerGroup.toLowerCase()
    );
  }, [gridRows, formData.customerGroup]);

  const searchedRows = useMemo(() => {
    if (!gridSearch) return groupFilteredRows;
    const query = gridSearch.toLowerCase();
    return groupFilteredRows.filter((row) => {
      return (
        (row.customerName || '').toLowerCase().includes(query) ||
        (row.custPartNo || '').toLowerCase().includes(query) ||
        (row.partNo || '').toLowerCase().includes(query) ||
        (row.customerGroup || '').toLowerCase().includes(query) ||
        (row.status || '').toLowerCase().includes(query) ||
        (row.createdBy || '').toLowerCase().includes(query) ||
        (row.updatedBy || '').toLowerCase().includes(query)
      );
    });
  }, [groupFilteredRows, gridSearch]);

  const sortedRows = useMemo(() => {
    const comparator = (a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valB < valA) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      if (valB > valA) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      return 0;
    };
    return [...searchedRows].sort(comparator);
  }, [searchedRows, sortBy, sortOrder]);

  // Reset page when search or customer group changes
  useEffect(() => {
    setPage(0);
  }, [gridSearch, formData.customerGroup]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRows = useMemo(() => {
    return sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  const handleRowClick = (row) => {
    setFormData({
      id: row.id,
      customerId: row.customerId || row.customer?.id || '',
      customerName: row.customerName || '',
      customerGroup: row.customerGroup || '',
      partNo: row.partNo || '',
      oemPartNo: row.oemPartNo || '',
      custPartNo: row.custPartNo || '',
      status: row.status || 'ACTIVE',
      createdBy: row.createdBy,
      createdAt: row.createdAt
    });
    if (!readOnly) {
      setIsEditing(true);
    }
  };

  // Fetch all necessary data when dialog opens
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [customersRes, oemRes] = await Promise.all([
          axios.get(API_PATHS.SM.CUSTOMERS),
          axios.get(API_PATHS.NPD.ITEM_OEM_MAPPING).catch(() => ({ data: [] }))
        ]);

        // 1. Process active customers
        const activeCustomers = (customersRes.data || []).filter(
          (c) => c.isActive === true || c.isActive === 1 || String(c.isActive).toLowerCase() === 'true' || c.status === 'Active' || c.status === 'ACTIVE' || c.status === undefined
        );
        setCustomers(activeCustomers);

        // 2. Process active OEM mappings
        const activeOems = (oemRes.data || []).filter((m) => m.status === 'ACTIVE' || m.status === 'Active');
        setOemMappings(activeOems);
      } catch (err) {
        console.error('Failed to fetch data for dialog:', err);
      }
    };

    if (open) {
      fetchAllData();
    }
  }, [open]);

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        id: initialData.id,
        customerId: initialData.customerId || initialData.customer?.id || '',
        customerName: initialData.customerName || '',
        customerGroup: initialData.customerGroup || '',
        partNo: initialData.partNo || '',
        oemPartNo: initialData.oemPartNo || '',
        custPartNo: initialData.custPartNo || '',
        status: initialData.status || 'ACTIVE',
        createdBy: initialData.createdBy,
        createdAt: initialData.createdAt
      });
      setIsEditing(false);
    } else {
      setFormData(INITIAL_STATE);
      setIsEditing(!readOnly);
    }
  }, [initialData, open, readOnly, clearErrors]);

  // Synchronize customer group when customer master data is fetched or updated
  useEffect(() => {
    if (formData.customerId && !formData.customerGroup && customers.length > 0) {
      const selectedCust = customers.find((c) => String(c.id) === String(formData.customerId));
      if (selectedCust) {
        setFormData((prev) => ({
          ...prev,
          customerGroup: selectedCust.groupName || selectedCust.customerGroup || selectedCust.segment || ''
        }));
      }
    }
  }, [customers, formData.customerId, formData.customerGroup]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'customerId') {
      const selectedCust = customers.find((c) => String(c.id) === String(value));
      setFormData((prev) => ({
        ...prev,
        customerId: value,
        customerName: selectedCust ? selectedCust.customerName : '',
        // Auto-fill Customer Group from customer's groupName, customerGroup, or segment
        customerGroup: selectedCust ? (selectedCust.groupName || selectedCust.customerGroup || selectedCust.segment || '') : ''
      }));
      if (errors.customerId) clearErrors('customerId');
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) clearErrors(name);
    }
  };

  const handleSelectProduct = (product) => {
    const selectedPartNo = product.partNo || '';
    const matchingOems = oemMappings.filter((oem) => oem.partNo === selectedPartNo);
    const uniqueOem = matchingOems.length === 1 ? matchingOems[0].oemPartNo : '';

    setFormData((prev) => ({
      ...prev,
      partNo: selectedPartNo,
      oemPartNo: uniqueOem
    }));
    if (errors.partNo) clearErrors('partNo');
    setSelectDialogOpen(false);
  };

  const filteredOemMappings = useMemo(() => {
    if (!formData.partNo) return [];
    return oemMappings.filter((oem) => oem.partNo === formData.partNo);
  }, [oemMappings, formData.partNo]);

  const handleClear = () => { setFormData(INITIAL_STATE); clearErrors(); };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      const payload = {
        id: formData.id,
        customerId: formData.customerId,
        customerName: formData.customerName,
        customerGroup: formData.customerGroup,
        partNo: formData.partNo,
        oemPartNo: formData.oemPartNo,
        custPartNo: formData.custPartNo,
        isActive: formData.status === 'ACTIVE',
        createdBy: formData.id ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: user?.id || 'Admin',
        createdAt: formData.createdAt
      };

      let savedRecords;
      if (formData.id) {
        const response = await axios.put(`${API_PATHS.NPD.PRODUCT_IPP}/${formData.id}`, payload);
        savedRecords = {
          ...response.data,
          status: response.data.isActive ? 'ACTIVE' : 'INACTIVE'
        };
        setGridRows((prev) => prev.map((r) => r.id === savedRecords.id ? savedRecords : r));
        dispatch(openSnackbar({ open: true, message: 'Product IPP updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        const response = await axios.post(API_PATHS.NPD.PRODUCT_IPP, payload);
        savedRecords = {
          ...response.data,
          status: response.data.isActive ? 'ACTIVE' : 'INACTIVE'
        };
        setGridRows((prev) => [...prev, savedRecords]);
        dispatch(openSnackbar({ open: true, message: 'Product IPP created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true, savedRecords);
    } catch (error) {
      console.error('Failed to save Product IPP:', error);
      const errorMsg = error.message || 'Failed to save Product IPP.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.PRODUCT_IPP}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Product IPP deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete Product IPP:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete record.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const isViewOnly = readOnly && !isEditing;

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={() => handleClose()}
        onSave={handleSave}
        onDelete={() => setDeleteOpen(true)}
        onClear={handleClear}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? (readOnly ? 'Cust Part No Master Details' : 'Cust Part No Master Edit') : 'Cust Part No Master Creation'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="lg"
        hideCollapse
      >
        <BOSFormSection title="Product IPP Details">
          {/* 1. Customer — Dropdown fetching all active customers */}
          <BOSTextField
            select
            name="customerId"
            label="Customer *"
            value={formData.customerId || ''}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            error={!!errors.customerId}
            helperText={errors.customerId}
           sx={errorStyle(!!errors.customerId)} >
            <MenuItem value="">
              <em>-Select-</em>
            </MenuItem>
            {customers.map((cust) => (
              <MenuItem key={cust.id} value={cust.id}>
                {cust.customerName} {cust.customerCode ? ` - ${cust.customerCode}` : ''} {cust.customerGroup || cust.segment ? ` (${cust.customerGroup || cust.segment})` : ''}
              </MenuItem>
            ))}
          </BOSTextField>

          {/* 2. Customer Group — Auto-filled from the selected customer */}
          <BOSTextField
            name="customerGroup"
            label="Customer Group"
            value={formData.customerGroup}
            disabled
            placeholder="Auto-filled from customer"
          />

          {/* 3. Part No — Click to open part selection dialog */}
          <BOSTextField
            name="partNo"
            label="Part No *"
            value={formData.partNo}
            placeholder={isViewOnly ? '' : 'Click to select part number...'}
            onClick={() => !isViewOnly && setSelectDialogOpen(true)}
            disabled={isViewOnly}
            required
            maxLength={100}
            error={!!errors.partNo}
            helperText={errors.partNo}
            InputProps={{
              readOnly: true,
              sx: { cursor: !isViewOnly ? 'pointer' : 'default' }
            }}
           sx={errorStyle(!!errors.partNo)} />

          {/* 5. OEM Part No — Dropdown from OEM Mapping data */}
          <BOSTextField
            select
            name="oemPartNo"
            label="OEM Part No"
            value={formData.oemPartNo || ''}
            onChange={handleChange}
            disabled={isViewOnly}
          >
            <MenuItem value="">
              <em>-Select-</em>
            </MenuItem>
            {filteredOemMappings.map((oem) => (
              <MenuItem key={oem.id} value={oem.oemPartNo}>
                {oem.oemPartNo}
              </MenuItem>
            ))}
          </BOSTextField>

          {/* 5. Cust Part No — Manual input */}
          <BOSTextField
            name="custPartNo"
            label="Cust Part No *"
            value={formData.custPartNo}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={100}
            error={!!errors.custPartNo}
            helperText={errors.custPartNo}
            placeholder={isViewOnly ? '' : 'Enter customer part number...'}
           sx={errorStyle(!!errors.custPartNo)} />

          <BOSStatusField
            isCreate={!initialData}
            type="string-upper"
            name="status"
            label="Status"
            value={formData.status}
            onChange={handleChange}
            disabled={isViewOnly || !initialData}
          />
        </BOSFormSection>

        <BOSFormSection title={`Group Customer Part Numbers${formData.customerGroup ? ` - ${formData.customerGroup}` : ''}`}>
          {!formData.customerGroup ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              Select a customer to load customer group listing.
            </Typography>
          ) : (
            <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  p: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1c2128' : 'grey.50'
                }}
              >
                <TextField
                  size="small"
                  placeholder="Search group records..."
                  value={gridSearch}
                  onChange={(e) => setGridSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size={18} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ width: { xs: '100%', sm: 250 } }}
                />
              </Box>

              <TableContainer sx={{ maxHeight: '350px', overflowY: 'auto', overflowX: 'auto', '&::-webkit-scrollbar': { width: 6, height: 6 }, '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.300', borderRadius: 10, '&:hover': { backgroundColor: 'grey.400' } } }}>
                {gridLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : (
                  <Table stickyHeader aria-label="customer group part numbers">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={headerCellStyle}>S.No</TableCell>
                        <TableCell sx={headerCellStyle}>
                          <TableSortLabel
                            active={sortBy === 'customerName'}
                            direction={sortBy === 'customerName' ? sortOrder : 'asc'}
                            onClick={() => handleRequestSort('customerName')}
                            sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                          >
                            Customer
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={headerCellStyle}>
                          <TableSortLabel
                            active={sortBy === 'custPartNo'}
                            direction={sortBy === 'custPartNo' ? sortOrder : 'asc'}
                            onClick={() => handleRequestSort('custPartNo')}
                            sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                          >
                            Cust Part No
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={headerCellStyle}>
                          <TableSortLabel
                            active={sortBy === 'partNo'}
                            direction={sortBy === 'partNo' ? sortOrder : 'asc'}
                            onClick={() => handleRequestSort('partNo')}
                            sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                          >
                            Part No
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={headerCellStyle}>
                          <TableSortLabel
                            active={sortBy === 'customerGroup'}
                            direction={sortBy === 'customerGroup' ? sortOrder : 'asc'}
                            onClick={() => handleRequestSort('customerGroup')}
                            sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                          >
                            Customer Group
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={headerCellStyle}>Status</TableCell>
                        <TableCell sx={headerCellStyle}>
                          <TableSortLabel
                            active={sortBy === 'createdBy'}
                            direction={sortBy === 'createdBy' ? sortOrder : 'asc'}
                            onClick={() => handleRequestSort('createdBy')}
                            sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                          >
                            Created By
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={headerCellStyle}>
                          <TableSortLabel
                            active={sortBy === 'createdAt'}
                            direction={sortBy === 'createdAt' ? sortOrder : 'asc'}
                            onClick={() => handleRequestSort('createdAt')}
                            sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                          >
                            Created Date
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={headerCellStyle}>
                          <TableSortLabel
                            active={sortBy === 'updatedBy'}
                            direction={sortBy === 'updatedBy' ? sortOrder : 'asc'}
                            onClick={() => handleRequestSort('updatedBy')}
                            sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                          >
                            Updated By
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={headerCellStyle}>
                          <TableSortLabel
                            active={sortBy === 'updatedAt'}
                            direction={sortBy === 'updatedAt' ? sortOrder : 'asc'}
                            onClick={() => handleRequestSort('updatedAt')}
                            sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                          >
                            Updated Date
                          </TableSortLabel>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                            No records found for group &ldquo;{formData.customerGroup}&rdquo;
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRows.map((row, index) => {
                          const isRowSelected = formData.id === row.id;
                          const updated = isRecordUpdated(row);
                          return (
                            <Tooltip key={row.id} title="Click to select and edit record" arrow placement="top">
                              <TableRow
                                hover
                                onClick={() => handleRowClick(row)}
                                sx={{
                                  cursor: 'pointer',
                                  bgcolor: isRowSelected
                                    ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : '#e3f2fd')
                                    : (index % 2 === 1 ? (theme.palette.mode === 'dark' ? '#1c2128' : '#fafafa') : 'inherit'),
                                  '&:hover': {
                                    bgcolor: isRowSelected
                                      ? (theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.25)' : '#d2e9fc') + ' !important'
                                      : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5') + ' !important'
                                  }
                                }}
                              >
                                <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>{row.customerName || '-'}</TableCell>
                                <TableCell align="center">{row.custPartNo || '-'}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>{row.partNo || '-'}</TableCell>
                                <TableCell align="center">{row.customerGroup || '-'}</TableCell>
                                <TableCell align="center">
                                  <BOSStatusChip
                                    status={row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                    showIcon={true}
                                    width={130}
                                  />
                                </TableCell>
                                <TableCell align="center">{row.createdBy || '-'}</TableCell>
                                <TableCell align="center">
                                  {row.createdAt ? format(new Date(row.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                                </TableCell>
                                <TableCell align="center">
                                  {updated ? (row.updatedBy || '-') : '-'}
                                </TableCell>
                                <TableCell align="center">
                                  {updated && row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yyyy HH:mm') : '-'}
                                </TableCell>
                              </TableRow>
                            </Tooltip>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={sortedRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ borderTop: '1px solid', borderColor: 'divider' }}
              />
            </Paper>
          )}
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product IPP"
        message="Are you sure you want to delete this record? This action cannot be undone."
        itemName={formData.partNo || formData.customerName}
      />

      <PartNumberSelectDialog
        open={selectDialogOpen}
        onClose={() => setSelectDialogOpen(false)}
        onSelect={handleSelectProduct}
      />
    </>
  );
};

AddProductIPPDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddProductIPPDialog;
