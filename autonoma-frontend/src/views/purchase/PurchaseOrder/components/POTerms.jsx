import React, { useState, useMemo } from 'react';
import { Grid, Typography, Box, IconButton, Collapse, Paper, useTheme, Button, Menu, MenuItem } from '@mui/material';
import { BOSTextField } from 'ui-component/bos';
import { IconChevronDown, IconChevronUp, IconPlus, IconTrash } from '@tabler/icons-react';

const AVAILABLE_TERMS = [
    { key: 'shippingTerms', label: 'Shipping Terms', isTopLevel: true },
    { key: 'warrantyTerms', label: 'Warranty Terms', isTopLevel: true },
    { key: 'penaltyTerms', label: 'Penalty Terms' },
    { key: 'qualityRequirements', label: 'Quality Requirements' },
    { key: 'inspectionTerms', label: 'Inspection Terms' },
    { key: 'returnTerms', label: 'Return Terms' },
    { key: 'cancellationTerms', label: 'Cancellation Terms' },
    { key: 'specialConditions', label: 'Special Conditions' },
];

export default function POTerms({ formData, setFormData, isReadOnly }) {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);

    const parsedInternalNotes = useMemo(() => {
        try {
            return JSON.parse(formData?.internalNotes || '{}');
        } catch (e) {
            return {};
        }
    }, [formData?.internalNotes]);

    const getTermValue = (term) => {
        if (term.isTopLevel) {
            return formData?.[term.key] || '';
        }
        return parsedInternalNotes[term.key] || '';
    };

    const handleTermChange = (term, value) => {
        if (term.isTopLevel) {
            setFormData(f => ({ ...f, [term.key]: value?.target?.value ?? value }));
        } else {
            const val = value?.target?.value ?? value;
            const updatedNotes = { ...parsedInternalNotes, [term.key]: val };
            if (formData?.internalNotes && !formData.internalNotes.startsWith('{')) {
                updatedNotes['legacy_notes'] = formData.internalNotes;
            }
            setFormData(f => ({ ...f, internalNotes: JSON.stringify(updatedNotes) }));
        }
    };

    const removeTerm = (term) => {
        if (term.isTopLevel) {
            setFormData(f => ({ ...f, [term.key]: '' }));
        } else {
            const updatedNotes = { ...parsedInternalNotes };
            delete updatedNotes[term.key];
            setFormData(f => ({ ...f, internalNotes: JSON.stringify(updatedNotes) }));
        }
    };

    // Determine which terms are "active" (either have a value, or we forcefully activated them)
    // Actually, if they have a value, they are active. When "added", we can just initialize their value to ' ' or handle an activeTerms state.
    // Let's use local state for active keys that are empty but added by user.
    const [addedKeys, setAddedKeys] = useState([]);

    const activeTerms = AVAILABLE_TERMS.filter(term => getTermValue(term) || addedKeys.includes(term.key));
    const availableToAdd = AVAILABLE_TERMS.filter(term => !activeTerms.includes(term));

    const handleAddClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleAddClose = (key) => {
        setAnchorEl(null);
        if (key) {
            setAddedKeys(prev => [...prev, key]);
        }
    };

    return (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center"
                sx={{ cursor: 'pointer', mb: expanded ? 2 : 0 }}>
                <Box display="flex" alignItems="center" gap={2} onClick={() => setExpanded(!expanded)} sx={{ flexGrow: 1 }}>
                    <Typography variant="overline" color="primary" fontWeight={700}>
                        COMMERCIAL & SPECIAL TERMS
                    </Typography>
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        {expanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                    </IconButton>
                </Box>

                {expanded && !isReadOnly && availableToAdd.length > 0 && (
                    <Box>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<IconPlus size={16} />}
                            onClick={handleAddClick}
                        >
                            Add Term
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => handleAddClose(null)}
                        >
                            {availableToAdd.map(term => (
                                <MenuItem key={term.key} onClick={() => handleAddClose(term.key)}>
                                    {term.label}
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                )}
            </Box>

            <Collapse in={expanded}>
                <Grid container spacing={1} sx={{ width: '100%' }}>
                    {activeTerms.length === 0 && (
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', p: 1 }}>
                                No commercial terms added. Click 'Add Term' to include shipping, warranty, penalty terms etc.
                            </Typography>
                        </Grid>
                    )}

                    {activeTerms.map(term => (
                        <Grid item xs={12} sm={6} md={4} key={term.key} sx={{ width: { xs: '100%', md: '24%' } }}>
                            <Box sx={{ position: 'relative' }}>
                                <BOSTextField
                                    fullWidth
                                    label={term.label}
                                    multiline
                                    rows={3}
                                    value={getTermValue(term)}
                                    onChange={e => handleTermChange(term, e)}
                                    disabled={isReadOnly}
                                    disableRichText
                                    sx={{ '& textarea': { resize: 'both !important' } }}
                                />
                                {!isReadOnly && (
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                            removeTerm(term);
                                            setAddedKeys(prev => prev.filter(k => k !== term.key));
                                        }}
                                        sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.light', color: 'white' } }}
                                    >
                                        <IconTrash size={14} />
                                    </IconButton>
                                )}
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Collapse>
        </Paper>
    );
}
