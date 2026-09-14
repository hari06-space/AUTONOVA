import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Grid, useTheme, MenuItem, Button, Box, Typography, Autocomplete, TextField as MuiTextField, alpha, Stack } from '@mui/material';
import { IconUser, IconMail, IconPhone, IconMapPin, IconFileTypography, IconPlus, IconUserPlus } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import useBOSValidation from 'hooks/useBOSValidation';
import { lookupPostalCode } from 'utils/postalUtils';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSAutocomplete, BOSFileGallery, BOSFileUpload, BOSStatusField, BOSDatePicker, errorStyle } from 'ui-component/bos';
import AddContactDialog from './AddContactDialog';
import { API_PATHS } from 'utils/api-constants';

const fieldConfigs = [
  { field: 'customerName', label: 'Customer Name', required: true, maxLength: 200 },
  { field: 'currency', label: 'Currency', required: true },
  { field: 'paymentTerms', label: 'Payment Terms', required: true },
  { field: 'deliveryTerms', label: 'Delivery Terms', required: true }
];

// Shared field renderer using Grid for consistent layout
const R = ({ children, lg = 3, md = 4, sm = 6 }) => <Grid item xs={12} sm={sm} md={md} lg={lg}>{children}</Grid>;

export default function AddCustomerDialog({ open, handleClose, initialData, readOnly }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isEdit = !!initialData;
  const { errors, validate, clearErrors } = useBOSValidation();
  const fileInputRef = useRef(null);
  const postalTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    customerCode: '',
    gstin: '',
    customerName: '',
    customerPrintName: '',
    accountsLedger: '',
    groupName: '',
    shortName: '',
    address: '',
    city: '',
    state: '',
    stateCode: '',
    country: '',
    pincode: '',
    primeCustomer: 'No',
    panNo: '',
    website: '',
    registerNo: '',
    cinNo: '',
    isoNumber: '',
    isoExpiry: '',
    ndaRequired: 'No',
    currency: '',
    segment: '',
    subSegment: '',
    paymentTerms: '',
    deliveryTerms: '',
    freight: '',
    domainName: '',
    distance: '',
    location: '',
    ldApplicable: 'No',
    negotiateCustomer: 'No',
    status: 'Active',
    fileUpload: '',
    panFileInfo: ''
  });

  const [countries, setCountries] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [segments, setSegments] = useState([]);
  const [subSegments, setSubSegments] = useState([]);
  const [paymentTermsList, setPaymentTermsList] = useState([]);
  const [deliveryTermsList, setDeliveryTermsList] = useState([]);

  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [panFile, setPanFile] = useState([]);

  const fetchMasterData = useCallback(async () => {
    try {
      const [countriesRes, statesRes, currenciesRes, segmentsRes, subSegmentsRes, paymentRes, deliveryRes] = await Promise.allSettled([
        axios.get('/api/admin/countries'),
        axios.get('/api/admin/states'),
        axios.get('/api/currency'),
        axios.get('/api/sm/segments'),
        axios.get('/api/sm/sub-segments'),
        axios.get('/api/payment-terms'),
        axios.get('/api/delivery-terms')
      ]);

      const isActive = (m) => m && (m.status === true || m.status === 1 || m.status === 'Active' || m.status === 'ACTIVE' || m.status === undefined || m.status === null);
      if (countriesRes.status === 'fulfilled') setCountries((countriesRes.value.data || []).filter(isActive));
      if (statesRes.status === 'fulfilled') setAllStates((statesRes.value.data || []).filter(isActive));
      if (currenciesRes.status === 'fulfilled') setCurrencies((currenciesRes.value.data || []).filter(isActive));
      if (segmentsRes.status === 'fulfilled') setSegments((segmentsRes.value.data || []).filter(isActive));
      if (subSegmentsRes.status === 'fulfilled') setSubSegments((subSegmentsRes.value.data || []).filter(isActive));
      if (paymentRes.status === 'fulfilled') setPaymentTermsList((paymentRes.value.data || []).filter(isActive));
      if (deliveryRes.status === 'fulfilled') setDeliveryTermsList((deliveryRes.value.data || []).filter(isActive));
    } catch (e) {
      console.error('Failed to fetch master data:', e);
    }
  }, []);

  useEffect(() => { if (open) fetchMasterData(); }, [open, fetchMasterData]);

  const filteredStates = useMemo(() => {
    return formData.country ? allStates.filter(s => s.countryName === formData.country) : allStates;
  }, [formData.country, allStates]);

  useEffect(() => {
    if (open) {
      clearErrors();
      if (initialData) {
        setFormData((prev) => ({ ...prev, ...initialData }));
        if (initialData.fileUpload) {
          const files = initialData.fileUpload.split(',').filter(f => f).map(f => ({
            id: `server-${f}`,
            fileName: f.split('_').slice(1).join('_') || f,
            serverFileName: f,
            isLoaded: true
          }));
          setAttachments(files);
        } else {
          setAttachments([]);
        }
        if (initialData.panFileInfo) {
          setPanFile([{ id: 'server-pan', fileName: initialData.panFileInfo.split('_').slice(1).join('_') || initialData.panFileInfo, serverFileName: initialData.panFileInfo, isLoaded: true }]);
        } else {
          setPanFile([]);
        }
      } else {
        setFormData({
          customerCode: '', gstin: '', customerName: '', accountsLedger: '', groupName: '', shortName: '', address: '', city: '', state: '', stateCode: '', country: '', pincode: '', primeCustomer: 'No', panNo: '', website: '', registerNo: '', cinNo: '', isoNumber: '', isoExpiry: '', ndaRequired: 'No', currency: '', segment: '', subSegment: '', paymentTerms: '', deliveryTerms: '', freight: '', domainName: '', distance: '', location: '', ldApplicable: 'No', negotiateCustomer: 'No', status: 'Active'
        });
        setAttachments([]);
      }
    }
  }, [open, initialData, clearErrors]);

  const handlePincodeLookup = useCallback((cleanPin) => {
    if (!cleanPin || cleanPin.length < 3) {
      setFormData(prev => ({ ...prev, city: '', state: '', stateCode: '', country: '' }));
      return;
    }
    if (postalTimerRef.current) clearTimeout(postalTimerRef.current);
    postalTimerRef.current = setTimeout(() => {
      lookupPostalCode(cleanPin, formData.country || '')
        .then(res => {
          if (res && res.success) {
            const matchedState = allStates.find(s => (s.stateName || '').toUpperCase() === res.state);
            const finalState = matchedState ? matchedState.stateName : res.state;
            const finalStateCode = res.stateCode || (matchedState ? (matchedState.stateCode || '') : '');

            const matchedCountry = countries.find(c => (c.countryName || '').toUpperCase() === res.country);
            const finalCountry = matchedCountry ? matchedCountry.countryName : (matchedState?.countryName || res.country);

            setFormData(prev => ({
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
              clearErrors('pincode');
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
            setFormData(prev => ({
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
  }, [allStates, countries, clearErrors, dispatch, formData.country]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) clearErrors(name);
    if (name === 'pincode') {
      const cleanPin = String(value || '').trim();
      handlePincodeLookup(cleanPin);
    }
  };

  const handleCountryChange = (event, newValue) => setFormData((prev) => ({ ...prev, country: newValue || '', state: '', stateCode: '' }));

  const handleStateChange = (event, newValue) => {
    if (newValue) {
      const stateRecord = allStates.find(s => s.stateName === newValue);
      setFormData((prev) => ({ ...prev, state: newValue, stateCode: stateRecord?.stateCode || '', country: stateRecord?.countryName || prev.country }));
    } else {
      setFormData((prev) => ({ ...prev, state: '', stateCode: '' }));
    }
  };

  const handleAutocomplete = (fieldName) => (event, newValue) => setFormData((prev) => ({ ...prev, [fieldName]: newValue || '' }));

  const handleSubmit = async () => {
    if (!validate(formData, fieldConfigs)) return;

    if (formData.ndaRequired === 'Yes' && attachments.length === 0) {
      dispatch(openSnackbar({
        open: true,
        message: 'NDA document is required when "NDA Required" is set to Yes. Please upload the document in the Documents section.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
      return;
    }
    try {
      const updatedAttachments = [...attachments];
      for (let i = 0; i < updatedAttachments.length; i++) {
        const att = updatedAttachments[i];
        if (!att.isLoaded && att.file) {
          const fileData = new FormData();
          fileData.append('file', att.file);
          const uploadRes = await axios.post(`${API_PATHS.FILES}/upload`, fileData, { headers: { 'Content-Type': 'multipart/form-data' } });
          updatedAttachments[i] = { ...att, serverFileName: uploadRes.data, isLoaded: true };
        }
      }

      let finalPanFileInfo = formData.panFileInfo;
      if (panFile.length > 0 && !panFile[0].isLoaded) {
        const fileData = new FormData();
        fileData.append('file', panFile[0].file);
        const uploadRes = await axios.post(`${API_PATHS.FILES}/upload`, fileData, { headers: { 'Content-Type': 'multipart/form-data' } });
        finalPanFileInfo = uploadRes.data;
      } else if (panFile.length === 0) {
        finalPanFileInfo = '';
      }

      const finalFormData = {
        ...formData,
        fileUpload: updatedAttachments.map(att => att.serverFileName).join(','),
        panFileInfo: finalPanFileInfo
      };
      if (isEdit) await axios.put(`/api/sm/customers/${initialData.id}`, finalFormData);
      else await axios.post('/api/sm/customers', finalFormData);
      dispatch(openSnackbar({ open: true, message: `Customer ${isEdit ? 'updated' : 'created'} successfully!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to save customer.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({ id: Date.now() + Math.random(), fileName: file.name, fileType: file.name.split('.').pop()?.toUpperCase() || 'FILE', file: file, isLoaded: false }));
    setAttachments([...attachments, ...newAttachments]);
    e.target.value = null;
  };

  const acSx = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.dark[800] : theme.palette.grey[50]
    }
  };

  return (
    <BOSFormDialog
      open={open}
      onClose={() => handleClose(false)}
      onSave={handleSubmit}
      title={isEdit ? (readOnly ? 'View Customer' : 'Edit Customer') : 'Add New Customer'}
      isViewOnly={readOnly}
      maxWidth="lg"
      extraActions={isEdit && (
        <Button variant="outlined" color="secondary" startIcon={<IconUserPlus size={18} />} onClick={() => setContactDialogOpen(true)} sx={{ borderRadius: '10px' }}>Add Contact Master</Button>
      )}
    >
      <AddContactDialog open={contactDialogOpen} handleClose={() => setContactDialogOpen(false)} initialGroupName={formData.customerName} customerDetails={formData} />

      <BOSFormSection icon={<IconUser size={20} color={theme.palette.primary.main} />} title="Identity & Contact">
        <Grid container spacing={2.5}>
          <R><BOSTextField name="customerCode" label="Customer Code" value={formData.customerCode} onChange={handleChange} disabled placeholder="Auto-generated" /></R>
          <R><BOSTextField name="gstin" label="GSTIN No *" value={formData.gstin} onChange={(e) => { const val = (e.target.value || '').toUpperCase().slice(0, 15); setFormData(p => ({ ...p, gstin: val })); }} disabled={readOnly} inputProps={{ maxLength: 15 }} /></R>
          <R lg={6} md={6}><BOSTextField name="customerName" label="Customer Name" value={formData.customerName} onChange={handleChange} disabled={readOnly} required error={!!errors.customerName} helperText={errors.customerName} sx={errorStyle(!!errors.customerName)} /></R>
          <R lg={6} md={6}><BOSTextField name="customerPrintName" label="Customer Print Name" value={formData.customerPrintName} onChange={handleChange} disabled={readOnly} /></R>

          <R><BOSTextField name="accountsLedger" label="Accounts Ledger" value={formData.accountsLedger} onChange={handleChange} disabled={readOnly} /></R>
          <R><BOSTextField name="groupName" label="Group Name" value={formData.groupName} onChange={handleChange} disabled={readOnly} /></R>
          <R><BOSTextField name="shortName" label="Short Name" value={formData.shortName} onChange={handleChange} disabled={readOnly} /></R>

          <Grid item xs={12} lg={6}>
            <BOSTextField fullWidth name="address" label="Address" value={formData.address} onChange={handleChange} disabled={readOnly} multiline rows={5} placeholder="Enter full address..." />
          </Grid>
          <Grid item xs={12} lg={6}>
            <Grid container spacing={2.5} sx={{ width: '100%', m: 0 }}>
              <Grid item xs={12}><BOSTextField fullWidth name="city" label="City" value={formData.city} onChange={handleChange} disabled={readOnly} /></Grid>
              <Grid item xs={12}><Autocomplete fullWidth value={formData.country || null} onChange={handleCountryChange} options={countries.map(c => c.country)} disabled={readOnly} renderInput={(params) => <BOSTextField {...params} label="Country" sx={acSx} />} /></Grid>
              <Grid item xs={12}><Autocomplete fullWidth value={formData.state || null} onChange={handleStateChange} options={filteredStates.map(s => s.stateName)} disabled={readOnly} renderInput={(params) => <BOSTextField {...params} label="State Name" sx={acSx} />} noOptionsText={formData.country ? 'No states found' : 'Select country first'} /></Grid>
              <Grid item xs={12} md={6}><BOSTextField fullWidth name="stateCode" label="State Code" value={formData.stateCode} disabled placeholder="Auto-filled" /></Grid>
              <Grid item xs={12} md={6}><BOSTextField fullWidth name="pincode" label="Pin Code" value={formData.pincode} onChange={handleChange} disabled={readOnly} /></Grid>
              <Grid item xs={12}><BOSTextField fullWidth name="distance" label="Distance" value={formData.distance} onChange={handleChange} disabled={readOnly} type="number" /></Grid>
            </Grid>
          </Grid>
        </Grid>
      </BOSFormSection>

      <BOSFormSection icon={<IconMail size={20} color={theme.palette.primary.main} />} title="Business & Compliance">
        <Grid container spacing={2.5}>
          <R><BOSTextField name="primeCustomer" label="Prime Customer" value={formData.primeCustomer} onChange={handleChange} disabled={readOnly} select><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></BOSTextField></R>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <BOSTextField name="panNo" label="PAN No" value={formData.panNo} onChange={handleChange} disabled={readOnly} fullWidth />
              <BOSFileUpload
                files={panFile}
                onChange={setPanFile}
                module="SALES_CUSTOMER"
                label="PAN"
                compact
                multiple={false}
                disabled={readOnly}
              />
            </Stack>
          </Grid>
          <R><BOSTextField name="registerNo" label="Register No" value={formData.registerNo} onChange={handleChange} disabled={readOnly} /></R>
          <R><BOSTextField name="cinNo" label="CIN No" value={formData.cinNo} onChange={handleChange} disabled={readOnly} /></R>
          <R><BOSTextField name="isoNumber" label="ISO No" value={formData.isoNumber} onChange={handleChange} disabled={readOnly} /></R>
          <R>
            <BOSDatePicker
              name="isoExpiry"
              label="ISO Expiry Date"
              value={formData.isoExpiry}
              onChange={handleChange}
              disabled={readOnly}
              highlightHolidays={false}
              blockHolidays={false}
            />
          </R>
          <R><BOSTextField name="ndaRequired" label="NDA Required" value={formData.ndaRequired} onChange={handleChange} disabled={readOnly} select><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></BOSTextField></R>
          <Grid item xs={12} lg={6}>
            <Box sx={{ border: '1px dashed', borderColor: formData.ndaRequired === 'Yes' ? 'primary.main' : 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <BOSFileUpload
                files={attachments}
                onChange={setAttachments}
                module="SALES_CUSTOMER"
                label="Upload NDA Document"
                compact
                multiple={true}
                disabled={readOnly || formData.ndaRequired === 'No'}
                helperText="Upload signed NDA agreement."
              />
            </Box>
          </Grid>
          <R lg={6} md={6}><BOSTextField name="website" label="Website" value={formData.website} onChange={handleChange} disabled={readOnly} /></R>
          <R lg={6} md={6}><BOSTextField name="domainName" label="Domain Name" value={formData.domainName} onChange={handleChange} disabled={readOnly} /></R>
        </Grid>
      </BOSFormSection>

      <BOSFormSection icon={<IconPhone size={20} color={theme.palette.primary.main} />} title="Terms & Logistics">
        <Grid container spacing={3} sx={{ width: '100%', m: 0 }}>
          <R lg={4} md={6}>
            <Autocomplete fullWidth value={formData.currency || null} onChange={handleAutocomplete('currency')} options={currencies.map(c => c.currencyCode)} disabled={readOnly}
              renderOption={(props, option) => { const { key, ...optionProps } = props; const cur = currencies.find(c => c.currencyCode === option); return (<li key={key} {...optionProps}><Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{option}</Typography><Typography variant="caption" color="text.secondary">{cur?.currencyName || ''}</Typography></Box></li>); }}
              renderInput={(params) => <BOSTextField {...params} label="Currency" sx={[acSx, errorStyle(!!errors.currency)]} required error={!!errors.currency} helperText={errors.currency} />} />
          </R>
          <R lg={4} md={6}><Autocomplete fullWidth value={formData.segment || null} onChange={handleAutocomplete('segment')} options={segments.map(s => s.segmentName)} disabled={readOnly} renderInput={(params) => <BOSTextField {...params} label="Segment" sx={acSx} />} /></R>
          <R lg={4} md={6}><Autocomplete fullWidth value={formData.subSegment || null} onChange={handleAutocomplete('subSegment')} options={subSegments.map(s => s.subSegmentName)} disabled={readOnly} renderInput={(params) => <BOSTextField {...params} label="Sub Segment" sx={acSx} />} /></R>
          <R lg={4} md={6}><BOSTextField fullWidth name="freight" label="Freight" value={formData.freight} onChange={handleChange} disabled={readOnly} /></R>

          <R lg={4} md={6}><Autocomplete fullWidth value={formData.paymentTerms || null} onChange={handleAutocomplete('paymentTerms')} options={paymentTermsList.map(p => p.termName || p.description)} disabled={readOnly} renderInput={(params) => <BOSTextField {...params} label="Payment Terms" sx={[acSx, errorStyle(!!errors.paymentTerms)]} required error={!!errors.paymentTerms} helperText={errors.paymentTerms} />} /></R>
          <R lg={4} md={6}><Autocomplete fullWidth value={formData.deliveryTerms || null} onChange={handleAutocomplete('deliveryTerms')} options={deliveryTermsList.map(d => d.termName || d.description || d.deliveryTerms)} disabled={readOnly} renderInput={(params) => <BOSTextField {...params} label="Delivery Terms" sx={[acSx, errorStyle(!!errors.deliveryTerms)]} required error={!!errors.deliveryTerms} helperText={errors.deliveryTerms} />} /></R>

          <R lg={4} md={6}><BOSTextField fullWidth name="ldApplicable" label="LD Applicable" value={formData.ldApplicable} onChange={handleChange} disabled={readOnly} select><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></BOSTextField></R>
          <R lg={4} md={6}><BOSTextField fullWidth name="negotiateCustomer" label="Is Negotiate Customer" value={formData.negotiateCustomer} onChange={handleChange} disabled={readOnly} select><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem></BOSTextField></R>
          <R lg={4} md={6}>
            <BOSStatusField
              isCreate={!initialData}
              type="string-capital"
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleChange}
              disabled={readOnly}
            />
          </R>
        </Grid>
      </BOSFormSection>

      <BOSFormSection icon={<IconFileTypography size={20} color={theme.palette.primary.main} />} title="Documents" action={<Button startIcon={<IconPlus size={18} />} size="small" variant="contained" onClick={() => fileInputRef.current?.click()} disabled={readOnly} sx={{ borderRadius: '8px', textTransform: 'none' }}>Add</Button>}>
        <Grid container spacing={2} sx={{ width: '100%', m: 0 }}>
          <Grid item xs={12}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
            <BOSFileGallery files={attachments} onRemove={(idx) => setAttachments(attachments.filter((_, i) => i !== idx))} isEditing={!readOnly} />
          </Grid>
        </Grid>
      </BOSFormSection>

    </BOSFormDialog>
  );
}
