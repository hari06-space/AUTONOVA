export const RINGTONE_OPTIONS = [
  { group: 'System', label: 'Silent', value: 'silent' },
  { group: 'Classic', label: 'Chime', value: 'chime' },
  { group: 'Classic', label: 'Ding', value: 'ding' },
  { group: 'Classic', label: 'Pop', value: 'pop' },
  { group: 'Classic', label: 'Bell', value: 'bell' },
  { group: 'Classic', label: 'Marimba', value: 'marimba' },
  { group: 'Classic', label: 'Whistle', value: 'whistle' },
  { group: 'Classic', label: 'Harp', value: 'harp' },
  { group: 'Classic', label: 'Crystal', value: 'crystal' },
  { group: 'Classic', label: 'Flute', value: 'flute' },
  { group: 'Classic', label: 'Gentle', value: 'gentle' },

  { group: 'Modern & Clean', label: 'Water Drops', value: 'water_drops' },
  { group: 'Modern & Clean', label: 'Cuckoo', value: 'cuckoo' },
  { group: 'Modern & Clean', label: 'Nova Ping', value: 'nova_ping' },
  { group: 'Modern & Clean', label: 'Crystal Tap', value: 'crystal_tap' },
  { group: 'Modern & Clean', label: 'Pulse Pop', value: 'pulse_pop' },
  { group: 'Modern & Clean', label: 'Echo Drop', value: 'echo_drop' },
  { group: 'Modern & Clean', label: 'Neon Click', value: 'neon_click' },
  { group: 'Modern & Clean', label: 'Soft Spark', value: 'soft_spark' },
  { group: 'Modern & Clean', label: 'Digital Bloom', value: 'digital_bloom' },
  { group: 'Modern & Clean', label: 'Aero Chime', value: 'aero_chime' },

  { group: 'Professional ERP', label: 'Task Alert', value: 'task_alert' },
  { group: 'Professional ERP', label: 'Priority Pulse', value: 'priority_pulse' },
  { group: 'Professional ERP', label: 'Workflow Chime', value: 'workflow_chime' },
  { group: 'Professional ERP', label: 'Action Required', value: 'action_required' },
  { group: 'Professional ERP', label: 'Status Update', value: 'status_update' },
  { group: 'Professional ERP', label: 'Approval Bell', value: 'approval_bell' },
  { group: 'Professional ERP', label: 'Reminder Tone', value: 'reminder_tone' },
  { group: 'Professional ERP', label: 'Success Signal', value: 'success_signal' },

  { group: 'Premium & Futuristic', label: 'Quantum Ping', value: 'quantum_ping' },
  { group: 'Premium & Futuristic', label: 'Orbit Echo', value: 'orbit_echo' },
  { group: 'Premium & Futuristic', label: 'Cyber Pulse', value: 'cyber_pulse' },
  { group: 'Premium & Futuristic', label: 'Galaxy Drop', value: 'galaxy_drop' },
  { group: 'Premium & Futuristic', label: 'Prism Wave', value: 'prism_wave' },
  { group: 'Premium & Futuristic', label: 'Infinity Chime', value: 'infinity_chime' },
  { group: 'Premium & Futuristic', label: 'Stellar Pop', value: 'stellar_pop' },
  { group: 'Premium & Futuristic', label: 'Aurora Signal', value: 'aurora_signal' },

  { group: 'Soft and Pleasant', label: 'Gentle Bell', value: 'gentle_bell' },
  { group: 'Soft and Pleasant', label: 'Calm Drop', value: 'calm_drop' },
  { group: 'Soft and Pleasant', label: 'Melody Tap', value: 'melody_tap' },
  { group: 'Soft and Pleasant', label: 'Soft Bubble', value: 'soft_bubble' },
  { group: 'Soft and Pleasant', label: 'Morning Spark', value: 'morning_spark' },
  { group: 'Soft and Pleasant', label: 'Peace Chime', value: 'peace_chime' },

  { group: 'Urgent Notifications', label: 'Critical Pulse', value: 'critical_pulse' },
  { group: 'Urgent Notifications', label: 'Rapid Alert', value: 'rapid_alert' },
  { group: 'Urgent Notifications', label: 'Warning Echo', value: 'warning_echo' },
  { group: 'Urgent Notifications', label: 'Deadline Alarm', value: 'deadline_alarm' },
  { group: 'Urgent Notifications', label: 'Priority Strike', value: 'priority_strike' },
  { group: 'Urgent Notifications', label: 'Emergency Ping', value: 'emergency_ping' }
];

let sharedCtx = null;

const getAudioContext = () => {
  if (sharedCtx) return sharedCtx;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    sharedCtx = new AudioContextClass();
  } catch (e) {
    console.warn('AudioContext creation failed:', e);
  }
  return sharedCtx;
};

// Autoplay policy: Resume AudioContext on first user gesture
if (typeof window !== 'undefined') {
  const resumeAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', resumeAudio, { once: true, passive: true });
  window.addEventListener('keydown', resumeAudio, { once: true, passive: true });
  window.addEventListener('touchstart', resumeAudio, { once: true, passive: true });
}

export const playSynthesizedSound = (tone) => {
  if (!tone || tone === 'silent') return; // Early return for silent or invalid

  const ctx = getAudioContext();
  if (!ctx) return;

  // Autoplay policy check: avoid eager resume before user gesture
  if (ctx.state === 'suspended') {
    return;
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (tone === 'nova_ping' || tone === 'chime') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  } else if (tone === 'crystal_chime' || tone === 'crystal') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1567.98, now); // G6
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  } else if (tone === 'approval_bell' || tone === 'bell') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, now);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.8);
  } else if (tone === 'warning_echo') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(300, now + 0.2);
    osc.frequency.setValueAtTime(400, now + 0.25);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  } else if (tone === 'priority_pulse') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    gain.gain.setValueAtTime(0.3, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (tone === 'critical_pulse') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);
    gain.gain.setValueAtTime(0.4, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    gain.gain.setValueAtTime(0.4, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (tone === 'digital_bloom') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.3);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  } else if (tone === 'soft_spark' || tone === 'gentle') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(349.23, now); // F4
    osc.frequency.setValueAtTime(440, now + 0.2); // A4
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.15);
    gain.gain.setValueAtTime(0.3, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  } else if (tone === 'rapid_alert') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    gain.gain.setValueAtTime(0.4, now + 0.15);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (tone === 'orbit_echo') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.5);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  } else {
    // Generate semantic sounds based on the name of the tone
    const name = tone.toLowerCase();
    const isDrop = name.includes('drop') || name.includes('bubble') || name.includes('water');
    const isBell = name.includes('bell') || name.includes('chime') || name.includes('ding');
    const isAlert = name.includes('alert') || name.includes('warning') || name.includes('critical') || name.includes('emergency');
    const isPercussive = name.includes('pop') || name.includes('tap') || name.includes('click') || name.includes('strike');
    
    // Unique base frequency seeded by index
    const toneIndex = RINGTONE_OPTIONS.findIndex(opt => opt.value === tone);
    const uniqueId = toneIndex !== -1 ? toneIndex : 50;
    
    if (isDrop) {
      // Water drop effect: rapid upward frequency sweep on a sine wave
      osc.type = 'sine';
      const baseFreq = 300 + (uniqueId * 5); // 300 to ~500
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 0.1);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (isPercussive) {
      // Tap/Click/Pop: extremely short burst
      osc.type = (uniqueId % 2 === 0) ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(800 + (uniqueId * 20), now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (isAlert) {
      // Alert/Warning: Sawtooth or square with rapid stutter
      osc.type = (uniqueId % 2 === 0) ? 'sawtooth' : 'square';
      const baseFreq = 400 + (uniqueId * 15);
      osc.frequency.setValueAtTime(baseFreq, now);
      
      // 3 rapid pulses
      gain.gain.setValueAtTime(0, now);
      for (let i = 0; i < 3; i++) {
        const start = now + (i * 0.15);
        gain.gain.linearRampToValueAtTime(0.4, start + 0.02);
        gain.gain.linearRampToValueAtTime(0, start + 0.1);
      }
      
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (isBell) {
      // Bell/Chime: High frequency sine with long exponential decay
      osc.type = 'sine';
      const baseFreq = 800 + (uniqueId * 25);
      osc.frequency.setValueAtTime(baseFreq, now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      osc.start(now);
      osc.stop(now + 0.8);
    } else {
      // Default melodical fallback
      const baseFreq = 350 + (uniqueId * 15); 
      const interval = 1.25 + ((uniqueId % 4) * 0.1);
      
      osc.type = 'sine';
      
      osc.frequency.setValueAtTime(baseFreq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      
      osc.frequency.setValueAtTime(baseFreq * interval, now + 0.15);
      gain.gain.setValueAtTime(0, now + 0.15);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.17);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  
      osc.start(now);
      osc.stop(now + 0.5);
    }
  }
};

export const playCelebrationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Bright Victory Arpeggio)
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startTime = now + index * 0.12;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  } catch (e) {
    console.warn('Celebration sound error:', e);
  }
};

export const playPortalSound = (type) => {
  try {
    switch (type) {
      case 'next':
      case 'next_page':
      case 'step_next':
        playSynthesizedSound('soft_bubble');
        break;
      case 'prev':
      case 'prev_page':
      case 'step_prev':
        playSynthesizedSound('orbit_echo');
        break;
      case 'error':
      case 'validation_error':
      case 'invalid':
        playSynthesizedSound('rapid_alert');
        break;
      case 'warning':
        playSynthesizedSound('rapid_alert');
        break;
      case 'success':
      case 'save':
        playSynthesizedSound('success_signal');
        break;
      case 'submit':
      case 'completion':
        playCelebrationSound();
        break;
      case 'click':
      case 'select':
        playSynthesizedSound('neon_click');
        break;
      default:
        playSynthesizedSound(type);
    }
  } catch (e) {
    console.warn('Portal sound trigger error:', e);
  }
};
