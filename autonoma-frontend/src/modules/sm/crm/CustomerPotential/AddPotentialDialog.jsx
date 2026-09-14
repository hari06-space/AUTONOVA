import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme, Autocomplete, TextField as MuiTextField, Tabs, Tab, Box, Typography, Button, IconButton } from '@mui/material';
import { IconSettings, IconCoins, IconFileDownload, IconUpload, IconX, IconPlus } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSStatusField , errorStyle} from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';
import { btnSave, btnCancel } from 'ui-component/bos/BOSStyles';

// ==============================|| CUSTOMER POTENTIAL DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'customerGroupName', label: 'Customer Group Name', required: true },
  { field: 'customerCode', label: 'Customer Code', required: true },
  { field: 'customerType', label: 'Customer Type', required: true },
  { field: 'manufacturerOem', label: 'Manufacturer OEM', required: true },
  { field: 'wtgModel', label: 'WTG Model', required: true },
  { field: 'windTurbinePower', label: 'Wind Turbine Power', required: true },
  { field: 'windFarmName', label: 'Wind Farm Name', required: true },
  { field: 'area', label: 'Area', required: true },
  { field: 'pincode', label: 'Pincode', required: true }
];

const INITIAL_STATE = {
  customerGroupName: '',
  customerCode: '',
  customerType: '',
  manufacturerOem: '',
  wtgModel: '',
  windTurbinePower: '',
  windFarmName: '',
  area: '',
  pincode: '',
  state: '',
  country: '',
  developer: '',
  plantMw: '',
  turbineCount: '',
  hub: '',
  operationalStatus: '',
  commissioningYear: '',
  commissioningMonth: '',
  latitude: '',
  longitude: '',
  status: 'Active'
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() + 5 - i));

const AddPotentialDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Lookups state
  const [customers, setCustomers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [oems, setOems] = useState([]);
  const [wtgModels, setWtgModels] = useState([]);
  const [powers, setPowers] = useState([]);
  const [windFarms, setWindFarms] = useState([]);
  const [countries, setCountries] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);

  // Bulk Upload File State
  const [selectedFile, setSelectedFile] = useState(null);

  // Load all lookups dynamically from respective masters
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [
          custRes,
          oemRes,
          modelRes,
          capacityRes,
          farmRes,
          countryRes,
          stateRes
        ] = await Promise.all([
          axios.get('/api/sm/customers'),
          axios.get('/api/master/npd/oem'),
          axios.get('/api/master/npd/model'),
          axios.get('/api/master/npd/capacity'),
          axios.get('/api/master/npd/wind-farm'),
          axios.get('/api/admin/countries'),
          axios.get('/api/admin/states')
        ]);

        const custData = custRes.data || [];
        setCustomers(custData);
        
        // Extract unique groups
        const uniqueGroups = Array.from(new Set(custData.map(c => c.groupName).filter(Boolean)));
        setGroups(uniqueGroups);

        setOems((oemRes.data || []).map(o => o.oemShortName).filter(Boolean));
        setWtgModels((modelRes.data || []).map(m => m.modelNo).filter(Boolean));
        setPowers((capacityRes.data || []).map(c => `${c.capacityVal} ${c.uom}`).filter(Boolean));
        setWindFarms((farmRes.data || []).map(w => w.windFarmName).filter(Boolean));
        setCountries((countryRes.data || []).filter(c => !c.status || c.status.toUpperCase() === 'ACTIVE').map(c => c.country).filter(Boolean));
        setAllStates(stateRes.data || []);
      } catch (error) {
        console.error('Failed to load lookups:', error);
      }
    };

    if (open) {
      fetchLookups();
      setActiveTab(0);
      setSelectedFile(null);
    }
  }, [open]);

  // Filter states based on country choice
  useEffect(() => {
    if (formData.country) {
      const filtered = allStates.filter(s => s.countryName?.toUpperCase() === formData.country.toUpperCase());
      setFilteredStates(filtered);
    } else {
      setFilteredStates([]);
    }
  }, [formData.country, allStates]);

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        id: initialData.id,
        customerGroupName: initialData.customerGroupName || '',
        customerCode: initialData.customerCode || '',
        customerType: initialData.customerType || '',
        manufacturerOem: initialData.manufacturerOem || '',
        wtgModel: initialData.wtgModel || '',
        windTurbinePower: initialData.windTurbinePower || '',
        windFarmName: initialData.windFarmName || '',
        area: initialData.area || '',
        pincode: initialData.pincode || '',
        state: initialData.state || '',
        country: initialData.country || '',
        developer: initialData.developer || '',
        plantMw: initialData.plantMw !== null && initialData.plantMw !== undefined ? String(initialData.plantMw) : '',
        turbineCount: initialData.turbineCount !== null && initialData.turbineCount !== undefined ? String(initialData.turbineCount) : '',
        hub: initialData.hub || '',
        operationalStatus: initialData.operationalStatus || '',
        commissioningYear: initialData.commissioningYear || '',
        commissioningMonth: initialData.commissioningMonth || '',
        latitude: initialData.latitude !== null && initialData.latitude !== undefined ? String(initialData.latitude) : '',
        longitude: initialData.longitude !== null && initialData.longitude !== undefined ? String(initialData.longitude) : '',
        status: initialData.status || 'Active',
        createdBy: initialData.createdBy
      });
      setIsEditing(false);
    } else {
      setFormData(INITIAL_STATE);
      setIsEditing(!readOnly);
    }
  }, [initialData, open, readOnly, clearErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    if (activeTab === 1) {
      // Bulk upload tab, handle file save
      await handleUploadFile();
      return;
    }

    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      const payload = {
        id: formData.id,
        customerGroupName: formData.customerGroupName,
        customerCode: formData.customerCode,
        customerType: formData.customerType,
        manufacturerOem: formData.manufacturerOem,
        wtgModel: formData.wtgModel,
        windTurbinePower: formData.windTurbinePower,
        windFarmName: formData.windFarmName,
        area: formData.area,
        pincode: formData.pincode,
        state: formData.state,
        country: formData.country,
        developer: formData.developer,
        plantMw: formData.plantMw ? parseFloat(formData.plantMw) : null,
        turbineCount: formData.turbineCount ? parseInt(formData.turbineCount) : null,
        hub: formData.hub,
        operationalStatus: formData.operationalStatus,
        commissioningYear: formData.commissioningYear,
        commissioningMonth: formData.commissioningMonth,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        status: formData.status,
        createdBy: formData.id ? formData.createdBy : (user?.name || 'Admin'),
        updatedBy: user?.name || 'Admin'
      };

      if (formData.id) {
        await axios.put(`${API_PATHS.SM.POTENTIAL}/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Potential details updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.SM.POTENTIAL, payload);
        dispatch(openSnackbar({ open: true, message: 'Potential details created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save Potential:', error);
      const errorMsg = error.response?.data || 'Failed to save Customer Potential.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.POTENTIAL}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Customer Potential details deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete Customer Potential:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  // Bulk Upload Template & Handler
  const handleDownloadTemplate = () => {
    const headers = [
      'Customer Group Name',
      'Customer Code',
      'Customer Type',
      'Manufacturer OEM',
      'WTG Model',
      'Wind Turbine Power',
      'Wind Farm Name',
      'Area',
      'Pincode',
      'State',
      'Country',
      'Developer',
      'Plant in MW',
      'Turbine Count',
      'Hub',
      'Operational Status',
      'Commissioning Year',
      'Commissioning Month',
      'Latitude',
      'Longitude'
    ];
    import('xlsx').then((XLSX) => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'Customer_Potential_Template.xlsx');
    });
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      dispatch(openSnackbar({ open: true, message: 'Please select an excel template file first.', variant: 'alert', severity: 'warning' }));
      return;
    }

    import('xlsx').then((XLSX) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const rows = XLSX.utils.sheet_to_json(sheet);
          
          let successCount = 0;
          for (const row of rows) {
            const payload = {
              customerGroupName: row['Customer Group Name'] || '',
              customerCode: row['Customer Code'] || '',
              customerType: row['Customer Type'] || '',
              manufacturerOem: row['Manufacturer OEM'] || '',
              wtgModel: row['WTG Model'] || '',
              windTurbinePower: row['Wind Turbine Power'] || '',
              windFarmName: row['Wind Farm Name'] || '',
              area: row['Area'] || '',
              pincode: row['Pincode'] || '',
              state: row['State'] || '',
              country: row['Country'] || '',
              developer: row['Developer'] || '',
              plantMw: row['Plant in MW'] ? parseFloat(row['Plant in MW']) : null,
              turbineCount: row['Turbine Count'] ? parseInt(row['Turbine Count']) : null,
              hub: row['Hub'] || '',
              operationalStatus: row['Operational Status'] || '',
              commissioningYear: row['Commissioning Year'] ? String(row['Commissioning Year']) : '',
              commissioningMonth: row['Commissioning Month'] || '',
              latitude: row['Latitude'] ? parseFloat(row['Latitude']) : null,
              longitude: row['Longitude'] ? parseFloat(row['Longitude']) : null,
              status: 'Active',
              createdBy: user?.name || 'Admin',
              updatedBy: user?.name || 'Admin'
            };
            
            if (payload.customerCode) {
              await axios.post(API_PATHS.SM.POTENTIAL, payload);
              successCount++;
            }
          }
          
          dispatch(openSnackbar({ open: true, message: `${successCount} Customer Potentials imported successfully!`, variant: 'alert', severity: 'success' }));
          handleClose(true);
        } catch (error) {
          console.error('Bulk upload failed:', error);
          dispatch(openSnackbar({ open: true, message: 'Failed to process Excel file. Please ensure correct template headers.', variant: 'alert', severity: 'error' }));
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    });
  };

  const isViewOnly = readOnly && !isEditing;

  // Filter customers for dropdown depending on selected group name
  const filteredCustomers = formData.customerGroupName
    ? customers.filter(c => c.groupName === formData.customerGroupName)
    : customers;

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={() => handleClose()}
        onSave={handleSave}
        onDelete={() => setDeleteOpen(true)}
        onClear={handleClear}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? 'Edit Customer Potential details' : 'New Customer Potential details'}
        isViewOnly={isViewOnly && activeTab === 0}
        hasId={!!formData.id}
        maxWidth="lg"
      >
        {!initialData && (
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="Manual Entry" />
            <Tab label="Bulk Upload" />
          </Tabs>
        )}

        {activeTab === 0 ? (
          <BOSFormSection icon={<IconCoins size={20} color={theme.palette.primary.main} />} title="Customer Potential Details">
            
            {/* 1. Customer Group Name Dropdown */}
            <Autocomplete
              value={formData.customerGroupName || null}
              onChange={(event, newValue) => {
                setFormData((prev) => {
                  const nextState = { ...prev, customerGroupName: newValue || '' };
                  // Clear customer code if selected customer doesn't match selected group
                  if (newValue) {
                    const currentCust = customers.find(c => c.customerCode === prev.customerCode);
                    if (currentCust && currentCust.groupName !== newValue) {
                      nextState.customerCode = '';
                    }
                  }
                  return nextState;
                });
              }}
              disabled={isViewOnly}
              options={groups}
              freeSolo={false}
              renderInput={(params) => (
                <MuiTextField
                  {...params}
                  label="Customer Group Name"
                  variant="outlined"
                  size="small"
                  required
                  error={!!errors.customerGroupName}
                  helperText={errors.customerGroupName}
                  sx={{ mt: 1, mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              )}
              isOptionEqualToValue={(option, value) => option === value}
              noOptionsText="No group names found"
            />

            {/* 2. Customer Code/Name Dropdown */}
            <Autocomplete
              value={
                formData.customerCode
                  ? (customers.find(c => c.customerCode === formData.customerCode)
                      ? `${customers.find(c => c.customerCode === formData.customerCode).customerCode} - ${customers.find(c => c.customerCode === formData.customerCode).customerName}`
                      : null)
                  : null
              }
              onChange={(event, newValue) => {
                const selectedCust = customers.find(c => `${c.customerCode} - ${c.customerName}` === newValue);
                if (selectedCust) {
                  setFormData((prev) => ({
                    ...prev,
                    customerCode: selectedCust.customerCode,
                    customerGroupName: selectedCust.groupName || prev.customerGroupName
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    customerCode: ''
                  }));
                }
              }}
              disabled={isViewOnly}
              options={filteredCustomers.map(c => `${c.customerCode} - ${c.customerName}`)}
              freeSolo={false}
              renderInput={(params) => (
                <MuiTextField
                  {...params}
                  label="Customer Code/Customer Name"
                  variant="outlined"
                  size="small"
                  required
                  error={!!errors.customerCode}
                  helperText={errors.customerCode}
                  sx={{ mt: 1, mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              )}
              isOptionEqualToValue={(option, value) => option === value}
              noOptionsText={formData.customerGroupName ? "No customers in this group" : "Select a group or select from all customers"}
            />

            {/* 3. Customer Type Dropdown */}
            <BOSTextField
              select
              name="customerType"
              label="Customer Type"
              value={formData.customerType}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              error={!!errors.customerType}
              helperText={errors.errors?.customerType}
             sx={errorStyle(!!errors.customerType)} >
              <MenuItem value="powerproducer">Power Producer</MenuItem>
              <MenuItem value="service provider">Service Provider</MenuItem>
            </BOSTextField>

            {/* 4. Manufacturer OEM Dropdown (fetched from OEM Master) */}
            <BOSTextField
              select
              name="manufacturerOem"
              label="Manufacturer OEM"
              value={formData.manufacturerOem}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              error={!!errors.manufacturerOem}
              helperText={errors.manufacturerOem}
             sx={errorStyle(!!errors.manufacturerOem)} >
              {oems.map((o) => (
                <MenuItem key={o} value={o}>{o}</MenuItem>
              ))}
            </BOSTextField>

            {/* 5. WTG Model Dropdown (fetched from Product Model Master) */}
            <BOSTextField
              select
              name="wtgModel"
              label="WTG Model"
              value={formData.wtgModel}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              error={!!errors.wtgModel}
              helperText={errors.wtgModel}
             sx={errorStyle(!!errors.wtgModel)} >
              {wtgModels.map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </BOSTextField>

            {/* 6. Wind Turbine Power Dropdown (capacity val) */}
            <BOSTextField
              select
              name="windTurbinePower"
              label="Wind Turbine Power in MW"
              value={formData.windTurbinePower}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              error={!!errors.windTurbinePower}
              helperText={errors.windTurbinePower}
             sx={errorStyle(!!errors.windTurbinePower)} >
              {powers.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </BOSTextField>

            {/* 7. Wind Farm Name Dropdown (wind-farm master) */}
            <BOSTextField
              select
              name="windFarmName"
              label="Wind Farm Name"
              value={formData.windFarmName}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              error={!!errors.windFarmName}
              helperText={errors.windFarmName}
             sx={errorStyle(!!errors.windFarmName)} >
              {windFarms.map((w) => (
                <MenuItem key={w} value={w}>{w}</MenuItem>
              ))}
            </BOSTextField>

            {/* 8. Area */}
            <BOSTextField
              name="area"
              label="Area"
              value={formData.area}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              maxLength={200}
              error={!!errors.area}
              helperText={errors.area}
             sx={errorStyle(!!errors.area)} />

            {/* 9. Pincode */}
            <BOSTextField
              name="pincode"
              label="Pincode"
              value={formData.pincode}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              maxLength={20}
              error={!!errors.pincode}
              helperText={errors.pincode}
             sx={errorStyle(!!errors.pincode)} />

            {/* 11. Country Dropdown (respected master lookup) */}
            <Autocomplete
              value={formData.country || null}
              onChange={(event, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  country: newValue || '',
                  state: ''
                }));
              }}
              disabled={isViewOnly}
              options={countries}
              freeSolo={false}
              renderInput={(params) => (
                <MuiTextField
                  {...params}
                  label="Country"
                  variant="outlined"
                  size="small"
                  error={!!errors.country}
                  helperText={errors.country}
                  sx={{ mt: 1, mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              )}
              isOptionEqualToValue={(option, value) => option === value}
              noOptionsText="No countries found"
            />

            {/* 10. State Dropdown (respected master lookup) */}
            <Autocomplete
              value={formData.state || null}
              onChange={(event, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  state: newValue || ''
                }));
              }}
              disabled={isViewOnly || !formData.country}
              options={filteredStates.map(s => s.stateName)}
              freeSolo={false}
              renderInput={(params) => (
                <MuiTextField
                  {...params}
                  label="State"
                  variant="outlined"
                  size="small"
                  error={!!errors.state}
                  helperText={errors.state || (!formData.country ? 'Please select country first' : '')}
                  sx={{ mt: 1, mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              )}
              isOptionEqualToValue={(option, value) => option === value}
              noOptionsText={formData.country ? 'No states for this country' : 'Select country first'}
            />

            {/* 12. Developer */}
            <BOSTextField
              name="developer"
              label="Developer"
              value={formData.developer}
              onChange={handleChange}
              disabled={isViewOnly}
              maxLength={200}
            />

            {/* 13. Plant in MW */}
            <BOSTextField
              type="number"
              name="plantMw"
              label="Plant in MW"
              value={formData.plantMw}
              onChange={handleChange}
              disabled={isViewOnly}
            />

            {/* 14. Turbine Count */}
            <BOSTextField
              type="number"
              name="turbineCount"
              label="Turbine Count"
              value={formData.turbineCount}
              onChange={handleChange}
              disabled={isViewOnly}
            />

            {/* 15. Hub */}
            <BOSTextField
              name="hub"
              label="Hub"
              value={formData.hub}
              onChange={handleChange}
              disabled={isViewOnly}
              maxLength={100}
            />

            {/* 16. Operational Status */}
            <BOSTextField
              name="operationalStatus"
              label="Operational Status"
              value={formData.operationalStatus}
              onChange={handleChange}
              disabled={isViewOnly}
              maxLength={100}
            />

            {/* 17. Commissioning Year */}
            <BOSTextField
              select
              name="commissioningYear"
              label="Commissioning Year"
              value={formData.commissioningYear}
              onChange={handleChange}
              disabled={isViewOnly}
            >
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </BOSTextField>

            {/* 18. Commissioning Month */}
            <BOSTextField
              select
              name="commissioningMonth"
              label="Commissioning Month"
              value={formData.commissioningMonth}
              onChange={handleChange}
              disabled={isViewOnly}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </BOSTextField>

            {/* 19. Latitude */}
            <BOSTextField
              type="number"
              name="latitude"
              label="Latitude"
              value={formData.latitude}
              onChange={handleChange}
              disabled={isViewOnly}
            />

            {/* 20. Longitude */}
            <BOSTextField
              type="number"
              name="longitude"
              label="Longitude"
              value={formData.longitude}
              onChange={handleChange}
              disabled={isViewOnly}
            />

            {/* Status Dropdown */}
            <BOSStatusField
              isCreate={!initialData}
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleChange}
              disabled={isViewOnly}
            />
          </BOSFormSection>
        ) : (
          <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
              Customer Potential Bulk Upload details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Use our official Excel template to upload multiple potentials in bulk.
            </Typography>

            <Box sx={{ border: '2px dashed', borderColor: 'primary.main', borderRadius: '12px', p: 4, textAlign: 'center', bgcolor: 'primary.light', mb: 4 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleDownloadTemplate}
                startIcon={<IconFileDownload size={20} />}
                sx={{ mb: 3 }}
              >
                Download Sample Template
              </Button>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Select Excel Template File
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    component="label"
                    sx={{ ...btnSave, bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
                    startIcon={<IconPlus size={18} />}
                  >
                    Choose File
                    <input type="file" hidden accept=".xlsx, .xls" onChange={(e) => setSelectedFile(e.target.files[0])} />
                  </Button>

                  {selectedFile && (
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {selectedFile.name}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleClose}
                sx={btnCancel}
                startIcon={<IconX size={18} />}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleUploadFile}
                disabled={!selectedFile}
                sx={{ ...btnSave, bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                startIcon={<IconUpload size={18} />}
              >
                Upload Template
              </Button>
            </Box>
          </Box>
        )}
        
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Potential Details"
        message="Are you sure you want to delete this customer potential? This action cannot be undone."
        itemName={formData.customerCode}
      />
    </>
  );
};

AddPotentialDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddPotentialDialog;
