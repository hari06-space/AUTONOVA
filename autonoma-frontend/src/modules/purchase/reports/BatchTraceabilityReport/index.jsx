import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconFileText } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import usePagePermissions from 'hooks/usePagePermissions';
import { setFilterConfig } from 'store/slices/search';

export default function BatchTraceabilityReport() {
  const perms = usePagePermissions("PUR1001");
  const dispatch = useDispatch();
  const globalFilters = useSelector((state) => state.search?.filters || {});
  
  // Data
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reports/purchase/batch-traceability');
      // Set serial numbers dynamically if they are not from backend
      const dataWithSno = response.data.map((item, index) => ({
        ...item,
        sno: index + 1
      }));
      setRows(dataWithSno);
    } catch (e) { 
      console.error('Failed to fetch batch traceability:', e); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Global filters configuration
  useEffect(() => {
    
    dispatch(setFilterConfig([
      { id: 'batchNo', label: 'Batch No', type: 'text', isStarred: true },
      { id: 'itemCode', label: 'Item Code', type: 'text', isStarred: true },
      { id: 'itemName', label: 'Item Name', type: 'text', isStarred: true },
      { id: 'supplierName', label: 'Supplier Name', type: 'text', isStarred: true },
      { id: 'poType', label: 'PO Type', type: 'text', isStarred: true }
    ]));

    return () => {
      dispatch(setFilterConfig(null));
      
    };
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      for (const [key, value] of Object.entries(globalFilters)) {
        if (!['batchNo', 'itemCode', 'itemName', 'supplierName', 'poType'].includes(key)) continue;
        if (!value || value === 'All' || value === 'ALL') continue;
        if (Array.isArray(value) && (value.length === 0 || value.includes('All') || value.includes('ALL'))) continue;

        let rowVal = '';
        if (key === 'receivedDate' && row[key]) {
          rowVal = new Date(row[key]).toLocaleDateString('en-GB').toLowerCase();
        } else {
          rowVal = row[key] ? String(row[key]).toLowerCase() : '';
        }

        if (Array.isArray(value)) {
          const matches = value.some(val => rowVal.includes(String(val).toLowerCase()));
          if (!matches) return false;
        } else {
          const filterVal = String(value).toLowerCase();
          if (!rowVal.includes(filterVal)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [rows, globalFilters]);

  const columns = useMemo(() => ([
    { id: 'sno', label: 'S.No', align: 'center', width: 70 },
    { id: 'batchNo', label: 'Batch No', minWidth: 220, bold: true, align: 'center' },
    { id: 'itemCode', label: 'Item Code', minWidth: 220, align: 'center' },
    { id: 'itemName', label: 'Item Name', minWidth: 250, align: 'center' },
    { id: 'supplierName', label: 'Supplier Name', minWidth: 250, align: 'center' },
    { id: 'poType', label: 'PO Type', minWidth: 150, align: 'center' },
    { id: 'prNo', label: 'PR No', minWidth: 220, align: 'center' },
    { id: 'prStatus', label: 'PR Status', minWidth: 220, align: 'center' },
    { id: 'poNo', label: 'PO No', minWidth: 220, align: 'center' },
    { id: 'poQty', label: 'PO Qty', minWidth: 120, align: 'center' },
    { 
      id: 'expectedDate', label: 'Expected Date', minWidth: 220, align: 'center', 
      format: (val) => val ? new Date(val).toLocaleDateString('en-GB') : 'N/A' 
    },
    { id: 'poStatus', label: 'PO Status', minWidth: 220, align: 'center' },
    { id: 'gateEntryNo', label: 'Gate Entry No', minWidth: 220, align: 'center' },
    { 
      id: 'gateEntryDate', label: 'Gate Entry Date', minWidth: 220, align: 'center', 
      format: (val) => val ? new Date(val).toLocaleDateString('en-GB') : 'N/A' 
    },
    { 
      id: 'receivedDate', label: 'Received Date', minWidth: 220, align: 'center', 
      format: (val) => val ? new Date(val).toLocaleDateString('en-GB') : 'N/A' 
    },
    { id: 'gateEntryStatus', label: 'Gate Entry Status', minWidth: 220, align: 'center' },
    { id: 'grnNo', label: 'GRN No', minWidth: 220, align: 'center' },
    { id: 'grnQty', label: 'GRN Qty', minWidth: 120, align: 'center' },
    { id: 'grnStatus', label: 'GRN Status', minWidth: 220, align: 'center' },
    { id: 'accQty', label: 'Acc Qty', minWidth: 120, align: 'center' },
    { id: 'rejQty', label: 'Rej Qty', minWidth: 120, align: 'center' },
    { id: 'rejComments', label: 'Rej Comments', minWidth: 250, align: 'center' },
    { id: 'ncQty', label: 'NC Qty', minWidth: 120, align: 'center' },
    { id: 'ncComments', label: 'NC Comments', minWidth: 250, align: 'center' },
    { id: 'inspectionStatus', label: 'Inspection Status', minWidth: 220, align: 'center' }
  ]), []);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      icon={IconFileText}
      title="Batch Traceability Report"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={filteredRows}
          exportFilename="Batch_Traceability_Report"
          hasExportPermission={perms?.export !== false}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
      />
    </MainCard>
  );
}






