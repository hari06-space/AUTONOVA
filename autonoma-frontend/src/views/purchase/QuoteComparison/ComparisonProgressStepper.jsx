import React from 'react';
import { Box, Stepper, Step, StepLabel, StepConnector, Typography, useTheme, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';
import { IconFileInvoice, IconSend, IconMailOpened, IconScale, IconUserCheck, IconShoppingCart } from '@tabler/icons-react';

const STEPS = [
    { label: 'RFQ Created', icon: IconFileInvoice },
    { label: 'RFQ Sent', icon: IconSend },
    { label: 'Quotations Received', icon: IconMailOpened },
    { label: 'Comparison', icon: IconScale },
    { label: 'Supplier Selected', icon: IconUserCheck },
    { label: 'PO Creation', icon: IconShoppingCart }
];

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
    '& .MuiStepConnector-line': {
        height: 2,
        border: 0,
        backgroundColor: theme.palette.divider,
        borderRadius: 1
    },
    '&.Mui-active .MuiStepConnector-line, &.Mui-completed .MuiStepConnector-line': {
        backgroundImage: `linear-gradient(95deg, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 100%)`
    }
}));

function StepIcon({ icon: IconComp, active, completed, theme }) {
    const bgColor = completed
        ? theme.palette.success.main
        : active
            ? theme.palette.primary.main
            : theme.palette.grey[300];
    const color = completed || active ? '#fff' : theme.palette.grey[600];

    return (
        <Box
            sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: bgColor,
                color: color,
                boxShadow: active ? `0 2px 6px ${alpha(theme.palette.primary.main, 0.4)}` : 'none',
                transition: 'all 0.3s ease',
                zIndex: 1
            }}
        >
            <IconComp size={14} />
        </Box>
    );
}

/**
 * Props:
 *  - statusName: 'DRAFT' | 'LOCKED' | 'VERIFIED' | etc.
 *  - isNew: boolean (no id yet)
 */
export default function ComparisonProgressStepper({ statusName, isNew }) {
    const theme = useTheme();

    let activeStep = 3; // Default: Comparison step
    if (isNew) {
        activeStep = 2; // Quotations Received, about to start comparison
    } else if (statusName === 'DRAFT') {
        activeStep = 3;
    } else if (statusName === 'LOCKED') {
        activeStep = 4;
    } else if (statusName === 'VERIFIED' || statusName === 'APPROVED') {
        activeStep = 5;
    }

    return (
        <Box sx={{ width: '100%', py: 1, px: 2 }}>
            <Stepper activeStep={activeStep} connector={<ColorlibConnector />}>
                {STEPS.map((step, index) => (
                    <Step key={step.label} completed={index < activeStep}>
                        <StepLabel
                            StepIconComponent={() => (
                                <StepIcon
                                    icon={step.icon}
                                    active={index === activeStep}
                                    completed={index < activeStep}
                                    theme={theme}
                                />
                            )}
                            sx={{ '& .MuiStepLabel-labelContainer': { ml: 0.5 } }}
                        >
                            <Typography
                                variant="caption"
                                fontWeight={index === activeStep ? 700 : 600}
                                color={index <= activeStep ? 'text.primary' : 'text.disabled'}
                                sx={{ fontSize: '0.7rem', display: { xs: 'none', md: 'block' } }}
                            >
                                {step.label}
                            </Typography>
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
}
