import React, { useMemo } from 'react';
import {
    Box, Typography, Button, Table, TableHead, TableBody, TableRow, TableCell,
    TableContainer, Paper, IconButton, Chip, Tooltip, alpha, useTheme
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconGripVertical } from '@tabler/icons-react';

const ConditionChip = ({ condition }) => {
    const colorMap = {
        'MIN_MAX': 'primary',
        'MIN': 'info',
        'MAX': 'warning',
        'VISUAL': 'secondary',
        'ANGLE': 'success'
    };
    return condition ? (
        <Chip label={condition.replace('_', '/')} size="small" color={colorMap[condition] || 'default'} variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
    ) : <span style={{ color: '#bbb' }}>-</span>;
};

const InspectionParameterGrid = ({ parameters = [], onAdd, onEdit, onDelete }) => {
    const theme = useTheme();

    const parseStages = (stagesJson) => {
        try {
            const parsed = JSON.parse(stagesJson || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    };

    const fmtNum = (v) => (v != null && v !== '') ? parseFloat(v).toString() : '-';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%' }}>
            {/* Matrix Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 4, height: 18, bgcolor: 'warning.main', borderRadius: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        Inspection Parameters
                    </Typography>
                    <Chip label={parameters.length} size="small" color="warning" variant="filled" sx={{ height: 18, '& .MuiChip-label': { px: 0.8, fontSize: '0.65rem', fontWeight: 700 } }} />
                </Box>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<IconPlus size={15} />}
                    onClick={onAdd}
                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                >
                    Add Parameter
                </Button>
            </Box>

            {/* Table */}
            <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                    width: '100%',
                    flexGrow: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Table size="small" stickyHeader sx={{ minWidth: '100%' }}>
                    <TableHead>
                        <TableRow>
                            {[
                                { label: '#', w: 40 },
                                { label: 'Seq', w: 50 },
                                { label: 'Parameter', w: 160 },
                                { label: 'Alias', w: 100 },
                                { label: 'Group', w: 120 },
                                { label: 'Process', w: 100 },
                                { label: 'Instrument', w: 110 },
                                { label: 'Condition', w: 90 },
                                { label: 'Min', w: 70 },
                                { label: 'Max', w: 70 },
                                { label: 'UOM', w: 60 },
                                { label: 'Stages', w: 120 },
                                { label: 'Actions', w: 80, align: 'center' }
                            ].map(col => (
                                <TableCell
                                    key={col.label}
                                    align={col.align || 'left'}
                                    sx={{
                                        width: col.w,
                                        minWidth: col.w,
                                        bgcolor: theme.palette.warning.main,
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                        textTransform: 'uppercase',
                                        py: 1.2,
                                        whiteSpace: 'nowrap',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 2
                                    }}
                                >
                                    {col.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {parameters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={13} align="center" sx={{ py: 5 }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        No parameters configured yet. Click "Add Parameter" to start.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            parameters
                                .slice()
                                .sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0))
                                .map((param, idx) => {
                                    const stageArr = parseStages(param.inspectionStages);
                                    const isGroupRow = param.groupHeading && (idx === 0 || parameters[idx - 1]?.groupHeading !== param.groupHeading);
                                    return (
                                        <React.Fragment key={idx}>
                                            {isGroupRow && (
                                                <TableRow>
                                                    <TableCell colSpan={13} sx={{
                                                        py: 0.5, px: 2,
                                                        bgcolor: alpha(theme.palette.warning.main, 0.08),
                                                        borderBottom: '1px solid',
                                                        borderColor: alpha(theme.palette.warning.main, 0.25)
                                                    }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'warning.dark', letterSpacing: 0.5 }}>
                                                            ▶ {param.groupHeading}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            <TableRow hover sx={{ '&:last-child td': { border: 0 }, '& td': { fontSize: '0.75rem' } }}>
                                                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{idx + 1}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{param.sequenceNo}</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>
                                                    <Tooltip title={param.parameterName} placement="top">
                                                        <Box sx={{ maxWidth: 155, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {param.parameterName}
                                                        </Box>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>
                                                    <Tooltip title={param.parameterAlias || ''} placement="top">
                                                        <Box sx={{ maxWidth: 95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {param.parameterAlias || '-'}
                                                        </Box>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={param.groupHeading || ''} placement="top">
                                                        <Box sx={{ maxWidth: 115, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.7rem' }}>
                                                            {param.groupHeading || '-'}
                                                        </Box>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={param.processName || ''} placement="top">
                                                        <Box sx={{ maxWidth: 95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {param.processName || (param.processId ? `#${param.processId}` : '-')}
                                                        </Box>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={param.instrumentName || ''} placement="top">
                                                        <Box sx={{ maxWidth: 105, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {param.instrumentName || '-'}
                                                        </Box>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell><ConditionChip condition={param.parameterCondition} /></TableCell>
                                                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtNum(param.minimumValue)}</TableCell>
                                                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{fmtNum(param.maximumValue)}</TableCell>
                                                <TableCell>{param.uomCode || '-'}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                                                        {stageArr.slice(0, 2).map(s => (
                                                            <Chip key={s} label={s.replace('_', ' ')} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 16, '& .MuiChip-label': { px: 0.5 } }} />
                                                        ))}
                                                        {stageArr.length > 2 && (
                                                            <Chip label={`+${stageArr.length - 2}`} size="small" sx={{ fontSize: '0.6rem', height: 16, bgcolor: 'grey.200' }} />
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small" color="primary" onClick={() => onEdit(idx)}>
                                                                <IconEdit size={15} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Remove">
                                                            <IconButton size="small" color="error" onClick={() => onDelete(idx)}>
                                                                <IconTrash size={15} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    );
                                })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default InspectionParameterGrid;
