import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip } from '@mui/material';
import { IconPlus, IconEye } from '@tabler/icons-react';

import MainCard from 'ui-component/cards/MainCard';
import BOSDataTable from 'ui-component/bos/BOSDataTable';
import useSupplierReturnStore from 'store/purchase/useSupplierReturnStore';
import useAuth from 'hooks/useAuth';

const SupplierReturnList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { returnsList, totalRecords, loading, getAllReturns } = useSupplierReturnStore();

    useEffect(() => {
        if (user?.divisionId) {
            getAllReturns(user.divisionId, 0, 10);
        }
    }, [user, getAllReturns]);

    const handlePageChange = (newPage, newSize) => {
        getAllReturns(user?.divisionId, newPage, newSize);
    };

    const columns = [
        { id: 'returnNo', label: 'Return No', minWidth: 150 },
        { 
            id: 'returnDate', 
            label: 'Date', 
            minWidth: 120,
            render: (row) => new Date(row.returnDate).toLocaleDateString()
        },
        { id: 'supplierName', label: 'Supplier', minWidth: 200 },
        { id: 'qiNo', label: 'QI No', minWidth: 150 },
        { id: 'grnNo', label: 'GRN No', minWidth: 150 },
        { id: 'poNo', label: 'PO No', minWidth: 150 },
        { 
            id: 'returnType', 
            label: 'Return Type', 
            minWidth: 150,
            render: (row) => (
                <Chip 
                    label={row.returnType === 'ACCEPTED_STOCK' ? 'Accepted Stock' : 'Rejected Stock'} 
                    color={row.returnType === 'ACCEPTED_STOCK' ? 'primary' : 'error'}
                    size="small" 
                    variant="outlined"
                />
            )
        },
        { id: 'totalQty', label: 'Total Qty', minWidth: 100, align: 'right' },
        { id: 'totalAmount', label: 'Amount', minWidth: 120, align: 'right' },
        { 
            id: 'statusName', 
            label: 'Status', 
            minWidth: 120,
            render: (row) => (
                <Chip 
                    label={row.statusName} 
                    color={row.statusName === 'POSTED' ? 'success' : row.statusName === 'DRAFT' ? 'default' : 'primary'}
                    size="small" 
                />
            )
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 100,
            align: 'center',
            render: (_, row) => (
                <Button 
                    size="small" 
                    variant="outlined" 
                    startIcon={<IconEye size="1rem" />}
                    onClick={() => navigate(`/purchase/supplier-return/${row.id}`)}
                >
                    View
                </Button>
            )
        }
    ];

    return (
        <MainCard 
            title="Supplier Returns" 
            pageCode="HA1135" // Assuming new page code
            secondary={
                <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<IconPlus />}
                    onClick={() => navigate('/purchase/quality-inspection')} // User must create from QI
                >
                    New From QI
                </Button>
            }
        >
            <Box>
                <BOSDataTable
                    columns={columns}
                    data={returnsList}
                    loading={loading}
                    totalRecords={totalRecords}
                    onPageChange={handlePageChange}
                    onDoubleClickRow={(row) => navigate(`/purchase/supplier-return/${row.id}`)}
                />
            </Box>
        </MainCard>
    );
};

export default SupplierReturnList;
