import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, TextField, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { IconX } from '@tabler/icons-react';

import { useSnackbar } from 'notistack';

const TestReportDialog = ({ open, onClose, testReports, onSave }) => {
    const { enqueueSnackbar } = useSnackbar();
    // Local state for the test reports so we can edit them before saving
    const [localReports, setLocalReports] = useState([]);

    useEffect(() => {
        if (open && Array.isArray(testReports)) {
            // Deep copy to avoid mutating prop directly
            const copied = testReports.map(report => {
                let resultsArray = [];
                try {
                    // Load observation instead of result for JSON array
                    if (report.observation) {
                        resultsArray = JSON.parse(report.observation);
                    } else if (report.result && report.result.startsWith('[')) {
                        // Fallback for older data that might still be in result
                        resultsArray = JSON.parse(report.result);
                    }
                } catch (e) {
                    console.error("Failed to parse observation", e);
                }

                const size = report.sampleSize || 1;
                while (resultsArray.length < size) {
                    resultsArray.push('');
                }
                if (resultsArray.length > size) {
                    resultsArray = resultsArray.slice(0, size);
                }

                return {
                    ...report,
                    _parsedResults: resultsArray,
                    // ensure result field exists for the single text input
                    result: (report.result && !report.result.startsWith('[')) ? report.result : ''
                };
            });
            setLocalReports(copied);
        }
    }, [open, testReports]);

    const handleObservationChange = (reportIndex, sampleIndex, value) => {
        const updated = [...localReports];
        updated[reportIndex]._parsedResults[sampleIndex] = value;
        setLocalReports(updated);
    };

    const handleObservationBlur = (reportIndex, sampleIndex, value) => {
        const report = localReports[reportIndex];
        if (!value || value.trim() === '') return;

        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;

        let hasError = false;
        if (report.minVal !== null && report.minVal !== undefined && numValue < report.minVal) {
            hasError = true;
        }
        if (report.maxVal !== null && report.maxVal !== undefined && numValue > report.maxVal) {
            hasError = true;
        }

        if (hasError) {
            enqueueSnackbar(`${report.parameterName || 'Value'} must be between ${report.minVal} and ${report.maxVal}`, { variant: 'error' });
            const updated = [...localReports];
            updated[reportIndex]._parsedResults[sampleIndex] = '';
            setLocalReports(updated);
        }
    };

    const handleResultChange = (reportIndex, value) => {
        const updated = [...localReports];
        updated[reportIndex].result = value;
        setLocalReports(updated);
    };

    const handleSave = () => {
        // Serialize back to JSON string
        const finalReports = localReports.map(report => {
            const { _parsedResults, ...rest } = report;
            return {
                ...rest,
                observation: JSON.stringify(_parsedResults)
            };
        });
        onSave(finalReports);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
                }
            }}
        >
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 3,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'grey.100'
            }}>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>Test Report</Typography>
                <IconButton onClick={onClose} size="small"><IconX /></IconButton>
            </Box>

            <DialogContent sx={{ p: 0, bgcolor: '#f4f7fa', minHeight: '60vh' }}>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                    <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'grey.200', boxShadow: 'none' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>PARAMETER</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>PROCESS</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>INSTRUMENT</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>CONDITION</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>MIN</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>MAX</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>OBSERVATION</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>RESULT</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {localReports.map((report, reportIndex) => (
                                    <TableRow key={reportIndex} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Typography variant="subtitle2" color="primary" fontWeight="bold">
                                                {report.parameterName || '-'}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" display="block">
                                                UOM: {report.uom || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{report.processName || '-'}</TableCell>
                                        <TableCell>{report.instrumentName || '-'}</TableCell>
                                        <TableCell>{report.parameterCondition || '-'}</TableCell>
                                        <TableCell>{report.minVal || '-'}</TableCell>
                                        <TableCell>{report.maxVal || '-'}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', minWidth: 200 }}>
                                                {report._parsedResults.map((val, sampleIndex) => (
                                                    <TextField
                                                        key={sampleIndex}
                                                        size="small"
                                                        label={`#${sampleIndex + 1}`}
                                                        value={val}
                                                        onChange={(e) => handleObservationChange(reportIndex, sampleIndex, e.target.value)}
                                                        onBlur={(e) => handleObservationBlur(reportIndex, sampleIndex, e.target.value)}
                                                        sx={{ width: 80 }}
                                                        inputProps={{ style: { textAlign: 'center' } }}
                                                    />
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                placeholder="Result"
                                                value={report.result || ''}
                                                onChange={(e) => handleResultChange(reportIndex, e.target.value)}
                                                sx={{ minWidth: 120 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: '#ffffff', borderTop: '1px solid', borderColor: 'grey.100' }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Save Test Report
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TestReportDialog;
