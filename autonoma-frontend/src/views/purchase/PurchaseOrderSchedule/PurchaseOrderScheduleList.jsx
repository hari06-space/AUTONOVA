import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconFileText } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import usePagePermissions from 'hooks/usePagePermissions';
import { setFilterConfig } from 'store/slices/search';
import { useNavigate } from 'react-router-dom';

export default function PurchaseOrderScheduleList() {
  const perms = usePagePermissions("PUR1001");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const globalFilters = useSelector((state) => state.search?.filters || {});
  
  // Data
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reports/purchase/po-schedule');
      const dataWithSno = response.data.map((item, index) => ({
        ...item,
        sno: index + 1
      }));
      setRows(dataWithSno);
    } catch (e) { 
      console.error('Failed to fetch PO schedule:', e); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Global filters configuration
  useEffect(() => {
    dispatch(setFilterConfig([
      { id: 'poNo', label: 'PO No', type: 'text', isStarred: true },
      { id: 'itemCode', label: 'Item Code', type: 'text', isStarred: true },
      { id: 'itemName', label: 'Item Name', type: 'text', isStarred: true },
      { id: 'supplierName', label: 'Supplier Name', type: 'text', isStarred: true },
      { id: 'status', label: 'Status', type: 'text', isStarred: true }
    ]));

    return () => {
      dispatch(setFilterConfig([]));
    };
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      for (const [key, value] of Object.entries(globalFilters)) {
        if (!['poNo', 'itemCode', 'itemName', 'supplierName', 'status'].includes(key)) continue;
        if (!value || value === 'All' || value === 'ALL') continue;
        if (Array.isArray(value) && (value.length === 0 || value.includes('All') || value.includes('ALL'))) continue;

        const rowVal = row[key] ? String(row[key]).toLowerCase() : '';

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
    { id: 'poNo', label: 'PO No', minWidth: 150, bold: true, align: 'center' },
    { 
      id: 'poDate', label: 'PO Date', minWidth: 120, align: 'center', 
      format: (val) => val ? new Date(val).toLocaleDateString('en-GB') : 'N/A' 
    },
    { id: 'supplierName', label: 'Supplier Name', minWidth: 250, align: 'center' },
    { id: 'itemCode', label: 'Item Code', minWidth: 150, align: 'center' },
    { id: 'itemName', label: 'Item Name', minWidth: 250, align: 'center' },
    { id: 'uom', label: 'UoM', minWidth: 100, align: 'center' },
    { id: 'poQty', label: 'PO Qty', minWidth: 100, align: 'right' },
    { 
      id: 'expectedDeliveryDate', label: 'Expected Delivery Date', minWidth: 180, align: 'center', 
      format: (val) => val ? new Date(val).toLocaleDateString('en-GB') : 'N/A' 
    },
    { id: 'status', label: 'Status', minWidth: 120, align: 'center' }
  ]), []);

  return (
    <MainCard 
      content={false}
      title="Purchase Order Schedule"
      secondary={
        <BOSTableToolbar 
          onRefresh={fetchData} 
          onNew={() => navigate('/purchase/po-schedule/entry')}
          newLabel="+ New"
          exportData={filteredRows}
          exportFilename="Purchase_Order_Schedule"
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        data={filteredRows}
        page={page}
        rowsPerPage={size}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
        loading={loading}
        onDoubleClickRow={(row) => navigate('/purchase/po-schedule/entry?poId=' + row.poId)}
      />
    </MainCard>
  );
}
