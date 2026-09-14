import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogContent, Box, Typography, Button, IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconX } from '@tabler/icons-react';
import { motion } from 'framer-motion';

// ─── 1. GRN Post Confirmation Illustration ────────────────────────────────────
const GRNPostConfirmIllustration = () => (
    <Box sx={{ position: 'relative', width: 100, height: 100, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{ scale: [0.9, 1.12, 0.9], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0) 70%)'
            }}
        />
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            {/* Box Body */}
            <motion.path
                d="M20 38L45 26L70 38V62L45 74L20 62V38Z"
                fill="#4F46E5" stroke="#3730A3" strokeWidth="2" strokeLinejoin="round"
                initial={{ y: 6 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            {/* Box Top */}
            <path d="M20 38L45 26L70 38L45 50L20 38Z" fill="#6366F1" stroke="#4F46E5" strokeWidth="2" strokeLinejoin="round" />
            <path d="M45 50V74" stroke="#3730A3" strokeWidth="2" />
            {/* GRN Document Sliding in */}
            <motion.g
                initial={{ y: -18, opacity: 0 }}
                animate={{ y: [-14, -2, -14], opacity: 1 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
                <rect x="33" y="10" width="24" height="30" rx="4" fill="#FFFFFF" stroke="#6366F1" strokeWidth="2" />
                <line x1="38" y1="17" x2="52" y2="17" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
                <line x1="38" y1="23" x2="48" y2="23" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <circle cx="45" cy="30" r="4" fill="#10B981" />
                <path d="M43 30L44.5 31.5L47.5 28.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </motion.g>
        </svg>
    </Box>
);

// ─── 2. GRN Post Success Illustration (Inventory Updated + Confetti) ─────────
const GRNPostSuccessIllustration = () => (
    <Box sx={{ position: 'relative', width: 105, height: 105, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.55 }}
            transition={{ duration: 0.4 }}
            style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16,185,129,0.28) 0%, rgba(16,185,129,0) 70%)'
            }}
        />
        {/* Confetti Particles */}
        {[
            { cx: 18, cy: 22, color: '#F59E0B', r: 3, delay: 0.15, dx: -14, dy: -14 },
            { cx: 88, cy: 26, color: '#6366F1', r: 3.5, delay: 0.25, dx: 14, dy: -12 },
            { cx: 22, cy: 75, color: '#10B981', r: 2.5, delay: 0.35, dx: -10, dy: 10 },
            { cx: 84, cy: 72, color: '#EC4899', r: 3, delay: 0.2, dx: 12, dy: 12 },
            { cx: 50, cy: 12, color: '#10B981', r: 4, delay: 0.1, dx: 0, dy: -16 },
        ].map((p, i) => (
            <motion.circle
                key={i}
                cx={p.cx} cy={p.cy} r={p.r} fill={p.color}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0.8], x: p.dx, y: p.dy }}
                transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
            />
        ))}
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <motion.path
                d="M20 40L45 28L70 40V64L45 76L20 64V40Z"
                fill="#059669" stroke="#047857" strokeWidth="2" strokeLinejoin="round"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            />
            <path d="M20 40L45 28L70 40L45 52L20 40Z" fill="#10B981" stroke="#059669" strokeWidth="2" strokeLinejoin="round" />
            <path d="M45 52V76" stroke="#047857" strokeWidth="2" />
            <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.25, ease: 'backOut' }}
            >
                <circle cx="45" cy="40" r="17" fill="#10B981" stroke="#FFFFFF" strokeWidth="3" />
                <motion.path
                    d="M37 40L43 46L54 34"
                    stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 0.45 }}
                />
            </motion.g>
        </svg>
    </Box>
);

// ─── 3. GRN Creation Success Illustration (Document Generated) ─────────────────
const GRNCreateSuccessIllustration = () => (
    <Box sx={{ position: 'relative', width: 105, height: 105, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 0.4 }}
            style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0) 70%)'
            }}
        />
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <motion.rect
                x="20" y="14" width="44" height="58" rx="6"
                fill="#EFF6FF" stroke="#93C5FD" strokeWidth="2"
                initial={{ x: -10, opacity: 0, rotate: -6 }}
                animate={{ x: 0, opacity: 1, rotate: -4 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            />
            <motion.g
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
            >
                <rect x="26" y="20" width="46" height="60" rx="6" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2.5" />
                <line x1="34" y1="30" x2="60" y2="30" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
                <line x1="34" y1="38" x2="64" y2="38" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="34" y1="46" x2="56" y2="46" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            </motion.g>
            <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.4, delay: 0.35, ease: 'backOut' }}
            >
                <circle cx="63" cy="60" r="15" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
                <motion.path
                    d="M56 60L61 65L70 55"
                    stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 0.55 }}
                />
            </motion.g>
        </svg>
    </Box>
);

// ─── 4. GRN Error / Post Failed Illustration ─────────────────────────────────
const GRNErrorIllustration = () => (
    <Box sx={{ position: 'relative', width: 105, height: 105, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.9, 1.2, 1], opacity: [0.6, 0.25, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239,68,68,0.25) 0%, rgba(239,68,68,0) 70%)'
            }}
        />
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <motion.g
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: [0, -4, 4, -2, 0] }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <rect x="23" y="16" width="44" height="58" rx="6" fill="#FFFFFF" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="4 2" />
                <line x1="31" y1="26" x2="55" y2="26" stroke="#FCA5A5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="31" y1="34" x2="60" y2="34" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="31" y1="42" x2="50" y2="42" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
            </motion.g>
            <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.4, delay: 0.25, ease: 'backOut' }}
            >
                <circle cx="45" cy="54" r="16" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2.5" />
                <motion.path
                    d="M37.5 46.5L52.5 61.5M52.5 46.5L37.5 61.5"
                    stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 0.4 }}
                />
            </motion.g>
        </svg>
    </Box>
);

// ─── 5. GRN Delete Success Illustration ───────────────────────────────────────
const GRNDeleteSuccessIllustration = () => (
    <Box sx={{ position: 'relative', width: 105, height: 105, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 0.4 }}
            style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0) 70%)'
            }}
        />
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <motion.g
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: 16, opacity: 0.25, scale: 0.9 }}
                transition={{ duration: 0.7, delay: 0.1, ease: 'easeInOut' }}
            >
                <rect x="22" y="18" width="42" height="56" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="30" y1="28" x2="52" y2="28" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <line x1="30" y1="36" x2="56" y2="36" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
            <motion.g
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.4, delay: 0.35, ease: 'backOut' }}
            >
                <circle cx="45" cy="45" r="17" fill="#10B981" stroke="#FFFFFF" strokeWidth="3" />
                <motion.path
                    d="M37 45L42.5 50.5L53 39"
                    stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 0.55 }}
                />
            </motion.g>
        </svg>
    </Box>
);

// ─── Standard Generic Fallback Icons ──────────────────────────────────────────
const StandardSuccessIcon = () => (
    <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" fill="#E6F4EA" stroke="#34A853" strokeWidth="3" />
            <circle cx="40" cy="40" r="28" fill="#34A853" />
            <path d="M26 40L35 49L54 30" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </Box>
);

const StandardErrorIcon = () => (
    <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" fill="#FCE8E6" stroke="#EA4335" strokeWidth="3" />
            <circle cx="40" cy="40" r="28" fill="#EA4335" />
            <path d="M28 28L52 52M52 28L28 52" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
    </Box>
);

const StandardQuestionIcon = () => (
    <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="3" />
            <circle cx="40" cy="40" r="28" fill="#8B5CF6" />
            <path d="M31 31C31 26 35 23 40 23C45 23 49 26 49 31C49 36 43 37.5 40 41V46" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            <circle cx="40" cy="52" r="2.8" fill="#FFFFFF" />
        </svg>
    </Box>
);

const StandardWarningIcon = () => (
    <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="3" />
            <circle cx="40" cy="40" r="28" fill="#F59E0B" />
            <line x1="40" y1="26" x2="40" y2="43" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            <circle cx="40" cy="52" r="2.8" fill="#FFFFFF" />
        </svg>
    </Box>
);

// ─── Keyframe & Animation Styles ──────────────────────────────────────────────
const GLOBAL_STYLES = `
    @keyframes bosPopIn {
        0%   { opacity: 0; transform: scale(0.88) translateY(16px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }
`;

// ─── BOSConfirmDialog Component ────────────────────────────────────────────────
export const BOSConfirmDialog = ({
    open,
    grnState,
    type = 'question',
    title = 'Are you sure?',
    message = '',
    grnNo = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // State illustration selector
    let IllusComponent = StandardQuestionIcon;
    let btnBg = '#6366F1';
    let btnHover = '#4F46E5';
    let defaultTitle = title;
    let defaultMessage = message;

    if (grnState === 'GRN_CONFIRM') {
        IllusComponent = GRNPostConfirmIllustration;
        btnBg = '#6366F1';
        btnHover = '#4F46E5';
        defaultTitle = title || 'Post GRN?';
        defaultMessage = message || 'Posting this GRN will generate batch numbers and update inventory stock. This action cannot be undone.';
    } else if (type === 'danger') {
        IllusComponent = StandardErrorIcon;
        btnBg = '#EF4444';
        btnHover = '#DC2626';
    } else if (type === 'success') {
        IllusComponent = StandardSuccessIcon;
        btnBg = '#10B981';
        btnHover = '#059669';
    } else if (type === 'warning') {
        IllusComponent = StandardWarningIcon;
        btnBg = '#F59E0B';
        btnHover = '#D97706';
    }

    return (
        <>
            <style>{GLOBAL_STYLES}</style>
            <Dialog
                open={open}
                onClose={onCancel}
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        overflow: 'hidden',
                        maxWidth: 410,
                        width: '100%',
                        bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                        boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                        animation: 'bosPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        p: 0,
                    }
                }}
                BackdropProps={{
                    sx: {
                        backdropFilter: 'blur(6px)',
                        bgcolor: 'rgba(15, 23, 42, 0.45)',
                    }
                }}
            >
                <IconButton
                    onClick={onCancel}
                    size="small"
                    sx={{
                        position: 'absolute', top: 14, right: 14,
                        color: '#94A3B8',
                        '&:hover': { color: '#334155', bgcolor: '#F1F5F9' }
                    }}
                >
                    <IconX size={18} />
                </IconButton>

                <DialogContent sx={{ pt: 3.5, pb: 3.5, px: 3.5, textAlign: 'center' }}>
                    <IllusComponent />

                    <Typography variant="h4" fontWeight={700} mb={1} sx={{
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        fontSize: '1.3rem',
                        letterSpacing: '-0.02em',
                    }}>
                        {defaultTitle}
                    </Typography>

                    {grnNo && (
                        <Box sx={{
                            display: 'inline-block',
                            px: 1.8, py: 0.5, mb: 1.5,
                            borderRadius: '20px',
                            bgcolor: isDark ? '#334155' : '#F1F5F9',
                            color: '#3B82F6',
                            fontWeight: 700, fontSize: '0.85rem',
                            letterSpacing: '0.02em'
                        }}>
                            GRN No: {grnNo}
                        </Box>
                    )}

                    <Typography variant="body2" sx={{
                        color: isDark ? '#94A3B8' : '#64748B',
                        mb: 3.5,
                        lineHeight: 1.55,
                        fontSize: '0.9rem',
                    }}>
                        {defaultMessage}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                        <Button
                            variant="text"
                            onClick={onCancel}
                            sx={{
                                borderRadius: '12px', px: 3, py: 1,
                                fontWeight: 600, fontSize: '0.9rem',
                                minWidth: 105,
                                bgcolor: isDark ? '#334155' : '#F1F5F9',
                                color: isDark ? '#CBD5E1' : '#475569',
                                textTransform: 'none',
                                '&:hover': { bgcolor: isDark ? '#475569' : '#E2E8F0' }
                            }}
                        >
                            {cancelText}
                        </Button>

                        <Button
                            variant="contained"
                            onClick={onConfirm}
                            sx={{
                                borderRadius: '12px', px: 3.5, py: 1,
                                fontWeight: 700, fontSize: '0.9rem',
                                minWidth: 125,
                                bgcolor: btnBg,
                                color: '#FFFFFF',
                                textTransform: 'none',
                                boxShadow: `0 8px 18px -4px ${btnBg}66`,
                                '&:hover': { bgcolor: btnHover }
                            }}
                        >
                            {confirmText}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
};

// ─── BOSAlertDialog (Result State Modal - NO Progress Bar, NO Duplicate Toast) ─
export const BOSAlertDialog = ({
    open,
    grnState,
    type = 'success',
    title = '',
    message = '',
    subText = '',
    grnNo = '',
    onRetry,
    duration = 2500,
    onClose,
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    useEffect(() => {
        if (!open) return;
        // Auto close after duration for success/delete states if no manual retry action
        if (grnState !== 'GRN_POST_ERROR' && duration) {
            const timer = setTimeout(() => onClose?.(), duration);
            return () => clearTimeout(timer);
        }
    }, [open, grnState, duration, onClose]);

    let IllusComponent = StandardSuccessIcon;
    let mainTitle = title;
    let mainMsg = message;

    if (grnState === 'GRN_POST_SUCCESS') {
        IllusComponent = GRNPostSuccessIllustration;
        mainTitle = title || 'GRN Posted Successfully!';
        mainMsg = subText || message || 'Inventory stock has been updated successfully.';
    } else if (grnState === 'GRN_CREATE_SUCCESS') {
        IllusComponent = GRNCreateSuccessIllustration;
        mainTitle = title || 'GRN Created Successfully!';
        mainMsg = subText || message || '';
    } else if (grnState === 'GRN_POST_ERROR') {
        IllusComponent = GRNErrorIllustration;
        mainTitle = title || 'Post Failed';
        mainMsg = message || 'GRN is not in a postable state.';
    } else if (grnState === 'GRN_DELETE_SUCCESS') {
        IllusComponent = GRNDeleteSuccessIllustration;
        mainTitle = title || 'GRN Deleted Successfully';
        mainMsg = message || 'The GRN has been deleted.';
    } else if (type === 'error') {
        IllusComponent = GRNErrorIllustration;
    } else if (type === 'warning') {
        IllusComponent = StandardWarningIcon;
    }

    return (
        <>
            <style>{GLOBAL_STYLES}</style>
            <Dialog
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        overflow: 'hidden',
                        maxWidth: 400,
                        width: '100%',
                        bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                        boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                        animation: 'bosPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        p: 0,
                    }
                }}
                BackdropProps={{
                    sx: {
                        backdropFilter: 'blur(6px)',
                        bgcolor: 'rgba(15, 23, 42, 0.45)',
                    }
                }}
            >
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        position: 'absolute', top: 14, right: 14,
                        color: '#94A3B8',
                        '&:hover': { color: '#334155', bgcolor: '#F1F5F9' }
                    }}
                >
                    <IconX size={18} />
                </IconButton>

                <DialogContent sx={{ pt: 3.5, pb: 3.5, px: 3.5, textAlign: 'center' }}>
                    <IllusComponent />

                    <Typography variant="h4" fontWeight={700} mb={grnNo ? 1 : 1.2} sx={{
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        fontSize: '1.28rem',
                        letterSpacing: '-0.02em',
                    }}>
                        {mainTitle}
                    </Typography>

                    {grnNo && (
                        <Box sx={{
                            display: 'inline-block',
                            px: 2, py: 0.6, mb: 1.5,
                            borderRadius: '20px',
                            bgcolor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF',
                            color: '#2563EB',
                            fontWeight: 700, fontSize: '0.88rem',
                            letterSpacing: '0.01em',
                            border: '1px solid rgba(37,99,235,0.2)'
                        }}>
                            GRN No: {grnNo}
                        </Box>
                    )}

                    {mainMsg && (
                        <Typography variant="body2" sx={{
                            color: isDark ? '#94A3B8' : '#64748B',
                            mb: (grnState === 'GRN_POST_ERROR' || onRetry) ? 3 : 1,
                            lineHeight: 1.55,
                            fontSize: '0.9rem',
                        }}>
                            {mainMsg}
                        </Typography>
                    )}

                    {/* Action buttons for Error / Result state */}
                    {(grnState === 'GRN_POST_ERROR' || onRetry) && (
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={onClose}
                                sx={{
                                    borderRadius: '12px', px: 4, py: 1,
                                    fontWeight: 700, fontSize: '0.9rem',
                                    bgcolor: '#475569', color: '#FFFFFF',
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#334155' }
                                }}
                            >
                                Close
                            </Button>
                            {onRetry && (
                                <Button
                                    variant="contained"
                                    onClick={() => { onClose(); onRetry(); }}
                                    sx={{
                                        borderRadius: '12px', px: 3.5, py: 1,
                                        fontWeight: 700, fontSize: '0.9rem',
                                        bgcolor: '#EF4444', color: '#FFFFFF',
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: '#DC2626' }
                                    }}
                                >
                                    Retry
                                </Button>
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default BOSConfirmDialog;

// ─── Unified `bos` Helper with GRN Specialised Methods ──────────────────────
let _confirmFn = null;
let _alertFn   = null;

export const _registerBOSConfirm = (fn) => { _confirmFn = fn; };
export const _registerBOSAlert   = (fn) => { _alertFn   = fn; };

export const bosConfirm = (options) =>
    new Promise((resolve) => {
        if (_confirmFn) {
            _confirmFn({ ...options, resolve });
        } else {
            resolve(false);
        }
    });

export const bosAlert = (options) =>
    new Promise((resolve) => {
        if (_alertFn) {
            _alertFn({ ...options, resolve });
        } else {
            resolve();
        }
    });

export const bos = {
    confirm: (opts) => bosConfirm(opts),
    success: (title, message, duration) => bosAlert({ type: 'success', title, message, duration }),
    error:   (title, message, duration) => bosAlert({ type: 'error',   title, message, duration }),
    warning: (title, message, duration) => bosAlert({ type: 'warning', title, message, duration }),
    info:    (title, message, duration) => bosAlert({ type: 'info',    title, message, duration }),

    // ─── GRN Specialized Dialog Helpers ───
    grnPostConfirm: () => bosConfirm({
        grnState: 'GRN_CONFIRM',
        title: 'Post GRN?',
        message: 'Posting this GRN will generate batch numbers and update inventory stock. This action cannot be undone.',
        confirmText: 'Yes, Post GRN',
        cancelText: 'Cancel'
    }),

    grnPostSuccess: (grnNo, subText = 'Inventory stock has been updated successfully.') => bosAlert({
        grnState: 'GRN_POST_SUCCESS',
        title: 'GRN Posted Successfully!',
        grnNo,
        subText,
        duration: 2600,
    }),

    grnCreateSuccess: (grnNo, subText = '') => bosAlert({
        grnState: 'GRN_CREATE_SUCCESS',
        title: 'GRN Created Successfully!',
        grnNo,
        subText,
        duration: 2200,
    }),

    grnError: (title = 'Post Failed', message = 'GRN is not in a postable state.', onRetry = null) => bosAlert({
        grnState: 'GRN_POST_ERROR',
        title,
        message,
        onRetry,
    }),

    grnDeleteSuccess: (message = 'The GRN has been deleted.') => bosAlert({
        grnState: 'GRN_DELETE_SUCCESS',
        title: 'GRN Deleted Successfully',
        message,
        duration: 2200,
    }),
};
