import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { IconTimeline } from '@tabler/icons-react';
import axios from 'utils/axios';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { setFilterConfig } from 'store/slices/search';

const isoDate = (d) => {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
};

export default function StockMovementReport() {
  const perms = usePagePermissions(PAGE_CODES.INV_STOCK_MOVEMENT_REPORT);
  const dispatch = useDispatch();
  const globalFilters = useSelector((state) => state.search.filters);
  
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  useEffect(() => {
    let active = true;
    const fetchOptions = async () => {
      try {
        const divRes = await axios.get('/api/admin/divisions');
        if (!active) return;
        
        const divisionOptions = Array.isArray(divRes.data) ? divRes.data.map(d => ({
          value: d.id,
          label: d.divisionName
        })) : [];

        dispatch(setFilterConfig([
          { id: 'divisionId', label: 'Division', type: 'autocomplete', options: divisionOptions, required: true, defaultValue: 1 },
          { id: 'startDate', label: 'Start Date', type: 'date', required: true, defaultValue: isoDate(thirtyDaysAgo) },
          { id: 'endDate', label: 'End Date', type: 'date', required: true, defaultValue: isoDate(today) }
        ]));
      } catch (e) {
        console.error('Failed to fetch filter options:', e);
      }
    };

    dispatch(setFilterConfig([
      { id: 'divisionId', label: 'Division', type: 'autocomplete', options: [], required: true, defaultValue: 1 },
      { id: 'startDate', label: 'Start Date', type: 'date', required: true, defaultValue: isoDate(thirtyDaysAgo) },
      { id: 'endDate', label: 'End Date', type: 'date', required: true, defaultValue: isoDate(today) }
    ]));
    
    fetchOptions();
    
    return () => {
      active = false;
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);
  
  // Data
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  const fetchData = useCallback(async () => {
    const divisionId = globalFilters?.divisionId || 1;
    const startDate = globalFilters?.startDate || isoDate(thirtyDaysAgo);
    const endDate = globalFilters?.endDate || isoDate(today);
    
    if (!divisionId || !startDate || !endDate) return;
    setLoading(true);
    try {
      const params = { divisionId, startDate, endDate, page, size };
      
      const response = await axios.get('/api/inventory/transaction/reports/stock-movement', { params });
      
      if (response.data && response.data.content) {
        setRows(response.data.content);
        setTotalElements(response.data.totalElements);
      } else {
        setRows([]);
        setTotalElements(0);
      }
    } catch (e) { 
      console.error('Failed to fetch stock movement report:', e); 
    } finally { 
      setLoading(false); 
    }
  }, [globalFilters, page, size]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = useMemo(() => ([
    { id: 'index', label: '#', minWidth: 50 },
    { id: 'transDateDisplay', label: 'Date', minWidth: 120, bold: true },
    { id: 'transNo', label: 'Transaction No', minWidth: 150 },
    { id: 'transType', label: 'Transaction Type', minWidth: 150 },
    { id: 'productName', label: 'Product Name', minWidth: 180 },
    { id: 'qtyIn', label: 'Qty In', minWidth: 100, type: 'number', color: 'success.main' },
    { id: 'qtyOut', label: 'Qty Out', minWidth: 100, type: 'number', color: 'error.main' },
    { id: 'referenceNo', label: 'Reference No', minWidth: 130 },
    { id: 'status', label: 'Status', minWidth: 120 }
  ]), []);

  const resolvedRows = useMemo(() => rows.map((row) => ({
    ...row,
    transDateDisplay: row.transDate ? format(new Date(row.transDate), 'dd/MM/yyyy') : '-'
  })), [rows]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      icon={IconTimeline}
      title="Stock Movement Report"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={resolvedRows}
          exportFilename="Stock_Movement_Report"
          hasExportPermission={perms?.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        page={page}
        size={size}
        totalElements={totalElements}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
      />
    </MainCard>
  );
}
