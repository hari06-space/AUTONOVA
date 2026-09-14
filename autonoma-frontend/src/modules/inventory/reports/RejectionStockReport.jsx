import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { IconCircleX } from '@tabler/icons-react';
import axios from 'utils/axios';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { setFilterConfig } from 'store/slices/search';

export default function RejectionStockReport() {
  const perms = usePagePermissions(PAGE_CODES.INV_REJECTION_STOCK_REPORT);
  const dispatch = useDispatch();
  const globalFilters = useSelector((state) => state.search.filters);
  
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
          { id: 'divisionId', label: 'Division', type: 'autocomplete', options: divisionOptions, required: true, defaultValue: 1 }
        ]));
      } catch (e) {
        console.error('Failed to fetch filter options:', e);
      }
    };

    dispatch(setFilterConfig([
      { id: 'divisionId', label: 'Division', type: 'autocomplete', options: [], required: true, defaultValue: 1 }
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
    if (!divisionId) return;
    setLoading(true);
    try {
      const params = { divisionId, page, size };
      
      const response = await axios.get('/api/inventory/transaction/reports/rejection-stock', { params });
      
      if (response.data && response.data.content) {
        setRows(response.data.content);
        setTotalElements(response.data.totalElements);
      } else {
        setRows([]);
        setTotalElements(0);
      }
    } catch (e) { 
      console.error('Failed to fetch rejection stock report:', e); 
    } finally { 
      setLoading(false); 
    }
  }, [globalFilters, page, size]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = useMemo(() => ([
    { id: 'index', label: '#', minWidth: 50 },
    { id: 'transDateDisplay', label: 'Date', minWidth: 120, bold: true },
    { id: 'transNo', label: 'Transaction No', minWidth: 150 },
    { id: 'productName', label: 'Product Name', minWidth: 180 },
    { id: 'qtyIn', label: 'Rejected Qty', minWidth: 120, type: 'number', color: 'error.main', bold: true },
    { id: 'uom', label: 'UOM', minWidth: 100 },
    { id: 'remarks', label: 'Remarks', minWidth: 200 }
  ]), []);

  const resolvedRows = useMemo(() => rows.map((row) => ({
    ...row,
    transDateDisplay: row.transDate ? format(new Date(row.transDate), 'dd/MM/yyyy') : '-'
  })), [rows]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      icon={IconCircleX}
      title="Rejection Stock Report"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={resolvedRows}
          exportFilename="Rejection_Stock_Report"
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
