/**
 * meetingAlarmSound.js — Premium Studio-Grade Meeting Alarm Synthesizer
 *
 * Sound Profile:
 *  - Luxurious Dual-Phrase Crystal Marimba & Chime Melody (E5 -> G#5 -> B5 -> E6)
 *  - Pure sinusoidal fundamentals + natural harmonic overtones
 *  - Strictly active only when dialog is open
 *  - Instant cancellation on stopAlarm()
 */

class MeetingAlarmAudioController {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.intervalId = null;
    this.activeGains = [];
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Play a single pristine acoustic bell note with harmonic overtone
  playBellNote(ctx, freq, startTime, duration = 0.8, volume = 0.22) {
    if (!this.isPlaying || this.isMuted) return;

    // 1. Fundamental frequency (Sine wave)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    gain1.gain.setValueAtTime(0.0001, startTime);
    gain1.gain.linearRampToValueAtTime(volume, startTime + 0.008); // 8ms crisp attack
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    this.activeGains.push(gain1);

    osc1.start(startTime);
    osc1.stop(startTime + duration + 0.05);

    // 2. Harmonic 2nd Overtone (2x freq for crystal brilliance)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    gain2.gain.setValueAtTime(0.0001, startTime);
    gain2.gain.linearRampToValueAtTime(volume * 0.35, startTime + 0.006);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + (duration * 0.5));

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    this.activeGains.push(gain2);

    osc2.start(startTime);
    osc2.stop(startTime + (duration * 0.5) + 0.05);

    // 3. Subtle warm 3rd harmonic (3x freq for rich body)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(freq * 3, startTime);

    gain3.gain.setValueAtTime(0.0001, startTime);
    gain3.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.005);
    gain3.gain.exponentialRampToValueAtTime(0.0001, startTime + (duration * 0.35));

    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    this.activeGains.push(gain3);

    osc3.start(startTime);
    osc3.stop(startTime + (duration * 0.35) + 0.05);
  }

  // Play the signature 4-note ascending meeting chime melody
  playChimeMelody() {
    if (!this.isPlaying || this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime + 0.05;

      // Phrase 1: Ascending Crystal Arpeggio (E5 -> G#5 -> B5 -> E6)
      this.playBellNote(ctx, 659.25, now, 0.9, 0.22);
      this.playBellNote(ctx, 830.61, now + 0.14, 0.9, 0.24);
      this.playBellNote(ctx, 987.77, now + 0.28, 1.0, 0.25);
      this.playBellNote(ctx, 1318.51, now + 0.44, 1.4, 0.28);

      // Phrase 2: Gentle Double Echo (B5 -> E6)
      this.playBellNote(ctx, 987.77, now + 0.85, 0.8, 0.18);
      this.playBellNote(ctx, 1318.51, now + 1.02, 1.3, 0.22);
    } catch (e) {
      console.warn('[MeetingAlarmSound] Audio playback failed:', e);
    }
  }

  startAlarm() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.playChimeMelody();

    // Loop pleasant melody every 2.4 seconds
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (this.isPlaying && !this.isMuted) {
        this.playChimeMelody();
      }
    }, 2400);
  }

  stopAlarm() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.activeGains && this.activeGains.length > 0) {
      this.activeGains.forEach((g) => {
        try {
          if (this.audioCtx) {
            g.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);
          }
        } catch {}
      });
      this.activeGains = [];
    }
    if (this.audioCtx && this.audioCtx.state === 'running') {
      try {
        this.audioCtx.suspend().catch(() => {});
      } catch {}
    }
  }

  setMute(muted) {
    this.isMuted = !!muted;
    if (this.isMuted) {
      this.stopAlarm();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAlarm();
    } else {
      this.startAlarm();
    }
    return this.isMuted;
  }
}

export const meetingAlarmAudio = new MeetingAlarmAudioController();
export default meetingAlarmAudio;
