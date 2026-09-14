import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Typography,
  CardActions,
  Divider
} from '@mui/material';
import { IconPlus, IconTrash, IconDeviceFloppy, IconArrowLeft, IconEdit } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSFormSection, BOSAutocomplete, BOSTextField, btnNew, btnSave, errorStyle } from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import DdProductProcessChildDialog from './DdProductProcessChildDialog';

const INITIAL_MASTER_STATE = {
  productId: '',
  partNo: '',
  processes: []
};

const VALIDATION_RULES = [{ field: 'productId', label: 'Part No (Product)', required: true }];

export default function DdProductProcessForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams(); // id is productId here
  const isEdit = Boolean(id);
  const { errors, validate } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_MASTER_STATE);
  const [productMasterOptions, setProductMasterOptions] = useState([]);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcessIndex, setEditingProcessIndex] = useState(null);

  useEffect(() => {
    // Fetch Product Master (Lightweight)
    axios
      .get('/api/master/npd/product-master/list')
      .then((res) => {
        setProductMasterOptions(res.data);
      })
      .catch((err) => console.error('Failed to fetch Product Master:', err));
  }, []);

  const loadProcessesForProduct = useCallback((productId) => {
    axios.get(`/api/dd/product-process/by-product/${productId}`)
      .then((res) => {
        setFormData((prev) => ({
          ...prev,
          productId: Number(productId),
          processes: res.data || []
        }));
      })
      .catch((err) => {
        console.error(err);
        dispatch(openSnackbar({
          open: true,
          message: 'Failed to fetch process details.',
          variant: 'alert',
          severity: 'error'
        }));
      });
  }, [dispatch]);

  useEffect(() => {
    if (isEdit && id) {
      loadProcessesForProduct(id);
    }
  }, [id, isEdit, loadProcessesForProduct]);

  // Handle changing Product ID
  const handleProductChange = (val) => {
    const newProductId = val?.id || '';
    setFormData((prev) => ({
      ...prev,
      productId: newProductId,
      partNo: val ? `${val.itemNo} - ${val.itemName}` : '',
      processes: [] // reset on new product
    }));

    if (newProductId && !isEdit) {
      // Fetch if they select an existing part in create mode to avoid overwriting blindly
      loadProcessesForProduct(newProductId);
    }
  };

  const handleOpenAddProcess = () => {
    setEditingProcessIndex(null);
    setDialogOpen(true);
  };

  const handleOpenEditProcess = (index) => {
    setEditingProcessIndex(index);
    setDialogOpen(true);
  };

  const handleRemoveProcess = (idx) => {
    setFormData((prev) => ({
      ...prev,
      processes: prev.processes.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveProcessChild = (processData) => {
    setFormData((prev) => {
      const newProcesses = [...prev.processes];
      if (editingProcessIndex !== null) {
        newProcesses[editingProcessIndex] = processData;
      } else {
        newProcesses.push(processData);
      }
      return { ...prev, processes: newProcesses };
    });
    setDialogOpen(false);
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    if (formData.processes.length === 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please add at least one process.',
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    try {
      const payload = {
        productId: formData.productId,
        processes: formData.processes
      };

      await axios.post('/api/dd/product-process/bulk-save', payload);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Product Processes saved successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );
      navigate('/dd/product-process');
    } catch (err) {
      console.error(err);
      dispatch(
        openSnackbar({
          open: true,
          message: err.response?.data || 'Failed to save product processes.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  return (
    <MainCard
      title={isEdit ? 'Edit Product Process Mapping' : 'New Product Process Mapping'}
      secondary={
        <Button variant="outlined" startIcon={<IconArrowLeft size={16} />} onClick={() => navigate('/dd/product-process')}>
          Back to List
        </Button>
      }
    >
      <Box sx={{ p: 2 }}>
        <BOSFormSection title="Master Information">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
            <Box>
              <BOSAutocomplete
                name="productId"
                label="Part No (Product)"
                options={productMasterOptions}
                getOptionLabel={(option) => option.itemNo || option.partNo || option}
                value={productMasterOptions.find((p) => p.id === formData.productId) || null}
                onChange={handleProductChange}
                required
                disabled={isEdit}
                error={!!errors.productId}
                helperText={errors.productId}
                sx={errorStyle(!!errors.productId)}
                placeholder="Select Part No"
              />
            </Box>
            <Box>
              <BOSTextField
                label="Part Name"
                value={productMasterOptions.find((p) => p.id === formData.productId)?.itemName || ''}
                disabled
              />
            </Box>
            <Box>
              <BOSTextField
                label="Item Category"
                value={productMasterOptions.find((p) => p.id === formData.productId)?.itemCategory || ''}
                disabled
              />
            </Box>
            <Box>
              <BOSTextField
                label="Drawing No"
                value={productMasterOptions.find((p) => p.id === formData.productId)?.drawingNo || ''}
                disabled
              />
            </Box>
          </Box>
        </BOSFormSection>

        <BOSFormSection 
          title="Mapped Processes"
          action={
            <Button
              variant="contained"
              startIcon={<IconPlus size={16} />}
              onClick={handleOpenAddProcess}
              sx={btnNew}
              disabled={!formData.productId}
            >
              Add Process
            </Button>
          }
        >
          {!formData.productId && (
            <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
              Please select a Part No first.
            </Typography>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', minHeight: '300px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Process Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Process Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Where</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Output Qty</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Machines</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tools</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '120px', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.processes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No processes added yet. Click "Add Process" to map a process to this part.
                    </TableCell>
                  </TableRow>
                ) : (
                  formData.processes.map((row, idx) => (
                    <TableRow 
                      key={idx}
                      onDoubleClick={() => handleOpenEditProcess(idx)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <TableCell>{row.processCode}</TableCell>
                      <TableCell>{row.processName}</TableCell>
                      <TableCell>{row.processWhere}</TableCell>
                      <TableCell>
                        {row.outputQty} {row.outputUom}
                      </TableCell>
                      <TableCell>{row.machines?.length || 0}</TableCell>
                      <TableCell>{row.tools?.length || 0}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton size="small" color="primary" onClick={() => handleOpenEditProcess(idx)}>
                          <IconEdit size={16} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleRemoveProcess(idx)}>
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

      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button variant="contained" startIcon={<IconDeviceFloppy size={18} />} onClick={handleSave} sx={btnSave}>
          Save
        </Button>
      </CardActions>

      {/* Child Dialog for adding/editing a process */}
      <DdProductProcessChildDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveProcessChild}
        initialData={editingProcessIndex !== null ? formData.processes[editingProcessIndex] : null}
      />
    </MainCard>
  );
}
