import React, { useState, useEffect } from 'react';
import { Box, Button, Stack, MenuItem } from '@mui/material';
import { IconDeviceFloppy, IconArrowLeft } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { useNavigate, useParams } from 'react-router-dom';
import MainCard from 'ui-component/cards/MainCard';
import { BOSFormSection, BOSTextField } from 'ui-component/bos';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';

export default function QuotationFollowUpEntry() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [formData, setFormData] = useState({
    quotationId: '',
    customerId: '',
    partId: '',
    followUpDate: new Date().toISOString().split('T')[0],
    followMode: 'Phone',
    followType: '',
    comments: '',
    attachmentPath: '',
    status: true
  });

  useEffect(() => {
    // Fetch quotations for the dropdown
    axios.get('/api/sm/quotation')
      .then(res => setQuotations(res.data || []))
      .catch(err => console.error('Failed to fetch quotations:', err));

    if (isEdit) {
      setLoading(true);
      axios.get(`/api/sm/quotation-follow-up/${id}`)
        .then(res => {
          const data = res.data;
          setFormData({
            ...data,
            followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString().split('T')[0] : ''
          });
        })
        .catch(err => {
          console.error('Failed to fetch follow up:', err);
          dispatch(openSnackbar({ open: true, message: 'Failed to load data.', variant: 'alert', severity: 'error' }));
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, dispatch]);

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSave = async () => {
    if (!formData.quotationId || !formData.followUpDate || !formData.followMode) {
      dispatch(openSnackbar({ open: true, message: 'Please fill all mandatory fields.', variant: 'alert', severity: 'error' }));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate) : null
      };

      if (isEdit) {
        await axios.put(`/api/sm/quotation-follow-up/${id}`, payload);
      } else {
        await axios.post('/api/sm/quotation-follow-up', payload);
      }

      dispatch(openSnackbar({ open: true, message: 'Saved successfully!', variant: 'alert', severity: 'success' }));
      navigate('/sm/quotation-follow-up');
    } catch (err) {
      console.error('Save failed:', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to save.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useKeyboardShortcuts({
    'ctrl+s': handleSave,
    'alt+left': () => navigate('/sm/quotation-follow-up')
  });

  return (
    <MainCard
      title={isEdit ? 'Edit Quotation Follow Up' : 'New Quotation Follow Up'}
      secondary={
        <Button variant="outlined" startIcon={<IconArrowLeft />} onClick={() => navigate('/sm/quotation-follow-up')}>
          Back
        </Button>
      }
    >
      <Box sx={{ p: 2 }}>
        <BOSFormSection title="Follow Up Details">
          <BOSTextField
            select
            label="Quotation No"
            required
            value={formData.quotationId}
            onChange={handleChange('quotationId')}
          >
            {quotations.map(q => (
              <MenuItem key={q.id} value={q.id}>{q.quotationNo}</MenuItem>
            ))}
          </BOSTextField>

          <BOSTextField
            type="date"
            label="Follow Up Date"
            required
            value={formData.followUpDate}
            onChange={handleChange('followUpDate')}
            InputLabelProps={{ shrink: true }}
          />

          <BOSTextField
            select
            label="Follow Up Mode"
            required
            value={formData.followMode}
            onChange={handleChange('followMode')}
          >
            <MenuItem value="Phone">Phone</MenuItem>
            <MenuItem value="Email">Email</MenuItem>
            <MenuItem value="WhatsApp">WhatsApp</MenuItem>
            <MenuItem value="In Person">In Person</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </BOSTextField>

          <BOSTextField
            label="Follow Up Type"
            value={formData.followType}
            onChange={handleChange('followType')}
          />

          <BOSTextField
            label="Comments"
            value={formData.comments}
            onChange={handleChange('comments')}
            multiline
            rows={3}
            sx={{ gridColumn: '1 / -1' }}
          />
        </BOSFormSection>

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate('/sm/quotation-follow-up')}>Cancel</Button>
          <Button variant="contained" startIcon={<IconDeviceFloppy />} onClick={handleSave} disabled={loading}>
            Save
          </Button>
        </Stack>
      </Box>
    </MainCard>
  );
}
