import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPendingReviews, resolveReviewItem } from '../store/slices/reviewSlice';
import { partsService } from '../api/services';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, CircularProgress, Autocomplete, Tabs, Tab, Box, Alert
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';

export default function ReviewQueuePage() {
  const dispatch = useDispatch();
  const { pendingItems, loading, resolving } = useSelector((state) => state.review);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Existing part selection
  const [masterParts, setMasterParts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState(null);

  // New part form
  const [newPart, setNewPart] = useState({ partCode: '', partName: '', unitPrice: '', description: '' });
  const [notes, setNotes] = useState('');

  useEffect(() => { dispatch(fetchPendingReviews()); }, [dispatch]);

  const handleOpenResolve = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
    setTabIndex(0);
    setSelectedPart(null);
    setNewPart({ partCode: '', partName: '', unitPrice: '', description: '' });
    setNotes('');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const res = await partsService.search(query);
        setMasterParts(res.data);
      } catch { setMasterParts([]); }
    }
  };

  const handleResolve = () => {
    const data = { reviewItemId: selectedItem.id, notes };

    if (tabIndex === 0 && selectedPart) {
      data.masterPartId = selectedPart.id;
    } else if (tabIndex === 1) {
      data.newPart = { ...newPart, unitPrice: parseFloat(newPart.unitPrice) || 0 };
    } else return;

    dispatch(resolveReviewItem(data));
    setDialogOpen(false);
  };

  const confidenceColor = (c) => {
    if (c >= 0.8) return 'success';
    if (c >= 0.5) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Box className="page-header" sx={{ flexShrink: 0, mb: 3 }}>
        <h1 className="page-header__title">Review Queue</h1>
        <p className="page-header__subtitle">
          Resolve unknown part codes from customer emails
          {pendingItems.length > 0 && (
            <Chip label={`${pendingItems.length} pending`} size="small" color="warning"
                  sx={{ ml: 2, fontWeight: 700 }} />
          )}
        </p>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
        {loading ? (
          <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : pendingItems.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
            <AutoFixHighRoundedIcon sx={{ fontSize: 64, mb: 2 }} />
            <p style={{ fontSize: '1.1rem' }}>All caught up! No pending reviews.</p>
          </Box>
        ) : (
          pendingItems.map((item, idx) => (
            <div className="review-card animate-in" key={item.id} style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="review-card__header">
                <div>
                  <span className="review-card__code">{item.unknownPartCode}</span>
                  <span style={{ marginLeft: 12, color: '#9AA0B0', fontSize: '0.85rem' }}>
                    Qty: {item.requestedQuantity || 'N/A'}
                  </span>
                </div>
                <Chip
                  label={`${Math.round((item.aiConfidence || 0) * 100)}% confidence`}
                  size="small"
                  color={confidenceColor(item.aiConfidence)}
                  variant="outlined"
                />
              </div>

              <div style={{ fontSize: '0.85rem', color: '#9AA0B0', marginBottom: 12 }}>
                <strong>Email:</strong> {item.emailSubject} — from {item.emailFrom}
              </div>

              {item.surroundingContext && (
                <div className="review-card__context">
                  "{item.surroundingContext}"
                </div>
              )}

              {item.aiSuggestedPartCode && (
                <div className="review-card__ai-suggestion">
                  <AutoFixHighRoundedIcon sx={{ color: '#00D9A6' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      AI Suggests: {item.aiSuggestedPartCode} — {item.aiSuggestedPartName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9AA0B0' }}>{item.aiReasoning}</div>
                  </div>
                </div>
              )}

              <div className="review-card__actions">
                <Button variant="contained" size="small" onClick={() => handleOpenResolve(item)}>
                  Resolve Mapping
                </Button>
              </div>
            </div>
          ))
        )}
      </Box>

      {/* Resolve Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
              PaperProps={{ sx: { bgcolor: '#161D30', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Resolve: <span style={{ color: '#6C63FF' }}>{selectedItem?.unknownPartCode}</span>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 2 }}>
            <Tab icon={<SearchRoundedIcon />} label="Map to Existing" iconPosition="start" />
            <Tab icon={<AddCircleRoundedIcon />} label="Create New Part" iconPosition="start" />
          </Tabs>

          {tabIndex === 0 && (
            <Autocomplete
              options={masterParts}
              getOptionLabel={(opt) => `${opt.partCode} — ${opt.partName}`}
              value={selectedPart}
              onChange={(_, val) => setSelectedPart(val)}
              onInputChange={(_, val) => handleSearch(val)}
              renderInput={(params) => (
                <TextField {...params} label="Search master parts" placeholder="Type to search..." fullWidth />
              )}
              sx={{ mt: 1 }}
            />
          )}

          {tabIndex === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Part Code" value={newPart.partCode}
                         onChange={(e) => setNewPart({ ...newPart, partCode: e.target.value })} fullWidth required />
              <TextField label="Part Name" value={newPart.partName}
                         onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })} fullWidth required />
              <TextField label="Unit Price" type="number" value={newPart.unitPrice}
                         onChange={(e) => setNewPart({ ...newPart, unitPrice: e.target.value })} fullWidth />
              <TextField label="Description" multiline rows={2} value={newPart.description}
                         onChange={(e) => setNewPart({ ...newPart, description: e.target.value })} fullWidth />
            </Box>
          )}

          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                     fullWidth multiline rows={2} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleResolve} disabled={resolving}>
            {resolving ? <CircularProgress size={20} /> : 'Confirm Mapping'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
