import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconUser,
  IconSitemap,
  IconRoute,
  IconBuildingWarehouse,
  IconShoppingCart,
  IconHelpCircle,
  IconStarFilled,
  IconDotsVertical,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconPhoto,
  IconZoomIn
} from '@tabler/icons-react';
import { getCompanyImageUrl, getFileViewUrl } from 'utils/upload-helper';

export default function ProductSummaryCard({ header = {}, onActionClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = useState(null);
  const [companyLogo, setCompanyLogo] = useState('');
  const [imgErrorLevel, setImgErrorLevel] = useState(0); // 0: product image, 1: company logo, 2: default logo/svg

  // Hover Popover State
  const [hoverAnchorEl, setHoverAnchorEl] = useState(null);

  // Gallery Dialog State
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Fetch company logo on mount
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      try {
        const token = sessionStorage.getItem('serviceToken') || '';
        const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_API_URL || window.location.origin).replace(/\/+$/, '');
        const res = await fetch(`${API_BASE}/api/company-profile/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && data[0].logoFileName) {
            setCompanyLogo(getCompanyImageUrl(data[0].logoFileName));
          }
        }
      } catch (err) {
        console.warn('Could not load company logo:', err);
      }
    };
    fetchCompanyLogo();
  }, []);

  // Reset image error level when product changes
  useEffect(() => {
    setImgErrorLevel(0);
    setActiveImgIndex(0);
  }, [header.productCode, header.imagePath]);

  const handleNav = (action) => {
    if (onActionClick) {
      onActionClick(action);
    }
  };

  const btnStyle = {
    height: 32,
    fontSize: '0.73rem',
    fontWeight: 600,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    borderRadius: '6px',
    borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#bfdbfe',
    color: isDark ? '#93c5fd' : '#1d4ed8',
    bgcolor: isDark ? 'rgba(29, 78, 216, 0.08)' : '#f8fbff',
    px: 1.2,
    py: 0.4,
    '&:hover': {
      bgcolor: isDark ? 'rgba(29, 78, 216, 0.2)' : '#e0f2fe',
      borderColor: '#3b82f6'
    }
  };

  // Compile list of all images for gallery
  const rawImages = header.images && header.images.length > 0
    ? header.images
    : (header.imagePath ? [header.imagePath] : (companyLogo ? [companyLogo] : []));

  const allImageUrls = rawImages.map((path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : getFileViewUrl(path);
  }).filter(Boolean);

  const currentPrimarySrc = allImageUrls.length > 0 ? allImageUrls[0] : null;

  // Hover handlers
  const handlePopoverOpen = (event) => {
    setHoverAnchorEl(event.currentTarget);
  };
  const handlePopoverClose = () => {
    setHoverAnchorEl(null);
  };
  const isPopoverOpen = Boolean(hoverAnchorEl);

  // Gallery Navigation
  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : allImageUrls.length - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev < allImageUrls.length - 1 ? prev + 1 : 0));
  };

  const renderProductGraphic = () => {
    // 1. Try Product Image from Master
    if (imgErrorLevel === 0 && currentPrimarySrc) {
      return (
        <img
          src={currentPrimarySrc}
          alt={header.productName || 'Product'}
          onError={() => setImgErrorLevel(1)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
        />
      );
    }

    // 2. Fallback to Company Logo
    if (imgErrorLevel <= 1 && companyLogo) {
      return (
        <img
          src={companyLogo}
          alt="Company Logo"
          onError={() => setImgErrorLevel(2)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
        />
      );
    }

    // 3. Fallback to BOSS Default 3D Metallic Graphic / Logo
    return (
      <svg width="66" height="66" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="gearMetal" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#d1d5db" />
            <stop offset="70%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#374151" />
          </radialGradient>
          <radialGradient id="gearHole" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="60%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </radialGradient>
          <filter id="gearShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.35" />
          </filter>
        </defs>
        <path
          d="M50 8 L54 16 L62 14 L64 22 L72 23 L72 31 L80 34 L77 42 L84 48 L79 55 L84 62 L77 68 L80 76 L72 79 L72 87 L64 88 L62 96 L54 94 L50 102 L46 94 L38 96 L36 88 L28 87 L28 79 L20 76 L23 68 L16 62 L21 55 L16 48 L23 42 L20 34 L28 31 L28 23 L36 22 L38 14 L46 16 Z"
          fill="url(#gearMetal)"
          filter="url(#gearShadow)"
        />
        <circle cx="50" cy="55" r="32" fill="url(#gearMetal)" stroke="#9ca3af" strokeWidth="1.5" />
        <circle cx="50" cy="55" r="22" fill="#4b5563" stroke="#374151" strokeWidth="2" />
        <circle cx="50" cy="55" r="18" fill="url(#gearMetal)" />
        <circle cx="50" cy="55" r="10" fill="url(#gearHole)" />
        <rect x="47" y="42" width="6" height="5" fill="url(#gearHole)" />
      </svg>
    );
  };

  return (
    <>
      <Card
        className="p360-card"
        sx={{
          p: { xs: 1.5, md: 1.8 },
          mb: 2,
          bgcolor: isDark ? '#111936' : '#ffffff',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 'var(--p360-border-radius, 10px)',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: { xs: 'flex-start', lg: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 2, lg: 2.5 }
        }}
      >
        {/* ── LEFT SECTION: PRODUCT IMAGE (HIERARCHY) + PRODUCT ATTRIBUTES ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 2.5 }, flexGrow: 1, overflow: 'hidden' }}>
          {/* Product / Company Logo / Brand Avatar with Hover Zoom & Click Gallery */}
          <Box
            aria-owns={isPopoverOpen ? 'mouse-over-popover' : undefined}
            aria-haspopup="true"
            onMouseEnter={handlePopoverOpen}
            onMouseLeave={handlePopoverClose}
            onClick={() => setGalleryOpen(true)}
            sx={{
              width: { xs: 60, md: 68 },
              height: { xs: 60, md: 68 },
              minWidth: { xs: 60, md: 68 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
              border: `1.5px solid ${theme.palette.primary.main}44`,
              borderRadius: '8px',
              p: 0.5,
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.04)',
                borderColor: theme.palette.primary.main,
                boxShadow: `0 4px 14px ${theme.palette.primary.main}33`
              }
            }}
          >
            {renderProductGraphic()}

            {/* Subtle Zoom Badge overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconZoomIn size={10} />
            </Box>
          </Box>

          {/* Product Attributes Matrix */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, flexGrow: 1 }}>
            {/* Top Row: Product Code (with inline status) | Product Name | Category | UOM | Product Type */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 2, md: 3.5 } }}>
              {/* Product Code with Status Badge */}
              <Box sx={{ minWidth: 130 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.2 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                    Product Code
                  </Typography>
                  <Tooltip title={`Status: ${header.status || '-'}`} arrow enterDelay={200}>
                    <span>
                      <Chip
                        label={header.status || '-'}
                        size="small"
                        sx={{
                          bgcolor: isDark ? 'rgba(74, 222, 128, 0.15)' : '#e8f5e9',
                          color: '#2e7d32',
                          border: '1px solid rgba(46, 125, 50, 0.3)',
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          height: 18,
                          px: 0.5,
                          cursor: 'pointer'
                        }}
                      />
                    </span>
                  </Tooltip>
                </Box>
                <Tooltip title={`Product Code: ${header.productCode || '-'}`} arrow enterDelay={200}>
                  <Box
                    onClick={() => handleNav('PRODUCT_EDIT')}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: '#1565c0',
                        fontSize: '1.15rem',
                        lineHeight: 1.1,
                        '&:hover': {
                          textDecoration: 'underline',
                          color: '#0d47a1'
                        }
                      }}
                    >
                      {header.productCode || '-'}
                    </Typography>
                    <IconStarFilled size={14} style={{ color: '#ffb300' }} />
                  </Box>
                </Tooltip>
              </Box>

              {/* Product Name */}
              <Box sx={{ minWidth: 140, maxWidth: 260 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem', fontWeight: 600, display: 'block', mb: 0.1 }}>
                  Product Name
                </Typography>
                <Tooltip title={header.productName || '-'} arrow enterDelay={200}>
                  <Typography variant="subtitle2" component="div" sx={{ fontWeight: 800, fontSize: '0.85rem', color: isDark ? '#f8fafc' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                    {header.productName || '-'}
                  </Typography>
                </Tooltip>
              </Box>

              {/* Category */}
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem', fontWeight: 600, display: 'block', mb: 0.1 }}>
                  Category
                </Typography>
                <Tooltip title={`Category: ${header.category || '-'}`} arrow enterDelay={200}>
                  <Typography variant="subtitle2" component="div" sx={{ fontWeight: 800, fontSize: '0.82rem', color: isDark ? '#f8fafc' : '#1e293b', cursor: 'pointer' }}>
                    {header.category || '-'}
                  </Typography>
                </Tooltip>
              </Box>

              {/* UOM */}
              <Box sx={{ minWidth: 50 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem', fontWeight: 600, display: 'block', mb: 0.1 }}>
                  UOM
                </Typography>
                <Tooltip title={`Unit of Measure: ${header.uom || '-'}`} arrow enterDelay={200}>
                  <Typography variant="subtitle2" component="div" sx={{ fontWeight: 800, fontSize: '0.82rem', color: isDark ? '#f8fafc' : '#1e293b', cursor: 'pointer' }}>
                    {header.uom || '-'}
                  </Typography>
                </Tooltip>
              </Box>

              {/* Product Type */}
              <Box sx={{ minWidth: 110 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem', fontWeight: 600, display: 'block', mb: 0.1 }}>
                  Product Type
                </Typography>
                <Tooltip title={`Product Type: ${header.productType || '-'}`} arrow enterDelay={200}>
                  <Typography variant="subtitle2" component="div" sx={{ fontWeight: 800, fontSize: '0.82rem', color: isDark ? '#f8fafc' : '#1e293b', cursor: 'pointer' }}>
                    {header.productType || '-'}
                  </Typography>
                </Tooltip>
              </Box>
            </Box>

            {/* Bottom Row: Current Cost | Last Purchase Price | Default Supplier */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 2, md: 3.5 } }}>
              {/* Current Cost */}
              <Box sx={{ minWidth: 100 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem', fontWeight: 600, display: 'block', mb: 0.1 }}>
                  Current Cost
                </Typography>
                <Tooltip title={`Standard Current Cost: ₹ ${header.currentCost ? Number(header.currentCost).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}`} arrow enterDelay={200}>
                  <Typography variant="body1" component="div" sx={{ fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', fontSize: '0.9rem', cursor: 'pointer' }}>
                    ₹ {header.currentCost ? Number(header.currentCost).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                  </Typography>
                </Tooltip>
              </Box>

              {/* Last Purchase Price */}
              <Box sx={{ minWidth: 140 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem', fontWeight: 600, display: 'block', mb: 0.1 }}>
                  Last Purchase Price
                </Typography>
                <Tooltip title={`Last Purchase Price: ₹ ${header.lastPurchasePrice ? Number(header.lastPurchasePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}`} arrow enterDelay={200}>
                  <Typography variant="body1" component="div" sx={{ fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', fontSize: '0.9rem', cursor: 'pointer' }}>
                    ₹ {header.lastPurchasePrice ? Number(header.lastPurchasePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                  </Typography>
                </Tooltip>
              </Box>

              {/* Default Supplier */}
              <Box sx={{ minWidth: 200, maxWidth: 380 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.68rem', fontWeight: 600, display: 'block', mb: 0.1 }}>
                  Default Supplier
                </Typography>
                <Tooltip title={header.defaultSupplierText || 'No default supplier assigned'} arrow enterDelay={200}>
                  <Typography variant="body2" component="div" sx={{ fontWeight: 800, color: isDark ? '#93c5fd' : '#1e3a8a', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                    {header.defaultSupplierText || '-'}
                  </Typography>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── VERTICAL DIVIDER ── */}
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            display: { xs: 'none', lg: 'block' },
            mx: 0.5,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
          }}
        />

        {/* ── RIGHT SECTION: 6 QUICK ACTION BUTTONS + 3-DOTS MENU ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            {/* Row 1: View Product | View BOM | View Routing */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleNav('PRODUCT')}
                startIcon={<IconUser size={15} />}
                sx={btnStyle}
              >
                View Product
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleNav('BOM')}
                startIcon={<IconSitemap size={15} />}
                sx={btnStyle}
              >
                View BOM
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleNav('ROUTING')}
                startIcon={<IconRoute size={15} />}
                sx={btnStyle}
              >
                View Routing
              </Button>
            </Box>

            {/* Row 2: View Stock | View Purchase | View Quality */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleNav('STOCK')}
                startIcon={<IconBuildingWarehouse size={15} />}
                sx={btnStyle}
              >
                View Stock
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleNav('PURCHASE')}
                startIcon={<IconShoppingCart size={15} />}
                sx={btnStyle}
              >
                View Purchase
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleNav('QUALITY')}
                startIcon={<IconHelpCircle size={15} />}
                sx={btnStyle}
              >
                View Quality
              </Button>
            </Box>
          </Box>

          {/* 3-Dots Vertical Action Menu */}
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              color: 'text.secondary',
              p: 0.5,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <IconDotsVertical size={18} />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => { setAnchorEl(null); handleNav('PRODUCT'); }} sx={{ fontSize: '0.78rem' }}>
              Open in Product Master
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); handleNav('STOCK'); }} sx={{ fontSize: '0.78rem' }}>
              View Stock Ledger Report
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); handleNav('PURCHASE'); }} sx={{ fontSize: '0.78rem' }}>
              View Open Purchase Orders
            </MenuItem>
          </Menu>
        </Box>
      </Card>

      {/* ── 1. HOVER MAGNIFIER POPOVER ── */}
      <Popover
        id="mouse-over-popover"
        sx={{ pointerEvents: 'none' }}
        open={isPopoverOpen}
        anchorEl={hoverAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Box
          sx={{
            p: 1.5,
            maxWidth: 320,
            bgcolor: isDark ? '#1a223f' : '#ffffff',
            boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            textAlign: 'center'
          }}
        >
          {currentPrimarySrc ? (
            <img
              src={currentPrimarySrc}
              alt="Magnified Preview"
              style={{
                width: '100%',
                maxHeight: 260,
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block',
                marginBottom: '8px'
              }}
            />
          ) : (
            <Box sx={{ py: 3 }}>{renderProductGraphic()}</Box>
          )}

          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.85rem' }}>
            {header.productCode} - {header.productName}
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
            🔍 Click image to open interactive photo gallery ({allImageUrls.length} {allImageUrls.length === 1 ? 'image' : 'images'})
          </Typography>
        </Box>
      </Popover>

      {/* ── 2. CENTERED FLOATING LIGHTBOX / GALLERY MODAL ── */}
      <Dialog
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        maxWidth="md"
        fullWidth
        BackdropProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)'
          }
        }}
        PaperProps={{
          sx: {
            bgcolor: '#0b1329',
            backgroundImage: 'none',
            color: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
            p: { xs: 1.5, sm: 2.5 }
          }
        }}
      >
        {/* Top Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1.5,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* Product Info Chip */}
          <Box display="flex" alignItems="center" gap={1.2} sx={{ minWidth: 0, flexGrow: 1, mr: 1 }}>
            <Chip
              label={header.productCode || 'PRODUCT'}
              size="small"
              sx={{
                bgcolor: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                fontWeight: 800,
                fontSize: '0.75rem',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                flexShrink: 0
              }}
            />
            <Typography
              variant="subtitle1"
              sx={{
                color: '#f8fafc',
                fontWeight: 700,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {header.productName}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1.5} flexShrink={0}>
            {/* Photo Counter Pill */}
            {allImageUrls.length > 0 && (
              <Box
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  px: 1.5,
                  py: 0.3,
                  borderRadius: 10,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#e2e8f0'
                }}
              >
                {activeImgIndex + 1} / {allImageUrls.length}
              </Box>
            )}

            {/* Close Button */}
            <IconButton
              onClick={() => setGalleryOpen(false)}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.3)',
                  color: '#ffffff',
                  transform: 'rotate(90deg)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <IconX size={18} />
            </IconButton>
          </Box>
        </Box>

        {/* Central Stage: Centered Image with Prev/Next Buttons */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            height: { xs: 280, sm: 380, md: 420 },
            bgcolor: '#030712',
            borderRadius: '12px',
            my: 2,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          {/* Previous Arrow */}
          {allImageUrls.length > 1 && (
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                left: 12,
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                width: 40,
                height: 40,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.8)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease',
                zIndex: 5
              }}
            >
              <IconChevronLeft size={22} />
            </IconButton>
          )}

          {/* Active Image */}
          {allImageUrls.length > 0 ? (
            <img
              key={activeImgIndex}
              src={allImageUrls[activeImgIndex]}
              alt={`Product Photo ${activeImgIndex + 1}`}
              style={{
                maxWidth: '92%',
                maxHeight: '92%',
                objectFit: 'contain',
                borderRadius: '8px',
                animation: 'fadeIn 0.2s ease-in-out'
              }}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              {renderProductGraphic()}
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
                No product images attached.
              </Typography>
            </Box>
          )}

          {/* Next Arrow */}
          {allImageUrls.length > 1 && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 12,
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                width: 40,
                height: 40,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.8)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease',
                zIndex: 5
              }}
            >
              <IconChevronRight size={22} />
            </IconButton>
          )}
        </Box>

        {/* Bottom Thumbnails Strip */}
        {allImageUrls.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1.5,
              overflowX: 'auto',
              pt: 0.5
            }}
          >
            {allImageUrls.map((url, idx) => (
              <Box
                key={idx}
                onClick={() => setActiveImgIndex(idx)}
                sx={{
                  width: 58,
                  height: 58,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: `2px solid ${activeImgIndex === idx ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: activeImgIndex === idx ? '0 0 12px rgba(59, 130, 246, 0.6)' : 'none',
                  opacity: activeImgIndex === idx ? 1 : 0.45,
                  transform: activeImgIndex === idx ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  bgcolor: '#030712',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  p: 0.3,
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.03)'
                  }
                }}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Dialog>
    </>
  );
}
