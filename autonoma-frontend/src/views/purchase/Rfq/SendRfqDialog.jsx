import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Dialog,
    Box,
    Typography,
    Button,
    CircularProgress,
    IconButton,
    Tooltip,
    Chip,
    Avatar,
    LinearProgress,
    Fade,
    Collapse
} from '@mui/material';
import {
    Send as SendIcon,
    Close as CloseIcon,
    AttachFile as AttachFileIcon,
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Email as EmailIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    InsertDriveFile as FileIcon,
    AccessTime as ClockIcon,
    CheckCircle as CheckCircleIcon,
    Person as PersonIcon,
    Replay as ReplayIcon,
    NotificationsActive as ReminderIcon
} from '@mui/icons-material';
import rfqService from 'api/rfqService';
import BOSFilePreview from 'ui-component/bos/BOSFilePreview';
import useRfqStore from 'store/useRfqStore';
import BOSExportButton from 'ui-component/bos/BOSExportButton';
import { format } from 'date-fns';

const TagInput = ({ label, value, onChange, disabled, placeholder }) => {
    const [inputVal, setInputVal] = useState('');
    const tags = value ? value.split(',').map(e => e.trim()).filter(Boolean) : [];

    const addTag = (val) => {
        const newTag = val.trim();
        if (newTag && !tags.includes(newTag)) {
            onChange([...tags, newTag].join(', '));
        }
        setInputVal('');
    };

    const removeTag = (tag) => {
        onChange(tags.filter(t => t !== tag).join(', '));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(inputVal);
        } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            borderBottom: '1px solid #f1f5f9',
            minHeight: 48,
            '&:hover': { bgcolor: '#fafafa' },
            '&:focus-within': { bgcolor: '#fafbff' }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', px: 3, pt: 1.5, color: '#94a3b8', minWidth: 70, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.7rem', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    {label}
                </Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, pr: 2, py: 1, alignItems: 'center' }}>
                {tags.map((tag) => (
                    <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        avatar={
                            <Avatar sx={{ bgcolor: '#6366f1 !important', width: '18px !important', height: '18px !important', fontSize: '0.6rem !important' }}>
                                {tag[0]?.toUpperCase()}
                            </Avatar>
                        }
                        onDelete={!disabled ? () => removeTag(tag) : undefined}
                        sx={{
                            bgcolor: '#ede9fe',
                            color: '#4c1d95',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            border: '1px solid #c4b5fd',
                            '& .MuiChip-deleteIcon': { color: '#7c3aed', fontSize: '14px' },
                            '&:hover': { bgcolor: '#ddd6fe' }
                        }}
                    />
                ))}
                {!disabled && (
                    <input
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => inputVal && addTag(inputVal)}
                        placeholder={tags.length === 0 ? placeholder : ''}
                        style={{
                            border: 'none', outline: 'none', fontSize: '0.875rem',
                            background: 'transparent', flex: 1, minWidth: 120,
                            color: '#1e293b', fontFamily: 'inherit', padding: '2px 4px'
                        }}
                    />
                )}
                {disabled && tags.length === 0 && (
                    <Typography variant="body2" sx={{ color: '#94a3b8', pl: 0.5 }}>—</Typography>
                )}
            </Box>
        </Box>
    );
};

const FileTypeIcon = ({ name }) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return <PdfIcon sx={{ color: '#ef4444', fontSize: 20 }} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return <ImageIcon sx={{ color: '#10b981', fontSize: 20 }} />;
    return <FileIcon sx={{ color: '#6366f1', fontSize: 20 }} />;
};

const AttachmentRow = ({ name, label, onPreview, onDelete, isReadOnly, exportButton }) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
        borderRadius: 2,
        bgcolor: '#f8fafc',
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s ease',
        '&:hover': { bgcolor: '#f1f5f9', borderColor: '#c4b5fd', transform: 'translateX(3px)', boxShadow: '0 2px 8px rgba(99,102,241,0.08)' }
    }}>
        <Box sx={{
            width: 38, height: 38, borderRadius: 1.5,
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
            <FileTypeIcon name={name} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#1e293b', fontSize: '0.82rem' }}>{name}</Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>{label}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
            {exportButton}
            {onPreview && (
                <Tooltip title="Preview file">
                    <IconButton size="small" onClick={onPreview} sx={{ color: '#6366f1', bgcolor: '#ede9fe', '&:hover': { bgcolor: '#c4b5fd' }, width: 28, height: 28 }}>
                        <VisibilityIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
            )}
            {onDelete && !isReadOnly && (
                <Tooltip title="Remove">
                    <IconButton size="small" onClick={onDelete} sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fecaca' }, width: 28, height: 28 }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    </Box>
);

const SendRfqDialog = ({ 
    open, 
    mode, 
    rfqId, 
    rfqNo, 
    items = [],
    suppliers = [],
    documentDetails = null,
    initialSubject, 
    initialContent, 
    initialFromEmail,
    companyEmail,
    initialToEmail, 
    initialCcEmail, 
    onSend, 
    onResend, 
    onReminder, 
    onClose, 
    sentBy, 
    sentDate 
}) => {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [fromEmail, setFromEmail] = useState('');
    const [toEmail, setToEmail] = useState('');
    const [ccEmail, setCcEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [reminding, setReminding] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showCc, setShowCc] = useState(false);
    const [showAttachments, setShowAttachments] = useState(true);
    const fileInputRef = useRef(null);
    const exportRef = useRef(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewName, setPreviewName] = useState('');

    const { currentRfq, fetchRfqById } = useRfqStore();

    const exportData = useMemo(() => {
        const rawList = (items && items.length > 0) ? items : (currentRfq?.details || []);
        return rawList.map((t, index) => {
            let expDate = '';
            const rawDate = t.expectedDeliveryDate || t.reqDate;
            if (rawDate) {
                try {
                    expDate = typeof rawDate === 'string' && rawDate.includes('T') ? format(new Date(rawDate), 'dd-MM-yyyy') : rawDate;
                } catch (e) {
                    expDate = String(rawDate);
                }
            }
            return {
                ...t,
                sNo: index + 1,
                itemCode: t.itemCode || '',
                itemName: t.itemName || '',
                uom: t.uom || '',
                reqQty: t.reqQty || 0,
                expectedDeliveryDate: expDate,
                remarks: t.remarks || ''
            };
        });
    }, [items, currentRfq]);

    const exportColumns = useMemo(() => [
        { key: 'itemCode', header: 'Item Code' },
        { key: 'itemName', header: 'Item Description' },
        { key: 'uom', header: 'UOM' },
        { key: 'reqQty', header: 'Req Qty' },
        { key: 'expectedDeliveryDate', header: 'Exp. Delivery' },
        { key: 'remarks', header: 'Remarks' },
    ], []);

    const docDetails = useMemo(() => {
        if (documentDetails && documentDetails.length > 0) {
            return documentDetails;
        }
        return [
            { label: 'RFQ No', value: currentRfq?.rfqNo || rfqNo || '' },
            { label: 'RFQ Date', value: currentRfq?.rfqDate ? (typeof currentRfq.rfqDate === 'string' && currentRfq.rfqDate.includes('T') ? format(new Date(currentRfq.rfqDate), 'dd-MM-yyyy') : currentRfq.rfqDate) : '' },
            { label: 'Closing Date', value: currentRfq?.closingDate ? (typeof currentRfq.closingDate === 'string' && currentRfq.closingDate.includes('T') ? format(new Date(currentRfq.closingDate), 'dd-MM-yyyy') : currentRfq.closingDate) : '' },
            { label: 'Buyer', value: currentRfq?.buyerName || '' },
            { label: 'Department', value: currentRfq?.departmentName || '' },
            { label: 'PR Ref No', value: currentRfq?.prNo || currentRfq?.prRefNo || '' },
            { label: 'Commercial Terms', value: currentRfq?.commercialTerms || '' },
            { label: 'Remarks', value: currentRfq?.internalNotes || '' }
        ];
    }, [documentDetails, currentRfq, rfqNo]);

    const fetchAttachments = async () => {
        if (!rfqId) return;
        try {
            const res = await rfqService.getAttachments(rfqId);
            setAttachments(res.data || []);
        } catch (error) {
            console.error("Failed to fetch attachments", error);
        }
    };

    useEffect(() => {
        if (open) {
            const defaultFrom = initialFromEmail || companyEmail;
            if (defaultFrom) {
                setFromEmail(defaultFrom);
            } else {
                fetch(`/api/company-profile/all`, {
                    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('serviceToken') || ''}` }
                })
                    .then(r => r.json())
                    .then(data => {
                        if (Array.isArray(data) && data.length > 0) {
                            const comp = data[0];
                            const mail = comp.smtpUsername || comp.emailId || '';
                            if (mail) setFromEmail(mail);
                            else setFromEmail('noreply@autonova.com');
                        } else {
                            setFromEmail('noreply@autonova.com');
                        }
                    })
                    .catch(() => {
                        setFromEmail('noreply@autonova.com');
                    });
            }
            setSubject(initialSubject || `RFQ Request - ${rfqNo || ''}`);
            setContent(initialContent || `Dear {Supplier Name},\n\nPlease find the attached Request For Quotation.\n\nKindly submit your quotation on or before the specified closing date.\n\nPlease review all attached documents carefully.\n\nThank you.\n\nRegards,\n{Requester Name}\n{Department Name}\n{Requester Mobile}`);
            
            if (suppliers && suppliers.length > 0) {
                const emails = suppliers.map(s => s.email).filter(Boolean).join(', ');
                if (emails) setToEmail(emails);
            } else if (initialToEmail) {
                setToEmail(initialToEmail);
            }

            if (initialCcEmail) {
                setCcEmail(initialCcEmail);
                setShowCc(true);
            }

            if (rfqId) {
                fetchAttachments();
                fetchRfqById(rfqId).then(() => {
                    const rfq = useRfqStore.getState().currentRfq;
                    if (rfq && rfq.suppliers && (!suppliers || suppliers.length === 0) && !initialToEmail) {
                        const emails = rfq.suppliers.map(s => s.email).filter(Boolean).join(', ');
                        if (emails) setToEmail(emails);
                    }
                });
            }
        } else {
            setAttachments([]);
        }
    }, [open, initialSubject, initialContent, rfqNo, rfqId, suppliers, initialToEmail, initialCcEmail, fetchRfqById]);

    const userAttachments = useMemo(() => {
        return (attachments || []).filter(att => {
            const fn = (att.fileName || '').toLowerCase();
            const safeRfq = (rfqNo || 'RFQ').replace(/\//g, '_').toLowerCase();
            return fn !== `${safeRfq}.pdf` && fn !== 'auto.pdf' && !fn.startsWith('rfq_');
        });
    }, [attachments, rfqNo]);

    const ensureFreshPdfUploaded = async () => {
        if (exportRef.current) {
            try {
                const pdfBlob = await exportRef.current.generatePdfBlob();
                if (pdfBlob) {
                    const formData = new FormData();
                    const safeRfqNo = (rfqNo || 'RFQ').replace(/\//g, '_');
                    formData.append('files', pdfBlob, `${safeRfqNo}.pdf`);
                    await rfqService.uploadAttachments(rfqId, formData);
                }
            } catch (err) {
                console.error("Failed to generate and upload fresh RFQ PDF", err);
            }
        }
    };

    const handleSend = async () => {
        if (!subject.trim() || !content.trim()) return;
        setLoading(true);
        try {
            await ensureFreshPdfUploaded();
            await onSend({ subject, content, fromEmail, toEmail, ccEmail });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await ensureFreshPdfUploaded();
            await onResend?.({ subject, content, fromEmail, toEmail, ccEmail });
        } finally {
            setResending(false);
        }
    };

    const handleReminder = async () => {
        setReminding(true);
        try {
            await ensureFreshPdfUploaded();
            const reminderSubject = `[REMINDER] ${subject}`;
            const reminderContent = `Dear {Supplier Name},\n\nThis is a gentle reminder regarding our Request For Quotation (${rfqNo}).\n\nWe have not yet received your quotation. Kindly submit your quotation at the earliest.\n\nPlease note the closing date specified in the original RFQ document attached.\n\nThank you.\n\nRegards,\n{Requester Name}`;
            await onReminder?.({ subject: reminderSubject, content: reminderContent, fromEmail, toEmail, ccEmail });
        } finally {
            setReminding(false);
        }
    };

    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));
        setUploading(true);
        try {
            await rfqService.uploadAttachments(rfqId, formData);
            await fetchAttachments();
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!window.confirm("Remove this attachment?")) return;
        try {
            await rfqService.deleteAttachment(attachmentId);
            fetchAttachments();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleViewAttachment = (filePath, fileName) => {
        const url = (filePath.startsWith('/api/') || filePath.startsWith('/purchase/'))
            ? filePath
            : `/api/files/view?path=${encodeURIComponent(filePath)}`;
        setPreviewUrl(url);
        setPreviewName(fileName || filePath.split('/').pop());
        setPreviewOpen(true);
    };

    const isReadOnly = mode === 'readonly';
    const isResendMode = mode === 'resend';
    const totalAttachments = (userAttachments?.length || 0) + 1;
    const isReady = subject.trim() && content.trim() && (toEmail.trim() || fromEmail.trim());

    return (
        <Dialog
            open={open}
            onClose={!loading && !uploading ? onClose : undefined}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.2), 0 12px 32px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '92vh',
                    background: '#ffffff',
                    border: '1px solid rgba(99,102,241,0.12)'
                }
            }}
            TransitionComponent={Fade}
            transitionDuration={200}
        >
            {/* Premium Dark Header */}
            <Box sx={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                {/* Decorative glowing orbs */}
                <Box sx={{ position: 'absolute', top: -40, right: -20, width: 130, height: 130, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.25)', filter: 'blur(35px)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', bottom: -25, left: 60, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(139,92,246,0.3)', filter: 'blur(25px)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', top: '50%', left: '40%', width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(79,70,229,0.2)', filter: 'blur(20px)', pointerEvents: 'none' }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            width: 44, height: 44, borderRadius: 2.5,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 20px rgba(99,102,241,0.5)',
                            border: '1px solid rgba(255,255,255,0.15)'
                        }}>
                            <EmailIcon sx={{ color: 'white', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                                {isReadOnly ? 'Email Preview' : isResendMode ? 'Resend RFQ Mail' : 'New Message'}
                            </Typography>
                            <Typography sx={{ color: 'rgba(165,180,252,0.8)', fontSize: '0.72rem', letterSpacing: 0.5, mt: 0.2 }}>
                                {isReadOnly ? 'Request For Quotation — Sent' : isResendMode ? 'Request For Quotation — Edit & Resend' : 'Request For Quotation — Composing'}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Close">
                            <span>
                                <IconButton size="small" onClick={onClose} disabled={loading || uploading}
                                    sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }, borderRadius: 1.5, p: 0.75 }}>
                                    <CloseIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>

                {loading && (
                    <LinearProgress sx={{
                        height: 2,
                        '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #a5b4fc, #c4b5fd)' },
                        bgcolor: 'rgba(255,255,255,0.1)'
                    }} />
                )}
            </Box>

            {/* Sent info bar - green for readonly preview, amber for resend mode */}
            {(isReadOnly || isResendMode) && sentBy && (
                <Box sx={{
                    bgcolor: isResendMode ? '#fffbeb' : '#f0fdf4',
                    borderBottom: `1px solid ${isResendMode ? '#fde68a' : '#bbf7d0'}`,
                    px: 3, py: 1.2, display: 'flex', gap: 3, alignItems: 'center'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ color: isResendMode ? '#d97706' : '#22c55e', fontSize: 16 }} />
                        <Typography variant="caption" sx={{ color: isResendMode ? '#92400e' : '#166534', fontWeight: 700, letterSpacing: 0.3 }}>
                            {isResendMode ? 'Previously Sent — Edit & Resend Below' : 'Delivered Successfully'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ color: '#6b7280', fontSize: 14 }} />
                        <Typography variant="caption" sx={{ color: '#374151' }}>{sentBy}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ClockIcon sx={{ color: '#6b7280', fontSize: 14 }} />
                        <Typography variant="caption" sx={{ color: '#374151' }}>{sentDate ? new Date(sentDate).toLocaleString() : ''}</Typography>
                    </Box>
                </Box>
            )}

            {/* Scrollable Email Compose Body */}
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

                {/* Recipients Block */}
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '2px solid #f1f5f9' }}>
                    {/* From Row */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', px: 3, py: 1.5,
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'bgcolor 0.2s',
                        '&:hover': { bgcolor: '#fafafa' }
                    }}>
                        <Typography sx={{ fontWeight: 700, color: '#94a3b8', width: 65, fontSize: '0.7rem', letterSpacing: 0.8, textTransform: 'uppercase', flexShrink: 0 }}>
                            From
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#6366f1', fontSize: '0.72rem', fontWeight: 700, boxShadow: '0 2px 6px rgba(99,102,241,0.3)' }}>
                                {fromEmail?.[0]?.toUpperCase() || 'A'}
                            </Avatar>
                            {isReadOnly ? (
                                <Typography sx={{ color: '#1e293b', fontWeight: 500, fontSize: '0.875rem' }}>{fromEmail}</Typography>
                            ) : (
                                <input
                                    value={fromEmail}
                                    onChange={e => setFromEmail(e.target.value)}
                                    style={{
                                        border: 'none', outline: 'none', fontSize: '0.875rem',
                                        background: 'transparent', flex: 1, color: '#1e293b',
                                        fontFamily: 'inherit', fontWeight: 500
                                    }}
                                />
                            )}
                        </Box>
                    </Box>

                    {/* To Row */}
                    <Box sx={{ position: 'relative' }}>
                        <TagInput label="To" value={toEmail} onChange={setToEmail} disabled={isReadOnly} placeholder="Add recipients..." />
                        {!isReadOnly && (
                            <Box sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                                <Chip
                                    label="CC"
                                    size="small"
                                    onClick={() => setShowCc(!showCc)}
                                    sx={{
                                        height: 20, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                        bgcolor: showCc ? '#ede9fe' : '#f1f5f9',
                                        color: showCc ? '#6366f1' : '#64748b',
                                        border: showCc ? '1px solid #c4b5fd' : '1px solid transparent',
                                        '&:hover': { bgcolor: '#ede9fe', color: '#6366f1' },
                                        transition: 'all 0.2s'
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                    {!isReadOnly && toEmail && toEmail.includes(',') && (
                        <Box sx={{ px: 3, pb: 1.5, pt: 0.5, bgcolor: '#ffffff' }}>
                            <Typography variant="caption" sx={{ color: '#0ea5e9', fontWeight: 600, fontStyle: 'italic' }}>
                                * Note: Each supplier will receive a separate, personalized email. They will not see each other.
                            </Typography>
                        </Box>
                    )}

                    {/* CC Row */}
                    <Collapse in={showCc || (isReadOnly && !!ccEmail)}>
                        <TagInput label="CC" value={ccEmail} onChange={setCcEmail} disabled={isReadOnly} placeholder="Add CC recipients..." />
                    </Collapse>

                    {/* Subject Row */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', px: 3, py: 1.5,
                        '&:hover': { bgcolor: '#fafafa' }
                    }}>
                        <Typography sx={{ fontWeight: 700, color: '#94a3b8', width: 65, fontSize: '0.7rem', letterSpacing: 0.8, textTransform: 'uppercase', flexShrink: 0 }}>
                            Subject
                        </Typography>
                        {isReadOnly ? (
                            <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.95rem' }}>{subject}</Typography>
                        ) : (
                            <input
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Email subject line..."
                                style={{
                                    border: 'none', outline: 'none', fontSize: '0.95rem',
                                    background: 'transparent', flex: 1, color: '#1e293b',
                                    fontFamily: 'inherit', fontWeight: 700
                                }}
                            />
                        )}
                    </Box>
                </Box>

                {/* Message Body */}
                <Box sx={{ flex: 1, bgcolor: '#ffffff', minHeight: 200, position: 'relative' }}>
                    {!isReadOnly ? (
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            disabled={loading}
                            placeholder="Compose your message here...

Use {Supplier Name}, {Requester Name}, {Department Name} as dynamic placeholders."
                            style={{
                                width: '100%',
                                minHeight: 230,
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                padding: '20px 24px',
                                fontSize: '0.9rem',
                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                lineHeight: 1.85,
                                color: '#334155',
                                background: 'transparent',
                                boxSizing: 'border-box',
                                display: 'block'
                            }}
                        />
                    ) : (
                        <Box sx={{ px: 3, py: 3 }}>
                            <Typography sx={{ color: '#334155', lineHeight: 1.9, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                                {content}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Attachments Panel */}
                <Box sx={{ borderTop: '2px solid #f1f5f9', bgcolor: '#fafbfc', flexShrink: 0 }}>
                    {/* Attachments Header */}
                    <Box
                        sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#fafbfc' }}
                    >
                        <Box 
                            onClick={() => setShowAttachments(!showAttachments)}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', userSelect: 'none' }}
                        >
                            <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AttachFileIcon sx={{ fontSize: 15, color: '#6366f1' }} />
                            </Box>
                            <Typography sx={{ color: '#374151', fontWeight: 700, fontSize: '0.78rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                Attachments
                            </Typography>
                            <Chip
                                label={totalAttachments}
                                size="small"
                                sx={{ height: 19, fontSize: '0.65rem', bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 700, '& .MuiChip-label': { px: 1 } }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {!isReadOnly && (
                                <>
                                    <input 
                                        type="file" 
                                        multiple 
                                        hidden 
                                        ref={fileInputRef} 
                                        onChange={(e) => {
                                            setShowAttachments(true);
                                            handleFileUpload(e);
                                        }} 
                                    />
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={uploading ? <CircularProgress size={12} color="primary" /> : <CloudUploadIcon sx={{ fontSize: 15 }} />}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setShowAttachments(true);
                                            fileInputRef.current?.click();
                                        }}
                                        disabled={uploading}
                                        sx={{
                                            borderRadius: 1.5,
                                            borderColor: '#c4b5fd',
                                            bgcolor: '#ede9fe',
                                            color: '#6366f1',
                                            fontWeight: 700,
                                            fontSize: '0.72rem',
                                            textTransform: 'none',
                                            px: 1.5,
                                            py: 0.25,
                                            minHeight: 28,
                                            boxShadow: 'none',
                                            '&:hover': { bgcolor: '#ddd6fe', borderColor: '#a5b4fc' }
                                        }}
                                    >
                                        {uploading ? 'Uploading...' : 'Attach Files'}
                                    </Button>
                                </>
                            )}
                            <IconButton 
                                size="small" 
                                onClick={() => setShowAttachments(!showAttachments)}
                                sx={{ p: 0.5, color: '#94a3b8' }}
                            >
                                {showAttachments
                                    ? <ExpandLessIcon sx={{ fontSize: 18 }} />
                                    : <ExpandMoreIcon sx={{ fontSize: 18 }} />
                                }
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Attachments List */}
                    <Collapse in={showAttachments}>
                        <Box sx={{ px: 3, pb: 2.5, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* System Generated PDF */}
                            <AttachmentRow
                                name={`${(rfqNo || 'RFQ').replace(/\//g, '_')}.pdf`}
                                label="System Generated · Auto-attached"
                                isReadOnly={isReadOnly}
                                exportButton={
                                    <BOSExportButton
                                        iconOnly
                                        color="info"
                                        data={exportData}
                                        columns={exportColumns}
                                        filename={`RFQ_${(rfqNo || currentRfq?.rfqNo || rfqId)}`}
                                        reportTitle="REQUEST FOR QUOTATION"
                                        documentDetails={docDetails}
                                        ref={exportRef}
                                    />
                                }
                            />

                            {/* User Attachments */}
                            {userAttachments.map((att) => (
                                <AttachmentRow
                                    key={att.id}
                                    name={att.fileName}
                                    label="User Uploaded"
                                    isReadOnly={isReadOnly}
                                    onPreview={() => handleViewAttachment(att.filePath, att.fileName)}
                                    onDelete={() => handleDeleteAttachment(att.id)}
                                />
                            ))}
                        </Box>
                    </Collapse>
                </Box>
            </Box>

            {/* Footer Action Bar */}
            <Box sx={{
                borderTop: '1px solid #e2e8f0',
                px: 3, py: 2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                bgcolor: '#ffffff',
                flexShrink: 0,
                background: 'linear-gradient(to right, #fafbfc, #ffffff)'
            }}>
                <Box>
                    {!isReadOnly && (
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            Press <Box component="kbd" sx={{ px: 0.7, py: 0.2, borderRadius: 0.75, bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '0.68rem', fontFamily: 'monospace' }}>Enter</Box> or <Box component="kbd" sx={{ px: 0.7, py: 0.2, borderRadius: 0.75, bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '0.68rem', fontFamily: 'monospace' }}>,</Box> to add multiple email recipients
                        </Typography>
                    )}
                    {isReadOnly && (
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>This RFQ has already been sent to suppliers.</Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box
                        component="button"
                        onClick={onClose}
                        disabled={loading || uploading || resending || reminding}
                        sx={{
                            px: 3, py: 1.1,
                            border: '1px solid #e2e8f0', borderRadius: 2,
                            bgcolor: 'white', color: '#64748b',
                            cursor: 'pointer', fontSize: '0.85rem',
                            fontWeight: 600, fontFamily: 'inherit',
                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                            '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
                            transition: 'all 0.2s'
                        }}
                    >
                        Close
                    </Box>


                    {isResendMode && (
                        <>
                            <Box
                                component="button"
                                onClick={handleReminder}
                                disabled={reminding || resending || loading}
                                sx={{
                                    px: 2.5, py: 1.1,
                                    border: '1px solid #f59e0b', borderRadius: 2,
                                    background: reminding ? '#fef3c7' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                    color: '#92400e',
                                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
                                    '&:hover': { background: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)', transform: 'translateY(-1px)' },
                                    '&:disabled': { opacity: 0.6, cursor: 'not-allowed' },
                                    transition: 'all 0.2s'
                                }}
                            >
                                {reminding
                                    ? <><CircularProgress size={13} sx={{ color: '#92400e' }} /> Sending Reminder...</>
                                    : <><ReminderIcon sx={{ fontSize: 15 }} /> Send Reminder</>
                                }
                            </Box>
                            <Box
                                component="button"
                                onClick={handleResend}
                                disabled={resending || reminding || !isReady}
                                sx={{
                                    px: 3.5, py: 1.1,
                                    border: 'none', borderRadius: 2,
                                    background: isReady
                                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                        : '#e2e8f0',
                                    color: isReady ? 'white' : '#94a3b8',
                                    cursor: isReady ? 'pointer' : 'not-allowed',
                                    fontSize: '0.875rem', fontWeight: 700, fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    boxShadow: isReady ? '0 6px 20px rgba(99,102,241,0.4)' : 'none',
                                    '&:hover': {
                                        background: isReady ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#e2e8f0',
                                        transform: isReady ? 'translateY(-2px)' : 'none',
                                        boxShadow: isReady ? '0 10px 28px rgba(99,102,241,0.5)' : 'none'
                                    },
                                    '&:disabled': { cursor: 'not-allowed' },
                                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }}
                            >
                                {resending
                                    ? <><CircularProgress size={14} sx={{ color: 'white' }} /> Resending...</>
                                    : <><ReplayIcon sx={{ fontSize: 15 }} /> Resend RFQ</>
                                }
                            </Box>
                        </>
                    )}

                    {/* Normal edit mode: Send RFQ button */}
                    {!isReadOnly && !isResendMode && (
                        <Box
                            component="button"
                            onClick={handleSend}
                            disabled={loading || uploading || !isReady}
                            sx={{
                                px: 3.5, py: 1.1,
                                border: 'none', borderRadius: 2,
                                background: isReady
                                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                    : '#e2e8f0',
                                color: isReady ? 'white' : '#94a3b8',
                                cursor: isReady ? 'pointer' : 'not-allowed',
                                fontSize: '0.875rem', fontWeight: 700, fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 1,
                                boxShadow: isReady ? '0 6px 20px rgba(99,102,241,0.4)' : 'none',
                                transform: 'translateY(0)',
                                '&:hover': {
                                    background: isReady ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#e2e8f0',
                                    transform: isReady ? 'translateY(-2px)' : 'none',
                                    boxShadow: isReady ? '0 10px 28px rgba(99,102,241,0.5)' : 'none'
                                },
                                '&:disabled': { cursor: 'not-allowed' },
                                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                        >
                            {loading
                                ? <><CircularProgress size={14} sx={{ color: 'white' }} /> Sending...</>
                                : <><SendIcon sx={{ fontSize: 16 }} /> Send RFQ</>
                            }
                        </Box>
                    )}
                </Box>
            </Box>

            {previewOpen && (
                <BOSFilePreview
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    url={previewUrl}
                    fileName={previewName}
                />
            )}
        </Dialog>
    );
};

export default SendRfqDialog;
