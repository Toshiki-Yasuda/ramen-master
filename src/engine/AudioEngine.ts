import type { JudgmentType } from '../types';

/**
 * AudioEngine - Web Audio APIを使用した高精度オーディオ管理
 *
 * AudioContext.currentTimeをマスタークロックとして使用し、
 * ゲーム全体の時刻同期を実現する
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private bgmBuffer: AudioBuffer | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private seGainNode: GainNode | null = null;
  private seCache: Map<string, AudioBuffer> = new Map();
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private useSynthBGM: boolean = false;
  private synthNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private synthGains: GainNode[] = [];
  private synthTimers: number[] = [];
  private bpm: number = 128;

  async init(): Promise<void> {
    if (this.context) return;

    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);

    this.seGainNode = this.context.createGain();
    this.seGainNode.connect(this.context.destination);

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  async loadBGM(url: string): Promise<boolean> {
    if (!this.context) {
      console.error('AudioEngine not initialized');
      return false;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`BGM not found: ${url}, using synth BGM`);
        this.useSynthBGM = true;
        return true;
      }
      const arrayBuffer = await response.arrayBuffer();
      this.bgmBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.useSynthBGM = false;
      return true;
    } catch (error) {
      console.warn('Failed to load BGM, using synth BGM:', error);
      this.useSynthBGM = true;
      return true;
    }
  }

  setBPM(bpm: number): void {
    this.bpm = bpm;
  }

  play(offset: number = 0): void {
    if (!this.context || !this.gainNode) {
      console.error('AudioEngine not initialized');
      return;
    }

    this.stop();
    this.startTime = this.context.currentTime - offset;
    this.isPlaying = true;

    if (this.bgmBuffer && !this.useSynthBGM) {
      this.bgmSource = this.context.createBufferSource();
      this.bgmSource.buffer = this.bgmBuffer;
      this.bgmSource.connect(this.gainNode);
      this.bgmSource.start(0, offset);
      this.bgmSource.onended = () => {
        this.isPlaying = false;
      };
    } else {
      this.startSynthBGM(offset);
    }
  }

  /**
   * 合成BGMを開始
   */
  private startSynthBGM(offset: number): void {
    if (!this.context || !this.gainNode) return;

    const beatDuration = 60 / this.bpm;
    const totalBeats = 140; // 約65秒分
    const now = this.context.currentTime;

    // ドラムパターン（キック + ハイハット）
    for (let beat = 0; beat < totalBeats; beat++) {
      const beatTime = beat * beatDuration;
      if (beatTime < offset) continue;
      const scheduleTime = now + beatTime - offset;
      if (scheduleTime < now) continue;

      // キック（4つ打ち）
      this.scheduleKick(scheduleTime);

      // ハイハット（8分音符）
      this.scheduleHihat(scheduleTime);
      this.scheduleHihat(scheduleTime + beatDuration / 2);
    }

    // ベースライン
    const bassNotes = [65.41, 73.42, 82.41, 73.42]; // C2, D2, E2, D2
    for (let bar = 0; bar < totalBeats / 4; bar++) {
      for (let i = 0; i < 4; i++) {
        const beatTime = (bar * 4 + i) * beatDuration;
        if (beatTime < offset) continue;
        const scheduleTime = now + beatTime - offset;
        if (scheduleTime < now) continue;
        this.scheduleBass(scheduleTime, bassNotes[i], beatDuration * 0.8);
      }
    }

    // メロディ（ペンタトニック・スケール）
    const melodyPattern = [
      523.25, 0, 587.33, 0, 659.25, 0, 783.99, 0,  // C5,D5,E5,G5
      783.99, 0, 659.25, 0, 587.33, 523.25, 0, 0,   // G5,E5,D5,C5
      440.00, 0, 523.25, 0, 587.33, 0, 523.25, 0,   // A4,C5,D5,C5
      659.25, 0, 587.33, 0, 523.25, 0, 440.00, 0,   // E5,D5,C5,A4
    ];

    for (let repeat = 0; repeat < Math.ceil(totalBeats / melodyPattern.length); repeat++) {
      for (let i = 0; i < melodyPattern.length; i++) {
        const beatIndex = repeat * melodyPattern.length + i;
        const beatTime = beatIndex * beatDuration / 2; // 8分音符
        if (beatTime < offset || beatTime > totalBeats * beatDuration) continue;
        const scheduleTime = now + beatTime - offset;
        if (scheduleTime < now) continue;

        const freq = melodyPattern[i];
        if (freq > 0) {
          this.scheduleMelody(scheduleTime, freq, beatDuration * 0.4);
        }
      }
    }
  }

  private scheduleKick(time: number): void {
    if (!this.context || !this.gainNode) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + 0.2);
    this.synthNodes.push(osc);
    this.synthGains.push(gain);
  }

  private scheduleHihat(time: number): void {
    if (!this.context || !this.gainNode) return;
    const bufferSize = this.context.sampleRate * 0.05;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    source.start(time);
    this.synthNodes.push(source);
    this.synthGains.push(gain);
  }

  private scheduleBass(time: number, freq: number, duration: number): void {
    if (!this.context || !this.gainNode) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.setValueAtTime(0.15, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + duration);
    this.synthNodes.push(osc);
    this.synthGains.push(gain);
  }

  private scheduleMelody(time: number, freq: number, duration: number): void {
    if (!this.context || !this.gainNode) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.06, time + 0.02);
    gain.gain.setValueAtTime(0.06, time + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + duration);
    this.synthNodes.push(osc);
    this.synthGains.push(gain);
  }

  private stopSynthBGM(): void {
    this.synthNodes.forEach(node => {
      try { node.stop(); } catch { /* already stopped */ }
      try { node.disconnect(); } catch { /* already disconnected */ }
    });
    this.synthGains.forEach(gain => {
      try { gain.disconnect(); } catch { /* already disconnected */ }
    });
    this.synthTimers.forEach(id => clearTimeout(id));
    this.synthNodes = [];
    this.synthGains = [];
    this.synthTimers = [];
  }

  /**
   * 判定SE合成再生
   */
  playSynthJudgmentSE(judgment: JudgmentType): void {
    if (!this.context || !this.seGainNode) return;

    const now = this.context.currentTime;

    switch (judgment) {
      case 'PERFECT': {
        // 高音の和音
        const freqs = [880, 1108.73, 1318.51]; // A5, C#6, E6
        freqs.forEach(freq => {
          const osc = this.context!.createOscillator();
          const gain = this.context!.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(gain);
          gain.connect(this.seGainNode!);
          osc.start(now);
          osc.stop(now + 0.3);
        });
        break;
      }
      case 'GREAT': {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.seGainNode);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case 'GOOD': {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.seGainNode);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'MISS': {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.seGainNode);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
    }
  }

  stop(): void {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
      } catch {
        // 既に停止している場合は無視
      }
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
    this.stopSynthBGM();
    this.isPlaying = false;
  }

  getCurrentTime(): number {
    if (!this.context || !this.isPlaying) {
      return 0;
    }
    return this.context.currentTime - this.startTime;
  }

  getRawTime(): number {
    return this.context?.currentTime ?? 0;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setSEVolume(volume: number): void {
    if (this.seGainNode) {
      this.seGainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  async playSE(url: string): Promise<void> {
    if (!this.context || !this.seGainNode) {
      console.warn('AudioEngine not initialized');
      return;
    }

    try {
      let buffer = this.seCache.get(url);

      if (!buffer) {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`SE not found: ${url}`);
          return;
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = await this.context.decodeAudioData(arrayBuffer);
        this.seCache.set(url, buffer);
      }

      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.seGainNode);
      source.start();
    } catch (error) {
      console.warn('Failed to play SE:', error);
    }
  }

  dispose(): void {
    this.stop();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.bgmBuffer = null;
    this.gainNode = null;
    this.seGainNode = null;
    this.seCache.clear();
  }
}
