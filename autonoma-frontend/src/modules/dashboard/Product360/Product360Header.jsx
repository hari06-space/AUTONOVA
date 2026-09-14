import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Autocomplete,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Avatar
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconSearch,
  IconRefresh,
  IconBuildingFactory2,
  IconChartDots3,
  IconCamera
} from '@tabler/icons-react';
import PageUserManual from 'ui-component/bos/PageUserManual';

export default function Product360Header({
  products = [],
  selectedProduct,
  onProductChange,
  onSearch,
  onOpenVisualSearch,
  divisions = [],
  selectedDivision,
  onDivisionChange,
  onRefresh,
  loading = false
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        p: 1.25,
        mb: 1.8,
        borderRadius: 4,
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {/* ── LEFT: PR-STYLE AVATAR + TITLE + SOP MANUAL ── */}
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar
          sx={{
            bgcolor: isDark ? theme.palette.primary.dark : theme.palette.primary.main,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main || '#7b1fa2'} 100%)`,
            color: '#fff',
            width: 44,
            height: 44,
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
          }}
        >
          <IconChartDots3 size={24} stroke={2.2} />
        </Avatar>

        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="h3"
              fontWeight="800"
              sx={{
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main || '#7b1fa2'})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                lineHeight: 1.2
              }}
            >
              Product 360 Dashboard
            </Typography>
            <PageUserManual pageCode="DB1500" />
          </Box>
          <Typography variant="subtitle2" color="text.secondary" fontWeight="500" sx={{ fontSize: '0.75rem', mt: 0.2 }}>
            Real-Time Product 360 & Inventory / Production Intelligence
          </Typography>
        </Box>
      </Box>

      {/* ── RIGHT: SEARCH PRODUCT + DIVISION SELECTOR + REFRESH ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.2, flexGrow: { xs: 1, md: 'initial' }, justifyContent: 'flex-end' }}>
        {/* Search Product Autocomplete + Lens Camera Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, width: { xs: '100%', sm: 'auto' } }}>
          <Autocomplete
            size="small"
            options={products}
            value={selectedProduct}
            onChange={(e, val) => onProductChange(val)}
            onInputChange={(e, newInputValue, reason) => {
              if (reason === 'input' && onSearch) {
                onSearch(newInputValue);
              }
            }}
            getOptionLabel={(opt) => (opt ? `${opt.itemNo || ''} - ${opt.itemName || ''}` : '')}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options;
              const term = inputValue.toLowerCase().trim();
              return options.filter(
                (opt) =>
                  (opt.itemNo && opt.itemNo.toLowerCase().includes(term)) ||
                  (opt.itemName && opt.itemName.toLowerCase().includes(term)) ||
                  (opt.itemCategory && opt.itemCategory.toLowerCase().includes(term)) ||
                  (opt.drawingNo && opt.drawingNo.toLowerCase().includes(term)) ||
                  (opt.partNoOld && opt.partNoOld.toLowerCase().includes(term))
              );
            }}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', py: 0.5 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {option.itemNo}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {option.itemName}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 600, bgcolor: 'action.hover', px: 1, py: 0.2, borderRadius: 1 }}>
                  {option.itemCategory || 'PRODUCT'}
                </Typography>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search Product by Code, Name, Barcode..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={16} style={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    height: 38,
                    fontSize: '0.82rem',
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
                  }
                }}
              />
            )}
            sx={{ width: { xs: '100%', sm: 280, md: 320 } }}
          />

          {/* Visual Camera Lens Search Button */}
          <Tooltip title="Search by Image (Lens AI)" arrow enterDelay={150}>
            <IconButton
              type="button"
              onClick={onOpenVisualSearch}
              sx={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)',
                color: '#3b82f6',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(59,130,246,0.28)' : 'rgba(59,130,246,0.18)',
                  borderColor: '#3b82f6',
                  transform: 'scale(1.05)'
                }
              }}
            >
              <IconCamera size={20} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Division Selector */}
        <FormControl size="small" sx={{ width: { xs: '100%', sm: 160 } }}>
          <Select
            value={selectedDivision || ''}
            onChange={(e) => onDivisionChange(e.target.value ? Number(e.target.value) : null)}
            displayEmpty
            startAdornment={
              <InputAdornment position="start">
                <IconBuildingFactory2 size={16} style={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            }
            sx={{
              height: 38,
              fontSize: '0.82rem',
              borderRadius: '8px',
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
            }}
          >
            <MenuItem value="" sx={{ fontSize: '0.82rem' }}>
              <em>All Divisions</em>
            </MenuItem>
            {divisions.map((d) => (
              <MenuItem key={d.divisionId || d.id} value={d.divisionId || d.id} sx={{ fontSize: '0.82rem' }}>
                {d.divisionName || d.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Refresh Button */}
        <Tooltip title="Refresh Real-time Data">
          <IconButton
            onClick={onRefresh}
            disabled={loading}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              height: 38,
              width: 38,
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            {loading ? <CircularProgress size={16} color="primary" /> : <IconRefresh size={18} />}
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
}
