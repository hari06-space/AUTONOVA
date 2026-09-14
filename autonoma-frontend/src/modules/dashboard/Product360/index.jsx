import React, { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import axios from 'utils/axios';
import useConfig from 'hooks/useConfig';

import './product360.css';
import Product360Header from './Product360Header';
import ProductSummaryCard from './ProductSummaryCard';
import InventoryKpiGrid from './InventoryKpiGrid';
import DrilldownModal from './DrilldownModal';

import DivisionStockTable from './AnalyticalWidgets/DivisionStockTable';
import DemandSummaryChart from './AnalyticalWidgets/DemandSummaryChart';
import DemandTrendChart from './AnalyticalWidgets/DemandTrendChart';
import DemandForecastChart from './AnalyticalWidgets/DemandForecastChart';
import ReservationSummaryTable from './AnalyticalWidgets/ReservationSummaryTable';
import RolSafetyGauge from './AnalyticalWidgets/RolSafetyGauge';
import ProjectedStockChart from './AnalyticalWidgets/ProjectedStockChart';
import DaysOfInventoryCard from './AnalyticalWidgets/DaysOfInventoryCard';
import StockHealthCard from './AnalyticalWidgets/StockHealthCard';
import OpenRoutingCardsCard from './AnalyticalWidgets/OpenRoutingCardsCard';
import ProcessWipChart from './AnalyticalWidgets/ProcessWipChart';
import MaterialShortageTable from './AnalyticalWidgets/MaterialShortageTable';
import PurchasePipelineCard from './AnalyticalWidgets/PurchasePipelineCard';
import BossIntelligenceCard from './AnalyticalWidgets/BossIntelligenceCard';
import SupplierQualityCostSection from './AnalyticalWidgets/SupplierQualityCostSection';
import ProductVisualSearchModal from './ProductVisualSearchModal';

export default function Product360Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state: configState } = useConfig();

  // Filters State
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Dashboard Data State
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Drilldown Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const searchTimeoutRef = React.useRef(null);

  const handleProductSearch = useCallback((term) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const pRes = await axios.get(`/api/product-360/search?query=${encodeURIComponent(term || '')}&limit=200`);
        if (pRes.data && Array.isArray(pRes.data)) {
          setProducts((prev) => {
            const map = new Map();
            if (selectedProduct) map.set(selectedProduct.id, selectedProduct);
            pRes.data.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Dynamic product search error:', err);
      }
    }, 250);
  }, [selectedProduct]);

  // 1. Initial Load: Product Search and Divisions
  useEffect(() => {
    loadInitialFilters();
  }, []);

  const loadInitialFilters = async () => {
    try {
      // 1. Load products from NPD_PRODUCT_MASTER
      const pRes = await axios.get('/api/product-360/search?limit=300');
      if (pRes.data && pRes.data.length > 0) {
        setProducts(pRes.data);
        setSelectedProduct(pRes.data[0]);
      }

      // 2. Load divisions from AD_DIVISION
      try {
        const dRes = await axios.get('/api/product-360/divisions');
        if (dRes.data && Array.isArray(dRes.data) && dRes.data.length > 0) {
          setDivisions(dRes.data);
        } else {
          const altRes = await axios.get('/api/admin/divisions');
          if (altRes.data && Array.isArray(altRes.data)) {
            setDivisions(altRes.data);
          }
        }
      } catch (err) {
        console.warn('Failed to load divisions, using default list:', err);
        setDivisions([
          { id: 1, divisionId: 1, name: 'Chennai', divisionName: 'Chennai' },
          { id: 2, divisionId: 2, name: 'Bangalore', divisionName: 'Bangalore' },
          { id: 3, divisionId: 3, name: 'Pune', divisionName: 'Pune' }
        ]);
      }
    } catch (err) {
      console.error('Error loading initial filters:', err);
    }
  };

  // 2. Fetch Dashboard Summary
  const fetchDashboardData = useCallback(async () => {
    if (!selectedProduct && products.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const prodId = selectedProduct?.id || (products.length > 0 ? products[0].id : null);
      const params = {
        productId: prodId,
        divisionId: selectedDivision || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      const res = await axios.get('/api/product-360/summary', { params });
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to load Product 360 data:', err);
      setError('Unable to fetch live intelligence summary. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, selectedDivision, startDate, endDate, products]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Quick Action Handler
  const handleActionClick = (action) => {
    switch (action) {
      case 'PRODUCT':
        navigate('/master/product-master');
        break;
      case 'PRODUCT_EDIT':
        {
          const prodId = selectedProduct?.id || (products.length > 0 ? products[0].id : null);
          if (prodId) {
            navigate(`/master/product-master/edit/${prodId}`, { state: { from: '/dashboard/product-360' } });
          }
        }
        break;
      case 'BOM':
        navigate('/dd/product-bom');
        break;
      case 'ROUTING':
        openDrilldown('Routing Cards Drilldown', '/api/product-360/drilldown/routing-cards');
        break;
      case 'STOCK':
        openDrilldown('Open Batch & Stock Details Drilldown', '/api/product-360/drilldown/batches');
        break;
      case 'PURCHASE':
        openDrilldown('Purchase Pipeline Drilldown', '/api/product-360/drilldown/purchase-pipeline');
        break;
      case 'QUALITY':
        openDrilldown('Quality Inspection Drilldown', '/api/product-360/drilldown/quality-inspection');
        break;
      default:
        break;
    }
  };

  // Generic Drilldown Opener
  const openDrilldown = async (title, endpoint) => {
    setModalTitle(title);
    setModalOpen(true);
    setModalLoading(true);
    try {
      const prodId = selectedProduct?.id || (products.length > 0 ? products[0].id : null);
      const res = await axios.get(endpoint, {
        params: {
          productId: prodId,
          divisionId: selectedDivision || undefined
        }
      });
      setModalData(res.data || []);
    } catch (err) {
      console.error('Drilldown fetch error:', err);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const currentFontFamily = configState?.fontFamily || theme.typography?.fontFamily || "'Poppins', sans-serif";
  const currentFontSize = Number(configState?.fontSize) || 14;
  const isGlobalBold = Boolean(configState?.isBold);
  const isGlobalItalic = Boolean(configState?.isItalic);
  const fontScale = currentFontSize / 14;
  const borderRadiusVal = configState?.borderRadius !== undefined ? configState.borderRadius : 8;

  const data = dashboardData || {};

  return (
    <Box
      className={`p360-container ${isGlobalBold ? 'p360-bold' : ''} ${isGlobalItalic ? 'p360-italic' : ''}`}
      sx={{
        p: { xs: 1, sm: 1.5 },
        zoom: fontScale,
        fontFamily: `${currentFontFamily} !important`,
        fontStyle: isGlobalItalic ? 'italic !important' : 'normal',
        fontWeight: isGlobalBold ? '700 !important' : 'normal',
        fontSize: `${currentFontSize}px`,
        '--p360-font-family': currentFontFamily,
        '--p360-border-radius': `${borderRadiusVal}px`,
        '--p360-font-size': `${currentFontSize}px`,
        '--p360-font-scale': fontScale,
        '& *': {
          fontFamily: 'inherit !important'
        }
      }}
    >
      {/* 1. STICKY HEADER WITH FILTERS & SOP */}
      <Product360Header
        products={products}
        selectedProduct={selectedProduct}
        onProductChange={(p) => setSelectedProduct(p)}
        onSearch={handleProductSearch}
        onOpenVisualSearch={() => setVisualSearchOpen(true)}
        divisions={divisions}
        selectedDivision={selectedDivision}
        onDivisionChange={(d) => setSelectedDivision(d)}
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !dashboardData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={44} />
        </Box>
      ) : (
        <>
          {/* 2. PRODUCT MASTER SUMMARY CARD */}
          <ProductSummaryCard
            header={data.productHeader}
            onActionClick={handleActionClick}
          />

          {/* 3. 11 INVENTORY KPI METRIC CARDS (EXACT 11-COL ROW) */}
          <InventoryKpiGrid
            kpis={data.inventoryKpis}
            onKpiClick={(kpiId) => {
              if (kpiId === 'CURRENT_STOCK' || kpiId === 'AVAILABLE_STOCK') {
                openDrilldown('Stock Breakdown Drilldown', '/api/product-360/drilldown/stock-details');
              } else if (kpiId === 'RESERVED_STOCK') {
                openDrilldown('Reservations Drilldown', '/api/product-360/drilldown/reservations');
              } else if (kpiId === 'OPEN_PO' || kpiId === 'OPEN_PR' || kpiId === 'IN_TRANSIT') {
                openDrilldown('Purchase Pipeline Drilldown', '/api/product-360/drilldown/purchase-pipeline');
              } else {
                openDrilldown('Stock Health & ROL Drilldown', '/api/product-360/drilldown/stock-details');
              }
            }}
          />

          {/* 4. ROW 1: 4 COLUMNS (STOCK OVERVIEW | DEMAND SUMMARY | DEMAND TREND | DEMAND FORECAST) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: 1.2,
              mb: 1.5
            }}
          >
            <DivisionStockTable
              divisionStocks={data.divisionStocks}
              onRowClick={(row) => openDrilldown(`Stock Details - ${row.divisionName}`, '/api/product-360/drilldown/stock-details')}
            />
            <DemandSummaryChart
              demandSummary={data.demandSummary}
              onDemandClick={() => openDrilldown('Demand Source Details', '/api/product-360/drilldown/reservations')}
            />
            <DemandTrendChart demandTrends={data.demandTrends} />
            <DemandForecastChart forecastSummary={data.forecastSummary} />
          </Box>

          {/* 5. ROW 2: 5 COLUMNS (RESERVATIONS | ROL & SAFETY GAUGE | PROJECTED STOCK | DOI | STOCK HEALTH) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(5, 1fr)'
              },
              gap: 1.2,
              mb: 1.5
            }}
          >
            <ReservationSummaryTable
              reservations={data.reservations}
              onRowClick={() => openDrilldown('Reservations Drilldown', '/api/product-360/drilldown/reservations')}
            />
            <RolSafetyGauge rolSafety={data.rolSafety} />
            <ProjectedStockChart projectedStocks={data.projectedStocks} />
            <DaysOfInventoryCard doi={data.daysOfInventory} />
            <StockHealthCard
              stockHealth={data.stockHealth}
              onViewDetails={() => openDrilldown('Stock Health Detailed Evaluation', '/api/product-360/drilldown/stock-details')}
            />
          </Box>

          {/* 6. ROW 3: 5 COLUMNS (ROUTING CARDS | PROCESS WIP | MATERIAL SHORTAGE | PURCHASE PIPELINE | BOSS INTELLIGENCE) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(5, 1fr)'
              },
              gap: 1.2,
              mb: 1.5
            }}
          >
            <OpenRoutingCardsCard
              routingCards={data.routingCards}
              onViewAll={() => openDrilldown('Open Routing Cards Drilldown', '/api/product-360/drilldown/routing-cards')}
            />
            <ProcessWipChart
              processWipList={data.processWipList}
              onViewWip={() => openDrilldown('Process WIP Machine Level Drilldown', '/api/product-360/drilldown/process-wip')}
            />
            <MaterialShortageTable
              materialShortages={data.materialShortages}
              onViewAllShortages={() => openDrilldown('Production Material Shortage Drilldown', '/api/product-360/drilldown/material-shortage')}
            />
            <PurchasePipelineCard
              pipeline={data.purchasePipeline}
              onViewAllPurchase={() => openDrilldown('Open Purchase Pipeline Drilldown', '/api/product-360/drilldown/purchase-pipeline')}
            />
            <BossIntelligenceCard
              bossInsights={data.bossInsights}
              onViewAllInsights={() => openDrilldown('BOSS Intelligence Insights', '/api/product-360/drilldown/routing-cards')}
            />
          </Box>

          {/* 7. ROW 4: TABBED DEEP-DIVE SECTION (ITEM TRANSACTIONS, SUPPLIER, QUALITY, AGING, REORDER, RISK MATRIX) */}
          <SupplierQualityCostSection
            data={data}
            productId={selectedProduct?.id || (products.length > 0 ? products[0].id : null)}
            divisionId={selectedDivision}
          />
        </>
      )}

      {/* 8. INTERACTIVE DRILLDOWN MODAL */}
      <DrilldownModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        data={modalData}
        loading={modalLoading}
      />

      {/* 9. LENS VISUAL PRODUCT SEARCH MODAL */}
      <ProductVisualSearchModal
        open={visualSearchOpen}
        onClose={() => setVisualSearchOpen(false)}
        onSelectProduct={(matchedProduct) => {
          if (matchedProduct) {
            setProducts((prev) => {
              const exists = prev.some((p) => p.id === matchedProduct.id);
              return exists ? prev : [matchedProduct, ...prev];
            });
            setSelectedProduct(matchedProduct);
          }
        }}
      />
    </Box>
  );
}
