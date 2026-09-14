import { Box, Typography, Avatar, Chip, Divider, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    IconBuilding, IconShieldCheck, IconTrendingUp, IconTrendingDown,
    IconMinus, IconStar, IconCalendar, IconAlertCircle
} from '@tabler/icons-react';

/* ── helpers ── */
const MetricBar = ({ label, value, suffix = '%', good = 90, warn = 70, invert = false }) => {
    const theme = useTheme();
    if (value == null) return null;
    const pct = Math.min(Math.max(value, 0), 100);
    const isGood = invert ? value <= (100 - good) : value >= good;
    const isWarn = invert ? value <= (100 - warn) : value >= warn;
    const color = isGood ? theme.palette.success.main : isWarn ? theme.palette.warning.main : theme.palette.error.main;
    const trackClr = isGood ? theme.palette.success.light : isWarn ? theme.palette.warning.light : theme.palette.error.light;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.3}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} fontSize={11}>
                    {label}
                </Typography>
                <Typography variant="caption" fontWeight={800} fontSize={11} sx={{ color }}>
                    {value}{suffix}
                </Typography>
            </Box>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: trackClr, overflow: 'hidden' }}>
                <Box sx={{
                    height: '100%',
                    width: `${invert ? (100 - pct) : pct}%`,
                    bgcolor: color,
                    borderRadius: 3,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
                }} />
            </Box>
        </Box>
    );
};

const TrendIcon = ({ trend }) => {
    if (trend === 'IMPROVING') return <IconTrendingUp size={13} color="#4caf50" />;
    if (trend === 'DECLINING') return <IconTrendingDown size={13} color="#f44336" />;
    return <IconMinus size={13} color="#9e9e9e" />;
};

/* ── main ── */
const SmartSupplierInsights = ({ insights }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    if (!insights) return null;

    const hasPerf = insights.rating != null ||
        insights.onTimeDeliveryPercent != null ||
        insights.qualityScore != null;

    const initials = (insights.supplierName || 'S')
        .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    return (
        <Box sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: isDark ? alpha(theme.palette.primary.main, 0.18) : alpha(theme.palette.primary.main, 0.15),
            boxShadow: isDark
                ? `0 2px 12px ${alpha(theme.palette.common.black, 0.35)}`
                : `0 2px 12px ${alpha(theme.palette.primary.main, 0.06)}`,
        }}>

            {/* Gradient Header — compact */}
            <Box sx={{
                background: isDark
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.secondary.dark, 0.7)} 100%)`
                    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
            }}>
                <Avatar sx={{
                    width: 38, height: 38,
                    bgcolor: alpha('#fff', 0.2),
                    color: '#fff',
                    fontWeight: 800, fontSize: 14,
                    border: '1.5px solid',
                    borderColor: alpha('#fff', 0.3),
                    flexShrink: 0,
                }}>
                    {initials}
                </Avatar>
                <Box flex={1} minWidth={0}>
                    <Typography variant="body2" color="#fff" fontWeight={800} noWrap fontSize={12}>
                        {insights.supplierName || '—'}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <IconBuilding size={10} color={alpha('#fff', 0.7)} />
                        <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), fontSize: 10 }}>
                            {insights.supplierCode || '—'}
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" flexDirection="column" gap={0.4} alignItems="flex-end">
                    {insights.preferredSupplier && (
                        <Chip icon={<IconShieldCheck size={10} />} label="Preferred"
                            size="small"
                            sx={{ bgcolor: alpha('#fff', 0.2), color: '#fff', fontWeight: 700, fontSize: 9, height: 18, '& .MuiChip-icon': { fontSize: 10 } }} />
                    )}
                    {insights.riskIndicator && (
                        <Chip icon={<IconAlertCircle size={10} />} label={`Risk: ${insights.riskIndicator}`}
                            size="small"
                            color={insights.riskIndicator === 'LOW' ? 'success' : insights.riskIndicator === 'HIGH' ? 'error' : 'warning'}
                            sx={{ fontWeight: 700, fontSize: 9, height: 18 }} />
                    )}
                </Box>
            </Box>

            {/* Body */}
            <Box sx={{
                p: 1.5,
                bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : theme.palette.background.paper,
            }}>
                <Box display="flex" alignItems="center" gap={0.75} mb={1.25}>
                    <IconStar size={12} color={theme.palette.primary.main} />
                    <Typography variant="caption" color="primary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10 }}>
                        Supplier Performance
                    </Typography>
                    {insights.performanceTrend && (
                        <Box display="flex" alignItems="center" gap={0.3} ml="auto">
                            <TrendIcon trend={insights.performanceTrend} />
                            <Typography variant="caption" fontSize={9} fontWeight={700}
                                color={insights.performanceTrend === 'IMPROVING' ? 'success.main' : insights.performanceTrend === 'DECLINING' ? 'error.main' : 'text.secondary'}>
                                {insights.performanceTrend}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {!hasPerf ? (
                    <Box sx={{
                        textAlign: 'center', py: 2,
                        borderRadius: 1.5, border: '1px dashed',
                        borderColor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
                    }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                            No performance data yet
                        </Typography>
                        <Typography variant="caption" color="text.disabled" fontSize={10}>
                            Recorded after purchase evaluations
                        </Typography>
                    </Box>
                ) : (
                    <Box display="flex" flexDirection="column" gap={1.25}>
                        {/* Rating badge */}
                        {insights.rating != null && (
                            <Box display="flex" alignItems="center" justifyContent="space-between"
                                sx={{
                                    px: 1.5, py: 0.75, borderRadius: 1.5,
                                    bgcolor: isDark ? alpha(theme.palette.primary.dark, 0.25) : alpha(theme.palette.primary.light, 0.5),
                                }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} fontSize={11}>
                                    Overall Rating
                                </Typography>
                                <Typography variant="h5" fontWeight={900}
                                    color={insights.rating >= 80 ? 'success.main' : insights.rating >= 60 ? 'warning.main' : 'error.main'}>
                                    {Number(insights.rating).toFixed(1)}
                                </Typography>
                            </Box>
                        )}

                        {/* Metric bars */}
                        <MetricBar label="Quality Score" value={insights.qualityScore} good={90} warn={70} />
                        <MetricBar label="On-Time Delivery" value={insights.onTimeDeliveryPercent} good={90} warn={70} />
                        {insights.rejectionRate != null && (
                            <MetricBar label="Rejection Rate" value={insights.rejectionRate} good={5} warn={10} invert />
                        )}

                        {/* Footer meta */}
                        {(insights.lastPurchaseDate || (insights.totalPurchaseValue != null && Number(insights.totalPurchaseValue) > 0)) && (
                            <>
                                <Divider sx={{ borderStyle: 'dashed', my: 0.25 }} />
                                <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={0.5}>
                                    {insights.lastPurchaseDate && (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <IconCalendar size={11} color={theme.palette.text.secondary} />
                                            <Typography variant="caption" fontSize={10} color="text.secondary">
                                                {new Date(insights.lastPurchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </Typography>
                                        </Box>
                                    )}
                                    {insights.totalPurchaseValue != null && Number(insights.totalPurchaseValue) > 0 && (
                                        <Typography variant="caption" fontSize={10} fontWeight={700} color="primary">
                                            ₹{Number(insights.totalPurchaseValue).toLocaleString('en-IN')}
                                        </Typography>
                                    )}
                                </Box>
                            </>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default SmartSupplierInsights;
