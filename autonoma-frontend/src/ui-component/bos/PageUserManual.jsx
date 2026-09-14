import React, { useState } from 'react';
import { Box, Typography, Stack, Avatar, Card, Chip, Grid, IconButton, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { IconHelp, IconX } from '@tabler/icons-react';
import { PAGE_USER_MANUALS } from './PageUserManuals';

export default function PageUserManual({ pageCode }) {
  const theme = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  const pMain = theme.palette.primary.main;
  const pLight = theme.palette.primary.light;
  const isDark = theme.palette.mode === 'dark';

  if (!pageCode || !PAGE_USER_MANUALS[pageCode]) return null;

  const manual = PAGE_USER_MANUALS[pageCode];
  const isCustomComponent = typeof manual === 'function' || (typeof manual === 'object' && manual.$$typeof);

  return (
    <>
      <Box
        component="button"
        onClick={(e) => { e.stopPropagation(); setHelpOpen(true); }}
        title="User Manual / SOP"
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          border: `1px solid ${alpha(pMain, 0.3)}`,
          borderRadius: '20px',
          px: 1.2, py: 0.35,
          bgcolor: alpha(pMain, 0.08),
          color: isDark ? pLight : pMain,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.4,
          flexShrink: 0,
          transition: 'all 0.2s',
          '&:hover': { bgcolor: alpha(pMain, 0.18), borderColor: pMain, transform: 'scale(1.04)' },
        }}
      >
        <IconHelp size={13} />
        Help
      </Box>

      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 4, position: 'relative' } }}
      >
        {isCustomComponent ? (
          <Box sx={{ position: 'relative', bgcolor: '#eef1f6', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '90vh' }}>
            <IconButton
              onClick={() => setHelpOpen(false)}
              sx={{
                position: 'absolute', right: 24, top: 24, color: '#6b7280', zIndex: 1300,
                bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
              }}
            >
              <IconX size={20} />
            </IconButton>
            <Box sx={{ overflowY: 'auto', flexGrow: 1, pt: 2 }}>
              {React.createElement(manual, { onClose: () => setHelpOpen(false) })}
            </Box>
          </Box>
        ) : (
          <>
            <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: '#fff', py: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <IconHelp size={28} />
                <Typography variant="h3" color="inherit" fontWeight="bold">
                  {manual.title}
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 3, px: 4, bgcolor: theme.palette.mode === 'dark' ? '#121212' : '#f8fafc' }}>
              <Box sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#eff6ff', borderLeft: `5px solid ${theme.palette.primary.main}` }}>
                <Typography variant="body1" color={theme.palette.mode === 'dark' ? '#93c5fd' : '#1e3a8a'} fontWeight={500}>
                  {manual.introduction}
                </Typography>
              </Box>

              <Typography variant="h4" fontWeight="bold" gutterBottom color="primary" sx={{ mb: 2 }}>
                Standard Operating Procedure (SOP)
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {manual.steps?.map((step) => (
                  <Grid item xs={12} sm={6} key={step.num}>
                    <Card sx={{ p: 2.5, height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                      <Stack direction="row" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, color: '#fff', width: 32, height: 32, fontSize: 14, fontWeight: 'bold' }}>
                          {step.num}
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold">
                          {step.title}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="textSecondary" sx={{ pl: 0.5 }}>
                        {step.desc}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {manual.components && (
                <>
                  <Typography variant="h4" fontWeight="bold" gutterBottom color="primary" sx={{ mb: 2 }}>
                    Module Elements Reference
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    {manual.components.map((comp) => (
                      <Grid item xs={12} sm={4} key={comp.name}>
                        <Card sx={{ p: 2, height: '100%', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
                          <Chip label={comp.name} color="primary" size="small" variant="light" sx={{ mb: 1, fontWeight: 'bold' }} />
                          <Typography variant="body2" color="textSecondary">
                            {comp.desc}
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              {manual.statusFlow && (
                <>
                  <Typography variant="h4" fontWeight="bold" gutterBottom color="primary" sx={{ mb: 2 }}>
                    Workflow Status Pipeline
                  </Typography>
                  <Card sx={{ p: 3, mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, overflowX: 'auto' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ minWidth: 600 }}>
                      {manual.statusFlow.map((flow, index) => {
                        const isLast = index === manual.statusFlow.length - 1;
                        return (
                          <React.Fragment key={flow.status}>
                            <Box sx={{ textAlign: 'center', flex: 1 }}>
                              <Box sx={{
                                p: 1.25, borderRadius: 2.5, bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#eff6ff',
                                border: `2px solid ${theme.palette.primary.main}`, mb: 1, display: 'inline-block', minWidth: 130
                              }}>
                                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                  {flow.status}
                                </Typography>
                              </Box>
                              <Typography variant="caption" display="block" color="textSecondary" sx={{ px: 1, maxWidth: 150, mx: 'auto', lineHeight: 1.2 }}>
                                {flow.desc}
                              </Typography>
                            </Box>
                            {!isLast && (
                              <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.primary.light }}>
                                <Typography variant="h3" color="primary">➔</Typography>
                              </Box>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </Stack>
                  </Card>
                </>
              )}

              {manual.examples && (
                <>
                  <Typography variant="h4" fontWeight="bold" gutterBottom color="secondary" sx={{ mb: 2 }}>
                    Step-by-Step Examples
                  </Typography>
                  <Card sx={{ p: 2.5, borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f1f5f9', border: `1px solid ${theme.palette.divider}` }}>
                    <Stack gap={1.5}>
                      {manual.examples.map((ex, index) => (
                        <Stack direction="row" gap={1.5} alignItems="flex-start" key={index}>
                          <Chip label={`Ex ${index + 1}`} size="small" color="secondary" sx={{ fontWeight: 'bold' }} />
                          <Typography variant="body2" color="textPrimary" fontWeight={500} sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                            {ex}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Card>
                </>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}
