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
  private seGainNode: GainNode | null = null;  // SE用ゲインノード
  private seCache: Map<string, AudioBuffer> = new Map();  // SEキャッシュ
  private startTime: number = 0; // ゲーム開始時のAudioContext時刻
  private isPlaying: boolean = false;

  /**
   * AudioContextを初期化
   * ユーザーインタラクション後に呼び出す必要がある
   */
  async init(): Promise<void> {
    if (this.context) return;

    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);

    // SE用ゲインノード
    this.seGainNode = this.context.createGain();
    this.seGainNode.connect(this.context.destination);

    // サスペンド状態の場合はレジューム
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * BGMファイルを読み込み
   */
  async loadBGM(url: string): Promise<boolean> {
    if (!this.context) {
      console.error('AudioEngine not initialized');
      return false;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`BGM not found: ${url}`);
        return false;
      }
      const arrayBuffer = await response.arrayBuffer();
      this.bgmBuffer = await this.context.decodeAudioData(arrayBuffer);
      return true;
    } catch (error) {
      console.warn('Failed to load BGM:', error);
      return false;
    }
  }

  /**
   * BGMを再生開始
   * @param offset 開始位置のオフセット（秒）
   */
  play(offset: number = 0): void {
    if (!this.context || !this.gainNode) {
      console.error('AudioEngine not initialized');
      return;
    }

    // 既存のソースを停止
    this.stop();

    // ゲーム開始時刻を記録
    this.startTime = this.context.currentTime - offset;
    this.isPlaying = true;

    // BGMがある場合は再生
    if (this.bgmBuffer) {
      this.bgmSource = this.context.createBufferSource();
      this.bgmSource.buffer = this.bgmBuffer;
      this.bgmSource.connect(this.gainNode);
      this.bgmSource.start(0, offset);

      this.bgmSource.onended = () => {
        this.isPlaying = false;
      };
    }
  }

  /**
   * 再生を停止
   */
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
    this.isPlaying = false;
  }

  /**
   * 現在のゲーム時刻を取得（秒）
   * これがゲーム全体のマスタークロック
   */
  getCurrentTime(): number {
    if (!this.context || !this.isPlaying) {
      return 0;
    }
    return this.context.currentTime - this.startTime;
  }

  /**
   * AudioContextの生の現在時刻を取得
   */
  getRawTime(): number {
    return this.context?.currentTime ?? 0;
  }

  /**
   * 再生中かどうか
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 音量を設定（0.0 ~ 1.0）
   */
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * SE音量を設定（0.0 ~ 1.0）
   */
  setSEVolume(volume: number): void {
    if (this.seGainNode) {
      this.seGainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * SEを再生
   * @param url SE音声ファイルのURL
   */
  async playSE(url: string): Promise<void> {
    if (!this.context || !this.seGainNode) {
      console.warn('AudioEngine not initialized');
      return;
    }

    try {
      // キャッシュを確認
      let buffer = this.seCache.get(url);

      if (!buffer) {
        // キャッシュにない場合は読み込み
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`SE not found: ${url}`);
          return;
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = await this.context.decodeAudioData(arrayBuffer);
        this.seCache.set(url, buffer);
      }

      // 再生
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.seGainNode);
      source.start();
    } catch (error) {
      console.warn('Failed to play SE:', error);
    }
  }

  /**
   * リソースを解放
   */
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
