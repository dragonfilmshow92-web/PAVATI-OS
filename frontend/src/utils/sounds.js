/**
 * sounds.js — Zero-Dependency Web Audio API Retail Sound Synthesizer
 * 
 * Provides crisp, instant, authentic retail audio cues for:
 *  - 🎯 Barcode Scanner Gun Beep (laser scan success)
 *  - 🛒 Add to Cart / Billing (product added to bill)
 *  - 💵 Generate Bill / Checkout (iconic cash register "Cha-Ching!" & bell chime)
 *  - 📦 Stock Receiving / Inward (warehouse stock received confirmation)
 *  - ✨ Item Listing / Product Created (sparkle celebration)
 *  - 🗑️ Item Removed / Void (soft descending pop)
 *  - ⚠️ Error / Barcode Not Found (double buzz alert)
 */

class SoundEffectsManager {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('pos_sound_enabled') !== 'false'; // default true
    this.volume = Number(localStorage.getItem('pos_sound_volume') || 0.8);
  }

  // Lazy-initialize AudioContext upon user gesture
  getAudioContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    localStorage.setItem('pos_sound_enabled', String(this.enabled));
  }

  toggle() {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.barcodeScan();
    }
    return this.enabled;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol)));
    localStorage.setItem('pos_sound_volume', String(this.volume));
  }

  getVolume() {
    return this.volume;
  }

  /**
   * 1. 🎯 BARCODE SCAN BEEP
   * Ultra-crisp, high-frequency POS laser scanner gun beep (Zebra/Honeywell style)
   */
  barcodeScan() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1880, now);
      osc.frequency.exponentialRampToValueAtTime(1920, now + 0.05);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  /**
   * Subtle UI Button Click Feedback
   */
  buttonClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  /**
   * 2. 🛒 ADD PRODUCT TO BILLING
   * Warm, satisfying rising double-chirp tone (B5 -> E6)
   */
  addToCart() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: 987.77 Hz (B5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(987.77, now);
      gain1.gain.setValueAtTime(0.18 * this.volume, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Note 2: 1318.51 Hz (E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.05);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.22 * this.volume, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.17);
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  /**
   * 3. 💵 GENERATE BILL / CASH REGISTER "CHA-CHING!"
   * Iconic retail cash drawer spring-click followed by glistening bell chimes
   */
  billingSuccess() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Part A: Mechanical Register "Cha" (Short filtered metallic click)
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 3200;
      noiseFilter.Q.value = 3.0;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // Part B: Ringing Bell Chime 1 (2093 Hz - C7)
      const bell1 = ctx.createOscillator();
      const bellGain1 = ctx.createGain();
      bell1.type = 'sine';
      bell1.frequency.setValueAtTime(2093.00, now + 0.04);
      bellGain1.gain.setValueAtTime(0.001, now);
      bellGain1.gain.linearRampToValueAtTime(0.28 * this.volume, now + 0.05);
      bellGain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      bell1.connect(bellGain1);
      bellGain1.connect(ctx.destination);
      bell1.start(now + 0.04);
      bell1.stop(now + 0.95);

      // Part C: High Shimmer Bell 2 (2637 Hz - E7)
      const bell2 = ctx.createOscillator();
      const bellGain2 = ctx.createGain();
      bell2.type = 'sine';
      bell2.frequency.setValueAtTime(2637.02, now + 0.07);
      bellGain2.gain.setValueAtTime(0.001, now);
      bellGain2.gain.linearRampToValueAtTime(0.24 * this.volume, now + 0.08);
      bellGain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      bell2.connect(bellGain2);
      bellGain2.connect(ctx.destination);
      bell2.start(now + 0.07);
      bell2.stop(now + 1.15);

      // Part D: High Sparkle Harmonic (3135 Hz - G7)
      const bell3 = ctx.createOscillator();
      const bellGain3 = ctx.createGain();
      bell3.type = 'sine';
      bell3.frequency.setValueAtTime(3135.96, now + 0.11);
      bellGain3.gain.setValueAtTime(0.001, now);
      bellGain3.gain.linearRampToValueAtTime(0.18 * this.volume, now + 0.12);
      bellGain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
      bell3.connect(bellGain3);
      bellGain3.connect(ctx.destination);
      bell3.start(now + 0.11);
      bell3.stop(now + 1.3);
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  /**
   * 4. 📦 STOCK RECEIVED / INWARD SUCCESS
   * Reassuring industrial warehouse tone (solid low thump + rising fanfare)
   */
  stockReceived() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Solid low body (thump)
      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(160, now);
      thump.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      thumpGain.gain.setValueAtTime(0.3 * this.volume, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      thump.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thump.start(now);
      thump.stop(now + 0.15);

      // Upward fanfare chords (G4 -> C5 -> G5)
      const notes = [
        { freq: 392.00, start: 0.06, dur: 0.15 },
        { freq: 523.25, start: 0.12, dur: 0.18 },
        { freq: 783.99, start: 0.18, dur: 0.35 }
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.2 * this.volume, now + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  /**
   * 5. ✨ ITEM LISTED / NEW PRODUCT CREATED
   * Bright, modern sparkle arpeggio (C5 -> E5 -> G5 -> C6)
   */
  itemListed() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];

      notes.forEach((freq, idx) => {
        const startTime = now + (idx * 0.055);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22 * this.volume, startTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  /**
   * 6. 🗑️ REMOVE ITEM / CLEAR LINE
   * Soft descending double pop (540 Hz -> 360 Hz)
   */
  removeItem() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);

      gain.gain.setValueAtTime(0.18 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  /**
   * 7. ⚠️ ERROR / BARCODE NOT FOUND / OUT OF STOCK
   * Low-frequency double bonk alert
   */
  error() {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      [0, 0.1].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(210, now + delay);
        osc.frequency.linearRampToValueAtTime(170, now + delay + 0.08);

        gain.gain.setValueAtTime(0.16 * this.volume, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.09);
      });
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }
}

export const soundFx = new SoundEffectsManager();
export default soundFx;
