import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { IconFileText } from '@tabler/icons-react';
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

export default function StockLedgerReport() {
  const perms = usePagePermissions(PAGE_CODES.INV_STOCK_LEDGER_REPORT);
  const dispatch = useDispatch();
  const globalFilters = useSelector((state) => state.search.filters);
  
  useEffect(() => {
    let active = true;
    const fetchOptions = async () => {
      try {
        const [divRes, prodRes] = await Promise.all([
          axios.get('/api/admin/divisions'),
          axios.get('/api/master/npd/product-master/list')
        ]);
        if (!active) return;
        
        const divisionOptions = Array.isArray(divRes.data) ? divRes.data.map(d => ({
          value: d.id,
          label: d.divisionName
        })) : [];
        
        const productOptions = Array.isArray(prodRes.data) ? prodRes.data.map(p => ({
          value: p.id,
          label: `${p.itemNo} - ${p.itemName}`
        })) : [];

        dispatch(setFilterConfig([
          { id: 'divisionId', label: 'Division', type: 'autocomplete', options: divisionOptions, required: true, defaultValue: 1 },
          { id: 'productId', label: 'Product (Part No)', type: 'autocomplete', options: productOptions, required: true },
          { id: 'startDate', label: 'Start Date', type: 'date' },
          { id: 'endDate', label: 'End Date', type: 'date' }
        ]));
      } catch (e) {
        console.error('Failed to fetch filter options:', e);
      }
    };

    dispatch(setFilterConfig([
      { id: 'divisionId', label: 'Division', type: 'autocomplete', options: [], required: true, defaultValue: 1 },
      { id: 'productId', label: 'Product (Part No)', type: 'autocomplete', options: [], required: true },
      { id: 'startDate', label: 'Start Date', type: 'date' },
      { id: 'endDate', label: 'End Date', type: 'date' }
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

  const fetchData = useCallback(async () => {
    const divisionId = globalFilters?.divisionId || 1;
    const productId = globalFilters?.productId;
    
    if (!divisionId || !productId) return; 
    setLoading(true);
    try {
      const params = { divisionId, productId };
      if (globalFilters?.startDate) params.startDate = globalFilters.startDate;
      if (globalFilters?.endDate) params.endDate = globalFilters.endDate;
      
      const response = await axios.get('/api/inventory/transaction/reports/stock-ledger', { params });
      const dataWithIds = Array.isArray(response.data) ? response.data.map((r, i) => ({ ...r, id: r.transNo + '_' + i })) : [];
      setRows(dataWithIds);
    } catch (e) { 
      console.error('Failed to fetch stock ledger report:', e); 
    } finally { 
      setLoading(false); 
    }
  }, [globalFilters]);

  const columns = useMemo(() => ([
    { id: 'index', label: '#', minWidth: 50 },
    { id: 'transDateDisplay', label: 'Date', minWidth: 120, bold: true },
    { id: 'transNo', label: 'Transaction No', minWidth: 150 },
    { id: 'transType', label: 'Transaction Type', minWidth: 150 },
    { id: 'referenceNo', label: 'Reference No', minWidth: 130 },
    { id: 'qtyIn', label: 'Qty In', minWidth: 100, type: 'number', color: 'success.main' },
    { id: 'qtyOut', label: 'Qty Out', minWidth: 100, type: 'number', color: 'error.main' },
    { id: 'runningBalance', label: 'Running Balance', minWidth: 140, type: 'number', bold: true }
  ]), []);

  const resolvedRows = useMemo(() => rows.map((row) => ({
    ...row,
    transDateDisplay: row.transDate ? format(new Date(row.transDate), 'dd/MM/yyyy') : '-'
  })), [rows]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      icon={IconFileText}
      title="Stock Ledger Report"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={resolvedRows}
          exportFilename="Stock_Ledger_Report"
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
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
      />
    </MainCard>
  );
}
