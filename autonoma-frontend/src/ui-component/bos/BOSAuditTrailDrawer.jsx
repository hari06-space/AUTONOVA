import React from 'react';
import { Box, Typography, IconButton, Stack } from '@mui/material';
import { IconHistory, IconChevronRight, IconChevronLeft } from '@tabler/icons-react';

const BOSAuditTrailDrawer = ({ showAudit, setShowAudit, auditLogs = [], formData = {} }) => {
  return (
    <>
      {/* Backdrop overlay when drawer is open */}
      {showAudit && (
        <Box
          onClick={() => setShowAudit(false)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.15)',
            zIndex: 1200,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* RIGHT SIDE AUDIT DRAWER */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 380,
          transform: showAudit ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1201,
          bgcolor: '#ffffff',
          boxShadow: showAudit ? '-8px 0 32px rgba(0,0,0,0.15)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #e2e8f0'
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1.5, display: 'flex' }}>
              <IconHistory size={20} color="#fff" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                Audit Details
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                {auditLogs?.length || 0} {(auditLogs?.length || 0) === 1 ? 'record' : 'records'}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setShowAudit(false)}
            sx={{
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <IconChevronRight size={20} />
          </IconButton>
        </Box>

        {/* Drawer Body — scrollable */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2.5,
            py: 2,
            '&::-webkit-scrollbar': { width: '5px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' }
          }}
        >
          <Stack spacing={2.5}>
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log, idx) => (
                <Box key={log.id || idx} sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: idx === 0 ? 'secondary.main' : 'primary.main',
                        mt: 0.5
                      }}
                    />
                    {idx !== auditLogs.length - 1 && <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider', minHeight: 40 }} />}
                  </Box>
                  <Box sx={{ width: '100%', overflow: 'hidden' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'capitalize' }}>
                      {log.actionType ? log.actionType.toLowerCase() : 'Update'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      By: <strong>{log.userId || log.createdBy || 'Admin'}</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {new Date(log.createdAt || log.createdDate).toLocaleString('en-GB')}
                    </Typography>

                    {(log.previousValue || log.currentValue) && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1, border: '1px solid #e2e8f0', width: '100%' }}>
                        <Typography variant="caption" sx={{ color: 'text.primary', display: 'block', mb: 0.5, fontWeight: 600 }}>
                          Changes:
                        </Typography>
                        {log.previousValue && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              display: 'block',
                              wordBreak: 'break-all',
                              fontFamily: 'monospace',
                              fontSize: '0.7rem'
                            }}
                          >
                            <span style={{ color: '#d32f2f' }}>- {log.previousValue}</span>
                          </Typography>
                        )}
                        {log.currentValue && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              display: 'block',
                              wordBreak: 'break-all',
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              mt: 0.5
                            }}
                          >
                            <span style={{ color: '#2e7d32' }}>+ {log.currentValue}</span>
                          </Typography>
                        )}
                      </Box>
                    )}

                    {log.comments && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        Note: {log.comments}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))
            ) : (
              <>
                <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5 }} />
                    {formData?.updatedDate && <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider', minHeight: 40 }} />}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      Record Created
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Created by: <strong>{formData?.createdBy || 'Admin'}</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {formData?.createdDate ? new Date(formData.createdDate).toLocaleString('en-GB') : '-'}
                    </Typography>
                  </Box>
                </Box>

                {formData?.updatedDate && (
                  <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'secondary.main', mt: 0.5 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        Last Updated
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Updated by: <strong>{formData?.updatedBy || 'Admin'}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        {new Date(formData.updatedDate).toLocaleString('en-GB')}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Floating Toggle Tab on the Right Edge — always visible, slides away when drawer opens */}
      <Box
        onClick={() => setShowAudit(true)}
        sx={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: showAudit ? 'translateX(400px) translateY(-50%)' : 'translateX(0) translateY(-50%)',
          bgcolor: '#1e293b',
          color: 'white',
          px: 0.75,
          py: 2.5,
          borderTopLeftRadius: 10,
          borderBottomLeftRadius: 10,
          cursor: 'pointer',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.25)',
          zIndex: 1199,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: '#334155'
          }
        }}
      >
        <IconHistory size={18} />
        <IconChevronLeft size={16} />
      </Box>
    </>
  );
};

export default BOSAuditTrailDrawer;
