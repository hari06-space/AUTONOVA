import React from 'react';
import { Box, TextField, InputAdornment, MenuItem, Switch, FormControlLabel, Button, useTheme, Typography, Tooltip } from '@mui/material';
import { IconSearch, IconRefresh } from '@tabler/icons-react';

/**
 * Props:
 *  - searchTerm, onSearchChange
 *  - supplierFilter, onSupplierFilterChange, suppliers[]
 *  - showVariationsOnly, onShowVariationsChange
 *  - onRefresh
 */
export default function ComparisonFilterBar({
    searchTerm,
    onSearchChange,
    supplierFilter,
    onSupplierFilterChange,
    suppliers = [],
    showVariationsOnly,
    onShowVariationsChange,
    onRefresh
}) {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 1,
                flexWrap: 'wrap'
            }}
        >
            {/* Search */}
            <TextField
                size="small"
                placeholder="Search item code / description..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                sx={{ minWidth: 240, flex: 1 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconSearch size={16} color={theme.palette.text.secondary} />
                        </InputAdornment>
                    )
                }}
            />

            {/* Supplier Filter */}
            <TextField
                select
                size="small"
                label="All Suppliers"
                value={supplierFilter}
                onChange={(e) => onSupplierFilterChange(e.target.value)}
                sx={{ minWidth: 180 }}
            >
                <MenuItem value="ALL">All Suppliers</MenuItem>
                {suppliers.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
            </TextField>

            {/* Show Variations Only */}
            <Tooltip title="Show Only Variations">
                <FormControlLabel
                    control={
                        <Switch
                            size="small"
                            checked={showVariationsOnly}
                            onChange={(e) => onShowVariationsChange(e.target.checked)}
                            color="primary"
                        />
                    }

                    sx={{ ml: 1 }}
                />
            </Tooltip>

            {/* Refresh */}
            <Button
                variant="outlined"
                size="small"
                startIcon={<IconRefresh size={14} />}
                onClick={onRefresh}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
                Refresh
            </Button>
        </Box>
    );
}
