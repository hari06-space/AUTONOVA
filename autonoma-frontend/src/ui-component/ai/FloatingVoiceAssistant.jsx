import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Tooltip, Drawer, Typography, IconButton, Paper, Grid, TextField, CircularProgress
} from '@mui/material';
import { 
  IconSparkles, IconClock, IconMessage, IconFileText, 
  IconChartBar, IconBulb, IconPlus, IconMicrophone, IconSend,
  IconMaximize, IconMinimize, IconX, IconLayoutDashboard
} from '@tabler/icons-react';
import { Player } from '@lottiefiles/react-lottie-player';
import assistantAnimationInside from 'assets/Gif/Assistant1.json';
import useAuth from 'hooks/useAuth';
import axios from 'utils/axios';

const GlowingWave = ({ active, color = '#3b82f6' }) => {
  const [volumes, setVolumes] = useState(Array(15).fill(1));
  const animationRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setVolumes(Array(15).fill(1));
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const renderFrame = () => {
          if (!audioCtxRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          
          // Scale volume and add a base height of 1
          const normalizedVol = Math.min(Math.max(avg / 80, 0), 2.5);
          
          const newVols = Array(15).fill(1).map((_, i) => {
             const distFromCenter = Math.abs(i - 7);
             const heightFactor = Math.max(1 - (distFromCenter * 0.15), 0.1);
             // When speaking, bars in center jump higher
             return 1 + (normalizedVol * heightFactor * 1.5); 
          });
          
          setVolumes(newVols);
          animationRef.current = requestAnimationFrame(renderFrame);
        };
        renderFrame();
      } catch (err) {
        console.error("Audio access denied for visualizer", err);
      }
    };
    startAudio();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, [active]);

  if (!active) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40, my: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#94a3b8' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60, width: 150, my: 1, overflow: 'hidden' }}>
      {volumes.map((vol, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            left: `${i * 10}px`,
            width: 6,
            height: 6 * vol,
            borderRadius: '10px',
            bgcolor: color,
            boxShadow: `0 0 ${8 * vol}px ${color}, 0 0 ${15 * vol}px ${color}`,
            transition: 'height 0.05s ease-out, box-shadow 0.05s ease-out',
            transform: 'translateY(-50%)',
            top: '50%'
          }}
        />
      ))}
    </Box>
  );
};

const FloatingVoiceAssistant = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Voice State Machine: 'READY' | 'LISTENING' | 'UNDERSTANDING' | 'THINKING' | 'SPEAKING'
  const [voiceState, setVoiceState] = useState('READY');
  const voiceStateRef = useRef('READY');
  
  const updateVoiceState = (state) => {
    setVoiceState(state);
    voiceStateRef.current = state;
  };

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const isVoiceModeRef = useRef(false);
  
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const toggleVoiceMode = () => {
    if (isVoiceModeRef.current) {
      setIsVoiceMode(false);
      isVoiceModeRef.current = false;
      updateVoiceState('READY');
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } else {
      setIsVoiceMode(true);
      isVoiceModeRef.current = true;
      startListening(true);
    }
  };

  const startListening = (autoSend = false) => {
    if (!SpeechRecognition) return alert('Voice recognition not supported in this browser. Try Chrome.');
    
    if (voiceStateRef.current === 'THINKING' || voiceStateRef.current === 'UNDERSTANDING') return;

    // Only cancel speech manually. For barge-in, we allow TTS to continue while listening starts
    if (!autoSend && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    updateVoiceState('LISTENING');
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'ta-IN'; 
    recognition.interimResults = true;
    recognition.continuous = false; // Better accuracy for standard listening
    
    let localTranscript = '';
    
    recognition.onresult = (event) => {
      let finalStr = '';
      let interimStr = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }
      
      const currentText = (finalStr + interimStr).trim();

      // BARGE-IN Logic: Cancel AI speech if user interrupts with real speech
      if (currentText.length > 2 && voiceStateRef.current === 'SPEAKING') {
         if ('speechSynthesis' in window) window.speechSynthesis.cancel();
         updateVoiceState('LISTENING');
      }

      localTranscript = currentText;
      setInputText(localTranscript);
    };
    
    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      const textToProcess = localTranscript.trim();
      
      if (textToProcess) {
        updateVoiceState('UNDERSTANDING');
        handleSend(textToProcess);
      } else if (isVoiceModeRef.current) {
        updateVoiceState('READY');
        setTimeout(() => {
          if (voiceStateRef.current === 'READY' && isVoiceModeRef.current) startListening(true);
        }, 300);
      } else {
        updateVoiceState('READY');
      }
    };
    
    recognition.onerror = (event) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      if (isVoiceModeRef.current && event.error === 'no-speech') {
        updateVoiceState('READY');
        setTimeout(() => {
          if (voiceStateRef.current === 'READY' && isVoiceModeRef.current) startListening(true);
        }, 300);
      } else {
        updateVoiceState('READY');
      }
    };
    
    recognition.start();
  };

  const speak = (text) => {
    const cleanText = text.replace(/[*#_]/g, '').substring(0, 400);
    
    updateVoiceState('SPEAKING');

    const handleSpeechEnd = () => {
      if (isVoiceModeRef.current && voiceStateRef.current === 'SPEAKING') {
        setTimeout(() => startListening(true), 300);
      } else if (!isVoiceModeRef.current) {
        updateVoiceState('READY');
      }
    };
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      const hasTamil = /[\u0B80-\u0BFF]/.test(cleanText);
      let selectedVoice = null;
      let fallbackLang = 'en-US';
      
      if (hasTamil) {
        // High Quality Tamil Voices
        selectedVoice = voices.find(v => (v.lang.includes('ta') && (v.name.includes('Google') || v.name.includes('Premium')))) || 
                        voices.find(v => v.lang.includes('ta') || v.name.includes('Tamil') || v.name.includes('தமிழ்'));
        fallbackLang = 'ta-IN';
      } else {
        // High Quality English Voices
        selectedVoice = voices.find(v => (v.lang.includes('en') && (v.name.includes('Google UK English') || v.name.includes('Google US English') || v.name.includes('Natural')))) || 
                        voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB'));
      }
      
      if (selectedVoice) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        utterance.rate = hasTamil ? 0.95 : 1.0;
        utterance.pitch = 1.0;
        utterance.onend = handleSpeechEnd;
        utterance.onerror = (e) => {
          console.error('SpeechSynthesis Error:', e);
          handleSpeechEnd();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${fallbackLang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
        const audio = new Audio(url);
        audio.onended = handleSpeechEnd;
        audio.onerror = (e) => {
          console.error('Audio Fallback Error:', e);
          handleSpeechEnd();
        };
        audio.play().catch(e => {
          console.error('Audio Play Blocked:', e);
          handleSpeechEnd();
        });
      }

      // Important for Barge-in: Restart listening immediately AFTER speech synthesis starts, so mic is hot!
      if (isVoiceModeRef.current) {
        // Delay slightly so it doesn't instantly pick up its own first word
        setTimeout(() => {
            if (voiceStateRef.current === 'SPEAKING') {
                if (recognitionRef.current) {
                    try { recognitionRef.current.stop(); } catch(e) {}
                }
                const recognition = new SpeechRecognition();
                recognitionRef.current = recognition;
                recognition.lang = 'ta-IN';
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.onresult = (event) => {
                    let finalStr = ''; let interimStr = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) finalStr += event.results[i][0].transcript;
                        else interimStr += event.results[i][0].transcript;
                    }
                    const bText = (finalStr + interimStr).trim();
                    if (bText.length > 2 && voiceStateRef.current === 'SPEAKING') {
                        // User interrupted!
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        updateVoiceState('LISTENING');
                        setInputText(bText);
                        // Now standard handling will take over
                        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = setTimeout(() => {
                            if (bText.length > 0) {
                                updateVoiceState('UNDERSTANDING');
                                handleSend(bText);
                            }
                            if (recognitionRef.current) {
                                try { recognitionRef.current.stop(); } catch(e) {}
                            }
                        }, 3000);
                    }
                };
                recognition.start();
            }
        }, 500);
      }
    };

    if ('speechSynthesis' in window && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
      setTimeout(() => {
        if (voiceStateRef.current === 'SPEAKING') setVoiceAndSpeak();
      }, 1000);
    } else {
      setVoiceAndSpeak();
    }
  };

  const getPageContext = () => {
    let mainContent = '';
    try {
      const contentSelectors = ['main', '#main-content', '.pcoded-content', '.content-wrapper'];
      let mainEl = null;
      for (let selector of contentSelectors) {
        mainEl = document.querySelector(selector);
        if (mainEl) break;
      }
      if (!mainEl) {
        const papers = Array.from(document.querySelectorAll('.MuiPaper-root'));
        if (papers.length > 0) {
          mainEl = papers.sort((a, b) => b.innerText.length - a.innerText.length)[0];
        }
      }
      if (mainEl) {
         mainContent = mainEl.innerText || '';
      } else {
         mainContent = document.body.innerText || '';
      }
      mainContent = mainContent.replace(/\s+/g, ' ').trim().substring(0, 4000);
    } catch(e) {
      console.error('Error extracting page context', e);
    }
    return `URL: ${window.location.href}\nTitle: ${document.title}\nScreen Content:\n${mainContent}`;
  };

  const handleSend = async (overrideText = null) => {
    const userMsg = overrideText || inputText;
    if (!userMsg || !userMsg.trim()) return;
    
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    if (!overrideText) setInputText('');
    
    try {
      updateVoiceState('THINKING');
      const pageContext = getPageContext();
      
      const response = await axios.post('/api/v1/ai/aura/chat', {
        message: userMsg,
        pageContext: pageContext,
        history: messages
      });
      
      const aiReply = response.data.reply;
      setMessages(prev => [...prev, { text: aiReply, sender: 'bot' }]);
      
      if (isVoiceModeRef.current || overrideText) {
        speak(aiReply);
      } else {
        updateVoiceState('READY');
      }
      
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { text: 'Sorry, I am facing an issue connecting to the server.', sender: 'bot' }]);
      if (isVoiceModeRef.current || overrideText) {
        speak('Sorry, server issue. Please try again.');
      } else {
        updateVoiceState('READY');
      }
    }
  };

  const getStatusText = () => {
    switch (voiceState) {
      case 'LISTENING': return 'Listening...';
      case 'UNDERSTANDING': return 'Understanding...';
      case 'THINKING': return 'Thinking...';
      case 'SPEAKING': return 'Speaking...';
      default: return 'Ask anything or tap the Mic to speak.';
    }
  };

  const getWaveColor = () => {
    switch (voiceState) {
      case 'LISTENING': return '#ef4444'; 
      case 'UNDERSTANDING': return '#f59e0b'; 
      case 'THINKING': return '#3b82f6'; 
      case 'SPEAKING': return '#8b5cf6'; 
      default: return '#94a3b8';
    }
  };

  const creditUsage = 85; // Dynamically updates based on usage
  const creditColor = creditUsage > 50 ? '#10b981' : creditUsage > 30 ? '#f59e0b' : '#ef4444';

  return (
    <>
      <Box 
        sx={{ 
          ml: 1.5, 
          display: 'flex', 
          alignItems: 'center',
          '& .credit-indicator': {
            opacity: 0,
            transition: 'opacity 0.2s',
            visibility: 'hidden',
          },
          '&:hover .credit-indicator': {
            opacity: 1,
            visibility: 'visible',
          }
        }}
      >
        <Tooltip title={`Aura AI Assistant (Credit ${creditUsage}% remaining)`} placement="bottom" arrow>
          <Box onClick={() => setOpen(!open)} style={{ position: 'relative', zIndex: 10, display: 'inline-flex', cursor: 'pointer' }}>
            
            {/* Box shaped outer line progress */}
            <svg width="46" height="46" style={{ position: 'absolute', top: -6, left: -6, pointerEvents: 'none' }} className="credit-indicator">
              <rect x="3" y="3" width="40" height="40" rx="10" ry="10" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <rect x="3" y="3" width="40" height="40" rx="10" ry="10" fill="none" stroke={creditColor} strokeWidth="6" 
                    pathLength="100" strokeDasharray="100" strokeDashoffset={100 - creditUsage} strokeLinecap="round" />
            </svg>

            <Box
              sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                borderRadius: '8px', height: '34px', width: '34px',
                color: '#fff', transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' }
              }}
            >
              <IconSparkles size={18} stroke={2.5} />
            </Box>
          </Box>
        </Tooltip>
      </Box>

      {open && (
        <Box
          sx={{
            position: 'fixed',
            bottom: isFullScreen ? 0 : 24,
            right: isFullScreen ? 0 : 24,
            width: isFullScreen ? '100vw' : { xs: 'calc(100% - 48px)', sm: 420 },
            height: isFullScreen ? '100vh' : 'calc(100vh - 120px)',
            maxHeight: isFullScreen ? 'none' : 750,
            zIndex: 9999,
            bgcolor: '#ffffff',
            borderRadius: isFullScreen ? 0 : '24px',
            boxShadow: '0 10px 50px rgba(0,0,0,0.15)',
            border: isFullScreen ? 'none' : '1px solid #f1f5f9',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3, overflowY: 'auto' }}>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Box sx={{ width: 100 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', ml: 'auto', mr: 'auto' }}>
                AURA <span style={{ color: '#8b5cf6', marginLeft: '4px' }}>OS</span>
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, width: 100, justifyContent: 'flex-end' }}>
                <Box sx={{ p: 0.5, border: '2px solid #f8fafc', borderRadius: '10px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}>
                  <IconClock size={18} stroke={2} />
                </Box>
                <Box onClick={() => setIsFullScreen(!isFullScreen)} sx={{ p: 0.5, border: '2px solid #f8fafc', borderRadius: '10px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}>
                  {isFullScreen ? <IconMinimize size={18} stroke={2} /> : <IconMaximize size={18} stroke={2} />}
                </Box>
                <Box onClick={() => setOpen(false)} sx={{ p: 0.5, border: '2px solid #f8fafc', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', '&:hover': { border: '2px solid #fee2e2', bgcolor: '#fef2f2' } }}>
                  <IconX size={18} stroke={2} />
                </Box>
              </Box>
            </Box>

            {messages.length === 0 ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pb: 2, px: 2 }}>
                <Box sx={{ position: 'relative', width: 200, height: 200, mb: 3 }}>
                  <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
                  <Player autoplay loop src={assistantAnimationInside} style={{ height: '180px', width: '180px', position: 'relative', zIndex: 2 }} />
                  <Box sx={{ position: 'absolute', top: 20, right: -10, width: 32, height: 32, borderRadius: '10px', bgcolor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(59,130,246,0.15)' }}>
                    <IconFileText size={16} />
                  </Box>
                  <Box sx={{ position: 'absolute', bottom: 40, right: -20, width: 32, height: 32, borderRadius: '10px', bgcolor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16,185,129,0.15)' }}>
                    <IconChartBar size={16} />
                  </Box>
                  <Box sx={{ position: 'absolute', top: 50, left: -20, width: 32, height: 32, borderRadius: '10px', bgcolor: '#f3e8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(168,85,247,0.15)' }}>
                    <IconMessage size={16} />
                  </Box>
                </Box>

                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                  How can I help you today{user?.name || user?.userName || user?.username ? ` ${user.name || user.userName || user.username}` : ''}?
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, height: 80 }}>
                  <Typography variant="body2" color={voiceState !== 'READY' ? 'textPrimary' : 'textSecondary'} sx={{ mb: 1, fontWeight: voiceState !== 'READY' ? 600 : 400 }}>
                    {getStatusText()}
                  </Typography>
                  <GlowingWave active={voiceState !== 'READY'} color={getWaveColor()} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, p: 1, overflowY: 'auto', mb: 2 }}>
                {messages.map((msg, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.sender === 'bot' && (
                      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#f3e8ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1, flexShrink: 0 }}>
                        <IconSparkles size={18} />
                      </Box>
                    )}
                    <Box sx={{ 
                      maxWidth: '80%', p: 1.5, borderRadius: '16px', 
                      bgcolor: msg.sender === 'user' ? '#8b5cf6' : '#f8fafc',
                      color: msg.sender === 'user' ? '#fff' : '#334155',
                      border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                      borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                      borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '16px'
                    }}>
                      <Typography variant="body2">{msg.text}</Typography>
                    </Box>
                  </Box>
                ))}
                
                {voiceState !== 'READY' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
                      {getStatusText()}
                    </Typography>
                    <GlowingWave active={true} color={getWaveColor()} />
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ flexShrink: 0, p: 0.5, py: 1, px: 2, border: '1px solid #f1f5f9', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: 1, boxShadow: '0 -5px 20px rgba(0,0,0,0.02)', mt: 'auto', bgcolor: '#ffffff' }}>
              <IconButton size="small" sx={{ bgcolor: '#f8fafc', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' }, border: '1px solid #f1f5f9' }}>
                <IconPlus size={18} stroke={2.5} />
              </IconButton>
              
              <TextField
                fullWidth
                placeholder="Type your message..."
                variant="standard"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={voiceState === 'THINKING' || voiceState === 'UNDERSTANDING'}
                InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem', color: '#334155', fontWeight: 500 } }}
                sx={{ flex: 1, mx: 1 }}
              />

              <IconButton onClick={() => startListening(false)} size="small" sx={{ color: voiceState === 'LISTENING' ? '#ef4444' : '#94a3b8', '&:hover': { color: voiceState === 'LISTENING' ? '#ef4444' : '#64748b' } }}>
                <IconMicrophone size={20} />
              </IconButton>
              
              <Box onClick={() => { if(voiceState !== 'THINKING' && voiceState !== 'UNDERSTANDING') handleSend(); }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: (voiceState === 'THINKING' || voiceState === 'UNDERSTANDING') ? '#cbd5e1' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', cursor: (voiceState === 'THINKING' || voiceState === 'UNDERSTANDING') ? 'not-allowed' : 'pointer', flexShrink: 0, boxShadow: (voiceState === 'THINKING' || voiceState === 'UNDERSTANDING') ? 'none' : '0 4px 12px rgba(139,92,246,0.3)', '&:hover': { transform: (voiceState === 'THINKING' || voiceState === 'UNDERSTANDING') ? 'none' : 'scale(1.05)', transition: 'all 0.2s' } }}>
                <IconSend size={18} style={{ marginLeft: '-2px', marginTop: '2px' }} />
              </Box>

              <Tooltip title={isVoiceMode ? "Disable Voice Mode" : "Enable Voice Mode"} arrow>
                <Box 
                  onClick={toggleVoiceMode}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '12px', background: isVoiceMode ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)', color: '#fff', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(139,92,246,0.3)', '&:hover': { transform: 'scale(1.05)', transition: 'all 0.2s' } }}>
                  <IconSparkles size={18} stroke={2.5} />
                </Box>
              </Tooltip>
            </Box>

          </Box>
        </Box>
      )}
    </>
  );
};

export default FloatingVoiceAssistant;
