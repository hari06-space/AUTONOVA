import React from 'react';
import { Box, Stack, Tooltip, IconButton, Typography, Grid } from '@mui/material';
import { IconCloudUpload, IconEye, IconTrash } from '@tabler/icons-react';
import BOSTextField from './BOSTextField';

/**
 * BOSActionSection - A "Pattern Component" that combines a text area with 
 * context-specific side controls for file uploads and previews.
 * Reduces boilerplate and ensures perfect button alignment.
 */
const BOSActionSection = ({
    label,
    name,
    value,
    onChange,
    onFileSelect,
    onFilePreview,
    onFileRemove,
    hasFile,
    fileName,
    required = false,
    rows = 3,
    error,
    helperText,
    sx = {},
    readOnly = false,
    fileError = false,
    fileHelperText = ''
}) => {
    const fileInputRef = React.useRef(null);

    return (
        <Grid item xs={12} sx={sx}>
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                <BOSTextField
                    required={required}
                    fullWidth
                    label={label}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    multiline
                    rows={rows}
                    error={!!error}
                    helperText={helperText}
                    InputLabelProps={{ shrink: true }}
                    disabled={readOnly}
                    sx={{ 
                        flex: 1,
                        ...(readOnly ? {
                            '& .MuiInputBase-input.Mui-disabled': {
                                color: '#000000 !important',
                                WebkitTextFillColor: '#000000 !important'
                            },
                            '& .MuiOutlinedInput-root.Mui-disabled': {
                                bgcolor: 'action.hover'
                            },
                            '& .MuiInputLabel-root.Mui-disabled': {
                                color: 'rgba(0, 0, 0, 0.6) !important'
                            }
                        } : {})
                    }}
                    inputProps={{ readOnly }}
                />
                {!readOnly && (
                    <Stack direction="row" spacing={1.5} sx={{ mt: 3.5, width: 162, flexShrink: 0, justifyContent: 'flex-start' }}>
                        <>
                            <Tooltip title="Upload Evidence">
                                <IconButton 
                                    size="small" 
                                    color={fileError ? "error" : "primary"} 
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{ 
                                        border: '1.5px solid', 
                                        borderColor: fileError ? 'error.main' : 'divider', 
                                        p: 1.5, 
                                        transition: 'all 0.2s', 
                                        '&:hover': { bgcolor: fileError ? 'error.lighter' : 'primary.light' } 
                                    }}
                                >
                                    <IconCloudUpload size={20} />
                                </IconButton>
                            </Tooltip>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                value=""
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        onFileSelect(e.target.files[0]);
                                    }
                                }} 
                            />
                        </>
                        {hasFile && (
                            <>
                                <Tooltip title="Preview">
                                    <IconButton 
                                        size="small" 
                                        color="secondary" 
                                        onClick={onFilePreview}
                                        sx={{ border: '1px solid', borderColor: 'divider', p: 1.5 }}
                                    >
                                        <IconEye size={20} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove">
                                    <IconButton 
                                        size="small" 
                                        color="error" 
                                        onClick={onFileRemove}
                                        sx={{ border: '1px solid', borderColor: 'divider', p: 1.5 }}
                                    >
                                        <IconTrash size={20} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                    </Stack>
                )}
            </Box>
            {fileError && fileHelperText && (
                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, mt: 0.5, ml: 1, display: 'block' }}>
                    {fileHelperText}
                </Typography>
            )}
            {hasFile && (
                <Box sx={{ mt: 1.5, ml: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                        Uploaded Files:
                    </Typography>
                    <Box 
                        sx={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            pr: 2,
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.selected' }
                        }}
                        onClick={onFilePreview}
                    >
                        <IconEye size={18} style={{ color: '#1976d2' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#1976d2' }}>
                            {fileName || 'View Attachment'}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Grid>
    );
};

// Note: Grid needs to be imported or handled. I'll use Box for maximum flexibility if not in a Grid container.
export default BOSActionSection;
