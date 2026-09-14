/**
 * Web Audio API based Real-time Sound Generator for VoIP / Video Calls
 * Generates natural incoming ringtones and outgoing ringback tones without needing external assets.
 */

class CallSoundEngine {
  constructor() {
    this.audioCtx = null;
    this.incomingInterval = null;
    this.outgoingInterval = null;
    this.isPlaying = false;
  }

  getAudioContext() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // ----------------------------------------------------
  // 1. Incoming Call Ringtone (Melodic Pleasant Chime)
  // ----------------------------------------------------
  playIncomingRingtone() {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isPlaying = true;

    const playChimeBurst = () => {
      if (!this.isPlaying || ctx.state === 'closed') return;
      try {
        const now = ctx.currentTime;
        const notes = [
          { f: 523.25, start: 0.0, dur: 0.2 },  // C5
          { f: 659.25, start: 0.15, dur: 0.2 }, // E5
          { f: 783.99, start: 0.30, dur: 0.3 }, // G5
          { f: 1046.50, start: 0.45, dur: 0.4 },// C6
          { f: 783.99, start: 0.85, dur: 0.25 },// G5
          { f: 1046.50, start: 1.05, dur: 0.55 } // C6
        ];

        notes.forEach(({ f, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + start);

          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.linearRampToValueAtTime(0.2, now + start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + start);
          osc.stop(now + start + dur + 0.05);
        });
      } catch (e) {
        console.warn('[CallSound] Incoming error:', e);
      }
    };

    playChimeBurst();
    this.incomingInterval = setInterval(playChimeBurst, 2600);
  }

  stopIncomingRingtone() {
    if (this.incomingInterval) {
      clearInterval(this.incomingInterval);
      this.incomingInterval = null;
    }
  }

  // ----------------------------------------------------
  // 2. Outgoing Call Ringback Tone (Traditional Telecom Beep-Beep)
  // ----------------------------------------------------
  playOutgoingRingback() {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isPlaying = true;

    const playRingbackPulse = () => {
      if (!this.isPlaying || ctx.state === 'closed') return;
      try {
        const now = ctx.currentTime;
        // Standard 440Hz + 480Hz dual tone
        [440, 480].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          // Pulse: 1.2s tone with soft envelope
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.09, now + 0.05);
          gain.gain.setValueAtTime(0.09, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.3);
        });
      } catch (e) {
        console.warn('[CallSound] Outgoing error:', e);
      }
    };

    playRingbackPulse();
    this.outgoingInterval = setInterval(playRingbackPulse, 3500);
  }

  stopOutgoingRingback() {
    if (this.outgoingInterval) {
      clearInterval(this.outgoingInterval);
      this.outgoingInterval = null;
    }
  }

  // ----------------------------------------------------
  // 3. Call Connected Tone (Soft double ping)
  // ----------------------------------------------------
  playCallConnected() {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [
        { f: 587.33, t: 0.0 }, // D5
        { f: 880.00, t: 0.12 } // A5
      ].forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.15, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.3);
      });
    } catch (e) {
      // ignore
    }
  }

  // ----------------------------------------------------
  // 4. Call Ended / Rejected Tone (3 short drop beeps)
  // ----------------------------------------------------
  playCallEnded() {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.18, 0.36].forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now + t);
        gain.gain.setValueAtTime(0.12, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.14);
      });
    } catch (e) {
      // ignore
    }
  }

  // ----------------------------------------------------
  // 5. Line Busy Tone (Fast periodic dual-tone beeps)
  // ----------------------------------------------------
  playBusyTone() {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isPlaying = true;

    const playBusyPulse = () => {
      if (!this.isPlaying || ctx.state === 'closed') return;
      try {
        const now = ctx.currentTime;
        [480, 620].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
          gain.gain.setValueAtTime(0.1, now + 0.35);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.4);
        });
      } catch (e) {
        console.warn('[CallSound] Busy tone error:', e);
      }
    };

    playBusyPulse();
    this.busyInterval = setInterval(playBusyPulse, 700);
  }

  stopBusyTone() {
    if (this.busyInterval) {
      clearInterval(this.busyInterval);
      this.busyInterval = null;
    }
  }

  stopAll() {
    this.isPlaying = false;
    this.stopIncomingRingtone();
    this.stopOutgoingRingback();
    this.stopBusyTone();
  }
}

export const callSounds = new CallSoundEngine();
export default callSounds;
