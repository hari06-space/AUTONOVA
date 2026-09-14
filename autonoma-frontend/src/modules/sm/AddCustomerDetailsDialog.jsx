import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Grid,
  useTheme,
  MenuItem,
  Button,
  Box,
  Stack,
  Typography,
  Autocomplete,
  TextField as MuiTextField
} from '@mui/material';
import {
  IconClearAll,
  IconPlus
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import useBOSValidation from 'hooks/useBOSValidation';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSAutocomplete, BOSDataTable, errorStyle } from 'ui-component/bos';
import { btnSave, btnClear } from 'ui-component/bos/BOSStyles';

// ==============================|| SM - CUSTOMER DETAILS DIALOG ||============================== //

const fieldConfigs = [
  { field: 'customerName', label: 'Cust Name', required: true },
  { field: 'invoiceName', label: 'Cust.Name (Invoice)', required: true },
  { field: 'address', label: 'Address', required: true },
  { field: 'pincode', label: 'Pin Code', required: true },
  { field: 'city', label: 'City', required: true },
  { field: 'state', label: 'State', required: true },
  { field: 'country', label: 'Country', required: true },
  { field: 'distance', label: 'Distance (Km)', required: true }
];

export default function AddCustomerDetailsDialog({ open, handleClose, initialData, onSuccess }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState({
    customerName: '',
    invoiceName: '',
    address: '',
    pincode: '',
    city: '',
    district: '',
    state: '',
    stateCode: '',
    country: '',
    distance: 0,
    contactName: '',
    contactNo: '',
    status: 'Active'
  });

  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Master data states ────────────────────────────────────────────────────
  const [countries, setCountries] = useState([]);
  const [allStates, setAllStates] = useState([]);

  // ── Fetch master data ─────────────────────────────────────────────────────
  const fetchMasterData = useCallback(async () => {
    try {
      const [countriesRes, statesRes] = await Promise.allSettled([
        axios.get('/api/admin/countries'),
        axios.get('/api/admin/states')
      ]);
      if (countriesRes.status === 'fulfilled') setCountries(countriesRes.value.data.filter(c => c.status === 'Active'));
      if (statesRes.status === 'fulfilled') setAllStates(statesRes.value.data.filter(s => s.status === 'Active'));
    } catch (e) {
      console.error('Failed to fetch master data:', e);
    }
  }, []);

  useEffect(() => { fetchMasterData(); }, [fetchMasterData]);

  // ── Filtered states based on selected country ─────────────────────────────
  const filteredStates = formData.country
    ? allStates.filter(s => s.countryName === formData.country)
    : allStates;

  useEffect(() => {
    if (open && initialData) {
      clearErrors();
      setFormData({
        customerName: initialData.customerName || '',
        invoiceName: initialData.invoiceName || '',
        address: '',
        pincode: '',
        city: '',
        district: '',
        state: '',
        stateCode: '',
        country: '',
        distance: 0,
        contactName: '',
        contactNo: '',
        status: 'Active'
      });
      fetchDetails(initialData.id);
    }
  }, [open, initialData, clearErrors]);

  const fetchDetails = async (cid) => {
    if (!cid) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/sm/customer-details?customerId=${cid}`);
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch customer address details:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to fetch address details.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    clearErrors();
    setEditingId(null);
    setFormData({
      customerName: initialData?.customerName || '',
      invoiceName: initialData?.invoiceName || '',
      address: '',
      pincode: '',
      city: '',
      district: '',
      state: '',
      stateCode: '',
      country: '',
      distance: 0,
      contactName: '',
      contactNo: '',
      status: 'Active'
    });
  };

  const handleSaveDetail = async () => {
    if (!validate(formData, fieldConfigs)) return;
    if (!initialData?.id) {
      dispatch(openSnackbar({ open: true, message: 'Customer ID missing.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        customerId: initialData.id,
        id: editingId
      };
      await axios.post('/api/sm/customer-details', payload);
      dispatch(openSnackbar({
        open: true,
        message: editingId ? 'Address updated successfully!' : 'Address added successfully!',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success',
        close: false
      }));
      handleClear();
      fetchDetails(initialData.id);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to save address:', error);
      dispatch(openSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save address details.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setFormData({ ...row });
  };

  const handleDelete = async (row) => {
    try {
      await axios.delete(`/api/sm/customer-details/${row.id}`);
      dispatch(openSnackbar({
        open: true,
        message: 'Detail deleted successfully!',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success',
        close: false
      }));
      fetchDetails(initialData.id);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to delete detail:', error);
    }
  };

  const columns = [
    { id: 'customerName', label: 'CUSTOMER NAME (I)', minWidth: 160 },
    { id: 'address', label: 'ADDRESS', minWidth: 200 },
    { id: 'city', label: 'CITY', minWidth: 100 },
    { id: 'district', label: 'DISTRICT', minWidth: 100 },
    { id: 'state', label: 'STATE', minWidth: 100 },
    { id: 'country', label: 'COUNTRY', minWidth: 100 },
    { id: 'pincode', label: 'PINCODE', minWidth: 100 },
    { id: 'distance', label: 'DISTANCE (KM)', minWidth: 110 }
  ];

  const displayRecords = useMemo(() => {
    return records;
  }, [records]);

  return (
    <BOSFormDialog
      open={open}
      onClose={() => handleClose(false)}
      title="Customer Details"
      maxWidth="lg"
      hideFooter={true} // Hide default footer to match reference design
    >
      <Box sx={{ p: 2.5, pt: 1.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, width: '100%' }}>
          {/* Row 1: Customer Name & Invoice Name (50% each) */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <BOSTextField
              name="customerName"
              label="Cust Name"
              value={formData.customerName}
              onChange={handleChange}
              required
              error={!!errors.customerName}
              helperText={errors.customerName}
              sx={errorStyle(!!errors.customerName)}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
            <BOSTextField
              name="invoiceName"
              label="Cust.Name (Invoice)"
              value={formData.invoiceName}
              onChange={handleChange}
              required
              error={!!errors.invoiceName}
              helperText={errors.invoiceName}
              sx={errorStyle(!!errors.invoiceName)}
            />
          </Box>

          {/* Row 2: Pin Code, City, District (33.3% each) */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
            <BOSTextField
              name="pincode"
              label="Pin Code"
              value={formData.pincode}
              onChange={handleChange}
              required
              error={!!errors.pincode}
              helperText={errors.pincode}
              placeholder="Please enter Customer Pin/Zip Code..."
              sx={errorStyle(!!errors.pincode)}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
            <BOSTextField
              name="city"
              label="City"
              value={formData.city}
              onChange={handleChange}
              required
              error={!!errors.city}
              helperText={errors.city}
              placeholder="Please enter Customer City..."
              sx={errorStyle(!!errors.city)}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
            <BOSTextField
              name="district"
              label="District"
              value={formData.district}
              onChange={handleChange}
              placeholder="Please enter Customer District..."
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
            <BOSTextField
              name="distance"
              label="Distance (Km)"
              type="number"
              value={formData.distance}
              onChange={handleChange}
              required
              error={!!errors.distance}
              helperText={errors.distance}
              sx={errorStyle(!!errors.distance)}
            />
          </Box>

          {/* Row 3: Country, State Name, Distance (33.3% each) */}
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
            <BOSAutocomplete
              label="Country"
              options={countries.map(c => c.country)}
              value={formData.country || ''}
              onChange={(val) => {
                const selectedCountry = typeof val === 'string' ? val : (val?.country || val?.label || '');
                setFormData((prev) => ({
                  ...prev,
                  country: selectedCountry,
                  state: '',
                  stateCode: ''
                }));
              }}
              required
              error={!!errors.country}
              helperText={errors.country}
              noOptionsText="No countries found"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
            <BOSAutocomplete
              label="State Name"
              options={filteredStates.map(s => s.stateName)}
              value={formData.state || ''}
              onChange={(val) => {
                const selectedState = typeof val === 'string' ? val : (val?.stateName || val?.label || '');
                if (selectedState) {
                  const stateRecord = allStates.find(s => s.stateName === selectedState);
                  setFormData((prev) => ({
                    ...prev,
                    state: selectedState,
                    stateCode: stateRecord?.stateCode || '',
                    country: stateRecord?.countryName || prev.country
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    state: '',
                    stateCode: ''
                  }));
                }
              }}
              required
              error={!!errors.state}
              helperText={errors.state}
              noOptionsText={formData.country ? 'No states for this country' : 'Select a country first'}
            />
          </Box>

          {/* Row 4: Address (Full 100% Width Row) */}
          <Box sx={{ gridColumn: 'span 12' }}>
            <BOSTextField
              name="address"
              label="Address"
              multiline
              rows={3}
              disableRichText={true}
              value={formData.address}
              onChange={handleChange}
              required
              error={!!errors.address}
              helperText={errors.address}
              placeholder="Please enter Customer Address..."
              sx={errorStyle(!!errors.address)}
            />
          </Box>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ my: 3 }}>
          <Button
            variant="contained"
            sx={{ ...btnClear, borderRadius: '4px', px: 3 }}
            startIcon={<IconClearAll size={18} />}
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ ...btnSave, borderRadius: '4px', px: 3, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            startIcon={<IconPlus size={18} />}
            onClick={handleSaveDetail}
          >
            New
          </Button>
        </Stack>

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden' }}>
          <BOSDataTable
            columns={columns}
            rows={displayRecords}
            page={0}
            size={10}
            onPageChange={() => { }}
            onSizeChange={() => { }}
            onEditRow={handleEdit}
            onDeleteRow={handleDelete}
            showActions={true}
            sx={{ height: '300px' }}
          />
        </Box>
      </Box>
    </BOSFormDialog>
  );
}
