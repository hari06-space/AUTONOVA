import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, 
    CircularProgress, Typography, Box, Paper, IconButton, Chip, Collapse, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { 
    Timeline, TimelineItem, TimelineSeparator, 
    TimelineConnector, TimelineContent, TimelineDot, timelineItemClasses
} from '@mui/lab';
import { useNavigate } from 'react-router-dom';
import axios from 'utils/axios';
import {
    DescriptionOutlined,
    AssignmentOutlined,
    RequestQuoteOutlined,
    GavelOutlined,
    CompareArrowsOutlined,
    ShoppingCartOutlined,
    CheckCircle,
    Cancel,
    Schedule,
    ExpandMore,
    ExpandLess,
    ErrorOutline,
    LocalShippingOutlined,
    SearchOutlined,
    InventoryOutlined,
    FactCheckOutlined
} from '@mui/icons-material';

const pulseAnimation = `
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.2); }
    70% { box-shadow: 0 0 0 10px rgba(0, 0, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
  }
`;

const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('approved') || s.includes('closed') || s.includes('verified')) return 'success';
    if (s.includes('rejected') || s.includes('cancelled')) return 'error';
    if (s.includes('draft')) return 'default';
    return 'warning';
};

const StatusIconSmall = ({ status }) => {
    const color = getStatusColor(status);
    if (color === 'success') return <CheckCircle fontSize="inherit" color="success" />;
    if (color === 'error') return <Cancel fontSize="inherit" color="error" />;
    return <Schedule fontSize="inherit" color={color === 'default' ? 'disabled' : 'warning'} />;
};

const AuditInfo = ({ createdBy, createdDate }) => {
    if (!createdBy && !createdDate) return null;
    const formattedDate = createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(createdDate)) : '';
    return (
        <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic', fontSize: '0.75rem', opacity: 0.8 }}>
            {createdBy ? `Created by ${createdBy}` : ''} {formattedDate ? `on ${formattedDate}` : ''}
        </Typography>
    );
};

const PurchaseRequestLifecycleTimeline = ({ open, onClose, prId, prNo }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [expandedRfqs, setExpandedRfqs] = useState({});

    useEffect(() => {
        if (open && prId) {
            fetchLifecycle();
        }
    }, [open, prId]);

    const fetchLifecycle = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/purchase/pr/${prId}/lifecycle`);
            setData(response.data);
            
            // Expand all RFQs by default
            if (response.data?.rfqs) {
                const exp = {};
                response.data.rfqs.forEach(r => exp[r.rfqId] = true);
                setExpandedRfqs(exp);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch tracking data');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkClick = (path) => {
        navigate(path);
        onClose();
    };

    const toggleRfq = (id) => {
        setExpandedRfqs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderTimeline = () => {
        if (!data) return null;

        const isComplete = data.rfqs && data.rfqs.some(r => r.comparisons && r.comparisons.length > 0);

        return (
            <Timeline 
                sx={{ 
                    p: 0, 
                    [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 } 
                }}
            >
                <style>{pulseAnimation}</style>
                
                {/* PR Node */}
                <TimelineItem>
                    <TimelineSeparator>
                        <TimelineDot 
                            sx={{ 
                                bgcolor: '#6366f1', 
                                p: 1.5, 
                                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                                animation: !data.rfqs?.length ? 'pulse 2s infinite' : 'none'
                            }}
                        >
                            <DescriptionOutlined sx={{ color: '#fff', fontSize: 24 }} />
                        </TimelineDot>
                        <TimelineConnector sx={{ bgcolor: '#6366f1', width: 3 }} />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 3 }}>
                        <Paper 
                            elevation={0} 
                            sx={{ 
                                p: 2.5, 
                                borderRadius: 3, 
                                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                                border: '1px solid #c7d2fe',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 16px rgba(99,102,241,0.1)' }
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="overline" color="textSecondary" fontWeight="bold">Stage 1</Typography>
                                    <Typography variant="h5" color="#3730a3" fontWeight="bold">Purchase Request</Typography>
                                    <Typography 
                                        variant="subtitle2" 
                                        color="#4338ca"
                                        sx={{ mt: 0.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}
                                        onClick={() => handleLinkClick(`/purchase/pr/entry/${data.prId}`)}
                                    >
                                        {data.prNo}
                                    </Typography>
                                    <AuditInfo createdBy={data.prCreatedBy} createdDate={data.prCreatedDate} />
                                    {(data.prStatus === 'Verified' || data.prVerifierName) && (
                                        <Typography variant="caption" display="block" color="success.main" sx={{ mt: 0.5, fontStyle: 'italic', fontSize: '0.75rem', fontWeight: 600 }}>
                                            <CheckCircle sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                                            Verified {data.prVerifierName ? `by ${data.prVerifierName}` : ''} {data.prVerifiedDate ? `on ${new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(data.prVerifiedDate))}` : ''}
                                        </Typography>
                                    )}
                                </Box>
                                <Chip 
                                    label={data.prStatus || 'Draft'} 
                                    color={getStatusColor(data.prStatus)} 
                                    size="small" 
                                    sx={{ fontWeight: 'bold' }} 
                                    icon={<StatusIconSmall status={data.prStatus} />}
                                />
                            </Box>
                        </Paper>
                    </TimelineContent>
                </TimelineItem>

                {(!data.rfqs || data.rfqs.length === 0) && (
                    <TimelineItem>
                        <TimelineSeparator>
                            <TimelineDot variant="outlined" sx={{ borderColor: '#cbd5e1', p: 1 }} />
                        </TimelineSeparator>
                        <TimelineContent sx={{ py: '12px', px: 3 }}>
                            <Typography variant="body2" color="textSecondary" fontStyle="italic" sx={{ pt: 1 }}>
                                Pending RFQ Generation...
                            </Typography>
                        </TimelineContent>
                    </TimelineItem>
                )}

                {/* RFQ Nodes */}
                {data.rfqs?.map((rfq, index) => {
                    const isLastRfq = index === data.rfqs.length - 1;
                    const expanded = expandedRfqs[rfq.rfqId];
                    const activeRfq = isLastRfq && !rfq.comparisons?.length;

                    return (
                        <React.Fragment key={`rfq-${rfq.rfqId}`}>
                            <TimelineItem>
                                <TimelineSeparator>
                                    <TimelineDot 
                                        sx={{ 
                                            bgcolor: '#ec4899', 
                                            p: 1.5,
                                            boxShadow: '0 4px 12px rgba(236,72,153,0.4)',
                                            animation: activeRfq ? 'pulse 2s infinite' : 'none'
                                        }}
                                    >
                                        <AssignmentOutlined sx={{ color: '#fff', fontSize: 24 }} />
                                    </TimelineDot>
                                    <TimelineConnector sx={{ bgcolor: expanded ? '#fbcfe8' : '#cbd5e1', width: 3 }} />
                                </TimelineSeparator>
                                <TimelineContent sx={{ py: '12px', px: 3 }}>
                                    <Paper 
                                        elevation={0} 
                                        sx={{ 
                                            p: 2.5, 
                                            borderRadius: 3, 
                                            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                                            border: '1px solid #fbcfe8',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 16px rgba(236,72,153,0.1)' }
                                        }}
                                        onClick={() => toggleRfq(rfq.rfqId)}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="overline" color="textSecondary" fontWeight="bold">Stage 2</Typography>
                                                <Typography variant="h5" color="#831843" fontWeight="bold">Request for Quotation</Typography>
                                                <Typography 
                                                    variant="subtitle2" 
                                                    color="#be185d"
                                                    sx={{ mt: 0.5, display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}
                                                    onClick={(e) => { e.stopPropagation(); handleLinkClick(`/purchase/rfq/entry/${rfq.rfqId}`); }}
                                                >
                                                    {rfq.rfqNo}
                                                </Typography>
                                                <AuditInfo createdBy={rfq.createdBy} createdDate={rfq.createdDate} />
                                            </Box>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Chip 
                                                    label={rfq.rfqStatus || 'Draft'} 
                                                    color={getStatusColor(rfq.rfqStatus)} 
                                                    size="small" 
                                                    sx={{ fontWeight: 'bold' }}
                                                    icon={<StatusIconSmall status={rfq.rfqStatus} />}
                                                />
                                                <IconButton size="small" color="secondary" onClick={(e) => { e.stopPropagation(); toggleRfq(rfq.rfqId); }}>
                                                    {expanded ? <ExpandLess /> : <ExpandMore />}
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </TimelineContent>
                            </TimelineItem>

                            {/* Collapsible Children */}
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                                
                                {/* Quotations */}
                                {rfq.quotations && rfq.quotations.length > 0 && (
                                    <TimelineItem>
                                        <TimelineSeparator>
                                            <TimelineDot sx={{ bgcolor: '#0ea5e9', p: 1, ml: 2 }}>
                                                <RequestQuoteOutlined sx={{ color: '#fff', fontSize: 18 }} />
                                            </TimelineDot>
                                            <TimelineConnector sx={{ bgcolor: '#bae6fd', width: 2, ml: 2 }} />
                                        </TimelineSeparator>
                                        <TimelineContent sx={{ py: 1, px: 3 }}>
                                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f0f9ff', border: '1px dashed #7dd3fc' }}>
                                                <Typography variant="subtitle2" color="#0369a1" fontWeight="bold" mb={1.5}>
                                                    Received Quotations ({rfq.quotations.length})
                                                </Typography>
                                                <Box display="flex" flexWrap="wrap" gap={1}>
                                                    {rfq.quotations.map(q => (
                                                        <Box key={q.quotationId} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff', p: 1, borderRadius: 2, border: '1px solid #e0f2fe' }}>
                                                            <Chip
                                                                label={`${q.quotationNo} (${q.supplierName})`}
                                                                onClick={() => handleLinkClick(`/purchase/quotation/entry/${q.quotationId}`)}
                                                                color={getStatusColor(q.quotationStatus)}
                                                                variant="outlined"
                                                                sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#e0f2fe' }, mb: 0.5, justifyContent: 'flex-start' }}
                                                                icon={<StatusIconSmall status={q.quotationStatus} />}
                                                            />
                                                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', pl: 0.5 }}>
                                                                Created by {q.createdBy || 'System'} on {q.createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(q.createdDate)) : 'Unknown'}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        </TimelineContent>
                                    </TimelineItem>
                                )}

                                {/* Negotiations */}
                                {rfq.negotiations && rfq.negotiations.length > 0 && (
                                    <TimelineItem>
                                        <TimelineSeparator>
                                            <TimelineDot sx={{ bgcolor: '#f59e0b', p: 1, ml: 2 }}>
                                                <GavelOutlined sx={{ color: '#fff', fontSize: 18 }} />
                                            </TimelineDot>
                                            <TimelineConnector sx={{ bgcolor: '#fde68a', width: 2, ml: 2 }} />
                                        </TimelineSeparator>
                                        <TimelineContent sx={{ py: 1, px: 3 }}>
                                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fffbeb', border: '1px dashed #fcd34d' }}>
                                                <Typography variant="subtitle2" color="#b45309" fontWeight="bold" mb={1.5}>
                                                    Negotiation Rounds ({rfq.negotiations.length})
                                                </Typography>
                                                <Box display="flex" flexWrap="wrap" gap={1}>
                                                    {rfq.negotiations.map(n => (
                                                        <Box key={n.negotiationId} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff', p: 1, borderRadius: 2, border: '1px solid #fef3c7' }}>
                                                            <Chip
                                                                label={`${n.negotiationNo} (Round ${n.negotiationRound})`}
                                                                onClick={() => handleLinkClick(`/purchase/negotiation/entry/${n.negotiationId}`)}
                                                                color={getStatusColor(n.negotiationStatus)}
                                                                variant="outlined"
                                                                sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#fef3c7' }, mb: 0.5, justifyContent: 'flex-start' }}
                                                                icon={<StatusIconSmall status={n.negotiationStatus} />}
                                                            />
                                                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', pl: 0.5 }}>
                                                                Created by {n.createdBy || 'System'} on {n.createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(n.createdDate)) : 'Unknown'}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        </TimelineContent>
                                    </TimelineItem>
                                )}

                                {/* Comparisons */}
                                {rfq.comparisons && rfq.comparisons.length > 0 && (
                                    <TimelineItem>
                                        <TimelineSeparator>
                                            <TimelineDot sx={{ bgcolor: '#10b981', p: 1, ml: 2 }}>
                                                <CompareArrowsOutlined sx={{ color: '#fff', fontSize: 18 }} />
                                            </TimelineDot>
                                            {(!isLastRfq || (rfq.purchaseOrders && rfq.purchaseOrders.length > 0)) && (
                                                <TimelineConnector sx={{ bgcolor: (rfq.purchaseOrders && rfq.purchaseOrders.length > 0) ? '#a7f3d0' : '#cbd5e1', width: (rfq.purchaseOrders && rfq.purchaseOrders.length > 0) ? 2 : 3, ml: (rfq.purchaseOrders && rfq.purchaseOrders.length > 0) ? 2 : -2 }} />
                                            )}
                                        </TimelineSeparator>
                                        <TimelineContent sx={{ py: 1, px: 3 }}>
                                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#ecfdf5', border: '1px dashed #6ee7b7' }}>
                                                <Typography variant="subtitle2" color="#047857" fontWeight="bold" mb={1.5}>
                                                    Quote Comparison
                                                </Typography>
                                                <Box display="flex" flexWrap="wrap" gap={1}>
                                                    {rfq.comparisons.map(c => (
                                                        <Box key={c.comparisonId} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff', p: 1, borderRadius: 2, border: '1px solid #d1fae5' }}>
                                                            <Chip
                                                                label={c.comparisonNo}
                                                                onClick={() => handleLinkClick(`/purchase/comparison/entry/${c.comparisonId}`)}
                                                                color={getStatusColor(c.comparisonStatus)}
                                                                variant="outlined"
                                                                sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#d1fae5' }, mb: 0.5, justifyContent: 'flex-start' }}
                                                                icon={<StatusIconSmall status={c.comparisonStatus} />}
                                                            />
                                                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', pl: 0.5 }}>
                                                                Created by {c.createdBy || 'System'} on {c.createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(c.createdDate)) : 'Unknown'}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        </TimelineContent>
                                    </TimelineItem>
                                )}

                                {/* Purchase Orders */}
                                {rfq.purchaseOrders && rfq.purchaseOrders.length > 0 && (
                                    <TimelineItem>
                                        <TimelineSeparator>
                                            <TimelineDot sx={{ bgcolor: '#8b5cf6', p: 1, ml: 2 }}>
                                                <ShoppingCartOutlined sx={{ color: '#fff', fontSize: 18 }} />
                                            </TimelineDot>
                                            {(!isLastRfq || (rfq.purchaseOrders && rfq.purchaseOrders.some(po => po.gateEntries && po.gateEntries.length > 0))) && (
                                                <TimelineConnector sx={{ bgcolor: (rfq.purchaseOrders && rfq.purchaseOrders.some(po => po.gateEntries && po.gateEntries.length > 0)) ? '#ddd6fe' : '#cbd5e1', width: (rfq.purchaseOrders && rfq.purchaseOrders.some(po => po.gateEntries && po.gateEntries.length > 0)) ? 2 : 3, ml: (rfq.purchaseOrders && rfq.purchaseOrders.some(po => po.gateEntries && po.gateEntries.length > 0)) ? 2 : -2 }} />
                                            )}
                                        </TimelineSeparator>
                                        <TimelineContent sx={{ py: 1, px: 3 }}>
                                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f3ff', border: '1px dashed #c4b5fd' }}>
                                                <Typography variant="subtitle2" color="#5b21b6" fontWeight="bold" mb={1.5}>
                                                    Purchase Orders ({rfq.purchaseOrders.length})
                                                </Typography>
                                                <Box display="flex" flexWrap="wrap" gap={1}>
                                                    {rfq.purchaseOrders.map(po => (
                                                        <Box key={po.poId} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff', p: 1, borderRadius: 2, border: '1px solid #ddd6fe' }}>
                                                            <Chip
                                                                label={`${po.poNo} (${po.supplierName})`}
                                                                onClick={() => handleLinkClick(`/purchase/purchaseorder/entry/${po.poId}`)}
                                                                color={getStatusColor(po.poStatus)}
                                                                variant="outlined"
                                                                sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#ede9fe' }, mb: 0.5, justifyContent: 'flex-start' }}
                                                                icon={<StatusIconSmall status={po.poStatus} />}
                                                            />
                                                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', pl: 0.5 }}>
                                                                Created by {po.createdBy || 'System'} on {po.createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(po.createdDate)) : 'Unknown'}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        </TimelineContent>
                                    </TimelineItem>
                                )}

                                {/* Downstream Flow (Gate Entry -> Incoming Inspection -> GRN -> Quality Inspection) */}
                                {(() => {
                                    if (!rfq.purchaseOrders || rfq.purchaseOrders.length === 0) return null;
                                    
                                    const allGateEntries = [];
                                    const allGrns = [];
                                    const allQualityInspections = [];

                                    rfq.purchaseOrders.forEach(po => {
                                        if (po.gateEntries) {
                                            allGateEntries.push(...po.gateEntries);
                                            po.gateEntries.forEach(ge => {
                                                if (ge.grns) {
                                                    allGrns.push(...ge.grns);
                                                }
                                            });
                                        }
                                    });

                                    return (
                                        <React.Fragment>
                                            {/* Gate Entries */}
                                            {allGateEntries.length > 0 && (
                                                <TimelineItem>
                                                    <TimelineSeparator>
                                                        <TimelineDot sx={{ bgcolor: '#f97316', p: 1, ml: 2 }}>
                                                            <LocalShippingOutlined sx={{ color: '#fff', fontSize: 18 }} />
                                                        </TimelineDot>
                                                        {(!isLastRfq || allGrns.length > 0) && (
                                                            <TimelineConnector sx={{ bgcolor: allGrns.length > 0 ? '#fed7aa' : '#cbd5e1', width: allGrns.length > 0 ? 2 : 3, ml: allGrns.length > 0 ? 2 : -2 }} />
                                                        )}
                                                    </TimelineSeparator>
                                                    <TimelineContent sx={{ py: 1, px: 3 }}>
                                                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fff7ed', border: '1px dashed #fdba74' }}>
                                                            <Typography variant="subtitle2" color="#c2410c" fontWeight="bold" mb={1.5}>
                                                                Gate Entries ({allGateEntries.length})
                                                            </Typography>
                                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                                {allGateEntries.map(ge => (
                                                                    <Box key={ge.gateEntryId} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff', p: 1, borderRadius: 2, border: '1px solid #fed7aa' }}>
                                                                        <Chip
                                                                            label={ge.gateEntryNo}
                                                                            onClick={() => handleLinkClick(`/purchase/gateentry/entry/${ge.gateEntryId}`)}
                                                                            color={getStatusColor(ge.gateEntryStatus)}
                                                                            variant="outlined"
                                                                            sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#ffedd5' }, mb: 0.5, justifyContent: 'flex-start' }}
                                                                            icon={<StatusIconSmall status={ge.gateEntryStatus} />}
                                                                        />
                                                                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', pl: 0.5 }}>
                                                                            Created by {ge.createdBy || 'System'} on {ge.createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ge.createdDate)) : 'Unknown'}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </TimelineContent>
                                                </TimelineItem>
                                            )}



                                            {/* GRNs */}
                                            {allGrns.length > 0 && (
                                                <TimelineItem>
                                                    <TimelineSeparator>
                                                        <TimelineDot sx={{ bgcolor: '#65a30d', p: 1, ml: 2 }}>
                                                            <InventoryOutlined sx={{ color: '#fff', fontSize: 18 }} />
                                                        </TimelineDot>
                                                        {(!isLastRfq || allQualityInspections.length > 0) && (
                                                            <TimelineConnector sx={{ bgcolor: allQualityInspections.length > 0 ? '#d9f99d' : '#cbd5e1', width: allQualityInspections.length > 0 ? 2 : 3, ml: allQualityInspections.length > 0 ? 2 : -2 }} />
                                                        )}
                                                    </TimelineSeparator>
                                                    <TimelineContent sx={{ py: 1, px: 3 }}>
                                                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f7fee7', border: '1px dashed #bef264' }}>
                                                            <Typography variant="subtitle2" color="#4d7c0f" fontWeight="bold" mb={1.5}>
                                                                Goods Receipt Notes ({allGrns.length})
                                                            </Typography>
                                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                                {allGrns.map(grn => (
                                                                    <Box key={grn.grnId} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff', p: 1, borderRadius: 2, border: '1px solid #d9f99d' }}>
                                                                        <Chip
                                                                            label={grn.grnNo}
                                                                            onClick={() => handleLinkClick(`/purchase/grn/entry/${grn.grnId}`)}
                                                                            color={getStatusColor(grn.grnStatus)}
                                                                            variant="outlined"
                                                                            sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#ecfccb' }, mb: 0.5, justifyContent: 'flex-start' }}
                                                                            icon={<StatusIconSmall status={grn.grnStatus} />}
                                                                        />
                                                                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', pl: 0.5 }}>
                                                                            Created by {grn.createdBy || 'System'} on {grn.createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(grn.createdDate)) : 'Unknown'}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </TimelineContent>
                                                </TimelineItem>
                                            )}

                                            {/* Quality Inspections */}
                                            {allQualityInspections.length > 0 && (
                                                <TimelineItem>
                                                    <TimelineSeparator>
                                                        <TimelineDot sx={{ bgcolor: '#2563eb', p: 1, ml: 2 }}>
                                                            <FactCheckOutlined sx={{ color: '#fff', fontSize: 18 }} />
                                                        </TimelineDot>
                                                        {!isLastRfq && (
                                                            <TimelineConnector sx={{ bgcolor: '#cbd5e1', width: 3, ml: -2 }} />
                                                        )}
                                                    </TimelineSeparator>
                                                    <TimelineContent sx={{ py: 1, px: 3 }}>
                                                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff', border: '1px dashed #93c5fd' }}>
                                                            <Typography variant="subtitle2" color="#1d4ed8" fontWeight="bold" mb={1.5}>
                                                                Quality Inspections ({allQualityInspections.length})
                                                            </Typography>
                                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                                {allQualityInspections.map(qi => (
                                                                    <Box key={qi.qualityInspectionId} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff', p: 1, borderRadius: 2, border: '1px solid #bfdbfe' }}>
                                                                        <Chip
                                                                            label={qi.qualityInspectionNo}
                                                                            onClick={() => handleLinkClick(`/purchase/qualityinspection/entry/${qi.qualityInspectionId}`)}
                                                                            color={getStatusColor(qi.qualityInspectionStatus)}
                                                                            variant="outlined"
                                                                            sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#dbeafe' }, mb: 0.5, justifyContent: 'flex-start' }}
                                                                            icon={<StatusIconSmall status={qi.qualityInspectionStatus} />}
                                                                        />
                                                                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', pl: 0.5 }}>
                                                                            Created by {qi.createdBy || 'System'} on {qi.createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(qi.createdDate)) : 'Unknown'}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </TimelineContent>
                                                </TimelineItem>
                                            )}
                                        </React.Fragment>
                                    );
                                })()}
                            </Collapse>
                        </React.Fragment>
                    );
                })}

                {/* Direct Purchase Orders (without RFQ) */}
                {data.directPurchaseOrders?.map((po, index) => {
                    const expanded = expandedRfqs['direct-' + po.poId];
                    const activePO = index === data.directPurchaseOrders.length - 1;

                    return (
                        <React.Fragment key={`direct-po-${po.poId}`}>
                            <TimelineItem>
                                <TimelineSeparator>
                                    <TimelineDot 
                                        sx={{ 
                                            bgcolor: '#f59e0b', 
                                            p: 1.5,
                                            boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
                                            animation: activePO ? 'pulse 2s infinite' : 'none'
                                        }}
                                    >
                                        <ShoppingCartOutlined sx={{ color: '#fff', fontSize: 24 }} />
                                    </TimelineDot>
                                    <TimelineConnector sx={{ bgcolor: expanded ? '#fde68a' : '#cbd5e1', width: 3 }} />
                                </TimelineSeparator>
                                <TimelineContent sx={{ py: '12px', px: 3 }}>
                                    <Paper 
                                        elevation={0} 
                                        sx={{ 
                                            p: 2.5, 
                                            borderRadius: 3, 
                                            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                            border: '1px solid #fde68a',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 16px rgba(245,158,11,0.1)' }
                                        }}
                                        onClick={() => toggleRfq('direct-' + po.poId)}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="overline" color="textSecondary" fontWeight="bold">Direct Procure</Typography>
                                                <Typography variant="h5" color="#b45309" fontWeight="bold">Purchase Order (Direct)</Typography>
                                                <Typography 
                                                    variant="subtitle2" 
                                                    color="#d97706"
                                                    sx={{ mt: 0.5, display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}
                                                    onClick={(e) => { e.stopPropagation(); handleLinkClick(`/purchase/po/entry/${po.poId}`); }}
                                                >
                                                    {po.poNo}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                                    Supplier: <strong>{po.supplierName}</strong>
                                                </Typography>
                                                <AuditInfo createdBy={po.createdBy} createdDate={po.createdDate} />
                                            </Box>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Chip 
                                                    label={po.poStatus || 'Draft'} 
                                                    color={getStatusColor(po.poStatus)} 
                                                    size="small" 
                                                    sx={{ fontWeight: 'bold' }}
                                                    icon={<StatusIconSmall status={po.poStatus} />}
                                                />
                                                <IconButton size="small" sx={{ color: '#b45309', bgcolor: 'rgba(251,191,36,0.2)' }}>
                                                    {expanded ? <ExpandLess /> : <ExpandMore />}
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </TimelineContent>
                            </TimelineItem>

                            {/* Downstream nodes for Direct PO */}
                            <Collapse in={expanded} unmountOnExit>
                                {(() => {
                                    const gateEntries = po.gateEntries || [];
                                    const allGrns = gateEntries.flatMap(ge => ge.grns || []);
                                    const allQualityInspections = allGrns.flatMap(grn => grn.qualityInspections || []);

                                    return (
                                        <React.Fragment>
                                            {/* Gate Entries */}
                                            {gateEntries.length > 0 && (
                                                <TimelineItem>
                                                    <TimelineSeparator>
                                                        <TimelineDot sx={{ bgcolor: '#8b5cf6', p: 1, ml: 2 }}>
                                                            <LocalShippingOutlined sx={{ color: '#fff', fontSize: 18 }} />
                                                        </TimelineDot>
                                                        <TimelineConnector sx={{ bgcolor: '#cbd5e1', width: 3, ml: -2 }} />
                                                    </TimelineSeparator>
                                                    <TimelineContent sx={{ py: 1, px: 3 }}>
                                                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f5f3ff', border: '1px dashed #c4b5fd' }}>
                                                            <Typography variant="subtitle2" color="#6d28d9" fontWeight="bold" mb={1.5}>
                                                                Gate Entries ({gateEntries.length})
                                                            </Typography>
                                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                                {gateEntries.map(ge => (
                                                                    <Box key={ge.gateEntryId} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff', p: 1, borderRadius: 2, border: '1px solid #ddd6fe' }}>
                                                                        <Chip
                                                                            label={ge.gateEntryNo}
                                                                            onClick={() => handleLinkClick(`/purchase/gateentry/entry/${ge.gateEntryId}`)}
                                                                            color={getStatusColor(ge.gateEntryStatus)}
                                                                            variant="outlined"
                                                                            sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#ede9fe' }, mb: 0.5, justifyContent: 'flex-start' }}
                                                                            icon={<StatusIconSmall status={ge.gateEntryStatus} />}
                                                                        />
                                                                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', pl: 0.5 }}>
                                                                            Created by {ge.createdBy || 'System'} on {ge.createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ge.createdDate)) : 'Unknown'}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </TimelineContent>
                                                </TimelineItem>
                                            )}

                                            {/* GRNs */}
                                            {allGrns.length > 0 && (
                                                <TimelineItem>
                                                    <TimelineSeparator>
                                                        <TimelineDot sx={{ bgcolor: '#10b981', p: 1, ml: 2 }}>
                                                            <InventoryOutlined sx={{ color: '#fff', fontSize: 18 }} />
                                                        </TimelineDot>
                                                        <TimelineConnector sx={{ bgcolor: '#cbd5e1', width: 3, ml: -2 }} />
                                                    </TimelineSeparator>
                                                    <TimelineContent sx={{ py: 1, px: 3 }}>
                                                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#ecfdf5', border: '1px dashed #6ee7b7' }}>
                                                            <Typography variant="subtitle2" color="#047857" fontWeight="bold" mb={1.5}>
                                                                Goods Receipt Notes ({allGrns.length})
                                                            </Typography>
                                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                                {allGrns.map(grn => (
                                                                    <Box key={grn.grnId} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff', p: 1, borderRadius: 2, border: '1px solid #a7f3d0' }}>
                                                                        <Chip
                                                                            label={grn.grnNo}
                                                                            onClick={() => handleLinkClick(`/purchase/grn/entry/${grn.grnId}`)}
                                                                            color={getStatusColor(grn.grnStatus)}
                                                                            variant="outlined"
                                                                            sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#d1fae5' }, mb: 0.5, justifyContent: 'flex-start' }}
                                                                            icon={<StatusIconSmall status={grn.grnStatus} />}
                                                                        />
                                                                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', pl: 0.5 }}>
                                                                            Created by {grn.createdBy || 'System'} on {grn.createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(grn.createdDate)) : 'Unknown'}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </TimelineContent>
                                                </TimelineItem>
                                            )}

                                            {/* Quality Inspections */}
                                            {allQualityInspections.length > 0 && (
                                                <TimelineItem>
                                                    <TimelineSeparator>
                                                        <TimelineDot sx={{ bgcolor: '#2563eb', p: 1, ml: 2 }}>
                                                            <FactCheckOutlined sx={{ color: '#fff', fontSize: 18 }} />
                                                        </TimelineDot>
                                                        {/* Don't show connector for the very last item */}
                                                    </TimelineSeparator>
                                                    <TimelineContent sx={{ py: 1, px: 3 }}>
                                                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff', border: '1px dashed #93c5fd' }}>
                                                            <Typography variant="subtitle2" color="#1d4ed8" fontWeight="bold" mb={1.5}>
                                                                Quality Inspections ({allQualityInspections.length})
                                                            </Typography>
                                                            <Box display="flex" flexWrap="wrap" gap={1}>
                                                                {allQualityInspections.map(qi => (
                                                                    <Box key={qi.qualityInspectionId} sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#fff', p: 1, borderRadius: 2, border: '1px solid #bfdbfe' }}>
                                                                        <Chip
                                                                            label={qi.qualityInspectionNo}
                                                                            onClick={() => handleLinkClick(`/purchase/qualityinspection/entry/${qi.qualityInspectionId}`)}
                                                                            color={getStatusColor(qi.qualityInspectionStatus)}
                                                                            variant="outlined"
                                                                            sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#dbeafe' }, mb: 0.5, justifyContent: 'flex-start' }}
                                                                            icon={<StatusIconSmall status={qi.qualityInspectionStatus} />}
                                                                        />
                                                                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', pl: 0.5 }}>
                                                                            Created by {qi.createdBy || 'System'} on {qi.createdDate ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(qi.createdDate)) : 'Unknown'}
                                                                        </Typography>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </TimelineContent>
                                                </TimelineItem>
                                            )}
                                        </React.Fragment>
                                    );
                                })()}
                            </Collapse>
                        </React.Fragment>
                    );
                })}
            </Timeline>
        );
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }
            }}
        >
            <DialogTitle sx={{ 
                m: 0, 
                p: 3, 
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#fff',
                position: 'relative'
            }}>
                <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
                    Procurement Lifecycle Tracker
                </Typography>
                <Typography variant="subtitle2" sx={{ color: '#94a3b8', mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionOutlined fontSize="small" /> Tracking {prNo}
                </Typography>
                
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 16,
                        top: 16,
                        color: '#cbd5e1',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 0, bgcolor: '#f8fafc', borderTop: 'none' }}>
                <Box sx={{ p: { xs: 2, sm: 4 }, minHeight: '400px' }}>
                    {loading ? (
                        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                            <CircularProgress size={48} thickness={4} sx={{ color: '#6366f1' }} />
                            <Typography color="textSecondary" mt={2} fontWeight="500">Mapping Lifecycle...</Typography>
                        </Box>
                    ) : error ? (
                        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" bgcolor="#fef2f2" p={4} borderRadius={3} border="1px dashed #fca5a5">
                            <ErrorOutline sx={{ fontSize: 48, color: '#ef4444', mb: 2 }} />
                            <Typography color="error" fontWeight="bold">{error}</Typography>
                        </Box>
                    ) : (
                        renderTimeline()
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default PurchaseRequestLifecycleTimeline;
