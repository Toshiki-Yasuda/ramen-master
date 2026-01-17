import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { AudioEngine } from './AudioEngine';
import { NoteManager } from './NoteManager';
import type { Beatmap, JudgmentType, ScoreData } from '../types';

// 和風×モダン カラーパレット
const COLORS = {
  // 背景グラデーション
  BG_DARK: 0x1a0f0a,
  BG_LIGHT: 0x2d1f15,

  // アクセントカラー
  GOLD: 0xd4af37,
  VERMILION: 0xc94a4a,  // 朱色
  CREAM: 0xfff8e7,      // クリーム

  // ノーツ（麺色）
  NOODLE: 0xffecd2,
  NOODLE_STROKE: 0xe8d4b8,

  // 箸（判定ライン）
  CHOPSTICK: 0x8b4513,
  CHOPSTICK_HIGHLIGHT: 0xa0522d,

  // 湯気
  STEAM: 0xffffff,
} as const;

// ゲーム設定
const GAME_CONFIG = {
  JUDGE_LINE_X: 180,
  NOTE_SPEED: 450,
  NOTE_WIDTH: 80,
  NOTE_HEIGHT: 16,
  CHOPSTICK_WIDTH: 6,
  CHOPSTICK_GAP: 40,
} as const;

// 判定エフェクトの色
const JUDGMENT_COLORS: Record<JudgmentType, number> = {
  PERFECT: 0xffd700,
  GREAT: 0x7cfc00,
  GOOD: 0x87ceeb,
  MISS: 0xff6b6b,
};

// 判定の日本語表記
const JUDGMENT_TEXT: Record<JudgmentType, string> = {
  PERFECT: '極',
  GREAT: '良',
  GOOD: '可',
  MISS: '失',
};

// パーティクル（湯気・エフェクト）
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  scale: number;
  life: number;
  graphic: Graphics;
}

/**
 * GameEngine - 和風×モダン PixiJSゲームエンジン
 */
export class GameEngine {
  private app: Application | null = null;
  private audioEngine: AudioEngine;
  private noteManager: NoteManager;

  // PixiJS コンテナ
  private gameContainer: Container | null = null;
  private bgContainer: Container | null = null;
  private notesContainer: Container | null = null;
  private effectsContainer: Container | null = null;
  private uiContainer: Container | null = null;

  // UI要素
  private chopsticks: Graphics | null = null;
  private judgmentText: Text | null = null;
  private judgmentSubText: Text | null = null;
  private scoreText: Text | null = null;
  private comboText: Text | null = null;

  // パーティクルシステム
  private steamParticles: Particle[] = [];
  private hitParticles: Particle[] = [];

  // ゲーム状態
  private isRunning: boolean = false;
  private beatmap: Beatmap | null = null;
  private noteGraphics: Map<number, Graphics> = new Map();

  // コールバック
  private onScoreUpdate: ((judgment: JudgmentType) => void) | null = null;
  private onGameEnd: (() => void) | null = null;

  constructor() {
    this.audioEngine = new AudioEngine();
    this.noteManager = new NoteManager();
  }

  /**
   * ゲームエンジンを初期化
   */
  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      backgroundColor: COLORS.BG_DARK,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    await this.audioEngine.init();
    this.setupContainers();
    this.setupBackground();
    this.setupUI();
  }

  /**
   * コンテナをセットアップ
   */
  private setupContainers(): void {
    if (!this.app) return;

    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);

    // 背景
    this.bgContainer = new Container();
    this.gameContainer.addChild(this.bgContainer);

    // ノーツ
    this.notesContainer = new Container();
    this.gameContainer.addChild(this.notesContainer);

    // エフェクト
    this.effectsContainer = new Container();
    this.gameContainer.addChild(this.effectsContainer);

    // UI（最前面）
    this.uiContainer = new Container();
    this.gameContainer.addChild(this.uiContainer);
  }

  /**
   * 背景をセットアップ（グラデーション + 装飾）
   */
  private setupBackground(): void {
    if (!this.app || !this.bgContainer) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // グラデーション背景
    const bg = new Graphics();

    // 上から下へのグラデーション風（複数の矩形で表現）
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const color = this.lerpColor(COLORS.BG_LIGHT, COLORS.BG_DARK, t);
      const y = (height / steps) * i;
      bg.rect(0, y, width, height / steps + 1).fill(color);
    }
    this.bgContainer.addChild(bg);

    // 装飾：下部に暖かいグロー
    const glow = new Graphics();
    glow.circle(width / 2, height + 100, 300).fill({ color: COLORS.VERMILION, alpha: 0.08 });
    this.bgContainer.addChild(glow);

    // 縦のアクセントライン（和紙の継ぎ目風）
    for (let i = 1; i < 4; i++) {
      const line = new Graphics();
      const x = (width / 4) * i;
      line.rect(x, 0, 1, height).fill({ color: COLORS.CREAM, alpha: 0.03 });
      this.bgContainer.addChild(line);
    }
  }

  /**
   * UI要素をセットアップ
   */
  private setupUI(): void {
    if (!this.app || !this.uiContainer || !this.effectsContainer) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // 箸（判定ライン）- 2本のライン
    this.chopsticks = new Graphics();
    this.drawChopsticks();
    this.uiContainer.addChild(this.chopsticks);

    // 判定テキスト（日本語）
    const judgmentStyle = new TextStyle({
      fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
      fontSize: 72,
      fontWeight: 'bold',
      fill: COLORS.GOLD,
      stroke: { color: 0x000000, width: 3 },
      dropShadow: {
        color: 0x000000,
        blur: 8,
        distance: 0,
        alpha: 0.5,
      },
    });
    this.judgmentText = new Text({ text: '', style: judgmentStyle });
    this.judgmentText.anchor.set(0.5);
    this.judgmentText.x = width / 2;
    this.judgmentText.y = height / 2 - 20;
    this.judgmentText.alpha = 0;
    this.effectsContainer.addChild(this.judgmentText);

    // 判定サブテキスト（英語）
    const subStyle = new TextStyle({
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 18,
      fontWeight: '300',
      fill: COLORS.CREAM,
      letterSpacing: 4,
    });
    this.judgmentSubText = new Text({ text: '', style: subStyle });
    this.judgmentSubText.anchor.set(0.5);
    this.judgmentSubText.x = width / 2;
    this.judgmentSubText.y = height / 2 + 30;
    this.judgmentSubText.alpha = 0;
    this.effectsContainer.addChild(this.judgmentSubText);

    // スコアテキスト
    const scoreStyle = new TextStyle({
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 28,
      fontWeight: '200',
      fill: COLORS.CREAM,
      letterSpacing: 2,
    });
    this.scoreText = new Text({ text: '0', style: scoreStyle });
    this.scoreText.x = 30;
    this.scoreText.y = 30;
    this.uiContainer.addChild(this.scoreText);

    // スコアラベル
    const labelStyle = new TextStyle({
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 11,
      fontWeight: '400',
      fill: COLORS.GOLD,
      letterSpacing: 3,
    });
    const scoreLabel = new Text({ text: 'SCORE', style: labelStyle });
    scoreLabel.x = 30;
    scoreLabel.y = 14;
    this.uiContainer.addChild(scoreLabel);

    // コンボテキスト
    const comboStyle = new TextStyle({
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 48,
      fontWeight: '100',
      fill: COLORS.GOLD,
    });
    this.comboText = new Text({ text: '', style: comboStyle });
    this.comboText.anchor.set(0.5);
    this.comboText.x = width / 2;
    this.comboText.y = height - 80;
    this.uiContainer.addChild(this.comboText);
  }

  /**
   * 箸を描画
   */
  private drawChopsticks(): void {
    if (!this.chopsticks || !this.app) return;

    const height = this.app.screen.height;
    const x = GAME_CONFIG.JUDGE_LINE_X;
    const gap = GAME_CONFIG.CHOPSTICK_GAP;
    const w = GAME_CONFIG.CHOPSTICK_WIDTH;

    this.chopsticks.clear();

    // 左の箸
    this.chopsticks
      .roundRect(x - gap / 2 - w, 0, w, height, w / 2)
      .fill(COLORS.CHOPSTICK);

    // 左の箸ハイライト
    this.chopsticks
      .roundRect(x - gap / 2 - w + 1, 0, 2, height, 1)
      .fill({ color: COLORS.CHOPSTICK_HIGHLIGHT, alpha: 0.6 });

    // 右の箸
    this.chopsticks
      .roundRect(x + gap / 2, 0, w, height, w / 2)
      .fill(COLORS.CHOPSTICK);

    // 右の箸ハイライト
    this.chopsticks
      .roundRect(x + gap / 2 + 1, 0, 2, height, 1)
      .fill({ color: COLORS.CHOPSTICK_HIGHLIGHT, alpha: 0.6 });
  }

  /**
   * 譜面を読み込んでゲームを準備
   */
  async loadBeatmap(beatmap: Beatmap): Promise<void> {
    this.beatmap = beatmap;
    this.noteManager.loadBeatmap(beatmap);

    const bgmUrl = `/ramen-master${beatmap.audio.bgm}`;
    await this.audioEngine.loadBGM(bgmUrl);
  }

  /**
   * ゲームを開始
   */
  start(): void {
    if (!this.app || !this.beatmap) return;

    this.isRunning = true;
    this.noteManager.reset();
    this.noteGraphics.clear();
    this.steamParticles = [];
    this.hitParticles = [];

    if (this.notesContainer) {
      this.notesContainer.removeChildren();
    }
    if (this.effectsContainer) {
      // 判定テキストは残す
      this.effectsContainer.children.forEach((child) => {
        if (child !== this.judgmentText && child !== this.judgmentSubText) {
          if (child instanceof Graphics) {
            child.destroy();
          }
        }
      });
    }

    this.audioEngine.play(this.beatmap.meta.offset);
    this.app.ticker.add(this.gameLoop);
  }

  /**
   * ゲームを停止
   */
  stop(): void {
    this.isRunning = false;
    this.audioEngine.stop();

    if (this.app?.ticker) {
      this.app.ticker.remove(this.gameLoop);
    }
  }

  /**
   * メインゲームループ
   */
  private gameLoop = (): void => {
    if (!this.isRunning || !this.app) return;

    const currentTime = this.audioEngine.getCurrentTime();
    this.updateNotes(currentTime);
    this.updateParticles();
    this.spawnSteamParticle();
    this.checkMissedNotes(currentTime);
    this.checkGameEnd(currentTime);
  };

  /**
   * ノーツの位置を更新・描画
   */
  private updateNotes(currentTime: number): void {
    if (!this.notesContainer || !this.app) return;

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const noteY = screenHeight / 2 - GAME_CONFIG.NOTE_HEIGHT / 2;

    this.noteManager.getNotes().forEach((note, index) => {
      if (note.hit) {
        const graphic = this.noteGraphics.get(index);
        if (graphic) {
          graphic.visible = false;
        }
        return;
      }

      const timeDiff = note.t - currentTime;
      const noteX = GAME_CONFIG.JUDGE_LINE_X + timeDiff * GAME_CONFIG.NOTE_SPEED;

      if (noteX > screenWidth + GAME_CONFIG.NOTE_WIDTH || noteX < -GAME_CONFIG.NOTE_WIDTH) {
        const graphic = this.noteGraphics.get(index);
        if (graphic) {
          graphic.visible = false;
        }
        return;
      }

      let graphic = this.noteGraphics.get(index);
      if (!graphic && this.notesContainer) {
        graphic = this.createNoteGraphic();
        this.notesContainer.addChild(graphic);
        this.noteGraphics.set(index, graphic);
      }

      if (!graphic) return;

      graphic.visible = true;
      graphic.x = noteX - GAME_CONFIG.NOTE_WIDTH / 2;
      graphic.y = noteY;

      // 判定ラインに近づくにつれて光る
      const distance = Math.abs(noteX - GAME_CONFIG.JUDGE_LINE_X);
      const glowIntensity = Math.max(0, 1 - distance / 200);
      graphic.alpha = 0.8 + glowIntensity * 0.2;
    });
  }

  /**
   * 麺風ノーツを作成
   */
  private createNoteGraphic(): Graphics {
    const g = new Graphics();
    const w = GAME_CONFIG.NOTE_WIDTH;
    const h = GAME_CONFIG.NOTE_HEIGHT;

    // メインの麺
    g.roundRect(0, 0, w, h, h / 2).fill(COLORS.NOODLE);

    // 光沢
    g.roundRect(4, 2, w - 8, h / 3, h / 4).fill({ color: 0xffffff, alpha: 0.4 });

    // 輪郭
    g.roundRect(0, 0, w, h, h / 2).stroke({ color: COLORS.NOODLE_STROKE, width: 1 });

    return g;
  }

  /**
   * 湯気パーティクルを生成
   */
  private spawnSteamParticle(): void {
    if (!this.app || !this.effectsContainer || Math.random() > 0.15) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    const g = new Graphics();
    g.circle(0, 0, 3 + Math.random() * 4).fill({ color: COLORS.STEAM, alpha: 0.1 });
    this.effectsContainer.addChild(g);

    this.steamParticles.push({
      x: Math.random() * width,
      y: height + 20,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -1 - Math.random() * 1.5,
      alpha: 0.1 + Math.random() * 0.1,
      scale: 0.5 + Math.random() * 0.5,
      life: 1,
      graphic: g,
    });
  }

  /**
   * ヒットパーティクルを生成
   */
  private spawnHitParticles(x: number, y: number, color: number): void {
    if (!this.effectsContainer) return;

    for (let i = 0; i < 12; i++) {
      const g = new Graphics();
      g.circle(0, 0, 2 + Math.random() * 3).fill({ color, alpha: 0.8 });
      this.effectsContainer.addChild(g);

      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;

      this.hitParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        scale: 1,
        life: 1,
        graphic: g,
      });
    }
  }

  /**
   * パーティクルを更新
   */
  private updateParticles(): void {
    // 湯気
    this.steamParticles = this.steamParticles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.005;
      p.alpha *= 0.995;
      p.scale *= 1.005;

      p.graphic.x = p.x;
      p.graphic.y = p.y;
      p.graphic.alpha = p.alpha;
      p.graphic.scale.set(p.scale);

      if (p.life <= 0 || p.y < -50) {
        p.graphic.destroy();
        return false;
      }
      return true;
    });

    // ヒットエフェクト
    this.hitParticles = this.hitParticles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // 重力
      p.life -= 0.03;
      p.alpha = p.life;

      p.graphic.x = p.x;
      p.graphic.y = p.y;
      p.graphic.alpha = p.alpha;

      if (p.life <= 0) {
        p.graphic.destroy();
        return false;
      }
      return true;
    });
  }

  /**
   * 見逃したノーツをチェック
   */
  private checkMissedNotes(currentTime: number): void {
    const missedNotes = this.noteManager.checkMissedNotes(currentTime);
    missedNotes.forEach(() => {
      this.showJudgment('MISS');
      this.onScoreUpdate?.('MISS');
    });
  }

  /**
   * ゲーム終了をチェック
   */
  private checkGameEnd(currentTime: number): void {
    if (!this.beatmap) return;

    const lastNoteTime = this.beatmap.notes[this.beatmap.notes.length - 1]?.t ?? 0;
    const isAfterLastNote = currentTime > lastNoteTime + 2;

    if (this.noteManager.isAllNotesProcessed() && isAfterLastNote) {
      if (!this.isRunning) return;

      setTimeout(() => {
        this.stop();
        this.onGameEnd?.();
      }, 500);
    }
  }

  /**
   * プレイヤー入力を処理
   */
  handleInput(): void {
    if (!this.isRunning || !this.app) return;

    const currentTime = this.audioEngine.getCurrentTime();
    const judgment = this.noteManager.judge(currentTime);

    if (judgment) {
      this.showJudgment(judgment);
      this.onScoreUpdate?.(judgment);

      // ヒットパーティクル
      if (judgment !== 'MISS') {
        const y = this.app.screen.height / 2;
        this.spawnHitParticles(GAME_CONFIG.JUDGE_LINE_X, y, JUDGMENT_COLORS[judgment]);
      }
    }
  }

  /**
   * 判定エフェクトを表示
   */
  private showJudgment(judgment: JudgmentType): void {
    if (!this.judgmentText || !this.judgmentSubText) return;

    // 日本語テキスト
    this.judgmentText.text = JUDGMENT_TEXT[judgment];
    this.judgmentText.style.fill = JUDGMENT_COLORS[judgment];
    this.judgmentText.alpha = 1;
    this.judgmentText.scale.set(1.3);

    // 英語テキスト
    this.judgmentSubText.text = judgment;
    this.judgmentSubText.style.fill = JUDGMENT_COLORS[judgment];
    this.judgmentSubText.alpha = 0.8;

    // フェードアウトアニメーション
    const fadeOut = () => {
      if (!this.judgmentText || !this.judgmentSubText) return;
      this.judgmentText.alpha -= 0.04;
      this.judgmentSubText.alpha -= 0.04;
      this.judgmentText.scale.set(this.judgmentText.scale.x * 0.97);
      if (this.judgmentText.alpha > 0) {
        requestAnimationFrame(fadeOut);
      }
    };
    setTimeout(fadeOut, 150);
  }

  /**
   * スコア表示を更新
   */
  updateScore(score: number, combo: number): void {
    if (this.scoreText) {
      this.scoreText.text = score.toLocaleString();
    }
    if (this.comboText) {
      if (combo > 0) {
        this.comboText.text = `${combo}`;
        this.comboText.scale.set(1 + Math.min(combo, 50) * 0.005);
      } else {
        this.comboText.text = '';
      }
    }
  }

  /**
   * コールバックを設定
   */
  setCallbacks(
    onScoreUpdate: (judgment: JudgmentType) => void,
    onGameEnd: () => void
  ): void {
    this.onScoreUpdate = onScoreUpdate;
    this.onGameEnd = onGameEnd;
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    this.stop();
    this.audioEngine.dispose();

    // パーティクルをクリーンアップ
    this.steamParticles.forEach((p) => p.graphic.destroy());
    this.hitParticles.forEach((p) => p.graphic.destroy());
    this.steamParticles = [];
    this.hitParticles = [];

    const app = this.app;
    this.app = null;
    this.gameContainer = null;
    this.bgContainer = null;
    this.notesContainer = null;
    this.effectsContainer = null;
    this.uiContainer = null;
    this.chopsticks = null;
    this.judgmentText = null;
    this.judgmentSubText = null;
    this.scoreText = null;
    this.comboText = null;
    this.noteGraphics.clear();

    if (app) {
      try {
        app.destroy(true);
      } catch (e) {
        console.warn('App already destroyed:', e);
      }
    }
  }

  /**
   * スコアデータを取得
   */
  getScoreData(): ScoreData {
    return this.noteManager.getScoreData();
  }

  /**
   * 色を補間
   */
  private lerpColor(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }
}
