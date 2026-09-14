import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Paper,
  Divider,
  Avatar
} from '@mui/material';
import {
  IconVolume as Volume2,
  IconVolumeOff as VolumeX,
  IconPlayerPlay as Play,
  IconCircleCheck as CheckCircle,
  IconAlertTriangle as AlertTriangle,
  IconClock as Clock,
  IconBriefcase as Briefcase,
  IconTrendingUp as TrendingUp,
  IconSearch as Search,
  IconCheck as Check,
  IconX as X,
  IconAward as Award,
  IconBolt as Zap,
  IconRefresh as RefreshCw
} from '@tabler/icons-react';
import Chart from 'react-apexcharts';
import axios from 'utils/axios';

// ==========================================
// 1. AI Executive Briefing Component
// ==========================================
export function AiBriefing({ briefing, onRefresh }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [index, setIndex] = useState(0);

  // Simple typing effect
  useEffect(() => {
    if (!briefing) return;
    setTypedText('');
    setIndex(0);
  }, [briefing]);

  useEffect(() => {
    if (!briefing || index >= briefing.length) return;
    const timeout = setTimeout(() => {
      setTypedText((prev) => prev + briefing.charAt(index));
      setIndex((prev) => prev + 1);
    }, 12); // Typing speed
    return () => clearTimeout(timeout);
  }, [briefing, index]);

  const handleSpeak = () => {
    if (!briefing) return;
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        const textToSpeak = briefing.replace(/\*\*|•/g, ''); // strip out markdown asterisks/bullets
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    } else {
      alert('Text-to-speech is not supported in this browser.');
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="glass-card" style={{ borderLeft: '4px solid #3b82f6' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Zap size={20} color="#3b82f6" />
          <Typography variant="h4" fontWeight="700">AI COO Executive Briefing</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton size="small" onClick={handleSpeak} color="primary" title="Read Aloud">
            {isPlaying ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </IconButton>
          <IconButton size="small" onClick={onRefresh} color="primary" title="Re-Generate">
            <RefreshCw size={18} />
          </IconButton>
        </Box>
      </Box>
      <div 
        style={{ 
          whiteSpace: 'pre-wrap', 
          fontSize: '1.05rem', 
          lineHeight: '1.6', 
          color: 'inherit' 
        }} 
        className={index < (briefing?.length || 0) ? "ai-typewriter" : ""}
      >
        {typedText || 'Analyzing live business parameters...'}
      </div>
    </div>
  );
}

// ==========================================
// 2. Health Scores Component
// ==========================================
export function HealthScores({ overall, breakdown }) {
  const [selectedDept, setSelectedDept] = useState(null);

  const getStatusColor = (val) => {
    if (val >= 90) return 'green';
    if (val >= 80) return 'yellow';
    return 'red';
  };

  // Radial Bar Chart Options for overall score
  const chartOptions = {
    chart: {
      type: 'radialBar',
      offsetY: -10
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        dataLabels: {
          name: {
            fontSize: '16px',
            color: '#94a3b8',
            offsetY: 120
          },
          value: {
            offsetY: 76,
            fontSize: '36px',
            fontWeight: '800',
            color: 'inherit',
            formatter: function (val) {
              return val + "%";
            }
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        shadeIntensity: 0.15,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 65, 91]
      }
    },
    stroke: {
      dashArray: 4
    },
    labels: ['BOS Operational Health']
  };

  return (
    <div className="glass-card">
      <Typography variant="h4" fontWeight="700" mb={3}>Company Health Score</Typography>
      
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={4} display="flex" justifyContent="center">
          <Box width={220} height={220} position="relative">
            <Chart
              options={chartOptions}
              series={[overall || 0]}
              type="radialBar"
              height={280}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {breakdown && Object.entries(breakdown).map(([dept, val]) => {
              const status = getStatusColor(val);
              return (
                <Grid item xs={6} sm={4} key={dept}>
                  <Card 
                    className={`glass-card ${status}`}
                    style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                    onClick={() => setSelectedDept({ name: dept, score: val })}
                  >
                    <Typography variant="subtitle2" color="textSecondary">{dept}</Typography>
                    <Typography variant="h3" fontWeight="800" mt={0.5}>
                      {val}%
                    </Typography>
                    <span className={`dept-health-badge badge-${status}`} style={{ marginTop: '8px', scale: '0.9' }}>
                      {status === 'green' ? 'Healthy' : status === 'yellow' ? 'Attention' : 'Critical'}
                    </span>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>

      {/* Drill-down Dialog */}
      <Dialog open={selectedDept !== null} onClose={() => setSelectedDept(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: '700' }}>
          Department Analytics: {selectedDept?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={2} textAlign="center">
            <Typography variant="h2" fontWeight="800" color="primary">
              {selectedDept?.score}%
            </Typography>
            <Typography variant="body2" color="textSecondary">Live Operational Health Rating</Typography>
          </Box>
          <Typography variant="body1" mb={2}>
            This score is dynamically computed from KPI targets including ticket SLA resolutions, inventory turnover rates, QC rejection rates, and maintenance schedule conformance.
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box>
              <Typography variant="caption">SLA Performance Target</Typography>
              <LinearProgress variant="determinate" value={selectedDept?.score || 0} color={selectedDept?.score >= 90 ? "success" : "warning"} />
            </Box>
            <Box>
              <Typography variant="caption">Workload Allocation</Typography>
              <LinearProgress variant="determinate" value={85} color="primary" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDept(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// ==========================================
// 3. Live counters & Operations
// ==========================================
export function LiveCounters({ counters }) {
  if (!counters) return null;
  
  const counterItems = [
    { label: 'Employees Present', value: counters.employeesPresent, status: 'green' },
    { label: 'Employees Working', value: counters.employeesWorking, status: 'green' },
    { label: 'Employees Absent', value: counters.employeesAbsent, status: 'yellow' },
    { label: 'Active Users', value: counters.activeUsers, status: 'green' },
    { label: 'Sales Orders Today', value: counters.salesOrdersToday, status: 'green' },
    { label: 'Purchase Orders Today', value: counters.purchaseOrdersToday, status: 'green' },
    { label: 'Production Runs', value: counters.productionOrdersRunning, status: 'green' },
    { label: 'Approvals Pending', value: counters.approvalsPending, status: 'yellow' },
    { label: 'Dispatches Pending', value: counters.dispatchPending, status: 'yellow' },
    { label: 'Breakdowns Active', value: counters.machineBreakdownCount, status: counters.machineBreakdownCount > 0 ? 'red' : 'green' },
  ];

  return (
    <div className="glass-card">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="700">Live Operations</Typography>
        <div className="live-indicator">
          <div className="live-dot" />
          Live Counters
        </div>
      </Box>
      <Grid container spacing={2}>
        {counterItems.map((item, idx) => (
          <Grid item xs={6} sm={4} md={2.4} key={idx}>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center', minHeight: '100px' }}>
              <Typography variant="caption" color="textSecondary" style={{ display: 'block', minHeight: '32px' }}>
                {item.label}
              </Typography>
              <Typography variant="h2" fontWeight="800" mt={1}>
                {item.value}
              </Typography>
            </div>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

// ==========================================
// 4. Today's Business Summary Component
// ==========================================
export function BusinessSummary({ summary }) {
  if (!summary) return null;

  const items = [
    { label: 'Revenue Today', value: `₹${(summary.revenueToday / 100000).toFixed(1)}L`, icon: TrendingUp },
    { label: 'Production Output', value: `${summary.productionToday} units`, icon: Award },
    { label: 'Sales Volume', value: `₹${(summary.salesToday / 100000).toFixed(1)}L`, icon: Briefcase },
    { label: 'Collections Recd', value: `₹${(summary.collections / 100000).toFixed(1)}L`, icon: CheckCircle },
    { label: 'Downtime Minutes', value: `${summary.machineDowntime}m`, icon: Clock, critical: summary.machineDowntime > 60 },
  ];

  return (
    <div className="glass-card">
      <Typography variant="h4" fontWeight="700" mb={3}>Today's Business Summary</Typography>
      <Grid container spacing={3}>
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Grid item xs={12} sm={6} md={2.4} key={idx}>
              <Box display="flex" alignItems="center" gap={2} p={1}>
                <Avatar sx={{ bgcolor: item.critical ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: item.critical ? '#ef4444' : '#3b82f6' }}>
                  <Icon size={20} />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary">{item.label}</Typography>
                  <Typography variant="h3" fontWeight="800">{item.value}</Typography>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </div>
  );
}

// ==========================================
// 5. Performers and Balancer Component
// ==========================================
export function TopPerformersAndBalancing({ performers, supportNeeded, workloadBalancer }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <div className="glass-card" style={{ height: '100%' }}>
          <Typography variant="h4" fontWeight="700" mb={3}>Top Performers</Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {performers && performers.map((p, idx) => (
              <Box key={idx} display="flex" justifyContent="space-between" alignItems="center" p={1.5} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="700">{p.name}</Typography>
                  <Typography variant="caption" color="textSecondary">{p.department}</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h4" fontWeight="800" color="#10b981">{p.performanceScore}%</Typography>
                  <Typography variant="caption" color="textSecondary">Score</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </div>
      </Grid>

      <Grid item xs={12} md={4}>
        <div className="glass-card" style={{ height: '100%' }}>
          <Typography variant="h4" fontWeight="700" mb={3}>Needs Support</Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {supportNeeded && supportNeeded.map((emp, idx) => (
              <Box key={idx} p={1.5} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: '3px solid #f59e0b' }}>
                <Typography variant="subtitle2" fontWeight="700">{emp.name} ({emp.department})</Typography>
                <Typography variant="body2" color="error" mt={0.5}>{emp.reason}: {emp.details}</Typography>
                <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: '4px' }}>
                  Action: {emp.recommendedAction}
                </Typography>
              </Box>
            ))}
          </Box>
        </div>
      </Grid>

      <Grid item xs={12} md={4}>
        <div className="glass-card" style={{ height: '100%' }}>
          <Typography variant="h4" fontWeight="700" mb={3}>Workload Balancer</Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            {workloadBalancer && Object.entries(workloadBalancer.status).map(([dept, status]) => {
              const color = status === 'Overloaded' ? '#ef4444' : status === 'Underutilized' ? '#3b82f6' : '#10b981';
              return (
                <Box key={dept} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight="600">{dept}</Typography>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: '700',
                    background: color + '22',
                    color: color
                  }}>
                    {status}
                  </span>
                </Box>
              );
            })}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="primary" fontWeight="600">
            AI Suggestion: {workloadBalancer?.suggestion}
          </Typography>
        </div>
      </Grid>
    </Grid>
  );
}

// ==========================================
// 6. Bottlenecks & Alerts Component (with SSE)
// ==========================================
export function BottlenecksAlerts({ bottlenecks, initialAlerts }) {
  const [alerts, setAlerts] = useState(initialAlerts || []);

  useEffect(() => {
    // Connect to Server-Sent Events stream for live alerts
    const token = sessionStorage.getItem('serviceToken');
    const streamUrl = `/api/executive/stream?token=${token}`;
    
    let eventSource;
    try {
      eventSource = new EventSource(streamUrl);
      eventSource.addEventListener('alert', (e) => {
        try {
          const newAlert = JSON.parse(e.data);
          setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]); // Keep last 5 alerts
          // Trigger audio warning beep if critical
          if (newAlert.level === 'CRITICAL') {
            playBeep();
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      });
    } catch (err) {
      console.error('SSE connection error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
      oscillator.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // beep duration 150ms
    } catch (ignored) {}
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <div className="glass-card" style={{ height: '100%' }}>
          <Typography variant="h4" fontWeight="700" mb={3}>Bottleneck Detection</Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {bottlenecks && bottlenecks.map((item, idx) => (
              <Box key={idx} p={2} sx={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <Box display="flex" gap={1} alignItems="center">
                  <AlertTriangle size={16} color="#ef4444" />
                  <Typography variant="subtitle2" fontWeight="700" color="error">{item.cause}</Typography>
                </Box>
                <Typography variant="body2" mt={0.5}>{item.impact}</Typography>
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="caption" color="textSecondary">Loss: {item.businessLoss}</Typography>
                  <Typography variant="caption" color="primary" fontWeight="600">Action: {item.recommendedAction}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </div>
      </Grid>

      <Grid item xs={12} md={6}>
        <div className="glass-card" style={{ height: '100%' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" fontWeight="700">Live Alert Center</Typography>
            <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div className="live-dot" /> Live Events Active
            </span>
          </Box>
          <Box display="flex" flexDirection="column" gap={1.5} maxHeight={320} style={{ overflowY: 'auto' }}>
            {alerts.length === 0 ? (
              <Typography variant="body2" color="textSecondary">Awaiting live operations feeds...</Typography>
            ) : (
              alerts.map((alert, idx) => {
                const color = alert.level === 'CRITICAL' ? '#ef4444' : alert.level === 'WARNING' ? '#f59e0b' : '#3b82f6';
                return (
                  <Box key={idx} p={1.5} sx={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '8px', 
                    borderLeft: `3px solid ${color}`,
                    animation: 'fadeIn 0.5s ease-out'
                  }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" fontWeight="700" style={{ color }}>
                        {alert.type}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">{alert.duration || 'Just now'}</Typography>
                    </Box>
                    <Typography variant="body2" mt={0.5}>{alert.message}</Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </div>
      </Grid>
    </Grid>
  );
}

// ==========================================
// 7. Timeline & Risk Components
// ==========================================
export function TimelineAndRisk({ timeline, riskMeter }) {
  const [activeStep, setActiveStep] = useState(timeline?.length || 0);
  const [isReplaying, setIsReplaying] = useState(false);

  const handleReplay = () => {
    if (isReplaying || !timeline) return;
    setIsReplaying(true);
    setActiveStep(0);
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setActiveStep(step);
      if (step >= timeline.length) {
        clearInterval(interval);
        setIsReplaying(false);
      }
    }, 1500); // 1.5s per timeline milestone
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <div className="glass-card">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" fontWeight="700">Company Timeline (Today's Replay)</Typography>
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<Play size={14} />} 
              onClick={handleReplay}
              disabled={isReplaying}
            >
              Replay Day
            </Button>
          </Box>
          <Box display="flex" flexDirection="column" mt={1}>
            {timeline && timeline.slice(0, activeStep).map((evt, idx) => (
              <div key={idx} className="timeline-item completed">
                <Typography variant="caption" color="textSecondary">{evt.time}</Typography>
                <Typography variant="subtitle2" fontWeight="700">{evt.title}</Typography>
                <Typography variant="body2" color="textSecondary">{evt.description}</Typography>
              </div>
            ))}
          </Box>
        </div>
      </Grid>

      <Grid item xs={12} md={5}>
        <div className="glass-card" style={{ height: '100%' }}>
          <Typography variant="h4" fontWeight="700" mb={3}>Operational Risk Meter</Typography>
          <Grid container spacing={2}>
            {riskMeter && Object.entries(riskMeter).map(([risk, val]) => {
              const numericVal = Number(val);
              const color = numericVal >= 50 ? '#ef4444' : numericVal >= 30 ? '#f59e0b' : '#10b981';
              return (
                <Grid item xs={6} key={risk}>
                  <Box p={2} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <Typography variant="caption" color="textSecondary">{risk}</Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                      <Typography variant="h3" fontWeight="800" style={{ color }}>{numericVal}%</Typography>
                      <Box width="60%">
                        <LinearProgress variant="determinate" value={numericVal} sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          '& .MuiLinearProgress-bar': { backgroundColor: color }
                        }} />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </div>
      </Grid>
    </Grid>
  );
}

// ==========================================
// 8. Executive Decision Center Component
// ==========================================
export function DecisionCenter({ decisions, onDecisionApproved }) {
  const [actioningId, setActioningId] = useState(null);

  const handleAction = async (id, action) => {
    setActioningId(id);
    try {
      const res = await axios.post('/api/executive/approve', { id, action });
      if (res.data?.success) {
        onDecisionApproved(id);
      }
    } catch (err) {
      console.error('Approval request failed:', err);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="glass-card">
      <Typography variant="h4" fontWeight="700" mb={3}>Executive Decision Center</Typography>
      {decisions && decisions.length === 0 ? (
        <Box textAlign="center" p={3}>
          <CheckCircle size={36} color="#10b981" />
          <Typography variant="subtitle1" fontWeight="700" mt={1}>All approvals caught up!</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {decisions && decisions.map((item) => (
            <Grid item xs={12} md={4} key={item.id}>
              <Card className="glass-card" style={{ padding: '20px', border: '1px solid rgba(59,130,246,0.15)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="subtitle1" fontWeight="700" style={{ maxWidth: '75%' }}>
                    {item.requestName}
                  </Typography>
                  <Typography variant="h4" fontWeight="800" color="primary">
                    {item.value}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" mt={1} style={{ minHeight: '48px' }}>
                  {item.businessImpact}
                </Typography>
                <Box display="flex" gap={1.5} mt={3}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="success" 
                    size="small"
                    startIcon={<Check size={14} />}
                    onClick={() => handleAction(item.id, 'approve')}
                    disabled={actioningId === item.id}
                  >
                    Approve
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    startIcon={<X size={14} />}
                    onClick={() => handleAction(item.id, 'reject')}
                    disabled={actioningId === item.id}
                  >
                    Reject
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
}

// ==========================================
// 9. Smart Global Search (AI Assistant Query)
// ==========================================
export function SmartSearch() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await axios.get(`/api/executive/search?query=${encodeURIComponent(query)}`);
      setResponse(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <Typography variant="h4" fontWeight="700" mb={2}>Smart Global Search</Typography>
      <form onSubmit={handleSearch}>
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            placeholder="Ask anything, e.g., 'Why is production low today?' or 'Show delayed customer orders'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            size="small"
            InputProps={{
              startAdornment: <Search size={16} style={{ marginRight: '8px', color: '#64748b' }} />
            }}
          />
          <Button variant="contained" type="submit" disabled={loading}>
            Query AI
          </Button>
        </Box>
      </form>

      {loading && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Typography variant="caption">Querying operational model...</Typography>
        </Box>
      )}

      {response && (
        <Paper elevation={0} sx={{ p: 2, mt: 2, bgcolor: 'rgba(255,255,255,0.02)', borderLeft: `4px solid ${response.type === 'critical' ? '#ef4444' : response.type === 'warning' ? '#f59e0b' : '#10b981'}` }}>
          <Typography variant="subtitle2" fontWeight="700" color="primary">AI Findings ({response.intent})</Typography>
          <Typography variant="body1" mt={0.5}>{response.message}</Typography>
          <Typography variant="body2" color="textSecondary" mt={1} fontWeight="600">
            Recommended Action: {response.suggestedAction}
          </Typography>
        </Paper>
      )}
    </div>
  );
}

// ==========================================
// 10. Executive Digest Component
// ==========================================
export function ExecutiveDigest() {
  const [period, setPeriod] = useState('daily');
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDigest = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/executive/digest?period=${period}`);
      setDigest(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDigest();
  }, [period]);

  const revenueOptions = {
    chart: { type: 'area', toolbar: { show: false } },
    colors: ['#3b82f6'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' },
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }
  };

  return (
    <div className="glass-card">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="700">Executive Digest</Typography>
        <Box display="flex" gap={1}>
          {['daily', 'weekly', 'monthly'].map((p) => (
            <Button
              key={p}
              size="small"
              variant={period === p ? 'contained' : 'outlined'}
              onClick={() => setPeriod(p)}
            >
              {p.toUpperCase()}
            </Button>
          ))}
        </Box>
      </Box>

      {loading && <Typography variant="caption">Synthesizing digest summaries...</Typography>}

      {digest && !loading && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="700" mb={1} color="primary">Key Achievements</Typography>
            <ul>
              {digest.topAchievements.map((ach, idx) => <li key={idx} style={{ paddingBottom: '6px', fontSize: '0.9rem' }}>{ach}</li>)}
            </ul>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="700" mb={1} color="error">Key Risks Identified</Typography>
            <ul>
              {digest.majorRisks.map((r, idx) => <li key={idx} style={{ paddingBottom: '6px', fontSize: '0.9rem' }}>{r}</li>)}
            </ul>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="700" mb={2}>Operational Trends (Past 6 Periods)</Typography>
            <Chart
              options={revenueOptions}
              series={[{ name: 'Revenue Clocked (Lakhs)', data: digest.revenueTrend }]}
              type="area"
              height={180}
            />
          </Grid>
        </Grid>
      )}
    </div>
  );
}
