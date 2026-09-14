import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import useBOSValidation from 'hooks/useBOSValidation';
import { BOSTextField, errorStyle, BOSStatusField, BOSFormSection } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import { Box, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tabs, Tab, useTheme, MenuItem } from '@mui/material';
import { IconInfoCircle, IconSettings, IconTrash, IconPlus, IconListDetails, IconDatabase } from '@tabler/icons-react';
import MachineIntegrationTab from './MachineIntegrationTab';

const INITIAL_STATE = {
  id: null,
  assetGroupId: '',
  assetTypeId: '',
  assetId: '',
  assetName: '',
  description: '',
  printName: '',
  division: '',
  uom: '',
  seqNo: '',
  purchaseRate: '',
  price: '',
  supplierId: '',
  supplyDate: '',
  purchaseYear: '',
  warrantyAvail: false,
  warrantyExpiryDate: '',
  ownerType: '',
  ownerId: '',
  assetSpec: '',
  modelNo: '',
  serialNo: '',
  capacity: '',
  dimension: '',
  power: '',
  hsnCode: '',
  sacCode: '',
  ipAddress: '',
  portNo: '',
  calibrFrequency: '',
  lastCalibrDate: '',
  nextCalibrDate: '',
  amcFrequency: '',
  lastAmcDate: '',
  nextAmcDate: '',
  depreciationPercentage: '',
  depreciationMethod: '',
  assetLife: '',
  oeeReq: false,
  make: '',
  remarks: '',
  status: true,
  criterialSpares: []
};

const VALIDATION_RULES = [
  { field: 'assetId', label: 'Asset ID', required: true, max: 50 },
  { field: 'assetName', label: 'Asset Name', required: true, max: 100 }
];

function SpareInput({ value, onChange, placeholder, required, type = 'text', inputProps }) {
  const theme = useTheme();
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      {...inputProps}
      style={{
        width: '100%',
        padding: '6px 12px',
        borderRadius: '6px',
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fafafa',
        transition: 'all 0.2s ease-in-out',
        fontSize: '0.875rem',
        color: theme.palette.text.primary,
        ...(inputProps?.style || {})
      }}
    />
  );
}

export default function MachineAddEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dropdown lists
  const [assetGroups, setAssetGroups] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const { validate, errors, setErrors } = useBOSValidation(VALIDATION_RULES);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      // Best effort fetching - URLs might differ based on backend setup
      axios.get('/api/asset-group').then(res => setAssetGroups(res.data)).catch(() => {});
      axios.get('/api/asset-type').then(res => setAssetTypes(res.data)).catch(() => {});
      axios.get('/api/master/vendors').then(res => setSuppliers(res.data)).catch(() => {});
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMachineById();
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [id]);

  const fetchMachineById = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/qmt/machines/${id}`);
      const row = response.data;
      setFormData({
        ...row,
        assetGroupId: row.assetGroupId || '',
        assetTypeId: row.assetTypeId || '',
        supplierId: row.supplierId || '',
        supplyDate: row.supplyDate ? row.supplyDate.substring(0, 10) : '',
        warrantyExpiryDate: row.warrantyExpiryDate ? row.warrantyExpiryDate.substring(0, 10) : '',
        lastCalibrDate: row.lastCalibrDate ? row.lastCalibrDate.substring(0, 10) : '',
        nextCalibrDate: row.nextCalibrDate ? row.nextCalibrDate.substring(0, 10) : '',
        lastAmcDate: row.lastAmcDate ? row.lastAmcDate.substring(0, 10) : '',
        nextAmcDate: row.nextAmcDate ? row.nextAmcDate.substring(0, 10) : '',
        criterialSpares: row.criterialSpares || []
      });
    } catch (error) {
      console.error('Failed to fetch asset:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch asset details',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSave = async () => {
    if (!validate(formData)) return;
    setSaving(true);
    try {
      const payload = { ...formData };
      
      // Clean up empty strings for numbers
      ['assetGroupId', 'assetTypeId', 'division', 'seqNo', 'purchaseRate', 'price', 'supplierId', 'purchaseYear', 'ownerId', 'portNo', 'depreciationPercentage'].forEach(field => {
          if (payload[field] === '') payload[field] = null;
      });

      if (id) {
        await axios.put(`/api/qmt/machines/${id}`, payload);
      } else {
        await axios.post('/api/qmt/machines', payload);
      }
      
      dispatch(openSnackbar({
        open: true,
        message: `Asset ${id ? 'updated' : 'created'} successfully`,
        variant: 'alert',
        alert: { color: 'success' }
      }));
      navigate('/master/qmt/machine');
    } catch (error) {
      dispatch(openSnackbar({
        open: true,
        message: error.response?.data || 'Failed to save asset',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddSpareRow = () => {
    setFormData(prev => ({
      ...prev,
      criterialSpares: [
        ...prev.criterialSpares,
        { itemCode: '', itemName: '', supplier: '', rate: '', qty: '', uom: '' }
      ]
    }));
  };

  const handleRemoveSpareRow = (idx) => {
    setFormData(prev => {
      const newSpares = [...prev.criterialSpares];
      newSpares.splice(idx, 1);
      return { ...prev, criterialSpares: newSpares };
    });
  };

  const handleSpareChange = (idx, field, value) => {
    setFormData(prev => {
      const newSpares = [...prev.criterialSpares];
      newSpares[idx][field] = value;
      return { ...prev, criterialSpares: newSpares };
    });
  };

  return (
    <MainCard title={id ? 'Edit Asset Master' : 'Add Asset Master'} pageCode="M3520" secondary={
      <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/master/qmt/machine')}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={loading || saving}>Save Asset</Button>
      </Box>
    }>
      <Box sx={{ p: 1 }}>
        <Box sx={{
          width: '100%',
          mb: 2.5,
          position: 'sticky',
          top: 0,
          zIndex: 99,
          bgcolor: 'background.paper',
          pt: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,
              '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontSize: '0.9rem', fontWeight: 600 }
            }}
          >
            <Tab label="Asset Info" icon={<IconInfoCircle size={17} />} iconPosition="start" />
            <Tab label="Criterial Spares" icon={<IconListDetails size={17} />} iconPosition="start" />
            <Tab label="Integration POC" icon={<IconDatabase size={17} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* ── TAB 1: Asset Info ── */}
        <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
          
          <BOSFormSection icon={<IconInfoCircle size={22} color={theme.palette.primary.main} />} title="Primary Details" defaultOpen={true}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              <BOSTextField
                label="Asset ID"
                value={formData.assetId}
                onChange={handleChange('assetId')}
                error={!!errors.assetId}
                helperText={errors.assetId}
                required
                fullWidth
                sx={errorStyle(!!errors.assetId)}
                disabled={!!id}
              />
              <BOSTextField
                label="Asset Name"
                value={formData.assetName}
                onChange={handleChange('assetName')}
                error={!!errors.assetName}
                helperText={errors.assetName}
                required
                fullWidth
                sx={errorStyle(!!errors.assetName)}
              />
              <BOSTextField
                label="Asset Group"
                select
                value={formData.assetGroupId}
                onChange={handleChange('assetGroupId')}
                fullWidth
              >
                <MenuItem value="">Select Group</MenuItem>
                {assetGroups.map(g => <MenuItem key={g.id} value={g.id}>{g.groupName || g.name}</MenuItem>)}
              </BOSTextField>
              <BOSTextField
                label="Asset Type"
                select
                value={formData.assetTypeId}
                onChange={handleChange('assetTypeId')}
                fullWidth
              >
                <MenuItem value="">Select Type</MenuItem>
                {assetTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.typeName || t.name}</MenuItem>)}
              </BOSTextField>
              
              <BOSTextField
                label="Print Name"
                value={formData.printName}
                onChange={handleChange('printName')}
                fullWidth
              />
              <BOSTextField
                label="Division"
                value={formData.division}
                onChange={handleChange('division')}
                type="number"
                fullWidth
              />
              <BOSTextField
                label="UOM"
                value={formData.uom}
                onChange={handleChange('uom')}
                fullWidth
              />
              <BOSTextField
                label="Sequence No"
                value={formData.seqNo}
                onChange={handleChange('seqNo')}
                type="number"
                fullWidth
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <BOSTextField
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                fullWidth
                multiline
                rows={2}
              />
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconSettings size={22} color={theme.palette.secondary.main} />} title="Specification & Technical" defaultOpen={true}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              <BOSTextField label="Make" value={formData.make} onChange={handleChange('make')} fullWidth />
              <BOSTextField label="Model No" value={formData.modelNo} onChange={handleChange('modelNo')} fullWidth />
              <BOSTextField label="Serial No" value={formData.serialNo} onChange={handleChange('serialNo')} fullWidth />
              <BOSTextField label="Capacity" value={formData.capacity} onChange={handleChange('capacity')} fullWidth />
              <BOSTextField label="Dimension" value={formData.dimension} onChange={handleChange('dimension')} fullWidth />
              <BOSTextField label="Power" value={formData.power} onChange={handleChange('power')} fullWidth />
              <BOSTextField label="Asset Spec" value={formData.assetSpec} onChange={handleChange('assetSpec')} fullWidth />
              <BOSTextField label="IP Address" value={formData.ipAddress} onChange={handleChange('ipAddress')} fullWidth />
              <BOSTextField label="Port No" value={formData.portNo} onChange={handleChange('portNo')} type="number" fullWidth />
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconInfoCircle size={22} color={theme.palette.success.main} />} title="Purchase & Financial" defaultOpen={true}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              <BOSTextField
                label="Supplier"
                select
                value={formData.supplierId}
                onChange={handleChange('supplierId')}
                fullWidth
              >
                <MenuItem value="">Select Supplier</MenuItem>
                {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name || s.ledgerName}</MenuItem>)}
              </BOSTextField>
              <BOSTextField label="Supply Date" type="date" InputLabelProps={{ shrink: true }} value={formData.supplyDate} onChange={handleChange('supplyDate')} fullWidth />
              <BOSTextField label="Purchase Year" type="number" value={formData.purchaseYear} onChange={handleChange('purchaseYear')} fullWidth />
              <BOSTextField label="Purchase Rate" type="number" value={formData.purchaseRate} onChange={handleChange('purchaseRate')} fullWidth />
              <BOSTextField label="Price" type="number" value={formData.price} onChange={handleChange('price')} fullWidth />
              <BOSTextField label="HSN Code" value={formData.hsnCode} onChange={handleChange('hsnCode')} fullWidth />
              <BOSTextField label="SAC Code" value={formData.sacCode} onChange={handleChange('sacCode')} fullWidth />
              
              <BOSTextField select label="Warranty Available" value={formData.warrantyAvail ? 'YES' : 'NO'} onChange={(e) => handleChange('warrantyAvail')({ target: { value: e.target.value === 'YES' } })} fullWidth>
                <MenuItem value="YES">Yes</MenuItem>
                <MenuItem value="NO">No</MenuItem>
              </BOSTextField>
              
              {formData.warrantyAvail && (
                <BOSTextField label="Warranty Expiry" type="date" InputLabelProps={{ shrink: true }} value={formData.warrantyExpiryDate} onChange={handleChange('warrantyExpiryDate')} fullWidth />
              )}
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconInfoCircle size={22} color={theme.palette.warning.main} />} title="Calibration & Maintenance" defaultOpen={false}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <BOSTextField label="Calibration Frequency" value={formData.calibrFrequency} onChange={handleChange('calibrFrequency')} fullWidth />
              <BOSTextField label="Last Calibration Date" type="date" InputLabelProps={{ shrink: true }} value={formData.lastCalibrDate} onChange={handleChange('lastCalibrDate')} fullWidth />
              <BOSTextField label="Next Calibration Date" type="date" InputLabelProps={{ shrink: true }} value={formData.nextCalibrDate} onChange={handleChange('nextCalibrDate')} fullWidth />
              
              <BOSTextField label="AMC Frequency" value={formData.amcFrequency} onChange={handleChange('amcFrequency')} fullWidth />
              <BOSTextField label="Last AMC Date" type="date" InputLabelProps={{ shrink: true }} value={formData.lastAmcDate} onChange={handleChange('lastAmcDate')} fullWidth />
              <BOSTextField label="Next AMC Date" type="date" InputLabelProps={{ shrink: true }} value={formData.nextAmcDate} onChange={handleChange('nextAmcDate')} fullWidth />
              
              <BOSTextField label="Depreciation %" type="number" value={formData.depreciationPercentage} onChange={handleChange('depreciationPercentage')} fullWidth />
              <BOSTextField label="Depreciation Method" select value={formData.depreciationMethod} onChange={handleChange('depreciationMethod')} fullWidth>
                <MenuItem value="">None</MenuItem>
                <MenuItem value="SLM">Straight Line (SLM)</MenuItem>
                <MenuItem value="WDV">Written Down Value (WDV)</MenuItem>
              </BOSTextField>
              <BOSTextField label="Asset Life" value={formData.assetLife} onChange={handleChange('assetLife')} fullWidth />
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconInfoCircle size={22} />} title="Additional Details" defaultOpen={false}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <BOSTextField select label="OEE Required" value={formData.oeeReq ? 'YES' : 'NO'} onChange={(e) => handleChange('oeeReq')({ target: { value: e.target.value === 'YES' } })} fullWidth>
                <MenuItem value="YES">Yes</MenuItem>
                <MenuItem value="NO">No</MenuItem>
              </BOSTextField>
              <BOSStatusField value={formData.status} onChange={(val) => setFormData(prev => ({ ...prev, status: val }))} />
              
              <Box sx={{ gridColumn: '1 / -1' }}>
                <BOSTextField label="Remarks" value={formData.remarks} onChange={handleChange('remarks')} fullWidth multiline rows={2} />
              </Box>
            </Box>
          </BOSFormSection>

        </Box>

        {/* ── TAB 2: Criterial Spares ── */}
        <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
          <BOSFormSection icon={<IconListDetails size={22} />} title="Criterial Spares" defaultOpen={true}
            action={
              <Button variant="outlined" size="small" startIcon={<IconPlus size={16} />} onClick={handleAddSpareRow} sx={{ textTransform: 'none' }}>
                Add Row
              </Button>
            }
          >
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: '8px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Item Code *</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Item Name *</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.criterialSpares.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>No criterial spares added.</TableCell>
                    </TableRow>
                  ) : (
                    formData.criterialSpares.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell><SpareInput value={row.itemCode} onChange={(e) => handleSpareChange(idx, 'itemCode', e.target.value)} required /></TableCell>
                        <TableCell><SpareInput value={row.itemName} onChange={(e) => handleSpareChange(idx, 'itemName', e.target.value)} required /></TableCell>
                        <TableCell><SpareInput value={row.supplier} onChange={(e) => handleSpareChange(idx, 'supplier', e.target.value)} /></TableCell>
                        <TableCell><SpareInput type="number" value={row.rate} onChange={(e) => handleSpareChange(idx, 'rate', e.target.value)} /></TableCell>
                        <TableCell><SpareInput type="number" value={row.qty} onChange={(e) => handleSpareChange(idx, 'qty', e.target.value)} /></TableCell>
                        <TableCell><SpareInput value={row.uom} onChange={(e) => handleSpareChange(idx, 'uom', e.target.value)} /></TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <IconButton size="small" color="error" onClick={() => handleRemoveSpareRow(idx)}>
                            <IconTrash size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </BOSFormSection>
        </Box>

        {/* ── TAB 3: Integration POC ── */}
        <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
          <MachineIntegrationTab machineId={formData.id} machineCode={formData.assetId} />
        </Box>

      </Box>
    </MainCard>
  );
}
