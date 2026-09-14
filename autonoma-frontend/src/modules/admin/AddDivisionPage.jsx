import TextField from 'ui-component/CustomTextField';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, Autocomplete, Box, Typography, Grid, InputAdornment, IconButton, Button, Stack, CircularProgress, Dialog } from '@mui/material';
import { IconLayoutColumns, IconBuilding, IconMapPin, IconMicrophone, IconMicrophoneOff, IconAlertCircle, IconInfoCircle, IconLock, IconCertificate, IconDeviceFloppy, IconX, IconCurrentLocation } from '@tabler/icons-react';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import { RMap, RMarker } from 'maplibre-react-components';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-react-components/style.css';
import osm_bright from './osm_bright.json';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSFormSection, BOSTextField, BOSStatusField, errorStyle } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';

// ==============================|| DIVISION - ADD/EDIT PAGE (BOS SOP COMPLIANT) ||============================== //

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE'];

const STATES_BY_COUNTRY = {
  India: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
  ]
};

const STATE_CODES = {
  'Andhra Pradesh': 37, 'Arunachal Pradesh': 12, 'Assam': 18, 'Bihar': 10,
  'Chhattisgarh': 22, 'Goa': 30, 'Gujarat': 24, 'Haryana': 6, 'Himachal Pradesh': 2,
  'Jharkhand': 20, 'Karnataka': 29, 'Kerala': 32, 'Madhya Pradesh': 23,
  'Maharashtra': 27, 'Manipur': 14, 'Meghalaya': 17, 'Mizoram': 15, 'Nagaland': 13,
  'Odisha': 21, 'Punjab': 3, 'Rajasthan': 8, 'Sikkim': 11, 'Tamil Nadu': 33,
  'Telangana': 36, 'Tripura': 16, 'Uttar Pradesh': 9, 'Uttarakhand': 5,
  'West Bengal': 19, 'Delhi': 7, 'Jammu & Kashmir': 1, 'Ladakh': 38,
};

const CITIES_BY_STATE = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Dharwad'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  'Punjab': ['Chandigarh', 'Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala'],
};

const DEFAULT_CITIES = ['City 1', 'City 2', 'City 3', 'City 4'];

const VALIDATION_RULES = [
  { field: 'companyId', label: 'Company', required: true },
  { field: 'divisionName', label: 'Division Name', required: true, maxLength: 100 },
  { field: 'address', label: 'Address Details', maxLength: 500 },
  { field: 'pincode', label: 'Postal / Zip Code', maxLength: 10 },
  { field: 'gstIn', label: 'GSTIN Registration No', maxLength: 15, pattern: /^[0-9A-Z]{15}$/, patternMessage: 'GSTIN must be exactly 15 uppercase alphanumeric characters' }
];

const INITIAL_STATE = {
  companyId: null,
  divisionName: '',
  description: '',
  address: '',
  city: '',
  state: '',
  stateCode: '',
  country: '',
  pincode: '',
  gstIn: '',
  sequenceNo: 0,
  status: true,
  mobileNo: '',
  panNo: '',
  pfNo: '',
  esiNo: '',
  ieCode: '',
  cinNo: '',
  emailId: '',
  website: '',
  ewaybillUserName: '',
  ewaybillPassword: '',
  gstUserName: '',
  einvoiceUserName: '',
  einvoicePassword: '',
  mapLink: '',
  latitude: '',
  longitude: ''
};

const AddDivisionPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { isListening, interimText, toggleListening } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setFormData(prev => ({
        ...prev,
        description: (prev.description ? prev.description + ' ' : '') + finalText
      }));
    }
  });
  const [companies, setCompanies] = useState([]);

  // Map Picker State
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [mapMarker, setMapMarker] = useState({ latitude: 13.0827, longitude: 80.2707 });
  const [mapLoading, setMapLoading] = useState(false);
  const mapRef = useRef(null);

  const citiesForState = CITIES_BY_STATE[formData.state] || DEFAULT_CITIES;
  const statesForCountry = STATES_BY_COUNTRY[formData.country] || [];

  const handleClose = () => navigate('/admin/division');

  useEffect(() => {
    axios.get('/api/company-profile/all')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setCompanies(list.map(c => ({ id: c.id, label: c.companyName })));
      })
      .catch(() => {
        dispatch(openSnackbar({
          open: true, message: 'Could not load company list.',
          variant: 'alert', alert: { variant: 'filled' }, severity: 'warning', close: false
        }));
      });
  }, [dispatch]);

  useEffect(() => {
    clearErrors();
    if (id) {
      setLoading(true);
      axios.get(`/api/admin/divisions/${id}`)
        .then(res => {
          const initialData = res.data;
          setFormData({
            id: initialData.id,
            companyId: initialData.companyId || null,
            divisionName: initialData.divisionName || '',
            description: initialData.description || '',
            address: initialData.address || '',
            city: initialData.city || '',
            state: initialData.state || '',
            stateCode: initialData.stateCode != null ? String(initialData.stateCode) : '',
            country: initialData.country || '',
            pincode: initialData.pincode || '',
            gstIn: initialData.gstIn || '',
            sequenceNo: initialData.sequenceNo || 0,
            status: initialData.status !== undefined ? initialData.status : true,
            mobileNo: initialData.mobileNo || '',
            panNo: initialData.panNo || '',
            pfNo: initialData.pfNo || '',
            esiNo: initialData.esiNo || '',
            ieCode: initialData.ieCode || '',
            cinNo: initialData.cinNo || '',
            emailId: initialData.emailId || '',
            website: initialData.website || '',
            ewaybillUserName: initialData.ewaybillUserName || '',
            ewaybillPassword: initialData.ewaybillPassword || '',
            gstUserName: initialData.gstUserName || '',
            einvoiceUserName: initialData.einvoiceUserName || '',
            einvoicePassword: initialData.einvoicePassword || '',
            mapLink: initialData.mapLink || '',
            latitude: initialData.latitude || '',
            longitude: initialData.longitude || ''
          });
        })
        .catch(() => {
          dispatch(openSnackbar({
            open: true, message: 'Failed to load division details',
            variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false
          }));
        })
        .finally(() => setLoading(false));
    } else {
      setFormData(INITIAL_STATE);
      fetchNextSeq();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchNextSeq = async () => {
    try {
      const seqRes = await axios.get('/api/admin/divisions/next-seq');
      setFormData(prev => ({ ...prev, sequenceNo: seqRes.data }));
    } catch (e) {
      console.error('Failed to fetch next sequence', e);
    }
  };

  // ================= Map Picker Logic =================
  const openMapDialog = () => {
    setMapMarker({
      latitude: parseFloat(formData.latitude) || 13.0827,
      longitude: parseFloat(formData.longitude) || 80.2707
    });
    setMapDialogOpen(true);
  };

  const handleMarkerDrag = (event) => {
    const lngLat = event.target.getLngLat();
    setMapMarker({ latitude: lngLat.lat, longitude: lngLat.lng });
  };

  const handleMapClick = (event) => {
    const { lngLat } = event;
    setMapMarker({ latitude: lngLat.lat, longitude: lngLat.lng });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapMarker({ latitude: lat, longitude: lng });
          if (mapRef.current) mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });

          dispatch(openSnackbar({
            open: true, message: 'Location updated to current position!',
            variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false
          }));
        },
        () => {
          dispatch(openSnackbar({
            open: true, message: 'Unable to retrieve your location.',
            variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false
          }));
        }
      );
    } else {
      dispatch(openSnackbar({
        open: true, message: 'Geolocation is not supported by this browser.',
        variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false
      }));
    }
  };

  const handleMapSave = () => {
    setFormData(prev => ({
      ...prev,
      latitude: mapMarker.latitude.toString(),
      longitude: mapMarker.longitude.toString(),
      mapLink: `https://maps.google.com/?q=${mapMarker.latitude},${mapMarker.longitude}`
    }));
    setMapDialogOpen(false);
  };
  // ====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev };
      if (name === 'gstIn') {
        updated[name] = (value || '').toUpperCase();
      } else {
        updated[name] = value;
      }

      if (name === 'state' && STATE_CODES[value] !== undefined) {
        updated.stateCode = String(STATE_CODES[value]);
      }
      if (name === 'country') {
        updated.state = '';
        updated.city = '';
        updated.stateCode = '';
      }
      if (name === 'state') {
        updated.city = '';
      }
      return updated;
    });
  };

  const handleCompanyChange = (_event, selected) => {
    setFormData(prev => ({
      ...prev,
      companyId: selected ? selected.id : null
    }));
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      setLoading(true);
      const payload = {
        ...formData,
        stateCode: formData.stateCode ? parseInt(formData.stateCode, 10) : null
      };

      if (formData.id) {
        await axios.put(`/api/admin/divisions/${formData.id}`, payload);
        dispatch(openSnackbar({
          open: true, message: 'Division updated successfully!',
          variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false
        }));
      } else {
        await axios.post('/api/admin/divisions', payload);
        dispatch(openSnackbar({
          open: true, message: 'Division created successfully!',
          variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false
        }));
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save division:', error);
      dispatch(openSnackbar({
        open: true, message: 'Failed to save division.',
        variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      setLoading(true);
      await axios.delete(`/api/admin/divisions/${formData.id}`);
      dispatch(openSnackbar({
        open: true, message: 'Division deleted!',
        variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false
      }));
      handleClose();
    } catch (error) {
      console.error('Failed to delete division:', error);
      dispatch(openSnackbar({
        open: true, message: 'Failed to delete division.',
        variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false
      }));
    } finally {
      setLoading(false);
    }
  };

  const isViewOnly = false;
  const selectedCompany = companies.find(c => c.id === formData.companyId) || null;

  const DropdownField = ({ name, label, options, disabled }) => (
    <Autocomplete
      fullWidth
      size="small"
      disabled={disabled}
      options={options}
      value={formData[name] || null}
      onChange={(event, newValue) => {
        handleChange({
          target: { name, value: newValue || '' }
        });
      }}
      isOptionEqualToValue={(option, value) => option === value || value === ""}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!errors[name]}
          helperText={errors[name]}
          placeholder={`Select ${label}...`}
          sx={[{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: disabled ? 'action.hover' : 'background.paper',
              '&:hover fieldset': { borderColor: 'primary.main' }
            }
          }, errorStyle(!!errors[name])]}
        />
      )}
    />
  );

  return (
    <MainCard spacing={2}
      title={id ? 'Edit Division' : 'New Division'}
      secondary={
        <Stack direction="row" spacing={1}>
          {formData.id && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteOpen(true)}
              disabled={loading}
            >
              Delete
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
            onClick={handleSave}
            disabled={loading}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            startIcon={<IconX size={18} />}
            onClick={handleClose}
            disabled={loading}
          >
            Close
          </Button>
        </Stack>
      }
      sx={{ '& > .MuiCardHeader-root': { position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' } }}
    >
      <Box sx={{ p: 0 }} spacing={2}>


        {/* ── Section 2: Division Details ────────────────────────────────── */}
        <BOSFormSection spacing={2}
          icon={<IconLayoutColumns size={20} color={theme.palette.primary.main} />}
          title="Division Details"
        >
          <Grid container spacing={2} sx={{ width: '100%', flexWrap: 'wrap !important' }}>
            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '24%' } }}>
              <Autocomplete
                fullWidth
                size="small"
                disabled={isViewOnly}
                options={companies}
                value={selectedCompany}
                onChange={handleCompanyChange}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                getOptionLabel={(option) => option.label || ''}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <IconBuilding size={16} style={{ marginRight: 8, opacity: 0.5 }} />
                    <Typography variant="body2">{option.label}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Company"
                    required
                    error={!!errors.companyId}
                    helperText={errors.companyId || 'Select the company this division belongs to'}
                    placeholder="Search company..."
                    sx={[{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: isViewOnly ? 'action.hover' : 'background.paper',
                        '&:hover fieldset': { borderColor: 'primary.main' }
                      }
                    }, errorStyle(!!errors.companyId)]}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '24%' } }}>
              <BOSTextField
                name="divisionName"
                label="Division Name"
                value={formData.divisionName}
                onChange={handleChange}
                disabled={isViewOnly}
                required
                maxLength={100}
                error={!!errors.divisionName}
                helperText={errors.divisionName}
                sx={errorStyle(!!errors.divisionName)}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '24%' } }}>
              <BOSTextField
                name="printName"
                label="Print Name"
                value={(formData.description || '')}
                onChange={handleChange}
                disabled={isViewOnly}
                required
                maxLength={100}
                error={!!errors.description}
                helperText={errors.description}
                sx={errorStyle(!!errors.description)}
              />
            </Grid>
            <Grid item xs={12} md={3} sx={{ width: { xs: '100%', md: '24%' } }}>
              <BOSTextField
                name="sequenceNo"
                label="Sequence No"
                type="number"
                value={formData.sequenceNo}
                onChange={handleChange}
                disabled={isViewOnly}
              />
            </Grid>
            <Grid item xs={12} md={3} sx={{ width: { xs: '100%', md: '24%' } }}>
              <BOSStatusField
                isCreate={!id}
                type="boolean"
                name="status"
                label="Status"
                value={formData.status}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, status: val === 'true' || val === true }));
                }}
                disabled={isViewOnly}
              />
            </Grid>

            <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '24%' } }}>
              <BOSTextField
                name="mobileNo"
                label="Mobile No"
                value={formData.mobileNo}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={20}
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '24%' } }}>
              <BOSTextField
                name="emailId"
                label="Email ID"
                value={formData.emailId}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={100}
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '24%' } }}>
              <BOSTextField
                name="website"
                label="Website"
                value={formData.website}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={100}
              />
            </Grid>


          </Grid>
        </BOSFormSection>

        {/* ── Section 3: Location & Tax Details ──────────────────────────── */}
        <BOSFormSection
          icon={<IconMapPin size={20} color={theme.palette.primary.main} />}
          title="Location & Tax Details"
        >
          <Grid container spacing={2} sx={{ width: '100%', flexWrap: 'wrap !important' }}>
            <Grid item xs={12} sx={{ width: { xs: '100%', md: '24%' } }}>
              <BOSTextField
                name="address"
                label="Address Details"
                value={formData.address}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={500}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', md: '14%' } }}>
              <DropdownField
                name="country"
                label="Country"
                options={COUNTRIES}
                disabled={isViewOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', md: '14%' } }} >
              <DropdownField
                name="state"
                label="State / Province"
                options={statesForCountry}
                disabled={isViewOnly || !formData.country}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', md: '14%' } }}>
              <DropdownField
                name="city"
                label="City"
                options={citiesForState}
                disabled={isViewOnly || !formData.state}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', md: '14%' } }}>
              <TextField
                fullWidth
                size="small"
                label="State Code"
                value={formData.stateCode}
                InputProps={{ readOnly: true }}
                disabled={isViewOnly}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'action.hover'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6} sx={{ width: { xs: '100%', md: '14%' } }}>
              <BOSTextField
                name="pincode"
                label="Postal / Zip Code"
                value={formData.pincode}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={10}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={12} sx={{ width: { xs: '100%', md: '69%' } }}>
              <BOSTextField
                name="mapLink"
                label="Google Map Link (URL)"
                value={formData.mapLink}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={1000}
                placeholder="https://goo.gl/maps/..."
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        sx={{ color: theme.palette.primary.main, bgcolor: `${theme.palette.primary.main}1A` }}
                        onClick={openMapDialog}
                        size="small"
                        title="Pick Location from Map"
                      >
                        <IconMapPin size={16} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6} sx={{ width: { xs: '100%', md: '14%' } }}>
              <BOSTextField
                name="latitude"
                label="Latitude"
                value={formData.latitude}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={50}
                placeholder="13.0827"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6} sx={{ width: { xs: '100%', md: '14%' } }}>
              <BOSTextField
                name="longitude"
                label="Longitude"
                value={formData.longitude}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={50}
                placeholder="80.2707"
              />
            </Grid>
          </Grid>
        </BOSFormSection>

        {/* ── Section 4: Registration & Statutory Details ────────────────── */}
        <BOSFormSection
          icon={<IconCertificate size={20} color={theme.palette.primary.main} />}
          title="Registration & Statutory Details"
        >
          <Grid container spacing={2} sx={{ width: '100%', flexWrap: 'wrap !important' }}>
            <Grid item xs={12} sm={6} md={6} sx={{ width: { xs: '100%', md: '15%' } }}>
              <BOSTextField
                name="gstIn"
                label="GSTIN Registration No"
                value={formData.gstIn}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={15}
                error={!!errors.gstIn}
                helperText={errors.gstIn}
                sx={errorStyle(!!errors.gstIn)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} sx={{ width: { xs: '100%', md: '15%' } }}>
              <BOSTextField
                name="panNo"
                label="PAN No"
                value={formData.panNo}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={50}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} sx={{ width: { xs: '100%', md: '15%' } }}>
              <BOSTextField
                name="pfNo"
                label="PF No"
                value={formData.pfNo}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={50}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} sx={{ width: { xs: '100%', md: '15%' } }}>
              <BOSTextField
                name="esiNo"
                label="ESI No"
                value={formData.esiNo}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={50}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6} sx={{ width: { xs: '100%', md: '15%' } }}>
              <BOSTextField
                name="ieCode"
                label="IE Code"
                value={formData.ieCode}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={50}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6} sx={{ width: { xs: '100%', md: '15%' } }}>
              <BOSTextField
                name="cinNo"
                label="CIN No"
                value={formData.cinNo}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={50}
              />
            </Grid>
          </Grid>
        </BOSFormSection>

        {/* ── Section 5: Portal Credentials ──────────────────────────── */}
        <BOSFormSection
          icon={<IconLock size={20} color={theme.palette.primary.main} />}
          title="Portal Credentials"
        >
          <Grid container spacing={2} sx={{ width: '100%', flexWrap: 'wrap !important' }}>
            <Grid item xs={12} md={12} sx={{ width: { xs: '100%', md: '19%' } }}>
              <BOSTextField
                name="gstUserName"
                label="GST Portal Username"
                value={formData.gstUserName}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={100}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', md: '19%' } }}>
              <BOSTextField
                name="ewaybillUserName"
                label="E-Waybill Username"
                value={formData.ewaybillUserName}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={100}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', md: '19%' } }}>
              <BOSTextField
                name="ewaybillPassword"
                label="E-Waybill Password"
                type="password"
                value={formData.ewaybillPassword}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={100}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', md: '19%' } }}>
              <BOSTextField
                name="einvoiceUserName"
                label="E-Invoice Username"
                value={formData.einvoiceUserName}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={100}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', md: '19%' } }}>
              <BOSTextField
                name="einvoicePassword"
                label="E-Invoice Password"
                type="password"
                value={formData.einvoicePassword}
                onChange={handleChange}
                disabled={isViewOnly}
                maxLength={100}
              />
            </Grid>
          </Grid>
        </BOSFormSection>

      </Box>

      {/* Map Location Picker Dialog */}
      <Dialog 
        open={mapDialogOpen} 
        onClose={() => setMapDialogOpen(false)} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', bgcolor: 'background.paper' } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Pick Location</Typography>
          <IconButton onClick={() => setMapDialogOpen(false)} size="small"><IconX size={20} /></IconButton>
        </Box>
        
        <Box sx={{ width: '100%', height: '60vh', position: 'relative' }}>
          <RMap
            ref={mapRef}
            initialCenter={[mapMarker.longitude, mapMarker.latitude]}
            initialZoom={12}
            mapStyle={osm_bright}
            onClick={handleMapClick}
          >
            <RMarker
              longitude={mapMarker.longitude}
              latitude={mapMarker.latitude}
              draggable={true}
              initialAnchor="bottom"
              onDrag={handleMarkerDrag}
            />
          </RMap>

          {mapLoading && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <CircularProgress />
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" color="textSecondary">
            Lat: {mapMarker.latitude.toFixed(6)}, Lng: {mapMarker.longitude.toFixed(6)}
            <br />
            <em>Drag the pin to adjust location precisely.</em>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button onClick={handleGetCurrentLocation} color="primary" size="small" startIcon={<IconCurrentLocation size={16} />} sx={{ fontWeight: 600 }}>
              Live Location
            </Button>
            <Button onClick={() => setMapDialogOpen(false)} size="small" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" size="small" onClick={handleMapSave} startIcon={<IconMapPin size={16} />} sx={{ borderRadius: '8px', fontWeight: 600, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` }}>
              Confirm
            </Button>
          </Box>
        </Box>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Division"
        message="Are you sure you want to delete this division? This action cannot be undone."
        itemName={formData.divisionName}
      />
    </MainCard>
  );
};

export default AddDivisionPage;
