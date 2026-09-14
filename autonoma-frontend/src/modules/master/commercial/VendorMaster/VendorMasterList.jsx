import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Grid, Typography, Button, Stack } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, btnNew } from 'ui-component/bos';
import axios from 'utils/axios';

const VendorMasterList = ({ type }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Type can be 'customer', 'supplier', or 'subcon'
  const title = type === 'customer' ? 'Customers' : (type === 'supplier' ? 'Suppliers' : 'Subcontractors');
  const createPath = `/master/vendors/${type}/create`;
  const editPath = `/master/vendors/${type}/edit`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/master/vendors?type=${type}`);
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (id) => {
    navigate(`${editPath}/${id}`);
  };

  const columns = [
    { field: 'referenceCode', headerName: 'Reference Code', flex: 1 },
    { field: 'vendorName', headerName: 'Vendor Name', flex: 2 },
    { field: 'shortName', headerName: 'Short Name', flex: 1 },
    { field: 'city', headerName: 'City', flex: 1 },
    { field: 'state', headerName: 'State', flex: 1 },
    { field: 'country', headerName: 'Country', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Button variant="outlined" size="small" onClick={() => handleEdit(params.row.id)}>
          Edit
        </Button>
      )
    }
  ];

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">{title}</Typography>
          <Button variant="contained" onClick={() => navigate(createPath)}>
            + New {title.slice(0, -1)}
          </Button>
        </Stack>
      }
    >
      <BOSDataTable
        columns={columns}
        rows={data}
        loading={loading}
        getRowId={(row) => row.id}
      />
    </MainCard>
  );
};

export default VendorMasterList;
