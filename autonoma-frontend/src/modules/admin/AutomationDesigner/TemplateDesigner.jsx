import { useState } from 'react';
import {
  Grid, Box, Button, Typography, Stack, Card, TextField,
  IconButton, Tooltip, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, useTheme
} from '@mui/material';
import {
  IconLayout, IconTextSize, IconPhoto, IconTable,
  IconHeading, IconTrash, IconDeviceFloppy, IconEye, IconPlus
} from '@tabler/icons-react';
import { btnSave, btnCancel, btnNew } from 'ui-component/bos';

export default function TemplateDesigner({ template, onSave, onCancel }) {
  const theme = useTheme();
  const [name, setName] = useState(template?.templateName || 'New Template Layout');
  const [type, setType] = useState(template?.templateType || 'EMAIL');
  const [subject, setSubject] = useState(template?.subject || '');
  const [components, setComponents] = useState(
    template?.templateJson ? JSON.parse(template.templateJson) : [
      { id: '1', type: 'HEADER', text: 'Business Notification Header', color: '#1a223f', align: 'left', fontSize: 20 },
      { id: '2', type: 'TEXT', text: 'Dear {{employeeName}},\n\nHere is your custom summary.', align: 'left', fontSize: 13 },
      { id: '3', type: 'TABLE', text: '{{reportData}}', align: 'center' },
      { id: '4', type: 'FOOTER', text: 'Thank you, Admin Team.', color: '#777777', align: 'left', fontSize: 11 }
    ]
  );

  const [selectedId, setSelectedId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Palette Components
  const PALETTE = [
    { type: 'HEADER', label: 'Title Header', icon: <IconHeading size={18} />, default: { text: 'New Header Title', color: '#1a223f', align: 'left', fontSize: 22 } },
    { type: 'TEXT', label: 'Rich Text Paragraph', icon: <IconTextSize size={18} />, default: { text: 'Enter paragraph text here. Support placeholders like {{employeeName}}.', align: 'left', fontSize: 13 } },
    { type: 'TABLE', label: 'Report Table Grid', icon: <IconTable size={18} />, default: { text: '{{reportData}}', align: 'center' } },
    { type: 'LOGO', label: 'Company Brand logo', icon: <IconPhoto size={18} />, default: { text: 'LOGO_URL', align: 'left' } },
    { type: 'FOOTER', label: 'System Footer Note', icon: <IconLayout size={18} />, default: { text: 'This is an automated notification.', color: '#777777', align: 'left', fontSize: 11 } }
  ];

  const handleAddComponent = (item) => {
    const newComp = {
      id: String(Date.now()),
      type: item.type,
      ...item.default
    };
    setComponents([...components, newComp]);
    setSelectedId(newComp.id);
  };

  const handleUpdateComponent = (id, field, value) => {
    setComponents(components.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleDeleteComponent = (id) => {
    setComponents(components.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSave = () => {
    const payload = {
      ...template,
      templateName: name,
      templateType: type,
      subject: subject,
      templateJson: JSON.stringify(components)
    };
    onSave(payload);
  };

  const selectedComp = components.find(c => c.id === selectedId);

  // Compile mock HTML for preview
  const compilePreviewHtml = () => {
    let html = `<html><body style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">`;
    components.forEach(c => {
      let alignStyle = `text-align: ${c.align || 'left'};`;
      let colorStyle = c.color ? `color: ${c.color};` : '';
      let fontStyle = c.fontSize ? `font-size: ${c.fontSize}px;` : '';

      if (c.type === 'HEADER') {
        html += `<h2 style="${alignStyle} ${colorStyle} ${fontStyle} margin-bottom: 15px;">${c.text}</h2>`;
      } else if (c.type === 'TEXT') {
        let text = c.text
          .replace('{{employeeName}}', 'Jane Doe')
          .replace('{{department}}', 'Information Technology')
          .replace('{{todayDate}}', '2026-06-09')
          .replace('\n', '<br/>');
        html += `<p style="${alignStyle} ${fontStyle}">${text}</p>`;
      } else if (c.type === 'TABLE') {
        html += `
          <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; font-size:12px; margin: 15px 0;">
            <tr style="background:#1a223f; color:#fff;">
              <th>Employee Code</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
            <tr>
              <td>EMP-001</td>
              <td>Jane Doe</td>
              <td>Information Technology</td>
              <td style="color:green;">Present</td>
            </tr>
            <tr style="background:#f9f9f9;">
              <td>EMP-002</td>
              <td>John Smith</td>
              <td>Finance</td>
              <td style="color:red;">Absent</td>
            </tr>
          </table>
        `;
      } else if (c.type === 'LOGO') {
        html += `<div style="${alignStyle} margin: 10px 0;"><span style="background:#e2e8f0; padding:10px 20px; border-radius:8px; font-weight:bold; font-size:12px; border:1px dashed #cbd5e1;">[ COMPANY BRAND LOGO ]</span></div>`;
      } else if (c.type === 'FOOTER') {
        html += `<div style="${alignStyle} ${colorStyle} ${fontStyle} margin-top:20px; border-top:1px solid #ddd; padding-top:10px;">${c.text}</div>`;
      }
    });
    html += `</body></html>`;
    return html;
  };

  return (
    <Card sx={{ p: 2, minHeight: '80vh', border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={2.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h3">Visual Workspace Designer</Typography>
          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" sx={btnCancel} onClick={onCancel}>Cancel</Button>
            <Button variant="contained" startIcon={<IconEye size={18} />} sx={btnNew} onClick={() => setPreviewOpen(true)}>Live Preview</Button>
            <Button variant="contained" startIcon={<IconDeviceFloppy size={18} />} sx={btnSave} onClick={handleSave}>Save Designer</Button>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* Metadata settings */}
          <Grid item xs={12} md={4}><TextField fullWidth label="Template Name" value={name} onChange={e => setName(e.target.value)} /></Grid>
          <Grid item xs={12} md={4}><TextField select fullWidth label="Output Channel Type" value={type} onChange={e => setType(e.target.value)}><MenuItem value="EMAIL">Email Body Format</MenuItem><MenuItem value="PDF">PDF Report Document</MenuItem><MenuItem value="EXCEL">Excel Worksheet</MenuItem></TextField></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth label="Subject (Email only)" value={subject} onChange={e => setSubject(e.target.value)} disabled={type !== 'EMAIL'} placeholder="e.g. Birthday Wishes for {{employeeName}}" /></Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Left Panel: Elements Palette */}
          <Grid item xs={12} md={3}>
            <Stack spacing={2}>
              <Typography variant="h4" sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>Element Palette</Typography>
              <Grid container spacing={1.5}>
                {PALETTE.map(item => (
                  <Grid item xs={12} key={item.type}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={item.icon}
                      onClick={() => handleAddComponent(item)}
                      sx={{
                        justifyContent: 'flex-start',
                        p: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      {item.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <Typography variant="h5" color="primary.main" gutterBottom>Tokens Supported</Typography>
                <Stack spacing={0.5}>
                  <code style={{ fontSize: '11px' }}>{"{{employeeName}}"}</code>
                  <code style={{ fontSize: '11px' }}>{"{{department}}"}</code>
                  <code style={{ fontSize: '11px' }}>{"{{todayDate}}"}</code>
                  <code style={{ fontSize: '11px' }}>{"{{reportData}}"}</code>
                </Stack>
              </Box>
            </Stack>
          </Grid>

          {/* Center: Canvas Workspace */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                minHeight: '55vh',
                bgcolor: theme.palette.mode === 'dark' ? 'dark.900' : 'grey.100',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography variant="body2" color="textSecondary" align="center">Workspace Drag & Drop Target Area</Typography>

              {components.map((c, index) => {
                const isSelected = c.id === selectedId;
                return (
                  <Card
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    sx={{
                      p: 2,
                      position: 'relative',
                      border: '1.5px solid',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      cursor: 'pointer',
                      boxShadow: isSelected ? 3 : 1,
                      '&:hover': {
                        borderColor: isSelected ? 'primary.main' : 'primary.light'
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" sx={{ bgcolor: 'primary.light', color: 'primary.main', px: 1, py: 0.2, borderRadius: 1, fontWeight: 'bold' }}>
                          {c.type}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">Element #{index + 1}</Typography>
                      </Stack>
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteComponent(c.id); }}>
                        <IconTrash size={16} />
                      </IconButton>
                    </Stack>

                    {c.type === 'HEADER' && (
                      <Typography variant="h3" sx={{ textAlign: c.align || 'left', color: c.color }}>
                        {c.text || 'Untitled Title Header'}
                      </Typography>
                    )}

                    {c.type === 'TEXT' && (
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line', textAlign: c.align || 'left', fontSize: c.fontSize }}>
                        {c.text || 'Double click to enter paragraphs...'}
                      </Typography>
                    )}

                    {c.type === 'TABLE' && (
                      <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1.5, borderRadius: 1, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Stack spacing={1} alignItems="center">
                          <IconTable size={24} color={theme.palette.primary.main} />
                          <Typography variant="subtitle2">Tabular Dataset Grid placeholder: {c.text}</Typography>
                        </Stack>
                      </Box>
                    )}

                    {c.type === 'LOGO' && (
                      <Box sx={{ display: 'flex', justifyContent: c.align === 'left' ? 'flex-start' : c.align === 'center' ? 'center' : 'flex-end' }}>
                        <Box sx={{ border: '1px dashed', borderColor: 'divider', px: 3, py: 1.5, bgcolor: 'background.paper', borderRadius: 1, fontWeight: 'bold', fontSize: '12px' }}>
                          [ LOGO PLACEHOLDER ]
                        </Box>
                      </Box>
                    )}

                    {c.type === 'FOOTER' && (
                      <Typography variant="caption" display="block" sx={{ textAlign: c.align || 'left', color: c.color, fontSize: c.fontSize, borderTop: '1px solid', borderColor: 'divider', pt: 1, mt: 1 }}>
                        {c.text || 'System footer details...'}
                      </Typography>
                    )}
                  </Card>
                );
              })}
            </Box>
          </Grid>

          {/* Right Panel: Selected element settings */}
          <Grid item xs={12} md={3}>
            <Stack spacing={2}>
              <Typography variant="h4" sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>Element Properties</Typography>
              {selectedComp ? (
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Component Text Content"
                    multiline
                    rows={4}
                    value={selectedComp.text || ''}
                    onChange={e => handleUpdateComponent(selectedComp.id, 'text', e.target.value)}
                  />

                  {['HEADER', 'TEXT', 'FOOTER'].includes(selectedComp.type) && (
                    <TextField
                      fullWidth
                      label="Font Size (px)"
                      type="number"
                      value={selectedComp.fontSize || ''}
                      onChange={e => handleUpdateComponent(selectedComp.id, 'fontSize', Number(e.target.value))}
                    />
                  )}

                  <TextField
                    select
                    fullWidth
                    label="Alignment"
                    value={selectedComp.align || 'left'}
                    onChange={e => handleUpdateComponent(selectedComp.id, 'align', e.target.value)}
                  >
                    <MenuItem value="left">Left Aligned</MenuItem>
                    <MenuItem value="center">Centered</MenuItem>
                    <MenuItem value="right">Right Aligned</MenuItem>
                  </TextField>

                  {['HEADER', 'FOOTER'].includes(selectedComp.type) && (
                    <TextField
                      fullWidth
                      label="Text Hex Color Code"
                      value={selectedComp.color || ''}
                      onChange={e => handleUpdateComponent(selectedComp.id, 'color', e.target.value)}
                      placeholder="#1a223f"
                    />
                  )}
                </Stack>
              ) : (
                <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                  Select a component in the workspace to modify its properties.
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      {/* HTML Render modal preview */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h3">HTML Layout Render Output Preview</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              minHeight: '400px'
            }}
          >
            <iframe
              srcDoc={compilePreviewHtml()}
              title="Template Preview"
              style={{ width: '100%', height: '450px', border: 'none' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)} variant="contained" sx={btnNew}>Close Preview</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
