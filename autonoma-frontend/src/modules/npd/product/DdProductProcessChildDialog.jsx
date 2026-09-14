import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Autocomplete,
  TextField as MuiTextField,
  Stack
} from '@mui/material';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import {
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  BOSStatusField,
  BOSAutocomplete,
  BOSFileUpload,
  btnNew,
  errorStyle
} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';

const GridContainer = ({ children, columns = { xs: 1, sm: 2, md: 4 } }) => {
  const templateColumns =
    typeof columns === 'object'
      ? { xs: `repeat(${columns.xs || 1}, 1fr)`, sm: `repeat(${columns.sm || 2}, 1fr)`, md: `repeat(${columns.md || 4}, 1fr)` }
      : `repeat(${columns}, 1fr)`;
  return <Box sx={{ display: 'grid', gridTemplateColumns: templateColumns, gap: 2.5 }}>{children}</Box>;
};

const R = ({ children, lg }) => {
  let gridColumn = 'span 1';
  if (lg === 12) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 4' };
  if (lg === 6) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  return <Box sx={{ gridColumn }}>{children}</Box>;
};

const INITIAL_PROCESS_STATE = {
  processCode: '',
  processName: '',
  flowImage: '',
  status: true,
  processWhere: 'INTERNAL',
  outputQty: '',
  outputUom: '',
  autoGrn: false,
  autoInspection: false,
  processOutputWeight: '',
  division: '',
  machines: [],
  tools: []
};

const VALIDATION_RULES = [
  { field: 'processCode', label: 'Process Code', required: true, maxLength: 50 },
  { field: 'processName', label: 'Process Name', required: true, maxLength: 150 }
];

export default function DdProductProcessChildDialog({ open, onClose, onSave, initialData }) {
  const dispatch = useDispatch();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_PROCESS_STATE);

  const [uoms, setUoms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [processMasterOptions, setProcessMasterOptions] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newToolName, setNewToolName] = useState('');

  useEffect(() => {
    if (open) {
      axios
        .get(API_PATHS.ADMIN.UOM)
        .then((res) => {
          const activeUoms = Array.from(new Set(res.data.filter((u) => u.status === 'ACTIVE').map((u) => u.uomCode)));
          setUoms(activeUoms);
        })
        .catch((err) => console.error(err));

      axios
        .get('/api/qmt/machine-categories')
        .then((res) => setCategories(res.data))
        .catch((err) => console.error(err));

      axios
        .get(API_PATHS.NPD.PROCESS)
        .then((res) => {
          const activeProcesses = res.data.filter(
            (p) => p.status === true || p.status === 1 || p.status === 'ACTIVE' || p.status === 'Active'
          );
          setProcessMasterOptions(activeProcesses);
        })
        .catch((err) => console.error(err));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      clearErrors();
      setSelectedCategory(null);
      setNewToolName('');
      if (initialData) {
        setFormData({ ...INITIAL_PROCESS_STATE, ...initialData });
      } else {
        setFormData(INITIAL_PROCESS_STATE);
      }
    }
  }, [open, initialData, clearErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMachine = () => {
    if (!selectedCategory) return;
    const exists = formData.machines.some((m) => m.machineCategoryId === selectedCategory.id);
    if (exists) {
      dispatch(openSnackbar({ open: true, message: 'This Machine Category is already added.', variant: 'alert', severity: 'warning' }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      machines: [...prev.machines, { machineCategoryId: selectedCategory.id, machineCategory: selectedCategory }]
    }));
    setSelectedCategory(null);
  };

  const handleRemoveMachine = (idx) => {
    setFormData((prev) => ({ ...prev, machines: prev.machines.filter((_, i) => i !== idx) }));
  };

  const handleAddTool = () => {
    if (!newToolName || !newToolName.trim()) return;
    const cleanToolName = newToolName.trim();
    const exists = formData.tools.some((t) => t.toolName.toLowerCase() === cleanToolName.toLowerCase());
    if (exists) {
      dispatch(openSnackbar({ open: true, message: 'This Tool Name is already added.', variant: 'alert', severity: 'warning' }));
      return;
    }
    setFormData((prev) => ({ ...prev, tools: [...prev.tools, { toolName: cleanToolName }] }));
    setNewToolName('');
  };

  const handleRemoveTool = (idx) => {
    setFormData((prev) => ({ ...prev, tools: prev.tools.filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    if (!validate(formData, VALIDATION_RULES)) return;
    onSave({
      ...formData,
      outputQty: formData.outputQty === '' ? null : Number(formData.outputQty),
      processOutputWeight: formData.processOutputWeight === '' ? null : Number(formData.processOutputWeight),
      division: formData.division === '' ? null : Number(formData.division)
    });
  };

  return (
    <BOSFormDialog open={open} onClose={onClose} onSave={handleSave} title={initialData ? 'Edit Process' : 'Add Process'} maxWidth="lg">
      <BOSFormSection title="Process Information">
        <GridContainer>
          <R>
            <BOSAutocomplete
              name="processName"
              label="Process Name"
              options={processMasterOptions}
              getOptionLabel={(option) => option.processName || option}
              value={processMasterOptions.find(opt => opt.processName === formData.processName) || formData.processName}
              onChange={(val) => {
                if (typeof val === 'object' && val !== null) {
                  setFormData((prev) => ({
                    ...prev,
                    processName: val.processName,
                    processCode: val.processCode || val.processCd || ''
                  }));
                } else {
                  setFormData((prev) => ({ ...prev, processName: val || '', processCode: '' }));
                }
              }}
              required
              error={!!errors.processName}
              helperText={errors.processName}
              sx={errorStyle(!!errors.processName)}
              placeholder="Select Process Name"
            />
          </R>
          <R>
            <BOSTextField
              name="processCode"
              label="Process Code"
              value={formData.processCode}
              onChange={handleChange}
              required
              maxLength={50}
              error={!!errors.processCode}
              helperText={errors.processCode}
              sx={errorStyle(!!errors.processCode)}
            />
          </R>
          <R>
            <BOSTextField select name="processWhere" label="Process Where" value={formData.processWhere} onChange={handleChange}>
              <option value="INTERNAL">INTERNAL</option>
              <option value="EXTERNAL">EXTERNAL</option>
              <option value="BOTH">BOTH</option>
            </BOSTextField>
          </R>
          <R>
            <BOSTextField
              name="outputQty"
              label="Output Qty"
              type="number"
              value={formData.outputQty}
              onChange={handleChange}
              inputProps={{ step: '0.001' }}
            />
          </R>
          <R>
            <BOSAutocomplete
              label="Output UOM"
              options={uoms}
              value={formData.outputUom}
              onChange={(val) => setFormData((prev) => ({ ...prev, outputUom: val || '' }))}
              placeholder="Select UOM"
            />
          </R>
          <R>
            <BOSTextField
              select
              name="autoGrn"
              label="Auto GRN"
              value={formData.autoGrn ? 'true' : 'false'}
              onChange={(e) => handleCheckboxChange('autoGrn', e.target.value === 'true')}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </BOSTextField>
          </R>
          <R>
            <BOSTextField
              select
              name="autoInspection"
              label="Auto Inspection"
              value={formData.autoInspection ? 'true' : 'false'}
              onChange={(e) => handleCheckboxChange('autoInspection', e.target.value === 'true')}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </BOSTextField>
          </R>
          <R>
            <BOSTextField
              name="processOutputWeight"
              label="Process Output Weight"
              type="number"
              value={formData.processOutputWeight}
              onChange={handleChange}
              inputProps={{ step: '0.001' }}
            />
          </R>
          <R>
            <BOSTextField name="division" label="Division" type="number" value={formData.division} onChange={handleChange} />
          </R>
          <R>
            <BOSStatusField
              isCreate={!initialData}
              type="boolean"
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleChange}
            />
          </R>
          <R lg={6}>
            <Box sx={{ maxWidth: 300, pl: 2 }}>
              <BOSFileUpload
                compact
                files={formData.flowImage ? [{ fileName: 'Flow Image', path: formData.flowImage }] : []}
                onChange={(files) => {
                  const path = files.length > 0 ? files[0].path || files[0].fileName : '';
                  setFormData((prev) => ({ ...prev, flowImage: path }));
                }}
                module="NPD_PROCESS"
                label="Flow Image"
                multiple={false}
                accept="image/*"
              />
            </Box>
          </R>
        </GridContainer>
      </BOSFormSection>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5, mt: 2.5 }}>
        <BOSFormSection title="Machine Mapping" key={`machine-sec-${open}`}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Autocomplete
            value={selectedCategory}
            onChange={(_, val) => setSelectedCategory(val)}
            options={categories}
            getOptionLabel={(option) => option.category_name || ''}
            sx={{ width: 300 }}
            renderInput={(params) => <MuiTextField {...params} label="Select Machine Category" variant="outlined" size="small" />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="No categories found"
          />
          <Button variant="contained" startIcon={<IconPlus size={16} />} onClick={handleAddMachine} sx={btnNew}>
            Add
          </Button>
        </Stack>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', minHeight: '150px' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Category Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '100px', textAlign: 'center' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.machines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                    No machines mapped yet.
                  </TableCell>
                </TableRow>
              ) : (
                formData.machines.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {row.machineCategory?.category_name || categories.find((c) => c.id == row.machineCategoryId)?.category_name || ''}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton size="small" color="error" onClick={() => handleRemoveMachine(idx)}>
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

      <BOSFormSection title="Tools" key={`tools-sec-${open}`}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <MuiTextField
            label="Tool Name"
            variant="outlined"
            size="small"
            value={newToolName}
            onChange={(e) => setNewToolName(e.target.value)}
            sx={{ width: 300 }}
          />
          <Button variant="contained" startIcon={<IconPlus size={16} />} onClick={handleAddTool} sx={btnNew}>
            Add
          </Button>
        </Stack>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', minHeight: '150px' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Tool Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '100px', textAlign: 'center' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.tools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                    No tools added yet.
                  </TableCell>
                </TableRow>
              ) : (
                formData.tools.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.toolName}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton size="small" color="error" onClick={() => handleRemoveTool(idx)}>
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
    </BOSFormDialog>
  );
}
