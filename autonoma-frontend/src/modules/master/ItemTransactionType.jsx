import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { IconClipboardList } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { format } from 'date-fns';
import { API_PATHS } from 'utils/api-constants';

const columns = [
  { id: 'seqNo', label: 'Seq No', minWidth: 80 },
  { id: 'type', label: 'Type', minWidth: 200, bold: true },
  { id: 'description', label: 'Description', minWidth: 250 },
  { id: 'stockEffect', label: 'Stock Effect', minWidth: 120 },

];

export default function ItemTransactionType() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const config = [
      { id: 'type', label: 'Type', type: 'text' },
      { id: 'description', label: 'Description', type: 'text' }
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/master/inventory/transaction-type');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch item transaction types:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const typeFilter = globalFilters.type || '';
      const matchesType = !typeFilter || (row.type && row.type.toLowerCase().includes(typeFilter.toLowerCase()));

      const descFilter = globalFilters.description || '';
      const matchesDesc = !descFilter || (row.description && row.description.toLowerCase().includes(descFilter.toLowerCase()));

      const matchesSearch = !globalQuery ||
        (row.type && row.type.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.description && row.description.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesType && matchesDesc && matchesSearch;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  const renderCell = (col, row, idx) => {
    const val = row[col.id];
    if (col.id === 'seqNo') return page * size + idx + 1;
    if (col.id === 'stockEffect') {
      return row.stockEffect ? 'OUT' : 'IN';
    }
    if (col.id === 'createdUser') return row.createdBy || 'SYSTEM';
    if (col.id === 'updatedUser') return row.updatedBy || '-';
    if (col.id.toLowerCase().includes('date')) {
      if (!val) return '-';
      try { return format(new Date(val), 'dd/MM/yyyy HH:mm'); } catch { return '-'; }
    }
    return val ?? '-';
  };

  return (
    <MainCard fullWidth
      icon={IconClipboardList}
      title={"Item Transaction Type Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          hasWritePermission={false}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={paginatedRows}
        totalRows={filteredRows.length}
        page={page}
        size={size}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => setSize(s)}
        loading={loading}
        showActions={false}
        renderCell={renderCell}
      />
    </MainCard>
  );
}
