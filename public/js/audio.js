// Web Audio API sound synthesizer - zero external asset dependencies
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playStep() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Crisp tactile wooden step sound ("tok")
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playDiceRoll() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Multiple rapid wooden clicks
    for (let i = 0; i < 7; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const clickTime = now + (i * 0.045) + (Math.random() * 0.02);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 + Math.random() * 300, clickTime);
      osc.frequency.exponentialRampToValueAtTime(80, clickTime + 0.03);

      gain.gain.setValueAtTime(0.25, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(clickTime);
      osc.stop(clickTime + 0.04);
    }
  }

  playMove() {
    this.playStep();
  }

  playPop() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playSix() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + (idx * 0.08);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.15);
    });
  }

  playCapture() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // Punchy impact sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Variant 1: Celestial Star Shield Chime (Sparkle Arpeggio on Safe Zone)
  playSafeZone() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const notes = [
      { f: 880, t: 0, d: 0.25 },       // A5
      { f: 1318.5, t: 0.07, d: 0.35 }, // E6
      { f: 1760, t: 0.14, d: 0.45 },   // A6
      { f: 2637, t: 0.22, d: 0.55 }    // E7 (Sparkle shimmer)
    ];
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.22, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }

  // Variant 2: Cheery Fanfare Pop (Base Exit / Spawn out to board)
  playBaseExit() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const fanfare = [
      { f: 440, t: 0, d: 0.09 },        // A4
      { f: 659.25, t: 0.08, d: 0.22 }   // E5
    ];
    fanfare.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.26, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d);
    });
  }

  // Digital Blip Tick (Turn Timer final 3 seconds urgency countdown)
  playTimerTick() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playHome() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    const chords = [523.25, 659.25, 783.99];
    chords.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  playVictory() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.35 },
      { f: 783.99, d: 0.2 },
      { f: 1046.50, d: 0.6 }
    ];

    let t = now;
    melody.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + n.d + 0.05);

      t += n.d;
    });
  }

  // Play uploaded voice / custom audio file synchronized with emoji duration (default 5.0s)
  playCustomAudio(url, durationMs = 5000) {
    if (!this.enabled || !url) return;
    try {
      // Stop any previously playing emoji audio
      if (this.currentEmojiAudio) {
        try {
          this.currentEmojiAudio.pause();
          this.currentEmojiAudio.currentTime = 0;
        } catch(e) {}
        this.currentEmojiAudio = null;
      }

      const audio = new Audio(url);
      audio.volume = 0.9;
      audio.loop = true; // Loop so audio keeps playing continuously while the emoji is on screen
      this.currentEmojiAudio = audio;

      const p = audio.play();
      if (p !== undefined) {
        p.catch(e => console.warn('Custom audio play error:', e));
      }

      // Smooth fade-out in the last 600ms of the 5s emoji duration
      const fadeStart = Math.max(1000, durationMs - 600);
      const fadeTimer = setTimeout(() => {
        let currentVol = audio.volume;
        const fadeInterval = setInterval(() => {
          currentVol = Math.max(0, currentVol - 0.15);
          try {
            audio.volume = currentVol;
          } catch(e) {}
          if (currentVol <= 0.05) {
            clearInterval(fadeInterval);
          }
        }, 80);
      }, fadeStart);

      // Stop audio completely at durationMs (5s) when emoji disappears
      setTimeout(() => {
        try {
          if (this.currentEmojiAudio === audio) {
            this.currentEmojiAudio = null;
          }
          audio.pause();
          audio.currentTime = 0;
        } catch(e) {}
      }, durationMs);

    } catch(err) {
      console.warn('Custom audio playback failed:', err);
    }
  }

  // Play emoji-bound sound (preset or custom uploaded voice)
  playEmojiSound(soundType, soundValue, durationMs = 5000) {
    if (!this.enabled) return;
    if (soundType === 'custom' && soundValue) {
      this.playCustomAudio(soundValue, durationMs);
      return;
    }

    switch(soundValue) {
      case 'sparkle_shield':
        this.playSafeZone();
        break;
      case 'cheery_fanfare':
        this.playBaseExit();
        break;
      case 'pop':
        this.playPop();
        break;
      case 'digital_blip':
        this.playTimerTick();
        break;
      case 'punch_impact':
        this.playCapture();
        break;
      case 'victory':
        this.playVictory();
        break;
      case 'dice_roll':
        this.playDiceRoll();
        break;
      default:
        this.playPop();
    }
  }
}

window.sounds = new SoundEffects();
