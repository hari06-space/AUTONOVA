import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Autocomplete,
  useTheme,
  Card,
  CardContent,
  Divider,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
  IconListDetails,
  IconTools,
  IconShield,
  IconUsers,
  IconSettings,
  IconPackage,
  IconMicrophone,
  IconMicrophoneOff
} from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import {
  BOSFormSection,
  BOSTextField,
  BOSAutocomplete,
  btnSave,
  btnCancel,
  btnClear,
  btnEdit,
  btnNew
} from 'ui-component/bos';

const GridContainer = ({ children, columns = { xs: 1, sm: 2, md: 4 } }) => {
  const templateColumns = typeof columns === 'object'
    ? { xs: `repeat(${columns.xs || 1}, 1fr)`, sm: `repeat(${columns.sm || 2}, 1fr)`, md: `repeat(${columns.md || 4}, 1fr)` }
    : `repeat(${columns}, 1fr)`;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: templateColumns, gap: 2.5 }}>
      {children}
    </Box>
  );
};

const R = ({ children, lg }) => {
  let gridColumn = 'span 1';
  if (lg === 6) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 8) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 12) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 3' };
  return <Box sx={{ gridColumn }}>{children}</Box>;
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`packing-tabpanel-${index}`}
      aria-labelledby={`packing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function PackingProcedureForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const theme = useTheme();

  // Selected tab
  const [tabValue, setTabValue] = useState(0);

  // Main header form data
  const [processType, setProcessType] = useState(null);
  const [partNo, setPartNo] = useState(null);
  const [docNo, setDocNo] = useState('');
  const [revNo, setRevNo] = useState(0);
  const [revDate, setRevDate] = useState(new Date().toLocaleDateString());
  const [approvalStatus, setApprovalStatus] = useState('CREATED');

  // Master lists
  const [processes, setProcesses] = useState([]);
  const [mappedParts, setMappedParts] = useState([]);
  const [bomDetails, setBomDetails] = useState([]);
  
  const [consumableMaster, setConsumableMaster] = useState([]);
  const [toolMaster, setToolMaster] = useState([]);
  const [safetyMaster, setSafetyMaster] = useState([]);
  const [departmentMaster, setDepartmentMaster] = useState([]);
  const [designationMaster, setDesignationMaster] = useState([]);

  // Child grids
  const [consumables, setConsumables] = useState([]);
  const [tools, setTools] = useState([]);
  const [safetyEquipment, setSafetyEquipment] = useState([]);
  const [manpower, setManpower] = useState([]);
  const [steps, setSteps] = useState([]);

  // Right-hand Panel - Step editing states
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [stepNo, setStepNo] = useState(1);
  const [spendingMinutes, setSpendingMinutes] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [procedureDescription, setProcedureDescription] = useState('');

  const { isListening, interimText, toggleListening } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setProcedureDescription((prev) => (prev ? prev + ' ' : '') + finalText);
    }
  });

  // Fetch initial configuration & masters
  useEffect(() => {
    // 1. Fetch Process Master (and filter where processProcedureRequired === true)
    axios.get('/api/master/npd/process')
      .then(res => {
        setProcesses(res.data.filter(p => p.processProcedureRequired === true && p.status === true));
      })
      .catch(err => console.error('Failed to fetch processes:', err));

    // 2. Fetch Consumables (products from ProductMaster where inventoryType = 'CONSUMABLE')
    axios.get('/api/master/npd/product-master')
      .then(res => {
        setConsumableMaster(res.data.filter(p => p.inventoryType === 'CONSUMABLE' || p.itemGroup === 'CONSUMABLES'));
      })
      .catch(err => console.error('Failed to fetch consumables master:', err));

    // 3. Fetch Tools & Safety Gear from AssetMaster
    axios.get('/api/master/assets?group=Tool')
      .then(res => setToolMaster(res.data))
      .catch(err => console.error('Failed to fetch tools:', err));

    axios.get('/api/master/assets?group=Safety Equipment')
      .then(res => setSafetyMaster(res.data))
      .catch(err => console.error('Failed to fetch safety equipment:', err));

    // 4. Fetch Departments & Designations
    axios.get('/api/master/hr/departments/active')
      .then(res => setDepartmentMaster(res.data))
      .catch(err => console.error('Failed to fetch departments:', err));

    axios.get('/api/master/hr/designations')
      .then(res => setDesignationMaster(res.data))
      .catch(err => console.error('Failed to fetch designations:', err));

    if (isEdit) {
      fetchProcedureDetails(id);
    }
  }, [id, isEdit]);

  // Fetch existing procedure details on edit mode
  const fetchProcedureDetails = async (procedureId) => {
    try {
      const res = await axios.get(`/api/dd/packing-procedures/${procedureId}`);
      if (res && res.data) {
        const data = res.data;
        setDocNo(data.docNo);
        setRevNo(data.revNo);
        setRevDate(data.revDate ? new Date(data.revDate).toLocaleDateString() : '');
        setApprovalStatus(data.approvalStatus);

        // Map process
        setProcessType({ id: data.processId, processName: data.processName });
        // Map product
        setPartNo({ id: data.productId, itemNo: data.partNo, itemName: data.partName });

        // Map child grids
        setConsumables(data.consumables.map(c => ({
          id: c.id,
          product: consumableMaster.find(p => p.id === c.productId) || { id: c.productId, itemNo: c.itemNo, itemName: c.itemName, uom: c.uom },
          qty: c.qty
        })));

        setTools(data.tools.map(t => ({
          id: t.id,
          asset: toolMaster.find(a => a.id === t.assetId) || { id: t.assetId, assetNo: t.assetNo, assetName: t.assetName, assetSubtype: t.uom },
          qty: t.qty
        })));

        setSafetyEquipment(data.safetyEquipment.map(s => ({
          id: s.id,
          asset: safetyMaster.find(a => a.id === s.assetId) || { id: s.assetId, assetNo: s.assetNo, assetName: s.assetName, assetSubtype: s.uom },
          qty: s.qty
        })));

        setManpower(data.manpower.map(m => ({
          id: m.id,
          department: departmentMaster.find(d => d.id === m.departmentId) || { id: m.departmentId, departmentName: m.departmentName },
          designation: designationMaster.find(d => d.id === m.designationId) || { id: m.designationId, designationName: m.designationName },
          qty: m.qty
        })));

        setSteps(data.steps.map(s => ({
          id: s.id,
          stepNo: s.stepNo,
          spendingMinutes: s.spendingMinutes,
          requiredItems: s.requiredItems ? JSON.parse(s.requiredItems) : [],
          procedureDescription: s.procedureDescription
        })));
      }
    } catch (err) {
      console.error('Failed to fetch packing procedure details:', err);
    }
  };

  // Fetch mapped products when process changes
  useEffect(() => {
    if (processType && !isEdit) {
      axios.get(`/api/dd/packing-procedures/process-mappings/${processType.id}`)
        .then(res => {
          setMappedParts(res.data);
          setPartNo(null);
          setBomDetails([]);
        })
        .catch(err => console.error('Failed to fetch mapped products:', err));
    }
  }, [processType, isEdit]);

  // Fetch BOM Details when part changes
  useEffect(() => {
    if (partNo) {
      axios.get(`/api/master/npd/bom/product/${partNo.id}`)
        .then(res => {
          if (res.data && res.data.details) {
            setBomDetails(res.data.details.map(d => ({
              partNo: d.inputProduct?.itemNo,
              partName: d.inputProduct?.itemName
            })));
          } else {
            setBomDetails([]);
          }
        })
        .catch(err => {
          console.log('No active BOM found for product:', partNo.itemNo);
          setBomDetails([]);
        });
    } else {
      setBomDetails([]);
    }
  }, [partNo]);

  // Auto-increment step no
  useEffect(() => {
    if (editingStepIndex === null) {
      setStepNo(steps.length + 1);
    }
  }, [steps, editingStepIndex]);

  // Collect all available items populated in grids for Right Panel step select options
  const availableGridItems = useMemo(() => {
    const items = [];
    
    // Add BOM Details
    bomDetails.forEach(b => {
      items.push({ id: b.partNo, label: `[BOM] ${b.partNo} - ${b.partName}` });
    });

    // Add Consumables
    consumables.forEach(c => {
      if (c.product) {
        items.push({ id: c.product.itemNo, label: `[Consumable] ${c.product.itemNo} - ${c.product.itemName}` });
      }
    });

    // Add Tools
    tools.forEach(t => {
      if (t.asset) {
        items.push({ id: t.asset.assetNo, label: `[Tool] ${t.asset.assetNo} - ${t.asset.assetName}` });
      }
    });

    // Add Safety
    safetyEquipment.forEach(s => {
      if (s.asset) {
        items.push({ id: s.asset.assetNo, label: `[Safety] ${s.asset.assetNo} - ${s.asset.assetName}` });
      }
    });

    return items;
  }, [bomDetails, consumables, tools, safetyEquipment]);

  // --- GRID EDIT HELPER HANDLERS ---

  // Consumables Grid
  const handleAddConsumableRow = () => {
    setConsumables([...consumables, { product: null, qty: 1 }]);
  };
  const handleRemoveConsumableRow = (index) => {
    setConsumables(consumables.filter((_, i) => i !== index));
  };
  const handleConsumableRowChange = (index, field, value) => {
    const updated = [...consumables];
    updated[index][field] = value;
    setConsumables(updated);
  };

  // Tools Grid
  const handleAddToolRow = () => {
    setTools([...tools, { asset: null, qty: 1 }]);
  };
  const handleRemoveToolRow = (index) => {
    setTools(tools.filter((_, i) => i !== index));
  };
  const handleToolRowChange = (index, field, value) => {
    const updated = [...tools];
    updated[index][field] = value;
    setTools(updated);
  };

  // Safety Grid
  const handleAddSafetyRow = () => {
    setSafetyEquipment([...safetyEquipment, { asset: null, qty: 1 }]);
  };
  const handleRemoveSafetyRow = (index) => {
    setSafetyEquipment(safetyEquipment.filter((_, i) => i !== index));
  };
  const handleSafetyRowChange = (index, field, value) => {
    const updated = [...safetyEquipment];
    updated[index][field] = value;
    setSafetyEquipment(updated);
  };

  // Manpower Grid
  const handleAddManpowerRow = () => {
    setManpower([...manpower, { department: null, designation: null, qty: 1 }]);
  };
  const handleRemoveManpowerRow = (index) => {
    setManpower(manpower.filter((_, i) => i !== index));
  };
  const handleManpowerRowChange = (index, field, value) => {
    const updated = [...manpower];
    updated[index][field] = value;
    setManpower(updated);
  };

  // --- STEP BUILDER HANDLERS ---

  const handleAddStep = () => {
    if (!procedureDescription.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Step description is required', variant: 'alert', severity: 'warning' }));
      return;
    }

    const newStep = {
      stepNo: stepNo,
      spendingMinutes: parseInt(spendingMinutes) || 0,
      requiredItems: selectedItems,
      procedureDescription: procedureDescription
    };

    if (editingStepIndex !== null) {
      const updatedSteps = [...steps];
      updatedSteps[editingStepIndex] = newStep;
      setSteps(updatedSteps);
      setEditingStepIndex(null);
    } else {
      setSteps([...steps, newStep]);
    }

    // Reset step entry panel
    setSpendingMinutes(0);
    setSelectedItems([]);
    setProcedureDescription('');
  };

  const handleEditStep = (index) => {
    const step = steps[index];
    setEditingStepIndex(index);
    setStepNo(step.stepNo);
    setSpendingMinutes(step.spendingMinutes);
    setSelectedItems(step.requiredItems || []);
    setProcedureDescription(step.procedureDescription);
  };

  const handleRemoveStep = (index) => {
    const filtered = steps.filter((_, i) => i !== index);
    // Recalculate step numbers sequentially
    const reordered = filtered.map((s, idx) => ({ ...s, stepNo: idx + 1 }));
    setSteps(reordered);
    if (editingStepIndex === index) {
      setEditingStepIndex(null);
      setSpendingMinutes(0);
      setSelectedItems([]);
      setProcedureDescription('');
    }
  };

  // --- SUBMIT SAVE & AMEND ---

  const handleSave = async () => {
    if (!processType) {
      dispatch(openSnackbar({ open: true, message: 'Process Type is required', variant: 'alert', severity: 'warning' }));
      return;
    }
    if (!partNo) {
      dispatch(openSnackbar({ open: true, message: 'Part No is required', variant: 'alert', severity: 'warning' }));
      return;
    }
    if (steps.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'At least one procedure step is required', variant: 'alert', severity: 'warning' }));
      return;
    }

    // Prepare child collections payload
    const consumablePayload = consumables
      .filter(c => c.product)
      .map(c => ({ productId: c.product.id, qty: c.qty }));

    const toolPayload = tools
      .filter(t => t.asset)
      .map(t => ({ assetId: t.asset.id, qty: t.qty }));

    const safetyPayload = safetyEquipment
      .filter(s => s.asset)
      .map(s => ({ assetId: s.asset.id, qty: s.qty }));

    const manpowerPayload = manpower
      .filter(m => m.department && m.designation)
      .map(m => ({
        departmentId: m.department.id,
        designationId: m.designation.id,
        qty: m.qty
      }));

    const stepPayload = steps.map(s => ({
      stepNo: s.stepNo,
      spendingMinutes: s.spendingMinutes,
      requiredItems: JSON.stringify(s.requiredItems),
      procedureDescription: s.procedureDescription
    }));

    const payload = {
      processId: processType.id,
      productId: partNo.id,
      docNo: docNo,
      consumables: consumablePayload,
      tools: toolPayload,
      safetyEquipment: safetyPayload,
      manpower: manpowerPayload,
      steps: stepPayload
    };

    try {
      if (isEdit) {
        await axios.put(`/api/dd/packing-procedures/${id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Packing Procedure amendment saved successfully!', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post('/api/dd/packing-procedures', payload);
        dispatch(openSnackbar({ open: true, message: 'Packing Procedure created successfully!', variant: 'alert', severity: 'success' }));
      }
      navigate('/dd/packing-procedure');
    } catch (error) {
      console.error('Failed to save packing procedure:', error);
      const errMsg = error.message || 'Failed to save packing procedure.';
      dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
    }
  };

  const handleClear = () => {
    if (!isEdit) {
      setProcessType(null);
      setPartNo(null);
      setDocNo('');
    }
    setConsumables([]);
    setTools([]);
    setSafetyEquipment([]);
    setManpower([]);
    setSteps([]);
  };

  return (
    <MainCard
      stretch={false}
      contentSX={{ p: 3 }}
      sx={{
        mx: { xs: -2, sm: -3 },
        width: { xs: 'calc(100% + 32px)', sm: 'calc(100% + 48px)' },
        borderRadius: 0
      }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconPackage size={24} color="#1e88e5" />
          <Typography variant="h3">
            {isEdit ? `Amend Packing Procedure: ${docNo} (Rev ${revNo})` : 'New Packing Procedure'}
          </Typography>
        </Stack>
      }
      secondary={
        <Button variant="contained" startIcon={<IconArrowLeft />} onClick={() => navigate('/dd/packing-procedure')} sx={btnCancel}>
          Back
        </Button>
      }
    >
        <BOSFormSection title="Header Information">
          <GridContainer>
            <R>
              <BOSAutocomplete
                label="Process Type"
                options={processes}
                getOptionLabel={(option) => option ? option.processName : ''}
                value={processType}
                onChange={(val) => setProcessType(val)}
                disabled={isEdit}
                required
              />
            </R>
            <R>
              <BOSAutocomplete
                label="Part No"
                options={isEdit ? [partNo] : mappedParts}
                getOptionLabel={(option) => option ? `${option.itemNo} - ${option.itemName}` : ''}
                value={partNo}
                onChange={(val) => setPartNo(val)}
                disabled={isEdit || !processType}
                required
              />
            </R>
            <R>
              <BOSTextField
                label="Part Name"
                value={partNo ? partNo.itemName : ''}
                disabled
              />
            </R>
            <R>
              <BOSTextField
                label="Approval Status"
                value={approvalStatus}
                disabled
              />
            </R>
            {isEdit && (
              <R>
                <BOSTextField
                  label="Doc No"
                  value={docNo}
                  disabled
                />
              </R>
            )}
            <R>
              <BOSTextField
                label="Revision No"
                value={revNo}
                disabled
              />
            </R>
            <R>
              <BOSTextField
                label="Revision Date"
                value={revDate}
                disabled
              />
            </R>
          </GridContainer>
        </BOSFormSection>
        <Box sx={{ mb: 3 }} />

      {/* 2. Workspace Body Split Panel */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr', lg: '8fr 4fr' }, gap: 3, width: '100%', alignItems: 'stretch' }}>
        {/* Left/Center Panel - Tabs */}
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(_, val) => setTabValue(val)}
              variant="scrollable"
              scrollButtons={false}
              aria-label="Procedure details tabs"
              sx={{
                minHeight: 48,
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 1.5,
                '& .MuiTabs-flexContainer': {
                  gap: 1.5
                },
                '& .MuiTabs-indicator': {
                  display: 'none'
                }
              }}
            >
              {[
                { value: 0, label: 'BOM Details', icon: <IconListDetails size={18} /> },
                { value: 1, label: 'Consumables', icon: <IconPackage size={18} /> },
                { value: 2, label: 'Tools', icon: <IconTools size={18} /> },
                { value: 3, label: 'Safety Equipment', icon: <IconShield size={18} /> },
                { value: 4, label: 'Manpower', icon: <IconUsers size={18} /> }
              ].map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                  sx={{
                    minHeight: 40,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    px: 2.5,
                    py: 1,
                    color: 'text.secondary',
                    border: '1px solid transparent',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-selected': {
                      color: '#ffffff',
                      bgcolor: 'primary.main',
                      borderColor: 'primary.main',
                      boxShadow: `0 4px 14px ${theme.palette.primary.light}80`,
                      transform: 'scale(1.03) translateY(-1px)'
                    },
                    '&:hover:not(.Mui-selected)': {
                      bgcolor: 'action.hover',
                      color: 'primary.main',
                      borderColor: 'divider',
                      transform: 'translateY(-1px)'
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {/* TAB 0: BOM Details (Read-only) */}
          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme.palette.primary.light }}>
                  <TableRow>
                    <TableCell width={80}>Sl No</TableCell>
                    <TableCell>Part No</TableCell>
                    <TableCell>Part Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bomDetails.length > 0 ? (
                    bomDetails.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{row.partNo}</TableCell>
                        <TableCell>{row.partName}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                          No records found. Select a Part No to load BOM details.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* TAB 1: Consumables */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary" startIcon={<IconPlus size={16} />} onClick={handleAddConsumableRow} sx={btnNew}>
                Add
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme.palette.primary.light }}>
                  <TableRow>
                    <TableCell width={80}>Sl No</TableCell>
                    <TableCell width="40%">Item No / Name</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell width={150}>Qty</TableCell>
                    <TableCell align="center" width={80}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consumables.length > 0 ? (
                    consumables.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Autocomplete
                            options={consumableMaster}
                            getOptionLabel={(option) => option ? `${option.itemNo} - ${option.itemName}` : ''}
                            value={row.product}
                            onChange={(_, val) => {
                              handleConsumableRowChange(idx, 'product', val);
                            }}
                            renderInput={(params) => <TextField {...params} variant="standard" fullWidth />}
                          />
                        </TableCell>
                        <TableCell>{row.product ? row.product.uom : ''}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            variant="standard"
                            value={row.qty}
                            onChange={(e) => handleConsumableRowChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton color="error" onClick={() => handleRemoveConsumableRow(idx)}>
                            <IconTrash size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                          No records found. Click "Add" to configure.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* TAB 2: Tools */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary" startIcon={<IconPlus size={16} />} onClick={handleAddToolRow} sx={btnNew}>
                Add
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme.palette.primary.light }}>
                  <TableRow>
                    <TableCell width={80}>Sl No</TableCell>
                    <TableCell width="40%">Tool No / Name</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell width={150}>Qty</TableCell>
                    <TableCell align="center" width={80}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tools.length > 0 ? (
                    tools.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Autocomplete
                            options={toolMaster}
                            getOptionLabel={(option) => option ? `${option.assetNo} - ${option.assetName}` : ''}
                            value={row.asset}
                            onChange={(_, val) => handleToolRowChange(idx, 'asset', val)}
                            renderInput={(params) => <TextField {...params} variant="standard" fullWidth />}
                          />
                        </TableCell>
                        <TableCell>{row.asset ? row.asset.assetSubtype : ''}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            variant="standard"
                            value={row.qty}
                            onChange={(e) => handleToolRowChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton color="error" onClick={() => handleRemoveToolRow(idx)}>
                            <IconTrash size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                          No records found. Click "Add" to configure.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* TAB 3: Safety Equipment */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary" startIcon={<IconPlus size={16} />} onClick={handleAddSafetyRow} sx={btnNew}>
                Add
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme.palette.primary.light }}>
                  <TableRow>
                    <TableCell width={80}>Sl No</TableCell>
                    <TableCell width="40%">Item No / Name</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell width={150}>Qty</TableCell>
                    <TableCell align="center" width={80}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safetyEquipment.length > 0 ? (
                    safetyEquipment.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Autocomplete
                            options={safetyMaster}
                            getOptionLabel={(option) => option ? `${option.assetNo} - ${option.assetName}` : ''}
                            value={row.asset}
                            onChange={(_, val) => handleSafetyRowChange(idx, 'asset', val)}
                            renderInput={(params) => <TextField {...params} variant="standard" fullWidth />}
                          />
                        </TableCell>
                        <TableCell>{row.asset ? row.asset.assetSubtype : ''}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            variant="standard"
                            value={row.qty}
                            onChange={(e) => handleSafetyRowChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton color="error" onClick={() => handleRemoveSafetyRow(idx)}>
                            <IconTrash size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                          No records found. Click "Add" to configure.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* TAB 4: Manpower */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" color="primary" startIcon={<IconPlus size={16} />} onClick={handleAddManpowerRow} sx={btnNew}>
                Add
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme.palette.primary.light }}>
                  <TableRow>
                    <TableCell width={80}>Sl No</TableCell>
                    <TableCell width="35%">Department</TableCell>
                    <TableCell width="35%">Designation</TableCell>
                    <TableCell width={120}>Qty</TableCell>
                    <TableCell align="center" width={80}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {manpower.length > 0 ? (
                    manpower.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Autocomplete
                            options={departmentMaster}
                            getOptionLabel={(option) => option.departmentName || ''}
                            value={row.department}
                            onChange={(_, val) => handleManpowerRowChange(idx, 'department', val)}
                            renderInput={(params) => <TextField {...params} variant="standard" fullWidth />}
                          />
                        </TableCell>
                        <TableCell>
                          <Autocomplete
                            options={designationMaster}
                            getOptionLabel={(option) => option.designationName || ''}
                            value={row.designation}
                            onChange={(_, val) => handleManpowerRowChange(idx, 'designation', val)}
                            renderInput={(params) => <TextField {...params} variant="standard" fullWidth />}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            variant="standard"
                            value={row.qty}
                            onChange={(e) => handleManpowerRowChange(idx, 'qty', parseInt(e.target.value) || 0)}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton color="error" onClick={() => handleRemoveManpowerRow(idx)}>
                            <IconTrash size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                          No manpower records found. Resources must be mapped by Department/Designation.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Box>

        {/* Right Panel - Fixed Procedure Sequencing Panel */}
        <Box sx={{ minWidth: 0 }}>
          <Card variant="outlined" sx={{ borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconSettings size={20} /> Procedure Builder
              </Typography>
              <Divider sx={{ my: 1.5 }} />

              {/* Step Editor Input fields */}
              <Stack spacing={2} sx={{ mb: 3 }}>
                <GridContainer columns={2}>
                  <BOSTextField
                    label="Step No"
                    type="number"
                    value={stepNo}
                    disabled
                  />
                  <BOSTextField
                    label="Spending Minutes"
                    type="number"
                    value={spendingMinutes}
                    onChange={(e) => setSpendingMinutes(parseInt(e.target.value) || 0)}
                  />
                </GridContainer>

                <BOSAutocomplete
                  multiple
                  label="Required Items (linked from grids)"
                  options={availableGridItems}
                  getOptionLabel={(option) => option ? option.label : ''}
                  value={selectedItems}
                  onChange={(val) => setSelectedItems(val)}
                  placeholder="Select items"
                />

                <BOSTextField
                  label="Procedure Description"
                  multiline
                  minRows={3}
                  value={isListening && interimText ? (procedureDescription || '') + ' ' + interimText : procedureDescription || ''}
                  onChange={(e) => setProcedureDescription(e.target.value)}
                  placeholder="Enter detailed instruction for floor operator... (or use mic 🎤)"
                  required
                  sx={{ position: 'relative' }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end" sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isListening && <VoiceWaveform />}
                          <IconButton
                            color={isListening ? 'error' : 'primary'}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleListening();
                            }}
                            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                            sx={{
                              animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                              '@keyframes micPulse': {
                                '0%': { transform: 'scale(1)', opacity: 1 },
                                '50%': { transform: 'scale(1.2)', opacity: 0.55 },
                                '100%': { transform: 'scale(1)', opacity: 1 },
                              }
                            }}
                          >
                            {isListening ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
                          </IconButton>
                        </Box>
                      </InputAdornment>
                    )
                  }}
                />

                <Button variant="contained" startIcon={<IconPlus />} onClick={handleAddStep} sx={btnEdit(theme)}>
                  {editingStepIndex !== null ? 'Update' : 'Add'}
                </Button>
              </Stack>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="h6" gutterBottom color="textSecondary">
                Step Sequence List
              </Typography>

              {/* Sequential Steps List */}
              <Stack spacing={1.5} sx={{ maxHeight: 350, overflowY: 'auto', pr: 0.5 }}>
                {steps.length > 0 ? (
                  steps.map((step, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: editingStepIndex === idx ? 'primary.main' : 'divider',
                        bgcolor: editingStepIndex === idx ? 'primary.light' : 'background.paper',
                        boxShadow: '0px 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" color="primary">
                          Step #{step.stepNo} — {step.spendingMinutes} min
                        </Typography>
                        <Box>
                          <Button size="small" variant="text" onClick={() => handleEditStep(idx)} sx={{ minWidth: 'auto', p: 0.5 }}>
                            Edit
                          </Button>
                          <Button size="small" variant="text" color="error" onClick={() => handleRemoveStep(idx)} sx={{ minWidth: 'auto', p: 0.5 }}>
                            Remove
                          </Button>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                        {step.procedureDescription}
                      </Typography>
                      {step.requiredItems && step.requiredItems.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {step.requiredItems.map((item, i) => (
                            <Box
                              key={i}
                              sx={{
                                px: 1,
                                py: 0.2,
                                borderRadius: 10,
                                bgcolor: theme.palette.grey[200],
                                fontSize: '0.75rem',
                                color: 'text.secondary'
                              }}
                            >
                              {item.id}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                    No steps added yet. Add steps using the builder above.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 3. Sticky Action Bar */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="contained" onClick={handleClear} sx={btnClear}>
          Clear Form
        </Button>
        <Button variant="contained" startIcon={<IconDeviceFloppy />} onClick={handleSave} sx={btnSave}>
          {isEdit ? 'Save Amendment' : 'Create Procedure'}
        </Button>
      </Box>
    </MainCard>
  );
}
