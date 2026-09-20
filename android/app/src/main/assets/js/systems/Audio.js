// Audio system - Web Audio API, ambient sounds, UI feedback
class AudioSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.buffers = {};
    this.loops = {};
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Audio not available');
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  playTone(freq, duration, type = 'sine', vol = 0.1) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playClick() { this.playTone(800, 0.08, 'square', 0.05); }

  playBuild() {
    this.playTone(200, 0.15, 'triangle', 0.08);
    setTimeout(() => this.playTone(400, 0.1, 'triangle', 0.06), 100);
    setTimeout(() => this.playTone(600, 0.2, 'triangle', 0.05), 200);
  }

  playUpgrade() {
    [400, 500, 700, 900].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.12, 'sine', 0.06), i * 80);
    });
  }

  playCash() { this.playTone(1200, 0.05, 'square', 0.03); }

  playCollect() {
    [600, 800, 1000, 1400].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.08, 'sine', 0.05), i * 50);
    });
  }

  playError() { this.playTone(150, 0.3, 'sawtooth', 0.05); }

  playReward() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.2, 'sine', 0.06), i * 100);
    });
  }

  playUnlock() {
    // Joyful ascending arpeggio for plot unlock
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.16, 'triangle', 0.07), i * 90);
    });
  }

  playCustomerSale() {
    // Crisp double coin chime for customer purchase
    this.playTone(1320, 0.04, 'sine', 0.04);
    setTimeout(() => this.playTone(1760, 0.07, 'sine', 0.04), 50);
  }

  playMissionComplete() {
    // Celebratory fanfare
    [587, 740, 880, 1174].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.22, 'square', 0.05), i * 80);
    });
  }

  playLevelUp() {
    // Vibrant flourish
    [392, 523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.18, 'sine', 0.07), i * 70);
    });
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.masterGain) this.masterGain.gain.value = on ? 0.3 : 0;
  }
}
