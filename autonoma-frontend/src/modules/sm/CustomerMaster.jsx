import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Grid, Box, Button, Typography, Stack, MenuItem, useTheme, Dialog, IconButton, Tooltip, alpha, FormControlLabel, Checkbox, TextField, InputAdornment, List, ListItemButton, ListItemText, Paper, CircularProgress } from '@mui/material';
import { IconDeviceFloppy, IconArrowLeft, IconTrash, IconEraser, IconPaperclip, IconUser, IconMapPin, IconBusinessplan, IconTruckDelivery, IconCurrentLocation, IconExternalLink, IconSearch, IconX, IconPlus, IconMail } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSFormSection,
  BOSTextField,
  BOSAutocomplete,
  BOSToggleSwitch,
  btnSave,
  btnDelete,
  btnCancel,
  btnClear,
  BOSDatePicker
} from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import VendorAttachmentDialog from './VendorAttachmentDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { lookupPostalCode } from 'utils/postalUtils';
import { RMap, RMarker } from 'maplibre-react-components';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-react-components/style.css';
import osm_bright from '../admin/osm_bright.json';

const INITIAL = {
  referenceCode: '',
  vendorName: '',
  shortName: '',
  printName: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pinCode: '',
  stateCode: '',
  location: '',
  isCustomer: true,
  isSupplier: false,
  isSubcon: false,
  description: '',
  latitude: '',
  longitude: '',
  mobileNo: '',
  mailId: '',
  msmeReq: false,
  msmeNo: '',
  industryType: '',
  vendorCode: '',
  bankAcNo: '',
  bankAcName: '',
  bankName: '',
  branchName: '',
  ifscCode: '',
  officeNo: '',
  faxNo: '',
  groupId: null,
  salesLedgerId: null,
  purchaseLedgerId: null,
  serviceLedgerId: null,
  labourSalesId: null,
  gstin: '',
  panNo: '',
  segment: '',
  subSegment: '',
  domainName: '',
  registerNo: '',
  cinNo: '',
  isoNumber: '',
  website: '',
  dailyDispatchMail: '',
  currencyCode: 'INR',
  dispatchMode: '',
  paymentTerms: '',
  deliveryTerms: '',
  isoExpiryDate: null,
  ndaRequired: false,
  negotiateRequired: false,
  dailyMailRequired: false,
  ldApplicable: false,
  primeVendor: false,
  frieghtApplicable: false,
  isActive: true,
  tcsApplicable: false,
  currencyType: '',
  taxType: '',
  taxPercentage: '',
  tcsLedgerId: null,
  emailMappings: [],
  domainMappings: []
};

const RULES = [
  { field: 'gstin', label: 'GSTIN', required: true },
  { field: 'referenceCode', label: 'Reference Code', required: true, maxLength: 10 },
  { field: 'vendorName', label: 'Name', required: true, maxLength: 100 },
  { field: 'shortName', label: 'Short Name', required: true },
  { field: 'address', label: 'Address', required: true },
  { field: 'city', label: 'City', required: true },
  { field: 'country', label: 'Country', required: true },
  { field: 'state', label: 'State', required: true },
  { field: 'pinCode', label: 'Pin Code', required: true },

];

const R = ({ children, lg = 3, md = 4, sm = 6 }) => <Grid item xs={12} sm={sm} md={md} lg={lg}>{children}</Grid>;

export default function CustomerMaster() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { id: pathId } = useParams();
  const vendorId = pathId || searchParams.get('id');
  const perms = usePagePermissions(PAGE_CODES.CRM_CUSTOMER);
  const { errors, validate, clearErrors } = useBOSValidation();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [vendorTypeError, setVendorTypeError] = useState(false);
  const [attachmentOpen, setAttachmentOpen] = useState(false);

  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [mapMarker, setMapMarker] = useState({ latitude: 13.0827, longitude: 80.2707 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef(null);
  const postalTimerRef = useRef(null);
  const mapRef = useRef(null);

  const [deliveryTerms, setDeliveryTerms] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [segments, setSegments] = useState([]);
  const [subSegments, setSubSegments] = useState([]);
  const [dispatchModes, setDispatchModes] = useState([]);

  const [countries, setCountries] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [allVendors, setAllVendors] = useState([]);
  const [financeLedgers, setFinanceLedgers] = useState([]);
  const [taxLedgers, setTaxLedgers] = useState([]);
  const [ledgerGroups, setLedgerGroups] = useState([]);

  useEffect(() => {
    axios.get('/api/admin/countries').then(res => setCountries(res.data)).catch(console.error);
    axios.get('/api/admin/states').then(res => setAllStates(res.data)).catch(console.error);
    axios.get('/api/admin/currency').then(res => setCurrencies(res.data)).catch(console.error);
    axios.get('/api/payment-terms').then(res => setPaymentTerms(res.data)).catch(console.error);
    axios.get('/api/delivery-terms').then(res => setDeliveryTerms(res.data)).catch(console.error);
    axios.get('/api/sm/segments').then(res => setSegments(res.data)).catch(console.error);
    axios.get('/api/sm/sub-segments').then(res => setSubSegments(res.data)).catch(console.error);
    axios.get('/api/sm/despatch-mode').then(res => setDispatchModes(res.data)).catch(console.error);
    axios.get('/api/master/vendors?type=customer').then(res => setAllVendors(res.data)).catch(console.error);
    axios.get('/api/master/finance/ledger').then(res => setFinanceLedgers(res.data)).catch(console.error);
    axios.get('/api/master/finance/tax-ledger').then(res => setTaxLedgers(res.data)).catch(console.error);
    axios.get('/api/master/finance/ledger-group').then(res => setLedgerGroups(res.data)).catch(console.error);
  }, []);

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return;
    try {
      const { data } = await axios.get(`/api/master/vendors/${vendorId}`);
      const d = { ...INITIAL };
      Object.keys(d).forEach((k) => {
        if (data[k] !== undefined && data[k] !== null) d[k] = data[k];
      });
      if (d.isoExpiryDate && typeof d.isoExpiryDate === 'string') d.isoExpiryDate = d.isoExpiryDate.split('T')[0];
      setForm(d);
    } catch (e) { console.error(e); }
  }, [vendorId]);

  useEffect(() => {
    if (vendorId) fetchVendor();
  }, [vendorId, fetchVendor]);

  const handlePincodeLookup = useCallback((cleanPin) => {
    if (!cleanPin || cleanPin.length < 3) {
      setForm(prev => ({ ...prev, city: '', state: '', stateCode: '', country: '' }));
      return;
    }
    if (postalTimerRef.current) clearTimeout(postalTimerRef.current);
    postalTimerRef.current = setTimeout(() => {
      lookupPostalCode(cleanPin, form.country || '')
        .then(res => {
          if (res && res.success) {
            const matchedState = allStates.find(s => (s.stateName || '').toUpperCase() === res.state);
            const finalState = matchedState ? matchedState.stateName : res.state;
            const finalStateCode = res.stateCode || (matchedState ? (matchedState.stateCode || '') : '');

            const matchedCountry = countries.find(c => (c.countryName || '').toUpperCase() === res.country);
            const finalCountry = matchedCountry ? matchedCountry.countryName : (matchedState?.countryName || res.country);

            setForm(prev => ({
              ...prev,
              city: res.city,
              state: finalState,
              stateCode: finalStateCode,
              country: finalCountry
            }));

            if (clearErrors) {
              clearErrors('city');
              clearErrors('state');
              clearErrors('country');
              clearErrors('pinCode');
            }

            dispatch(openSnackbar({
              open: true,
              message: `Location resolved: ${res.city}, ${finalState} (${finalCountry})`,
              variant: 'alert',
              alert: { color: 'success' },
              severity: 'success',
              close: false
            }));
          } else {
            setForm(prev => ({
              ...prev,
              city: '',
              state: '',
              stateCode: '',
              country: ''
            }));
          }
        })
        .catch(err => {
          console.error("Error fetching pincode data:", err);
        });
    }, 350);
  }, [allStates, countries, clearErrors, dispatch, form.country]);

  const h = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) clearErrors(name);
    if (name === 'isCustomer' || name === 'isSupplier' || name === 'isSubcon') setVendorTypeError(false);
    if (name === 'pinCode') {
      const cleanPin = String(value || '').trim();
      handlePincodeLookup(cleanPin);
    }
  };

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.trim()) return;
    const email = newEmail.trim().toLowerCase();
    
    if (!email.includes('@')) {
      dispatch(openSnackbar({ open: true, message: 'Please enter a valid email address', variant: 'alert', alert: { color: 'error' }, severity: 'error', close: false }));
      return;
    }

    if (form.emailMappings && form.emailMappings.some(m => m.emailAddress === email)) {
      dispatch(openSnackbar({ open: true, message: 'Email address already added', variant: 'alert', alert: { color: 'error' }, severity: 'error', close: false }));
      return;
    }

    const currentMappings = form.emailMappings || [];
    setForm(p => ({
      ...p,
      emailMappings: [...currentMappings, { emailAddress: email, isPrimary: false, activeStatus: true }]
    }));
    setNewEmail('');
  };

  const handleRemoveEmail = (index) => {
    setForm(p => ({
      ...p,
      emailMappings: (p.emailMappings || []).filter((_, idx) => idx !== index)
    }));
  };

  const handleAddDomain = () => {
    if (!newDomain || !newDomain.trim()) return;
    let domain = newDomain.trim().toLowerCase();
    while (domain.startsWith('@')) {
      domain = domain.slice(1);
    }
    if (!domain) return;
    
    if (form.domainMappings && form.domainMappings.some(m => (m.domainName || '').replace(/^@+/, '') === domain)) {
      dispatch(openSnackbar({ open: true, message: 'Domain already added', variant: 'alert', alert: { color: 'error' }, severity: 'error', close: false }));
      return;
    }

    const currentMappings = form.domainMappings || [];
    setForm(p => ({
      ...p,
      domainMappings: [...currentMappings, { domainName: domain, activeStatus: true }]
    }));
    setNewDomain('');
  };

  const handleRemoveDomain = (index) => {
    setForm(p => ({
      ...p,
      domainMappings: (p.domainMappings || []).filter((_, idx) => idx !== index)
    }));
  };

  const handleAC = (field) => (newValue) => {
    setForm(p => ({ ...p, [field]: newValue || '' }));
  };


  const handleVendorSelect = (val) => {
    const match = allVendors.filter(v => v.isCustomer).find(v => v.vendorName === val || v.gstin === val);
    if (match) {
      navigate(`/sm/customers/create?id=${match.vendorId || match.id}`, { replace: true });
    } else {
      setForm(p => ({ ...p, vendorName: val || '' }));
    }
  };

  const handleGstinSelect = (val) => {
    const match = allVendors.filter(v => v.isCustomer).find(v => v.gstin === val || v.vendorName === val);
    if (match) {
      navigate(`/sm/customers/create?id=${match.vendorId || match.id}`, { replace: true });
    } else {
      setForm(p => ({ ...p, gstin: val || '' }));
    }
  };

  const handleCountryChange = (newValue) => {
    setForm(p => ({ ...p, country: newValue || '', state: '', stateCode: '' }));
    if (errors.country) clearErrors('country');
  };

  const handleStateChange = (newValue) => {
    if (newValue) {
      const s = allStates.find(x => x.stateName === newValue);
      setForm(p => ({
        ...p,
        state: newValue,
        stateCode: s?.stateCode || '',
        country: s?.countryName || p.country
      }));
      if (errors.state) clearErrors('state');
      if (errors.country) clearErrors('country');
    } else {
      setForm(p => ({ ...p, state: '', stateCode: '' }));
    }
  };

  const openMapDialog = () => {
    setMapMarker({
      latitude: parseFloat(form.latitude) || 13.0827,
      longitude: parseFloat(form.longitude) || 80.2707
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
        },
        (error) => {
          console.error("Error getting location:", error);
          dispatch(openSnackbar({ open: true, message: 'Could not get current location.', variant: 'alert', alert: { color: 'error' } }));
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  const handleAddressSearch = (query) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query || query.length < 3) { setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
        const data = await res.json();
        setSearchResults(data);
      } catch (e) { console.error(e); }
      setSearching(false);
    }, 500);
  };

  const handleSearchSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapMarker({ latitude: lat, longitude: lng });
    setSearchQuery(result.display_name);
    setSearchResults([]);
    if (mapRef.current) mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
  };

  const handleMapSave = () => {
    setForm(p => ({
      ...p,
      latitude: mapMarker.latitude.toString(),
      longitude: mapMarker.longitude.toString()
    }));
    setSearchQuery('');
    setSearchResults([]);
    setMapDialogOpen(false);
  };

  const handleSave = async () => {
    if (!validate(form, RULES)) return;

    if (!form.isCustomer && !form.isSupplier && !form.isSubcon) {
      setVendorTypeError(true);
      dispatch(openSnackbar({ open: true, message: 'Please select at least one vendor type (Customer, Supplier, or SubContractor)', variant: 'alert', alert: { color: 'error' }, severity: 'error', close: false }));
      return;
    }

    setLoading(true);
    try {
      if (vendorId) {
        await axios.put(`/api/master/vendors/${vendorId}`, form);
        dispatch(openSnackbar({ open: true, message: 'Customer Updated Successfully', variant: 'alert', alert: { color: 'success' } }));
      } else {
        await axios.post('/api/master/vendors', form);
        dispatch(openSnackbar({ open: true, message: 'Customer Created Successfully', variant: 'alert', alert: { color: 'success' } }));
        navigate('/sm/customers');
      }
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: error?.response?.data?.message || 'Error saving customer', variant: 'alert', alert: { color: 'error' } }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!perms.delete) return;
    try {
      await axios.delete(`/api/master/vendors/${vendorId}`);
      dispatch(openSnackbar({ open: true, message: 'Customer Deleted', variant: 'alert', alert: { color: 'success' } }));
      navigate('/sm/customers');
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: 'Error deleting', variant: 'alert', alert: { color: 'error' } }));
    }
  };

  const fbx = {
    flex: {
      xs: '0 0 100%',
      sm: '0 0 calc(50% - 10px)',
      md: '0 0 calc(33.33% - 14px)',
      lg: '0 0 calc(25% - 15px)'
    }
  };

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h3">{vendorId ? 'Edit Customer' : 'New Customer'}</Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1}>
          {vendorId && (
            <Button variant="contained" color="primary" onClick={() => setAttachmentOpen(true)} startIcon={<IconPaperclip size={18} />} sx={{ ...btnCancel, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark', transform: 'translateY(-2px)', boxShadow: 6 } }}>
              Attachments
            </Button>
          )}
          <Button variant="contained" color="secondary" onClick={() => navigate('/sm/customers')} startIcon={<IconArrowLeft size={18} />} sx={btnCancel}>
            Back
          </Button>
          {!vendorId && (
            <Button variant="contained" color="warning" onClick={() => { setForm(INITIAL); clearErrors(); }} startIcon={<IconEraser size={18} />} sx={btnClear}>
              Clear
            </Button>
          )}
          {vendorId && perms.delete && (
            <Button variant="contained" color="error" onClick={() => setDeleteOpen(true)} startIcon={<IconTrash size={18} />} sx={btnDelete}>
              Delete
            </Button>
          )}
          {perms.write && (
            <Button variant="contained" color="success" onClick={handleSave} disabled={loading} startIcon={<IconDeviceFloppy size={18} />} sx={btnSave}>
              Save
            </Button>
          )}
        </Stack>
      }
    >
      <Stack spacing={3}>
        <Box>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center', mb: 0.5, ...(vendorTypeError && { border: '1px solid', borderColor: 'error.main', borderRadius: 1, p: 0.5 }) }}>
            <FormControlLabel control={<Checkbox checked={form.isCustomer} onChange={h} name="isCustomer" size="small" sx={{ ...(vendorTypeError && { color: 'error.main' }) }} />} label={<Typography variant="body1" sx={{ fontWeight: 600 }} color={vendorTypeError ? 'error' : 'inherit'}>Customer</Typography>} sx={{ margin: 0 }} />
            <FormControlLabel control={<Checkbox checked={form.isSupplier} onChange={h} name="isSupplier" size="small" sx={{ ...(vendorTypeError && { color: 'error.main' }) }} />} label={<Typography variant="body1" sx={{ fontWeight: 600 }} color={vendorTypeError ? 'error' : 'inherit'}>Supplier</Typography>} sx={{ margin: 0 }} />
            <FormControlLabel control={<Checkbox checked={form.isSubcon} onChange={h} name="isSubcon" size="small" sx={{ ...(vendorTypeError && { color: 'error.main' }) }} />} label={<Typography variant="body1" sx={{ fontWeight: 600 }} color={vendorTypeError ? 'error' : 'inherit'}>SubContractor</Typography>} sx={{ margin: 0 }} />
          </Box>
          <BOSFormSection icon={<IconUser size={20} color={theme.palette.primary.main} />} title="Identity & Profile">
            <Box sx={{ width: '100%', px: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, width: '100%', alignItems: 'flex-start' }}>
                <Box sx={{ flex: '1 1 32%' }}><BOSTextField fullWidth name="vendorName" label="Customer Name *" value={form.vendorName} onChange={h} error={!!errors.vendorName} helperText={errors.vendorName} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="shortName" label="Short Name *" value={form.shortName} onChange={h} error={!!errors.shortName} helperText={errors.shortName} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="printName" label="Print Name" value={form.printName} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="referenceCode" label="Reference Code *" value={form.referenceCode} onChange={h} error={!!errors.referenceCode} helperText={errors.referenceCode} maxLength={10} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="vendorCode" label="Vendor Code" value={form.vendorCode} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="industryType" label="Industry Type" value={form.industryType} onChange={h} /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={form.segment || null} onChange={handleAC('segment')} options={segments.map(s => s.segmentName)} label="Segment" /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={form.subSegment || null} onChange={handleAC('subSegment')} options={subSegments.map(s => s.subSegmentName)} label="Sub Segment" /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="domainName" label="Domain Name" value={form.domainName} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="website" label="Website" value={form.website} onChange={h} /></Box>
                <Box sx={{ flex: { xs: '0 0 100%', sm: '0 0 100%', md: '0 0 calc(66.66% - 14px)', lg: '0 0 calc(50% - 10px)' } }}><BOSTextField fullWidth multiline rows={3} disableRichText name="description" label="Description" value={form.description} onChange={h} /></Box>
              </Box>
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconMapPin size={20} color={theme.palette.primary.main} />} title="Contact & Location Details">
            <Box sx={{ width: '100%', px: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, width: '100%', alignItems: 'flex-start', mb: 2.5 }}>
                <Box sx={fbx}><BOSTextField fullWidth name="mobileNo" label="Mobile No" value={form.mobileNo} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="mailId" label="Mail ID" value={form.mailId} onChange={h} type="email" /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="officeNo" label="Office No" value={form.officeNo} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="faxNo" label="Fax No" value={form.faxNo} onChange={h} /></Box>
              </Box>
              <Box sx={{ mb: 2.5 }}>
                <BOSTextField fullWidth multiline rows={3} name="address" label="Address *" value={form.address} onChange={h} error={!!errors.address} helperText={errors.address} placeholder="Enter full address here..." disableRichText />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, width: '100%', alignItems: 'flex-start' }}>
                <Box sx={fbx}><BOSTextField fullWidth name="city" label="City *" value={form.city} onChange={h} error={!!errors.city} helperText={errors.city} /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={form.state || null} onChange={handleStateChange} options={allStates.map(s => s.stateName)} label="State *" error={!!errors.state} helperText={errors.state} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="stateCode" label="State Code" value={form.stateCode} onChange={h} type="number" /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={form.country || null} onChange={handleCountryChange} options={countries.map(c => c.countryName)} label="Country *" error={!!errors.country} helperText={errors.country} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="pinCode" label="Pin Code *" value={form.pinCode} onChange={h} error={!!errors.pinCode} helperText={errors.pinCode} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="distance" label="Distance (KM)" value={form.distance} onChange={h} type="number" /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="location" label="Location" value={form.location} onChange={h} /></Box>
                <Box sx={{ flex: { xs: '0 0 100%', sm: '0 0 100%', md: '0 0 calc(66.66% - 14px)', lg: '0 0 calc(50% - 10px)' }, display: 'flex', gap: 1 }}>
                  <BOSTextField fullWidth name="latitude" label="Latitude" value={form.latitude} onChange={h} />
                  <BOSTextField fullWidth name="longitude" label="Longitude" value={form.longitude} onChange={h} />
                  <Tooltip title="Pick Location">
                    <IconButton sx={{ color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1), height: 'fit-content', alignSelf: 'center' }} onClick={openMapDialog} size="large">
                      <IconMapPin size={22} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconMail size={20} color={theme.palette.primary.main} />} title="Email & Domain Mappings">
            <Box sx={{ width: '100%', px: 1 }}>
              <Grid container spacing={3}>
                {/* Email Mappings */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: theme.palette.mode === 'dark' ? 'background.default' : theme.palette.grey[50] }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Mapped Email Addresses</Typography>
                    
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Enter email address..."
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleAddEmail(); }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddEmail}
                        startIcon={<IconPlus size={16} />}
                        sx={{ borderRadius: '8px' }}
                      >
                        Add
                      </Button>
                    </Stack>
                    
                    <List sx={{ maxHeight: 200, overflow: 'auto', p: 0 }}>
                      {(!form.emailMappings || form.emailMappings.length === 0) ? (
                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                          No additional email mappings configured.
                        </Typography>
                      ) : (
                        form.emailMappings.map((mapping, idx) => (
                          <Paper key={idx} variant="outlined" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, mb: 1, borderRadius: '8px', bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#ffffff' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {mapping.emailAddress}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveEmail(idx)}
                            >
                              <IconTrash size={16} />
                            </IconButton>
                          </Paper>
                        ))
                      )}
                    </List>
                  </Paper>
                </Grid>

                {/* Domain Mappings */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: theme.palette.mode === 'dark' ? 'background.default' : theme.palette.grey[50] }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Mapped Corporate Domains</Typography>
                    
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Enter domain (e.g. technosprint.net)..."
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleAddDomain(); }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddDomain}
                        startIcon={<IconPlus size={16} />}
                        sx={{ borderRadius: '8px' }}
                      >
                        Add
                      </Button>
                    </Stack>
                    
                    <List sx={{ maxHeight: 200, overflow: 'auto', p: 0 }}>
                      {(!form.domainMappings || form.domainMappings.length === 0) ? (
                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                          No additional domain mappings configured.
                        </Typography>
                      ) : (
                        form.domainMappings.map((mapping, idx) => (
                          <Paper key={idx} variant="outlined" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, mb: 1, borderRadius: '8px', bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#ffffff' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {mapping.domainName}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveDomain(idx)}
                            >
                              <IconTrash size={16} />
                            </IconButton>
                          </Paper>
                        ))
                      )}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconBusinessplan size={20} color={theme.palette.primary.main} />} title="Statutory & Registration">
            <Box sx={{ width: '100%', px: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, width: '100%', alignItems: 'flex-start' }}>
                <Box sx={fbx}>
                  <BOSAutocomplete
                    freeSolo
                    fullWidth
                    options={Array.from(new Set(allVendors.filter(v => v.isCustomer).map(v => v.gstin).filter(Boolean)))}
                    value={form.gstin || null}
                    onInputChange={(e, val) => {
                      if (e && e.type === 'change') {
                        const uppercaseVal = (val || '').toUpperCase().slice(0, 15);
                        setForm(p => ({ ...p, gstin: uppercaseVal }));
                      }
                    }}
                    onChange={(val) => {
                      if (val) {
                        const uppercaseVal = (val || '').toUpperCase().slice(0, 15);
                        handleGstinSelect(uppercaseVal);
                      }
                    }}
                    label="GSTIN *"
                    error={!!errors.gstin}
                    helperText={errors.gstin || 'Maximum 15 characters'}
                    slotProps={{ htmlInput: { maxLength: 15 } }}
                  />
                </Box>
                <Box sx={fbx}><BOSTextField fullWidth name="panNo" label="PAN No" value={form.panNo} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="cinNo" label="CIN No" value={form.cinNo} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="registerNo" label="Register No" value={form.registerNo} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="msmeNo" label="MSME No" value={form.msmeNo} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="isoNumber" label="ISO No" value={form.isoNumber} onChange={h} /></Box>
                <Box sx={fbx}><BOSDatePicker fullWidth name="isoExpiryDate" label="ISO Expiry Date" value={form.isoExpiryDate} onChange={h} /></Box>
              </Box>
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconBusinessplan size={20} color={theme.palette.primary.main} />} title="Bank Details">
            <Box sx={{ width: '100%', px: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, width: '100%', alignItems: 'flex-start' }}>
                <Box sx={fbx}><BOSTextField fullWidth name="bankAcNo" label="Bank A/C No" value={form.bankAcNo} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="bankAcName" label="Bank A/C Name" value={form.bankAcName} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="bankName" label="Bank Name" value={form.bankName} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="branchName" label="Branch Name" value={form.branchName} onChange={h} /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="ifscCode" label="IFSC Code" value={form.ifscCode} onChange={h} /></Box>
              </Box>
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconBusinessplan size={20} color={theme.palette.primary.main} />} title="Financial Mapping">
            <Box sx={{ width: '100%', px: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, width: '100%', alignItems: 'flex-start' }}>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={ledgerGroups.find(g => g.id === form.groupId)?.groupName || null} onChange={(val) => setForm(p => ({ ...p, groupId: ledgerGroups.find(g => g.groupName === val)?.id || null }))} options={ledgerGroups.map(g => g.groupName)} label="Ledger Group" /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={financeLedgers.find(v => v.id === form.salesLedgerId)?.ledgerName || null} onChange={(val) => setForm(p => ({ ...p, salesLedgerId: financeLedgers.find(v => v.ledgerName === val)?.id || null }))} options={financeLedgers.map(v => v.ledgerName)} label="Sales Ledger" /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={financeLedgers.find(v => v.id === form.purchaseLedgerId)?.ledgerName || null} onChange={(val) => setForm(p => ({ ...p, purchaseLedgerId: financeLedgers.find(v => v.ledgerName === val)?.id || null }))} options={financeLedgers.map(v => v.ledgerName)} label="Purchase Ledger" /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={financeLedgers.find(v => v.id === form.serviceLedgerId)?.ledgerName || null} onChange={(val) => setForm(p => ({ ...p, serviceLedgerId: financeLedgers.find(v => v.ledgerName === val)?.id || null }))} options={financeLedgers.map(v => v.ledgerName)} label="Service Ledger" /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={financeLedgers.find(v => v.id === form.labourSalesId)?.ledgerName || null} onChange={(val) => setForm(p => ({ ...p, labourSalesId: financeLedgers.find(v => v.ledgerName === val)?.id || null }))} options={financeLedgers.map(v => v.ledgerName)} label="Labour Sales Ledger" /></Box>
                <Box sx={fbx}>
                  <BOSToggleSwitch name="tcsApplicable" value={form.tcsApplicable} onChange={h} checkedLabel="" uncheckedLabel="" label="TCS Applicable" sx={{ pt: 1 }} />
                </Box>
                {form.tcsApplicable && (
                  <Box sx={fbx}><BOSAutocomplete fullWidth value={taxLedgers.find(v => v.id === form.tcsLedgerId)?.ledgerName || null} onChange={(val) => setForm(p => ({ ...p, tcsLedgerId: taxLedgers.find(v => v.ledgerName === val)?.id || null }))} options={taxLedgers.filter(v => (v.category || '').toUpperCase() === 'TCS').map(v => v.ledgerName)} label="TCS Ledger" /></Box>
                )}
              </Box>
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconTruckDelivery size={20} color={theme.palette.primary.main} />} title="Terms & Logistics">
            <Box sx={{ width: '100%', px: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, width: '100%', alignItems: 'flex-start' }}>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={form.currencyCode || null} onChange={handleAC('currencyCode')} options={currencies.map(c => c.currencyCode)} label="Currency" /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={form.currencyType || null} onChange={handleAC('currencyType')} options={['Cash', 'BANK']} label="Currency Type" /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={form.paymentTerms || null} onChange={handleAC('paymentTerms')} options={paymentTerms.map(p => p.termName || p.description || p.paymentTerms)} label="Payment Terms" /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={form.deliveryTerms || null} onChange={handleAC('deliveryTerms')} options={deliveryTerms.map(d => d.termName || d.description || d.deliveryTerms)} label="Delivery Terms" /></Box>
                <Box sx={fbx}><BOSAutocomplete fullWidth value={form.dispatchMode || null} onChange={handleAC('dispatchMode')} options={dispatchModes.map(m => m.modeName || m.despatchMode || m.description)} label="Dispatch Mode" /></Box>
                <Box sx={fbx}><BOSTextField fullWidth name="dailyDispatchMail" label="Daily Dispatch Mail" value={form.dailyDispatchMail} onChange={h} /></Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, width: '100%', alignItems: 'center', mt: 3, mb: 1, px: 2 }}>
                <BOSToggleSwitch name="primeVendor" value={form.primeVendor} onChange={h} checkedLabel="" uncheckedLabel="" label="Prime Customer" />
                <BOSToggleSwitch name="ndaRequired" value={form.ndaRequired} onChange={h} checkedLabel="" uncheckedLabel="" label="NDA Required" />
                <BOSToggleSwitch name="msmeReq" value={form.msmeReq} onChange={h} checkedLabel="" uncheckedLabel="" label="MSME Required" />
                <BOSToggleSwitch name="ldApplicable" value={form.ldApplicable} onChange={h} checkedLabel="" uncheckedLabel="" label="LD Applicable" />
                <BOSToggleSwitch name="negotiateRequired" value={form.negotiateRequired} onChange={h} checkedLabel="" uncheckedLabel="" label="Negotiate Required" />
                <BOSToggleSwitch name="dailyMailRequired" value={form.dailyMailRequired} onChange={h} checkedLabel="" uncheckedLabel="" label="Daily Mail Required" />
                <BOSToggleSwitch name="frieghtApplicable" value={form.frieghtApplicable} onChange={h} checkedLabel="" uncheckedLabel="" label="Freight Applicable" />
                <BOSToggleSwitch name="isActive" value={form.isActive} onChange={h} checkedLabel="" uncheckedLabel="" label="Active" />
              </Box>
            </Box>
          </BOSFormSection>
        </Box>
      </Stack>

      <ConfirmDeleteDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Delete Customer" message="Are you sure you want to delete?" itemName={form.vendorName} />


      {attachmentOpen && (
        <VendorAttachmentDialog
          open={attachmentOpen}
          handleClose={() => setAttachmentOpen(false)}
          vendorId={vendorId}
          pageCode="CUSTOMER_MASTER"
          docTypes={['Logo', 'Profile', 'GST Certificate', 'PAN Card', 'Certificate of Incorporation', 'Address Proof', 'Cancelled Cheque', 'Bank Verification Letter', 'Service Agreement', 'NDA', 'SLA', 'Insurance Certificate', 'Other (Custom)']}
        />
      )}

      {/* Map Dialog */}
      <Dialog open={mapDialogOpen} onClose={() => { setMapDialogOpen(false); setSearchQuery(''); setSearchResults([]); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', bgcolor: 'background.paper' } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Pick Location</Typography>
          <IconButton onClick={() => { setMapDialogOpen(false); setSearchQuery(''); setSearchResults([]); }} size="small"><IconX size={20} /></IconButton>
        </Box>
        <Box sx={{ width: '100%', height: '60vh', position: 'relative' }}>
          {/* Search bar overlay */}
          <Box sx={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10, maxWidth: 400 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search address..."
              value={searchQuery}
              onChange={(e) => handleAddressSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    {searching ? <CircularProgress size={16} /> : searchQuery && (
                      <IconButton size="small" onClick={() => { setSearchQuery(''); setSearchResults([]); }}><IconX size={16} /></IconButton>
                    )}
                  </InputAdornment>
                ),
                sx: { bgcolor: 'background.paper', borderRadius: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: theme.palette.primary.main }, '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main } }
              }}
            />
            {searchResults.length > 0 && (
              <Paper sx={{ mt: 0.5, borderRadius: '10px', overflow: 'hidden', maxHeight: 220, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                <List dense disablePadding>
                  {searchResults.map((r, i) => (
                    <ListItemButton key={i} onClick={() => handleSearchSelect(r)} sx={{ py: 1, px: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}>
                      <ListItemText primary={r.display_name} primaryTypographyProps={{ variant: 'body2', noWrap: false, sx: { fontSize: '0.8rem', lineHeight: 1.4 } }} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
          <RMap ref={mapRef} initialCenter={[mapMarker.longitude, mapMarker.latitude]} initialZoom={12} mapStyle={osm_bright} onClick={handleMapClick}>
            <RMarker longitude={mapMarker.longitude} latitude={mapMarker.latitude} draggable={true} initialAnchor="bottom" onDrag={handleMarkerDrag} />
          </RMap>
        </Box>
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.light, 0.05) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Lat: {mapMarker.latitude.toFixed(6)}, Lng: {mapMarker.longitude.toFixed(6)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button onClick={handleGetCurrentLocation} color="primary" size="small" startIcon={<IconCurrentLocation size={16} />} sx={{ fontWeight: 600 }}>Live Location</Button>
            <Button onClick={() => { setMapDialogOpen(false); setSearchQuery(''); setSearchResults([]); }} size="small" sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
            <Button variant="contained" size="small" onClick={handleMapSave} startIcon={<IconMapPin size={16} />} sx={{ borderRadius: '8px', fontWeight: 600, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` }}>Confirm</Button>
          </Box>
        </Box>
      </Dialog>
    </MainCard>
  );
}

