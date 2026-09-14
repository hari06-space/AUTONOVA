import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  MenuItem,
  useTheme,
  IconButton,
  Box,
  Typography,
  Switch,
  FormControl,
  FormLabel,
  FormControlLabel
} from '@mui/material';
import { IconClipboardCheck, IconPlus, IconTrash } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSDatePicker, BOSStatusField, BOSToggleSwitch } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';

const INITIAL_STATE = {
  effectFrom: new Date().toISOString().split('T')[0],
  status: 'ACTIVE',
  details: []
};

export default function AddEbSlabDialog({ open, handleClose, initialData, readOnly = false }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        const fetchDetails = async () => {
          try {
            const response = await axios.get(`/api/master/qms/eb-slab/${initialData.id}`);
            const data = response.data;
            setFormData({
              id: data.id,
              effectFrom: data.effectFrom || new Date().toISOString().split('T')[0],
              status: data.status || 'ACTIVE',
              details: (data.details || []).sort((a, b) => a.seqNo - b.seqNo)
            });
            setIsEditing(false);
          } catch (error) {
            console.error('Failed to load slab details:', error);
            dispatch(
              openSnackbar({
                open: true,
                message: 'Failed to load slab details.',
                variant: 'alert',
                severity: 'error',
                close: false
              })
            );
          }
        };
        fetchDetails();
      } else {
        setFormData({
          effectFrom: new Date().toISOString().split('T')[0],
          status: 'ACTIVE',
          details: [
            {
              seqNo: 1,
              fromUnit: 0,
              toUnit: 0,
              price: 0.0,
              isActive: true
            }
          ]
        });
        setIsEditing(!readOnly);
      }
    }
  }, [initialData, open, readOnly, dispatch]);

  const handleEffectFromChange = (e) => {
    setFormData((prev) => ({ ...prev, effectFrom: e.target.value }));
  };

  const handleRowChange = (index, field, value) => {
    const updatedDetails = [...formData.details];
    const row = { ...updatedDetails[index] };

    if (value === '') {
      row[field] = '';
    } else if (field === 'price') {
      row[field] = value;
    } else {
      const parsed = parseInt(value, 10);
      row[field] = isNaN(parsed) ? '' : parsed;
    }

    updatedDetails[index] = row;

    // Dynamically adjust subsequent rows' fromUnit
    if (field === 'toUnit') {
      let currentToUnit = parseInt(value, 10) || 0;
      for (let i = index + 1; i < updatedDetails.length; i++) {
        updatedDetails[i] = {
          ...updatedDetails[i],
          fromUnit: currentToUnit + 1
        };
        currentToUnit = parseInt(updatedDetails[i].toUnit, 10) || 0;
      }
    }

    setFormData((prev) => ({ ...prev, details: updatedDetails }));
  };

  const handleAddRow = () => {
    const details = formData.details;
    const lastRow = details[details.length - 1];
    const newSeqNo = details.length + 1;
    const newFromUnit = lastRow ? (parseInt(lastRow.toUnit, 10) || 0) + 1 : 0;

    const newRow = {
      seqNo: newSeqNo,
      fromUnit: newFromUnit,
      toUnit: 0,
      price: 0.0,
      isActive: true
    };

    setFormData((prev) => ({
      ...prev,
      details: [...prev.details, newRow]
    }));
  };

  const handleDeleteRow = (index) => {
    let updatedDetails = formData.details.filter((_, idx) => idx !== index);

    // Re-sequence and adjust fromUnit
    let currentToUnit = 0;
    updatedDetails = updatedDetails.map((row, idx) => {
      const fromUnit = idx === 0 ? 0 : currentToUnit + 1;
      currentToUnit = row.toUnit;
      return {
        ...row,
        seqNo: idx + 1,
        fromUnit
      };
    });

    setFormData((prev) => ({ ...prev, details: updatedDetails }));
  };

  const handleKeyDown = (index, field, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'toUnit') {
        const nextEl = document.getElementById(`price-input-${index}`);
        if (nextEl) nextEl.focus();
      } else if (field === 'price') {
        if (index + 1 < formData.details.length) {
          const nextEl = document.getElementById(`to-unit-input-${index + 1}`);
          if (nextEl) nextEl.focus();
        } else {
          handleAddRow();
          setTimeout(() => {
            const nextEl = document.getElementById(`to-unit-input-${index + 1}`);
            if (nextEl) nextEl.focus();
          }, 100);
        }
      }
    }
  };

  const handleClear = () => {
    setFormData({
      effectFrom: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      details: [
        {
          seqNo: 1,
          fromUnit: 0,
          toUnit: 0,
          price: 0.0,
          isActive: true
        }
      ]
    });
  };

  const handleSave = async () => {
    if (!formData.effectFrom) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Effect From date is required.',
          variant: 'alert',
          severity: 'warning',
          close: false
        })
      );
      return;
    }

    if (formData.details.length === 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please add at least one slab detail row.',
          variant: 'alert',
          severity: 'warning',
          close: false
        })
      );
      return;
    }

    // Check for negative numbers, zero values, or invalid unit sequences
    for (let i = 0; i < formData.details.length; i++) {
      const row = formData.details[i];
      const priceVal = parseFloat(row.price);
      const toUnitVal = parseInt(row.toUnit, 10);
      
      const isPriceInvalid = row.price === '' || row.price === undefined || row.price === null || isNaN(priceVal) || priceVal <= 0;
      const isToUnitInvalid = row.toUnit === '' || row.toUnit === undefined || row.toUnit === null || isNaN(toUnitVal) || toUnitVal <= 0;

      if (isPriceInvalid && isToUnitInvalid) {
        dispatch(
          openSnackbar({
            open: true,
            message: `Price and To Unit must be greater than 0 in row ${i + 1}.`,
            variant: 'alert',
            severity: 'error',
            close: false
          })
        );
        return;
      } else if (isPriceInvalid) {
        dispatch(
          openSnackbar({
            open: true,
            message: `Price must be greater than 0 in row ${i + 1}.`,
            variant: 'alert',
            severity: 'error',
            close: false
          })
        );
        return;
      } else if (isToUnitInvalid) {
        dispatch(
          openSnackbar({
            open: true,
            message: `To Unit must be greater than 0 in row ${i + 1}.`,
            variant: 'alert',
            severity: 'error',
            close: false
          })
        );
        return;
      }

      const fromUnitVal = parseInt(row.fromUnit, 10);
      if (toUnitVal <= fromUnitVal) {
        dispatch(
          openSnackbar({
            open: true,
            message: `To Unit must be greater than From Unit in row ${i + 1}.`,
            variant: 'alert',
            severity: 'error',
            close: false
          })
        );
        return;
      }
    }

    const payload = {
      ...formData,
      status: formData.status
    };

    try {
      if (formData.id) {
        await axios.put(`/api/master/qms/eb-slab/${formData.id}`, payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Slab configuration updated successfully!',
            variant: 'alert',
            severity: 'success',
            close: false
          })
        );
      } else {
        await axios.post('/api/master/qms/eb-slab', payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Slab configuration created successfully!',
            variant: 'alert',
            severity: 'success',
            close: false
          })
        );
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save slab:', error);
      const errorMsg = error.response?.data || 'Failed to save slab configuration.';
      dispatch(
        openSnackbar({
          open: true,
          message: typeof errorMsg === 'string' ? errorMsg : 'Failed to save slab configuration.',
          variant: 'alert',
          severity: 'error',
          close: false
        })
      );
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`/api/master/qms/eb-slab/${formData.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Slab configuration deleted!',
          variant: 'alert',
          severity: 'success',
          close: false
        })
      );
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete slab:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete slab configuration.',
          variant: 'alert',
          severity: 'error',
          close: false
        })
      );
    }
  };

  const isViewOnly = readOnly && !isEditing;

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={() => handleClose()}
        onSave={handleSave}
        onDelete={initialData ? () => setDeleteOpen(true) : null}
        onClear={handleClear}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? 'Edit EB Slab Details' : 'EB Slab Details'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
      >
        <BOSFormSection icon={<IconClipboardCheck size={20} color={theme.palette.primary.main} />} title="EB Slab Details">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 3 }}>
            <BOSDatePicker
              name="effectFrom"
              label="Effect From"
              value={formData.effectFrom}
              onChange={handleEffectFromChange}
              disabled={isViewOnly}
              required
              disablePast={false}
              inputProps={{ id: 'effect-from-input' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const firstRowToUnit = document.getElementById('to-unit-input-0');
                  if (firstRowToUnit) firstRowToUnit.focus();
                }
              }}
            />
            <BOSStatusField
              isCreate={!formData.id}
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              disabled={isViewOnly}
              type="string-upper"
              label="Status"
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderTop: '1px solid #e0e0e0', pt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Slab Ranges & Prices
            </Typography>
            <IconButton 
              onClick={handleAddRow} 
              size="small" 
              disabled={isViewOnly}
              sx={{ color: theme.palette.primary.main }}
            >
              <IconPlus size={20} style={{ strokeWidth: 3 }} />
            </IconButton>
          </Box>

          <Box>
            {formData.details.length === 0 ? (
              <Typography variant="body1" align="center" sx={{ py: 3, fontStyle: 'italic', color: 'text.secondary' }}>
                No records found.
              </Typography>
            ) : (
              formData.details.map((row, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '30px 1fr 1fr 1fr 40px' }, 
                    gap: 3, 
                    alignItems: 'center', 
                    mb: 2 
                  }}
                >
                  <Typography variant="subtitle1" align="center" sx={{ fontWeight: 'bold' }}>
                    {row.seqNo}
                  </Typography>

                  <BOSTextField
                    type="number"
                    label="From Unit"
                    value={row.fromUnit}
                    disabled
                    InputProps={{ readOnly: true, sx: { '& input': { textAlign: 'right' } } }}
                  />

                  <BOSTextField
                    type="number"
                    label="To Unit"
                    value={row.toUnit}
                    onChange={(e) => handleRowChange(index, 'toUnit', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    disabled={isViewOnly}
                    inputProps={{ id: `to-unit-input-${index}`, style: { textAlign: 'right' } }}
                    onKeyDown={(e) => handleKeyDown(index, 'toUnit', e)}
                  />

                  <BOSTextField
                    type="number"
                    label="Price"
                    value={row.price}
                    onChange={(e) => handleRowChange(index, 'price', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    disabled={isViewOnly}
                    inputProps={{ id: `price-input-${index}`, style: { textAlign: 'right' } }}
                    onKeyDown={(e) => handleKeyDown(index, 'price', e)}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <IconButton 
                      onClick={() => handleDeleteRow(index)} 
                      size="small" 
                      color="error"
                      disabled={isViewOnly}
                    >
                      <IconTrash size={20} />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Slab Details"
        message="Are you sure you want to delete this Slab configuration? This action cannot be undone."
        itemName={formData.effectFrom}
      />
    </>
  );
}

AddEbSlabDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};
