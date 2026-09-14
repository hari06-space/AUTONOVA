import React, { useState, useEffect } from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MainCard from 'ui-component/cards/MainCard';
import { IconPlus, IconEye, IconEdit } from '@tabler/icons-react';
import useAuth from 'hooks/useAuth';
import useQualityInspectionStore from 'store/purchase/inspection/useQualityInspectionStore';
import BOSDataTable from 'ui-component/bos/BOSDataTable';
import { btnNew } from 'ui-component/bos';
import BOSStatusChip from 'ui-component/bos/BOSStatusChip';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

const QualityInspectionList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { inspections, loading, totalRows, fetchInspections } = useQualityInspectionStore();

    useEffect(() => {
        if (user?.divisionId) {
            fetchInspections({ divisionId: user.divisionId, page: 0, size: 10 });
        }
    }, [user, fetchInspections]);

    const handlePageChange = (newPage, newSize) => {
        fetchInspections({ divisionId: user?.divisionId, page: newPage, size: newSize });
    };

    const handleOpenAdd = () => navigate('/purchase/quality-inspection/form/new');

    useKeyboardShortcuts({
        'ctrl+n': handleOpenAdd
    });

    const columns = [
        { 
            id: 'qiDate', 
            label: 'QI Date', 
            minWidth: 120,
            render: (row) => new Date(row.qiDate).toLocaleDateString()
        },
        { id: 'grnNo', label: 'GRN No', minWidth: 150 },
        { id: 'poNo', label: 'PO No', minWidth: 120 },
        { id: 'supplierName', label: 'Supplier', minWidth: 200 },
        { id: 'itemCode', label: 'Item Code', minWidth: 120 },
        { id: 'itemName', label: 'Item Name', minWidth: 200 },
        { id: 'totalGrnQty', label: 'Total Qty', minWidth: 100, align: 'right' },
        { id: 'totalAcceptedQty', label: 'Accepted', minWidth: 100, align: 'right' },
        { id: 'totalRejectedQty', label: 'Rejected', minWidth: 100, align: 'right' },
        {
            id: 'statusName',
            label: 'Status',
            minWidth: 120,
            render: (row) => <BOSStatusChip status={row.statusName} />
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 100,
            align: 'center',
            render: (_, row) => (
                <Tooltip title="View / Edit">
                    <IconButton
                        color="primary"
                        onClick={() => navigate(`/purchase/quality-inspection/form/${row.grnHeadId || row.id}?txId=${row.id}`)}
                    >
                        {row.statusName === 'COMPLETED' ? <IconEye /> : <IconEdit />}
                    </IconButton>
                </Tooltip>
            )
        }
    ];

    return (
        <MainCard
            fullWidth
            title="Quality Inspection"
            secondary={
                <Tooltip title={shortcutTooltip('Create New Quality Inspection', 'Ctrl + N')}>
                    <Button variant="contained" color="primary" size="medium" sx={btnNew} onClick={handleOpenAdd}>
                        + New
                    </Button>
                </Tooltip>
            }
            pageCode="PP1125"
        >
            <BOSDataTable
                columns={columns}
                rows={inspections}
                loading={loading}
                totalCount={totalRows}
                onPageChange={handlePageChange}
                onDoubleClickRow={(row) => navigate(`/purchase/quality-inspection/form/${row.grnHeadId || row.id}?txId=${row.id}`)}
            />
        </MainCard>
    );
};

export default QualityInspectionList;

